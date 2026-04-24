/**
 * 微信登录工具类
 * 基于 uni-app 的微信登录功能（空壳，待接入微信开放平台）
 * 文档参考：https://uniapp.dcloud.net.cn/tutorial/app-oauth-weixin.html
 */

const BASE_URL = 'http://shengyu.supersyh.xyz'
const API_BASE = `${BASE_URL}/api`

class WechatAuth {
    constructor() {
        this.appId = 'wx4e46471a06b5124c'
        this.enabled = true
    }

    /**
     * 初始化微信配置
     */
    async init() {
        // 微信已配置，直接启用
        this.enabled = true
    }

    /**
     * 检查微信登录是否可用
     */
    isAvailable() {
        return this.enabled && this.appId
    }

    /**
     * 微信登录
     */
    async login() {
        // 检查是否已配置
        if (!this.isAvailable()) {
            uni.showModal({
                title: '提示',
                content: '微信登录功能暂不可用',
                showCancel: false
            })
            return { success: false, message: '微信登录未配置' }
        }

        // 检查平台支持
        // #ifdef H5
        uni.showModal({
            title: '提示',
            content: 'H5端暂不支持微信登录，请使用账号密码登录',
            showCancel: false
        })
        return { success: false, message: 'H5端不支持微信登录' }
        // #endif

        // #ifndef APP-PLUS || MP-WEIXIN
        uni.showModal({
            title: '提示',
            content: '当前平台暂不支持微信登录，请使用账号密码登录',
            showCancel: false
        })
        return { success: false, message: '当前平台不支持微信登录' }
        // #endif

        try {
            // 1. 获取微信登录授权码（code）
            const loginRes = await uni.login({
                provider: 'weixin'
            })

            console.log('微信登录响应:', loginRes)

            if (!loginRes.code) {
                throw new Error('获取微信授权码失败')
            }

            // 2. 获取用户信息（可选，需要用户授权）
            let userInfo = null
            try {
                const userRes = await uni.getUserInfo({
                    provider: 'weixin'
                })
                userInfo = userRes.userInfo
            } catch (e) {
                console.log('用户拒绝授权获取信息')
            }

            // 3. 发送 code 到后端换取 token
            const res = await uni.request({
                url: `${API_BASE}/api/wechat/login`,
                method: 'POST',
                data: {
                    code: loginRes.code,
                    userInfo: userInfo
                }
            })

            if (res.data.error) {
                throw new Error(res.data.error)
            }

            // 4. 保存 token
            if (res.data.token) {
                uni.setStorageSync('token', res.data.token)
                uni.setStorageSync('userInfo', res.data.user)
                return { 
                    success: true, 
                    user: res.data.user,
                    isNewUser: res.data.user?.isNewUser || false
                }
            }

            return { success: false, message: '登录失败' }

        } catch (error) {
            console.error('微信登录错误:', error)
            uni.showToast({
                title: error.message || '登录失败',
                icon: 'none'
            })
            return { success: false, message: error.message }
        }
    }

    /**
     * 绑定微信到现有账号
     */
    async bindWechat() {
        if (!this.isAvailable()) {
            uni.showToast({
                title: '微信功能未配置',
                icon: 'none'
            })
            return { success: false }
        }

        try {
            const loginRes = await uni.login({
                provider: 'weixin'
            })

            const token = uni.getStorageSync('token')
            const res = await uni.request({
                url: `${API_BASE}/api/wechat/bind`,
                method: 'POST',
                header: {
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    code: loginRes.code
                }
            })

            if (res.data.error) {
                throw new Error(res.data.error)
            }

            uni.showToast({ title: '绑定成功', icon: 'success' })
            return { success: true, wechatInfo: res.data.wechatInfo }

        } catch (error) {
            console.error('绑定微信失败:', error)
            uni.showToast({
                title: error.message || '绑定失败',
                icon: 'none'
            })
            return { success: false, message: error.message }
        }
    }

    /**
     * 解绑微信账号
     */
    async unbindWechat() {
        try {
            const token = uni.getStorageSync('token')
            const res = await uni.request({
                url: `${API_BASE}/api/wechat/unbind`,
                method: 'POST',
                header: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (res.data.error) {
                throw new Error(res.data.error)
            }

            uni.showToast({ title: '解绑成功', icon: 'success' })
            return { success: true }

        } catch (error) {
            console.error('解绑微信失败:', error)
            uni.showToast({
                title: error.message || '解绑失败',
                icon: 'none'
            })
            return { success: false, message: error.message }
        }
    }

    /**
     * 检查是否已绑定微信
     */
    async checkBindStatus() {
        try {
            const token = uni.getStorageSync('token')
            if (!token) {
                return { bound: false }
            }

            const res = await uni.request({
                url: `${API_BASE}/api/wechat/status`,
                method: 'GET',
                header: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (res.data.error) {
                throw new Error(res.data.error)
            }

            return {
                bound: res.data.bound,
                wechatInfo: res.data.wechatInfo
            }

        } catch (error) {
            console.error('检查绑定状态失败:', error)
            return { bound: false }
        }
    }
}

// 导出单例
export const wechatAuth = new WechatAuth()

/**
 * 微信登录功能说明：
 * 
 * 【已实现功能】
 * 1. 微信一键登录 - 新用户自动创建账号
 * 2. 账号绑定 - 已有账号密码用户可在个人中心绑定微信
 * 3. 账号解绑 - 已绑定用户可解绑微信（需先设置密码）
 * 4. 双登录方式 - 绑定后可用微信或账号密码登录同一账号
 * 
 * 【用户场景】
 * 场景1：新用户微信登录
 *    - 直接创建新账号，自动生成 wx_ 开头的用户名
 *    - 提示用户可以在个人中心绑定已有账号
 * 
 * 场景2：已有账号密码用户绑定微信
 *    - 登录后进入个人中心
 *    - 点击"绑定微信"按钮
 *    - 授权后实现微信登录同一账号
 * 
 * 场景3：解绑微信
 *    - 必须先设置密码才能解绑
 *    - 解绑后只能用账号密码登录
 * 
 * 【数据库字段】
 *    - wechat_openid: 微信用户唯一标识
 *    - wechat_unionid: 微信开放平台唯一标识
 *    - wechat_nickname: 微信昵称
 *    - wechat_avatar: 微信头像
 *    - login_type: 登录方式（password/wechat）
 *    - unionid: 微信开放平台唯一标识（多应用互通）
 *    - nickname: 微信昵称
 *    - avatar: 微信头像
 *    - gender: 性别
 *    - city/province/country: 地区信息
 */