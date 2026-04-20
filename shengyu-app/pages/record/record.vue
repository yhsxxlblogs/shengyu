<template>
  <view class="record-container page-enter">
    <view class="record-info">
      <text class="info-text">声音名称</text>
      <input 
        class="custom-input" 
        v-model="soundName" 
        placeholder="请输入声音名称，如：猫咪、雨声、海浪..."
        maxlength="50"
      />
    </view>
    
    <view class="record-info">
      <text class="info-text">情绪标签</text>
      <input 
        class="custom-input" 
        v-model="emotionTag" 
        placeholder="请输入情绪标签，如：温柔、放松、治愈..."
        maxlength="30"
      />
    </view>
    
    <view class="record-info">
      <text class="info-text">是否公开到个人主页</text>
      <view class="toggle-container">
        <switch :checked="isPublic" @change="onPublicChange" color="#FF9A9E" />
        <text class="toggle-label">{{ isPublic ? '公开' : '私密' }}</text>
      </view>
    </view>
    
    <view class="record-info">
      <text class="info-text">提交官方审核</text>
      <view class="toggle-container">
        <switch :checked="submitForReview" @change="onReviewChange" color="#FF9A9E" />
        <text class="toggle-label">{{ submitForReview ? '申请成为官方音频' : '仅保存到个人' }}</text>
      </view>
    </view>
    
    <!-- 环境提示 -->
    <view v-if="!isApp" class="env-tip">
      <text class="tip-text">💡 {{ envTipText }}</text>
    </view>
    
    <view class="record-section">
      <view class="record-circle" :class="{ recording: isRecording }" @click="toggleRecord">
        <text class="record-icon">{{ isRecording ? '⏹️' : '🎤' }}</text>
        <text class="record-text">{{ isRecording ? '停止录制' : '开始录制' }}</text>
      </view>
      <text class="record-time">{{ formatTime(duration) }}</text>
      <text v-if="recordFilePath || (isMockMode && hasRecorded)" class="record-status">
        {{ isMockMode ? '✅ 模拟🎤完成' : '✅ 🎤已保存' }}
      </text>
    </view>
    
    <view class="action-section">
      <button 
        class="upload-btn" 
        @click="saveSound" 
        :disabled="!canUpload" 
        :class="{ 'btn-disabled': !canUpload }"
      >
        {{ uploading ? '上传中...' : (isMockMode ? '模拟保存' : '保存到我的声音') }}
      </button>
      <button 
        v-if="(recordFilePath || (isMockMode && hasRecorded)) && !isMockMode" 
        class="play-btn"
        @click="playRecord"
        :disabled="isPlaying"
      >
        {{ isPlaying ? '播放中...' : '试听🎤' }}
      </button>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';

