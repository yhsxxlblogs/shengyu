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
            <view class="input-icon">
              <svg-icon name="user" :size="36" color="#FF9A9E" />
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
            <view class="input-icon">
              <svg-icon name="email" :size="36" color="#FF9A9E" />
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
            <view class="input-icon">
              <svg-icon name="lock" :size="36" color="#FF9A9E" />
            </view>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="form.password" 
              placeholder="请输入密码" 
              class="input"
              placeholder-class="input-placeholder"
            />
            <view class="toggle-password" @click="showPassword = !showPassword">
              <svg-icon :name="showPassword ? 'eye' : 'eye-off'" :size="32" color="#999" />
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
/* 页面容器 - 使用flex布局确保居中 */
.register-page {
  height: 100vh;
  height: 100dvh; /* 动态视口高度，适配移动端浏览器 */
  background: linear-gradient(180deg, #FFF0F5 0%, #FFF8FA 50%, #FFFFFF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* 禁止滚动 */
  padding: 0 40rpx;
  box-sizing: border-box;
}

/* 注册容器 - 垂直居中 */
.register-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 560rpx;
  gap: 24rpx; /* 使用gap控制间距 */
}

/* 头部区域 */
.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.app-icon {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 50%, #FFD1DC 100%);
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 24rpx rgba(255, 182, 193, 0.4);
  overflow: hidden;
}

.app-logo {
  width: 80rpx;
  height: 80rpx;
}

.app-title {
  font-size: 40rpx;
  font-weight: 700;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2rpx;
}

.app-subtitle {
  font-size: 24rpx;
  color: #AAA;
}

/* 表单区域 */
.form-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.form-item {
  width: 100%;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 14rpx;
  padding: 0 20rpx;
  height: 80rpx;
  border: 2rpx solid #F5F5F5;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #FFB6C1;
  box-shadow: 0 4rpx 16rpx rgba(255, 182, 193, 0.2);
}

.input-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12rpx;
  flex-shrink: 0;
}

.input {
  flex: 1;
  height: 100%;
  font-size: 26rpx;
  color: #333;
  min-width: 0; /* 防止flex item溢出 */
}

.input-placeholder {
  color: #CCC;
  font-size: 26rpx;
}

.toggle-password {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx;
  margin-right: -16rpx;
  flex-shrink: 0;
}

/* 注册按钮 */
.register-btn {
  width: 100%;
  height: 76rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FF6B9D 100%);
  color: #fff;
  border-radius: 38rpx;
  font-size: 30rpx;
  font-weight: 600;
  box-shadow: 0 6rpx 20rpx rgba(255, 107, 157, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: all 0.3s ease;
  margin-top: 8rpx;
}

.register-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 12rpx rgba(255, 107, 157, 0.25);
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
  gap: 10rpx;
}

.spinner {
  width: 28rpx;
  height: 28rpx;
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
  margin-top: 8rpx;
}

.footer-text {
  font-size: 24rpx;
  color: #888;
}

.login-link {
  font-size: 24rpx;
  color: #FF6B9D;
  font-weight: 600;
}

/* 适配小屏幕 */
@media screen and (max-height: 700px) {
  .register-container {
    gap: 16rpx;
  }
  
  .app-icon {
    width: 100rpx;
    height: 100rpx;
    border-radius: 24rpx;
  }
  
  .app-logo {
    width: 68rpx;
    height: 68rpx;
  }
  
  .app-title {
    font-size: 36rpx;
  }
  
  .app-subtitle {
    font-size: 22rpx;
  }
  
  .input-wrapper {
    height: 72rpx;
  }
  
  .register-btn {
    height: 70rpx;
    font-size: 28rpx;
  }
}

/* 适配大屏幕 */
@media screen and (min-height: 900px) {
  .register-container {
    gap: 32rpx;
  }
  
  .app-icon {
    width: 140rpx;
    height: 140rpx;
  }
  
  .app-logo {
    width: 100rpx;
    height: 100rpx;
  }
}
</style>
