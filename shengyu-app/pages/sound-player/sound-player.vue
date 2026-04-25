<template>
  <view class="sound-player-container page-enter">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
    
    <!-- 错误提示 -->
    <view v-else-if="error" class="error">
      <text>{{ error }}</text>
      <button @click="loadSoundDetail" class="retry-btn">重试</button>
    </view>
    
    <!-- 内容区域 -->
    <view v-else>
      <!-- 声音信息卡片 -->
      <view class="sound-header">
        <view class="animal-avatar">
          <text class="animal-icon">{{ getAnimalIcon(animalType) }}</text>
          <view class="avatar-ring"></view>
        </view>
        <text class="animal-name">{{ getAnimalName(animalType) }}</text>
        <text class="sound-emotion">{{ sound.emotion }}</text>
        <view class="duration-badge" v-if="audioDuration > 0">
          <text class="duration-icon">⏱</text>
          <text class="duration-text">{{ formatTime(audioDuration) }}</text>
        </view>
      </view>
      
      <!-- 播放器区域 -->
      <view class="player-section">
        <!-- 播放控制按钮 -->
        <view class="player-controls">
          <view class="play-btn-wrapper">
            <view 
              class="play-btn" 
              :class="{ playing: isPlaying, paused: !isPlaying }" 
              @click="togglePlay"
            >
              <view class="btn-inner">
                <text class="play-icon">{{ isPlaying ? '❚❚' : '▶' }}</text>
              </view>
              <view class="btn-pulse" v-if="isPlaying"></view>
            </view>
          </view>
          
          <!-- 播放状态文字 -->
          <text class="play-status">{{ isPlaying ? '正在播放' : '点击播放' }}</text>
        </view>
        
        <!-- 进度条 -->
        <view class="progress-section">
          <view class="time-display">
            <text class="current-time">{{ formatTime(currentTime) }}</text>
            <text class="total-time">{{ formatTime(audioDuration) }}</text>
          </view>
          
          <view class="progress-container" @touchstart="onProgressTouchStart" @touchmove="onProgressTouchMove" @touchend="onProgressTouchEnd">
            <view class="progress-track">
              <view class="progress-buffer" :style="{ width: bufferedProgress + '%' }"></view>
              <view class="progress-fill" :style="{ width: progress + '%' }"></view>
            </view>
            <view class="progress-thumb" :style="{ left: progress + '%' }" :class="{ dragging: isDragging }">
              <view class="thumb-inner"></view>
            </view>
          </view>
        </view>
        
        <!-- 控制选项 -->
        <view class="control-options">
          <view class="control-btn" :class="{ active: isLooping }" @click="toggleLoop">
            <text class="control-icon">🔁</text>
            <text class="control-text">{{ isLooping ? '循环' : '单次' }}</text>
          </view>
          
          <view class="volume-control">
            <text class="volume-icon">🔊</text>
            <slider 
              class="volume-slider" 
              :value="volume" 
              @change="onVolumeChange" 
              min="0" 
              max="100" 
              block-size="16"
              activeColor="#FF69B4"
              backgroundColor="#FFE5E8"
            />
          </view>
        </view>
      </view>
      
      <!-- 声音详情信息 -->
      <view class="sound-info">
        <view class="info-header">
          <text class="info-title">声音信息</text>
        </view>
        <view class="info-list">
          <view class="info-item">
            <view class="info-icon">⏱</view>
            <view class="info-content">
              <text class="info-label">音频时长</text>
              <text class="info-value">{{ formatTime(audioDuration) }}</text>
            </view>
          </view>
          <view class="info-item">
            <view class="info-icon">📅</view>
            <view class="info-content">
              <text class="info-label">上传时间</text>
              <text class="info-value">{{ formatDate(sound.created_at) }}</text>
            </view>
          </view>
          <view class="info-item" v-if="sound.username">
            <view class="info-icon">👤</view>
            <view class="info-content">
              <text class="info-label">上传用户</text>
              <text class="info-value">{{ sound.username }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 相关声音 -->
      <view class="related-sounds" v-if="relatedSounds.length > 0">
        <view class="section-header">
          <text class="section-title">相关声音</text>
          <text class="section-count">{{ relatedSounds.length }}个</text>
        </view>
        <view class="sound-list">
          <view class="sound-item" v-for="item in relatedSounds" :key="item.id" @click="playSound(item)">
            <view class="item-icon-wrapper">
              <text class="sound-item-icon">{{ getAnimalIcon(animalType) }}</text>
              <view class="play-overlay" v-if="currentSoundId === item.id && isPlaying">
                <text class="playing-indicator">♪</text>
              </view>
            </view>
            <view class="item-content">
              <text class="sound-item-emotion">{{ item.emotion }}</text>
              <text class="sound-item-meta">{{ formatTime(item.duration) }}</text>
            </view>
            <view class="item-play-btn" :class="{ active: currentSoundId === item.id && isPlaying }">
              <text class="item-play-icon">{{ currentSoundId === item.id && isPlaying ? '❚❚' : '▶' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      soundId: '',
      animalType: '',
      sound: {
        emotion: '',
        duration: 0,
        sound_url: '',
        created_at: '',
        username: ''
      },
      relatedSounds: [],
      loading: false,
      error: '',
      // 播放器状态
      isPlaying: false,
      currentTime: 0,
      audioDuration: 0,
      progress: 0,
      bufferedProgress: 0,
      audioContext: null,
      isLooping: false,
      volume: 100,
      currentSoundId: '',
      // 进度条拖动
      isDragging: false,
      dragStartX: 0,
      dragStartProgress: 0
    };
  },
  onLoad(options) {
    this.soundId = options.id;
    this.animalType = options.type;
    this.currentSoundId = options.id;
    this.loadSoundDetail();
  },
  onUnload() {
    // 页面卸载时停止播放
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
      this.audioContext = null;
    }
  },
  methods: {
    async loadSoundDetail() {
      this.loading = true;
      this.error = '';
      
      try {
        // 获取声音详情
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/sound/detail/${this.soundId}`,
          method: 'GET'
        });
        
        if (res.data.code === 200) {
          this.sound = res.data.data;
          // 处理声音URL，确保完整路径
          if (this.sound.sound_url && !this.sound.sound_url.startsWith('http')) {
            this.sound.sound_url = 'http://shengyu.supersyh.xyz' + (this.sound.sound_url.startsWith('/') ? this.sound.sound_url : '/' + this.sound.sound_url);
          }
          this.audioDuration = this.sound.duration || 0;
          console.log('声音详情:', this.sound);
        } else {
          this.error = '获取声音详情失败';
        }
        
        // 获取相关声音
        const relatedRes = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/sound/by-animal/${this.animalType}`,
          method: 'GET'
        });
        
        if (relatedRes.data.code === 200) {
          // 处理相关声音的URL，确保完整路径
          this.relatedSounds = relatedRes.data.data
            .filter(item => item.id != this.soundId)
            .map(item => {
              if (item.sound_url && !item.sound_url.startsWith('http')) {
                item.sound_url = 'http://shengyu.supersyh.xyz' + (item.sound_url.startsWith('/') ? item.sound_url : '/' + item.sound_url);
              }
              return item;
            });
        }
      } catch (error) {
        console.error('获取声音详情失败:', error);
        this.error = '获取数据失败，请重试';
      } finally {
        this.loading = false;
      }
    },
    togglePlay() {
      if (this.isPlaying) {
        this.pauseSound();
      } else {
        this.playSound(this.sound);
      }
    },
    playSound(sound) {
      // 停止当前播放
      if (this.audioContext) {
        this.audioContext.stop();
        this.audioContext.destroy();
      }
      
      // 更新当前声音
      this.sound = sound;
      this.currentSoundId = sound.id;
      this.currentTime = 0;
      this.progress = 0;
      
      // 创建音频上下文
      this.audioContext = uni.createInnerAudioContext();
      
      // 确保音频URL完整
      let soundUrl = sound.sound_url;
      if (!soundUrl) {
        uni.showToast({ title: '音频地址为空', icon: 'none' });
        return;
      }
      
      // 处理URL，确保完整路径
      if (!soundUrl.startsWith('http')) {
        soundUrl = 'http://shengyu.supersyh.xyz' + (soundUrl.startsWith('/') ? soundUrl : '/' + soundUrl);
      }
      
      console.log('播放音频URL:', soundUrl);
      this.audioContext.src = soundUrl;
      this.audioContext.volume = this.volume / 100;
      
      // 监听音频加载完成，获取实际时长
      this.audioContext.onCanplay(() => {
        console.log('音频可以播放，时长:', this.audioContext.duration);
        if (this.audioContext.duration > 0) {
          this.audioDuration = this.audioContext.duration;
        }
      });
      
      // 监听播放事件
      this.audioContext.onPlay(() => {
        console.log('开始播放');
        this.isPlaying = true;
      });
      
      // 监听播放进度
      this.audioContext.onTimeUpdate(() => {
        if (!this.isDragging) {
          this.currentTime = this.audioContext.currentTime;
          if (this.audioDuration > 0) {
            this.progress = (this.currentTime / this.audioDuration) * 100;
          }
        }
      });
      
      // 监听缓冲进度
      this.audioContext.onWaiting(() => {
        console.log('音频缓冲中...');
      });
      
      this.audioContext.onEnded(() => {
        if (this.isLooping) {
          // 循环播放，重新开始
          this.audioContext.seek(0);
          this.audioContext.play();
          this.currentTime = 0;
          this.progress = 0;
        } else {
          // 单次播放，停止
          this.isPlaying = false;
          this.currentTime = 0;
          this.progress = 0;
        }
      });
      
      this.audioContext.onError((res) => {
        console.error('播放错误详情:', JSON.stringify(res));
        this.isPlaying = false;
        let errorMsg = '播放失败';
        if (res && res.errMsg) {
          errorMsg = res.errMsg;
        } else if (res && res.errCode) {
          errorMsg = `错误码: ${res.errCode}`;
        }
        uni.showToast({ title: errorMsg, icon: 'none', duration: 3000 });
      });
      
      // 播放
      this.audioContext.play();
    },
    pauseSound() {
      if (this.audioContext) {
        this.audioContext.pause();
        this.isPlaying = false;
      }
    },
    toggleLoop() {
      this.isLooping = !this.isLooping;
      uni.showToast({
        title: this.isLooping ? '已开启循环播放' : '已关闭循环播放',
        icon: 'none'
      });
    },
    onVolumeChange(e) {
      this.volume = e.detail.value;
      if (this.audioContext) {
        this.audioContext.volume = this.volume / 100;
      }
    },
    // 进度条拖动控制
    onProgressTouchStart(e) {
      this.isDragging = true;
      const query = uni.createSelectorQuery().in(this);
      query.select('.progress-container').boundingClientRect(rect => {
        this.progressRect = rect;
        this.updateProgressFromTouch(e.touches[0].clientX);
      }).exec();
    },
    onProgressTouchMove(e) {
      if (this.isDragging) {
        this.updateProgressFromTouch(e.touches[0].clientX);
      }
    },
    onProgressTouchEnd() {
      if (this.isDragging) {
        this.isDragging = false;
        // 跳转到指定位置
        if (this.audioContext && this.audioDuration > 0) {
          const seekTime = (this.progress / 100) * this.audioDuration;
          this.audioContext.seek(seekTime);
        }
      }
    },
    updateProgressFromTouch(clientX) {
      if (!this.progressRect) return;
      
      const offsetX = clientX - this.progressRect.left;
      const percentage = Math.max(0, Math.min(100, (offsetX / this.progressRect.width) * 100));
      this.progress = percentage;
      this.currentTime = (percentage / 100) * this.audioDuration;
    },
    getAnimalIcon(type) {
      const icons = {
        cat: '🐱',
        dog: '🐶',
        bird: '🐦',
        rabbit: '🐰',
        mouse: '🐭',
        cow: '🐮',
        pig: '🐷',
        sheep: '🐑'
      };
      return icons[type] || '🐾';
    },
    getAnimalName(type) {
      const names = {
        cat: '猫咪',
        dog: '狗狗',
        bird: '小鸟',
        rabbit: '兔子',
        mouse: '老鼠',
        cow: '奶牛',
        pig: '小猪',
        sheep: '绵羊'
      };
      return names[type] || '动物';
    },
    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    formatDate(dateStr) {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
};
</script>

