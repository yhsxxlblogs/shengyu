<template>
  <view class="publish-container page-enter">
    <textarea v-model="content" placeholder="分享你的动物声音..." class="content-input"></textarea>
    
    <!-- 已录制的音频选择 -->
    <view class="saved-sounds-section" v-if="mySounds.length > 0">
      <text class="section-title">选择已录制的音频</text>
      <scroll-view class="sounds-scroll" scroll-x="true">
        <view class="sound-item" v-for="(sound, index) in mySounds" :key="index" :class="{ 'sound-selected': selectedSoundIndex === index }" @click="selectSound(index)">
          <text class="sound-icon">🎵</text>
          <text class="sound-name">{{ sound.name }}</text>
        </view>
      </scroll-view>
    </view>
    
    <view class="upload-section">
      <view class="upload-item" @click="chooseImage">
        <text class="upload-icon">📷</text>
        <text class="upload-text">上传图片</text>
      </view>
      <view class="upload-item" @click="chooseSound">
        <text class="upload-icon">🎤</text>
        <text class="upload-text">录制音频</text>
      </view>
      <view class="upload-item" @click="chooseLocalSound">
        <text class="upload-icon">📁</text>
        <text class="upload-text">选择本地</text>
      </view>
    </view>
    
    <view class="preview-section" v-if="imageUrl || soundUrl">
      <image v-if="imageUrl" :src="imageUrl" class="preview-image" mode="aspectFit" @click="previewImage"></image>
      <view v-if="soundUrl" class="audio-container" @click="playSound(soundUrl)">
        <text class="audio-icon">🎵</text>
        <text class="audio-text">点击播放声音</text>
        <text class="audio-remove" @click.stop="removeSound">✕</text>
      </view>
    </view>
    
    <button class="publish-btn" @click="publish">发布</button>
  </view>
</template>

<script>
import api from '../../utils/api.js';

export default {
  data() {
    return {
      content: '',
      imageUrl: '',
      imageFile: null,
      soundUrl: '',
      mySounds: [],
      selectedSoundIndex: -1
    };
  },
  onLoad() {
    this.loadMySounds();
  },
  methods: {
    loadMySounds() {
      const savedSounds = uni.getStorageSync('mySounds') || [];
      this.mySounds = savedSounds;
    },
    selectSound(index) {
      if (this.selectedSoundIndex === index) {
        this.selectedSoundIndex = -1;
        this.soundUrl = '';
      } else {
        this.selectedSoundIndex = index;
        this.soundUrl = this.mySounds[index].url;
      }
    },
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.imageUrl = res.tempFilePaths[0];
          this.imageFile = res.tempFiles[0];
        }
      });
    },
    previewImage() {
      uni.previewImage({
        urls: [this.imageUrl]
      });
    },
    chooseSound() {
      uni.navigateTo({ url: '/pages/record/record' });
    },
    chooseLocalSound() {
      uni.showToast({ title: '选择本地音频功能开发中', icon: 'none' });
    },
    removeSound() {
      this.soundUrl = '';
      this.selectedSoundIndex = -1;
    },
    async publish() {
      if (!this.content) {
        uni.showToast({ title: '请输入内容', icon: 'none' });
        return;
      }
      
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      try {
        uni.showLoading({ title: '发布中...' });
        
        if (this.imageFile) {
          const uploadRes = await new Promise((resolve, reject) => {
            uni.uploadFile({
              url: api.post.create,
              filePath: this.imageUrl,
              name: 'image',
              formData: {
                content: this.content,
                sound_url: this.soundUrl || ''
              },
              header: {
                Authorization: `Bearer ${token}`
              },
              success: (res) => {
                resolve(res);
              },
              fail: (err) => {
                reject(err);
              }
            });
          });
          
          uni.hideLoading();
          
          const data = JSON.parse(uploadRes.data);
          if (data.message === '发布成功') {
            uni.showToast({ title: '发布成功', icon: 'success' });
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } else {
            uni.showToast({ title: data.error || '发布失败', icon: 'none' });
          }
        } else {
          const res = await uni.request({
            url: api.post.create,
            method: 'POST',
            header: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              content: this.content,
              sound_url: this.soundUrl || ''
            }
          });
          
          uni.hideLoading();
          
          if (res.data && res.data.message === '发布成功') {
            uni.showToast({ title: '发布成功', icon: 'success' });
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } else {
            uni.showToast({ title: res.data.error || '发布失败', icon: 'none' });
          }
        }
      } catch (error) {
        uni.hideLoading();
        console.error('发布失败:', error);
        uni.showToast({ title: '发布失败', icon: 'none' });
      }
    },
    playSound(url) {
      uni.showToast({ title: '播放声音', icon: 'none' });
    }
  }
};
</script>

<style scoped>
@import '/static/styles/theme.css';

.publish-container {
  padding: 24rpx;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 100%);
  min-height: 100vh;
}

/* 内容输入框 - 玻璃拟态 */
.content-input {
  width: 100%;
  min-height: 240rpx;
  border: 2rpx solid rgba(255, 154, 158, 0.2);
  border-radius: 24rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
  font-size: 30rpx;
  color: #444;
  transition: all 0.3s ease;
}

.content-input:focus {
  border-color: rgba(255, 154, 158, 0.4);
  box-shadow: 0 4rpx 20rpx rgba(255, 154, 158, 0.12);
}

.saved-sounds-section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 30rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  margin-bottom: 20rpx;
  display: block;
}

.sounds-scroll {
  white-space: nowrap;
}

.sound-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 20rpx;
  padding: 24rpx;
  margin-right: 16rpx;
  border: 2rpx solid rgba(255, 154, 158, 0.1);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.sound-item:active {
  transform: scale(0.95);
}

.sound-selected {
  border-color: rgba(255, 154, 158, 0.4);
  background: linear-gradient(145deg, #FFF8F9 0%, #FFF0F3 100%);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.15);
}

.sound-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
}

.sound-name {
  font-size: 24rpx;
  color: #666666;
}

.upload-section {
  display: flex;
  margin-bottom: 30rpx;
}

.upload-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 24rpx;
  padding: 32rpx 0;
  margin-right: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.08);
  transition: all 0.3s ease;
}

.upload-item:last-child {
  margin-right: 0;
}

.upload-item:active {
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 24rpx rgba(255, 154, 158, 0.12);
}

.upload-icon {
  font-size: 52rpx;
  margin-bottom: 16rpx;
}

.upload-text {
  font-size: 26rpx;
  color: #666666;
  font-weight: 500;
}

.preview-section {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.08);
}

.preview-image {
  width: 100%;
  height: 320rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
}

/* 音频容器 - 玻璃拟态 */
.audio-container {
  display: flex;
  align-items: center;
  background: rgba(255, 154, 158, 0.08);
  border: 1rpx solid rgba(255, 154, 158, 0.15);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  position: relative;
}

.audio-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.audio-text {
  font-size: 26rpx;
  color: #666666;
  flex: 1;
}

.audio-remove {
  font-size: 36rpx;
  color: #999999;
  padding: 10rpx;
  transition: all 0.3s ease;
}

.audio-remove:active {
  color: #FF6B6B;
  transform: scale(1.1);
}

/* 发布按钮 - 流动渐变 */
.publish-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 3s ease infinite;
  color: #FFFFFF;
  border-radius: 48rpx;
  font-size: 34rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(255, 154, 158, 0.35);
  transition: all 0.3s ease;
}

.publish-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.25);
}
</style>
