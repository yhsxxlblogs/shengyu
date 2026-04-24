/**
 * 微信登录工具类
 * 基于 uni-app 的微信登录功能
 * 文档参考：
 * - https://uniapp.dcloud.net.cn/tutorial/app-oauth-weixin.html
 * - https://developers.weixin.qq.com/doc/oplatform/Mobile_App/WeChat_Login/Development_Guide.html
 */

const BASE_URL = 'http://shengyu.supersyh.xyz'
const API_BASE = `${BASE_URL}`

class WechatAuth {
    constructor() {
        this.appId = 'wx4e46471a06b5124c'
        this.enabled = true
    }

    /**
     * 初始化微信配置
     */
    async init() {
        this.enabled = true
    }

    /**
     * 检查微信登录是否可用
     */
    isAvailable() {
        return this.enabled && this.appId
    }

    /**
     * 微信登录 - 使用 uni.login 标准 API
     * 这是 uni-app 推荐的方式，兼容性更好
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

        // #ifndef APP-PLUS
        uni.showModal({
            title: '提示',
            content: '当前平台暂不支持微信登录，请使用账号密码登录',
            showCancel: false
        })
        return { success: false, message: '当前平台不支持微信登录' }
        // #endif

        // #ifdef APP-PLUS
        try {
            // 使用 uni.login 标准 API
            const loginRes = await new Promise((resolve, reject) => {
                uni.login({
                    provider: 'weixin',
                    onlyAuthorize: true, // 仅获取授权code，不获取用户信息
                    success: (res) => {
                        console.log('uni.login 成功:', res)
                        resolve(res)
                    },
                    fail: (err) => {
                        console.error('uni.login 失败:', err)
                        reject(new Error(err.errMsg || '微信登录失败'))
                    }
                })
            })

            // 检查是否获取到 code
            if (!loginRes.code) {
                throw new Error('获取微信授权码失败')
            }

            console.log('获取到微信code:', loginRes.code)

            // 获取用户信息（可选）
            let userInfo = null
            try {
                const infoRes = await new Promise((resolve, reject) => {
                    uni.getUserInfo({
                        provider: 'weixin',
                        success: (res) => resolve(res),
                        fail: (err) => reject(err)
                    })
                })
                userInfo = infoRes.userInfo
                console.log('获取到微信用户信息:', userInfo)
            } catch (e) {
                console.log('获取微信用户信息失败（非必须）:', e.message)
            }

            // 发送 code 到后端换取 token
            const res = await uni.request({
                url: `${API_BASE}/api/wechat/login`,
                method: 'POST',
                data: {
                    code: loginRes.code,
                    userInfo: userInfo
                }
            })

            console.log('后端登录响应:', res.data)

            if (res.data.error) {
                throw new Error(res.data.error)
            }

            // 保存 token
            if (res.data.token) {
                uni.setStorageSync('token', res.data.token)
                uni.setStorageSync('userInfo', res.data.user)
                return { 
                    success: true, 
                    token: res.data.token,
                    user: res.data.user,
                    isNewUser: res.data.user?.isNewUser || false
                }
            }

            return { success: false, message: '登录失败' }

        } catch (error) {
            console.error('微信登录错误:', error)
            uni.showToast({
                title: error.message || '登录失败',
                icon: 'none',
                duration: 2000
            })
            return { success: false, message: error.message }
        }
        // #endif
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

        // #ifdef APP-PLUS
        try {
            // 使用 uni.login 获取 code
            const loginRes = await new Promise((resolve, reject) => {
                uni.login({
                    provider: 'weixin',
                    onlyAuthorize: true,
                    success: (res) => resolve(res),
                    fail: (err) => reject(new Error(err.errMsg || '微信登录失败'))
                })
            })

            if (!loginRes.code) {
                throw new Error('获取微信授权码失败')
            }

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
        // #endif

        // #ifndef APP-PLUS
        uni.showToast({
            title: '当前平台不支持',
            icon: 'none'
        })
        return { success: false }
        // #endif
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
