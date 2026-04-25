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
              <svg-icon name="user" :size="36" color="#FF9A9E" />
            </view>
            <input 
              type="text" 
              v-model="form.email" 
              placeholder="请输入邮箱/用户名/微信名" 
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
      <view class="bottom-section">
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
                <svg-icon name="wechat" :size="44" color="#4CAF50" />
              </view>
              <text class="third-party-text">微信登录</text>
            </view>
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
            icon: 'none',
            duration: 1500
          });
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
      uni.showLoading({ title: '微信登录中...', mask: true });
      
      try {
        const result = await wechatAuth.login();
        
        uni.hideLoading();
        
        if (result.success) {
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
              icon: 'none'
            });
            this.afterWechatLogin(result);
          }
        } else {
          uni.showToast({
            title: result.message || '登录失败',
            icon: 'none',
            duration: 2000
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error('微信登录失败:', error);
        uni.showToast({
          title: error.message || '登录失败',
          icon: 'none',
          duration: 2000
        });
      }
    },
    async afterWechatLogin(result) {
      // 保存登录状态
      uni.setStorageSync('isLoggedIn', true);
      uni.setStorageSync('token', result.token);
      uni.setStorageSync('userId', result.user.id);
      uni.setStorageSync('userAvatar', result.user.avatar || result.user.wechat_avatar || '');
      
      // 保存完整用户信息（包括微信信息）
      const userInfo = {
        id: result.user.id,
        username: result.user.username,
        nickname: result.user.nickname || result.user.wechat_nickname,
        avatar: result.user.avatar || result.user.wechat_avatar,
        email: result.user.email,
        wechat_openid: result.user.wechat_openid,
        wechat_nickname: result.user.wechat_nickname,
        wechat_avatar: result.user.wechat_avatar,
        login_type: result.user.login_type || 'wechat',
        isNewUser: result.isNewUser
      };
      uni.setStorageSync('userInfo', userInfo);
      // 同时存储 user，确保与其他登录方式一致
      uni.setStorageSync('user', userInfo);
      
      // 移除游客模式标记
      uni.removeStorageSync('guest');
      
      await this.loadFollowingList(result.token);
      
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
/* 页面容器 - 内容偏上布局 */
.login-page {
  height: 100vh;
  height: 100dvh; /* 动态视口高度，适配移动端浏览器 */
  background: linear-gradient(180deg, #FFF0F5 0%, #FFF8FA 50%, #FFFFFF 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden; /* 禁止滚动 */
  padding: 40rpx 40rpx 40rpx;
  box-sizing: border-box;
}

/* 登录容器 - 内容偏上 */
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 560rpx;
  gap: 24rpx; /* 使用gap控制间距 */
  margin-top: 160rpx; /* 顶部留白增大，主体下移更多 */
}

/* 头部区域 */
.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.app-icon {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #FFB6C1 0%, #FFC0CB 50%, #FFD1DC 100%);
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(255, 182, 193, 0.4);
  overflow: hidden;
}

.app-logo {
  width: 110rpx;
  height: 110rpx;
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

.forgot-password {
  text-align: right;
  margin-top: -8rpx;
}

.forgot-text {
  font-size: 22rpx;
  color: #FF9A9E;
}

/* 登录按钮 */
.login-btn {
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

.login-btn:active {
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

/* 底部区域 - 固定在页面底部 */
.bottom-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40rpx; /* 增加间距 */
  margin-top: auto; /* 推到底部 */
  padding-bottom: 40rpx;
}

.footer-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8rpx;
}

.footer-text {
  font-size: 24rpx;
  color: #888;
}

.register-link {
  font-size: 24rpx;
  color: #FF6B9D;
  font-weight: 600;
}

.guest-section {
  text-align: center;
}

.guest-link {
  font-size: 24rpx;
  color: #FF9A9E;
  font-weight: 500;
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 154, 158, 0.1);
  transition: all 0.3s ease;
}

.guest-link:active {
  background: rgba(255, 154, 158, 0.2);
}

/* 第三方登录 */
.third-party-login {
  width: 100%;
  margin-top: 120rpx; /* 增加与游客模式的距离 */
}

.divider {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: linear-gradient(90deg, transparent, #EEE, transparent);
}

.divider-text {
  font-size: 20rpx;
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
  gap: 4rpx;
  padding: 12rpx 32rpx;
  border-radius: 14rpx;
  background: rgba(129, 199, 132, 0.06);
  border: 1rpx solid rgba(129, 199, 132, 0.12);
  transition: all 0.3s ease;
}

.third-party-btn:active {
  transform: scale(0.98);
  background: rgba(129, 199, 132, 0.1);
  border-color: rgba(129, 199, 132, 0.2);
}

.wechat-icon {
  width: 48rpx;
  height: 48rpx;
  background: linear-gradient(135deg, #A8E6A3 0%, #C8E6C9 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 6rpx rgba(129, 199, 132, 0.06);
}

.third-party-text {
  font-size: 22rpx;
  color: #81C784;
  font-weight: 500;
}

/* 适配小屏幕 */
@media screen and (max-height: 700px) {
  .login-container {
    gap: 16rpx;
    margin-top: 120rpx;
  }
  
  .app-icon {
    width: 130rpx;
    height: 130rpx;
    border-radius: 28rpx;
  }
  
  .app-logo {
    width: 90rpx;
    height: 90rpx;
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
  
  .login-btn {
    height: 70rpx;
    font-size: 28rpx;
  }
  
  .bottom-section {
    gap: 8rpx;
  }
}

/* 适配大屏幕 */
@media screen and (min-height: 900px) {
  .login-container {
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