export default {
  data() {
    return {
      soundName: '',
      emotionTag: '',
      isRecording: false,
      duration: 0,
      recordFilePath: '',
      hasRecorded: false,
      isPublic: true,
      submitForReview: false,
      uploading: false,
      isPlaying: false,
      recorderManager: null,
      innerAudioContext: null,
      timer: null,
      isApp: false,
      isMockMode: false,
      envTipText: ''
    };
  },
  computed: {
    canUpload() {
      if (this.isMockMode) {
        return this.hasRecorded && !this.uploading && !this.isRecording;
      }
      return this.recordFilePath && !this.uploading && !this.isRecording;
    }
  },
  onLoad() {
    this.checkEnvironment();
    this.initRecorder();
    this.initAudioPlayer();
  },
  onUnload() {
    this.stopTimer();
    if (this.innerAudioContext) {
      this.innerAudioContext.destroy();
    }
  },
  methods: {
    checkEnvironment() {
      // #ifdef APP-PLUS
      this.isApp = true;
      this.isMockMode = false;
      // #endif

      // #ifdef H5
      this.isApp = false;
      this.isMockMode = true;
      this.envTipText = 'H5环境不支持录音，使用模拟模式';
      // #endif

      // #ifdef MP-WEIXIN
      this.isApp = true;
      this.isMockMode = false;
      // #endif
    },
    
    initRecorder() {
      if (this.isMockMode) {
        return;
      }

      // App/小程序环境使用真实录制
      // #ifdef APP-PLUS || MP-WEIXIN
      try {
        // 延迟初始化录音管理器，确保页面完全加载
        setTimeout(() => {
          this.recorderManager = uni.getRecorderManager();

          if (!this.recorderManager) {
            this.isMockMode = true;
            this.envTipText = '录音功能不可用，使用模拟模式';
            return;
          }

          this.recorderManager.onStart(() => {
            this.isRecording = true;
            this.startTimer();
            uni.showToast({ title: '开始录制', icon: 'none' });
          });

          this.recorderManager.onStop((res) => {
            this.isRecording = false;
            this.stopTimer();
            if (res && res.tempFilePath) {
              this.recordFilePath = res.tempFilePath;
              uni.showToast({ title: '录制完成', icon: 'success' });
            } else {
              uni.showToast({ title: '录制失败，请重试', icon: 'none' });
            }
          });

          this.recorderManager.onError((res) => {
            this.isRecording = false;
            this.stopTimer();
            uni.showToast({ title: '录制失败: ' + (res.errMsg || '未知错误'), icon: 'none' });
          });

          this.recorderManager.onPause(() => {
          });

          this.recorderManager.onResume(() => {
          });
        }, 100);
      } catch (error) {
        this.isMockMode = true;
        this.envTipText = '录音初始化失败，使用模拟模式';
      }
      // #endif
    },
    
    initAudioPlayer() {
      if (this.isMockMode) return;
      
      // #ifdef APP-PLUS || MP-WEIXIN
      try {
        this.innerAudioContext = uni.createInnerAudioContext();
        
        this.innerAudioContext.onPlay(() => {
          this.isPlaying = true;
        });
        
        this.innerAudioContext.onStop(() => {
          this.isPlaying = false;
        });
        
        this.innerAudioContext.onEnded(() => {
          this.isPlaying = false;
        });
        
        this.innerAudioContext.onError((res) => {
          this.isPlaying = false;
          uni.showToast({ title: '播放失败', icon: 'none' });
        });
      } catch (error) {
      }
      // #endif
    },
    
    startTimer() {
      this.duration = 0;
      this.timer = setInterval(() => {
        this.duration++;
        if (this.duration >= 60) {
          this.stopRecord();
        }
      }, 1000);
    },
    
    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },
    
    toggleRecord() {
      if (this.isRecording) {
        this.stopRecord();
      } else {
        this.startRecord();
      }
    },

    startRecord() {
      if (this.isMockMode) {
        this.isRecording = true;
        this.hasRecorded = false;
        this.startTimer();
        uni.showToast({ title: '开始模拟录制', icon: 'none' });
        return;
      }

      // #ifdef APP-PLUS || MP-WEIXIN
      if (!this.recorderManager) {
        uni.showToast({ title: '录音功能初始化中，请稍后重试', icon: 'none' });
        this.initRecorder();
        return;
      }

      this.checkRecordPermission().then(() => {
        this.recordFilePath = '';
        this.hasRecorded = false;

        const recordOptions = {
          duration: 60000,
          sampleRate: 44100,
          numberOfChannels: 1,
          encodeBitRate: 192000,
          format: 'mp3'
        };

        // #ifdef APP-PLUS
        recordOptions.format = 'aac';
        // #endif

        try {
          this.recorderManager.start(recordOptions);
        } catch (error) {
          uni.showToast({ title: '启动录音失败，请重试', icon: 'none' });
        }
      }).catch((err) => {
      });
      // #endif
    },

    checkRecordPermission() {
      return new Promise((resolve, reject) => {
        // #ifdef APP-PLUS
        const Context = plus.android.importClass('android.content.Context');
        const PackageManager = plus.android.importClass('android.content.pm.PackageManager');
        const MainActivity = plus.android.runtimeMainActivity();
        const permission = 'android.permission.RECORD_AUDIO';

        const checkResult = MainActivity.checkSelfPermission(permission);
        const PERMISSION_GRANTED = PackageManager.PERMISSION_GRANTED;

        if (checkResult === PERMISSION_GRANTED) {
          resolve();
        } else {
          plus.android.requestPermissions(
            [permission],
            (result) => {
              if (result.granted.length > 0) {
                resolve();
              } else if (result.deniedAlways.length > 0) {
                uni.showModal({
                  title: '需要录音权限',
                  content: '声愈需要录音权限来录制声音，请在设置中开启',
                  confirmText: '去设置',
                  success: (res) => {
                    if (res.confirm) {
                      uni.openAppAuthorizeSetting();
                    }
                  }
                });
                reject(new Error('权限被永久拒绝'));
              } else {
                uni.showToast({ title: '需要录音权限才能录制', icon: 'none' });
                reject(new Error('权限被拒绝'));
              }
            },
            (error) => {
              reject(error);
            }
          );
        }
        // #endif

        // #ifdef MP-WEIXIN
        uni.getSetting({
          success: (res) => {
            if (res.authSetting['scope.record']) {
              resolve();
            } else {
              uni.authorize({
                scope: 'scope.record',
                success: resolve,
                fail: () => {
                  uni.showModal({
                    title: '需要录音权限',
                    content: '请点击右上角···打开设置，开启录音权限',
                    showCancel: false
                  });
                  reject(new Error('权限被拒绝'));
                }
              });
            }
          }
        });
        // #endif
      });
    },
    
    stopRecord() {
      if (this.isMockMode) {
        this.isRecording = false;
        this.hasRecorded = true;
        this.stopTimer();
        uni.showToast({ title: '模拟录制完成', icon: 'success' });
        return;
      }

      // #ifdef APP-PLUS || MP-WEIXIN
      if (this.recorderManager) {
        this.recorderManager.stop();
      }
      // #endif
    },
    
    playRecord() {
      if (this.isMockMode) {
        uni.showToast({ title: '模拟模式不支持试听', icon: 'none' });
        return;
      }
      
      if (!this.recordFilePath) {
        uni.showToast({ title: '没有🎤文件', icon: 'none' });
        return;
      }
      
      // #ifdef APP-PLUS || MP-WEIXIN
      if (this.innerAudioContext) {
        this.innerAudioContext.src = this.recordFilePath;
        this.innerAudioContext.play();
      }
      // #endif
    },
    
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    

    
    onPublicChange(e) {
      this.isPublic = e.detail.value;
    },
    onReviewChange(e) {
      this.submitForReview = e.detail.value;
    },
    
    async saveSound() {
      if (!this.canUpload) {
        uni.showToast({ title: '请先录制声音', icon: 'none' });
        return;
      }

      // 验证输入
      if (!this.soundName.trim()) {
        uni.showToast({ title: '请输入声音名称', icon: 'none' });
        return;
      }
      if (!this.emotionTag.trim()) {
        uni.showToast({ title: '请输入情绪标签', icon: 'none' });
        return;
      }

      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }

      this.uploading = true;

      try {
        const soundName = this.soundName.trim();
        const emotionTag = this.emotionTag.trim();

        if (this.isMockMode) {
          await new Promise(resolve => setTimeout(resolve, 1000));

          uni.showToast({
            title: '模拟保存成功',
            icon: 'success',
            duration: 2000
          });

          this.hasRecorded = false;
          this.duration = 0;

          setTimeout(() => {
            uni.navigateBack();
          }, 1500);

          return;
        }

        const res = await uni.uploadFile({
          url: api.sound.upload,
          filePath: this.recordFilePath,
          name: 'sound',
          formData: {
            animal_type: soundName,
            emotion: emotionTag,
            duration: this.duration,
            visible: this.isPublic ? 'true' : 'false',
            submit_for_review: this.submitForReview ? 'true' : 'false'
          },
          header: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = JSON.parse(res.data);

        if (res.statusCode === 201 && data.sound_id) {
          uni.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 2000
          });

          this.recordFilePath = '';
          this.duration = 0;

          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({ title: data.error || '上传失败', icon: 'none' });
        }
      } catch (error) {
        uni.showToast({ title: '网络错误: ' + error.message, icon: 'none' });
      } finally {
        this.uploading = false;
      }
    }
  }
};
</script>