<style scoped>
.sound-player-container {
  padding: 30rpx;
  background: linear-gradient(180deg, #FFF5F7 0%, #FFFFFF 100%);
  min-height: 100vh;
}

/* 声音头部 */
.sound-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
  padding: 40rpx 30rpx;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF5F7 100%);
  border-radius: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(255, 105, 180, 0.15);
  position: relative;
  overflow: hidden;
}

.sound-header::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 105, 180, 0.05) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.animal-avatar {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.animal-icon {
  font-size: 100rpx;
  z-index: 1;
}

.avatar-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 105, 180, 0.3);
  animation: ringPulse 2s ease-in-out infinite;
}

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.5; }
}

.animal-name {
  font-size: 44rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 12rpx;
  z-index: 1;
}

.sound-emotion {
  font-size: 36rpx;
  color: #FF69B4;
  font-weight: 600;
  z-index: 1;
}

.duration-badge {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 20rpx;
  padding: 12rpx 24rpx;
  background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%);
  border-radius: 30rpx;
  z-index: 1;
}

.duration-icon {
  font-size: 24rpx;
}

.duration-text {
  font-size: 26rpx;
  color: #FFFFFF;
  font-weight: 600;
}

/* 播放器区域 */
.player-section {
  background: #FFFFFF;
  border-radius: 30rpx;
  padding: 40rpx 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.player-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.play-btn-wrapper {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 24rpx;
}

.play-btn {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.play-btn.paused {
  background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%);
  box-shadow: 0 12rpx 40rpx rgba(255, 105, 180, 0.4);
}

.play-btn.playing {
  background: linear-gradient(135deg, #FF1493 0%, #FF69B4 100%);
  box-shadow: 0 12rpx 40rpx rgba(255, 20, 147, 0.5);
}

.btn-inner {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10rpx);
}

.play-icon {
  font-size: 56rpx;
  color: #FFFFFF;
  font-weight: bold;
}

.btn-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 105, 180, 0.5);
  animation: btnPulse 1.5s ease-out infinite;
}

