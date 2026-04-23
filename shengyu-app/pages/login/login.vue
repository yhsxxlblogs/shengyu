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
            <view class="input-icon gradient-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="url(#gradient1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#FF9A9E"/>
                    <stop offset="100%" style="stop-color:#FF6B9D"/>
                  </linearGradient>
                </defs>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
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
            <view class="input-icon gradient-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="url(#gradient2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <defs>
                  <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#FF9A9E"/>
                    <stop offset="100%" style="stop-color:#FF6B9D"/>
                  </linearGradient>
                </defs>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </view>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.password" 
              placeholder="请输入密码" 
              class="input"
              placeholder-class="input-placeholder"
            />
            <view class="toggle-password" @click="showPassword = !showPassword">
              <svg v-if="showPassword" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#999" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#999" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
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
              <svg viewBox="0 0 24 24" width="32" height="32">
                <defs>
                  <linearGradient id="wechatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#07C160"/>
                    <stop offset="100%" style="stop-color:#05a350"/>
                  </linearGradient>
                </defs>
                <path fill="url(#wechatGradient)" d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.045c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
              </svg>
            </view>
            <text class="third-party-text">微信登录</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
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
      const { wechatAuth } = await import('@/utils/wechat-auth.js');
      await wechatAuth.init();
      const result = await wechatAuth.login();

      if (result.success) {
        uni.reLaunch({ url: '/pages/main/main' });
      }
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

.gradient-icon {
  filter: drop-shadow(0 2rpx 4rpx rgba(255, 107, 157, 0.2));
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
  filter: drop-shadow(0 2rpx 4rpx rgba(7, 193, 96, 0.2));
}

.third-party-text {
  font-size: 22rpx;
  color: #666;
}
</style>
