<template>
  <view class="community-container page-enter">
    <view class="publish-btn" @click="goPublish">
      <text class="publish-icon">+</text>
    </view>
    
    <view class="post-list">
      <view v-if="loading" class="loading-container">
        <view class="loading-animation">
          <view class="loading-dot"></view>
          <view class="loading-dot"></view>
          <view class="loading-dot"></view>
        </view>
        <text class="loading-text">加载中...</text>
      </view>
      <view v-else-if="error" class="error">
        <text>{{ error }}</text>
        <button @click="getPosts" class="retry-btn">重试</button>
      </view>
      <view v-else class="post-list-content">
        <view class="post-item" v-for="(post, index) in posts" :key="post.id" @click="goPostDetail(post.id)" :style="{ animationDelay: index * 0.05 + 's' }">
          <view class="post-header">
            <image :src="getImageUrl(post.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.username || 'User')}&background=FF69B4&color=fff&size=60`" class="avatar" mode="aspectFit"></image>
            <view class="user-info">
              <text class="username">{{ post.username }}</text>
              <text class="post-time">{{ formatTime(post.created_at) }}</text>
            </view>
          </view>
          <view class="post-content">
            <text class="content">{{ post.content }}</text>
            <image v-if="post.image_url" :src="getImageUrl(post.image_url)" class="post-image" mode="aspectFit"></image>
            <view v-if="post.sound_url" class="audio-container" @click="playSound(post.sound_url)">
              <text class="audio-icon">🎵</text>
              <text class="audio-text">点击播放声音</text>
            </view>
          </view>
          <view class="post-footer">
            <view class="action-item" @click.stop="likePost(post.id)">
              <text class="action-icon" :class="{ liked: post.liked }">{{ post.liked ? '♥' : '♡' }}</text>
              <text class="action-text" :class="{ liked: post.liked }">{{ post.like_count }}</text>
            </view>
            <view class="action-item" @click.stop="showComments(post.id)">
              <text class="action-icon">💬</text>
              <text class="action-text">{{ post.comment_count }}</text>
            </view>
          </view>
        </view>
        <view v-if="loadingMore" class="loading-more">
          <text>加载更多...</text>
        </view>
      </view>
    </view>
    
    <!-- 评论上拉页面 -->
    <view v-if="showCommentPopup" class="comment-popup">
      <view class="comment-popup-content">
        <!-- 头部 -->
        <view class="comment-popup-header">
          <text class="comment-popup-title">评论</text>
          <text class="comment-popup-close" @click="closeCommentPopup">✕</text>
        </view>
        
        <!-- 评论列表 -->
        <view class="comment-list">
          <view v-if="loadingComments" class="loading">
            <text>加载中...</text>
          </view>
          <view v-else-if="comments.length === 0" class="empty-comments">
            <text>暂无评论</text>
          </view>
          <view v-else>
            <view class="comment-item" v-for="comment in comments" :key="comment.id">
              <image :src="getImageUrl(comment.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.username || 'User')}&background=FF69B4&color=fff&size=50`" class="comment-avatar" mode="aspectFit"></image>
              <view class="comment-content">
                <view class="comment-header">
                  <text class="comment-username">{{ comment.username }}</text>
                  <text class="comment-time">{{ formatTime(comment.created_at) }}</text>
                </view>
                <text class="comment-text">{{ comment.content }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 评论输入 -->
        <view class="comment-input-container">
          <input type="text" v-model="commentContent" placeholder="写下你的评论..." class="comment-input" />
          <button @click="sendComment" class="send-btn" :disabled="!commentContent">发送</button>
        </view>
      </view>
    </view>
    
    <!-- 遮罩层 -->
    <view v-if="showCommentPopup" class="overlay" @click="closeCommentPopup"></view>
    
    <!-- 底部导航栏 -->
    <custom-tabbar :current-index="1" :unread-count="unreadMessageCount" @change="onTabChange"></custom-tabbar>
  </view>
</template>

<script>
import api, { getImageUrl } from '../../utils/api.js';
export default {
  data() {
    return {
      posts: [],
      comments: [],
      currentPostId: null,
      commentContent: '',
      loading: false,
      loadingMore: false,
      loadingComments: false,
      error: '',
      page: 1,
      pageSize: 10,
      hasMore: true,
      showCommentPopup: false,
      updateTimer: null,
      unreadMessageCount: 0
    };
  },
  onLoad() {
    this.getPosts();
    this.startAutoUpdate();
    this.loadUnreadCount();
  },
  onUnload() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  },
  onShow() {
    this.page = 1;
    this.hasMore = true;
    this.getPosts();
    this.closeCommentPopup();
  },
  methods: {
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
    // 底部导航切换
    onTabChange(index) {
      if (index === 0) {
        uni.redirectTo({ url: '/pages/index/index' });
      } else if (index === 2) {
        uni.redirectTo({ url: '/pages/profile/profile' });
      }
    },
    startAutoUpdate() {
      this.updateTimer = setInterval(() => {
        this.page = 1;
        this.hasMore = true;
        this.getPosts();
      }, 30000);
    },
    onPullDownRefresh() {
      this.page = 1;
      this.hasMore = true;
      this.getPosts();
    },
    onReachBottom() {
      if (!this.loadingMore && this.hasMore) {
        this.loadingMore = true;
        this.page++;
        this.getPosts(true);
      }
    },
    async getPosts(loadMore = false) {
      if (!loadMore) {
        this.loading = true;
        this.error = '';
      }
      
      try {
        const res = await uni.request({
          url: api.post.list,
          method: 'GET'
        });
        
        if (res.data.posts) {
          if (loadMore) {
            this.posts = [...this.posts, ...res.data.posts];
          } else {
            this.posts = res.data.posts;
          }
          this.hasMore = res.data.posts.length === this.pageSize;
        } else {
          this.hasMore = false;
          // 如果没有帖子，设置posts为空数组
          if (!loadMore) {
            this.posts = [];
          }
        }
      } catch (error) {
        this.error = '获取帖子失败，请重试';
        if (!loadMore) {
          this.posts = [];
        }
      } finally {
        this.loading = false;
        this.loadingMore = false;
        uni.stopPullDownRefresh();
      }
    },
    goPublish() {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后发布帖子',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/login/login' });
            }
          }
        });
      } else {
        uni.navigateTo({ url: '/pages/publish/publish' });
      }
    },
    async likePost(postId) {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      try {
        const res = await uni.request({
          url: api.post.like(postId),
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data.message) {
          this.getPosts();
        }
      } catch (error) {
      }
    },
    async showComments(postId) {
      this.currentPostId = postId;
      this.loadingComments = true;
      
      try {
        const res = await uni.request({
          url: api.post.comments(postId),
          method: 'GET'
        });
        if (res.data.comments) {
          this.comments = res.data.comments;
        } else {
          this.comments = [];
        }
        this.showCommentPopup = true;
      } catch (error) {
        this.comments = [];
        this.showCommentPopup = true;
      } finally {
        this.loadingComments = false;
      }
    },
    closeCommentPopup() {
      this.showCommentPopup = false;
      this.commentContent = '';
    },
    async sendComment() {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      if (!this.commentContent) {
        uni.showToast({ title: '请输入评论内容', icon: 'none' });
        return;
      }
      
      try {
        const res = await uni.request({
          url: api.post.comment(this.currentPostId),
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`
          },
          data: {
            content: this.commentContent
          }
        });
        if (res.data.message === '评论成功') {
          this.commentContent = '';
          this.showComments(this.currentPostId);
          uni.showToast({ title: '评论成功', icon: 'success' });
        }
      } catch (error) {
      }
    },
    formatTime(time) {
      if (!time) return '';
      const date = new Date(time);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) {
        return '刚刚';
      }
      if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前';
      }
      if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前';
      }
      if (diff < 604800000) {
        return Math.floor(diff / 86400000) + '天前';
      }
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      // 如果是今年，不显示年份
      if (year === now.getFullYear()) {
        return `${month}月${day}日 ${hours}:${minutes}`;
      }
      
      return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    },
    playSound(url) {
      uni.showToast({ title: '播放声音', icon: 'none' });
      // 这里可以添加实际的声音播放逻辑
    },
    goPostDetail(postId) {
      // 跳转到帖子详情页面
      uni.navigateTo({ url: `/pages/post-detail/post-detail?id=${postId}` });
    },
    getImageUrl
  }
};
</script>

<style scoped>
@import '/static/styles/theme.css';

.community-container {
  padding: 20rpx;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 100%);
  min-height: 100vh;
  padding-top: 60rpx;
  position: relative;
}

/* 发布按钮 - 流动渐变色 */
.publish-btn {
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

.publish-btn::before {
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

.publish-btn:active {
  transform: scale(0.9);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
}

.publish-icon {
  font-size: 52rpx;
  color: #FFFFFF;
  font-weight: bold;
  position: relative;
  z-index: 1;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.post-list {
  margin-bottom: 120rpx;
}

/* 加载动画 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.loading-animation {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.loading-dot {
  width: 20rpx;
  height: 20rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 50%;
  animation: loading-bounce 1.4s ease-in-out infinite both;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes loading-bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  font-size: 28rpx;
  color: #888;
}

.post-list-content {
  animation: fade-in 0.3s ease;
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

/* 帖子卡片 - 玻璃拟态效果 */
.post-item {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.08);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  animation: slide-up 0.4s ease backwards;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.post-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3rpx;
  background: linear-gradient(90deg, transparent 0%, #FF9A9E 50%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.post-item:active {
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 24rpx rgba(255, 154, 158, 0.12);
}

.post-item:active::before {
  opacity: 1;
}

.post-item .post-footer .action-item {
  pointer-events: auto;
  z-index: 1;
}

.post-item .audio-container {
  pointer-events: auto;
  z-index: 1;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}

.avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 15rpx;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.username {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
}

.post-time {
  font-size: 20rpx;
  color: #999999;
}

.action-icon.liked,
.action-text.liked {
  color: #FF69B4;
}

.post-content {
  margin-bottom: 15rpx;
}

.content {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.5;
  margin-bottom: 15rpx;
}

.post-image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 10rpx;
  margin-bottom: 15rpx;
  object-fit: cover;
}

.audio-container {
  display: flex;
  align-items: center;
  background-color: #F8F8F8;
  border: 1rpx solid #EEEEEE;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 15rpx;
}

.audio-icon {
  font-size: 32rpx;
  margin-right: 15rpx;
}

.audio-text {
  font-size: 24rpx;
  color: #666666;
}

.post-footer {
  display: flex;
  border-top: 1rpx solid #EEEEEE;
  padding-top: 15rpx;
}

.action-item {
  display: flex;
  align-items: center;
  margin-right: 40rpx;
}

.action-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.action-text {
  font-size: 24rpx;
  color: #666666;
}

.popup-content {
  background-color: #FFFFFF;
  border-radius: 20rpx 20rpx 0 0;
  padding: 20rpx;
  height: 60vh;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 15rpx;
  border-bottom: 1rpx solid #EEEEEE;
}

.popup-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.close-btn {
  font-size: 28rpx;
  color: #999999;
}

.comment-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20rpx;
}

.comment-item {
  display: flex;
  margin-bottom: 20rpx;
}

.comment-avatar {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  margin-right: 15rpx;
}

.comment-content {
  flex: 1;
}

.comment-username {
  font-size: 24rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 5rpx;
}

.comment-text {
  font-size: 24rpx;
  color: #333333;
  line-height: 1.4;
  margin-bottom: 5rpx;
}

.comment-time {
  font-size: 20rpx;
  color: #999999;
}

.comment-input {
  display: flex;
  align-items: center;
  border-top: 1rpx solid #EEEEEE;
  padding-top: 15rpx;
}

.input {
  flex: 1;
  height: 60rpx;
  border: 2rpx solid #FFB6C1;
  border-radius: 30rpx;
  padding: 0 20rpx;
  font-size: 24rpx;
  margin-right: 15rpx;
}

.send-btn {
  height: 60rpx;
  padding: 0 30rpx;
  background-color: #FF69B4;
  color: #FFFFFF;
  border-radius: 30rpx;
  font-size: 24rpx;
  font-weight: bold;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.loading text {
  font-size: 28rpx;
  color: #666666;
}

.error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.error text {
  font-size: 28rpx;
  color: #FF4500;
  margin-bottom: 20rpx;
}

.retry-btn {
  width: 200rpx;
  height: 60rpx;
  font-size: 24rpx;
  background-color: #FF69B4;
  color: #FFFFFF;
  border-radius: 30rpx;
}

.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30rpx 0;
}

.loading-more text {
  font-size: 24rpx;
  color: #999999;
}
  /* 评论上拉页面 */
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
  
  .comment-popup {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    animation: slideUp 0.3s ease-out;
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  .comment-popup-content {
    background-color: #fff;
    border-radius: 20rpx 20rpx 0 0;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
  }
  
  .comment-popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx;
    border-bottom: 1rpx solid #eee;
  }
  
  .comment-popup-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
  
  .comment-popup-close {
    font-size: 36rpx;
    color: #666;
    cursor: pointer;
  }
  
  .comment-list {
    flex: 1;
    overflow-y: auto;
    padding: 20rpx;
  }
  
  .comment-item {
    display: flex;
    margin-bottom: 20rpx;
  }
  
  .comment-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    margin-right: 15rpx;
  }
  
  .comment-content {
    flex: 1;
  }
  
  .comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5rpx;
  }
  
  .comment-username {
    font-size: 26rpx;
    font-weight: bold;
    color: #333;
  }
  
  .comment-time {
    font-size: 22rpx;
    color: #999;
  }
  
  .comment-text {
    font-size: 28rpx;
    color: #333;
    line-height: 1.4;
  }
  
  .empty-comments {
    text-align: center;
    color: #999;
    padding: 40rpx 0;
  }
  
  .comment-input-container {
    display: flex;
    padding: 20rpx;
    border-top: 1rpx solid #eee;
    background-color: #fff;
  }
  
  .comment-input {
    flex: 1;
    height: 80rpx;
    border: 1rpx solid #ddd;
    border-radius: 40rpx;
    padding: 0 20rpx;
    font-size: 28rpx;
    margin-right: 15rpx;
  }
  
  .send-btn {
    width: 120rpx;
    height: 80rpx;
    border-radius: 40rpx;
    background-color: #FF69B4;
    color: #fff;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .send-btn:disabled {
    background-color: #ccc;
  }
</style>