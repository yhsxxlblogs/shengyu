<template>
  <view class="my-sounds-container page-enter">
    <!-- 🎤列表 -->
    <view class="sounds-list">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-else-if="sounds.length === 0" class="empty">
        <view class="empty-content">
          <view class="empty-icon-wrapper">
            <text class="empty-icon">🎙️</text>
            <view class="icon-ring"></view>
          </view>
          <text class="empty-title">还没有录制过音频</text>
          <text class="empty-subtitle">点击下方按钮开始你的第一次录音</text>
          <view class="record-btn-wrapper">
            <view class="record-btn" @click="goRecord">
              <text class="btn-icon">🎤</text>
              <text class="btn-text">去录制</text>
            </view>
          </view>
        </view>
      </view>
      <view v-else>
        <!-- 循环播放控制条 -->
        <view class="loop-control-bar">
          <view class="loop-toggle" @click="toggleLoop">
            <text class="loop-icon">{{ isLooping ? '🔁' : '➡️' }}</text>
            <text class="loop-text" :class="{ active: isLooping }">{{ isLooping ? '循环播放' : '单次播放' }}</text>
          </view>
        </view>
        
        <view class="sound-item" v-for="(sound, index) in sounds" :key="sound.id">
          <view class="sound-info" @click="playSound(index)">
            <view class="sound-header">
              <text class="sound-icon">{{ getAnimalIcon(sound.animal_type) }}</text>
              <view class="sound-details">
                <text class="sound-name">{{ getAnimalName(sound.animal_type) }}</text>
                <text class="sound-meta">{{ getAnimalName(sound.animal_type) }} - {{ sound.emotion }} · {{ formatDuration(sound.duration) }}</text>
              </view>
            </view>
            <text class="play-icon">{{ isPlaying === index ? '⏸️' : '▶️' }}</text>
          </view>
          <view class="sound-actions">
            <view class="visibility-toggle">
              <text class="toggle-label">展示到个人主页</text>
              <switch :checked="sound.visible" @change="toggleVisibility(sound.id, index, $event)" />
            </view>
            <text class="action-btn" @click="deleteSound(sound.id, index)">删除</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import api from '../../utils/api.js';

