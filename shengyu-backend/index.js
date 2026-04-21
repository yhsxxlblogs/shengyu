const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const http = require('http');
const net = require('net');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const db = require('./config/db');
const captcha = require('./utils/captcha');
const { xssMiddleware, errorHandler } = require('./middleware/security');

const app = express();
const port = 3000;

const server = http.createServer(app);

const connectedUsers = new Map();

function parseWebSocketFrame(buffer) {
  if (buffer.length < 2) return null;

  const firstByte = buffer[0];
  const secondByte = buffer[1];

  const fin = (firstByte & 0x80) !== 0;
  const opcode = firstByte & 0x0F;
  const masked = (secondByte & 0x80) !== 0;
  let payloadLength = secondByte & 0x7F;

  let offset = 2;

  if (payloadLength === 126) {
    if (buffer.length < 4) return null;
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    if (buffer.length < 10) return null;
    payloadLength = Number(buffer.readBigUInt64BE(2));
    offset = 10;
  }

  let mask = null;
  if (masked) {
    if (buffer.length < offset + 4) return null;
    mask = buffer.slice(offset, offset + 4);
    offset += 4;
  }

  if (buffer.length < offset + payloadLength) return null;

  let payload = buffer.slice(offset, offset + payloadLength);

  if (masked && mask) {
    payload = Buffer.from(payload);
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= mask[i % 4];
    }
  }

  return {
    fin,
    opcode,
    payload: payload.toString('utf8'),
    rawLength: offset + payloadLength
  };
}

function buildWebSocketFrame(payload, opcode = 0x01) {
  const payloadBuffer = Buffer.from(payload, 'utf8');
  const payloadLength = payloadBuffer.length;

  let frame;
  let offset = 0;

  if (payloadLength <= 125) {
    frame = Buffer.alloc(2 + payloadLength);
    frame[0] = 0x80 | opcode;
    frame[1] = payloadLength;
    offset = 2;
  } else if (payloadLength <= 65535) {
    frame = Buffer.alloc(4 + payloadLength);
    frame[0] = 0x80 | opcode;
    frame[1] = 126;
    frame.writeUInt16BE(payloadLength, 2);
    offset = 4;
  } else {
    frame = Buffer.alloc(10 + payloadLength);
    frame[0] = 0x80 | opcode;
    frame[1] = 127;
    frame.writeBigUInt64BE(BigInt(payloadLength), 2);
    offset = 10;
  }

  payloadBuffer.copy(frame, offset);
  return frame;
}

function sendWebSocketMessage(socket, data) {
  if (socket.readyState !== 'open') return;

  const message = JSON.stringify(data);
  const frame = buildWebSocketFrame(message);
  socket.write(frame);
}

function broadcastUserStatus(userId, isOnline) {
  const message = JSON.stringify({
    type: isOnline ? 'user_online' : 'user_offline',
    payload: { userId }
  });

  const frame = buildWebSocketFrame(message);

  connectedUsers.forEach((clientWs, clientUserId) => {
    if (clientUserId !== userId && clientWs.readyState === 'open') {
      clientWs.write(frame);
    }
  });
}

function updateUnreadCount(userId, fromUserId = null) {
  db.query(
    `SELECT COUNT(*) as count FROM messages
     WHERE receiver_id = ? AND is_read = FALSE`,
    [userId],
    (err, results) => {
      if (err) {
        console.error('获取未读数失败:', err);
        return;
      }

      const unreadCount = results[0].count;
      const userWs = connectedUsers.get(String(userId));

      if (userWs && userWs.readyState === 'open') {
        sendWebSocketMessage(userWs, {
          type: 'unread_count',
          payload: { count: unreadCount, fromUserId }
        });
      }
    }
  );
}

function handleChatMessage(ws, payload) {
  const { receiverId, content, timestamp } = payload;
  const senderId = ws.userId;

  if (!receiverId || !content) {
    sendWebSocketMessage(ws, {
      type: 'error',
      payload: { message: '缺少必要参数' }
    });
    return;
  }

  if (String(senderId) === String(receiverId)) {
    sendWebSocketMessage(ws, {
      type: 'error',
      payload: { message: '不能给自己发送消息' }
    });
    return;
  }

  db.query(
    'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
    [senderId, receiverId, content],
    (err, result) => {
      if (err) {
        console.error('保存消息失败:', err);
        sendWebSocketMessage(ws, {
          type: 'error',
          payload: { message: '消息发送失败' }
        });
        return;
      }

      const messageId = result.insertId;

      db.query(
        `SELECT m.*, u.username, u.avatar
         FROM messages m
         LEFT JOIN users u ON m.sender_id = u.id
         WHERE m.id = ?`,
        [messageId],
        (err, results) => {
          if (err || results.length === 0) {
            console.error('获取消息详情失败:', err);
            return;
          }

          const messageData = results[0];

          const receiverWs = connectedUsers.get(String(receiverId));
          if (receiverWs && receiverWs.readyState === 'open') {
            sendWebSocketMessage(receiverWs, {
              type: 'new_message',
              payload: messageData
            });
          }

          sendWebSocketMessage(ws, {
            type: 'message_sent',
            payload: messageData
          });

          updateUnreadCount(receiverId, senderId);
        }
      );
    }
  );
}

