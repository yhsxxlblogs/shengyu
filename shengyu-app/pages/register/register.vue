<template>
  <view class="register-page">
    <view class="register-container">
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
              v-model="form.username" 
              placeholder="请输入用户名" 
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
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </view>
            <input 
              type="email" 
              v-model="form.email" 
              placeholder="请输入邮箱" 
              class="input"
              placeholder-class="input-placeholder"
            />
          </view>
        </view>

        <view class="form-item">
          <view class="input-wrapper">
            <view class="input-icon gradient-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="url(#gradient3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <defs>
                  <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
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

        <button 
          class="register-btn" 
          @click="register" 
          :disabled="loading || !isFormValid"
          :class="{ 'btn-disabled': !isFormValid, 'btn-loading': loading }"
        >
          <text v-if="!loading">注册</text>
          <view v-else class="loading-spinner">
            <view class="spinner"></view>
            <text>注册中...</text>
          </view>
        </button>
      </view>

      <!-- 底部区域 -->
      <view class="footer-section">
        <text class="footer-text">已有账号？</text>
        <text class="login-link" @click="goToLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '',
        email: '',
        password: ''
      },
      loading: false,
      showPassword: false
    };
  },
  computed: {
    isFormValid() {
      return this.form.username && this.form.email && this.form.password;
    }
  },
  methods: {
    async register() {
      if (!this.form.username || !this.form.email || !this.form.password) {
        uni.showToast({ title: '请填写所有必填项', icon: 'none' });
        return;
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.form.email)) {
        uni.showToast({ title: '请输入正确的邮箱格式', icon: 'none' });
        return;
      }

      // 验证用户名长度
      if (this.form.username.length < 3 || this.form.username.length > 20) {
        uni.showToast({ title: '用户名长度应在3-20个字符之间', icon: 'none' });
        return;
      }

      // 验证密码长度
      if (this.form.password.length < 6) {
        uni.showToast({ title: '密码长度至少为6位', icon: 'none' });
        return;
      }

      this.loading = true;
      try {
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/auth/register',
          method: 'POST',
          data: this.form
        });

        const responseData = res.data;
        if (responseData.message === '注册成功') {
          uni.showToast({ title: '注册成功', icon: 'success' });
          setTimeout(() => {
            uni.navigateTo({ url: '/pages/login/login' });
          }, 1500);
        } else {
          uni.showToast({ title: responseData.error || '注册失败', icon: 'none' });
        }
      } catch (error) {
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    goToLogin() {
      uni.navigateTo({ url: '/pages/login/login' });
    }
  }
};
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF0F5 0%, #FFF8FA 50%, #FFFFFF 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40rpx;
  padding-top: 80rpx;
}

.register-container {
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

/* 注册按钮 */
.register-btn {
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
  margin-top: 10rpx;
}

.register-btn:active {
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
}

.footer-text {
  font-size: 26rpx;
  color: #888;
}

.login-link {
  font-size: 26rpx;
  color: #FF6B9D;
  font-weight: 600;
}
</style>
