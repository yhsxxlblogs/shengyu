<template>
  <view class="toast-container" v-if="visible">
    <view class="toast-content" :class="type">
      <text class="toast-icon">{{ icon }}</text>
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
        success: '✨',
        error: '😢',
        warning: '⚠️',
        info: '💡'
      };
      return icons[this.type] || '✨';
    }
  },
  methods: {
    show() {
      this.visible = true;
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.visible = false;
      }, this.duration);
    }
  }
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
}

.toast-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 60rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.toast-content.success {
  border: 3rpx solid #FFB6C1;
}

.toast-content.error {
  border: 3rpx solid #FF6B6B;
}

.toast-content.warning {
  border: 3rpx solid #FFD93D;
}

.toast-content.info {
  border: 3rpx solid #6BCB77;
}

.toast-icon {
  font-size: 60rpx;
  margin-bottom: 15rpx;
}

.toast-message {
  font-size: 28rpx;
  color: #333;
  text-align: center;
  font-weight: 500;
}
</style>
