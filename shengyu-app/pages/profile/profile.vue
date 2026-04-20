<template>
  <view class="profile-container page-enter">
    <view class="content-wrapper">
      <view v-if="loading" class="skeleton-loading">
        <view class="skeleton-card">
          <view class="skeleton-avatar"></view>
          <view class="skeleton-info">
            <view class="skeleton-line short"></view>
            <view class="skeleton-line"></view>
          </view>
        </view>
        <view class="skeleton-stats">
          <view class="skeleton-stat" v-for="i in 3" :key="i">
            <view class="skeleton-circle"></view>
            <view class="skeleton-line mini"></view>
          </view>
        </view>
        <view class="skeleton-menu">
          <view class="skeleton-menu-item" v-for="i in 5" :key="i">
            <view class="skeleton-icon"></view>
            <view class="skeleton-line"></view>
          </view>
        </view>
      </view>
      
      <view v-else-if="!isLoggedIn" class="not-logged-in">
        <view class="empty-avatar">
          <text class="empty-icon">🐾</text>
        </view>
        <text class="empty-title">登录后享受更多功能</text>
        <text class="empty-desc">记录动物声音、发布帖子、互动交流</text>
        <button class="login-button" @click="goLogin">立即登录</button>
      </view>
      
      <view v-else class="logged-in fade-in">
        <view class="user-card">
          <view class="user-header">
            <image :src="getImageUrl(user.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=FF69B4&color=fff&size=200`" class="user-avatar" mode="aspectFill"></image>
            <view class="user-detail">
              <text class="user-name">{{ user.username || '用户' }}</text>
              <text class="user-email">{{ user.email || '' }}</text>
            </view>
            <view class="edit-icon" @click="changeAvatar">
              <text class="edit-emoji">📷</text>
            </view>
          </view>
          
          <view class="stats-row">
            <view class="stat-card">
              <text class="stat-number">{{ user.posts || 0 }}</text>
              <text class="stat-label">帖子</text>
            </view>
            <view class="divider-line"></view>
            <view class="stat-card">
              <text class="stat-number">{{ user.likes || 0 }}</text>
              <text class="stat-label">获赞</text>
            </view>
            <view class="divider-line"></view>
            <view class="stat-card">
              <text class="stat-number">{{ user.comments || 0 }}</text>
              <text class="stat-label">评论</text>
            </view>
          </view>
          
          <!-- 关注和粉丝统计 -->
          <view class="follow-stats-row">
            <view class="follow-stat-item" @click="goToFollows">
              <text class="follow-stat-number">{{ user.following_count || 0 }}</text>
              <text class="follow-stat-label">关注</text>
            </view>
            <view class="follow-stat-item" @click="goToFollowers">
              <text class="follow-stat-number">{{ user.follower_count || 0 }}</text>
              <text class="follow-stat-label">粉丝</text>
            </view>
          </view>
        </view>
        
        <!-- 功能菜单 -->
        <view class="menu-section">
          <text class="menu-title">我的功能</text>
          
          <view class="menu-item" @click="myPosts">
            <view class="menu-icon-wrapper">
              <text class="menu-icon">📝</text>
            </view>
            <text class="menu-text">我的帖子</text>
            <text class="menu-arrow">›</text>
          </view>
          
          <view class="menu-item" @click="mySounds">
            <view class="menu-icon-wrapper">
              <text class="menu-icon">🎵</text>
            </view>
            <text class="menu-text">我的声音</text>
            <text class="menu-arrow">›</text>
          </view>
          
          <view class="menu-item" @click="myLikes">
            <view class="menu-icon-wrapper">
              <text class="menu-icon">♥</text>
            </view>
            <text class="menu-text">我的点赞</text>
            <text class="menu-arrow">›</text>
          </view>
          
          <view class="menu-item" @click="goToFollows">
            <view class="menu-icon-wrapper" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
              <text class="menu-icon">👥</text>
            </view>
            <text class="menu-text">我的关注</text>
            <text class="menu-arrow">›</text>
          </view>
          
          <view class="menu-item" @click="goToFollowers">
            <view class="menu-icon-wrapper" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
              <text class="menu-icon">🌟</text>
            </view>
            <text class="menu-text">我的粉丝</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>
        
        <view class="menu-section">
          <text class="menu-title">设置与帮助</text>
          
          <view class="menu-item" @click="settings">
            <view class="menu-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
              <text class="menu-icon">⚙️</text>
            </view>
            <text class="menu-text">设置</text>
            <text class="menu-arrow">›</text>
          </view>
          
          <view class="menu-item" @click="about">
            <view class="menu-icon-wrapper" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
              <text class="menu-icon">ℹ️</text>
            </view>
            <text class="menu-text">关于我们</text>
            <text class="menu-arrow">›</text>
          </view>
        </view>
        
        <view class="logout-section">
          <button class="logout-button" @click="logout">退出登录</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api, { getImageUrl } from '../../utils/api.js';
