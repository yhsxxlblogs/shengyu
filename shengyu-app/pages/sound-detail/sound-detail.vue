<template>
  <view class="sound-detail-container page-enter">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
    
    <!-- 错误提示 -->
    <view v-else-if="error" class="error">
      <text>{{ error }}</text>
      <button @click="loadSoundData" class="retry-btn">重试</button>
    </view>
    
    <!-- 内容区域 -->
    <view v-else>
      <view class="sound-info">
        <text class="animal-icon">{{ getAnimalIcon(type) }}</text>
        <text class="animal-name">{{ getAnimalName(type) }}</text>
      </view>
      
      <view class="related-sounds">
        <text class="section-title">{{ getAnimalName(type) }}的各种声音</text>
        
        <!-- 空状态提示 -->
        <view v-if="relatedSounds.length === 0" class="empty-state">
          <text class="empty-icon">🎵</text>
          <text class="empty-text">暂无{{ getAnimalName(type) }}的声音</text>
          <text class="empty-subtext">成为第一个录制{{ getAnimalName(type) }}声音的人吧！</text>
          <button class="record-btn" @click="goRecord">去录制</button>
        </view>
        
        <view v-else class="sound-list">
          <view class="sound-item" v-for="sound in relatedSounds" :key="sound.id" @click="goSoundPlayer(sound.id)">
            <text class="sound-item-icon">{{ getAnimalIcon(type) }}</text>
            <text class="sound-item-emotion">{{ sound.emotion }}</text>
            <text class="sound-item-duration">{{ sound.duration }}s</text>
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
      type: '',
      animalInfo: null,
      relatedSounds: [],
      loading: false,
      error: ''
    };
  },
  onLoad(options) {
    this.type = options.type;
    this.loadAnimalInfo();
    this.loadSoundData();
  },
  methods: {
    // 加载动物信息
    async loadAnimalInfo() {
      try {
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/sound/animal-types-grouped',
          method: 'GET'
        });
        
        if (res.data.code === 200) {
          const categories = res.data.data;
          // 在所有分类中查找该类型
          for (const catName in categories) {
            const animal = categories[catName].items.find(item => item.type === this.type);
            if (animal) {
              this.animalInfo = animal;
              break;
            }
          }
        }
      } catch (error) {
        console.error('获取动物信息失败:', error);
      }
    },
    async loadSoundData() {
      this.loading = true;
      this.error = '';

      try {
        console.log('loadSoundData type:', this.type);
        
        // 先获取类型信息以获取type_id
        const typeRes = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/sound/animal-types-grouped',
          method: 'GET'
        });
        
        console.log('animal-types-grouped 响应:', typeRes);

        let typeId = null;
        if (typeRes.data.code === 200) {
          // 在所有分类中查找该类型
          const categories = typeRes.data.data;
          for (const catName in categories) {
            const type = categories[catName].items.find(item => item.type === this.type);
            if (type) {
              typeId = type.id;
              this.animalInfo = type;
              break;
            }
          }
        }
        
        console.log('找到的 typeId:', typeId);

        if (!typeId) {
          this.error = '未找到该类型: ' + this.type;
          this.relatedSounds = [];
          this.loading = false;
          return;
        }

        // 获取系统声音
        const soundUrl = `http://shengyu.supersyh.xyz/api/sound/system/by-type/${typeId}`;
        console.log('请求系统声音URL:', soundUrl);
        
        const res = await uni.request({
          url: soundUrl,
          method: 'GET'
        });
        
        console.log('系统声音响应:', res);

        if (res.data.code === 200) {
          const data = res.data.data;
          this.relatedSounds = data.map(item => ({
            id: item.id,
            emotion: item.emotion,
            duration: item.duration,
            url: item.sound_url
          }));
        } else {
          this.error = '获取数据失败: ' + (res.data.error || '未知错误');
          this.relatedSounds = [];
        }
      } catch (error) {
        console.error('获取声音数据失败:', error);
        this.error = '获取数据失败: ' + (error.message || '网络错误');
        this.relatedSounds = [];
      } finally {
        this.loading = false;
      }
    },

    getAnimalIcon(type) {
      // 优先使用从后端获取的动物信息
      if (this.animalInfo && this.animalInfo.icon) {
        return this.animalInfo.icon;
      }
      // 备用：使用本地硬编码
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
      // 优先使用从后端获取的动物信息
      if (this.animalInfo && this.animalInfo.name) {
        return this.animalInfo.name;
      }
      // 备用：使用本地硬编码
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
    goSoundPlayer(id) {
      uni.navigateTo({ url: `/pages/sound-player/sound-player?id=${id}&type=${this.type}` });
    },
    goRecord() {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后使用录制功能',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/login/login' });
            }
          }
        });
      } else {
        uni.navigateTo({ url: '/pages/record/record' });
      }
    }
  }
};
</script>

<style scoped>
@import '/static/styles/theme.css';

.sound-detail-container {
  padding: 24rpx 24rpx 280rpx;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 100%);
  min-height: 100vh;
  animation: slideUp 0.4s ease-out;
  box-sizing: border-box;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sound-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
  padding: 40rpx 0;
}

.animal-icon {
  font-size: 140rpx;
  margin-bottom: 24rpx;
  animation: float 3s ease-in-out infinite;
  filter: drop-shadow(0 8rpx 16rpx rgba(255, 154, 158, 0.3));
}

.animal-name {
  font-size: 52rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 相关声音卡片 - 玻璃拟态 */
.related-sounds {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 28rpx;
  padding: 32rpx;
  margin-bottom: 180rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.08);
}

.section-title {
  font-size: 34rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 24rpx;
  padding-left: 20rpx;
  position: relative;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8rpx;
  height: 32rpx;
  background: linear-gradient(180deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 4rpx;
}

.sound-list {
  display: flex;
  flex-direction: column;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
  animation: float 3s ease-in-out infinite;
}

.empty-text {
  font-size: 32rpx;
  color: #444;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.empty-subtext {
  font-size: 26rpx;
  color: #888;
  margin-bottom: 40rpx;
  text-align: center;
}

.record-btn {
  width: 280rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  background-size: 200% 200%;
  animation: gradient-flow 3s ease infinite;
  color: #FFFFFF;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(255, 154, 158, 0.35);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.record-btn:active {
  transform: scale(0.95);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.25);
}

/* 声音列表项 */
.sound-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.sound-item:active {
  background: rgba(255, 154, 158, 0.03);
  transform: translateX(8rpx);
}

.sound-item:last-child {
  border-bottom: none;
}

.sound-item-icon {
  font-size: 52rpx;
  margin-right: 24rpx;
  transition: all 0.3s ease;
}

.sound-item:active .sound-item-icon {
  transform: scale(1.15);
}

.sound-item-emotion {
  flex: 1;
  font-size: 30rpx;
  color: #444444;
  font-weight: 500;
}

.sound-item-duration {
  font-size: 24rpx;
  color: #888888;
}

/* 加载状态 */
.loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 200rpx 0;
}

.loading::before {
  content: '';
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid rgba(255, 154, 158, 0.2);
  border-top-color: #FF9A9E;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

.loading text {
  font-size: 28rpx;
  color: #888888;
}

/* 错误状态 */
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