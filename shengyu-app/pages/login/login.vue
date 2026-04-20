<template>
  <view class="login-page page-enter">
    <view class="login-container">
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
            <text class="input-icon">👤</text>
            <input type="text" v-model="form.email" placeholder="请输入用户名或邮箱" class="input" />
          </view>
        </view>
        <view class="form-item">
          <view class="input-wrapper">
            <text class="input-icon">🔒</text>
            <input :type="showPassword ? 'text' : 'password'" v-model="form.password" placeholder="请输入密码" class="input" />
            <text class="toggle-password" @click="showPassword = !showPassword">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</text>
          </view>
        </view>
        <view class="forgot-password">
          <text class="forgot-text">忘记密码？</text>
        </view>
        <button class="login-btn" @click="login" :disabled="loading" :class="{ 'btn-loading': loading }">
          <text v-if="!loading">登录</text>
          <text v-else class="loading-text">登录中...</text>
        </button>
      </view>
      
      <view class="footer-section">
        <text class="footer-text">还没有账号？</text>
        <text class="register-link" @click="goToRegister">立即注册</text>
      </view>
      
      <view class="guest-section">
        <text class="guest-link" @click="guestLogin">游客模式</text>
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
          // 先存储登录状态，再显示提示
          uni.setStorageSync('token', responseData.token);
          uni.setStorageSync('user', responseData.user);
          uni.setStorageSync('userId', responseData.user.id);
          uni.setStorageSync('userAvatar', responseData.user.avatar || '');
          uni.setStorageSync('isLoggedIn', true);
          uni.removeStorageSync('guest');
          
          // 获取用户的关注列表并存储
          this.loadFollowingList(responseData.token);
          
          uni.showToast({ 
            title: '登录成功', 
            icon: 'success',
            duration: 1500,
            complete: () => {
              // 确保状态存储完成后再跳转
              setTimeout(() => {
                uni.reLaunch({ 
                  url: '/pages/main/main',
                  success: () => {
                    console.log('登录跳转成功')
                  },
                  fail: (err) => {
                    console.error('登录跳转失败:', err)
                    // 如果跳转失败，尝试使用 switchTab
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
    // 加载用户的关注列表
    async loadFollowingList(token) {
      try {
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/social/following',
          method: 'GET',
          header: { Authorization: `Bearer ${token}` }
        });
        if (res.statusCode === 200 && res.data.follows) {
          // 将关注列表转换为 Set 存储，方便快速查找
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
@import '/static/styles/theme.css';

.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF0F3 0%, #F8F8F8 50%, #FFFFFF 100%);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20rpx;
  padding-top: 80rpx;
}

.login-container {
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

.input-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: #444;
}

.toggle-password {
  font-size: 32rpx;
  padding: 10rpx;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-password:active {
  transform: scale(0.9);
}

.forgot-password {
  text-align: right;
  margin-bottom: 40rpx;
}

.forgot-text {
  font-size: 24rpx;
  color: #FF9A9E;
  font-weight: 500;
}

/* 登录按钮 - 流动渐变 */
.login-btn {
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

.login-btn::before {
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

.login-btn:active {
  transform: scale(0.98);
  box-shadow: 0 6rpx 20rpx rgba(255, 154, 158, 0.3);
}

.login-btn:disabled {
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
  margin-bottom: 30rpx;
}

.footer-text {
  font-size: 26rpx;
  color: #666;
}

.register-link {
  font-size: 26rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
  transition: all 0.3s ease;
}

.register-link:active {
  opacity: 0.7;
}

.guest-section {
  text-align: center;
}

.guest-link {
  font-size: 26rpx;
  color: #888;
  transition: all 0.3s ease;
}

.guest-link:active {
  color: #FF9A9E;
}
</style>