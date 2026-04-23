<template>
  <view class="search-container page-enter">
    <view class="search-bar">
      <input type="text" v-model="keyword" placeholder="搜索声音、帖子、用户..." class="search-input" @input="handleInput" />
      <button class="search-btn" @click="search" :loading="loading">搜索</button>
    </view>
    
    <!-- 实时搜索结果 -->
    <view class="realtime-results" v-if="showRealtime">
      <!-- 动物类型搜索结果 -->
      <view class="result-section" v-if="realtimeResults.animalTypes.length > 0">
        <text class="section-title">动物类型</text>
        <view class="result-item animal-item" v-for="animal in realtimeResults.animalTypes" :key="animal.id" @click="goSoundDetail(animal.type)">
          <text class="result-icon">{{ animal.icon || getAnimalIcon(animal.type) }}</text>
          <view class="result-info">
            <text class="result-name">{{ animal.name }}</text>
            <text class="result-desc">{{ animal.description || '动物类型' }}</text>
          </view>
          <SvgIcon name="arrow-right" :size="28" class="arrow-svg" />
        </view>
      </view>
      
      <view class="result-section" v-if="realtimeResults.users.length > 0">
        <text class="section-title">用户</text>
        <view class="result-item user-item" v-for="user in realtimeResults.users" :key="user.id" @click="goUserProfile(user.id)">
          <view class="avatar-wrapper">
            <image :src="getImageUrl(user.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=FF69B4&color=fff&size=60`" class="user-avatar" mode="aspectFill"></image>
          </view>
          <view class="result-info">
            <text class="result-name">{{ user.username }}</text>
            <text class="result-desc">用户</text>
          </view>
          <SvgIcon name="arrow-right" :size="28" class="arrow-svg" />
        </view>
      </view>

      <view class="result-section" v-if="realtimeResults.posts.length > 0">
        <text class="section-title">帖子</text>
        <view class="result-item post-item" v-for="post in realtimeResults.posts" :key="post.id" @click="goPostDetail(post.id)">
          <SvgIcon name="file" :size="36" class="result-icon-svg" />
          <view class="result-info">
            <text class="result-name">{{ post.content.substring(0, 20) }}{{ post.content.length > 20 ? '...' : '' }}</text>
            <text class="result-desc">来自 {{ post.username }}</text>
          </view>
          <SvgIcon name="arrow-right" :size="28" class="arrow-svg" />
        </view>
      </view>

      <view class="result-section" v-if="realtimeResults.sounds.length > 0">
        <text class="section-title">音频</text>
        <view class="result-item sound-item" v-for="sound in realtimeResults.sounds" :key="sound.id" @click="goSoundDetail(sound.animal_type)">
          <text class="result-icon">{{ getAnimalIcon(sound.animal_type) }}</text>
          <view class="result-info">
            <text class="result-name">{{ getAnimalName(sound.animal_type) }}</text>
            <text class="result-desc">{{ sound.emotion }}</text>
          </view>
          <SvgIcon name="arrow-right" :size="28" class="arrow-svg" />
        </view>
      </view>

      <!-- 无搜索结果提示 -->
      <view class="no-result" v-if="realtimeResults.animalTypes.length === 0 && realtimeResults.users.length === 0 && realtimeResults.posts.length === 0 && realtimeResults.sounds.length === 0 && keyword.trim()">
        <SvgIcon name="search" :size="80" class="no-result-icon-svg" />
        <text class="no-result-text">没有找到相关结果</text>
        <text class="no-result-tip">试试搜索其他关键词</text>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view class="search-results" v-if="showResults">
      <!-- 动物类型搜索结果 -->
      <view class="result-section" v-if="results.animalTypes.length > 0">
        <text class="section-title">动物类型</text>
        <view class="result-item animal-item" v-for="animal in results.animalTypes" :key="animal.id" @click="goSoundDetail(animal.type)">
          <text class="result-icon">{{ animal.icon || getAnimalIcon(animal.type) }}</text>
          <view class="result-info">
            <text class="result-name">{{ animal.name }}</text>
            <text class="result-desc">{{ animal.description || '动物类型' }}</text>
          </view>
          <SvgIcon name="arrow-right" :size="28" class="arrow-svg" />
        </view>
      </view>

      <view class="result-section" v-if="results.users.length > 0">
        <text class="section-title">用户</text>
        <view class="result-item user-item" v-for="user in results.users" :key="user.id" @click="goUserProfile(user.id)">
          <view class="avatar-wrapper">
            <image :src="getImageUrl(user.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'User')}&background=FF69B4&color=fff&size=60`" class="user-avatar" mode="aspectFill"></image>
          </view>
          <view class="result-info">
            <text class="result-name">{{ user.username }}</text>
            <text class="result-desc">用户</text>
          </view>
          <SvgIcon name="arrow-right" :size="28" class="arrow-svg" />
        </view>
      </view>

      <view class="result-section" v-if="results.posts.length > 0">
        <text class="section-title">帖子</text>
        <view class="result-item post-item" v-for="post in results.posts" :key="post.id" @click="goPostDetail(post.id)">
          <SvgIcon name="file" :size="36" class="result-icon-svg" />
          <view class="result-info">
            <text class="result-name">{{ post.content.substring(0, 20) }}{{ post.content.length > 20 ? '...' : '' }}</text>
            <text class="result-desc">来自 {{ post.username }}</text>
          </view>
          <SvgIcon name="arrow-right" :size="28" class="arrow-svg" />
        </view>
      </view>
      
      <view class="result-section" v-if="results.sounds.length > 0">
        <text class="section-title">音频</text>
        <view class="result-item sound-item" v-for="sound in results.sounds" :key="sound.id" @click="goSoundDetail(sound.animal_type)">
          <text class="result-icon">{{ getAnimalIcon(sound.animal_type) }}</text>
          <view class="result-info">
            <text class="result-name">{{ getAnimalName(sound.animal_type) }}</text>
            <text class="result-desc">{{ sound.emotion }}</text>
          </view>
          <SvgIcon name="arrow-right" :size="28" class="arrow-svg" />
        </view>
      </view>

      <!-- 无搜索结果提示 -->
      <view class="no-result" v-if="results.animalTypes.length === 0 && results.users.length === 0 && results.posts.length === 0 && results.sounds.length === 0">
        <SvgIcon name="search" :size="80" class="no-result-icon-svg" />
        <text class="no-result-text">没有找到相关结果</text>
        <text class="no-result-tip">试试搜索其他关键词</text>
      </view>
    </view>
  </view>