export default {
  data() {
    return {
      user: {
        username: '',
        email: '',
        avatar: '',
        posts: 0,
        likes: 0,
        comments: 0,
        following_count: 0,
        follower_count: 0
      },
      loading: false,
      error: '',
      isLoggedIn: false
    };
  },
  onLoad() {
    this.checkLoginStatus();
    this.getUserInfo();
    this.startAutoUpdate();
  },
  onShow() {
    this.checkLoginStatus();
    this.getUserInfo();
  },
  onPullDownRefresh() {
    this.checkLoginStatus();
    this.getUserInfo();
    uni.stopPullDownRefresh();
  },
  onUnload() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  },
  methods: {
    checkLoginStatus() {
      const token = uni.getStorageSync('token');
      this.isLoggedIn = !!token;
    },
    startAutoUpdate() {
      this.updateTimer = setInterval(() => {
        if (this.isLoggedIn) {
          this.getUserInfo();
        }
      }, 30000);
    },
    async getUserInfo() {
      this.loading = true;
      this.error = '';
      
      const token = uni.getStorageSync('token');
      
      if (token) {
        try {
          const userRes = await uni.request({
            url: api.auth.user,
            method: 'GET',
            header: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (userRes.statusCode === 200 && userRes.data && userRes.data.user) {
            const statsRes = await uni.request({
              url: 'http://shengyu.supersyh.xyz/api/auth/user/stats',
              method: 'GET',
              header: {
                Authorization: `Bearer ${token}`
              }
            });
            
            this.user = {
              ...userRes.data.user,
              posts: statsRes.data?.stats?.posts || 0,
              likes: statsRes.data?.stats?.likes || 0,
              comments: statsRes.data?.stats?.comments || 0,
              following_count: statsRes.data?.stats?.following_count || 0,
              follower_count: statsRes.data?.stats?.follower_count || 0
            };
            
            uni.setStorageSync('user', this.user);
          }
        } catch (error) {
        }
      }
      
      this.loading = false;
    },
    goLogin() {
      uni.navigateTo({ url: '/pages/login/login' });
    },
    logout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('token');
            uni.removeStorageSync('user');
            uni.removeStorageSync('isLoggedIn');
            uni.removeStorageSync('guest');
            uni.removeStorageSync('followingSet');
            this.user = {
              username: '',
              email: '',
              avatar: '',
              posts: 0,
              likes: 0,
              comments: 0,
              following_count: 0,
              follower_count: 0
            };
            this.isLoggedIn = false;
            uni.showToast({ title: '退出登录成功', icon: 'success' });
            setTimeout(() => {
              uni.reLaunch({ url: '/pages/index/index' });
            }, 1500);
          }
        }
      });
    },
    changeAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePaths = res.tempFilePaths;
          uni.uploadFile({
            url: api.auth.avatar,
            filePath: tempFilePaths[0],
            name: 'avatar',
            header: {
              Authorization: `Bearer ${uni.getStorageSync('token')}`
            },
            success: (uploadRes) => {
              try {
                const data = JSON.parse(uploadRes.data);
                if (data.message === '头像上传成功') {
                  uni.showToast({ title: '头像更换成功', icon: 'success' });
                  // 重新获取用户信息，更新头像
                  this.getUserInfo();
                } else {
                  uni.showToast({ title: '头像更换失败', icon: 'none' });
                }
              } catch (e) {
                uni.showToast({ title: '头像更换失败', icon: 'none' });
              }
            },
            fail: (error) => {
              uni.showToast({ title: '头像上传失败', icon: 'none' });
            }
          });
        },
        fail: (error) => {
        }
      });
    },
    myPosts() {
      uni.navigateTo({ url: '/pages/my-posts/my-posts' });
    },
    mySounds() {
      uni.navigateTo({ url: '/pages/my-sounds/my-sounds' });
    },
    myLikes() {
      uni.navigateTo({ url: '/pages/my-likes/my-likes' });
    },
    settings() {
      uni.showToast({ title: '设置', icon: 'none' });
    },
    about() {
      uni.navigateTo({ url: '/pages/about/about' });
    },
    goToFollows() {
      const user = uni.getStorageSync('user');
      if (user && user.id) {
        uni.navigateTo({ url: `/pages/follows/follows?type=following&userId=${user.id}` });
      }
    },
    goToFollowers() {
      const user = uni.getStorageSync('user');
      if (user && user.id) {
        uni.navigateTo({ url: `/pages/follows/follows?type=followers&userId=${user.id}` });
      }
    },
    getImageUrl
  }
};
</script>