@keyframes btnPulse {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.3); opacity: 0; }
}

.play-status {
  font-size: 28rpx;
  color: #666666;
  font-weight: 500;
}

/* 进度条 */
.progress-section {
  margin-bottom: 30rpx;
}

.time-display {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.current-time, .total-time {
  font-size: 24rpx;
  color: #666666;
  font-weight: 500;
  font-family: 'DIN Alternate', monospace;
}

.progress-container {
  position: relative;
  height: 60rpx;
  display: flex;
  align-items: center;
}

.progress-track {
  width: 100%;
  height: 8rpx;
  background-color: #F0F0F0;
  border-radius: 4rpx;
  overflow: hidden;
  position: relative;
}

.progress-buffer {
  position: absolute;
  height: 100%;
  background-color: #E0E0E0;
  border-radius: 4rpx;
}

.progress-fill {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #FF69B4 0%, #FF1493 100%);
  border-radius: 4rpx;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 32rpx;
  height: 32rpx;
  margin-left: -16rpx;
  transition: left 0.1s linear;
}

.thumb-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%);
  box-shadow: 0 4rpx 12rpx rgba(255, 105, 180, 0.4);
  border: 4rpx solid #FFFFFF;
}

.progress-thumb.dragging .thumb-inner {
  transform: scale(1.2);
}