</template>

<script>
import api, { getImageUrl } from '../../utils/api';

export default {
  data() {
    return {
      keyword: '',
      results: {
        users: [],
        posts: [],
        sounds: [],
        animalTypes: []
      },
      realtimeResults: {
        users: [],
        posts: [],
        sounds: [],
        animalTypes: []
      },
      searched: false,
      showRealtime: false,
      showResults: false,
      loading: false,
      searchTimer: null,
      allAnimalTypes: [] // 存储所有动物类型用于本地🔍
    };
  },
  onLoad() {
    // 页面加载时获取所有动物类型
    this.loadAnimalTypes();
  },
  methods: {
    async loadAnimalTypes() {
      try {
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/sound/animal-types-grouped',
          method: 'GET'
        });
        if (res.data && res.data.code === 200) {
          // 将分组数据转换为数组
          const categories = res.data.data || {};
          const allTypes = [];
          for (const catName in categories) {
            allTypes.push(...categories[catName].items);
          }
          this.allAnimalTypes = allTypes;
        }
      } catch (error) {
        console.error('加载动物类型失败:', error);
      }
    },
    searchAnimalTypes(keyword) {
      // 本地🔍动物类型
      if (!keyword.trim()) return [];
      const lowerKeyword = keyword.toLowerCase();
      return this.allAnimalTypes.filter(animal => {
        return animal.name.includes(keyword) || 
               animal.type.toLowerCase().includes(lowerKeyword) ||
               (animal.description && animal.description.includes(keyword));
      });
    },
    handleInput() {
      // 清除之前的定时器
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      
      // 立即显示实时🔍结果
      this.showRealtime = true;
      this.showResults = false;
      
      // 设置新的定时器，实现防抖
      this.searchTimer = setTimeout(() => {
        if (this.keyword.trim()) {
          this.realtimeSearch();
        } else {
          this.showRealtime = false;
        }
      }, 300);
    },
    async realtimeSearch() {
      try {
        // 本地🔍动物类型
        const animalTypes = this.searchAnimalTypes(this.keyword);
        
        // 调用后端API获取实时🔍结果
        const [usersRes, postsRes, soundsRes] = await Promise.all([
          uni.request({
            url: api.auth.search(this.keyword),
            method: 'GET'
          }),
          uni.request({
            url: `${api.post.list}?q=${encodeURIComponent(this.keyword)}`,
            method: 'GET'
          }),
          uni.request({
            url: api.sound.search(this.keyword),
            method: 'GET'
          })
        ]);
        
        this.realtimeResults = {
          users: usersRes.data.users || [],
          posts: postsRes.data.posts || [],
          sounds: soundsRes.data.sounds || [],
          animalTypes: animalTypes
        };
      } catch (error) {
        console.error('实时🔍失败:', error);
        this.realtimeResults = { users: [], posts: [], sounds: [], animalTypes: this.searchAnimalTypes(this.keyword) };
      }
    },
    async search() {
      if (!this.keyword) {
        uni.showToast({ title: '请输入🔍关键词', icon: 'none' });
        return;
      }
      
      this.loading = true;
      this.showRealtime = false;
      this.showResults = true;
      
      try {
        // 本地🔍动物类型
        const animalTypes = this.searchAnimalTypes(this.keyword);
        
        // 调用后端API获取🔍结果
        const [usersRes, postsRes, soundsRes] = await Promise.all([
          uni.request({
            url: api.auth.search(this.keyword),
            method: 'GET'
          }),
          uni.request({
            url: `${api.post.list}?q=${encodeURIComponent(this.keyword)}`,
            method: 'GET'
          }),
          uni.request({
            url: api.sound.search(this.keyword),
            method: 'GET'
          })
        ]);
        
        this.results = {
          users: usersRes.data.users || [],
          posts: postsRes.data.posts || [],
          sounds: soundsRes.data.sounds || [],
          animalTypes: animalTypes
        };
        this.searched = true;
      } catch (error) {
        uni.showToast({ title: '🔍失败', icon: 'none' });
        this.results = { users: [], posts: [], sounds: [], animalTypes: this.searchAnimalTypes(this.keyword) };
        this.searched = true;
      } finally {
        this.loading = false;
      }
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
    playSound(url) {
      uni.showToast({ title: '播放声音', icon: 'none' });
    },
    goUserProfile(userId) {
      // 跳转到用户个人主页
      uni.navigateTo({ url: `/pages/user-profile/user-profile?id=${userId}` });
    },
    goPostDetail(postId) {
      // 跳转到帖子详情页
      uni.navigateTo({ url: `/pages/post-detail/post-detail?id=${postId}` });
    },
    goSoundDetail(animalType) {
      // 跳转到音频播放页面
      uni.navigateTo({ url: `/pages/sound-detail/sound-detail?type=${animalType}` });
    },
    getImageUrl
  }
};
</script>

