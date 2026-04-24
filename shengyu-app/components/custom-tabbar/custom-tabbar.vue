<template>
  <view class="custom-tabbar">
    <view 
      class="tab-item" 
      v-for="(item, index) in tabs" 
      :key="index"
      :class="{ active: currentIndex === index }"
      @click="switchTab(index)"
    >
      <view class="tab-icon-wrapper">
        <text class="tab-icon">{{ currentIndex === index ? item.activeIcon : item.icon }}</text>
        <view v-if="currentIndex === index" class="active-indicator"></view>
        <!-- 社区图标未读消息气泡 -->
        <view v-if="index === 1 && unreadCount > 0" class="unread-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</view>
      </view>
      <text class="tab-text">{{ item.text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CustomTabbar',
  props: {
    currentIndex: {
      type: Number,
      default: 0
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      tabs: [
        { 
          text: '声愈', 
          icon: '🏠',
          activeIcon: '🏠',
          pagePath: '/pages/index/index'
        },
        { 
          text: '社区', 
          icon: '💬',
          activeIcon: '💬',
          pagePath: '/pages/community/community'
        },
        { 
          text: '我的', 
          icon: '👤',
          activeIcon: '👤',
          pagePath: '/pages/profile/profile'
        }
      ]
    };
  },
  methods: {
    switchTab(index) {
      if (this.currentIndex === index) return;
      
      // 只通知父组件切换，不执行页面跳转
      this.$emit('change', index);
    }
  }
};
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  border-top: 1rpx solid rgba(0, 0, 0, 0.03);
  z-index: 999;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  will-change: transform;
}

.tab-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  margin-bottom: 2rpx;
}

.tab-icon {
  font-size: 40rpx;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.tab-item.active .tab-icon {
  transform: scale(1.15) translateY(-4rpx);
  filter: drop-shadow(0 4rpx 8rpx rgba(255, 107, 157, 0.3));
}

.active-indicator {
  position: absolute;
  bottom: 0;
  width: 40rpx;
  height: 6rpx;
  background: linear-gradient(90deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 3rpx;
  animation: indicator-pulse 2s ease-in-out infinite;
}

@keyframes indicator-pulse {
  0%, 100% { 
    opacity: 0.6;
    transform: scaleX(1);
  }
  50% { 
    opacity: 1;
    transform: scaleX(1.2);
  }
}

.tab-text {
  font-size: 22rpx;
  color: #999999;
  transition: all 0.3s ease;
  font-weight: 500;
}

.tab-item.active .tab-text {
  color: #FF6B9D;
  font-weight: 600;
  transform: scale(1.05);
}

/* 点击效果 */
.tab-item:active {
  transform: scale(0.95);
}

/* 未读消息气泡 */
.unread-badge {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  background: #FF4757;
  color: #FFFFFF;
  font-size: 20rpx;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(255, 71, 87, 0.4);
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 点击效果 */
.tab-item:active .tab-icon {
  transform: scale(0.9);
}
</style>