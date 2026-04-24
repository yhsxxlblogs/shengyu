<template>
  <view class="login-page">
    <view class="login-container">
      <!-- 头部区域 -->
      <view class="header-section">
        <view class="app-icon">
          <image src="/static/icons/icon-144x144.png" mode="aspectFit" class="app-logo" />
        </view>
        <text class="app-title">声愈</text>
        <text class="app-subtitle">发现身边的美好声音</text>
      </view>
      
      <!-- 表单区域 -->
      <view class="form-section">
        <view class="form-item">
          <view class="input-wrapper">
            <view class="input-icon">
              <svg-icon name="user" :size="40" color="#FF9A9E" />
            </view>
            <input 
              type="text" 
              v-model="form.email" 
              placeholder="请输入用户名或邮箱" 
              class="input"
              placeholder-class="input-placeholder"
            />
          </view>
        </view>
        
        <view class="form-item">
          <view class="input-wrapper">
            <view class="input-icon">
              <svg-icon name="lock" :size="40" color="#FF9A9E" />
            </view>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.password" 
              placeholder="请输入密码" 
              class="input"
              placeholder-class="input-placeholder"
            />
            <view class="toggle-password" @click="showPassword = !showPassword">
              <svg-icon :name="showPassword ? 'eye' : 'eye-off'" :size="36" color="#999" />
            </view>
          </view>
        </view>
        
        <view class="forgot-password">
          <text class="forgot-text" @click="forgotPassword">忘记密码？</text>
        </view>
        
        <button 
          class="login-btn" 
          @click="login" 
          :disabled="loading || !form.email || !form.password"
          :class="{ 'btn-disabled': !form.email || !form.password, 'btn-loading': loading }"
        >
          <text v-if="!loading">登录</text>
          <view v-else class="loading-spinner">
            <view class="spinner"></view>
            <text>登录中...</text>
          </view>
        </button>
      </view>
      
      <!-- 底部区域 -->
      <view class="footer-section">
        <text class="footer-text">还没有账号？</text>
        <text class="register-link" @click="goToRegister">立即注册</text>
      </view>
      
      <view class="guest-section">
        <text class="guest-link" @click="guestLogin">游客模式</text>
      </view>

      <!-- 第三方登录 -->
      <view class="third-party-login">
        <view class="divider">
          <view class="divider-line"></view>
          <text class="divider-text">其他登录方式</text>
          <view class="divider-line"></view>
        </view>
        <view class="third-party-buttons">
          <view class="third-party-btn wechat" @click="wechatLogin">
            <view class="wechat-icon">
              <svg-icon name="wechat" :size="48" color="#07C160" />
            </view>
            <text class="third-party-text">微信登录</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { wechatAuth } from '@/utils/wechat-auth.js'

