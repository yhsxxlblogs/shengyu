<template>
  <view class="messages-container page-enter">
    <view class="messages-list">
      <view v-if="loading" class="loading">
        <text>加载中...</text>
      </view>
      <view v-else-if="error" class="error">
        <text>{{ error }}</text>
        <button @click="loadMessages" class="retry-btn">重试</button>
      </view>
      <view v-else-if="messages.length === 0" class="empty">
        <text class="empty-icon">💬</text>
        <text class="empty-text">还没有私信</text>
        <text class="empty-subtext">去社区关注感兴趣的人吧</text>
      </view>
      <view v-else>
        <view class="message-item" v-for="msg in messages" :key="msg.user_id" @click="goToChat(msg.user_id, msg.username)">
          <view class="avatar-wrapper">
            <image :src="getImageUrl(msg.avatar) || defaultAvatar(msg.username)" class="avatar" mode="aspectFill"></image>
            <view v-if="onlineUsers.includes(String(msg.user_id))" class="online-dot"></view>
          </view>
          <view class="message-content">
            <view class="message-header">
              <text class="username">{{ msg.username }}</text>
              <text class="time">{{ formatTime(msg.last_time) }}</text>
            </view>
            <view class="message-row">
              <text class="last-message" :class="{ 'unread': msg.unread_count > 0 }">{{ msg.last_message }}</text>
              <view v-if="msg.unread_count > 0" class="unread-badge">{{ msg.unread_count }}</view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import wsService from '@/utils/websocket.js'