<style scoped>
@import '/static/styles/theme.css';

.profile-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF0F3 0%, #F8F8F8 50%, #FFFFFF 100%);
  padding-top: 40rpx;
}

.content-wrapper {
  padding: 20rpx;
  padding-bottom: 200rpx;
}

/* 骨架屏加载 */
.skeleton-loading {
  animation: skeleton-fade 0.3s ease;
}

@keyframes skeleton-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.skeleton-card {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.skeleton-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  margin-right: 30rpx;
}

.skeleton-info {
  flex: 1;
}

.skeleton-line {
  height: 24rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.skeleton-line.short {
  width: 60%;
}

.skeleton-line.mini {
  width: 40%;
  height: 20rpx;
}

.skeleton-stats {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.skeleton-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.skeleton-circle {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  margin-bottom: 12rpx;
}

.skeleton-menu {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 24rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.skeleton-menu-item {
  display: flex;
  align-items: center;
  padding: 24rpx 20rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
}

.skeleton-menu-item:last-child {
  border-bottom: none;
}

.skeleton-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  margin-right: 20rpx;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 淡入动画 */
.fade-in {
  animation: fade-in 0.4s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 未登录状态 */
.not-logged-in {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
}

.empty-avatar {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 4s ease infinite;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
  box-shadow: 0 12rpx 40rpx rgba(255, 154, 158, 0.3);
  position: relative;
  overflow: hidden;
}

.empty-avatar::before {
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

.empty-icon {
  font-size: 100rpx;
  position: relative;
  z-index: 1;
}

.empty-title {
  font-size: 36rpx;
  font-weight: 600;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 15rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #888;
  margin-bottom: 50rpx;
}

/* 登录按钮 - 流动渐变 */
.login-button {
  width: 280rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 3s ease infinite;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 600;
  box-shadow: 0 6rpx 24rpx rgba(255, 154, 158, 0.4);
  border: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.login-button:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
}

.logged-in {
  padding-bottom: 40rpx;
}

/* 用户卡片 - 高级渐变 */
.user-card {
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 5s ease infinite;
  border-radius: 32rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 12rpx 40rpx rgba(255, 154, 158, 0.35);
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  animation: float 6s ease-in-out infinite;
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  position: relative;
}

.user-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  margin-right: 25rpx;
  border: 6rpx solid rgba(255, 255, 255, 0.4);
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8rpx;
}

.user-email {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.edit-icon {
  width: 60rpx;
  height: 60rpx;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-emoji {
  font-size: 32rpx;
}

.stats-row {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  padding: 30rpx 20rpx;
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.divider-line {
  width: 2rpx;
  height: 60rpx;
  background-color: rgba(255, 255, 255, 0.3);
}

/* 关注和粉丝统计 */
.follow-stats-row {
  display: flex;
  justify-content: center;
  margin-top: 30rpx;
  padding-top: 30rpx;
  border-top: 2rpx solid rgba(255, 255, 255, 0.2);
}

.follow-stat-item {
  flex: 1;
  text-align: center;
}

.follow-stat-number {
  font-size: 36rpx;
  font-weight: bold;
  color: #FFFFFF;
  display: block;
}

.follow-stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
  display: block;
}

/* 菜单区域 - 玻璃拟态 */
.menu-section {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 24rpx;
  padding: 10rpx 0;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.08);
  overflow: hidden;
}

.menu-title {
  font-size: 26rpx;
  color: #888;
  padding: 20rpx 30rpx 10rpx;
  display: block;
  font-weight: 500;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 25rpx 30rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.03);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: rgba(255, 154, 158, 0.05);
  transform: translateX(4rpx);
}

.menu-icon-wrapper {
  width: 70rpx;
  height: 70rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(255, 154, 158, 0.2);
  transition: all 0.3s ease;
}

.menu-item:active .menu-icon-wrapper {
  transform: scale(1.1);
  box-shadow: 0 6rpx 16rpx rgba(255, 154, 158, 0.3);
}

.menu-icon {
  font-size: 36rpx;
}

.menu-text {
  flex: 1;
  font-size: 28rpx;
  color: #444;
  font-weight: 500;
}

.menu-arrow {
  font-size: 32rpx;
  color: #ccc;
  font-weight: 300;
  transition: all 0.3s ease;
}

.menu-item:active .menu-arrow {
  transform: translateX(4rpx);
  color: #FF9A9E;
}

/* 退出登录按钮 */
.logout-section {
  margin-top: 30rpx;
}

.logout-button {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  color: #FF6B9D;
  border-radius: 24rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: 2rpx solid rgba(255, 154, 158, 0.2);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.logout-button:active {
  transform: scale(0.98);
  background: linear-gradient(145deg, #FFF8F9 0%, #FFF0F3 100%);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}
</style>