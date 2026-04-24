/**
 * 微信登录工具类
 * 基于 uni-app 的微信登录功能
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
        this.enabled = true
    }

    /**
     * 检查微信登录是否可用
     */
    isAvailable() {
        return this.enabled && this.appId
    }

    /**
     * 检查微信是否已安装（仅APP端）
     */
    async isWechatInstalled() {
        // #ifdef APP-PLUS
        return new Promise((resolve) => {
            uni.getProvider({
                service: 'oauth',
                success: (res) => {
                    const hasWechat = res.provider.includes('weixin')
                    resolve(hasWechat)
                },
                fail: () => {
                    resolve(false)
                }
            })
        })
        // #endif
        
        // #ifndef APP-PLUS
        return false
        // #endif
    }

    /**
     * 微信登录 - APP端使用 plus.oauth API
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
            // 1. 获取 OAuth 服务列表
            const oauthRes = await new Promise((resolve, reject) => {
                plus.oauth.getServices((services) => {
                    resolve(services)
                }, (error) => {
                    reject(error)
                })
            })

            // 2. 查找微信登录服务
            const wechatService = oauthRes.find(service => service.id === 'weixin')
            
            if (!wechatService) {
                throw new Error('未找到微信登录服务，请确保已安装微信客户端')
            }

            // 3. 调用微信登录
            const authResult = await new Promise((resolve, reject) => {
                wechatService.login((result) => {
                    resolve(result)
                }, (error) => {
                    reject(error)
                })
            })

            console.log('微信登录结果:', authResult)

            if (!authResult.code) {
                throw new Error('获取微信授权码失败')
            }

            // 4. 获取用户信息（可选）
            let userInfo = null
            try {
                const userRes = await new Promise((resolve, reject) => {
                    wechatService.getUserInfo((result) => {
                        resolve(result)
                    }, (error) => {
                        reject(error)
                    })
                })
                userInfo = userRes
                console.log('微信用户信息:', userInfo)
            } catch (e) {
                console.log('获取微信用户信息失败:', e.message)
            }

            // 5. 发送 code 到后端换取 token
            const res = await uni.request({
                url: `${API_BASE}/api/wechat/login`,
                method: 'POST',
                data: {
                    code: authResult.code,
                    userInfo: userInfo
                }
            })

            if (res.data.error) {
                throw new Error(res.data.error)
            }

            // 6. 保存 token
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
            // 1. 获取 OAuth 服务
            const oauthRes = await new Promise((resolve, reject) => {
                plus.oauth.getServices((services) => {
                    resolve(services)
                }, (error) => {
                    reject(error)
                })
            })

            const wechatService = oauthRes.find(service => service.id === 'weixin')
            
            if (!wechatService) {
                throw new Error('未找到微信登录服务')
            }

            // 2. 调用微信登录获取 code
            const authResult = await new Promise((resolve, reject) => {
                wechatService.login((result) => {
                    resolve(result)
                }, (error) => {
                    reject(error)
                })
            })

            const token = uni.getStorageSync('token')
            const res = await uni.request({
                url: `${API_BASE}/api/wechat/bind`,
                method: 'POST',
                header: {
                    'Authorization': `Bearer ${token}`
                },
                data: {
                    code: authResult.code
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
