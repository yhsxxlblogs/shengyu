<template>
  <view class="about-container page-enter">
    <!-- 内容区域 -->
    <view class="content">
      <!-- Logo区域 -->
      <view class="logo-section">
        <view class="logo-wrapper">
          <text class="logo-icon">🐾</text>
          <view class="logo-glow"></view>
        </view>
        <text class="app-name">声愈</text>
        <view class="version-badge">
          <text class="version-text">v{{ version }}</text>
        </view>
      </view>

      <!-- 信息卡片 -->
      <view class="info-card">
        <view class="info-item">
          <view class="info-icon-wrapper">
            <text class="info-icon">📅</text>
          </view>
          <view class="info-content">
            <text class="info-label">最后更新</text>
            <text class="info-value">{{ updateTime }}</text>
          </view>
        </view>

        <view class="divider"></view>

        <view class="info-item">
          <view class="info-icon-wrapper">
            <text class="info-icon">👤</text>
          </view>
          <view class="info-content">
            <text class="info-label">作者</text>
            <text class="info-value">{{ author }}</text>
          </view>
        </view>

        <view class="divider"></view>

        <view class="info-item">
          <view class="info-icon-wrapper">
            <text class="info-icon">📧</text>
          </view>
          <view class="info-content">
            <text class="info-label">联系方式</text>
            <text class="info-value email">{{ email }}</text>
          </view>
        </view>
      </view>

      <!-- Bug反馈区域 -->
      <view class="feedback-card">
        <view class="feedback-header">
          <text class="feedback-icon">🐛</text>
          <text class="feedback-title">Bug 反馈</text>
        </view>
        <text class="feedback-desc">如果您在使用过程中遇到任何问题，欢迎发送邮件反馈</text>
        <view class="feedback-content">
          <text class="feedback-text">请发送 bug 具体信息到：</text>
          <view class="email-tag" @click="copyEmail">
            <text class="email-text">{{ email }}</text>
            <text class="copy-icon">📋</text>
          </view>
        </view>
      </view>

      <!-- 版权信息 -->
      <view class="footer">
        <text class="copyright">© 2026 声愈 保留所有权利</text>
        <text class="slogan">用声音治愈心灵 🎵</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      version: '1.0.0',
      updateTime: '2026-04-02',
      author: 'syh',
      email: 'photo2carton@qq.com'
    };
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    copyEmail() {
      uni.setClipboardData({
        data: this.email,
        success: () => {
          uni.showToast({
            title: '邮箱已复制',
            icon: 'success'
          });
        }
      });
    }
  }
};
</script>

<style scoped>
@import '/static/styles/theme.css';

.about-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 50%, #FFFFFF 100%);
}

/* 内容区域 */
.content {
  padding: 40rpx 32rpx;
}

/* Logo区域 */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.logo-wrapper {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.logo-icon {
  font-size: 100rpx;
  z-index: 2;
  animation: bounce 2s ease-in-out infinite;
}

.logo-glow {
  position: absolute;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 154, 158, 0.3) 0%, rgba(254, 207, 239, 0.3) 100%);
  filter: blur(20rpx);
  animation: glow 3s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

@keyframes glow {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.app-name {
  font-size: 44rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  letter-spacing: 2rpx;
}

.version-badge {
  padding: 10rpx 30rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(255, 154, 158, 0.3);
}

.version-text {
  font-size: 26rpx;
  color: #FFFFFF;
  font-weight: 600;
}

/* 信息卡片 */
.info-card {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 32rpx;
  padding: 20rpx 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.1);
}

.info-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
}

.info-icon-wrapper {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, rgba(255, 154, 158, 0.15) 0%, rgba(254, 207, 239, 0.15) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.info-icon {
  font-size: 40rpx;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 30rpx;
  color: #333;
  font-weight: 600;
}

.info-value.email {
  color: #FF69B4;
}

.divider {
  height: 2rpx;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 154, 158, 0.2) 50%, transparent 100%);
}

/* Bug反馈卡片 */
.feedback-card {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 32rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.1);
}

.feedback-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.feedback-icon {
  font-size: 44rpx;
  margin-right: 16rpx;
}

.feedback-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.feedback-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 30rpx;
}

.feedback-content {
  background: linear-gradient(135deg, rgba(255, 154, 158, 0.08) 0%, rgba(254, 207, 239, 0.08) 100%);
  border-radius: 20rpx;
  padding: 30rpx;
  border: 2rpx dashed rgba(255, 154, 158, 0.3);
}

.feedback-text {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 16rpx;
  display: block;
}

.email-tag {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  padding: 16rpx 30rpx;
  border-radius: 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
  transition: all 0.3s ease;
}

.email-tag:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(255, 154, 158, 0.2);
}

.email-text {
  font-size: 28rpx;
  color: #FFFFFF;
  font-weight: 600;
  margin-right: 12rpx;
}

.copy-icon {
  font-size: 28rpx;
}

/* 底部 */
.footer {
  text-align: center;
  padding: 40rpx 0;
}

.copyright {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 16rpx;
}

.slogan {
  font-size: 26rpx;
  color: #FF9A9E;
  font-weight: 500;
}
</style>