<style scoped>
@import '/static/styles/theme.css';

.record-container {
  padding: 24rpx;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 100%);
  min-height: 100vh;
}

/* 录制信息卡片 - 玻璃拟态 */
.record-info {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.1);
}

.info-text {
  font-size: 30rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  margin-bottom: 16rpx;
  display: block;
}

/* 环境提示 */
.env-tip {
  background: linear-gradient(145deg, #FFF8E1 0%, #FFF3E0 100%);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid rgba(255, 183, 77, 0.3);
}

.tip-text {
  font-size: 26rpx;
  color: #FF8F00;
  font-weight: 500;
}

/* 自定义输入框 - 玻璃拟态 */
.custom-input {
  width: 100%;
  height: 84rpx;
  border: 2rpx solid rgba(255, 154, 158, 0.2);
  border-radius: 42rpx;
  padding: 0 24rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
  font-size: 28rpx;
  color: #444;
  font-weight: 500;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.custom-input:focus {
  border-color: rgba(255, 154, 158, 0.4);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.1);
}

.custom-input::placeholder {
  color: #999;
  font-weight: 400;
}

/* 切换容器 */
.toggle-container {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.toggle-label {
  font-size: 28rpx;
  color: #666;
  font-weight: 500;
}

/* 录制区域 */
.record-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

/* 录制按钮 - 流动渐变 */
.record-circle {
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 3s ease infinite;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 40rpx rgba(255, 154, 158, 0.4);
  transition: all 0.3s ease;
  cursor: pointer;
}

.record-circle:active {
  transform: scale(0.95);
  box-shadow: 0 8rpx 30rpx rgba(255, 154, 158, 0.3);
}

.record-circle.recording {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF9A9E 50%, #FF6B6B 100%);
  background-size: 200% 200%;
  animation: gradient-flow 1.5s ease infinite, pulse-red 1.5s ease-in-out infinite;
}

@keyframes pulse-red {
  0%, 100% {
    box-shadow: 0 12rpx 40rpx rgba(255, 107, 107, 0.4);
  }
  50% {
    box-shadow: 0 12rpx 60rpx rgba(255, 107, 107, 0.6);
  }
}

.record-icon {
  font-size: 64rpx;
  margin-bottom: 12rpx;
}

.record-text {
  font-size: 28rpx;
  color: #FFFFFF;
  font-weight: 600;
}

.record-time {
  font-size: 48rpx;
  color: #FF6B9D;
  font-weight: bold;
  margin-top: 40rpx;
  font-variant-numeric: tabular-nums;
}

.record-status {
  font-size: 28rpx;
  color: #52C41A;
  margin-top: 20rpx;
  font-weight: 500;
}

/* 操作区域 */
.action-section {
  padding: 40rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* 上传按钮 - 流动渐变 */
.upload-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 3s ease infinite;
  color: #FFFFFF;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(255, 154, 158, 0.35);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.25);
}

.upload-btn.btn-disabled {
  background: #CCCCCC;
  animation: none;
  box-shadow: none;
}

/* 试听按钮 */
.play-btn {
  width: 100%;
  height: 84rpx;
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  color: #FF6B9D;
  border-radius: 42rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: 2rpx solid rgba(255, 154, 158, 0.3);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-btn:active {
  transform: scale(0.98);
  background: linear-gradient(145deg, #FFF8F9 0%, #FFF0F3 100%);
}
</style>
