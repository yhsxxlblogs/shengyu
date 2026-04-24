const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const https = require('https');
const config = require('../config');
const { authenticateToken } = require('../middleware/security');

/**
 * 使用原生 https 模块发送 GET 请求
 * @param {string} url - 请求URL
 * @returns {Promise<Object>} - 返回JSON数据
 */
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        console.log('httpsGet 请求:', url.replace(/secret=[^&]+/, 'secret=***'));
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('httpsGet 响应状态:', res.statusCode);
                console.log('httpsGet 响应数据:', data.substring(0, 200));
                
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (e) {
                    console.error('解析响应数据失败:', e.message);
                    console.error('原始数据:', data);
                    reject(new Error('解析微信API响应失败'));
                }
            });
        }).on('error', (err) => {
            console.error('httpsGet 请求失败:', err.message);
            console.error('错误代码:', err.code);
            reject(new Error(`微信API请求失败: ${err.message}`));
        }).on('timeout', () => {
            console.error('httpsGet 请求超时');
            reject(new Error('微信API请求超时'));
        });
    });
}

/**
 * 微信登录功能
 * 已配置微信开放平台参数
 */

// 微信开放平台配置（从配置文件读取）
const WECHAT_CONFIG = {
    appId: config.wechat.appId,
    appSecret: config.wechat.appSecret,
};

// 检查微信配置是否完整
const isWechatConfigValid = () => {
    return WECHAT_CONFIG.appId && WECHAT_CONFIG.appSecret;
};

/**
 * @route POST /api/wechat/login
 * @desc 微信登录 - 支持智能账号关联
 * @access Public
 */
