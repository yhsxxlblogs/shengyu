<template>
  <view class="follows-container page-enter">
    <!-- 标题栏 -->
    <view class="header">
      <text class="back-icon" @click="goBack">‹</text>
      <text class="header-title">{{ title }}</text>
      <view class="header-right"></view>
    </view>

    <!-- 用户列表 -->
    <view class="user-list">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-else-if="error" class="error">
        <text>{{ error }}</text>
        <button @click="loadUsers" class="retry-btn">重试</button>
      </view>
      <view v-else-if="users.length === 0" class="empty">
        <text class="empty-icon">👥</text>
        <text class="empty-text">{{ emptyText }}</text>
      </view>
      <view v-else>
        <view class="user-card" v-for="user in users" :key="user.id">
          <view class="user-info" @click="goToUserProfile(user.id)">
            <view class="avatar-wrapper">
              <image :src="getAvatarUrl(user.avatar)" class="avatar" mode="aspectFill"></image>
            </view>
            <view class="user-detail">
              <text class="username">{{ user.username }}</text>
              <text v-if="user.is_mutual" class="mutual-tag">互相关注</text>
            </view>
          </view>
          <view class="action-area">
            <button 
              class="follow-btn" 
              :class="{ 'following': user.is_following, 'mutual': user.is_mutual }"
              @click="toggleFollow(user)"
            >
              {{ user.is_mutual ? '互相关注' : (user.is_following ? '已关注' : '关注') }}
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getImageUrl, DEFAULT_AVATAR } from '../../utils/api.js'

export default {
  data() {
    return {
      type: 'following', // 'following' 或 'followers'
      userId: null,
      users: [],
      loading: false,
      error: ''
    }
  },
  computed: {
    title() {
      return this.type === 'following' ? '我的关注' : '我的粉丝';
    },
    emptyText() {
      return this.type === 'following' ? '还没有关注任何人' : '还没有粉丝';
    }
  },
  onLoad(options) {
    this.type = options.type || 'following';
    this.userId = options.userId;
    this.loadUsers();
    // 监听关注状态变化事件
    uni.$on('followStatusChanged', this.handleFollowStatusChanged);
  },
  onUnload() {
    // 取消监听
    uni.$off('followStatusChanged', this.handleFollowStatusChanged);
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    getAvatarUrl(avatar) {
      if (!avatar) return DEFAULT_AVATAR
      return getImageUrl(avatar)
    },
    async loadUsers() {
      this.loading = true;
      this.error = '';
      
      const token = uni.getStorageSync('token');
      if (!token) {
        this.error = '请先登录';
        this.loading = false;
        return;
      }
      
      const url = this.type === 'following' 
        ? `http://shengyu.supersyh.xyz/api/social/follows/${this.userId}`
        : `http://shengyu.supersyh.xyz/api/social/followers/${this.userId}`;
      
      try {
        const res = await uni.request({
          url: url,
          method: 'GET',
          header: { Authorization: `Bearer ${token}` }
        });
        
        if (res.statusCode === 200) {
          const users = this.type === 'following' ? (res.data.follows || []) : (res.data.followers || []);
          // 将 is_following 转换为布尔值
          this.users = users.map(user => ({
            ...user,
            is_following: Boolean(user.is_following)
          }));
        } else {
          this.error = res.data.error || '加载失败';
        }
      } catch (e) {
        this.error = '网络错误';
      }
      
      this.loading = false;
    },
    // 处理关注状态变化事件
    handleFollowStatusChanged(data) {
      const { userId, isFollowing } = data;
      // 更新列表中该用户的关注状态
      this.users.forEach(u => {
        if (String(u.id) === String(userId)) {
          u.is_following = isFollowing;
          u.is_mutual = isFollowing && u.follows_me;
        }
      });
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
    async toggleFollow(user) {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/social/follow/${user.id}`,
          method: 'POST',
          header: { Authorization: `Bearer ${token}` }
        });
        
        if (res.statusCode === 200) {
          const isFollowing = Boolean(res.data.isFollowing);
          // 使用新对象触发响应式更新
          const updatedUser = { ...user, is_following: isFollowing, is_mutual: isFollowing && user.follows_me };
          const index = this.users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            this.users.splice(index, 1, updatedUser);
          }
          // 更新缓存的关注列表
          this.updateFollowingCache(String(user.id), isFollowing);
          // 触发全局事件通知其他页面
          uni.$emit('followStatusChanged', { userId: user.id, isFollowing });
          uni.showToast({ title: res.data.message, icon: 'none' });
        }
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' });
      }
    },
    goToUserProfile(userId) {
      uni.navigateTo({ url: `/pages/user-profile/user-profile?id=${userId}` });
    }
  }
}
</script>

<style>
.follows-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFF0F3 100%);
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

.user-list {
  padding: 20rpx;
}

.loading, .error, .empty {
  text-align: center;
  padding: 100rpx 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
}

.retry-btn {
  margin-top: 30rpx;
  padding: 16rpx 40rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
  border-radius: 30rpx;
  font-size: 28rpx;
  border: none;
}

.user-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(255, 154, 158, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.avatar-wrapper {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
  margin-right: 20rpx;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.user-detail {
  flex: 1;
}

.username {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.mutual-tag {
  font-size: 24rpx;
  color: #FF9A9E;
}

.action-area {
  display: flex;
  align-items: center;
}

.follow-btn {
  padding: 8rpx 24rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
  border-radius: 24rpx;
  font-size: 24rpx;
  border: none;
  min-width: 100rpx;
  height: 56rpx;
  line-height: 40rpx;
}

.follow-btn.following {
  background: #F0F0F0;
  color: #999;
}

.follow-btn.mutual {
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
  color: #FF9A9E;
}
</style>
