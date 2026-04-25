<template>
  <view class="post-detail-container page-enter">
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
    <view v-else-if="error" class="error">
      <text>{{ error }}</text>
      <button @click="loadPostDetail" class="retry-btn">重试</button>
    </view>
    <view v-else-if="post">
      <!-- 帖子内容 -->
      <view class="post-content">
        <view class="post-header">
          <view class="avatar-wrapper" @click="goToUserProfile(post.user_id)">
            <image :src="getImageUrl(post.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.username || 'User')}&background=FF69B4&color=fff&size=60`" class="avatar" mode="aspectFill"></image>
          </view>
          <view class="user-info" @click="goToUserProfile(post.user_id)">
            <text class="username">{{ post.username }}</text>
            <text class="post-time">{{ formatTime(post.created_at) }}</text>
          </view>
          <view v-if="String(post.user_id) !== String(currentUserId)" class="follow-btn-small" :class="{ 'following': post.is_following }" @click.stop="toggleFollow(post)">
            <text class="follow-btn-text">{{ post.is_following ? '已关注' : '+ 关注' }}</text>
          </view>
        </view>
        <text class="content">{{ post.content }}</text>
        <image v-if="post.image_url" :src="getImageUrl(post.image_url)" class="post-image" mode="aspectFit"></image>
        <view v-if="post.sound_url" class="audio-container" @click="playSound(post.sound_url)">
          <text class="audio-icon">🎵</text>
          <text class="audio-text">点击播放声音</text>
        </view>
        <view class="post-footer">
          <view class="action-item" @click="likePost">
            <text class="action-icon">{{ post.is_liked ? '♥' : '♡' }}</text>
            <text class="action-text">{{ post.like_count }}</text>
          </view>
          <view class="action-item">
            <text class="action-icon">💬</text>
            <text class="action-text">{{ post.comment_count }}</text>
          </view>
        </view>
      </view>
      
      <!-- 评论列表 -->
      <view class="comments-section">
        <text class="comments-title">评论</text>
        <view v-if="loadingComments" class="loading">
          <text>加载评论中...</text>
        </view>
        <view v-else-if="comments.length === 0" class="empty-comments">
          <text>暂无评论</text>
        </view>
        <view v-else>
          <view class="comment-item" v-for="comment in comments" :key="comment.id">
            <view class="comment-avatar-wrapper" @click="goToUserProfile(comment.user_id)">
              <image :src="getImageUrl(comment.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.username || 'User')}&background=FF69B4&color=fff&size=50`" class="comment-avatar" mode="aspectFill"></image>
            </view>
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
</template>

<script>
import api, { getImageUrl } from '../../utils/api.js';
export default {
  data() {
    return {
      postId: '',
      currentUserId: '',
      post: null,
      comments: [],
      commentContent: '',
      loading: false,
      loadingComments: false,
      error: ''
    };
  },
  onLoad(options) {
    this.postId = options.id;
    this.currentUserId = uni.getStorageSync('userId');
    this.loadPostDetail();
    this.loadComments();
    // 监听关注状态变化事件
    uni.$on('followStatusChanged', this.handleFollowStatusChanged);
  },
  onUnload() {
    // 取消监听
    uni.$off('followStatusChanged', this.handleFollowStatusChanged);
  },
  methods: {
    // 更新缓存的关注列表
    updateFollowingCache(userId, isFollowing) {
      const followingSet = new Set(uni.getStorageSync('followingSet') || []);
      if (isFollowing) {
        followingSet.add(userId);
      } else {
        followingSet.delete(userId);
      }
      uni.setStorageSync('followingSet', Array.from(followingSet));
    },

    async loadPostDetail() {
      this.loading = true;
      this.error = '';

      try {
        // 获取用户点赞的帖子ID列表（用于判断当前帖子是否已点赞）
        const token = uni.getStorageSync('token');
        let likedIdsSet = new Set();
        if (token) {
          const likedPostsSet = uni.getStorageSync('likedPostsSet') || [];
          likedIdsSet = new Set(likedPostsSet);
        }

        const res = await uni.request({
          url: api.post.detail(this.postId),
          method: 'GET'
        });
        if (res.data.post) {
          // 将 is_following 转换为布尔值
          // 优先使用后端返回的is_liked字段，如果没有则使用本地缓存
          const isLikedFromServer = Boolean(res.data.post.is_liked);
          const isLikedFromCache = likedIdsSet.has(String(this.postId));
          this.post = {
            ...res.data.post,
            is_following: Boolean(res.data.post.is_following),
            is_liked: isLikedFromServer || isLikedFromCache
          };
        } else {
          this.error = '获取帖子详情失败';
        }
      } catch (error) {
        console.error('获取帖子详情失败:', error);
        this.error = '网络错误，请重试';
      } finally {
        this.loading = false;
      }
    },
    async loadComments() {
      this.loadingComments = true;
      
      try {
        const res = await uni.request({
          url: api.post.comments(this.postId),
          method: 'GET'
        });
        if (res.data.comments) {
          this.comments = res.data.comments;
        } else {
          this.comments = [];
        }
      } catch (error) {
        console.error('获取评论失败:', error);
        this.comments = [];
      } finally {
        this.loadingComments = false;
      }
    },
    async likePost() {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }

      // 乐观更新UI
      const originalLiked = this.post.is_liked;
      const originalCount = this.post.like_count || 0;
      this.post.is_liked = !originalLiked;
      this.post.like_count = originalLiked ? originalCount - 1 : originalCount + 1;

      try {
        const res = await uni.request({
          url: api.post.like(this.postId),
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`
          }
        });
        if (res.data.message) {
          // 更新本地缓存的点赞列表
          const likedPostsSet = new Set(uni.getStorageSync('likedPostsSet') || []);
          if (originalLiked) {
            // 取消点赞，从缓存中移除
            likedPostsSet.delete(String(this.postId));
          } else {
            // 点赞，添加到缓存
            likedPostsSet.add(String(this.postId));
          }
          uni.setStorageSync('likedPostsSet', Array.from(likedPostsSet));

          // 显示提示
          uni.showToast({
            title: originalLiked ? '取消点赞' : '点赞成功',
            icon: 'none',
            duration: 1000
          });
        } else {
          // 请求失败，恢复原始状态
          this.post.is_liked = originalLiked;
          this.post.like_count = originalCount;
        }
      } catch (error) {
        // 网络错误，恢复原始状态
        this.post.is_liked = originalLiked;
        this.post.like_count = originalCount;
        console.error('点赞失败:', error);
        uni.showToast({ title: '操作失败，请重试', icon: 'none' });
      }
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
          url: api.post.comment(this.postId),
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
          this.loadComments();
          // 重新加载帖子详情以更新评论数
          this.loadPostDetail();
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
      // 这里可以添加实际的声音播放逻辑
    },
    goToUserProfile(userId) {
      if (!userId) {
        uni.showToast({ title: '无法获取用户信息', icon: 'none' });
        return;
      }
      uni.navigateTo({ url: `/pages/user-profile/user-profile?id=${userId}` });
    },
    // 处理关注状态变化事件
    handleFollowStatusChanged(data) {
      const { userId, isFollowing } = data;
      // 如果当前帖子的作者是被关注的用户，更新关注状态
      if (this.post && String(this.post.user_id) === String(userId)) {
        this.post.is_following = isFollowing;
      }
    },
    async toggleFollow(post) {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后再关注用户',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/login/login' });
            }
          }
        });
        return;
      }
      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/social/follow/${post.user_id}`,
          method: 'POST',
          header: { Authorization: `Bearer ${token}` }
        });
        if (res.statusCode === 200) {
          const isFollowing = Boolean(res.data.isFollowing);
          // 使用新对象触发响应式更新
          this.post = { ...this.post, is_following: isFollowing };
          // 更新缓存的关注列表
          this.updateFollowingCache(String(post.user_id), isFollowing);
          // 触发全局事件通知其他页面
          uni.$emit('followStatusChanged', { userId: post.user_id, isFollowing });
          uni.showToast({ title: res.data.message, icon: 'none' });
        }
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
    },
    getImageUrl
  }
};
</script>