<style scoped>
@import '/static/styles/theme.css';

.search-container {
  padding: 20rpx;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 100%);
  min-height: 100vh;
}

/* 🔍栏 - 玻璃拟态 */
.search-bar {
  display: flex;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(255, 154, 158, 0.15);
  border-radius: 40rpx;
}

.search-input {
  flex: 1;
  height: 84rpx;
  border: 2rpx solid rgba(255, 154, 158, 0.3);
  border-radius: 42rpx 0 0 42rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10rpx);
  -webkit-backdrop-filter: blur(10rpx);
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: rgba(255, 154, 158, 0.5);
  background: #FFFFFF;
}

/* 🔍按钮 - 流动渐变 */
.search-btn {
  width: 130rpx;
  height: 84rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 3s ease infinite;
  color: #FFFFFF;
  border-radius: 0 42rpx 42rpx 0;
  font-size: 28rpx;
  font-weight: 600;
  border: none;
  transition: all 0.3s ease;
}

.search-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
}

/* 实时🔍结果 - 玻璃拟态 */
.realtime-results {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.08);
  margin-bottom: 24rpx;
}

/* 🔍结果 */
.search-results {
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.08);
}

/* 结果分区 */
.result-section {
  margin-bottom: 30rpx;
}

.result-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF9A9E 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20rpx;
  padding-left: 16rpx;
  position: relative;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 6rpx;
  height: 24rpx;
  background: linear-gradient(180deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 3rpx;
}

/* 结果项 */
.result-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #EEEEEE;
}

.result-item:last-child {
  border-bottom: none;
}

/* 用户头像 */
.avatar-wrapper {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.result-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.result-icon-svg {
  margin-right: 20rpx;
  color: #FF9A9E;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.result-name {
  font-size: 30rpx;
  color: #333;
  font-weight: 600;
  margin-bottom: 6rpx;
}

.result-desc {
  font-size: 24rpx;
  color: #999;
}

.arrow {
  font-size: 32rpx;
  color: #CCCCCC;
  margin-left: 10rpx;
}

.arrow-svg {
  color: #CCCCCC;
  margin-left: 10rpx;
}

.play-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #FFE4E1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-icon {
  font-size: 24rpx;
}

/* 无🔍结果提示 */
.no-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.no-result-icon {
  font-size: 100rpx;
  margin-bottom: 24rpx;
  animation: float 3s ease-in-out infinite;
}

.no-result-icon-svg {
  margin-bottom: 24rpx;
  color: #ddd;
  animation: float 3s ease-in-out infinite;
}

.no-result-text {
  font-size: 32rpx;
  color: #555555;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.no-result-tip {
  font-size: 26rpx;
  color: #888888;
}

/* 空结果 - 玻璃拟态 */
.empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  background: linear-gradient(145deg, #FFFFFF 0%, #FFF8F9 100%);
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  border: 1rpx solid rgba(255, 154, 158, 0.08);
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 24rpx;
  animation: float 3s ease-in-out infinite;
}

.empty-text {
  font-size: 28rpx;
  color: #888888;
}
</style>