const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { authenticateToken, sanitizeInput } = require('../middleware/security');

// 关注/取消关注
router.post('/follow/:userId', authenticateToken, (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.userId;

  if (followerId == followingId) {
    return res.status(400).json({ error: '不能关注自己' });
  }

  // 检查是否已关注
  db.query(
    'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
    [followerId, followingId],
    (err, results) => {
      if (err) {
        console.error('检查关注状态失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      if (results.length > 0) {
        // 已关注，取消关注
        db.query(
          'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
          [followerId, followingId],
          (err) => {
            if (err) {
              console.error('取消关注失败:', err);
              return res.status(500).json({ error: '服务器错误' });
            }
            res.status(200).json({ message: '取消关注成功', isFollowing: false });
          }
        );
      } else {
        // 未关注，添加关注
        db.query(
          'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
          [followerId, followingId],
          (err) => {
            if (err) {
              console.error('关注失败:', err);
              return res.status(500).json({ error: '服务器错误' });
            }
            res.status(200).json({ message: '关注成功', isFollowing: true });
          }
        );
      }
    }
  );
});

// 检查关注状态
router.get('/follow/check/:userId', authenticateToken, (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.userId;

  db.query(
    'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
    [followerId, followingId],
    (err, results) => {
      if (err) {
        console.error('检查关注状态失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      res.status(200).json({ isFollowing: results.length > 0 });
    }
  );
});

// 获取关注列表
router.get('/follows/:userId', (req, res) => {
  const userId = req.params.userId;

  db.query(
    `SELECT u.id, u.username, u.avatar
     FROM follows f
     JOIN users u ON f.following_id = u.id
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error('获取关注列表失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      res.status(200).json({ follows: results });
    }
  );
});

// 获取粉丝列表
router.get('/followers/:userId', (req, res) => {
  const userId = req.params.userId;

  db.query(
    `SELECT u.id, u.username, u.avatar
     FROM follows f
     JOIN users u ON f.follower_id = u.id
     WHERE f.following_id = ?
     ORDER BY f.created_at DESC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error('获取粉丝列表失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      res.status(200).json({ followers: results });
    }
  );
});

// 获取关注统计
router.get('/follow-stats/:userId', (req, res) => {
  const userId = req.params.userId;

  db.query(
    `SELECT
      (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
      (SELECT COUNT(*) FROM follows WHERE following_id = ?) as follower_count`,
    [userId, userId],
    (err, results) => {
      if (err) {
        console.error('获取关注统计失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      res.status(200).json({
        following_count: results[0].following_count,
        follower_count: results[0].follower_count
      });
    }
  );
});

// 获取我的关注列表
router.get('/following', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    `SELECT u.id, u.username, u.avatar
     FROM follows f
     JOIN users u ON f.following_id = u.id
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error('获取关注列表失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      res.status(200).json({ follows: results });
    }
  );
});

// 发送私信
router.post('/message', authenticateToken, (req, res) => {
  const senderId = req.user.id;
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  // 验证content长度
  if (content.length > 1000) {
    return res.status(400).json({ error: '消息内容过长，最多1000字符' });
  }

  if (content.length < 1) {
    return res.status(400).json({ error: '消息内容不能为空' });
  }

  // 不能给自己发消息
  if (String(senderId) === String(receiverId)) {
    return res.status(400).json({ error: '不能给自己发送消息' });
  }

  // 验证接收者是否存在
  db.query('SELECT id FROM users WHERE id = ?', [receiverId], (err, results) => {
    if (err) {
      console.error('验证接收者失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: '接收者不存在' });
    }

    // XSS防护 - 清理消息内容
    const sanitizedContent = sanitizeInput(content);

    // 保存消息
    db.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [senderId, receiverId, sanitizedContent],
      (err, result) => {
        if (err) {
          console.error('发送消息失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }

        // 获取新消息
        db.query(
          `SELECT m.*, u.username, u.avatar
           FROM messages m
           LEFT JOIN users u ON m.sender_id = u.id
           WHERE m.id = ?`,
          [result.insertId],
          (err, results) => {
            if (err) {
              console.error('获取消息失败:', err);
              return res.status(500).json({ error: '服务器错误' });
            }

            res.status(200).json({
              message: '发送成功',
              data: results[0]
            });
          }
        );
      }
    );
  });
});

// 获取私信列表
router.get('/messages', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    `SELECT
      m.*,
      u.username,
      u.avatar,
      CASE
        WHEN m.sender_id = ? THEN m.receiver_id
        ELSE m.sender_id
      END as other_user_id
    FROM messages m
    JOIN users u ON (
      CASE
        WHEN m.sender_id = ? THEN m.receiver_id = u.id
        ELSE m.sender_id = u.id
      END
    )
    WHERE m.sender_id = ? OR m.receiver_id = ?
    ORDER BY m.created_at DESC`,
    [userId, userId, userId, userId],
    (err, results) => {
      if (err) {
        console.error('获取消息列表失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      // 按会话分组
      const conversations = {};
      results.forEach(msg => {
        const otherId = msg.sender_id == userId ? msg.receiver_id : msg.sender_id;
        if (!conversations[otherId]) {
          conversations[otherId] = {
            user: {
              id: otherId,
              username: msg.username,
              avatar: msg.avatar
            },
            lastMessage: msg,
            unreadCount: 0
          };
        }

        if (msg.receiver_id == userId && !msg.is_read) {
          conversations[otherId].unreadCount++;
        }
      });

      res.status(200).json({ conversations: Object.values(conversations) });
    }
  );
});

// 获取与特定用户的聊天记录
router.get('/messages/:userId', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.userId;
  const { page = 1, limit = 20 } = req.query;

  // 验证分页参数
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50); // 最大50条
  const offset = (pageNum - 1) * limitNum;

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ error: '无效的分页参数' });
  }

  db.query(
    `SELECT m.*, u.username, u.avatar
     FROM messages m
     LEFT JOIN users u ON m.sender_id = u.id
     WHERE (m.sender_id = ? AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = ?)
     ORDER BY m.created_at DESC
     LIMIT ? OFFSET ?`,
    [currentUserId, otherUserId, otherUserId, currentUserId, limitNum, offset],
    (err, results) => {
      if (err) {
        console.error('获取聊天记录失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      res.status(200).json({ messages: results.reverse() });
    }
  );
});

// 获取未读消息数
router.get('/messages/unread/count', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE',
    [userId],
    (err, results) => {
      if (err) {
        console.error('获取未读消息数失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      res.status(200).json({ count: results[0].count });
    }
  );
});

// 标记消息为已读
router.put('/messages/read/:userId', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  const senderId = req.params.userId;

  db.query(
    'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
    [senderId, currentUserId],
    (err, results) => {
      if (err) {
        console.error('标记已读失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      res.status(200).json({ message: '已标记为已读', updated: results.affectedRows });
    }
  );
});

// 获取私信限制状态
router.get('/messages/limit/:userId', authenticateToken, (req, res) => {
  const senderId = req.user.id;
  const receiverId = req.params.userId;

  // 检查24小时内发送的消息数
  db.query(
    `SELECT COUNT(*) as count FROM messages
     WHERE sender_id = ? AND receiver_id = ?
     AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
    [senderId, receiverId],
    (err, results) => {
      if (err) {
        console.error('获取消息限制失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      const dailyLimit = 100;
      const currentCount = results[0].count;

      res.status(200).json({
        canSend: currentCount < dailyLimit,
        remaining: Math.max(0, dailyLimit - currentCount),
        limit: dailyLimit
      });
    }
  );
});

// 清空与特定用户的聊天记录
router.delete('/messages/clear/:userId', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.userId;

  // 软删除 - 只删除当前用户发送的消息
  db.query(
    'DELETE FROM messages WHERE sender_id = ? AND receiver_id = ?',
    [currentUserId, otherUserId],
    (err, results) => {
      if (err) {
        console.error('清空聊天记录失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      res.status(200).json({ message: '聊天记录已清空', deleted: results.affectedRows });
    }
  );
});

module.exports = router;
