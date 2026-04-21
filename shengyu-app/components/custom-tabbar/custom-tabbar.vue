<template>
  <view class="custom-tabbar" :class="{ 'tabbar-elevated': isElevated }">
    <view 
      class="tab-item" 
      v-for="(item, index) in tabs" 
      :key="index"
      :class="{ active: currentIndex === index }"
      @click="switchTab(index)"
    >
      <view class="tab-icon-wrapper">
        <view class="icon-container" :class="{ 'icon-active': currentIndex === index }">
          <text class="tab-icon">{{ currentIndex === index ? item.activeIcon : item.icon }}</text>
        </view>
        <!-- 社区图标未读消息气泡 -->
        <view v-if="index === 1 && unreadCount > 0" class="unread-badge" :class="{ 'badge-pulse': unreadCount > 0 }">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </view>
      </view>
      <text class="tab-text">{{ item.text }}</text>
    </view>
    <!-- 浮动指示器 -->
    <view class="floating-indicator" :style="indicatorStyle"></view>
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
      ],
      isElevated: false
    };
  },
  computed: {
    indicatorStyle() {
      const width = 100 / this.tabs.length;
      const left = this.currentIndex * width;
      return {
        width: `${width}%`,
        transform: `translateX(${left}%)`
      };
    }
  },
  mounted() {
    // 监听滚动，当页面滚动时添加阴影效果
    this.setupScrollListener();
  },
  methods: {
    switchTab(index) {
      if (this.currentIndex === index) return;
      
      // 添加触觉反馈（如果支持）
      if (uni.vibrateShort) {
        uni.vibrateShort({ type: 'light' });
      }
      
      // 只通知父组件切换，不执行页面跳转
      this.$emit('change', index);
    },
    setupScrollListener() {
      // 这里可以通过事件总线或父组件传递滚动状态
      // 暂时通过页面滚动事件监听
    }
  }
};
</script>

<style scoped>
/* 现代化TabBar样式 */
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24rpx) saturate(180%);
  -webkit-backdrop-filter: blur(24rpx) saturate(180%);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.04);
  border-top: 1rpx solid rgba(0, 0, 0, 0.03);
  z-index: 999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 滚动时的提升效果 */
.tabbar-elevated {
  box-shadow: 0 -8rpx 30rpx rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.98);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  position: relative;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-item:active {
  transform: scale(0.92);
}

.tab-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin-bottom: 4rpx;
}

.icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: transparent;
}

.icon-container.icon-active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.15);
}

.tab-icon {
  font-size: 40rpx;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: block;
}

.tab-item.active .tab-icon {
  transform: scale(1.1);
  filter: drop-shadow(0 4rpx 8rpx rgba(102, 126, 234, 0.2));
}

/* 浮动指示器 */
.floating-indicator {
  position: absolute;
  bottom: 16rpx;
  left: 0;
  height: 4rpx;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2rpx;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  opacity: 0;
}

.tab-item.active ~ .floating-indicator {
  opacity: 1;
}

/* 文字样式 */
.tab-text {
  font-size: 22rpx;
  color: #9ca3af;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  letter-spacing: 0.5rpx;
}

.tab-item.active .tab-text {
  color: #667eea;
  font-weight: 600;
  transform: scale(1.02);
}

/* 未读消息气泡 - 现代化设计 */
.unread-badge {
  position: absolute;
  top: -2rpx;
  right: -2rpx;
  background: linear-gradient(135deg, #FF4757 0%, #FF6B81 100%);
  color: #FFFFFF;
  font-size: 20rpx;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10rpx;
  font-weight: 700;
  box-shadow: 0 4rpx 12rpx rgba(255, 71, 87, 0.35);
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.badge-pulse {
  animation: badge-bounce 1.5s ease-in-out infinite;
}

@keyframes badge-bounce {
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.15);
  }
  50% {
    transform: scale(1);
  }
  75% {
    transform: scale(1.05);
  }
}

/* 点击波纹效果 */
.tab-item::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.tab-item:active::after {
  width: 120rpx;
  height: 120rpx;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .custom-tabbar {
    background: rgba(26, 26, 46, 0.95);
    border-top-color: rgba(255, 255, 255, 0.05);
  }
  
  .tab-text {
    color: #6b7280;
  }
  
  .tab-item.active .tab-text {
    color: #8b5cf6;
  }
  
  .icon-container.icon-active {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  }
}

/* iOS安全区域适配 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .custom-tabbar {
    padding-bottom: env(safe-area-inset-bottom);
    height: calc(100rpx + env(safe-area-inset-bottom));
  }
}
</style>