router.post('/login', async (req, res) => {
    try {
        // 检查微信配置
        console.log('微信配置检查:', { 
            appId: WECHAT_CONFIG.appId, 
            hasAppId: !!WECHAT_CONFIG.appId,
            hasAppSecret: !!WECHAT_CONFIG.appSecret 
        });
        
        if (!isWechatConfigValid()) {
            console.error('微信配置无效');
            return res.status(503).json({ 
                error: '微信登录未配置',
                message: '服务器未配置微信登录功能，请联系管理员'
            });
        }

        const { code, userInfo, bindToken } = req.body;

        if (!code) {
            return res.status(400).json({ error: '缺少微信授权码' });
        }

        console.log('微信登录请求:', { code, hasBindToken: !!bindToken });

        // 1. 使用 code 换取 access_token 和 openid
        const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_CONFIG.appId}&secret=${WECHAT_CONFIG.appSecret}&code=${code}&grant_type=authorization_code`;
        
        const tokenRes = await httpsGet(tokenUrl);
        console.log('微信 token 响应:', tokenRes);

        if (tokenRes.errcode) {
            console.error('微信授权失败:', tokenRes.errcode, tokenRes.errmsg);
            return res.status(400).json({ 
                error: '微信授权失败', 
                message: tokenRes.errmsg,
                errcode: tokenRes.errcode
            });
        }

        const { access_token, openid, unionid } = tokenRes;

        // 2. 使用 access_token 获取用户信息
        let wechatUserInfo = null;
        try {
            const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;
            const userRes = await httpsGet(userInfoUrl);
            console.log('微信用户信息:', userRes);
            
            if (!userRes.errcode) {
                wechatUserInfo = userRes;
            }
        } catch (e) {
            console.log('获取微信用户信息失败，使用前端传入的信息:', e.message);
        }

        // 3. 根据 openid 查询用户
        const [existingWechatUsers] = await db.promiseQuery(
            'SELECT * FROM users WHERE wechat_openid = ?',
            [openid]
        );

        let user;
        let isNewUser = false;
        let needBind = false;

        if (existingWechatUsers.length > 0) {
            // 已存在微信用户，直接登录
            user = existingWechatUsers[0];
            
            // 检查用户是否被禁用
            if (user.is_active === 0) {
                return res.status(403).json({ error: '账号已被禁用，请联系管理员' });
            }
            
            // 更新微信信息
            if (wechatUserInfo) {
                await db.promiseQuery(
                    `UPDATE users SET 
                        wechat_nickname = ?, 
                        wechat_avatar = ?,
                        wechat_unionid = ?,
                        updated_at = NOW()
                    WHERE id = ?`,
                    [
                        wechatUserInfo.nickname || userInfo?.nickName || user.wechat_nickname,
                        wechatUserInfo.headimgurl || userInfo?.avatarUrl || user.wechat_avatar,
                        unionid || wechatUserInfo.unionid || user.wechat_unionid,
                        user.id
                    ]
                );
            }
        } else {
            // 新微信用户，创建账号
            // 注意：如果用户已有账号密码账号，可以在个人中心绑定微信
            // 这里不自动检测和绑定，避免安全风险
            isNewUser = true;
            const nickname = wechatUserInfo?.nickname || userInfo?.nickName || `微信用户${openid.slice(-6)}`;
            const avatar = wechatUserInfo?.headimgurl || userInfo?.avatarUrl || null;
            
            const [result] = await db.promiseQuery(
                `INSERT INTO users (
                    username, 
                    nickname, 
                    avatar, 
                    wechat_openid, 
                    wechat_unionid,
                    wechat_nickname,
                    wechat_avatar,
                    login_type,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'wechat', NOW(), NOW())`,
                [
                    `wx_${openid.slice(-8)}`,
                    nickname,
                    avatar,
                    openid,
                    unionid || wechatUserInfo?.unionid || null,
                    wechatUserInfo?.nickname || userInfo?.nickName || null,
                    wechatUserInfo?.headimgurl || userInfo?.avatarUrl || null
                ]
            );

            // 获取新创建的用户
            const [newUsers] = await db.promiseQuery(
                'SELECT * FROM users WHERE id = ?',
                [result.insertId]
            );
            user = newUsers[0];
        }

        // 4. 生成 JWT token（包含 is_admin 字段以兼容管理员验证）
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                openid: openid,
                is_admin: user.is_admin || false
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        // 5. 返回用户信息（排除敏感字段）
        const userResponse = {
            id: user.id,
            username: user.username,
            nickname: user.nickname || user.wechat_nickname,
            avatar: user.avatar || user.wechat_avatar,
            email: user.email,
            bio: user.bio,
            isNewUser: isNewUser,
            loginType: 'wechat',
            login_type: 'wechat',
            wechat_openid: user.wechat_openid,
            wechat_nickname: user.wechat_nickname,
            wechat_avatar: user.wechat_avatar
        };

        console.log('微信登录成功:', { userId: user.id, isNewUser, needBind });

        res.json({
            success: true,
            token: token,
            user: userResponse,
            message: isNewUser ? '欢迎新用户！' : '登录成功'
        });

    } catch (error) {
        console.error('微信登录错误:', error);
        console.error('错误堆栈:', error.stack);
        
        // 区分不同类型的错误
        let errorType = '服务器错误';
        let statusCode = 500;
        
        if (error.message && error.message.includes('微信')) {
            errorType = '微信API错误';
            statusCode = 400;
        } else if (error.message && error.message.includes('数据库')) {
            errorType = '数据库错误';
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            errorType = '网络连接错误';
            statusCode = 503;
        }
        
        res.status(statusCode).json({ 
            error: errorType,
            message: error.message,
            code: error.code || 'UNKNOWN'
        });
    }
});

/**
 * @route POST /api/wechat/bind
 * @desc 绑定微信账号到现有用户
 * @access Private
 */
router.post('/bind', authenticateToken, async (req, res) => {
    try {
        // 检查微信配置
        if (!isWechatConfigValid()) {
            return res.status(503).json({ 
                error: '微信登录未配置',
                message: '服务器未配置微信登录功能'
            });
        }

        const { code } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        if (!code) {
            return res.status(400).json({ error: '缺少微信授权码' });
        }

        console.log('绑定微信请求:', { userId, code });

        // 1. 使用 code 换取 access_token 和 openid
        const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_CONFIG.appId}&secret=${WECHAT_CONFIG.appSecret}&code=${code}&grant_type=authorization_code`;
        
        const tokenRes = await httpsGet(tokenUrl);
        console.log('微信 token 响应:', tokenRes);

        if (tokenRes.errcode) {
            return res.status(400).json({ 
                error: '微信授权失败', 
                message: tokenRes.errmsg 
            });
        }

        const { access_token, openid, unionid } = tokenRes;

        // 2. 检查该微信是否已被其他用户绑定
        const [existingWechatUsers] = await db.promiseQuery(
            'SELECT * FROM users WHERE wechat_openid = ? AND id != ?',
            [openid, userId]
        );

        if (existingWechatUsers.length > 0) {
            return res.status(400).json({ 
                error: '该微信已被其他账号绑定',
                message: '请使用其他微信账号或先解绑原账号'
            });
        }

        // 3. 获取微信用户信息
        let wechatUserInfo = null;
        try {
            const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;
            const userRes = await httpsGet(userInfoUrl);
            if (!userRes.errcode) {
                wechatUserInfo = userRes;
            }
        } catch (e) {
            console.log('获取微信用户信息失败:', e.message);
        }

        // 4. 更新当前用户的微信信息
        await db.promiseQuery(
            `UPDATE users SET 
                wechat_openid = ?,
                wechat_unionid = ?,
                wechat_nickname = ?, 
                wechat_avatar = ?,
                updated_at = NOW()
            WHERE id = ?`,
            [
                openid,
                unionid || wechatUserInfo?.unionid || null,
                wechatUserInfo?.nickname || null,
                wechatUserInfo?.headimgurl || null,
                userId
            ]
        );

        console.log('微信绑定成功:', { userId, openid });

        res.json({
            success: true,
            message: '微信绑定成功',
            wechatInfo: {
                nickname: wechatUserInfo?.nickname,
                avatar: wechatUserInfo?.headimgurl
            }
        });

    } catch (error) {
        console.error('微信绑定错误:', error);
        res.status(500).json({ 
            error: '服务器错误',
            message: error.message 
        });
    }
});

