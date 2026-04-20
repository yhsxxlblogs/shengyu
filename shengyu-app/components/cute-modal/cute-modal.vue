<template>
  <view class="modal-overlay" v-if="visible" @click="handleOverlayClick">
    <view class="modal-container" @click.stop>
      <view class="modal-header">
        <text class="modal-title">{{ title }}</text>
        <text class="modal-close" @click="handleCancel">✕</text>
      </view>
      
      <view class="modal-body">
        <text class="modal-content">{{ content }}</text>
      </view>
      
      <view class="modal-footer">
        <button class="modal-btn cancel-btn" @click="handleCancel">{{ cancelText }}</button>
        <button class="modal-btn confirm-btn" @click="handleConfirm">{{ confirmText }}</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CuteModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '提示'
    },
    content: {
      type: String,
      default: ''
    },
    confirmText: {
      type: String,
      default: '确定'
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    closeOnClickOverlay: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    handleConfirm() {
      this.$emit('confirm');
    },
    handleCancel() {
      this.$emit('cancel');
    },
    handleOverlayClick() {
      if (this.closeOnClickOverlay) {
        this.handleCancel();
      }
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  width: 80%;
  max-width: 600rpx;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF5F8 100%);
  border-radius: 30rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 40rpx rgba(255, 105, 180, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%);
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #FFFFFF;
}

.modal-close {
  font-size: 40rpx;
  color: #FFFFFF;
  font-weight: bold;
  padding: 10rpx;
}

.modal-body {
  padding: 40rpx 30rpx;
}

.modal-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx 30rpx;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  border: none;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #F5F5F5;
  color: #666;
}

.cancel-btn:active {
  background: #E0E0E0;
  transform: scale(0.98);
}

.confirm-btn {
  background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%);
  color: #FFFFFF;
  box-shadow: 0 4rpx 15rpx rgba(255, 105, 180, 0.4);
}

.confirm-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 10rpx rgba(255, 105, 180, 0.3);
}
</style>
