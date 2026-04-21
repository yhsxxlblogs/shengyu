<template>
  <view class="scan-container">
    <!-- 自定义导航栏 -->
    <view class="custom-nav">
      <view class="nav-back" @click="goBack">
        <SvgIcon name="arrow-left" :size="36" class="back-icon-svg" />
      </view>
      <text class="nav-title">扫描二维码</text>
      <view class="nav-right"></view>
    </view>

    <!-- 扫描区域 -->
    <view class="scan-wrapper">
      <view class="scan-frame">
        <view class="corner corner-tl"></view>
        <view class="corner corner-tr"></view>
        <view class="corner corner-bl"></view>
        <view class="corner corner-br"></view>
        <view class="scan-line"></view>
      </view>
      <text class="scan-tip">将二维码放入框内，即可自动扫描</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="scan-actions">
      <view class="action-item" @click="toggleFlash">
        <view class="action-icon" :class="{ active: flashOn }">
          <SvgIcon name="flashlight" :size="44" />
        </view>
        <text class="action-text">闪光灯</text>
      </view>
      <view class="action-item" @click="chooseFromAlbum">
        <view class="action-icon">
          <SvgIcon name="image" :size="44" />
        </view>
        <text class="action-text">相册</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      flashOn: false,
      scanning: false
    }
  },
  onLoad() {
    this.startScan()
  },
  onUnload() {
    this.stopScan()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    startScan() {
      // #ifdef APP-PLUS
      this.scanning = true
      uni.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode', 'barCode'],
        success: (res) => {
          this.handleScanResult(res.result)
        },
        fail: (err) => {
          console.error('扫描失败:', err)
          uni.showToast({
            title: '扫描失败',
            icon: 'none'
          })
        },
        complete: () => {
          if (this.scanning) {
            // 继续扫描
            setTimeout(() => this.startScan(), 500)
          }
        }
      })
      // #endif

      // #ifdef H5
      uni.showToast({
        title: 'H5暂不支持扫码，请使用APP',
        icon: 'none',
        duration: 2000
      })
      // #endif

      // #ifdef MP-WEIXIN
      uni.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode'],
        success: (res) => {
          this.handleScanResult(res.result)
        },
        fail: (err) => {
          console.error('扫描失败:', err)
        }
      })
      // #endif
    },
    stopScan() {
      this.scanning = false
    },
    handleScanResult(result) {
      console.log('扫描结果:', result)

      // 解析二维码内容
      if (result.startsWith('http://') || result.startsWith('https://')) {
        // 如果是URL，打开网页
        uni.showModal({
          title: '扫描结果',
          content: result,
          confirmText: '打开',
          success: (res) => {
            if (res.confirm) {
              // #ifdef APP-PLUS
              plus.runtime.openURL(result)
              // #endif
              // #ifdef H5
              window.open(result, '_blank')
              // #endif
              // #ifdef MP-WEIXIN
              uni.navigateTo({
                url: `/pages/webview/webview?url=${encodeURIComponent(result)}`
              })
              // #endif
            }
          }
        })
      } else if (result.includes('shengyu')) {
        // 如果是应用内链接
        uni.navigateTo({
          url: result
        })
      } else {
        // 普通文本
        uni.showModal({
          title: '扫描结果',
          content: result,
          showCancel: false,
          confirmText: '复制',
          success: (res) => {
            if (res.confirm) {
              uni.setClipboardData({
                data: result,
                success: () => {
                  uni.showToast({
                    title: '已复制',
                    icon: 'success'
                  })
                }
              })
            }
          }
        })
      }
    },
    toggleFlash() {
      this.flashOn = !this.flashOn
      // #ifdef APP-PLUS
      const Camera = plus.camera.getCamera()
      if (Camera) {
        Camera.setFlashMode(this.flashOn ? 'on' : 'off')
      }
      // #endif
      uni.showToast({
        title: this.flashOn ? '闪光灯已开启' : '闪光灯已关闭',
        icon: 'none'
      })
    },
    chooseFromAlbum() {
      uni.chooseImage({
        count: 1,
        sourceType: ['album'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          // #ifdef APP-PLUS
          plus.barcode.scan(tempFilePath, (type, result) => {
            this.handleScanResult(result)
          }, (error) => {
            uni.showToast({
              title: '未识别到二维码',
              icon: 'none'
            })
          })
          // #endif

          // #ifdef MP-WEIXIN
          uni.scanCode({
            scanType: ['qrCode'],
            sourceType: ['album'],
            success: (res) => {
              this.handleScanResult(res.result)
            },
            fail: () => {
              uni.showToast({
                title: '未识别到二维码',
                icon: 'none'
              })
            }
          })
          // #endif
        }
      })
    }
  }
}
</script>

<style scoped>
.scan-container {
  min-height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
}

/* 自定义导航栏 */
.custom-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 30rpx 20rpx;
  background: rgba(0, 0, 0, 0.8);
}

.nav-back {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon-svg {
  color: #fff;
}

.nav-title {
  font-size: 32rpx;
  color: #fff;
  font-weight: 500;
}

.nav-right {
  width: 60rpx;
}

/* 扫描区域 */
.scan-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.scan-frame {
  width: 500rpx;
  height: 500rpx;
  position: relative;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.corner {
  position: absolute;
  width: 40rpx;
  height: 40rpx;
  border-color: #FF69B4;
  border-style: solid;
}

.corner-tl {
  top: -4rpx;
  left: -4rpx;
  border-width: 6rpx 0 0 6rpx;
}

.corner-tr {
  top: -4rpx;
  right: -4rpx;
  border-width: 6rpx 6rpx 0 0;
}

.corner-bl {
  bottom: -4rpx;
  left: -4rpx;
  border-width: 0 0 6rpx 6rpx;
}

.corner-br {
  bottom: -4rpx;
  right: -4rpx;
  border-width: 0 6rpx 6rpx 0;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(90deg, transparent, #FF69B4, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% {
    top: 0;
  }
  50% {
    top: 100%;
  }
  100% {
    top: 0;
  }
}

.scan-tip {
  margin-top: 60rpx;
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 底部操作栏 */
.scan-actions {
  display: flex;
  justify-content: center;
  gap: 80rpx;
  padding: 60rpx 40rpx;
  background: rgba(0, 0, 0, 0.8);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.action-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.3s ease;
}

.action-icon:active {
  transform: scale(0.9);
  background: rgba(255, 255, 255, 0.25);
}

.action-icon.active {
  background: #FF69B4;
}

.action-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}
</style>
