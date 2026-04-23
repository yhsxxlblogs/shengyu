<template>
  <view class="register-page page-enter">
    <view class="register-container">
      <view class="header-section">
        <view class="app-icon">
          <text class="icon-emoji">🐾</text>
        </view>
        <text class="app-title">声愈</text>
        <text class="app-subtitle">发现身边的美好声音</text>
      </view>
      
      <view class="form-section">
        <view class="form-item">
          <view class="input-wrapper">
            <SvgIcon name="user" :size="36" class="input-icon-svg" />
            <input type="text" v-model="form.username" placeholder="请输入用户名" class="input" />
          </view>
        </view>
        <view class="form-item">
          <view class="input-wrapper">
            <SvgIcon name="email" :size="36" class="input-icon-svg" />
            <input type="email" v-model="form.email" placeholder="请输入邮箱" class="input" />
          </view>
        </view>
        <view class="form-item">
          <view class="input-wrapper">
            <SvgIcon name="lock" :size="36" class="input-icon-svg" />
            <input :type="showPassword ? 'text' : 'password'" v-model="form.password" placeholder="请输入密码" class="input" />
            <SvgIcon :name="showPassword ? 'eye' : 'eye-off'" :size="32" class="toggle-password" @click="showPassword = !showPassword" />
          </view>
        </view>
        <button class="register-btn" @click="register" :disabled="loading" :class="{ 'btn-loading': loading }">
          <text v-if="!loading">注册</text>
          <text v-else class="loading-text">注册中...</text>
        </button>
      </view>
      
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
@import '/static/styles/theme.css';

.register-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF0F3 0%, #F8F8F8 50%, #FFFFFF 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20rpx;
  padding-top: 60rpx;
}

.register-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600rpx;
}

.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

/* App图标 - 流动渐变 */
.app-icon {
  width: 180rpx;
  height: 180rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 4s ease infinite;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 48rpx rgba(255, 154, 158, 0.35);
  margin-bottom: 40rpx;
  position: relative;
  overflow: hidden;
}

.app-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 70%
  );
  animation: shimmer 3s infinite;
}

.icon-emoji {
  font-size: 90rpx;
  position: relative;
  z-index: 1;
}

.app-title {
  font-size: 52rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12rpx;
}

.app-subtitle {
  font-size: 26rpx;
  color: #888;
}

.form-section {
  margin-bottom: 60rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

/* 输入框 - 玻璃拟态 */
.input-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
  border-radius: 24rpx;
  padding: 0 32rpx;
  height: 104rpx;
  border: 2rpx solid rgba(255, 154, 158, 0.15);
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
}

.input-wrapper:focus-within {
  border-color: rgba(255, 154, 158, 0.4);
  box-shadow: 0 4rpx 20rpx rgba(255, 154, 158, 0.15);
  transform: translateY(-2rpx);
}

.input-icon-svg {
  margin-right: 20rpx;
  color: #999;
}

.input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #444;
}

.toggle-password {
  padding: 10rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #999;
}

.toggle-password:active {
  transform: scale(0.9);
}

/* 注册按钮 - 流动渐变 */
.register-btn {
  width: 100%;
  height: 104rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 3s ease infinite;
  color: #fff;
  border-radius: 52rpx;
  font-size: 34rpx;
  font-weight: 600;
  box-shadow: 0 12rpx 32rpx rgba(255, 154, 158, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.register-btn::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 70%
  );
  animation: shimmer 3s infinite;
}

.register-btn:active {
  transform: scale(0.98);
  box-shadow: 0 6rpx 20rpx rgba(255, 154, 158, 0.3);
}

.register-btn:disabled {
  opacity: 0.7;
}

.btn-loading {
  opacity: 0.8;
}

.loading-text {
  font-size: 28rpx;
}

.footer-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10rpx;
}

.footer-text {
  font-size: 26rpx;
  color: #666;
}

.login-link {
  font-size: 26rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
  transition: all 0.3s ease;
}

.login-link:active {
  opacity: 0.7;
}
</style>