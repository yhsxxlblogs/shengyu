<template>
  <view class="scan-container">
    <!-- 自定义导航栏 -->
    <view class="custom-nav">
      <view class="nav-back" @click="goBack">
        <svg-icon name="arrow-left" :size="36" color="#FFFFFF" />
      </view>
      <text class="nav-title">扫描二维码</text>
      <view class="nav-right"></view>
    </view>

    <!-- 扫描区域 -->
    <view class="scan-wrapper">
      <view class="scan-frame" :class="{ 'scanning': scanning }">
        <view class="corner corner-tl"></view>
        <view class="corner corner-tr"></view>
        <view class="corner corner-bl"></view>
        <view class="corner corner-br"></view>
        <view v-if="scanning" class="scan-line"></view>
      </view>
      <text class="scan-tip">{{ scanning ? '将二维码放入框内，即可自动扫描' : '扫描已暂停' }}</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="scan-actions">
      <view class="action-item" @click="toggleFlash">
        <view class="action-icon" :class="{ active: flashOn }">
          <svg-icon name="flashlight" :size="44" color="#FFFFFF" />
        </view>
        <text class="action-text">闪光灯</text>
      </view>
      <view class="action-item" @click="chooseFromAlbum">
        <view class="action-icon">
          <svg-icon name="image" :size="44" color="#FFFFFF" />
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
      scanning: false,
      scanTimer: null,
      isProcessing: false  // 防止重复处理
    }
  },
  onLoad() {
    // 延迟启动扫描，确保页面已完全渲染
    this.scanTimer = setTimeout(() => {
      this.startScan()
    }, 600)
  },
  onUnload() {
    this.cleanup()
  },
  onHide() {
    // 页面隐藏时停止扫描
    this.stopScan()
  },
  onShow() {
    // 页面显示时重新开始扫描（如果不在处理中）
    if (!this.scanning && !this.isProcessing) {
      this.scanTimer = setTimeout(() => {
        this.startScan()
      }, 400)
    }
  },
  methods: {
    goBack() {
      this.cleanup()
      uni.navigateBack()
    },
    
    // 清理资源
    cleanup() {
      this.stopScan()
      if (this.scanTimer) {
        clearTimeout(this.scanTimer)
        this.scanTimer = null
      }
    },
    
    startScan() {
      // 防止重复启动
      if (this.scanning || this.isProcessing) return
      
      // #ifdef APP-PLUS
      this.scanning = true
      
      // 检查相机权限（安卓需要）
      this.checkCameraPermission().then(() => {
        this.doScan()
      }).catch(() => {
        this.scanning = false
        uni.showModal({
          title: '权限提示',
          content: '需要相机权限才能扫码，请在设置中开启',
          showCancel: false
        })
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
      this.scanning = true
      this.doScan()
      // #endif
    },
    
    // 检查相机权限（主要用于安卓）- 使用非阻塞方式
    checkCameraPermission() {
      return new Promise((resolve, reject) => {
        // #ifdef APP-PLUS
        // 使用权限API而不是直接打开相机
        if (plus.android) {
          const main = plus.android.runtimeMainActivity()
          const PackageManager = plus.android.importClass('android.content.pm.PackageManager')
          const permission = 'android.permission.CAMERA'
          
          const hasPermission = main.checkSelfPermission(permission) === PackageManager.PERMISSION_GRANTED
          if (hasPermission) {
            resolve()
          } else {
            // 请求权限
            main.requestPermissions([permission], (result) => {
              if (result.granted && result.granted.length > 0) {
                resolve()
              } else {
                reject()
              }
            })
          }
        } else {
          resolve()
        }
        // #endif
        
        // #ifndef APP-PLUS
        resolve()
        // #endif
      })
    },
    
    doScan() {
      if (!this.scanning || this.isProcessing) return
      
      uni.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode', 'barCode'],
        success: (res) => {
          this.isProcessing = true
          this.handleScanResult(res.result)
        },
        fail: (err) => {
          console.error('扫描失败:', err)
          // 用户取消不提示错误
          if (err.errMsg && err.errMsg.includes('cancel')) {
            this.stopScan()
            return
          }
          // 其他错误继续扫描
          this.continueScan()
        },
        complete: () => {
          // 不在这里自动继续，避免无限循环
        }
      })
    },
    
    // 继续扫描（带延迟，避免过于频繁）
    continueScan() {
      if (!this.scanning || this.isProcessing) return
      
      this.scanTimer = setTimeout(() => {
        this.doScan()
      }, 1200)  // 增加到1.2秒间隔，减少性能消耗
    },
    
    stopScan() {
      this.scanning = false
      if (this.scanTimer) {
        clearTimeout(this.scanTimer)
        this.scanTimer = null
      }
    },
    
    handleScanResult(result) {
      console.log('扫描结果:', result)
      
      // 停止扫描
      this.stopScan()

      // 解析二维码内容
      if (result.startsWith('http://') || result.startsWith('https://')) {
        // 如果是URL，打开网页
        uni.showModal({
          title: '扫描结果',
          content: result,
          confirmText: '打开',
          cancelText: '取消',
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
            } else {
              // 用户取消，重新开始扫描
              this.isProcessing = false
              this.startScan()
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
          showCancel: true,
          cancelText: '取消',
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
            // 重新开始扫描
            setTimeout(() => {
              this.isProcessing = false
              this.startScan()
            }, 500)
          }
        })
      }
    },
    
    toggleFlash() {
      this.flashOn = !this.flashOn
      
      // #ifdef APP-PLUS
      try {
        const Camera = plus.camera.getCamera()
        if (Camera && Camera.setFlashMode) {
          Camera.setFlashMode(this.flashOn ? 'on' : 'off')
        }
      } catch (e) {
        console.error('闪光灯控制失败:', e)
      }
      // #endif
      
      uni.showToast({
        title: this.flashOn ? '闪光灯已开启' : '闪光灯已关闭',
        icon: 'none'
      })
    },
    
    chooseFromAlbum() {
      // 停止扫描
      this.stopScan()
      
      uni.chooseImage({
        count: 1,
        sourceType: ['album'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          
          // #ifdef APP-PLUS
          // 使用 plus.barcode 识别图片中的二维码
          this.scanImage(tempFilePath)
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
              // 重新开始扫描
              setTimeout(() => {
                this.startScan()
              }, 500)
            }
          })
          // #endif
        },
        fail: () => {
          // 用户取消，重新开始扫描
          this.startScan()
        }
      })
    },
    
    // APP端识别图片中的二维码
    scanImage(imagePath) {
      // #ifdef APP-PLUS
      // 使用 barcode 模块识别
      if (plus.barcode && plus.barcode.scan) {
        plus.barcode.scan(imagePath, (type, result) => {
          this.handleScanResult(result)
        }, (error) => {
          uni.showToast({
            title: '未识别到二维码',
            icon: 'none'
          })
          // 重新开始扫描
          setTimeout(() => {
            this.startScan()
          }, 500)
        })
      } else {
        // 备用方案：使用 uni.scanCode 的 sourceType
        uni.scanCode({
          sourceType: ['album'],
          success: (res) => {
            this.handleScanResult(res.result)
          },
          fail: () => {
            uni.showToast({
              title: '未识别到二维码',
              icon: 'none'
            })
            setTimeout(() => {
              this.startScan()
            }, 500)
          }
        })
      }
      // #endif
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
  border-radius: 8rpx;
  overflow: hidden;
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
  animation: scan 2.5s ease-in-out infinite;
  will-change: top;  /* 优化动画性能 */
}

/* 扫描动画 - 使用transform优化性能 */
@keyframes scan {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(500rpx);
  }
  100% {
    transform: translateY(0);
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
