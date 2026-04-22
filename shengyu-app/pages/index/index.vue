<template>
  <view class="index-container page-enter">
    <view class="search-bar">
      <view class="search-input-wrapper" @click="goSearch">
        <view class="search-input">
          <SvgIcon name="search" :size="28" class="search-icon-svg" />
          <text class="search-placeholder">搜索声音、帖子、用户...</text>
        </view>
      </view>
      <view class="scan-btn" @click="goScan">
        <SvgIcon name="scan" :size="32" class="scan-icon-svg" />
      </view>
    </view>
    
    <!-- 录制声音按钮 -->
    <view class="record-btn" @click="goRecord">
      <SvgIcon name="plus" :size="40" class="record-btn-icon-svg" />
    </view>
    
    <!-- 录制声音区域 -->
    <view class="record-section" @click="goRecord">
      <view class="record-circle">
        <SvgIcon name="plus" :size="48" class="record-icon-svg" />
        <text class="record-text">录制声音</text>
      </view>
      <text class="record-desc">点击录制你的声音</text>
    </view>
    
    <!-- 动态分类区域 -->
    <view v-for="(categoryData, category) in animalCategories" :key="category" class="category-section">
      <text class="section-title">{{ categoryData.display_name }}</text>

      <!-- 加载状态 -->
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>

      <!-- 错误提示 -->
      <view v-else-if="error" class="error">
        <text>{{ error }}</text>
        <button @click="getPopularAnimals" class="retry-btn">重试</button>
      </view>

      <!-- 动物列表 -->
      <view v-else class="animal-grid">
        <view class="animal-item" v-for="animal in categoryData.items" :key="animal.id" @click="goSoundDetail(animal.type)">
          <view class="animal-icon">
            <text class="icon">{{ animal.icon }}</text>
          </view>
          <text class="animal-name">{{ animal.name }}</text>
        </view>
      </view>
    </view>

    <!-- 热门推荐区域 -->
    <view class="recommend-section">
      <view class="section-header">
        <text class="section-title">热门推荐</text>
        <view class="more-btn" @click="goCommunity">
          <text class="more-text">更多</text>
          <SvgIcon name="arrow-right" :size="24" class="more-icon" />
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="popularLoading" class="loading">
        <text>加载中...</text>
      </view>

      <!-- 推荐列表 -->
      <view v-else class="recommend-list">
        <view
          v-for="(post, index) in popularPosts"
          :key="post.id"
          class="recommend-item"
          @click="goPostDetail(post.id)"
        >
          <view class="recommend-rank" :class="{ 'rank-top': index < 3 }">{{ index + 1 }}</view>
          <view class="recommend-content">
            <text class="recommend-text">{{ post.content }}</text>
            <view class="recommend-meta">
              <view class="recommend-author">
                <image v-if="post.avatar" :src="getAvatarUrl(post.avatar)" class="author-avatar" mode="aspectFill" />
                <view v-else class="author-avatar-placeholder">
                  <SvgIcon name="user" :size="24" />
                </view>
                <text class="author-name">{{ post.username }}</text>
              </view>
              <view class="recommend-stats">
                <view class="stat-item">
                  <SvgIcon name="heart" :size="20" class="stat-icon" />
                  <text class="stat-num">{{ post.like_count || 0 }}</text>
                </view>
                <view class="stat-item">
                  <SvgIcon name="message" :size="20" class="stat-icon" />
                  <text class="stat-num">{{ post.comment_count || 0 }}</text>
                </view>
              </view>
            </view>
          </view>
          <image v-if="post.image_url" :src="getImageUrl(post.image_url)" class="recommend-image" mode="aspectFill" />
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!popularLoading && popularPosts.length === 0" class="empty-state">
        <SvgIcon name="info" :size="48" class="empty-icon" />
        <text class="empty-text">暂无热门帖子</text>
      </view>
    </view>
    
    <!-- 通知弹窗 -->
    <view v-if="showNotification" class="notification-popup" @click="closeNotification">
      <view class="notification-content" @click.stop>
        <!-- 顶部装饰条 -->
        <view class="notification-top-bar"></view>
        
        <!-- 图标区域 -->
        <view class="notification-icon-wrapper">
          <view class="notification-icon">
            <SvgIcon name="settings" :size="48" class="notification-icon-svg" />
          </view>
        </view>
        
        <!-- 关闭按钮 -->
        <view class="notification-close" @click="closeNotification">
          <SvgIcon name="close" :size="32" />
        </view>
        
        <!-- 标题 -->
        <view class="notification-title-wrapper">
          <text class="notification-title">{{ notification.title }}</text>
        </view>
        
        <!-- 内容 -->
        <view class="notification-body">
          <text class="notification-content-text">{{ notification.content }}</text>
        </view>
        
        <!-- 底部按钮 -->
        <view class="notification-footer">
          <button class="notification-btn notification-btn-secondary" @click="dismissNotification">
            <text class="btn-text">不再提示</text>
          </button>
          <button class="notification-btn notification-btn-primary" @click="closeNotification">
            <text class="btn-text">我知道了</text>
          </button>
        </view>
      </view>
    </view>
    
  </view>
