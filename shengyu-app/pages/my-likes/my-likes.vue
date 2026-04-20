<template>
  <view class="my-likes-container page-enter">
    <!-- 标题栏 -->
    <view class="header">
      <text class="back-icon" @click="goBack">‹</text>
      <text class="header-title">我的点赞</text>
      <view class="header-right"></view>
    </view>
    
    <!-- 点赞帖子列表 -->
    <view class="likes-list">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-else-if="error" class="error">
        <text>{{ error }}</text>
        <button @click="getMyLikes" class="retry-btn">重试</button>
      </view>
      <view v-else-if="posts.length === 0" class="empty">
        <text class="empty-icon">♥</text>
        <text class="empty-text">还没有点赞过帖子</text>
        <button @click="goCommunity" class="community-btn">去社区</button>
      </view>
      <view v-else>
        <view class="post-item" v-for="post in posts" :key="post.id" @click="goToPostDetail(post.id)">
          <view class="post-header">
            <view class="avatar-wrapper">
              <image :src="getImageUrl(post.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.username || 'User')}&background=FF69B4&color=fff&size=60`" class="avatar" mode="aspectFill"></image>
            </view>
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
            <view class="action-item" @click="likePost(post.id)">
              <text class="action-icon">♥</text>
              <text class="action-text">{{ post.like_count }}</text>
            </view>
            <view class="action-item" @click="showComments(post.id)">
              <text class="action-icon">💬</text>
              <text class="action-text">{{ post.comment_count }}</text>
            </view>
          </view>
          
          <!-- 点赞用户列表 -->
          <view class="likes-section" v-if="post.likes && post.likes.length > 0">
            <text class="likes-title">点赞的用户</text>
            <view class="likes-list-small">
              <view class="like-item" v-for="(like, index) in post.likes" :key="like.id || index">
                <image :src="getImageUrl(like.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(like.username || 'User')}&background=FF69B4&color=fff&size=50`" class="like-avatar" mode="aspectFill"></image>
                <text class="like-username">{{ like.username }}</text>
              </view>
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
              <image :src="getImageUrl(comment.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.username || 'User')}&background=FF69B4&color=fff&size=50`" class="comment-avatar" mode="aspectFill"></image>
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
      showCommentPopup: false
    };
  },
  onLoad() {
    this.getMyLikes();
  },
  onPullDownRefresh() {
    this.page = 1;
    this.hasMore = true;
    this.getMyLikes();
  },
  onReachBottom() {
    if (!this.loadingMore && this.hasMore) {
      this.loadingMore = true;
      this.page++;
      this.getMyLikes(true);
    }
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    goCommunity() {
      uni.reLaunch({ url: '/pages/community/community' });
    },
    goToPostDetail(postId) {
      uni.navigateTo({ url: `/pages/post-detail/post-detail?id=${postId}` });
    },
    async getMyLikes(loadMore = false) {
      if (!loadMore) {
        this.loading = true;
        this.error = '';
      }
      
      const token = uni.getStorageSync('token');
      if (!token) {
        this.error = '请先登录';
        this.loading = false;
        return;
      }
      
      try {
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/post/likes',
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`
          },
          data: {
            page: this.page,
            pageSize: this.pageSize
          }
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
        }
      } catch (error) {
        console.error('获取我的点赞失败:', error);
        this.error = '获取点赞失败，请重试';
      } finally {
        this.loading = false;
        this.loadingMore = false;
        uni.stopPullDownRefresh();
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
          url: `http://shengyu.supersyh.xyz/api/post/like/${postId}`,
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data.message) {
          this.getMyLikes();
        }
      } catch (error) {
        console.error('取消点赞失败:', error);
      }
    },
    async showComments(postId) {
      this.currentPostId = postId;
      this.loadingComments = true;
      
      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/post/comments/${postId}`,
          method: 'GET'
        });
        if (res.data.comments) {
          this.comments = res.data.comments;
        } else {
          this.comments = [];
        }
        this.showCommentPopup = true;
      } catch (error) {
        console.error('获取评论失败:', error);
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
          url: `http://shengyu.supersyh.xyz/api/post/comment/${this.currentPostId}`,
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
          // 重新获取评论列表
          this.showComments(this.currentPostId);
          uni.showToast({ title: '评论成功', icon: 'success' });
        }
      } catch (error) {
        console.error('发送评论失败:', error);
      }
    },
    formatTime(time) {
      if (!time) return '';
      const date = new Date(time);
      const now = new Date();
      const diff = now - date;
      
      // 小于1分钟
      if (diff < 60000) {
        return '刚刚';
      }
      // 小于1小时
      if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前';
      }
      // 小于24小时
      if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前';
      }
      // 小于7天
      if (diff < 604800000) {
        return Math.floor(diff / 86400000) + '天前';
      }
      
      // 超过7天显示具体日期
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
    },
    getImageUrl
  }
};
</script>

<style scoped>
.my-likes-container {
  min-height: 100vh;
  background-color: #F8F8F8;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 5s ease infinite;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 8rpx 24rpx rgba(255, 154, 158, 0.25);
}

.back-icon {
  font-size: 48rpx;
  color: #FFFFFF;
  font-weight: bold;
  padding: 0 20rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #FFFFFF;
}

.header-right {
  width: 60rpx;
}

.likes-list {
  padding: 20rpx;
}

.post-item {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}

.avatar-wrapper {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 15rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 5rpx;
}

.post-time {
  font-size: 20rpx;
  color: #999999;
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
  width: 100%;
  height: 300rpx;
  border-radius: 10rpx;
  margin-bottom: 15rpx;
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
  margin-bottom: 20rpx;
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

.likes-section {
  border-top: 1rpx solid #EEEEEE;
  padding-top: 15rpx;
}

.likes-title {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 15rpx;
  display: block;
}

.likes-list-small {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.like-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10rpx;
  background-color: #FFF0F5;
  border-radius: 15rpx;
  min-width: 100rpx;
}

.like-avatar-wrapper {
  width: 50rpx;
  height: 50rpx;
  border-radius: 50%;
  margin-bottom: 8rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
}

.like-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.like-username {
  font-size: 20rpx;
  color: #666666;
  text-align: center;
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

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 150rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 40rpx;
}

.community-btn {
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

.comment-avatar-wrapper {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 15rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
}

.comment-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
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
