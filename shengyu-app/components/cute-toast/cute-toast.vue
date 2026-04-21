<template>
  <view class="toast-overlay" v-if="visible" :class="{ 'overlay-show': visible }">
    <view class="toast-content" :class="[type, { 'toast-scale': visible }]">
      <view class="icon-wrapper">
        <text class="toast-icon">{{ icon }}</text>
        <view class="icon-glow" :class="type"></view>
      </view>
      <text class="toast-message">{{ message }}</text>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CuteToast',
  props: {
    message: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'success'
    },
    duration: {
      type: Number,
      default: 2000
    }
  },
  data() {
    return {
      visible: false,
      timer: null
    };
  },
  computed: {
    icon() {
      const icons = {
        success: '✓',
        error: '✕',
        warning: '!',
        info: 'i'
      };
      return icons[this.type] || '✓';
    }
  },
  methods: {
    show() {
      this.visible = true;
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.hide();
      }, this.duration);
    },
    hide() {
      this.visible = false;
    }
  }
};
</script>

<style scoped>
.toast-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.overlay-show {
  opacity: 1;
}

.toast-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 64rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20rpx) saturate(180%);
  -webkit-backdrop-filter: blur(20rpx) saturate(180%);
  box-shadow: 
    0 20rpx 60rpx rgba(0, 0, 0, 0.12),
    0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  transform: scale(0.8) translateY(30rpx);
  opacity: 0;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1rpx solid rgba(255, 255, 255, 0.5);
  min-width: 280rpx;
}

.toast-scale {
  transform: scale(1) translateY(0);
  opacity: 1;
}

/* 图标包装器 */
.icon-wrapper {
  position: relative;
  width: 96rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.toast-icon {
  font-size: 48rpx;
  font-weight: 700;
  z-index: 2;
  position: relative;
}

.icon-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  opacity: 0.15;
  z-index: 1;
}

/* 不同类型样式 */
.toast-content.success {
  border-top: 4rpx solid #10b981;
}

.toast-content.success .toast-icon {
  color: #10b981;
}

.toast-content.success .icon-glow {
  background: #10b981;
  animation: pulse-glow 2s ease-in-out infinite;
}

.toast-content.error {
  border-top: 4rpx solid #ef4444;
}

.toast-content.error .toast-icon {
  color: #ef4444;
}

.toast-content.error .icon-glow {
  background: #ef4444;
  animation: pulse-glow 2s ease-in-out infinite;
}

.toast-content.warning {
  border-top: 4rpx solid #f59e0b;
}

.toast-content.warning .toast-icon {
  color: #f59e0b;
}

.toast-content.warning .icon-glow {
  background: #f59e0b;
  animation: pulse-glow 2s ease-in-out infinite;
}

.toast-content.info {
  border-top: 4rpx solid #3b82f6;
}

.toast-content.info .toast-icon {
  color: #3b82f6;
}

.toast-content.info .icon-glow {
  background: #3b82f6;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.15;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.25;
  }
}

.toast-message {
  font-size: 30rpx;
  color: #1f2937;
  text-align: center;
  font-weight: 600;
  line-height: 1.5;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .toast-content {
    background: rgba(30, 30, 50, 0.98);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .toast-message {
    color: #f3f4f6;
  }
}
</style>