</template>

<script>
export default {
  data() {
    return {
      animalCategories: {},
      loading: false,
      error: '',
      showNotification: false,
      notification: {
        id: null,
        title: '',
        content: ''
      },
      dismissedNotifications: [],
      unreadMessageCount: 0,
      popularPosts: [],
      popularLoading: false
    };
  },

  onLoad() {
    this.getPopularAnimals();
    this.loadDismissedNotifications();
    this.checkNotifications();
    this.loadUnreadCount();
    this.getPopularPosts();
  },
  onShow() {
    this.getPopularAnimals();
    this.checkNotifications();
    this.loadUnreadCount();
    this.getPopularPosts();
  },
  onPullDownRefresh() {
    this.getPopularAnimals();
    this.getPopularPosts();
    uni.stopPullDownRefresh();
  },
  methods: {
    goSearch() {
      uni.navigateTo({ url: '/pages/search/search' });
    },
    goScan() {
      uni.navigateTo({ url: '/pages/scan/scan' });
    },
    goRecord() {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后使用录制功能',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/login/login' });
            }
          }
        });
      } else {
        uni.navigateTo({ url: '/pages/record/record' });
      }
    },
    goSoundDetail(type) {
      uni.navigateTo({ url: `/pages/sound-detail/sound-detail?type=${type}` });
    },
    async getPopularAnimals() {
      this.loading = true;
      this.error = '';

      try {
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/sound/animal-types-grouped',
          method: 'GET'
        });

        if (res.data.code === 200) {
          this.animalCategories = res.data.data;
        } else {
          this.setDefaultAnimals();
        }
      } catch (error) {
        this.error = '获取数据失败，请重试';
        this.setDefaultAnimals();
      } finally {
        this.loading = false;
      }
    },
    setDefaultAnimals() {
      this.animalCategories = {
        'popular': [
          { id: 1, type: 'cat', name: '猫咪', icon: '🐱' },
          { id: 2, type: 'dog', name: '狗狗', icon: '🐶' }
        ],
        'other': [
          { id: 3, type: 'bird', name: '小鸟', icon: '🐦' },
          { id: 4, type: 'rabbit', name: '兔子', icon: '🐰' },
          { id: 5, type: 'mouse', name: '老鼠', icon: '🐭' },
          { id: 6, type: 'cow', name: '奶牛', icon: '🐮' },
          { id: 7, type: 'pig', name: '小猪', icon: '🐷' },
          { id: 8, type: 'sheep', name: '绵羊', icon: '🐑' }
        ]
      };
    },
    loadDismissedNotifications() {
      const dismissed = uni.getStorageSync('dismissedNotifications');
      if (dismissed) {
        this.dismissedNotifications = JSON.parse(dismissed);
      }
    },
    saveDismissedNotifications() {
      uni.setStorageSync('dismissedNotifications', JSON.stringify(this.dismissedNotifications));
    },
    // 加载未读消息数
    async loadUnreadCount() {
      const token = uni.getStorageSync('token');
      if (!token) return;
      try {
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/social/messages/unread/count',
          method: 'GET',
          header: { Authorization: `Bearer ${token}` }
        });
        if (res.statusCode === 200) {
          this.unreadMessageCount = res.data.count || 0;
        }
      } catch (e) {
        console.error('加载未读数失败:', e);
      }
    },
    async checkNotifications() {
      try {
        uni.request({
          url: 'http://shengyu.supersyh.xyz/api/admin/notifications/current',
          method: 'GET',
          success: (res) => {
            console.log('通知API返回:', res.data);

            if (res.data && res.data.hasNotification && res.data.notification) {
              const notification = res.data.notification;

              // 检查该通知是否已被用户选择不再提示
              if (this.dismissedNotifications.includes(notification.id)) {
                console.log('通知已被用户关闭:', notification.id);
                return;
              }

              this.notification.id = notification.id;
              this.notification.title = notification.title;
              this.notification.content = notification.content;
              this.showNotification = true;
              console.log('显示通知:', notification);
            } else {
              console.log('没有通知或数据格式错误');
            }
          },
          fail: (err) => {
            console.error('请求通知失败:', err);
          }
        });
      } catch (error) {
        console.error('获取通知失败:', error);
      }
    },
    closeNotification() {
      this.showNotification = false;
    },
    dismissNotification() {
      if (this.notification.id) {
        if (!this.dismissedNotifications.includes(this.notification.id)) {
          this.dismissedNotifications.push(this.notification.id);
          this.saveDismissedNotifications();
        }
      }
      this.showNotification = false;
    },
    // 获取热门帖子
    async getPopularPosts() {
      this.popularLoading = true;
      try {
        const token = uni.getStorageSync('token');
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/post/popular',
          method: 'GET',
          header: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.statusCode === 200 && res.data.posts) {
          this.popularPosts = res.data.posts;
        }
      } catch (error) {
        console.error('获取热门帖子失败:', error);
      } finally {
        this.popularLoading = false;
      }
    },
    // 跳转到帖子详情
    goPostDetail(postId) {
      uni.navigateTo({ url: `/pages/post-detail/post-detail?id=${postId}` });
    },
    // 跳转到社区页面
    goCommunity() {
      uni.switchTab({ url: '/pages/community/community' });
    },
    // 获取图片URL
    getImageUrl(url) {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `http://shengyu.supersyh.xyz${url}`;
    },
    // 获取头像URL
    getAvatarUrl(url) {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `http://shengyu.supersyh.xyz${url}`;
    }
  }
};
</script>

