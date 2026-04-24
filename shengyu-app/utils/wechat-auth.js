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
     * 官方文档参考：https://uniapp.dcloud.net.cn/tutorial/app-oauth-weixin.html
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
            // 使用 uni.login 标准 API，仅请求授权认证
            const loginRes = await new Promise((resolve, reject) => {
                uni.login({
                    provider: 'weixin',
                    onlyAuthorize: true, // 微信登录仅请求授权认证，获取code
                    success: (event) => {
                        console.log('uni.login 成功:', event)
                        resolve(event)
                    },
                    fail: (err) => {
                        console.error('uni.login 失败:', err)
                        // err.code 是错误码
                        let errorMsg = '微信登录失败'
                        if (err.code === -2) {
                            errorMsg = '用户取消登录'
                        } else if (err.code === -100) {
                            errorMsg = '微信登录失败，请检查配置'
                        } else if (err.errMsg) {
                            errorMsg = err.errMsg
                        }
                        reject(new Error(errorMsg))
                    }
                })
            })

            // 客户端成功获取授权临时票据（code）
            const { code } = loginRes
            
            if (!code) {
                throw new Error('获取微信授权码失败')
            }

            console.log('获取到微信code:', code)

            // 向业务服务器发起登录请求
            const res = await uni.request({
                url: `${API_BASE}/api/wechat/login`,
                method: 'POST',
                data: {
                    code: code
                }
            })

            console.log('后端登录响应:', res.data)

            if (res.data.error) {
                throw new Error(res.data.error)
            }

            // 获得token完成登录
            if (res.data.token) {
                const user = res.data.user
                // 存储所有必需的字段，确保与其他登录方式一致
                uni.setStorageSync('token', res.data.token)
                uni.setStorageSync('user', user)
                uni.setStorageSync('userInfo', user)
                uni.setStorageSync('userId', user.id)
                uni.setStorageSync('userAvatar', user.avatar || user.wechat_avatar || '')
                uni.setStorageSync('isLoggedIn', true)
                uni.removeStorageSync('guest')
                return { 
                    success: true, 
                    token: res.data.token,
                    user: user,
                    isNewUser: user?.isNewUser || false
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
                    success: (event) => resolve(event),
                    fail: (err) => {
                        let errorMsg = '微信登录失败'
                        if (err.code === -2) {
                            errorMsg = '用户取消登录'
                        } else if (err.errMsg) {
                            errorMsg = err.errMsg
                        }
                        reject(new Error(errorMsg))
                    }
                })
            })

            const { code } = loginRes
            
            if (!code) {
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
                    code: code
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
