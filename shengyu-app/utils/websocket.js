const WS_URL = 'ws://shengyu.supersyh.xyz/ws'

class WebSocketService {
  constructor() {
    this.ws = null
    this.isConnected = false
    this.reconnectTimer = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectDelay = 3000
    this.heartbeatTimer = null
    this.heartbeatInterval = 30000
    this.messageQueue = []
    this.eventListeners = new Map()
    this.userId = null
    this.token = null
    this.isConnecting = false
    this.listenersInitialized = false
  }

  connect(userId, token) {
    if (this.isConnected) {
      console.log('WebSocket 已连接，无需重复连接')
      return
    }

    if (this.isConnecting) {
      console.log('WebSocket 正在连接中...')
      return
    }

    this.userId = userId
    this.token = token
    this.isConnecting = true

    try {
      console.log('正在连接 WebSocket...', WS_URL)

      uni.connectSocket({
        url: `${WS_URL}?token=${token}&userId=${userId}`,
        success: () => {
          console.log('WebSocket 连接请求已发送')
        },
        fail: (err) => {
          console.error('WebSocket 连接请求失败:', err)
          this.isConnecting = false
          this.handleReconnect()
        }
      })

      this.initEventHandlers()
    } catch (error) {
      console.error('WebSocket 连接异常:', error)
      this.isConnecting = false
      this.handleReconnect()
    }
  }

  initEventHandlers() {
    if (this.listenersInitialized) {
      console.log('事件监听器已初始化，跳过')
      return
    }

    this.listenersInitialized = true

    uni.onSocketOpen((res) => {
      console.log('WebSocket 连接已打开', res)
      this.isConnected = true
      this.isConnecting = false
      this.reconnectAttempts = 0

      this.startHeartbeat()
      this.flushMessageQueue()
      this.emit('connected', res)
    })

    uni.onSocketMessage((res) => {
      try {
        const data = JSON.parse(res.data)
        console.log('收到 WebSocket 消息:', data)
        this.handleMessage(data)
      } catch (error) {
        console.error('解析消息失败:', error, res.data)
      }
    })

    uni.onSocketError((err) => {
      console.error('WebSocket 错误:', err)
      this.isConnected = false
      this.isConnecting = false
      this.emit('error', err)
      this.handleReconnect()
    })

    uni.onSocketClose((res) => {
      console.log('WebSocket 连接已关闭', res)
      this.isConnected = false
      this.isConnecting = false
      this.stopHeartbeat()
      this.emit('disconnected', res)

      if (!res.code || res.code !== 1000) {
        this.handleReconnect()
      }
    })
  }

  handleMessage(data) {
    const { type, payload } = data

    switch (type) {
      case 'connected':
        this.emit('connected', payload)
        break

      case 'pong':
        console.log('收到心跳响应')
        break

      case 'new_message':
        this.emit('new_message', payload)
        break

      case 'message_sent':
        this.emit('message_sent', payload)
        break

      case 'message_read':
        this.emit('message_read', payload)
        break

      case 'unread_count':
        this.emit('unread_count', payload)
        break

      case 'user_online':
        this.emit('user_online', payload)
        break

      case 'user_offline':
        this.emit('user_offline', payload)
        break

      case 'typing':
        this.emit('typing', payload)
        break

      case 'error':
        console.error('服务器错误:', payload)
        this.emit('error', payload)
        break

      default:
        console.log('未知消息类型:', type)
    }
  }

  send(type, payload) {
    const message = JSON.stringify({ type, payload })

    if (this.isConnected) {
      uni.sendSocketMessage({
        data: message,
        success: () => {
          console.log('消息发送成功:', type)
        },
        fail: (err) => {
          console.error('消息发送失败:', err)
          this.messageQueue.push({ type, payload })
        }
      })
    } else {
      console.log('WebSocket 未连接，消息加入队列:', type)
      this.messageQueue.push({ type, payload })
    }
  }

  flushMessageQueue() {
    if (this.messageQueue.length === 0) return

    console.log(`发送队列中的 ${this.messageQueue.length} 条消息`)

    const queue = [...this.messageQueue]
    this.messageQueue = []

    queue.forEach(item => {
      this.send(item.type, item.payload)
    })
  }

  startHeartbeat() {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        console.log('发送心跳 ping')
        this.send('ping', { timestamp: Date.now() })
      }
    }, this.heartbeatInterval)
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  handleReconnect() {
    if (this.reconnectTimer) {
      console.log('重连定时器已存在，跳过')
      return
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('达到最大重连次数，停止重连')
      this.emit('reconnect_failed')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000)

    console.log(`${delay}ms 后进行第 ${this.reconnectAttempts} 次重连...`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.userId && this.token) {
        console.log('执行重连...')
        this.connect(this.userId, this.token)
      } else {
        console.log('缺少 userId 或 token，无法重连')
      }
    }, delay)
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  off(event, callback) {
    if (!this.eventListeners.has(event)) return

    if (callback) {
      const listeners = this.eventListeners.get(event)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    } else {
      this.eventListeners.delete(event)
    }
  }

  emit(event, data) {
    if (!this.eventListeners.has(event)) return

    const listeners = this.eventListeners.get(event)
    listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`事件处理错误 (${event}):`, error)
      }
    })
  }

  disconnect() {
    console.log('主动断开 WebSocket 连接')
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.isConnecting = false

    if (this.isConnected) {
      uni.closeSocket({
        success: () => {
          console.log('WebSocket 关闭成功')
        },
        fail: (err) => {
          console.error('WebSocket 关闭失败:', err)
        }
      })
    }

    this.isConnected = false
    this.userId = null
    this.token = null
    this.messageQueue = []
  }

  sendChatMessage(receiverId, content) {
    this.send('chat_message', {
      receiverId,
      content,
      timestamp: Date.now()
    })
  }

  sendTypingStatus(receiverId, isTyping) {
    this.send('typing', {
      receiverId,
      isTyping
    })
  }

  markAsRead(senderId) {
    this.send('mark_read', {
      senderId
    })
  }

  getConnectionStatus() {
    return this.isConnected
  }

  reset() {
    this.disconnect()
    this.listenersInitialized = false
    this.eventListeners.clear()
  }
}

const wsService = new WebSocketService()

export default wsService
