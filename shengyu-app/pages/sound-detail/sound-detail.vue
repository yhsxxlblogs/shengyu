<template>
  <view class="sound-detail-container">
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
    <view v-else class="content-wrapper">
      <!-- 声音信息卡片 -->
      <view class="sound-header">
        <view class="animal-avatar">
          <text class="animal-icon">{{ getAnimalIcon(animalType) }}</text>
        </view>
        <text class="animal-name">{{ getAnimalName(animalType) }}</text>
        <text class="sound-emotion">{{ sound.emotion }}</text>
        <view class="duration-badge" v-if="audioDuration > 0">
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
              :class="{ playing: isPlaying }" 
              @click="togglePlay"
            >
              <text class="play-icon">{{ isPlaying ? '❚❚' : '▶' }}</text>
            </view>
          </view>
          
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
              <view class="progress-fill" :style="{ width: progress + '%' }"></view>
            </view>
            <view class="progress-thumb" :style="{ left: progress + '%' }" :class="{ dragging: isDragging }"></view>
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
              block-size="14"
              activeColor="#FF9A9E"
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
      isPlaying: false,
      currentTime: 0,
      audioDuration: 0,
      progress: 0,
      audioContext: null,
      isLooping: false,
      volume: 100,
      currentSoundId: '',
      isDragging: false,
      progressRect: null
    };
  },
  onLoad(options) {
    this.soundId = options.id;
    this.animalType = options.type;
    this.currentSoundId = options.id;
    this.loadSoundDetail();
  },
  onUnload() {
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
          if (this.sound.sound_url && !this.sound.sound_url.startsWith('http')) {
            this.sound.sound_url = 'http://shengyu.supersyh.xyz' + (this.sound.sound_url.startsWith('/') ? this.sound.sound_url : '/' + this.sound.sound_url);
          }
          // 先使用数据库中的时长，加载音频后会更新为实际时长
          this.audioDuration = this.sound.duration || 0;
          
          // 预加载音频获取实际时长
          this.preloadAudioDuration();
        } else {
          this.error = '获取声音详情失败';
        }
        
        // 获取相关声音
        const relatedRes = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/sound/by-animal/${this.animalType}`,
          method: 'GET'
        });
        
        if (relatedRes.data.code === 200) {
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
    
    // 预加载音频获取时长
    preloadAudioDuration() {
      if (!this.sound.sound_url) return;
      
      const tempAudio = uni.createInnerAudioContext();
      tempAudio.src = this.sound.sound_url;
      
      tempAudio.onCanplay(() => {
        if (tempAudio.duration > 0) {
          this.audioDuration = tempAudio.duration;
          console.log('预加载音频时长:', this.audioDuration);
        }
        tempAudio.destroy();
      });
      
      tempAudio.onError(() => {
        tempAudio.destroy();
      });
    },
    
    togglePlay() {
      if (this.isPlaying) {
        this.pauseSound();
      } else {
        this.playSound(this.sound);
      }
    },
    
    playSound(sound) {
      if (this.audioContext) {
        this.audioContext.stop();
        this.audioContext.destroy();
      }
      
      this.sound = sound;
      this.currentSoundId = sound.id;
      this.currentTime = 0;
      this.progress = 0;
      
      this.audioContext = uni.createInnerAudioContext();
      
      let soundUrl = sound.sound_url;
      if (!soundUrl) {
        uni.showToast({ title: '音频地址为空', icon: 'none' });
        return;
      }
      
      if (!soundUrl.startsWith('http')) {
        soundUrl = 'http://shengyu.supersyh.xyz' + (soundUrl.startsWith('/') ? soundUrl : '/' + soundUrl);
      }
      
      this.audioContext.src = soundUrl;
      this.audioContext.volume = this.volume / 100;
      
      this.audioContext.onCanplay(() => {
        if (this.audioContext.duration > 0) {
          this.audioDuration = this.audioContext.duration;
        }
      });
      
      this.audioContext.onPlay(() => {
        this.isPlaying = true;
      });
      
      this.audioContext.onTimeUpdate(() => {
        if (!this.isDragging) {
          this.currentTime = this.audioContext.currentTime;
          if (this.audioDuration > 0) {
            this.progress = (this.currentTime / this.audioDuration) * 100;
          }
        }
      });
      
      this.audioContext.onEnded(() => {
        if (this.isLooping) {
          this.audioContext.seek(0);
          this.audioContext.play();
          this.currentTime = 0;
          this.progress = 0;
        } else {
          this.isPlaying = false;
          this.currentTime = 0;
          this.progress = 0;
        }
      });
      
      this.audioContext.onError((res) => {
        this.isPlaying = false;
        uni.showToast({ title: '播放失败', icon: 'none' });
      });
      
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
        cat: '🐱', dog: '🐶', bird: '🐦', rabbit: '🐰',
        mouse: '🐭', cow: '🐮', pig: '🐷', sheep: '🐑'
      };
      return icons[type] || '🐾';
    },
    
    getAnimalName(type) {
      const names = {
        cat: '猫咪', dog: '狗狗', bird: '小鸟', rabbit: '兔子',
        mouse: '老鼠', cow: '奶牛', pig: '小猪', sheep: '绵羊'
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
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.sound-detail-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 100%);
  padding: 24rpx;
  box-sizing: border-box;
}

.content-wrapper {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

/* 声音头部 */
.sound-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
  padding: 32rpx 24rpx;
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.1);
}

.animal-avatar {
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 50%;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
}

.animal-icon {
  font-size: 64rpx;
}

.animal-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #444;
  margin-bottom: 8rpx;
}

.sound-emotion {
  font-size: 28rpx;
  color: #FF9A9E;
  margin-bottom: 12rpx;
}

.duration-badge {
  padding: 8rpx 20rpx;
  background: rgba(255, 154, 158, 0.1);
  border-radius: 20rpx;
}

.duration-text {
  font-size: 24rpx;
  color: #FF9A9E;
  font-weight: 500;
}

/* 播放器区域 */
.player-section {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.player-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
}

.play-btn-wrapper {
  margin-bottom: 16rpx;
}

.play-btn {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  box-shadow: 0 6rpx 20rpx rgba(255, 154, 158, 0.35);
  transition: all 0.3s ease;
}

.play-btn.playing {
  background: linear-gradient(135deg, #FECFEF 0%, #FF9A9E 100%);
}

.play-btn:active {
  transform: scale(0.95);
  box-shadow: 0 3rpx 12rpx rgba(255, 154, 158, 0.25);
}

.play-icon {
  font-size: 40rpx;
  color: #FFFFFF;
  margin-left: 4rpx;
}

.play-status {
  font-size: 26rpx;
  color: #888;
}

/* 进度条 */
.progress-section {
  margin-bottom: 24rpx;
}

.time-display {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.current-time, .total-time {
  font-size: 22rpx;
  color: #888;
  font-family: monospace;
}

.progress-container {
  position: relative;
  height: 40rpx;
  display: flex;
  align-items: center;
}

.progress-track {
  width: 100%;
  height: 6rpx;
  background-color: #F0F0F0;
  border-radius: 3rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 3rpx;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 24rpx;
  height: 24rpx;
  background: #FFFFFF;
  border-radius: 50%;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
  border: 2rpx solid #FF9A9E;
  transition: left 0.1s linear;
}

.progress-thumb.dragging {
  transform: translate(-50%, -50%) scale(1.2);
}

/* 控制选项 */
.control-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20rpx;
  border-top: 1rpx solid #F5F5F5;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  background: #F8F8F8;
  border-radius: 24rpx;
  transition: all 0.3s ease;
}

.control-btn.active {
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
}

.control-icon {
  font-size: 24rpx;
}

.control-text {
  font-size: 22rpx;
  color: #666;
}

.control-btn.active .control-text {
  color: #FFFFFF;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex: 1;
  margin-left: 24rpx;
}

.volume-icon {
  font-size: 28rpx;
}

.volume-slider {
  flex: 1;
}

/* 声音信息 */
.sound-info {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.info-header {
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.info-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #444;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.info-icon {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFEBEE 100%);
  border-radius: 12rpx;
  font-size: 24rpx;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 2rpx;
}

.info-value {
  font-size: 26rpx;
  color: #444;
  font-weight: 500;
}

/* 相关声音 */
.related-sounds {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #444;
}

.section-count {
  font-size: 22rpx;
  color: #999;
  background: #F5F5F5;
  padding: 6rpx 14rpx;
  border-radius: 12rpx;
}

.sound-list {
  display: flex;
  flex-direction: column;
}

.sound-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F5F5F5;
  transition: all 0.2s ease;
}

.sound-item:last-child {
  border-bottom: none;
}

.sound-item:active {
  background: rgba(255, 154, 158, 0.03);
}

.item-icon-wrapper {
  position: relative;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFEBEE 100%);
  border-radius: 16rpx;
  margin-right: 16rpx;
}

.sound-item-icon {
  font-size: 36rpx;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 154, 158, 0.85);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.playing-indicator {
  font-size: 28rpx;
  color: #FFFFFF;
  animation: bounce 0.6s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4rpx); }
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.sound-item-emotion {
  font-size: 28rpx;
  color: #444;
  font-weight: 500;
}

.sound-item-meta {
  font-size: 22rpx;
  color: #999;
}

.item-play-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F5;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.item-play-btn.active {
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
}

.item-play-icon {
  font-size: 24rpx;
  color: #666;
}

.item-play-btn.active .item-play-icon {
  color: #FFFFFF;
}

/* 加载和错误状态 */
.loading, .error {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 200rpx 0;
}

.loading text, .error text {
  font-size: 28rpx;
  color: #888;
  margin-bottom: 20rpx;
}

.retry-btn {
  width: 200rpx;
  height: 60rpx;
  font-size: 26rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
  border-radius: 30rpx;
  border: none;
}
</style>
