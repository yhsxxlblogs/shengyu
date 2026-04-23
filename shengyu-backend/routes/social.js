const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const { cacheMiddleware, clearCache, CACHE_KEYS, CACHE_TTL } = require('../middleware/cache');

// 认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供token' });
  }

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'token无效' });
    }
    req.user = user;
    next();
  });
};

// ========== 关注功能 ==========

// 关注/取消关注用户
router.post('/follow/:userId', authenticateToken, (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.userId;

  if (followerId == followingId) {
    return res.status(400).json({ error: '不能关注自己' });
  }

  // 检查是否已经关注
  db.query(
    'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
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
            // 清除相关缓存
            clearCache(`*follow*${followerId}*`);
            clearCache(`*follow*${followingId}*`);
            clearCache(`*user*${followerId}*`);
            clearCache(`*user*${followingId}*`);
            res.status(200).json({ message: '已取消关注', isFollowing: false });
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
            // 清除相关缓存
            clearCache(`*follow*${followerId}*`);
            clearCache(`*follow*${followingId}*`);
            clearCache(`*user*${followerId}*`);
            clearCache(`*user*${followingId}*`);
            res.status(200).json({ message: '关注成功', isFollowing: true });
          }
        );
      }
    }
  );
});

// 检查是否关注某用户
router.get('/follow/check/:userId', authenticateToken, (req, res) => {
  const followerId = req.user.id;
  const followingId = req.params.userId;

  db.query(
    'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
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
router.get('/follows/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  const currentUserId = req.user.id;

  db.query(
    `SELECT u.id, u.username, u.avatar,
      EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following,
      EXISTS(SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = ?) as follows_me
     FROM follows f
     JOIN users u ON f.following_id = u.id
     WHERE f.follower_id = ?
     ORDER BY f.created_at DESC`,
    [currentUserId, currentUserId, userId],
    (err, results) => {
      if (err) {
        console.error('获取关注列表失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.status(200).json({ 
        follows: results.map(user => ({
          ...user,
          is_mutual: user.is_following && user.follows_me
        }))
      });
    }
  );
});

// 获取粉丝列表
router.get('/followers/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  const currentUserId = req.user.id;

  db.query(
    `SELECT u.id, u.username, u.avatar,
      EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following,
      EXISTS(SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = ?) as follows_me
     FROM follows f
     JOIN users u ON f.follower_id = u.id
     WHERE f.following_id = ?
     ORDER BY f.created_at DESC`,
    [currentUserId, currentUserId, userId],
    (err, results) => {
      if (err) {
        console.error('获取粉丝列表失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.status(200).json({ 
        followers: results.map(user => ({
          ...user,
          is_mutual: user.is_following && user.follows_me
        }))
      });
    }
  );
});

// 获取关注数和粉丝数（添加缓存）
router.get('/follow-stats/:userId',
  authenticateToken,
  cacheMiddleware(CACHE_KEYS.FOLLOW_STATS, CACHE_TTL.FOLLOW_STATS),
  (req, res) => {
    const userId = req.params.userId;

    // 使用子查询获取关注统计数据（规范化设计）
    db.query(
      `SELECT
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count`,
      [userId, userId],
      (err, results) => {
        if (err) {
          console.error('获取关注统计失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }
        if (results.length === 0) {
          return res.status(404).json({ error: '用户不存在' });
        }
        res.status(200).json({
          following_count: results[0].following_count,
          follower_count: results[0].followers_count
        });
      }
    );
  }
);

// 获取当前用户的关注列表（用于前端缓存）
router.get('/following', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    `SELECT u.id, u.username, u.avatar
     FROM follows f
     JOIN users u ON f.following_id = u.id
     WHERE f.follower_id = ?`,
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

// ========== 私信功能 ==========

// 发送私信
router.post('/message', authenticateToken, (req, res) => {
  const senderId = req.user.id;
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (senderId == receiverId) {
    return res.status(400).json({ error: '不能给自己发送私信' });
  }

  // 检查是否互相关注
  db.query(
    `SELECT 
      EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?) as sender_follows,
      EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?) as receiver_follows`,
    [senderId, receiverId, receiverId, senderId],
    (err, results) => {
      if (err) {
        console.error('检查关注状态失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      const { sender_follows, receiver_follows } = results[0];
      const isMutual = sender_follows && receiver_follows;

      // 如果不是互相关注，检查是否超过3条未回复消息
      if (!isMutual) {
        // 获取对方最后回复的时间
        db.query(
          `SELECT MAX(created_at) as last_reply_time 
           FROM messages 
           WHERE sender_id = ? AND receiver_id = ?`,
          [receiverId, senderId],
          (err, replyResults) => {
            if (err) {
              console.error('检查回复状态失败:', err);
              return res.status(500).json({ error: '服务器错误' });
            }

            const lastReplyTime = replyResults[0].last_reply_time;
            
            // 查询在对方最后回复之后，我发送了多少条消息
            let countQuery = `SELECT COUNT(*) as count FROM messages 
                              WHERE sender_id = ? AND receiver_id = ?`;
            let countParams = [senderId, receiverId];
            
            if (lastReplyTime) {
              countQuery += ` AND created_at > ?`;
              countParams.push(lastReplyTime);
            }

            db.query(countQuery, countParams, (err, countResults) => {
              if (err) {
                console.error('检查消息数量失败:', err);
                return res.status(500).json({ error: '服务器错误' });
              }

              if (countResults[0].count >= 3) {
                return res.status(403).json({ 
                  error: '对方未回复前，只能发送3条私信',
                  needMutualFollow: true,
                  remainingMessages: 0
                });
              }

              // 发送消息
              sendMessage(senderId, receiverId, content, res);
            });
          }
        );
      } else {
        // 互相关注，直接发送
        sendMessage(senderId, receiverId, content, res);
      }
    }
  );
});

// 发送消息的辅助函数
function sendMessage(senderId, receiverId, content, res) {
  db.query(
    'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
    [senderId, receiverId, content],
    (err, results) => {
      if (err) {
        console.error('发送私信失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      
      res.status(200).json({ 
        message: '发送成功',
        messageId: results.insertId
      });
    }
  );
}

// 获取私信列表
router.get('/messages', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // 先检查表是否存在
  db.query(
    `SELECT COUNT(*) as table_exists 
     FROM information_schema.tables 
     WHERE table_schema = DATABASE() AND table_name = 'deleted_messages'`,
    (err, tableCheck) => {
      if (err) {
        console.error('检查表存在失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      const hasDeletedTable = tableCheck[0].table_exists > 0;
      
      // 构建查询条件
      let deletedFilter = '';
      if (hasDeletedTable) {
        deletedFilter = 'AND id NOT IN (SELECT message_id FROM deleted_messages WHERE user_id = ' + userId + ')';
      }

      // 新的逻辑：
      // 1. 互关的人始终显示在双方私信列表（即使没有消息记录）
      // 2. 关注对方但对方没关注的人，只在自己的列表看到对方，对方列表看不到（除非我发了消息）
      // 3. 对方关注我但我没关注对方，只在对方列表看到我（除非对方发了消息）
      // 4. 有消息记录的人根据消息显示
      const query = `
        SELECT
          u.id as user_id,
          u.username,
          u.avatar,
          COALESCE(m.content, '') as last_message,
          COALESCE(m.created_at, u.created_at) as last_time,
          COALESCE(m.sender_id, 0) as last_sender_id,
          (SELECT COUNT(*) FROM messages 
           WHERE sender_id = u.id AND receiver_id = ? AND is_read = FALSE
          ) as unread_count,
          -- 检查是否互关
          EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id) as is_following,
          EXISTS(SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = ?) as is_follower,
          -- 检查是否有消息记录
          EXISTS(SELECT 1 FROM messages 
                 WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
                ) as has_messages,
          -- 我发给对方的消息数（用于非互关限制）
          (SELECT COUNT(*) FROM messages 
           WHERE sender_id = ? AND receiver_id = u.id
          ) as my_message_count,
          -- 对方发给我的消息数
          (SELECT COUNT(*) FROM messages 
           WHERE sender_id = u.id AND receiver_id = ?
          ) as their_message_count
         FROM users u
         LEFT JOIN (
           -- 获取与每个用户的最新消息
           SELECT
             CASE WHEN sender_id = ${userId} THEN receiver_id ELSE sender_id END as other_id,
             MAX(id) as last_message_id
           FROM messages
           WHERE (sender_id = ${userId} OR receiver_id = ${userId})
           ${deletedFilter}
           GROUP BY other_id
         ) as latest ON latest.other_id = u.id
         LEFT JOIN messages m ON m.id = latest.last_message_id
         WHERE
           -- 情况1：互关的人（双方都要显示）
           (EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id)
            AND EXISTS(SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = ?))
           OR
           -- 情况2：我关注对方，且我有发消息给对方（在我的列表显示）
           (EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = u.id)
            AND EXISTS(SELECT 1 FROM messages 
                       WHERE sender_id = ? AND receiver_id = u.id
                      ))
           OR
           -- 情况3：对方关注我，且对方有发消息给我（在我的列表显示）
           (EXISTS(SELECT 1 FROM follows WHERE follower_id = u.id AND following_id = ?)
            AND EXISTS(SELECT 1 FROM messages 
                       WHERE sender_id = u.id AND receiver_id = ?
                      ))
           OR
           -- 情况4：有消息往来（无论是否关注）
           EXISTS(SELECT 1 FROM messages 
                  WHERE (sender_id = ? AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = ?)
                 )
         ORDER BY last_time DESC`;

      db.query(query, [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId], (err, results) => {
        if (err) {
          console.error('获取私信列表失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }
        res.status(200).json({ messages: results });
      });
    }
  );
});

// 获取与某用户的聊天记录
router.get('/messages/:userId', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.userId;
  const { page = 1, limit = 20, after } = req.query;
  const offset = (page - 1) * limit;

  // 先检查表是否存在
  db.query(
    `SELECT COUNT(*) as table_exists 
     FROM information_schema.tables 
     WHERE table_schema = DATABASE() AND table_name = 'deleted_messages'`,
    (err, tableCheck) => {
      if (err) {
        console.error('检查表存在失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      const hasDeletedTable = tableCheck[0].table_exists > 0;
      
      let query;
      let params;
      
      // 构建查询条件
      let whereConditions = '((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))';
      let baseParams = [currentUserId, otherUserId, otherUserId, currentUserId];
      
      // 如果指定了after参数，只查询该时间之后的消息
      if (after) {
        whereConditions += ' AND m.created_at > FROM_UNIXTIME(?)';
        baseParams.push(parseInt(after) / 1000); // 将毫秒转为秒
      }
      
      if (hasDeletedTable) {
        query = `SELECT m.*, u.username, u.avatar
                 FROM messages m
                 JOIN users u ON m.sender_id = u.id
                 LEFT JOIN deleted_messages dm ON m.id = dm.message_id AND dm.user_id = ?
                 WHERE ${whereConditions}
                 AND dm.id IS NULL
                 ORDER BY m.created_at DESC
                 LIMIT ? OFFSET ?`;
        params = [currentUserId, ...baseParams, parseInt(limit), parseInt(offset)];
      } else {
        query = `SELECT m.*, u.username, u.avatar
                 FROM messages m
                 JOIN users u ON m.sender_id = u.id
                 WHERE ${whereConditions}
                 ORDER BY m.created_at DESC
                 LIMIT ? OFFSET ?`;
        params = [...baseParams, parseInt(limit), parseInt(offset)];
      }

      db.query(query, params, (err, results) => {
        if (err) {
          console.error('获取聊天记录失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }

        // 标记消息为已读
        if (hasDeletedTable) {
          db.query(
            `UPDATE messages m
             LEFT JOIN deleted_messages dm ON m.id = dm.message_id AND dm.user_id = ?
             SET m.is_read = TRUE 
             WHERE m.sender_id = ? AND m.receiver_id = ? AND m.is_read = FALSE AND dm.id IS NULL`,
            [currentUserId, otherUserId, currentUserId],
            (err) => {
              if (err) {
                console.error('标记已读失败:', err);
              }
            }
          );
        } else {
          db.query(
            'UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE',
            [otherUserId, currentUserId],
            (err) => {
              if (err) {
                console.error('标记已读失败:', err);
              }
            }
          );
        }

        res.status(200).json({
          messages: results.reverse(),
          hasMore: results.length === parseInt(limit)
        });
      });
    }
  );
});

// 获取未读消息数
router.get('/messages/unread/count', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // 先检查表是否存在
  db.query(
    `SELECT COUNT(*) as table_exists 
     FROM information_schema.tables 
     WHERE table_schema = DATABASE() AND table_name = 'deleted_messages'`,
    (err, tableCheck) => {
      if (err) {
        console.error('检查表存在失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      const hasDeletedTable = tableCheck[0].table_exists > 0;
      
      let query;
      let params;
      
      if (hasDeletedTable) {
        query = `SELECT COUNT(*) as count FROM messages m
                 LEFT JOIN deleted_messages dm ON m.id = dm.message_id AND dm.user_id = ?
                 WHERE m.receiver_id = ? AND m.is_read = FALSE AND dm.id IS NULL`;
        params = [userId, userId];
      } else {
        query = 'SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE';
        params = [userId];
      }

      db.query(query, params, (err, results) => {
        if (err) {
          console.error('获取未读数失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }
        res.status(200).json({ count: results[0].count });
      });
    }
  );
});

// 获取与某用户的私信限制状态（剩余可发送消息数）
router.get('/messages/limit/:userId', authenticateToken, (req, res) => {
  const senderId = req.user.id;
  const receiverId = req.params.userId;

  // 检查是否互相关注
  db.query(
    `SELECT 
      EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?) as sender_follows,
      EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?) as receiver_follows`,
    [senderId, receiverId, receiverId, senderId],
    (err, results) => {
      if (err) {
        console.error('检查关注状态失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      const { sender_follows, receiver_follows } = results[0];
      const isMutual = sender_follows && receiver_follows;

      if (isMutual) {
        // 互相关注，无限制
        return res.status(200).json({
          isMutual: true,
          remainingMessages: -1, // -1表示无限制
          canSend: true,
          senderFollows: true,
          receiverFollows: true
        });
      }

      // 获取对方最后回复的时间
      db.query(
        `SELECT MAX(created_at) as last_reply_time 
         FROM messages 
         WHERE sender_id = ? AND receiver_id = ?`,
        [receiverId, senderId],
        (err, replyResults) => {
          if (err) {
            console.error('检查回复状态失败:', err);
            return res.status(500).json({ error: '服务器错误' });
          }

          const lastReplyTime = replyResults[0].last_reply_time;
          
          // 查询在对方最后回复之后，我发送了多少条消息
          let countQuery = `SELECT COUNT(*) as count FROM messages 
                            WHERE sender_id = ? AND receiver_id = ?`;
          let countParams = [senderId, receiverId];
          
          if (lastReplyTime) {
            countQuery += ` AND created_at > ?`;
            countParams.push(lastReplyTime);
          }

          db.query(countQuery, countParams, (err, countResults) => {
            if (err) {
              console.error('检查消息数量失败:', err);
              return res.status(500).json({ error: '服务器错误' });
            }

            const sentCount = countResults[0].count;
            const remainingMessages = Math.max(0, 3 - sentCount);

            res.status(200).json({
              isMutual: false,
              remainingMessages: remainingMessages,
              canSend: remainingMessages > 0,
              sentCount: sentCount,
              senderFollows: sender_follows === 1,
              receiverFollows: receiver_follows === 1
            });
          });
        }
      );
    }
  );
});

// 清空聊天记录（软删除 - 只影响当前用户）
router.delete('/messages/clear/:userId', authenticateToken, (req, res) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.userId;

  // 获取双方之间的所有消息ID
  db.query(
    `SELECT id FROM messages 
     WHERE (sender_id = ? AND receiver_id = ?) 
     OR (sender_id = ? AND receiver_id = ?)`,
    [currentUserId, otherUserId, otherUserId, currentUserId],
    (err, results) => {
      if (err) {
        console.error('获取消息列表失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      if (results.length === 0) {
        return res.status(200).json({
          message: '聊天记录已清空',
          deletedCount: 0
        });
      }

      const messageIds = results.map(r => r.id);
      const placeholders = messageIds.map(() => '?').join(',');

      // 检查是否已有删除记录表，如果没有则创建
      db.query(
        `CREATE TABLE IF NOT EXISTS deleted_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          message_id INT NOT NULL,
          deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_message (user_id, message_id)
        )`,
        (err) => {
          if (err) {
            console.error('创建删除记录表失败:', err);
            return res.status(500).json({ error: '服务器错误' });
          }

          // 批量插入删除记录（忽略重复）
          const insertValues = messageIds.map(msgId => [currentUserId, msgId]);
          db.query(
            `INSERT IGNORE INTO deleted_messages (user_id, message_id) VALUES ?`,
            [insertValues],
            (err, insertResult) => {
              if (err) {
                console.error('记录删除消息失败:', err);
                return res.status(500).json({ error: '服务器错误' });
              }

              res.status(200).json({
                message: '聊天记录已清空',
                deletedCount: insertResult.affectedRows
              });
            }
          );
        }
      );
    }
  );
});

// ========== 管理接口 ==========

// 获取所有用户（管理用）
// 获取用户列表（带统计数据）
router.get('/users', async (req, res) => {
  try {
    // 获取所有用户基本信息
    const users = await new Promise((resolve, reject) => {
      db.query(
        'SELECT id, username, email, avatar, created_at FROM users ORDER BY created_at DESC',
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    // 为每个用户获取统计数据
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // 获取帖子数
        const postsCount = await new Promise((resolve) => {
          db.query('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [user.id], (err, results) => {
            if (err) resolve(0);
            else resolve(results[0].count);
          });
        });

        // 获取声音数
        const soundsCount = await new Promise((resolve) => {
          db.query('SELECT COUNT(*) as count FROM sounds WHERE user_id = ?', [user.id], (err, results) => {
            if (err) resolve(0);
            else resolve(results[0].count);
          });
        });

        // 获取评论数
        const commentsCount = await new Promise((resolve) => {
          db.query('SELECT COUNT(*) as count FROM comments WHERE user_id = ?', [user.id], (err, results) => {
            if (err) resolve(0);
            else resolve(results[0].count);
          });
        });

        return {
          ...user,
          posts_count: postsCount,
          sounds_count: soundsCount,
          comments_count: commentsCount
        };
      })
    );

    res.status(200).json({ users: usersWithStats });
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除用户（管理用）
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  // 先删除关联数据
  db.query('DELETE FROM follows WHERE follower_id = ? OR following_id = ?', [id, id], (err) => {
    if (err) console.error('删除关注记录失败:', err);

    db.query('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [id, id], (err) => {
      if (err) console.error('删除消息记录失败:', err);

      db.query('DELETE FROM likes WHERE user_id = ?', [id], (err) => {
        if (err) console.error('删除点赞记录失败:', err);

        db.query('DELETE FROM comments WHERE user_id = ?', [id], (err) => {
          if (err) console.error('删除评论记录失败:', err);

          db.query('DELETE FROM posts WHERE user_id = ?', [id], (err) => {
            if (err) console.error('删除帖子失败:', err);

            db.query('DELETE FROM sounds WHERE user_id = ?', [id], (err) => {
              if (err) console.error('删除声音失败:', err);

              // 最后删除用户
              db.query('DELETE FROM users WHERE id = ?', [id], (err, results) => {
                if (err) {
                  console.error('删除用户失败:', err);
                  return res.status(500).json({ error: '服务器错误' });
                }
                if (results.affectedRows === 0) {
                  return res.status(404).json({ error: '用户不存在' });
                }
                res.status(200).json({ message: '用户删除成功' });
              });
            });
          });
        });
      });
    });
  });
});

module.exports = router;