export default {
  data() {
    return {
      sounds: [],
      loading: false,
      isPlaying: -1,
      isLooping: false,
      audioContext: null,
      currentPlayingIndex: -1
    };
  },
  onUnload() {
    // 页面卸载时停止播放
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
      this.audioContext = null;
    }
  },
  onLoad() {
    this.loadSounds();
  },
  onShow() {
    this.loadSounds();
  },
  onPullDownRefresh() {
    this.loadSounds();
    uni.stopPullDownRefresh();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    goRecord() {
      uni.navigateTo({ url: '/pages/record/record' });
    },
    async loadSounds() {
      this.loading = true;
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          uni.showToast({ title: '请先登录', icon: 'none' });
          this.loading = false;
          return;
        }
        
        const res = await uni.request({
          url: api.sound.my,
          method: 'GET',
          header: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.statusCode === 200 && res.data.sounds) {
          // 确保每个音频都有visible属性，将数字转为布尔值
          this.sounds = res.data.sounds.map(sound => ({
            ...sound,
            visible: sound.visible === 1 || sound.visible === true
          }));
          console.log('加载音频列表:', this.sounds);
        } else {
          uni.showToast({ title: '获取音频列表失败', icon: 'none' });
        }
      } catch (error) {
        console.error('获取音频列表失败:', error);
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        this.loading = false;
      }
    },
    async toggleVisibility(soundId, index, event) {
      const newStatus = event.detail.value;
      console.log('切换可见性 - ID:', soundId, '新状态:', newStatus);
      
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          uni.showToast({ title: '请先登录', icon: 'none' });
          this.sounds[index].visible = !newStatus;
          return;
        }
        
        const res = await uni.request({
          url: `${api.sound.base}/${soundId}/visibility`,
          method: 'PUT',
          header: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            visible: newStatus ? 1 : 0
          }
        });
        
        console.log('切换可见性响应:', res);
        
        if (res.statusCode === 200) {
          this.sounds[index].visible = newStatus;
          uni.showToast({
            title: newStatus ? '已设置为公开' : '已设置为私密',
            icon: 'success'
          });
        } else {
          this.sounds[index].visible = !newStatus;
          uni.showToast({ title: res.data?.error || '操作失败', icon: 'none' });
        }
      } catch (error) {
        console.error('切换可见性失败:', error);
        this.sounds[index].visible = !newStatus;
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    playSound(index) {
      if (this.isPlaying === index) {
        // 停止播放
        this.stopSound();
      } else {
        // 开始播放新的音频
        this.playAudio(index);
      }
    },
    playAudio(index) {
      // 停止当前播放的音频
      if (this.audioContext) {
        this.audioContext.stop();
        this.audioContext.destroy();
        this.audioContext = null;
      }
      
      const sound = this.sounds[index];
      if (!sound.sound_url) {
        uni.showToast({ title: '音频地址无效', icon: 'none' });
        return;
      }
      
      // 创建音频上下文
      this.audioContext = uni.createInnerAudioContext();
      
      // 处理音频URL
      let audioUrl = sound.sound_url;
      if (!audioUrl.startsWith('http')) {
        audioUrl = `http://shengyu.supersyh.xyz${audioUrl}`;
      }
      this.audioContext.src = audioUrl;
      
      // 设置循环播放
      this.audioContext.loop = this.isLooping;
      
      // 监听播放事件
      this.audioContext.onPlay(() => {
        console.log('开始播放音频:', audioUrl);
        this.isPlaying = index;
        this.currentPlayingIndex = index;
      });
      
      this.audioContext.onEnded(() => {
        if (!this.isLooping) {
          this.isPlaying = -1;
          this.currentPlayingIndex = -1;
        }
      });
      
      this.audioContext.onError((res) => {
        console.error('播放错误:', res);
        uni.showToast({ title: '播放失败: ' + (res.errMsg || '未知错误'), icon: 'none' });
        this.isPlaying = -1;
        this.currentPlayingIndex = -1;
      });
      
      // 播放
      this.audioContext.play();
    },
    stopSound() {
      if (this.audioContext) {
        this.audioContext.stop();
        this.audioContext.destroy();
        this.audioContext = null;
      }
      this.isPlaying = -1;
      this.currentPlayingIndex = -1;
    },
    toggleLoop() {
      this.isLooping = !this.isLooping;
      // 如果正在播放，更新循环设置
      if (this.audioContext) {
        this.audioContext.loop = this.isLooping;
      }
      uni.showToast({
        title: this.isLooping ? '已开启循环播放' : '已关闭循环播放',
        icon: 'none'
      });
    },
    async deleteSound(soundId, index) {
      uni.showModal({
        title: '提示',
        content: '确定要删除这个🎤吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const token = uni.getStorageSync('token');
              if (!token) {
                uni.showToast({ title: '请先登录', icon: 'none' });
                return;
              }
              
              const res = await uni.request({
                url: `${api.sound.base}/${soundId}`,
                method: 'DELETE',
                header: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (res.statusCode === 200) {
                this.loadSounds();
                uni.showToast({ title: '删除成功', icon: 'success' });
              } else {
                uni.showToast({ title: '删除失败', icon: 'none' });
              }
            } catch (error) {
              console.error('删除音频失败:', error);
              uni.showToast({ title: '网络错误', icon: 'none' });
            }
          }
        }
      });
    },
    formatDuration(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    }
  }
};
</script>

<style scoped>
@import '/static/styles/theme.css';

.my-sounds-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 100%);
}

/* 声音列表 */
.sounds-list {
  padding: 24rpx;
}