function handleTypingStatus(ws, payload) {
  const { receiverId, isTyping } = payload;
  const senderId = ws.userId;

  if (!receiverId) return;

  const receiverWs = connectedUsers.get(String(receiverId));
  if (receiverWs && receiverWs.readyState === 'open') {
    sendWebSocketMessage(receiverWs, {
      type: 'typing',
      payload: {
        userId: senderId,
        isTyping
      }
    });
  }
}

function handleMarkAsRead(ws, payload) {
  const { senderId } = payload;
  const receiverId = ws.userId;

  if (!senderId) return;

  db.query(
    'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
    [senderId, receiverId],
    (err) => {
      if (err) {
        console.error('标记已读失败:', err);
        return;
      }

      const senderWs = connectedUsers.get(String(senderId));
      if (senderWs && senderWs.readyState === 'open') {
        sendWebSocketMessage(senderWs, {
          type: 'message_read',
          payload: { userId: receiverId }
        });
      }

      updateUnreadCount(receiverId);
    }
  );
}

function handleMessage(ws, message) {
  const { type, payload } = message;

  switch (type) {
    case 'ping':
      sendWebSocketMessage(ws, { type: 'pong', payload: { timestamp: Date.now() } });
      break;

    case 'chat_message':
      handleChatMessage(ws, payload);
      break;

    case 'typing':
      handleTypingStatus(ws, payload);
      break;

    case 'mark_read':
      handleMarkAsRead(ws, payload);
      break;

    default:
      console.log('未知消息类型:', type);
  }
}

function parseQueryString(url) {
  const query = {};
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) return query;

  const queryString = url.slice(queryIndex + 1);
  const pairs = queryString.split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key && value) {
      query[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }

  return query;
}