<style scoped>
@import '/static/styles/theme.css';

.index-container {
  padding: 20rpx 20rpx 200rpx;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 100%);
  min-height: 100vh;
  padding-top: 40rpx;
  position: relative;
  box-sizing: border-box;
}

/* 录制按钮 - 流动渐变色 */
.record-btn {
  position: fixed;
  bottom: 140rpx;
  right: 30rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 4s ease infinite, pulse-glow 2s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(255, 154, 158, 0.4);
  z-index: 999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.record-btn::before {
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

.record-btn:active {
  transform: scale(0.9);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
}

.record-btn-icon-svg {
  color: #FFFFFF;
  position: relative;
  z-index: 1;
}

/* 🔍栏 - 玻璃拟态效果 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.search-input-wrapper {
  flex: 1;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-radius: 40rpx;
  padding: 20rpx 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(255, 154, 158, 0.15);
  border: 2rpx solid rgba(255, 154, 158, 0.4);
  position: relative;
  z-index: 10;
  transition: all 0.3s ease;
}

.search-input-wrapper:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 12rpx rgba(255, 154, 158, 0.1);
}

.search-input {
  display: flex;
  align-items: center;
}

/* 扫描按钮 */
.scan-btn {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
  transition: all 0.3s ease;
}

.scan-btn:active {
  transform: scale(0.9);
  box-shadow: 0 2rpx 8rpx rgba(255, 154, 158, 0.2);
}

.scan-icon-svg {
  color: #FFFFFF;
}

.search-icon-svg {
  margin-right: 12rpx;
  color: #FF9A9E;
}

.search-placeholder {
  font-size: 28rpx;
  color: #999999;
}

/* 录制区域 */
.record-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 50rpx;
}

/* 录制按钮 - 流动渐变色 */
.record-circle {
  width: 200rpx;
  height: 200rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 4s ease infinite, pulse-glow 2s ease-in-out infinite;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(255, 154, 158, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.record-circle::before {
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

.record-circle:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
}

.record-icon-svg {
  margin-bottom: 12rpx;
  position: relative;
  z-index: 1;
  color: #FFFFFF;
}

.record-text {
  font-size: 28rpx;
  color: #FFFFFF;
  font-weight: bold;
  position: relative;
  z-index: 1;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.record-desc {
  font-size: 24rpx;
  color: #888888;
  margin-top: 8rpx;
}

/* 区块标题 */
.popular-section {
  margin-bottom: 50rpx;
  animation: slide-up 0.5s ease-out;
}

.other-section {
  margin-bottom: 50rpx;
  animation: slide-up 0.6s ease-out;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 24rpx;
  padding-left: 16rpx;
  position: relative;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4rpx;
  height: 28rpx;
  background: linear-gradient(180deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 2rpx;
}

/* 动物网格 */
.animal-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}

/* 动物卡片 - 简洁无框 */
.animal-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: 16rpx;
  padding: 16rpx 0;
  aspect-ratio: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animal-item:active {
  transform: translateY(-4rpx) scale(0.98);
}

/* 动物图标 - 白色背景 */
.animal-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 16rpx;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.animal-item:active .animal-icon {
  transform: scale(1.05);
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.12);
}

.icon {
  font-size: 52rpx;
  transition: transform 0.3s ease;
}

.animal-item:active .icon {
  transform: scale(1.15);
}

.animal-name {
  font-size: 20rpx;
  color: #444444;
  font-weight: 500;
  transition: color 0.3s ease;
}

.animal-item:active .animal-name {
  color: #FF6B9D;
}

/* 加载动画 */
.loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.loading::before {
  content: '';
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid rgba(255, 154, 158, 0.2);
  border-top-color: #FF9A9E;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading text {
  font-size: 28rpx;
  color: #888888;
}

/* 错误状态 */
.error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.error text {
  font-size: 28rpx;
  color: #FF6B6B;
  margin-bottom: 24rpx;
}

.retry-btn {
  width: 200rpx;
  height: 64rpx;
  font-size: 26rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
  border-radius: 32rpx;
  border: none;
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
  transition: all 0.3s ease;
}

.retry-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(255, 154, 158, 0.2);
}

/* 通知弹窗 */
.notification-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12rpx);
  -webkit-backdrop-filter: blur(12rpx);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.notification-content {
  background: #FFFFFF;
  border-radius: 32rpx;
  width: 82%;
  max-width: 560rpx;
  box-shadow: 0 24rpx 80rpx rgba(0, 0, 0, 0.15);
  animation: popup-scale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  position: relative;
  padding-bottom: 40rpx;
}

@keyframes popup-scale {
  from { 
    opacity: 0; 
    transform: scale(0.85) translateY(30rpx); 
  }
  to { 
    opacity: 1; 
    transform: scale(1) translateY(0); 
  }
}

/* 顶部装饰条 */
.notification-top-bar {
  height: 6rpx;
  background: linear-gradient(90deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 100%;
  animation: gradient-slide 2s linear infinite;
}

@keyframes gradient-slide {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

/* 图标区域 */
.notification-icon-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40rpx;
  margin-bottom: 24rpx;
}

.notification-icon {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFE8EC 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(255, 154, 158, 0.2);
  animation: icon-pulse 2s ease-in-out infinite;
}

@keyframes icon-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.notification-icon-svg {
  color: #FF9A9E;
}

/* 关闭按钮 */
.notification-close {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  color: #CCCCCC;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: 10;
}

.notification-close:active {
  background-color: rgba(0, 0, 0, 0.05);
  color: #999999;
}

/* 标题 */
.notification-title-wrapper {
  padding: 0 40rpx;
  text-align: center;
  margin-bottom: 20rpx;
}

.notification-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  line-height: 1.4;
}

/* 内容 */
.notification-body {
  padding: 0 40rpx 32rpx;
  text-align: center;
}

.notification-content-text {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.8;
}

/* 底部按钮 */
.notification-footer {
  padding: 0 40rpx;
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
}

.notification-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.notification-btn-primary {
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  box-shadow: 0 8rpx 24rpx rgba(255, 154, 158, 0.4);
}

.notification-btn-primary:active {
  transform: scale(0.96);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
}

.notification-btn-secondary {
  background: #F5F5F5;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

.notification-btn-secondary:active {
  background: #EEEEEE;
  transform: scale(0.96);
}

.btn-text {
  font-size: 28rpx;
  font-weight: 600;
}

.notification-btn-primary .btn-text {
  color: #FFFFFF;
}

.notification-btn-secondary .btn-text {
  color: #666666;
}

/* 推荐区域 */
.recommend-section {
  margin-top: 16rpx;
  margin-bottom: 32rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.more-btn {
  display: flex;
  align-items: center;
  gap: 2rpx;
  padding: 4rpx 10rpx;
  background: rgba(255, 154, 158, 0.1);
  border-radius: 16rpx;
  transition: all 0.3s ease;
}

.more-btn:active {
  background: rgba(255, 154, 158, 0.2);
  transform: scale(0.95);
}

.more-text {
  font-size: 20rpx;
  color: #FF6B9D;
  font-weight: 500;
}

.more-icon {
  color: #FF6B9D;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.recommend-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #FFFFFF;
  border-radius: 8rpx;
  padding: 10rpx 12rpx;
  box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.recommend-item:active {
  transform: translateY(-1rpx);
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
}

.recommend-rank {
  width: 32rpx;
  height: 32rpx;
  border-radius: 6rpx;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: bold;
  color: #888888;
  flex-shrink: 0;
}

.recommend-rank.rank-top {
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
}

.recommend-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.recommend-text {
  font-size: 24rpx;
  color: #333333;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recommend-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recommend-author {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.author-avatar {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #F5F5F5;
}

.author-avatar-placeholder {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #CCCCCC;
}

.author-name {
  font-size: 18rpx;
  color: #888888;
}

.recommend-stats {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 2rpx;
}

.stat-icon {
  color: #FF9A9E;
}

.stat-num {
  font-size: 18rpx;
  color: #888888;
}

.recommend-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 6rpx;
  flex-shrink: 0;
  background: #F5F5F5;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0;
  background: #FFFFFF;
  border-radius: 10rpx;
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.03);
}

.empty-icon {
  color: #CCCCCC;
  margin-bottom: 12rpx;
}

.empty-text {
  font-size: 24rpx;
  color: #999999;
}

/* 更新弹窗 */
.update-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.update-content {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  width: 80%;
  max-width: 500rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.2);
  animation: popup-fade 0.3s;
}

.update-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #EEEEEE;
}

.update-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.update-close {
  font-size: 40rpx;
  color: #999999;
  cursor: pointer;
}

.update-body {
  padding: 30rpx;
  min-height: 150rpx;
}

.update-version {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  display: block;
}

.update-desc {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.5;
}

.update-footer {
  padding: 0 30rpx 30rpx;
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
}

.update-btn {
  flex: 1;
  height: 60rpx;
  font-size: 28rpx;
  border-radius: 30rpx;
}

.update-btn.cancel {
  background-color: #F0F0F0;
  color: #666666;
}

.update-btn.confirm {
  background-color: #FF69B4;
  color: #FFFFFF;
}

/* 动画定义 */
@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 8rpx 32rpx rgba(255, 154, 158, 0.4);
  }
  50% {
    box-shadow: 0 12rpx 48rpx rgba(255, 154, 158, 0.6);
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>