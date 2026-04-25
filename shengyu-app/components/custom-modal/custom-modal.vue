<template>
  <view class="custom-modal-mask" v-if="visible" @click="handleMaskClick">
    <view class="custom-modal-content" @click.stop>
      <!-- 装饰性元素 -->
      <view class="modal-decoration">
        <view class="deco-circle circle-1"></view>
        <view class="deco-circle circle-2"></view>
        <view class="deco-line"></view>
      </view>
      
      <!-- 图标区域 -->
      <view class="modal-icon-wrapper" v-if="icon">
        <view class="icon-container" :class="iconType">
          <text class="icon-text">{{ icon }}</text>
        </view>
      </view>
      
      <!-- 标题 -->
      <view class="modal-title" v-if="title">
        <text class="title-text">{{ title }}</text>
      </view>
      
      <!-- 内容 -->
      <view class="modal-body">
        <text class="content-text">{{ content }}</text>
      </view>
      
      <!-- 按钮区域 -->
      <view class="modal-actions">
        <view 
          v-if="showCancel" 
          class="action-btn cancel-btn"
          @click="handleCancel"
          :style="{ '--btn-color': cancelColor }"
        >
          <text class="btn-text">{{ cancelText }}</text>
        </view>
        <view 
          class="action-btn confirm-btn"
          @click="handleConfirm"
          :style="{ '--btn-color': confirmColor }"
        >
          <text class="btn-text">{{ confirmText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'CustomModal',
  data() {
    return {
      visible: false,
      title: '',
      content: '',
      icon: '',
      iconType: 'info',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      cancelColor: '#999999',
      confirmColor: '#FFB6C1',
      resolve: null,
      reject: null
    }
  },
  methods: {
    show(options = {}) {
      this.title = options.title || '提示'
      this.content = options.content || ''
      this.icon = options.icon || ''
      this.iconType = options.iconType || 'info'
      this.showCancel = options.showCancel !== false
      this.cancelText = options.cancelText || '取消'
      this.confirmText = options.confirmText || '确定'
      this.cancelColor = options.cancelColor || '#999999'
      this.confirmColor = options.confirmColor || '#FFB6C1'
      this.visible = true
      
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    
    hide() {
      this.visible = false
    },
    
    handleMaskClick() {
      if (this.showCancel) {
        this.handleCancel()
      }
    },
    
    handleCancel() {
      this.hide()
      if (this.reject) this.reject({ cancel: true })
    },
    
    handleConfirm() {
      this.hide()
      if (this.resolve) this.resolve({ confirm: true })
    }
  }
}
</script>

<style scoped>
/* 遮罩层 */
.custom-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8rpx);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 弹窗内容 */
.custom-modal-content {
  width: 560rpx;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF8FA 100%);
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 20rpx 60rpx rgba(255, 182, 193, 0.25),
    0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 装饰元素 */
.modal-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  overflow: hidden;
  pointer-events: none;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.15;
}

.circle-1 {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
  top: -100rpx;
  right: -60rpx;
}

.circle-2 {
  width: 140rpx;
  height: 140rpx;
  background: linear-gradient(135deg, #FFD1DC, #FFE4E9);
  top: -40rpx;
  left: -40rpx;
}

.deco-line {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80rpx;
  height: 4rpx;
  background: linear-gradient(90deg, transparent, #FFB6C1, transparent);
  border-radius: 2rpx;
}

/* 图标区域 */
.modal-icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 24rpx;
}

.icon-container {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: iconPulse 2s ease-in-out infinite;
}

.icon-container.success {
  background: linear-gradient(135deg, #90EE90, #98FB98);
  box-shadow: 0 8rpx 24rpx rgba(144, 238, 144, 0.4);
}

.icon-container.warning {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  box-shadow: 0 8rpx 24rpx rgba(255, 215, 0, 0.4);
}

.icon-container.error {
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.4);
}

.icon-container.info {
  background: linear-gradient(135deg, #87CEEB, #ADD8E6);
  box-shadow: 0 8rpx 24rpx rgba(135, 206, 235, 0.4);
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.icon-text {
  font-size: 48rpx;
}

/* 标题 */
.modal-title {
  text-align: center;
  margin-bottom: 16rpx;
}

.title-text {
  font-size: 36rpx;
  font-weight: 700;
  color: #333333;
  letter-spacing: 2rpx;
}

/* 内容 */
.modal-body {
  text-align: center;
  margin-bottom: 40rpx;
  padding: 0 20rpx;
}

.content-text {
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
}

/* 按钮区域 */
.modal-actions {
  display: flex;
  justify-content: center;
  gap: 24rpx;
}

.action-btn {
  min-width: 140rpx;
  padding: 16rpx 32rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.action-btn:active {
  transform: scale(0.95);
}

.cancel-btn {
  background: #F5F5F5;
  border: 2rpx solid #E0E0E0;
}

.cancel-btn .btn-text {
  color: #999999;
  font-size: 26rpx;
  font-weight: 500;
}

.confirm-btn {
  background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
  box-shadow: 0 4rpx 16rpx rgba(255, 182, 193, 0.4);
}

.confirm-btn .btn-text {
  color: #FFFFFF;
  font-size: 26rpx;
  font-weight: 600;
}

/* 按钮悬停效果 */
.cancel-btn:hover {
  background: #EEEEEE;
}

.confirm-btn:hover {
  box-shadow: 0 6rpx 20rpx rgba(255, 182, 193, 0.5);
}
</style>