const wsServer = net.createServer((socket) => {
  socket.buffer = Buffer.alloc(0);
  socket.readyState = 'connecting';
  socket.isAuthenticated = false;
  socket.userId = null;
  socket.handshakeComplete = false;

  socket.setTimeout(60000);

  socket.on('timeout', () => {
    console.log('Socket 超时，关闭连接');
    socket.end();
  });

  socket.on('data', (data) => {
    if (!socket.handshakeComplete) {
      socket.buffer = Buffer.concat([socket.buffer, data]);
      const request = socket.buffer.toString();

      if (request.includes('\r\n\r\n')) {
        if (!request.includes('Upgrade: websocket')) {
          console.log('不是 WebSocket 升级请求');
          socket.end();
          return;
        }

        const keyMatch = request.match(/Sec-WebSocket-Key:\s*([A-Za-z0-9+/=]+)\r\n/i);
        const key = keyMatch ? keyMatch[1].trim() : '';

        if (!key) {
          console.log('缺少 Sec-WebSocket-Key');
          socket.end();
          return;
        }

        const urlMatch = request.match(/GET\s+(\S+)\s+HTTP/i);
        const url = urlMatch ? urlMatch[1] : '';
        const query = parseQueryString(url);

        const token = query.token;
        const userId = query.userId;

        console.log('WebSocket 连接请求:', { userId, hasToken: !!token });

        if (!token || !userId) {
          console.log('缺少 token 或 userId');
          socket.end();
          return;
        }

        jwt.verify(token, 'secret_key', (err, decoded) => {
          if (err) {
            console.log('Token 验证失败:', err.message);
            socket.end();
            return;
          }

          const acceptKey = crypto
            .createHash('sha1')
            .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
            .digest('base64');

          const response =
            'HTTP/1.1 101 Switching Protocols\r\n' +
            'Upgrade: websocket\r\n' +
            'Connection: Upgrade\r\n' +
            `Sec-WebSocket-Accept: ${acceptKey}\r\n` +
            '\r\n';

          socket.write(response);
          socket.handshakeComplete = true;
          socket.readyState = 'open';
          socket.isAuthenticated = true;
          socket.userId = userId;
          socket.buffer = Buffer.alloc(0);

          if (connectedUsers.has(userId)) {
            const oldWs = connectedUsers.get(userId);
            if (oldWs.readyState === 'open') {
              oldWs.end();
            }
          }

          connectedUsers.set(userId, socket);
          console.log(`用户 ${userId} 已连接，当前在线: ${connectedUsers.size} 人`);

          broadcastUserStatus(userId, true);

          sendWebSocketMessage(socket, {
            type: 'connected',
            payload: { userId, onlineUsers: connectedUsers.size }
          });
        });
      }
    } else if (socket.readyState === 'open') {
      socket.buffer = Buffer.concat([socket.buffer, data]);

      while (socket.buffer.length > 0) {
        const frame = parseWebSocketFrame(socket.buffer);

        if (!frame) break;

        socket.buffer = socket.buffer.slice(frame.rawLength);

        if (frame.opcode === 0x08) {
          console.log(`用户 ${socket.userId} 发送关闭帧`);
          socket.end();
          return;
        }

        if (frame.opcode === 0x09) {
          const pongFrame = buildWebSocketFrame('', 0x0A);
          socket.write(pongFrame);
          continue;
        }

        if (frame.opcode === 0x01 || frame.opcode === 0x00 || frame.opcode === 0x02) {
          try {
            if (frame.payload) {
              const message = JSON.parse(frame.payload);
              handleMessage(socket, message);
            }
          } catch (error) {
            console.error('解析消息失败:', error, frame.payload);
          }
        }
      }
    }
  });

  socket.on('close', (hadError) => {
    if (socket.userId) {
      console.log(`用户 ${socket.userId} 断开连接${hadError ? ' (有错误)' : ''}`);
      if (connectedUsers.get(socket.userId) === socket) {
        connectedUsers.delete(socket.userId);
        broadcastUserStatus(socket.userId, false);
      }
    }
  });

  socket.on('error', (error) => {
    console.error(`WebSocket 错误:`, error.message);
    if (socket.userId && connectedUsers.get(socket.userId) === socket) {
      connectedUsers.delete(socket.userId);
    }
  });
});

wsServer.listen(3001, '0.0.0.0', () => {
  console.log('WebSocket 服务已启动在端口 3001');
});

global.sendNotificationToUser = (userId, notification) => {
  const userWs = connectedUsers.get(String(userId));
  if (userWs && userWs.readyState === 'open') {
    sendWebSocketMessage(userWs, {
      type: 'notification',
      payload: notification
    });
  }
};
global.connectedUsers = connectedUsers;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(xssMiddleware);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// 验证码相关路由
app.get('/api/captcha', (req, res) => {
  try {
    const captchaData = captcha.generateCaptcha();
    res.json({
      success: true,
      token: captchaData.token,
      image: captchaData.image
    });
  } catch (error) {
    console.error('生成验证码失败:', error);
    res.status(500).json({
      success: false,
      message: '生成验证码失败'
    });
  }
});

app.post('/api/captcha/verify', (req, res) => {
  const { token, code } = req.body;
  
  if (!token || !code) {
    return res.json({
      success: false,
      message: '缺少参数'
    });
  }
  
  const isValid = captcha.verifyCaptcha(token, code);
  res.json({
    success: isValid,
    message: isValid ? '验证成功' : '验证码错误或已过期'
  });
});

const authRoutes = require('./routes/auth');
const soundRoutes = require('./routes/sound');
const postRoutes = require('./routes/post');
const adminRoutes = require('./routes/admin');
const socialRoutes = require('./routes/social');
const bannerRoutes = require('./routes/banner');

app.use('/api/auth', authRoutes);
app.use('/api/sound', soundRoutes);
app.use('/api/post', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/banner', bannerRoutes);

function processScheduledNotifications() {
  db.query(
    `UPDATE notifications
     SET status = 'active'
     WHERE status = 'pending'
     AND publish_at IS NOT NULL
     AND publish_at <= NOW()`,
    (err, results) => {
      if (err) {
        console.error('处理定时发布通知失败:', err);
      } else if (results.affectedRows > 0) {
        console.log(`已发布 ${results.affectedRows} 条定时通知`);
      }
    }
  );
}

setInterval(processScheduledNotifications, 60000);
processScheduledNotifications();

app.use(errorHandler);

server.listen(port, () => {
  console.log(`HTTP 服务已启动在端口 ${port}`);
});