/**
 * @route GET /api/wechat/config
 * @desc 获取微信配置（前端用）
 * @access Public
 */
router.get('/config', (req, res) => {
    // 检查微信配置是否完整
    if (!isWechatConfigValid()) {
        return res.json({
            enabled: false,
            message: '微信登录未配置'
        });
    }
    
    // 只返回 AppID，AppSecret 不暴露
    res.json({
        appId: WECHAT_CONFIG.appId,
        enabled: true
    });
});

/**
 * @route POST /api/wechat/unbind
 * @desc 解绑微信账号
 * @access Private
 */
router.post('/unbind', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        // 检查用户是否有密码，确保解绑后还能登录
        const [users] = await db.promiseQuery(
            'SELECT password FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }

        const user = users[0];

        // 如果没有密码，不允许解绑（否则无法登录）
        if (!user.password) {
            return res.status(400).json({ 
                error: '无法解绑',
                message: '您没有设置密码，解绑后将无法登录。请先设置密码。'
            });
        }

        // 清除微信绑定信息
        await db.promiseQuery(
            `UPDATE users SET 
                wechat_openid = NULL,
                wechat_unionid = NULL,
                wechat_nickname = NULL,
                wechat_avatar = NULL,
                updated_at = NOW()
            WHERE id = ?`,
            [userId]
        );

        console.log('微信解绑成功:', { userId });

        res.json({
            success: true,
            message: '微信解绑成功'
        });

    } catch (error) {
        console.error('微信解绑错误:', error);
        res.status(500).json({ 
            error: '服务器错误',
            message: error.message 
        });
    }
});

/**
 * @route GET /api/wechat/status
 * @desc 获取当前用户的微信绑定状态
 * @access Private
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: '未登录' });
        }

        const [users] = await db.promiseQuery(
            'SELECT wechat_openid, wechat_nickname, wechat_avatar FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: '用户不存在' });
        }

        const user = users[0];

        res.json({
            bound: !!user.wechat_openid,
            wechatInfo: user.wechat_openid ? {
                nickname: user.wechat_nickname,
                avatar: user.wechat_avatar
            } : null
        });

    } catch (error) {
        console.error('获取微信绑定状态错误:', error);
        res.status(500).json({ 
            error: '服务器错误',
            message: error.message 
        });
    }
});

module.exports = router;
