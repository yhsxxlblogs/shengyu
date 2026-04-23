/**
 * 微信登录工具类
 * 基于 uni-app 的微信登录功能（空壳，待接入微信开放平台）
 * 文档参考：https://uniapp.dcloud.net.cn/tutorial/app-oauth-weixin.html
 */

import { API_BASE } from './api.js'

class WechatAuth {
    constructor() {
        this.appId = ''
        this.enabled = false
    }

    /**
     * 初始化微信配置
     */
    async init() {
        try {
            const res = await uni.request({
                url: `${API_BASE}/api/wechat/config`,
                method: 'GET'
            })

            if (res.data) {
                this.appId = res.data.appId || ''
                this.enabled = res.data.enabled || false
            }
        } catch (error) {
            console.error('获取微信配置失败:', error)
        }
    }

    /**
     * 检查微信登录是否可用
     */
    isAvailable() {
        return this.enabled && this.appId
    }

    /**
     * 微信登录（空壳）
     * TODO: 接入微信开放平台后完善
     */
    async login() {
        // 检查是否已配置
        if (!this.isAvailable()) {
            uni.showModal({
                title: '提示',
                content: '微信登录功能即将上线，敬请期待！',
                showCancel: false
            })
            return { success: false, message: '微信登录未配置' }
        }

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
                return { success: true, user: res.data.user }
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
     * 绑定微信到现有账号（空壳）
     * TODO: 接入后完善
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

            uni.showToast({ title: '绑定成功' })
            return { success: true }

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
     * 检查是否已绑定微信
     * TODO: 接入后完善
     */
    async checkBindStatus() {
        // 空壳实现
        return { bound: false }
    }
}

// 导出单例
export const wechatAuth = new WechatAuth()

/**
 * 微信登录接入步骤（TODO）：
 * 
 * 1. 微信开放平台配置
 *    - 登录微信开放平台 (https://open.weixin.qq.com)
 *    - 创建移动应用，提交审核
 *    - 获取 AppID 和 AppSecret
 *    - 申请开通微信登录功能
 * 
 * 2. 后端配置
 *    - 在 routes/wechat.js 中配置 WECHAT_CONFIG
 *    - 实现 code 换取 access_token 逻辑
 *    - 实现用户信息获取和存储
 * 
 * 3. manifest.json 配置
 *    - 勾选 OAuth(登录鉴权) -> 微信登录
 *    - 填写 AppID 和 UniversalLinks
 * 
 * 4. 数据库表设计
 *    ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(64);
 *    ALTER TABLE users ADD COLUMN wechat_unionid VARCHAR(64);
 *    ALTER TABLE users ADD COLUMN wechat_nickname VARCHAR(100);
 *    ALTER TABLE users ADD COLUMN wechat_avatar VARCHAR(255);
 * 
 * 5. 用户信息字段
 *    - openid: 微信用户唯一标识
 *    - unionid: 微信开放平台唯一标识（多应用互通）
 *    - nickname: 微信昵称
 *    - avatar: 微信头像
 *    - gender: 性别
 *    - city/province/country: 地区信息
 */