export default {
  data() {
    return {
      form: {
        email: '',
        password: ''
      },
      loading: false,
      showPassword: false
    };
  },
  methods: {
    async login() {
      if (!this.form.email || !this.form.password) {
        uni.showToast({ title: '请输入用户名/邮箱和密码', icon: 'none' });
        return;
      }
      
      this.loading = true;
      try {
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/auth/login',
          method: 'POST',
          data: this.form
        });
        
        const responseData = res.data;
        if (responseData.message === '登录成功') {
          uni.setStorageSync('token', responseData.token);
          uni.setStorageSync('user', responseData.user);
          uni.setStorageSync('userId', responseData.user.id);
          uni.setStorageSync('userAvatar', responseData.user.avatar || '');
          uni.setStorageSync('isLoggedIn', true);
          uni.removeStorageSync('guest');
          
          this.loadFollowingList(responseData.token);
          
          uni.showToast({ 
            title: '登录成功', 
            icon: 'success',
            duration: 1500,
            complete: () => {
              setTimeout(() => {
                uni.reLaunch({ 
                  url: '/pages/main/main',
                  success: () => {
                    console.log('登录跳转成功')
                  },
                  fail: (err) => {
                    console.error('登录跳转失败:', err)
                    uni.switchTab({
                      url: '/pages/main/main'
                    })
                  }
                });
              }, 1500);
            }
          });
        } else {
          uni.showToast({ title: responseData.error || '登录失败', icon: 'none' });
        }
      } catch (error) {
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    goToRegister() {
      uni.navigateTo({ url: '/pages/register/register' });
    },
    guestLogin() {
      uni.setStorageSync('guest', true);
      uni.setStorageSync('isLoggedIn', false);
      uni.removeStorageSync('token');
      uni.removeStorageSync('user');
      uni.reLaunch({ url: '/pages/main/main' });
    },
    forgotPassword() {
      uni.showToast({ title: '功能开发中', icon: 'none' });
    },
    async wechatLogin() {
      // 使用微信登录
      uni.showLoading({ title: '微信登录中...' });
      
      try {
        const result = await wechatAuth.login();
        
        uni.hideLoading();
        
        if (result.success) {
          // 如果是新用户，显示提示
          if (result.isNewUser) {
            uni.showModal({
              title: '欢迎新用户',
              content: '您已成功创建账号！\n\n提示：如果您已有账号密码账号，可以在个人中心设置中绑定微信，实现两种方式登录同一账号。',
              showCancel: false,
              confirmText: '知道了',
              success: () => {
                this.afterWechatLogin(result);
              }
            });
          } else {
            uni.showToast({
              title: '登录成功',
              icon: 'success'
            });
            this.afterWechatLogin(result);
          }
        }
      } catch (error) {
        uni.hideLoading();
        console.error('微信登录失败:', error);
      }
    },
    async afterWechatLogin(result) {
      // 缓存关注列表
      await this.loadFollowingList(result.token);
      
      // 延迟跳转
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/main/main'
        });
      }, 500);
    },
    async loadFollowingList(token) {
      try {
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/social/following',
          method: 'GET',
          header: { Authorization: `Bearer ${token}` }
        });
        if (res.statusCode === 200 && res.data.follows) {
          const followingSet = new Set(res.data.follows.map(f => String(f.id)));
          uni.setStorageSync('followingSet', Array.from(followingSet));
          console.log('关注列表已缓存:', followingSet);
        }
      } catch (e) {
        console.error('加载关注列表失败:', e);
      }
    }
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF0F5 0%, #FFF8FA 50%, #FFFFFF 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40rpx;
  padding-top: 80rpx;
}

.login-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600rpx;
}

/* 头部区域 */
.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 50rpx;
}

.app-icon {
  width: 140rpx;
  height: 140rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 50%, #FFD1DC 100%);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(255, 182, 193, 0.4);
  margin-bottom: 24rpx;
  overflow: hidden;
}

.app-logo {
  width: 100rpx;
  height: 100rpx;
}

.app-title {
  font-size: 44rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8rpx;
  letter-spacing: 2rpx;
}

.app-subtitle {
  font-size: 26rpx;
  color: #AAA;
}

/* 表单区域 */
.form-section {
  margin-bottom: 30rpx;
}

.form-item {
  margin-bottom: 20rpx;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 0 24rpx;
  height: 90rpx;
  border: 2rpx solid #F5F5F5;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #FFB6C1;
  box-shadow: 0 4rpx 20rpx rgba(255, 182, 193, 0.2);
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
}

.input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #333;
}

.input-placeholder {
  color: #CCC;
}

.toggle-password {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  margin-right: -20rpx;
}

.forgot-password {
  text-align: right;
  margin-bottom: 30rpx;
  margin-top: 4rpx;
}

.forgot-text {
  font-size: 24rpx;
  color: #FF9A9E;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FF6B9D 100%);
  color: #fff;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 157, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: all 0.3s ease;
}

.login-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(255, 107, 157, 0.25);
}

.btn-disabled {
  opacity: 0.5;
  box-shadow: none;
}

.btn-loading {
  opacity: 0.8;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.spinner {
  width: 32rpx;
  height: 32rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 底部区域 */
.footer-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 20rpx;
}

.footer-text {
  font-size: 26rpx;
  color: #888;
}

.register-link {
  font-size: 26rpx;
  color: #FF6B9D;
  font-weight: 600;
}

.guest-section {
  text-align: center;
  margin-bottom: 40rpx;
}

.guest-link {
  font-size: 26rpx;
  color: #AAA;
}

/* 第三方登录 */
.third-party-login {
  margin-top: auto;
}

.divider {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, #EEE, transparent);
}

.divider-text {
  font-size: 22rpx;
  color: #BBB;
}

.third-party-buttons {
  display: flex;
  justify-content: center;
}

.third-party-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 40rpx;
  border-radius: 16rpx;
  background: #FAFAFA;
  transition: all 0.3s ease;
}

.third-party-btn:active {
  background: #F0F0F0;
}

.wechat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.wechat-img {
  width: 64rpx;
  height: 64rpx;
}

.third-party-text {
  font-size: 22rpx;
  color: #666;
}
</style>