/* 控制选项 */
.control-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20rpx;
  border-top: 2rpx solid #F5F5F5;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 28rpx;
  background: #F8F8F8;
  border-radius: 32rpx;
  transition: all 0.3s ease;
}

.control-btn.active {
  background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%);
}

.control-icon {
  font-size: 28rpx;
}

.control-text {
  font-size: 24rpx;
  color: #666666;
  font-weight: 500;
}

.control-btn.active .control-text {
  color: #FFFFFF;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex: 1;
  margin-left: 30rpx;
}

.volume-icon {
  font-size: 32rpx;
}

.volume-slider {
  flex: 1;
}

/* 声音信息 */
.sound-info {
  background: #FFFFFF;
  border-radius: 30rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.info-header {
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #F5F5F5;
}

.info-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.info-icon {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFE5E8 100%);
  border-radius: 16rpx;
  font-size: 28rpx;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 24rpx;
  color: #999999;
  margin-bottom: 4rpx;
}

.info-value {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

/* 相关声音 */
.related-sounds {
  background: #FFFFFF;
  border-radius: 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.section-count {
  font-size: 24rpx;
  color: #999999;
  background: #F5F5F5;
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
}

.sound-list {
  display: flex;
  flex-direction: column;
}

.sound-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #F5F5F5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sound-item:last-child {
  border-bottom: none;
}

.sound-item:active {
  background: #F8F8F8;
  margin: 0 -30rpx;
  padding: 24rpx 30rpx;
}

.item-icon-wrapper {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFE5E8 100%);
  border-radius: 20rpx;
  margin-right: 20rpx;
}

.sound-item-icon {
  font-size: 40rpx;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 105, 180, 0.8);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.playing-indicator {
  font-size: 32rpx;
  color: #FFFFFF;
  animation: musicNote 1s ease-in-out infinite;
}

@keyframes musicNote {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4rpx); }
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.sound-item-emotion {
  font-size: 30rpx;
  color: #333333;
  font-weight: 500;
}

.sound-item-meta {
  font-size: 24rpx;
  color: #999999;
}

.item-play-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F5;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.item-play-btn.active {
  background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%);
}

.item-play-icon {
  font-size: 28rpx;
  color: #666666;
}

.item-play-btn.active .item-play-icon {
  color: #FFFFFF;
}

/* 加载和错误状态 */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 200rpx 0;
}

.loading text {
  font-size: 28rpx;
  color: #666666;
}

.error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 200rpx 0;
}

.error text {
  font-size: 28rpx;
  color: #FF4500;
  margin-bottom: 20rpx;
}

.retry-btn {
  width: 200rpx;
  height: 60rpx;
  font-size: 24rpx;
  background: linear-gradient(135deg, #FF69B4 0%, #FF1493 100%);
  color: #FFFFFF;
  border-radius: 30rpx;
  border: none;
}
</style>
