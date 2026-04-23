const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

/**
 * 微信登录空壳功能
 * 后续接入微信开放平台后完善
 */

// TODO: 配置微信开放平台参数
const WECHAT_CONFIG = {
    appId: '',      // 微信开放平台 AppID
    appSecret: '',  // 微信开放平台 AppSecret（仅服务端使用）
};

/**
 * @route POST /api/wechat/login
 * @desc 微信登录（空壳）
 * @access Public
 */
router.post('/login', async (req, res) => {
    try {
        const { code, userInfo } = req.body;

        // TODO: 后续接入微信登录流程
        // 1. 使用 code 换取 access_token 和 openid
        // 2. 使用 access_token 获取用户信息
        // 3. 根据 openid 查询或创建用户
        // 4. 返回 JWT token

        console.log('微信登录请求:', { code, userInfo });

        // 空壳响应：提示功能待接入
        res.status(501).json({
            error: '微信登录功能待接入',
            message: '请先配置微信开放平台参数',
            todo: [
                '1. 在微信开放平台创建移动应用',
                '2. 获取 AppID 和 AppSecret',
                '3. 配置 WECHAT_CONFIG 参数',
                '4. 实现 code 换取 token 逻辑'
            ]
        });

    } catch (error) {
        console.error('微信登录错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

/**
 * @route POST /api/wechat/bind
 * @desc 绑定微信账号到现有用户（空壳）
 * @access Private
 */
router.post('/bind', async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id; // 需要认证中间件

        // TODO: 实现微信绑定逻辑
        console.log('绑定微信请求:', { userId, code });

        res.status(501).json({
            error: '微信绑定功能待接入',
            message: '请先配置微信开放平台参数'
        });

    } catch (error) {
        console.error('微信绑定错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

/**
 * @route GET /api/wechat/config
 * @desc 获取微信配置（前端用）
 * @access Public
 */
router.get('/config', (req, res) => {
    // 只返回 AppID，AppSecret 不暴露
    res.json({
        appId: WECHAT_CONFIG.appId || '',
        enabled: !!WECHAT_CONFIG.appId
    });
});

/**
 * TODO: 微信登录完整实现步骤
 * 
 * 1. 前端调用 uni.login({ provider: 'weixin' }) 获取 code
 * 2. 前端将 code 发送到后端 /api/wechat/login
 * 3. 后端使用 code + appid + secret 请求微信接口获取 access_token 和 openid
 *    URL: https://api.weixin.qq.com/sns/oauth2/access_token
 * 4. 使用 access_token + openid 获取用户信息
 *    URL: https://api.weixin.qq.com/sns/userinfo
 * 5. 根据 openid 查询数据库:
 *    - 存在: 更新用户信息，返回 token
 *    - 不存在: 创建新用户，返回 token
 * 6. 用户信息字段: openid, unionid, nickname, avatar, gender, city, province, country
 */

module.exports = router;