export default {
  data() {
    return {
      messages: [],
      loading: false,
      error: '',
      wsConnected: false,
      onlineUsers: []
    }
  },
  onShow() {
    this.initWebSocket()
  },
  onLoad() {
    uni.$on('refreshMessages', this.handleRefresh)
  },
  onUnload() {
    uni.$off('refreshMessages', this.handleRefresh)
    this.removeWebSocketListeners()
  },
  onHide() {
    this.removeWebSocketListeners()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    
    initWebSocket() {
      const token = uni.getStorageSync('token')
      const userId = uni.getStorageSync('userId')
      
      if (!token || !userId) {
        this.error = '请先登录'
        return
      }
      
      this.removeWebSocketListeners()
      
      wsService.on('connected', this.onWsConnected)
      wsService.on('disconnected', this.onWsDisconnected)
      wsService.on('new_message', this.onNewMessage)
      wsService.on('unread_count', this.onUnreadCountUpdate)
      wsService.on('user_online', this.onUserOnline)
      wsService.on('user_offline', this.onUserOffline)
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
      wsService.off('unread_count', this.onUnreadCountUpdate)
      wsService.off('user_online', this.onUserOnline)
      wsService.off('user_offline', this.onUserOffline)
      wsService.off('reconnect_failed', this.onReconnectFailed)
    },
    
    onWsConnected() {
      console.log('WebSocket 已连接')
      this.wsConnected = true
    },
    
    onWsDisconnected() {
      console.log('WebSocket 已断开')
      this.wsConnected = false
    },
    
    onNewMessage(message) {
      console.log('收到新消息:', message)
      this.updateMessageList(message)
    },
    
    onUnreadCountUpdate(data) {
      console.log('未读数更新:', data)
      if (data.fromUserId) {
        const msgIndex = this.messages.findIndex(m => String(m.user_id) === String(data.fromUserId))
        if (msgIndex !== -1) {
          this.messages[msgIndex].unread_count = data.count
        }
      }
    },
    
    onUserOnline(data) {
      console.log('用户上线:', data.userId)
      if (!this.onlineUsers.includes(String(data.userId))) {
        this.onlineUsers.push(String(data.userId))
      }
    },
    
    onUserOffline(data) {
      console.log('用户下线:', data.userId)
      const index = this.onlineUsers.indexOf(String(data.userId))
      if (index !== -1) {
        this.onlineUsers.splice(index, 1)
      }
    },
    
    onReconnectFailed() {
      console.log('WebSocket 重连失败')
      this.wsConnected = false
      uni.showToast({
        title: '实时连接失败，请刷新页面',
        icon: 'none'
      })
    },
    
    updateMessageList(message) {
      const senderId = String(message.sender_id)
      const existingIndex = this.messages.findIndex(m => String(m.user_id) === senderId)
      
      if (existingIndex !== -1) {
        const existing = this.messages[existingIndex]
        this.messages.splice(existingIndex, 1, {
          ...existing,
          last_message: message.content,
          last_time: message.created_at,
          unread_count: (existing.unread_count || 0) + 1
        })
        
        const updatedMsg = this.messages[existingIndex]
        this.messages.splice(existingIndex, 1)
        this.messages.unshift(updatedMsg)
      } else {
        this.loadMessages()
      }
    },
    
    handleRefresh() {
      if (this.loading) return
      
      const token = uni.getStorageSync('token')
      if (!token) return
      
      uni.request({
        url: 'http://shengyu.supersyh.xyz/api/social/messages',
        method: 'GET',
        header: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.statusCode === 200) {
          const newMessages = res.data.messages || []
          this.smartMergeMessages(newMessages)
        }
      }).catch(() => {})
    },
    
    smartMergeMessages(newMessages) {
      if (!newMessages.length) {
        if (this.messages.length > 0) {
          this.messages = []
        }
        return
      }

      if (this.messages.length === 0) {
        this.messages = newMessages
        return
      }

      let hasChanges = false
      const existingMap = new Map(this.messages.map(m => [m.user_id, m]))
      
      if (newMessages.length !== this.messages.length) {
        hasChanges = true
      } else {
        for (const newMsg of newMessages) {
          const existing = existingMap.get(newMsg.user_id)
          if (!existing) {
            hasChanges = true
            break
          }
          if (existing.unread_count !== newMsg.unread_count ||
              existing.last_message !== newMsg.last_message ||
              existing.last_time !== newMsg.last_time) {
            hasChanges = true
            break
          }
        }
      }

      if (!hasChanges) {
        return
      }
      
      const existingIds = new Set(this.messages.map(m => m.user_id))
      const addedConversations = newMessages.filter(m => !existingIds.has(m.user_id))
      
      if (addedConversations.length > 0 || newMessages.length !== this.messages.length) {
        const messageMap = new Map()
        newMessages.forEach(m => messageMap.set(m.user_id, m))
        
        this.messages = this.messages.map(m => {
          const updated = messageMap.get(m.user_id)
          return updated || m
        })
        
        if (addedConversations.length > 0) {
          this.messages = [...addedConversations, ...this.messages]
        }
      }
    },
    
    getImageUrl(url) {
      if (!url) return null
      if (url.startsWith('http')) return url
      return `http://shengyu.supersyh.xyz${url}`
    },
    
    defaultAvatar(name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=FF69B4&color=fff&size=60`
    },
    
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
      if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
      
      return date.toLocaleDateString()
    },
    
    loadMessages() {
      return new Promise(async (resolve) => {
        this.loading = true
        this.error = ''
        
        const token = uni.getStorageSync('token')
        if (!token) {
          this.error = '请先登录'
          this.loading = false
          resolve()
          return
        }
        
        try {
          const res = await uni.request({
            url: 'http://shengyu.supersyh.xyz/api/social/messages',
            method: 'GET',
            header: { Authorization: `Bearer ${token}` }
          })
          
          if (res.statusCode === 200) {
            this.messages = res.data.messages || []
          } else {
            this.error = res.data.error || '加载失败'
          }
        } catch (e) {
          this.error = '网络错误'
        }
        
        this.loading = false
        resolve()
      })
    },
    
    goToChat(userId, username) {
      uni.navigateTo({ url: `/pages/chat/chat?userId=${userId}&username=${encodeURIComponent(username)}` })
    }
  }
}
</script>

<style>
.messages-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF5F7 0%, #FFF0F3 100%);
}

.messages-list {
  padding: 20rpx;
}

.loading, .error, .empty {
  text-align: center;
  padding: 100rpx 40rpx;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  display: block;
  margin-bottom: 10rpx;
}

.empty-subtext {
  font-size: 26rpx;
  color: #999;
}

.retry-btn {
  margin-top: 30rpx;
  padding: 16rpx 40rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
  border-radius: 30rpx;
  font-size: 28rpx;
  border: none;
}

.message-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #FFFFFF;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 20rpx rgba(255, 154, 158, 0.1);
}

.avatar-wrapper {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  overflow: visible;
  flex-shrink: 0;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
  margin-right: 20rpx;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.online-dot {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  width: 20rpx;
  height: 20rpx;
  background: #4CAF50;
  border-radius: 50%;
  border: 3rpx solid #FFFFFF;
  box-shadow: 0 0 6rpx rgba(76, 175, 80, 0.5);
}

.message-content {
  flex: 1;
  overflow: hidden;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.username {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.message-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.last-message {
  font-size: 28rpx;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.last-message.unread {
  color: #333;
  font-weight: 500;
}

.unread-badge {
  background: #FF4757;
  color: #FFFFFF;
  font-size: 22rpx;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  box-sizing: border-box;
  flex-shrink: 0;
}
</style>
