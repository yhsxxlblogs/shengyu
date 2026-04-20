<template>
  <view class="user-profile-container page-enter">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <image :src="getImageUrl(user.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=FF69B4&color=fff&size=200`" class="user-avatar" mode="aspectFill"></image>
      <text class="user-name">{{ user.username }}</text>
      <text class="user-email">{{ user.email }}</text>
      
      <!-- 关注按钮 -->
      <view v-if="String(userId) !== String(currentUserId)" class="follow-btn" :class="{ 'following': isFollowing, 'loading': followLoading }" @click.stop="toggleFollow">
        <text class="follow-btn-text">{{ followLoading ? '...' : (isFollowing ? '已关注' : '关注') }}</text>
      </view>
      
      <!-- 统计数据 -->
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
    
    <!-- Tab切换 -->
    <view class="tab-container">
      <view class="tab-item" :class="{ active: activeTab === 'audios' }" @click="activeTab = 'audios'">
        <text>公开音频</text>
      </view>
      <view class="tab-item" :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">
        <text>用户动态</text>
      </view>
    </view>
    
    <!-- 加载中 -->
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
    
    <!-- 公开音频列表 -->
    <view v-else-if="activeTab === 'audios'" class="content-section">
      <view v-if="userAudios.length === 0" class="empty-state">
        <text class="empty-icon">🎵</text>
        <text class="empty-text">暂无公开音频</text>
      </view>
      
      <view v-else class="audio-list">
        <view class="audio-item" v-for="(audio, index) in userAudios" :key="audio.id" @click="playSound(audio, index)">
          <text class="audio-icon">{{ getAnimalIcon(audio.animal_type) }}</text>
          <view class="audio-info">
            <text class="audio-name">{{ getAnimalName(audio.animal_type) }}</text>
            <text class="audio-emotion">{{ audio.emotion }}</text>
          </view>
          <text class="play-icon">{{ isPlaying === index ? '⏸️' : '▶️' }}</text>
        </view>
      </view>
    </view>
    
    <!-- 用户动态列表 -->
    <view v-else-if="activeTab === 'posts'" class="content-section">
      <!-- 帖子列表 -->
      <view v-if="userPosts.length > 0" class="posts-section">
        <text class="section-subtitle">发布的帖子</text>
        <view class="post-item" v-for="post in userPosts" :key="post.id" @click="goPostDetail(post.id)">
          <view class="post-content">
            <text class="post-text">{{ post.content }}</text>
            <image v-if="post.image_url" :src="getImageUrl(post.image_url)" class="post-image" mode="aspectFill"></image>
          </view>
          <view class="post-meta">
            <text class="post-time">{{ formatTime(post.created_at) }}</text>
            <view class="post-stats">
              <text class="stat-item">♥ {{ post.like_count || 0 }}</text>
              <text class="stat-item">💬 {{ post.comment_count || 0 }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 评论列表 -->
      <view v-if="userComments.length > 0" class="comments-section">
        <text class="section-subtitle">发表的评论</text>
        <view class="comment-item" v-for="comment in userComments" :key="comment.id" @click="goPostDetail(comment.post_id)">
          <text class="comment-content">{{ comment.content }}</text>
          <view class="comment-meta">
            <text class="comment-time">{{ formatTime(comment.created_at) }}</text>
            <text class="comment-post">评论于: {{ truncateText(comment.post_content, 15) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="userPosts.length === 0 && userComments.length === 0" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无动态</text>
      </view>
    </view>
  </view>
</template>

<script>
import api, { getImageUrl } from '../../utils/api.js';

export default {
  data() {
    return {
      userId: '',
      currentUserId: '',
      user: {
        id: '',
        username: '',
        email: '',
        avatar: '',
        posts: 0,
        likes: 0,
        comments: 0
      },
      userAudios: [],
      userPosts: [],
      userComments: [],
      loading: false,
      activeTab: 'audios',
      isFollowing: false,
      isPlaying: -1,
      audioContext: null,
      followLoading: false
    };
  },
  onLoad(options) {
    this.currentUserId = uni.getStorageSync('userId');
    if (options.id) {
      this.userId = options.id;
      this.loadUserProfile(options.id);
      this.checkFollowStatus(options.id);
    }
  },
  onUnload() {
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
      this.audioContext = null;
    }
  },
  methods: {
    async loadUserProfile(userId) {
      this.loading = true;
      try {
        const res = await uni.request({
          url: `${api.auth.user}/${userId}`,
          method: 'GET'
        });
        
        if (res.statusCode === 200 && res.data.user) {
          this.user = res.data.user;
          this.userAudios = res.data.audios || [];
          this.userPosts = res.data.userPosts || [];
          this.userComments = res.data.userComments || [];
        } else {
          uni.showToast({ title: '获取用户信息失败', icon: 'none' });
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    getAnimalIcon(type) {
      const icons = {
        cat: '🐱',
        dog: '🐶',
        bird: '🐦',
        rabbit: '🐰',
        mouse: '🐭',
        cow: '🐮',
        pig: '🐷',
        sheep: '🐑'
      };
      return icons[type] || '🐾';
    },
    getAnimalName(type) {
      const names = {
        cat: '猫咪',
        dog: '狗狗',
        bird: '小鸟',
        rabbit: '兔子',
        mouse: '老鼠',
        cow: '奶牛',
        pig: '小猪',
        sheep: '绵羊'
      };
      return names[type] || '动物';
    },
    playSound(audio, index) {
      if (this.isPlaying === index) {
        this.stopSound();
      } else {
        this.playAudio(audio, index);
      }
    },
    playAudio(audio, index) {
      if (this.audioContext) {
        this.audioContext.stop();
        this.audioContext.destroy();
        this.audioContext = null;
      }
      
      if (!audio.sound_url) {
        uni.showToast({ title: '音频地址无效', icon: 'none' });
        return;
      }
      
      this.audioContext = uni.createInnerAudioContext();
      
      let audioUrl = audio.sound_url;
      if (!audioUrl.startsWith('http')) {
        audioUrl = `http://shengyu.supersyh.xyz${audioUrl}`;
      }
      this.audioContext.src = audioUrl;
      
      this.audioContext.onPlay(() => {
        console.log('开始播放音频:', audioUrl);
        this.isPlaying = index;
      });
      
      this.audioContext.onEnded(() => {
        this.isPlaying = -1;
      });
      
      this.audioContext.onError((res) => {
        console.error('播放错误:', res);
        uni.showToast({ title: '播放失败', icon: 'none' });
        this.isPlaying = -1;
      });
      
      this.audioContext.play();
    },
    stopSound() {
      if (this.audioContext) {
        this.audioContext.stop();
        this.audioContext.destroy();
        this.audioContext = null;
      }
      this.isPlaying = -1;
    },
    goPostDetail(postId) {
      uni.navigateTo({ url: `/pages/post-detail/post-detail?id=${postId}` });
    },
    goToFollows() {
      uni.navigateTo({ url: `/pages/follows/follows?type=following&userId=${this.userId}` });
    },
    goToFollowers() {
      uni.navigateTo({ url: `/pages/follows/follows?type=followers&userId=${this.userId}` });
    },
    formatTime(timeStr) {
      if (!timeStr) return '';
      const date = new Date(timeStr);
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
    truncateText(text, maxLen) {
      if (!text) return '';
      return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
    },
    async checkFollowStatus(userId) {
      const token = uni.getStorageSync('token');
      if (!token) return;
      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/social/follow/check/${userId}`,
          method: 'GET',
          header: { Authorization: `Bearer ${token}` }
        });
        if (res.statusCode === 200) {
          this.isFollowing = Boolean(res.data.isFollowing);
        }
      } catch (e) {
        console.error('检查关注状态失败:', e);
      }
    },

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
    async toggleFollow() {
      if (this.followLoading) return;
      
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      this.followLoading = true;
      
      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/social/follow/${this.userId}`,
          method: 'POST',
          header: { Authorization: `Bearer ${token}` }
        });
        if (res.statusCode === 200) {
          this.isFollowing = Boolean(res.data.isFollowing);
          // 更新缓存的关注列表
          this.updateFollowingCache(String(this.userId), this.isFollowing);
          // 触发全局事件通知其他页面刷新关注状态
          uni.$emit('followStatusChanged', { userId: this.userId, isFollowing: this.isFollowing });
          uni.showToast({ title: res.data.message, icon: 'none' });
        } else if (res.statusCode === 401) {
          uni.showToast({ title: '请先登录', icon: 'none' });
        } else {
          uni.showToast({ title: res.data.error || '操作失败', icon: 'none' });
        }
      } catch (e) {
        uni.showToast({ title: '网络错误，请重试', icon: 'none' });
      } finally {
        this.followLoading = false;
      }
    },
    getImageUrl
  }
};
</script>

<style scoped>
@import '/static/styles/theme.css';

.user-profile-container {
  padding: var(--spacing-md);
  background: linear-gradient(180deg, var(--color-bg-pink) 0%, var(--color-bg-light) 100%);
  min-height: 100vh;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 用户卡片 - 流动渐变 */
.user-card {
  background: var(--gradient-pink);
  background-size: 200% 200%;
  animation: gradient-flow 5s ease infinite;
  border-radius: var(--radius-2xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: 0 16rpx 48rpx rgba(255, 154, 158, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.user-card:active {
  transform: scale(0.98);
  box-shadow: 0 8rpx 32rpx rgba(255, 154, 158, 0.25);
}

.user-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.user-avatar {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  margin-bottom: 25rpx;
  border: 8rpx solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
  transition: transform 0.3s ease;
}

.user-avatar:active {
  transform: scale(1.05);
}

.user-name {
  font-size: var(--font-xl);
  font-weight: 700;
  color: #fff;
  margin-bottom: var(--spacing-xs);
  text-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
  line-height: 1.2;
}

.user-email {
  font-size: var(--font-sm);
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: var(--spacing-md);
  position: relative;
  z-index: 1;
  line-height: 1.4;
}

.follow-btn {
  padding: 16rpx 50rpx;
  background: #FFFFFF;
  border-radius: 35rpx;
  margin: 20rpx 0 25rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
  min-width: 140rpx;
  text-align: center;
  cursor: pointer;
  pointer-events: auto;
  z-index: 10;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
}

.follow-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease;
}

.follow-btn:hover::before {
  left: 100%;
}

.follow-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.follow-btn.following {
  background: rgba(255, 255, 255, 0.4);
}

.follow-btn.loading {
  opacity: 0.7;
  pointer-events: none;
}

.follow-btn-text {
  font-size: var(--font-md);
  color: var(--color-pink-light);
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.follow-btn.following .follow-btn-text {
  color: #FFFFFF;
}

.stats-row {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10rpx);
  border-radius: var(--radius-lg);
  padding: 35rpx 25rpx;
  width: 100%;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.stats-row:active {
  background-color: rgba(255, 255, 255, 0.35);
}

.stat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 var(--spacing-sm);
}

.stat-number {
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
  margin-bottom: 10rpx;
  text-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.2);
  line-height: 1.1;
}

.stat-label {
  font-size: var(--font-sm);
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.3;
}

.divider-line {
  width: 2rpx;
  height: 70rpx;
  background-color: rgba(255, 255, 255, 0.4);
  margin: 0 var(--spacing-sm);
}

/* 关注和粉丝统计 */
.follow-stats-row {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 2rpx solid rgba(255, 255, 255, 0.2);
  gap: 120rpx;
  width: 100%;
}

.follow-stat-item {
  text-align: center;
  padding: 0 var(--spacing-lg);
  transition: transform 0.3s ease;
  cursor: pointer;
}

.follow-stat-item:active {
  transform: scale(1.05);
}

.follow-stat-number {
  font-size: 36rpx;
  font-weight: bold;
  color: #FFFFFF;
  display: block;
  line-height: 1.2;
  text-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.follow-stat-label {
  font-size: var(--font-sm);
  color: rgba(255, 255, 255, 0.9);
  margin-top: var(--spacing-xs);
  display: block;
  line-height: 1.3;
}

/* Tab切换 - 玻璃拟态 */
.tab-container {
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-lg);
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(255, 154, 158, 0.12);
  border: 1rpx solid rgba(255, 154, 158, 0.08);
  backdrop-filter: blur(10rpx);
}

.tab-item {
  flex: 1;
  padding: 32rpx 0;
  text-align: center;
  font-size: var(--font-lg);
  color: var(--color-text-secondary);
  transition: all 0.3s ease;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.tab-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4rpx;
  background: var(--gradient-pink);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.tab-item.active::before {
  transform: scaleX(1);
}

.tab-item:active {
  background: rgba(255, 248, 249, 0.5);
}

.tab-item.active {
  color: var(--color-pink);
  font-weight: 600;
  background: linear-gradient(135deg, #FFF8F9 0%, #FFF0F3 100%);
}

/* 内容区域 - 玻璃拟态 */
.content-section {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.08);
  backdrop-filter: blur(10rpx);
  transition: all 0.3s ease;
}

.content-section:active {
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 120rpx 0;
}

.loading text {
  font-size: 28rpx;
  color: #FF69B4;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 150rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 25rpx;
  opacity: 0.5;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.audio-list {
  display: flex;
  flex-direction: column;
}

.audio-item {
  display: flex;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 2rpx solid var(--color-border-pink);
  transition: all 0.3s ease;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xs);
  padding: var(--spacing-md);
}

.audio-item:active {
  transform: scale(0.98);
  background-color: #FFF5F8;
  box-shadow: 0 2rpx 8rpx rgba(255, 154, 158, 0.1);
}

.audio-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.audio-icon {
  font-size: 56rpx;
  margin-right: 25rpx;
  filter: drop-shadow(2rpx 2rpx 4rpx rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease;
}

.audio-item:active .audio-icon {
  transform: scale(1.1);
}

.audio-info {
  flex: 1;
}

.audio-name {
  font-size: var(--font-lg);
  font-weight: bold;
  color: var(--color-pink);
  margin-bottom: 8rpx;
  display: block;
  line-height: 1.3;
}

.audio-emotion {
  font-size: var(--font-sm);
  color: var(--color-text-tertiary);
  line-height: 1.4;
}

.play-icon {
  font-size: 36rpx;
  color: var(--color-pink);
  padding: 12rpx;
  background: linear-gradient(135deg, #FFF0F5 0%, #FFE4E1 100%);
  border-radius: 50%;
  box-shadow: 0 2rpx 8rpx rgba(255, 105, 180, 0.2);
  transition: all 0.3s ease;
}

.play-icon:active {
  transform: scale(1.1);
  box-shadow: 0 4rpx 12rpx rgba(255, 105, 180, 0.3);
}

.posts-section {
  margin-bottom: 35rpx;
}

.section-subtitle {
  font-size: var(--font-lg);
  font-weight: bold;
  color: var(--color-pink);
  margin-bottom: var(--spacing-md);
  padding-left: 15rpx;
  border-left: 5rpx solid var(--color-pink);
  display: block;
  line-height: 1.3;
}

.post-item {
  padding: var(--spacing-md);
  border-bottom: 2rpx solid var(--color-border-pink);
  transition: all 0.3s ease;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xs);
}

.post-item:active {
  transform: scale(0.98);
  background-color: #FFF5F8;
  box-shadow: 0 2rpx 8rpx rgba(255, 154, 158, 0.1);
}

.post-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.post-content {
  margin-bottom: var(--spacing-md);
}

.post-text {
  font-size: var(--font-md);
  color: var(--color-text-primary);
  line-height: 1.7;
  display: block;
  margin-bottom: var(--spacing-sm);
}

.post-image {
  width: 220rpx;
  height: 165rpx;
  border-radius: var(--radius-md);
  margin-top: var(--spacing-sm);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.post-image:active {
  transform: scale(1.02);
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-sm);
  border-top: 1rpx solid var(--color-border-pink);
}

.post-time {
  font-size: var(--font-sm);
  color: var(--color-text-tertiary);
}

.post-stats {
  display: flex;
  gap: 25rpx;
}

.stat-item {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  transition: color 0.3s ease;
}

.stat-item:active {
  color: var(--color-pink);
}

.comments-section {
  margin-top: var(--spacing-md);
}

.comment-item {
  padding: var(--spacing-md);
  border-bottom: 2rpx solid var(--color-border-pink);
  transition: all 0.3s ease;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-xs);
}

.comment-item:active {
  transform: scale(0.98);
  background-color: #FFF5F8;
  box-shadow: 0 2rpx 8rpx rgba(255, 154, 158, 0.1);
}

.comment-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.comment-content {
  font-size: var(--font-md);
  color: var(--color-text-primary);
  line-height: 1.7;
  display: block;
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: rgba(255, 240, 245, 0.3);
  border-radius: var(--radius-sm);
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-sm);
  border-top: 1rpx solid var(--color-border-pink);
}

.comment-time {
  font-size: var(--font-sm);
  color: var(--color-text-tertiary);
}

.comment-post {
  font-size: var(--font-sm);
  color: var(--color-pink);
  font-weight: 500;
  transition: color 0.3s ease;
}

.comment-post:active {
  color: var(--color-pink-light);
  text-decoration: underline;
}
</style>