<style scoped>
@import '/static/styles/theme.css';

.post-detail-container {
  padding: 24rpx;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 100%);
  min-height: 100vh;
  position: relative;
}

/* 帖子内容卡片 - 玻璃拟态 */
.post-content {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.08);
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

.follow-btn-small {
  padding: 8rpx 20rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 24rpx;
  margin-left: 16rpx;
}

.follow-btn-small.following {
  background: #F0F0F0;
}

.follow-btn-text {
  font-size: 24rpx;
  color: #FFFFFF;
  font-weight: 500;
}

.follow-btn-small.following .follow-btn-text {
  color: #999999;
  display: block;
}

.post-time {
  font-size: 20rpx;
  color: #999999;
  display: block;
}

.content {
  font-size: 30rpx;
  color: #444444;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

.post-image {
  width: 100%;
  height: 320rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

/* 音频容器 - 玻璃拟态 */
.audio-container {
  display: flex;
  align-items: center;
  background: rgba(255, 154, 158, 0.08);
  border: 1rpx solid rgba(255, 154, 158, 0.15);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  cursor: pointer;
  transition: all 0.3s ease;
}

.audio-container:active {
  background: rgba(255, 154, 158, 0.12);
  transform: scale(0.98);
}

.audio-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.audio-text {
  font-size: 26rpx;
  color: #666666;
}

.post-footer {
  display: flex;
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  padding-top: 20rpx;
}

.action-item {
  display: flex;
  align-items: center;
  margin-right: 40rpx;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-item:active {
  transform: scale(0.95);
}

.action-icon {
  font-size: 36rpx;
  margin-right: 8rpx;
  transition: all 0.3s ease;
}

.action-text {
  font-size: 26rpx;
  color: #666666;
  font-weight: 500;
}

/* 评论区域 - 玻璃拟态 */
.comments-section {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 120rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.08);
}

.comments-title {
  font-size: 34rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 24rpx;
  display: block;
}

.comment-item {
  display: flex;
  margin-bottom: 20rpx;
}

.comment-avatar-wrapper {
  width: 50rpx;
  height: 50rpx;
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
  font-size: 24rpx;
  font-weight: bold;
  color: #333333;
}

.comment-time {
  font-size: 20rpx;
  color: #999999;
}

.comment-text {
  font-size: 24rpx;
  color: #333333;
  line-height: 1.4;
}

.empty-comments {
  text-align: center;
  color: #999999;
  padding: 40rpx 0;
}

/* 评论输入区域 - 玻璃拟态 */
.comment-input-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.comment-input {
  flex: 1;
  height: 84rpx;
  border: 2rpx solid rgba(255, 154, 158, 0.2);
  border-radius: 42rpx;
  padding: 0 28rpx;
  font-size: 28rpx;
  margin-right: 16rpx;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.3s ease;
}

.comment-input:focus {
  border-color: rgba(255, 154, 158, 0.4);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.1);
}

/* 发送按钮 - 渐变 */
.send-btn {
  width: 130rpx;
  height: 84rpx;
  border-radius: 42rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
  font-size: 28rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
  transition: all 0.3s ease;
}

.send-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(255, 154, 158, 0.2);
}

.send-btn:disabled {
  background: #CCCCCC;
  box-shadow: none;
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
  border: none;
}
</style>