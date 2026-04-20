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
      <view class="sound-header">
        <text class="animal-icon">{{ getAnimalIcon(animalType) }}</text>
        <text class="animal-name">{{ getAnimalName(animalType) }}</text>
        <text class="sound-emotion">{{ sound.emotion }}</text>
      </view>
      
      <view class="player-section">
        <view class="audio-player" :class="{ playing: isPlaying }" @click="togglePlay">
          <text class="player-icon">{{ isPlaying ? '⏸️' : '▶️' }}</text>
          <text class="player-text">{{ isPlaying ? '暂停' : '播放' }}</text>
        </view>
        
        <view class="progress-bar">
          <view class="progress-track">
            <view class="progress-fill" :style="{ width: progress + '%' }"></view>
          </view>
          <text class="time-text">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</text>
        </view>
        
        <!-- 循环播放选项 -->
        <view class="loop-control">
          <view class="loop-toggle" @click="toggleLoop">
            <text class="loop-icon">{{ isLooping ? '🔁' : '➡️' }}</text>
            <text class="loop-text" :class="{ active: isLooping }">{{ isLooping ? '循环播放' : '单次播放' }}</text>
          </view>
        </view>
      </view>
      
      <view class="sound-info">
        <view class="info-item">
          <text class="info-label">声音时长：</text>
          <text class="info-value">{{ sound.duration }}秒</text>
        </view>
        <view class="info-item">
          <text class="info-label">上传时间：</text>
          <text class="info-value">{{ formatDate(sound.created_at) }}</text>
        </view>
        <view class="info-item" v-if="sound.username">
          <text class="info-label">上传用户：</text>
          <text class="info-value">{{ sound.username }}</text>
        </view>
      </view>
      
      <view class="related-sounds">
        <text class="section-title">相关声音</text>
        <view class="sound-list">
          <view class="sound-item" v-for="item in relatedSounds" :key="item.id" @click="playSound(item)">
            <text class="sound-item-icon">{{ getAnimalIcon(animalType) }}</text>
            <text class="sound-item-emotion">{{ item.emotion }}</text>
            <text class="sound-item-duration">{{ item.duration }}s</text>
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
      duration: 0,
      progress: 0,
      audioContext: null,
      isLooping: false
    };
  },
  onLoad(options) {
    this.soundId = options.id;
    this.animalType = options.type;
    this.loadSoundDetail();
  },
  onUnload() {
    // 页面卸载时停止播放
    if (this.audioContext) {
      this.audioContext.pause();
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
          this.duration = this.sound.duration;
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
        this.audioContext.pause();
      }
      
      // 更新当前声音
      this.sound = sound;
      this.duration = sound.duration;
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
      
      // 监听播放事件
      this.audioContext.onPlay(() => {
        console.log('开始播放');
        this.isPlaying = true;
      });
      
      this.audioContext.onTimeUpdate(() => {
        this.currentTime = this.audioContext.currentTime;
        this.progress = (this.currentTime / this.duration) * 100;
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
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleString();
    }
  }
};
</script>

<style scoped>
.sound-player-container {
  padding: 20rpx;
  background-color: #F8F8F8;
  min-height: 100vh;
}

.sound-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
  padding: 30rpx;
  background-color: #FFFFFF;
  border-radius: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.animal-icon {
  font-size: 120rpx;
  margin-bottom: 20rpx;
}

.animal-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10rpx;
}

.sound-emotion {
  font-size: 32rpx;
  color: #FF69B4;
  font-weight: bold;
}

.player-section {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.audio-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #FF69B4;
  color: #FFFFFF;
  border-radius: 50%;
  width: 180rpx;
  height: 180rpx;
  margin: 0 auto 30rpx;
  cursor: pointer;
  box-shadow: 0 4rpx 20rpx rgba(255, 105, 180, 0.4);
  transition: all 0.3s ease;
}

.audio-player:hover {
  transform: scale(1.05);
}

.audio-player.playing {
  background-color: #FF1493;
}

.player-icon {
  font-size: 60rpx;
  margin-bottom: 10rpx;
}

.player-text {
  font-size: 28rpx;
  font-weight: bold;
}

.progress-bar {
  margin-top: 20rpx;
}

.progress-track {
  width: 100%;
  height: 8rpx;
  background-color: #F0F0F0;
  border-radius: 4rpx;
  overflow: hidden;
  margin-bottom: 10rpx;
}

.progress-fill {
  height: 100%;
  background-color: #FF69B4;
  border-radius: 4rpx;
  transition: width 0.1s ease;
}

.time-text {
  font-size: 20rpx;
  color: #999999;
  text-align: center;
}

/* 循环播放控制 */
.loop-control {
  margin-top: 30rpx;
  display: flex;
  justify-content: center;
}

.loop-toggle {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, #FFF5F7 0%, #F0F0F0 100%);
  border-radius: 32rpx;
  border: 2rpx solid #FFE5E8;
  transition: all 0.3s ease;
}

.loop-toggle:active {
  transform: scale(0.95);
}

.loop-icon {
  font-size: 32rpx;
}

.loop-text {
  font-size: 26rpx;
  color: #666666;
  font-weight: 500;
}

.loop-text.active {
  color: #FF69B4;
  font-weight: 600;
}

.sound-info {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.info-item {
  display: flex;
  margin-bottom: 20rpx;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 24rpx;
  color: #999999;
  width: 120rpx;
}

.info-value {
  font-size: 24rpx;
  color: #333333;
  flex: 1;
}

.related-sounds {
  background-color: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  padding-left: 10rpx;
  border-left: 6rpx solid #FF69B4;
}

.sound-list {
  display: flex;
  flex-direction: column;
}

.sound-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #EEEEEE;
  cursor: pointer;
}

.sound-item:last-child {
  border-bottom: none;
}

.sound-item:hover {
  background-color: #F8F8F8;
}

.sound-item-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.sound-item-emotion {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}

.sound-item-duration {
  font-size: 24rpx;
  color: #999999;
}

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
  background-color: #FF69B4;
  color: #FFFFFF;
  border-radius: 30rpx;
}
</style>