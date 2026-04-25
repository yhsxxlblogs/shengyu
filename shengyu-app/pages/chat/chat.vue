<template>
  <view class="chat-container page-enter">
    <!-- 自定义导航栏 - 仿原生风格 -->
    <view class="custom-header">
      <view class="header-left" @click="goBack">
        <text class="back-arrow">‹</text>
        <text class="back-text">返回</text>
      </view>
      <view class="header-title-area">
        <text class="header-title-text">{{ username }}</text>
        <view class="connection-status">
          <view v-if="wsConnected" class="status-dot online"></view>
          <view v-else class="status-dot offline"></view>
          <text class="status-text">{{ wsConnected ? '在线' : '离线' }}</text>
        </view>
      </view>
      <view class="header-right">
        <text class="clear-btn" @click="showClearDialog">清空</text>
      </view>
    </view>

    <view v-if="showClearModal" class="modal-overlay" @click="closeClearModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">清空聊天记录</text>
        </view>
        <view class="modal-body">
          <text class="modal-text">请选择清空范围：</text>
          <view class="checkbox-wrapper">
            <view class="checkbox-item" @click="clearCloud = !clearCloud">
              <view class="checkbox" :class="{ 'checked': clearCloud }">
                <text v-if="clearCloud" class="check-icon">✓</text>
              </view>
              <text class="checkbox-label">同时清空云端记录</text>
            </view>
          </view>
        </view>
        <view class="modal-footer">
          <button class="modal-btn cancel" @click="closeClearModal">取消</button>
          <button class="modal-btn confirm" @click="clearChatHistory">确定</button>
        </view>
      </view>
    </view>

    <scroll-view 
      class="chat-messages" 
      scroll-y 
      :scroll-top="scrollTop" 
      @scrolltoupper="loadMoreMessages"
      :scroll-with-animation="false"
    >
      <view v-if="loadingMore" class="loading-more">
        <text>加载中...</text>
      </view>
      <view class="message-list">
        <view 
          v-for="(msg, index) in messages" 
          :key="msg.id" 
          class="message-item"
          :class="{ 'self': String(msg.sender_id) === String(currentUserId) }"
        >
          <view class="message-time" v-if="showTime(index)">
            <text>{{ formatTime(msg.created_at) }}</text>
          </view>
          
          <view class="message-content-wrapper">
            <image 
              v-if="String(msg.sender_id) !== String(currentUserId)"
              :src="getImageUrl(msg.avatar) || defaultAvatar(msg.username)" 
              class="message-avatar left" 
              mode="aspectFill"
              @click="goToUserProfile(msg.sender_id)"
            ></image>
            
            <view class="message-bubble" :class="{ 'self': String(msg.sender_id) === String(currentUserId) }">
              <text class="message-text">{{ msg.content }}</text>
            </view>
            
            <image 
              v-if="String(msg.sender_id) === String(currentUserId)"
              :src="getImageUrl(currentUserAvatar) || defaultAvatar('我')" 
              class="message-avatar right" 
              mode="aspectFill"
              @click="goToUserProfile(currentUserId)"
            ></image>
          </view>
          
          <view 
            v-if="String(msg.sender_id) === String(currentUserId) && !isMutual && msg.remainingMessages !== undefined && msg.remainingMessages >= 0" 
            class="message-limit-hint"
          >
            <text class="limit-hint-text">{{ getLimitHintText(msg.remainingMessages) }}</text>
          </view>
        </view>
      </view>
      <view class="bottom-space"></view>
    </scroll-view>

    <view class="input-container">
      <view v-if="!canSend" class="limit-warning">
        <text class="limit-text">{{ limitMessage }}</text>
      </view>
      <view v-else class="input-wrapper">
        <view class="input-area">
          <input
            type="text"
            v-model="inputMessage"
            :placeholder="inputPlaceholder"
            class="message-input"
            confirm-type="send"
            @confirm="sendMessage"
            :maxlength="maxMessageLength"
          />
          <text class="char-count" :class="{ 'over-limit': inputMessage.length > maxMessageLength * 0.9 }">
            {{ inputMessage.length }}/{{ maxMessageLength }}
          </text>
        </view>
        <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim() || inputMessage.length > maxMessageLength">
          发送
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import wsService from '@/utils/websocket.js'
import { formatDateTime } from '@/utils/api.js'

