<template>
  <view class="modal-overlay" v-if="visible" @click="handleOverlayClick" :class="{ 'overlay-fade': visible }">
    <view class="modal-container" @click.stop :class="{ 'modal-scale': visible }">
      <!-- 装饰性头部 -->
      <view class="modal-decoration">
        <view class="decoration-circle"></view>
        <view class="decoration-circle"></view>
        <view class="decoration-circle"></view>
      </view>
      
      <view class="modal-header">
        <view class="title-wrapper">
          <text class="modal-title">{{ title }}</text>
          <view class="title-underline"></view>
        </view>
        <view class="close-wrapper" @click="handleCancel">
          <text class="modal-close">✕</text>
        </view>
      </view>
      
      <view class="modal-body">
        <text class="modal-content">{{ content }}</text>
      </view>
      
      <view class="modal-footer">
        <button class="modal-btn cancel-btn" @click="handleCancel" :class="{ 'btn-press': pressingCancel }" @touchstart="pressingCancel = true" @touchend="pressingCancel = false">
          <text>{{ cancelText }}</text>
        </button>
        <button class="modal-btn confirm-btn" @click="handleConfirm" :class="{ 'btn-press': pressingConfirm }" @touchstart="pressingConfirm = true" @touchend="pressingConfirm = false">
          <text>{{ confirmText }}</text>
        </button>
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
  data() {
    return {
      pressingCancel: false,
      pressingConfirm: false
    };
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
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8rpx);
  -webkit-backdrop-filter: blur(8rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.overlay-fade {
  opacity: 1;
}

.modal-container {
  width: 82%;
  max-width: 620rpx;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 
    0 25rpx 50rpx rgba(0, 0, 0, 0.15),
    0 10rpx 20rpx rgba(0, 0, 0, 0.1);
  transform: scale(0.9) translateY(20rpx);
  opacity: 0;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.modal-scale {
  transform: scale(1) translateY(0);
  opacity: 1;
}

/* 装饰性头部 */
.modal-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.decoration-circle:nth-child(1) {
  width: 200rpx;
  height: 200rpx;
  top: -100rpx;
  right: -50rpx;
}

.decoration-circle:nth-child(2) {
  width: 120rpx;
  height: 120rpx;
  bottom: -60rpx;
  left: 20%;
}

.decoration-circle:nth-child(3) {
  width: 80rpx;
  height: 80rpx;
  top: 20rpx;
  left: 10%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 40rpx 40rpx 20rpx;
  position: relative;
  z-index: 1;
}

.title-wrapper {
  flex: 1;
  position: relative;
}

.modal-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #FFFFFF;
  display: block;
  margin-bottom: 8rpx;
}

.title-underline {
  width: 60rpx;
  height: 4rpx;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 2rpx;
}

.close-wrapper {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  cursor: pointer;
}

.close-wrapper:active {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

.modal-close {
  font-size: 32rpx;
  color: #FFFFFF;
  font-weight: 500;
  line-height: 1;
}

.modal-body {
  padding: 40rpx 40rpx 50rpx;
  position: relative;
  z-index: 1;
}

.modal-content {
  font-size: 30rpx;
  color: #4a5568;
  line-height: 1.7;
  text-align: center;
  display: block;
}

.modal-footer {
  display: flex;
  gap: 24rpx;
  padding: 0 40rpx 40rpx;
}

.modal-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.modal-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.modal-btn:active::after {
  width: 200%;
  height: 200%;
}

.cancel-btn {
  background: #f3f4f6;
  color: #6b7280;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.cancel-btn:active {
  background: #e5e7eb;
  transform: scale(0.97);
}

.confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFFFFF;
  box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.35);
}

.confirm-btn:active {
  transform: scale(0.97);
  box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.25);
}

.btn-press {
  transform: scale(0.97) !important;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .modal-container {
    background: rgba(30, 30, 50, 0.98);
  }
  
  .modal-content {
    color: #e2e8f0;
  }
  
  .cancel-btn {
    background: #374151;
    color: #9ca3af;
  }
  
  .cancel-btn:active {
    background: #4b5563;
  }
}
</style>