/* 循环播放控制条 */
.loop-control-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20rpx;
  padding: 0 8rpx;
}

.loop-toggle {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 14rpx 28rpx;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFF5F7 100%);
  border-radius: 30rpx;
  border: 2rpx solid #FFE5E8;
  box-shadow: 0 4rpx 12rpx rgba(255, 154, 158, 0.15);
}

.loop-icon {
  font-size: 28rpx;
}

.loop-text {
  font-size: 24rpx;
  color: #666666;
  font-weight: 500;
}

.loop-text.active {
  color: #FF69B4;
  font-weight: 600;
}

/* 声音卡片 - 玻璃拟态 */
.sound-item {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.sound-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(90deg, transparent 0%, #FF9A9E 50%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sound-item:active {
  transform: translateY(-2rpx) scale(0.99);
  box-shadow: 0 8rpx 24rpx rgba(255, 154, 158, 0.12);
}

.sound-item:active::before {
  opacity: 1;
}

.sound-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15rpx;
}

.sound-header {
  display: flex;
  align-items: center;
  flex: 1;
}

.sound-icon {
  font-size: 56rpx;
  margin-right: 20rpx;
  filter: drop-shadow(2rpx 2rpx 4rpx rgba(0, 0, 0, 0.1));
}

.sound-details {
  flex: 1;
}

.sound-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #FF69B4;
  margin-bottom: 8rpx;
  display: block;
}

.sound-meta {
  font-size: 24rpx;
  color: #999999;
  display: block;
}

.play-icon {
  font-size: 40rpx;
  color: #FF69B4;
  padding: 10rpx;
  background: #FFF0F5;
  border-radius: 50%;
}

.sound-actions {
  border-top: 2rpx solid #FFF0F5;
  padding-top: 15rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.visibility-toggle {
  display: flex;
  align-items: center;
}

.toggle-label {
  font-size: 26rpx;
  color: #FF69B4;
  margin-right: 15rpx;
  font-weight: 500;
}

.action-btn {
  font-size: 26rpx;
  color: #FF4500;
  padding: 12rpx 25rpx;
  border-radius: 25rpx;
  background: linear-gradient(135deg, #FFE4E1 0%, #FFC0CB 100%);
  font-weight: 500;
  box-shadow: 0 2rpx 8rpx rgba(255, 69, 0, 0.2);
}

.action-btn:active {
  transform: scale(0.95);
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.loading text {
  font-size: 28rpx;
  color: #FF69B4;
}

/* 空状态 - 居中显示 */
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
}

.empty-icon-wrapper {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.empty-icon {
  font-size: 100rpx;
  z-index: 2;
  animation: float 3s ease-in-out infinite;
}

.icon-ring {
  position: absolute;
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 154, 158, 0.15) 0%, rgba(254, 207, 239, 0.15) 100%);
  animation: pulse 2s ease-in-out infinite;
}

.icon-ring::before {
  content: '';
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  right: 20rpx;
  bottom: 20rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 154, 158, 0.1) 0%, rgba(254, 207, 239, 0.1) 100%);
  animation: pulse 2s ease-in-out infinite 0.5s;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
}

.empty-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.empty-subtitle {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 60rpx;
}

.record-btn-wrapper {
  margin-top: 20rpx;
}

.record-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28rpx 60rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  border-radius: 50rpx;
  box-shadow: 0 8rpx 24rpx rgba(255, 154, 158, 0.4);
  animation: gradient-flow 3s ease infinite;
  transition: all 0.3s ease;
}

.record-btn:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 12rpx rgba(255, 154, 158, 0.3);
}

.btn-icon {
  font-size: 36rpx;
  margin-right: 12rpx;
}

.btn-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #FFFFFF;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 150rpx 0;
}

.empty-hint {
  font-size: 24rpx;
  color: #CCC;
  margin-top: 15rpx;
}
</style>