export default {
  data() {
    return {
      userId: null,
      username: '',
      currentUserId: null,
      currentUserAvatar: '',
      messages: [],
      inputMessage: '',
      loading: false,
      loadingMore: false,
      page: 1,
      hasMore: true,
      scrollTop: 99999,
      isFirstLoad: true,
      canSend: true,
      isMutual: false,
      remainingMessages: -1,
      limitMessage: '',
      senderFollows: false,
      receiverFollows: false,
      showClearModal: false,
      clearCloud: false,
      maxMessageLength: 500,
      wsConnected: false,

    }
  },
  computed: {
    inputPlaceholder() {
      if (this.isMutual) {
        return '输入消息...';
      }
      if (this.remainingMessages > 0) {
        return `还可发送 ${this.remainingMessages} 条消息（对方回复后可继续）`;
      }
      return '输入消息...';
    }
  },
  onLoad(options) {
    this.userId = options.userId;
    this.username = decodeURIComponent(options.username || '用户');
    this.currentUserId = uni.getStorageSync('userId');
    this.currentUserAvatar = uni.getStorageSync('userAvatar') || '';
    this.isFirstLoad = true;
    this.checkMessageLimit();
    this.initWebSocket();
  },
  onUnload() {
    this.removeWebSocketListeners();
    // 标记消息为已读
    this.markMessagesAsRead();
    // 刷新消息列表和未读数
    uni.$emit('refreshMessages');
    uni.$emit('updateUnreadCount');
  },
  onHide() {
    // 页面隐藏时也标记已读
    this.markMessagesAsRead();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },

    // 标记消息为已读
    async markMessagesAsRead() {
      const token = uni.getStorageSync('token');
      if (!token) return;
      
      try {
        // 调用后端API标记已读
        await uni.request({
          url: `http://shengyu.supersyh.xyz/api/social/messages/read/${this.userId}`,
          method: 'PUT',
          header: { Authorization: `Bearer ${token}` }
        });
        
        // 通过WebSocket发送已读通知
        if (this.wsConnected && wsService.getConnectionStatus()) {
          wsService.markAsRead(this.userId);
        }
      } catch (e) {
        console.error('标记已读失败:', e);
      }
    },

    initWebSocket() {
      const token = uni.getStorageSync('token')
      const userId = uni.getStorageSync('userId')
      
      if (!token || !userId) return
      
      this.removeWebSocketListeners()
      
      wsService.on('connected', this.onWsConnected)
      wsService.on('disconnected', this.onWsDisconnected)
      wsService.on('new_message', this.onNewMessage)
      wsService.on('message_sent', this.onMessageSent)
      wsService.on('message_read', this.onMessageRead)
      wsService.on('typing', this.onTyping)
      wsService.on('reconnect_failed', this.onReconnectFailed)
      
      if (wsService.getConnectionStatus()) {
        this.wsConnected = true
        this.loadMessages()
      } else {
        wsService.connect(userId, token)
        this.loadMessages()
      }
    },
    
    removeWebSocketListeners() {
      wsService.off('connected', this.onWsConnected)
      wsService.off('disconnected', this.onWsDisconnected)
      wsService.off('new_message', this.onNewMessage)
      wsService.off('message_sent', this.onMessageSent)
      wsService.off('message_read', this.onMessageRead)
      wsService.off('typing', this.onTyping)
      wsService.off('reconnect_failed', this.onReconnectFailed)
    },
    
    onWsConnected() {
      console.log('聊天页面 WebSocket 已连接')
      this.wsConnected = true
    },
    
    onWsDisconnected() {
      console.log('聊天页面 WebSocket 已断开')
      this.wsConnected = false
    },
    
    onNewMessage(message) {
      console.log('收到新消息:', message)
      
      if (String(message.sender_id) === String(this.userId)) {
        const exists = this.messages.some(m => m.id === message.id)
        if (!exists) {
          this.messages.push(message)
          this.scrollToBottom()
          this.saveMessagesToCache()
          
          wsService.markAsRead(this.userId)
          
          if (!this.isMutual) {
            this.remainingMessages = 3
            this.canSend = true
          }
        }
      }
    },
    
    onMessageSent(message) {
      console.log('消息发送成功:', message)
      // 替换临时消息为服务器返回的真实消息
      const tempIndex = this.messages.findIndex(m => m.pending && m.content === message.content)
      if (tempIndex !== -1) {
        this.messages.splice(tempIndex, 1, { ...message, pending: false })
        this.saveMessagesToCache()
      } else {
        // 如果没有找到临时消息，检查是否已存在
        const exists = this.messages.some(m => m.id === message.id)
        if (!exists) {
          this.messages.push(message)
          this.scrollToBottom()
          this.saveMessagesToCache()
        }
      }
    },
    
    onMessageRead(data) {
      console.log('消息已读:', data)
    },
    
    onTyping(data) {
      if (String(data.userId) === String(this.userId)) {
        console.log('对方正在输入:', data.isTyping)
      }
    },
    
    onReconnectFailed() {
      console.log('WebSocket 重连失败')
      this.wsConnected = false
      uni.showToast({
        title: '实时连接失败',
        icon: 'none'
      })
    },

    showClearDialog() {
      this.showClearModal = true;
      this.clearCloud = false;
    },

    closeClearModal() {
      this.showClearModal = false;
      this.clearCloud = false;
    },

    async clearChatHistory() {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }

      uni.showLoading({ title: '清空中...' });

      try {
        this.clearLocalCache();
        this.messages = [];
        this.page = 1;
        this.hasMore = true;

        if (this.clearCloud) {
          const res = await uni.request({
            url: `http://shengyu.supersyh.xyz/api/social/messages/clear/${this.userId}`,
            method: 'DELETE',
            header: { Authorization: `Bearer ${token}` }
          });

          if (res.statusCode === 200) {
            uni.showToast({ title: '聊天记录已清空', icon: 'success' });
          } else {
            uni.showToast({ title: '云端记录清空失败', icon: 'none' });
          }
        } else {
          uni.showToast({ title: '本地记录已清空', icon: 'success' });
        }

        uni.$emit('refreshMessages');
      } catch (e) {
        console.error('清空聊天记录失败:', e);
        uni.showToast({ title: '清空失败', icon: 'none' });
      } finally {
        uni.hideLoading();
        this.closeClearModal();
      }
    },

    getLimitHintText(remaining) {
      if (this.isMutual) {
        return '';
      }
      if (remaining === 0) {
        return '对方回复前无法继续发送私信';
      }
      if (!this.receiverFollows && this.senderFollows) {
        return `对方未关注你，对方回复之前还能发送${remaining}条私信`;
      }
      if (!this.senderFollows && this.receiverFollows) {
        return `你未关注对方，对方回复之前还能发送${remaining}条私信`;
      }
      if (!this.senderFollows && !this.receiverFollows) {
        return `双方未互相关注，对方回复之前还能发送${remaining}条私信`;
      }
      return '';
    },
    
    async checkMessageLimit() {
      const token = uni.getStorageSync('token');
      if (!token) return;
      
      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/social/messages/limit/${this.userId}`,
          method: 'GET',
          header: { Authorization: `Bearer ${token}` }
        });
        
        if (res.statusCode === 200) {
          this.isMutual = res.data.isMutual;
          this.remainingMessages = res.data.remainingMessages;
          this.canSend = res.data.canSend;
          this.senderFollows = res.data.senderFollows;
          this.receiverFollows = res.data.receiverFollows;
          
          if (!this.canSend) {
            this.limitMessage = this.isMutual 
              ? '无法发送消息' 
              : '对方未回复前，只能发送3条私信';
          }
        }
      } catch (e) {
        console.error('检查消息限制失败:', e);
      }
    },
    
    goToUserProfile(userId) {
      if (!userId) return;
      if (String(userId) === String(this.currentUserId)) {
        uni.switchTab({
          url: '/pages/main/main'
        });
      } else {
        uni.navigateTo({
          url: `/pages/user-profile/user-profile?id=${userId}`
        });
      }
    },
    
    getImageUrl(url) {
      if (!url) return null;
      if (url.startsWith('http')) return url;
      return `http://shengyu.supersyh.xyz${url}`;
    },
    
    defaultAvatar(name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=FF69B4&color=fff&size=60`;
    },
    
    formatTime(time) {
      // 使用通用的日期格式化函数，确保安卓兼容性
      return formatDateTime(time, 'datetime');
    },
    
    showTime(index) {
      if (index === 0) return true;
      const current = new Date(this.messages[index].created_at);
      const prev = new Date(this.messages[index - 1].created_at);
      return current - prev > 300000;
    },
    
    getCacheKey() {
      return `chat_messages_${this.currentUserId}_${this.userId}`;
    },

    loadMessagesFromCache() {
      try {
        const cacheKey = this.getCacheKey();
        const cached = uni.getStorageSync(cacheKey);
        if (cached && cached.messages && cached.messages.length > 0) {
          this.messages = cached.messages;
          console.log('从本地缓存加载消息:', this.messages.length, '条');
          return true;
        }
      } catch (e) {
        console.error('读取本地缓存失败:', e);
      }
      return false;
    },

    saveMessagesToCache() {
      try {
        const cacheKey = this.getCacheKey();
        uni.setStorageSync(cacheKey, {
          messages: this.messages,
          updateTime: Date.now()
        });
      } catch (e) {
        console.error('保存本地缓存失败:', e);
      }
    },

    clearLocalCache() {
      try {
        const cacheKey = this.getCacheKey();
        uni.removeStorageSync(cacheKey);
        const clearedKey = `${cacheKey}_cleared`;
        uni.setStorageSync(clearedKey, { clearedAt: Date.now() });
        console.log('已清空本地缓存并设置清空标记');
      } catch (e) {
        console.error('清空本地缓存失败:', e);
      }
    },

    getClearedCacheInfo() {
      try {
        const cacheKey = this.getCacheKey();
        const clearedKey = `${cacheKey}_cleared`;
        return uni.getStorageSync(clearedKey);
      } catch (e) {
        return null;
      }
    },

    clearClearedMark() {
      try {
        const cacheKey = this.getCacheKey();
        const clearedKey = `${cacheKey}_cleared`;
        uni.removeStorageSync(clearedKey);
        console.log('已清除清空标记');
      } catch (e) {
        console.error('清除清空标记失败:', e);
      }
    },

    async loadNewMessagesAfter(timestamp) {
      const token = uni.getStorageSync('token');
      if (!token) return;

      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/social/messages/${this.userId}?page=1&limit=20&after=${timestamp}`,
          method: 'GET',
          header: { Authorization: `Bearer ${token}` }
        });

        if (res.statusCode === 200) {
          const newMessages = res.data.messages || [];
          if (newMessages.length > 0) {
            this.messages = newMessages;
            this.saveMessagesToCache();
            this.clearClearedMark();
          }
          this.hasMore = res.data.hasMore;
          this.isFirstLoad = false;
          this.scrollToBottom();
        }
      } catch (e) {
        console.error('加载新消息失败:', e);
      }
    },

    async loadMessages() {
      if (this.loading) return;
      this.loading = true;

      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }

      if (this.page === 1 && this.messages.length === 0) {
        const clearedInfo = this.getClearedCacheInfo();
        if (clearedInfo && clearedInfo.clearedAt) {
          console.log('用户已清空聊天记录，只加载新消息');
          await this.loadNewMessagesAfter(clearedInfo.clearedAt);
          this.loading = false;
          return;
        }
        
        const hasCache = this.loadMessagesFromCache();
        if (hasCache) {
          this.isFirstLoad = false;
          this.scrollToBottom();
        }
      }

      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/social/messages/${this.userId}?page=${this.page}&limit=20`,
          method: 'GET',
          header: { Authorization: `Bearer ${token}` }
        });

        if (res.statusCode === 200) {
          const newMessages = res.data.messages || [];

          if (this.page === 1) {
            if (this.messages.length > 0) {
              const localIds = new Set(this.messages.map(m => m.id));
              const cloudNewMessages = newMessages.filter(m => !localIds.has(m.id));
              if (cloudNewMessages.length > 0) {
                this.messages = [...this.messages, ...cloudNewMessages];
              }
            } else {
              this.messages = newMessages;
            }
            this.saveMessagesToCache();
          } else {
            const existingIds = new Set(this.messages.map(m => m.id));
            const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));
            if (uniqueNewMessages.length > 0) {
              this.messages = [...uniqueNewMessages, ...this.messages];
              this.saveMessagesToCache();
            }
          }
          this.hasMore = res.data.hasMore;

          if (this.isFirstLoad) {
            this.isFirstLoad = false;
            this.scrollToBottom();
          }
        }
      } catch (e) {
        console.error('加载消息失败:', e);
      }

      this.loading = false;
      this.loadingMore = false;
    },
    
    loadMoreMessages() {
      if (!this.hasMore || this.loadingMore) return;
      this.loadingMore = true;
      this.page++;
      this.loadMessages();
    },
    

    
    async sendMessage() {
      const content = this.inputMessage.trim();
      if (!content) return;
      
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      
      this.inputMessage = '';
      
      if (this.wsConnected && wsService.getConnectionStatus()) {
        const tempId = `temp_${Date.now()}_${Math.random()}`
        const currentRemaining = this.remainingMessages
        
        this.messages.push({
          id: tempId,
          sender_id: this.currentUserId,
          content: content,
          created_at: new Date().toISOString(),
          username: '我',
          avatar: this.currentUserAvatar,
          remainingMessages: currentRemaining,
          pending: true
        })
        this.scrollToBottom()
        
        wsService.sendChatMessage(this.userId, content)
        
        if (!this.isMutual && this.remainingMessages > 0) {
          this.remainingMessages--
          if (this.remainingMessages === 0) {
            this.canSend = false
            this.limitMessage = '对方未回复前，只能发送3条私信'
          }
        }
        
        uni.$emit('refreshMessages')
        this.saveMessagesToCache()
      } else {
        try {
          const res = await uni.request({
            url: 'http://shengyu.supersyh.xyz/api/social/message',
            method: 'POST',
            header: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              receiverId: this.userId,
              content: content
            }
          });
          
          if (res.statusCode === 200) {
            const currentRemaining = this.remainingMessages;
            
            this.messages.push({
              id: res.data.messageId,
              sender_id: this.currentUserId,
              content: content,
              created_at: new Date().toISOString(),
              username: '我',
              avatar: this.currentUserAvatar,
              remainingMessages: currentRemaining
            });
            this.scrollToBottom();
            
            if (!this.isMutual && this.remainingMessages > 0) {
              this.remainingMessages--;
              if (this.remainingMessages === 0) {
                this.canSend = false;
                this.limitMessage = '对方未回复前，只能发送3条私信';
              }
            }
            
            uni.$emit('refreshMessages');
            this.saveMessagesToCache();
          } else if (res.statusCode === 403) {
            uni.showToast({ title: res.data.error || '发送失败', icon: 'none', duration: 3000 });
            this.canSend = false;
            this.limitMessage = res.data.error || '无法发送消息';
          } else {
            uni.showToast({ title: '发送失败', icon: 'none' });
          }
        } catch (e) {
          uni.showToast({ title: '网络错误', icon: 'none' });
        }
      }
    },
    
    scrollToBottom() {
      setTimeout(() => {
        this.scrollTop = 9999999;
      }, 100);
    }
  }
}
</script>

<style>
.chat-container {
  height: 100vh;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFF0F3 100%);
  position: relative;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 80%;
  max-width: 600rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  overflow: hidden;
}

.modal-header {
  padding: 30rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
  text-align: center;
}

.modal-body {
  padding: 40rpx 30rpx;
}

.modal-text {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 30rpx;
  display: block;
}

.checkbox-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #FF9A9E;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.checked {
  background: #FF9A9E;
}

.check-icon {
  color: #FFFFFF;
  font-size: 28rpx;
}

.checkbox-label {
  font-size: 28rpx;
  color: #666;
}

.modal-footer {
  display: flex;
  padding: 20rpx 30rpx 40rpx;
  gap: 20rpx;
}

.modal-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.modal-btn.cancel {
  background: #F5F5F5;
  color: #666;
}

.modal-btn.confirm {
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
}

/* 自定义导航栏 - 优化版 */
.custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 110rpx;
  box-sizing: border-box;
  box-shadow: 0 4rpx 20rpx rgba(255, 154, 158, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 4rpx;
  min-width: 100rpx;
}

.back-arrow {
  font-size: 40rpx;
  color: #FFFFFF;
  font-weight: 400;
  line-height: 1;
}

.back-text {
  font-size: 26rpx;
  color: #FFFFFF;
  font-weight: 400;
}

.header-title-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
}

.header-title-text {
  font-size: 34rpx;
  font-weight: 600;
  color: #FFFFFF;
  max-width: 300rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.status-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
}

.status-dot.online {
  background: #4CAF50;
  box-shadow: 0 0 8rpx #4CAF50;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

.status-dot.offline {
  background: #CCCCCC;
}

.status-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.95);
}

.header-right {
  min-width: 100rpx;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.clear-btn {
  font-size: 26rpx;
  color: #FFFFFF;
  font-weight: 500;
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.15);
  transition: all 0.3s ease;
}

.clear-btn:active {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0.95);
}

.input-area {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.char-count {
  position: absolute;
  right: 20rpx;
  font-size: 22rpx;
  color: #999;
}

.char-count.over-limit {
  color: #FF4757;
}

.chat-messages {
  position: fixed;
  top: 120rpx;
  bottom: 120rpx;
  left: 0;
  right: 0;
  padding: 20rpx;
  box-sizing: border-box;
}

.loading-more {
  text-align: center;
  padding: 20rpx;
  color: #999;
  font-size: 24rpx;
}

.message-list {
  display: flex;
  flex-direction: column;
}

.message-item {
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
}

.message-time {
  text-align: center;
  font-size: 24rpx;
  color: #999;
  margin: 20rpx 0;
}

.message-content-wrapper {
  display: flex;
  align-items: flex-start;
  width: 100%;
}

.message-item:not(.self) .message-content-wrapper {
  justify-content: flex-start;
}

.message-item.self .message-content-wrapper {
  justify-content: flex-end;
}

.message-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
  flex-shrink: 0;
  cursor: pointer;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  border: 2rpx solid rgba(255, 255, 255, 0.8);
  transition: transform 0.2s ease;
}

.message-avatar:active {
  transform: scale(0.95);
}

.message-avatar.left {
  margin-right: 18rpx;
}

.message-avatar.right {
  margin-left: 18rpx;
}

.message-bubble {
  max-width: 65%;
  padding: 18rpx 22rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  border-top-left-radius: 6rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  position: relative;
  transition: transform 0.2s ease;
}

.message-bubble:active {
  transform: scale(0.98);
}

.message-bubble.self {
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  border-top-left-radius: 24rpx;
  border-top-right-radius: 6rpx;
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
}

.message-text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.5;
  word-break: break-all;
  letter-spacing: 0.5rpx;
}

.message-bubble.self .message-text {
  color: #FFFFFF;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
}

.bottom-space {
  height: 20rpx;
}

.input-container {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background: linear-gradient(180deg, #FFFFFF 0%, #FFF8F9 100%);
  border-top: 1rpx solid rgba(255, 154, 158, 0.15);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  box-sizing: border-box;
  z-index: 100;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.message-input {
  flex: 1;
  height: 68rpx;
  background: #F8F8F8;
  border-radius: 34rpx;
  padding: 0 28rpx;
  font-size: 30rpx;
  margin-right: 16rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
}

.message-input:focus {
  background: #FFFFFF;
  border-color: rgba(255, 154, 158, 0.4);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.15);
}

.send-btn {
  width: 110rpx;
  height: 68rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
  border-radius: 34rpx;
  font-size: 28rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
  transition: all 0.3s ease;
}

.send-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(255, 154, 158, 0.2);
}

.send-btn[disabled] {
  opacity: 0.5;
  box-shadow: none;
}

.input-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
}

.limit-warning {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70rpx;
  background: #FFF5F5;
  border-radius: 35rpx;
  border: 1rpx solid #FFD4D4;
}

.limit-text {
  font-size: 28rpx;
  color: #FF6B6B;
}

.message-limit-hint {
  display: flex;
  justify-content: flex-end;
  margin-top: 8rpx;
  margin-right: 90rpx;
  padding-right: 20rpx;
}

.limit-hint-text {
  font-size: 22rpx;
  color: #999999;
  background: rgba(0, 0, 0, 0.03);
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
}
</style>
