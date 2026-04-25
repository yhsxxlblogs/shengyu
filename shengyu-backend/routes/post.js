const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { authenticateToken, optionalAuth, sanitizeInput } = require('../middleware/security');

// 发布帖子
router.post('/create', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // 检查请求体是否存在
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ code: 400, error: '请求体不能为空' });
  }
  
  const { content, image_url, sound_id } = req.body;

  if (!content) {
    return res.status(400).json({ code: 400, error: '内容不能为空' });
  }

  // 验证内容长度
  if (content.length > 2000) {
    return res.status(400).json({ code: 400, error: '内容过长，最多2000字符' });
  }

  // XSS防护 - 清理内容
  const sanitizedContent = sanitizeInput(content);

  db.query(
    'INSERT INTO posts (user_id, content, image_url, sound_id) VALUES (?, ?, ?, ?)',
    [userId, sanitizedContent, image_url || null, sound_id || null],
    (err, results) => {
      if (err) {
        console.error('发布帖子失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      // 获取新发布的帖子
      db.query(
        `SELECT p.*, 
                COALESCE(u.nickname, u.wechat_nickname, u.username) as username, 
                COALESCE(u.avatar, u.wechat_avatar) as avatar,
                0 as like_count,
                0 as comment_count
         FROM posts p
         LEFT JOIN users u ON p.user_id = u.id
         WHERE p.id = ?`,
        [results.insertId],
        (err, results) => {
          if (err) {
            console.error('获取帖子失败:', err);
            return res.status(500).json({ code: 500, error: '服务器错误' });
          }

          res.status(201).json({
            code: 201,
            message: '发布成功',
            data: results[0]
          });
        }
      );
    }
  );
});

// 获取帖子列表
router.get('/list', optionalAuth, (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user?.id;

  // 验证分页参数
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50);
  const offset = (pageNum - 1) * limitNum;

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ code: 400, error: '无效的分页参数' });
  }

  db.query(
    `SELECT p.*, 
            COALESCE(u.nickname, u.wechat_nickname, u.username) as username, 
            COALESCE(u.avatar, u.wechat_avatar) as avatar,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
            ${userId ? `(SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ${userId}) as is_liked` : '0 as is_liked'}
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.visible = 1
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [limitNum, offset],
    (err, results) => {
      if (err) {
        console.error('获取帖子列表失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      res.status(200).json({ code: 200, posts: results });
    }
  );
});

// 获取热门帖子
router.get('/popular', (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.min(parseInt(limit), 20);

  if (isNaN(limitNum) || limitNum < 1) {
    return res.status(400).json({ code: 400, error: '无效的参数' });
  }

  db.query(
    `SELECT p.*, 
            COALESCE(u.nickname, u.wechat_nickname, u.username) as username, 
            COALESCE(u.avatar, u.wechat_avatar) as avatar,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     ORDER BY ((SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) + (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)) DESC, p.created_at DESC
     LIMIT ?`,
    [limitNum],
    (err, results) => {
      if (err) {
        console.error('获取热门帖子失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      res.status(200).json({ code: 200, posts: results });
    }
  );
});

// 点赞/取消点赞
router.post('/like/:post_id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const postId = req.params.post_id;

  // 检查帖子是否存在
  db.query('SELECT id FROM posts WHERE id = ?', [postId], (err, results) => {
    if (err) {
      console.error('检查帖子失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }

    if (results.length === 0) {
      return res.status(404).json({ code: 404, error: '帖子不存在' });
    }

    // 检查是否已点赞
    db.query(
      'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
      [postId, userId],
      (err, results) => {
        if (err) {
          console.error('检查点赞状态失败:', err);
          return res.status(500).json({ code: 500, error: '服务器错误' });
        }

        if (results.length > 0) {
          // 已点赞，取消点赞
          db.query(
            'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
            [postId, userId],
            (err) => {
              if (err) {
                console.error('取消点赞失败:', err);
                return res.status(500).json({ code: 500, error: '服务器错误' });
              }
              res.status(200).json({ code: 200, message: '取消点赞成功', data: { isLiked: false } });
            }
          );
        } else {
          // 未点赞，添加点赞
          db.query(
            'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
            [postId, userId],
            (err) => {
              if (err) {
                console.error('点赞失败:', err);
                return res.status(500).json({ code: 500, error: '服务器错误' });
              }
              res.status(200).json({ code: 200, message: '点赞成功', data: { isLiked: true } });
            }
          );
        }
      }
    );
  });
});

// 发表评论
router.post('/comment/:post_id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const postId = req.params.post_id;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ code: 400, error: '评论内容不能为空' });
  }

  if (content.length > 500) {
    return res.status(400).json({ code: 400, error: '评论内容过长，最多500字符' });
  }

  // 检查帖子是否存在
  db.query('SELECT id, user_id FROM posts WHERE id = ?', [postId], (err, results) => {
    if (err) {
      console.error('检查帖子失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }

    if (results.length === 0) {
      return res.status(404).json({ code: 404, error: '帖子不存在' });
    }

    const post = results[0];

    // XSS防护 - 清理评论内容
    const sanitizedContent = sanitizeInput(content.trim());

    db.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, sanitizedContent],
      (err, results) => {
        if (err) {
          console.error('发表评论失败:', err);
          return res.status(500).json({ code: 500, error: '服务器错误' });
        }

        // 获取新评论
        db.query(
          `SELECT c.*, 
                  COALESCE(u.nickname, u.wechat_nickname, u.username) as username, 
                  COALESCE(u.avatar, u.wechat_avatar) as avatar
           FROM comments c
           LEFT JOIN users u ON c.user_id = u.id
           WHERE c.id = ?`,
          [results.insertId],
          (err, results) => {
            if (err) {
              console.error('获取评论失败:', err);
              return res.status(500).json({ code: 500, error: '服务器错误' });
            }

            // 发送通知给帖子作者
            if (post.user_id !== userId && global.sendNotificationToUser) {
              global.sendNotificationToUser(post.user_id, {
                type: 'new_comment',
                data: {
                  post_id: postId,
                  comment: results[0]
                }
              });
            }

            res.status(201).json({
              code: 201,
              message: '评论成功',
              data: results[0]
            });
          }
        );
      }
    );
  });
});

// 获取评论
router.get('/comments/:post_id', (req, res) => {
  const postId = req.params.post_id;
  const { page = 1, limit = 20 } = req.query;

  // 验证分页参数
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50);
  const offset = (pageNum - 1) * limitNum;

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ code: 400, error: '无效的分页参数' });
  }

  db.query(
    `SELECT c.*, 
            COALESCE(u.nickname, u.wechat_nickname, u.username) as username, 
            COALESCE(u.avatar, u.wechat_avatar) as avatar
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ?
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [postId, limitNum, offset],
    (err, results) => {
      if (err) {
        console.error('获取评论失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      res.status(200).json({ code: 200, comments: results });
    }
  );
});

// 获取我的帖子
router.get('/my', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50);
  const offset = (pageNum - 1) * limitNum;

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ code: 400, error: '无效的分页参数' });
  }

  db.query(
    `SELECT p.*, 
            COALESCE(u.nickname, u.wechat_nickname, u.username) as username, 
            COALESCE(u.avatar, u.wechat_avatar) as avatar,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limitNum, offset],
    (err, results) => {
      if (err) {
        console.error('获取我的帖子失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      res.status(200).json({ code: 200, posts: results });
    }
  );
});

// 获取我点赞的帖子
router.get('/likes', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50);
  const offset = (pageNum - 1) * limitNum;

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ code: 400, error: '无效的分页参数' });
  }

  db.query(
    `SELECT p.*, 
            COALESCE(u.nickname, u.wechat_nickname, u.username) as username, 
            COALESCE(u.avatar, u.wechat_avatar) as avatar,
            (SELECT COUNT(*) FROM likes l2 WHERE l2.post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
            1 as is_liked
     FROM likes l
     JOIN posts p ON l.post_id = p.id
     LEFT JOIN users u ON p.user_id = u.id
     WHERE l.user_id = ?
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limitNum, offset],
    (err, results) => {
      if (err) {
        console.error('获取点赞帖子失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      res.status(200).json({ code: 200, posts: results });
    }
  );
});

// 获取点赞的帖子ID列表
router.get('/liked-ids', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query(
    'SELECT post_id FROM likes WHERE user_id = ?',
    [userId],
    (err, results) => {
      if (err) {
        console.error('获取点赞ID失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      const likedIds = results.map(row => row.post_id);
      res.status(200).json({ code: 200, data: likedIds });
    }
  );
});

// 删除帖子
router.delete('/delete/:post_id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const postId = req.params.post_id;

  // 检查帖子是否存在且属于当前用户
  db.query(
    'SELECT id, user_id FROM posts WHERE id = ?',
    [postId],
    (err, results) => {
      if (err) {
        console.error('检查帖子失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      if (results.length === 0) {
        return res.status(404).json({ code: 404, error: '帖子不存在' });
      }

      const post = results[0];

      // 检查是否是帖子作者或管理员
      if (post.user_id !== userId && !req.user.is_admin) {
        return res.status(403).json({ code: 403, error: '无权删除此帖子' });
      }

      // 删除相关的点赞和评论
      db.query('DELETE FROM likes WHERE post_id = ?', [postId], (err) => {
        if (err) {
          console.error('删除点赞失败:', err);
        }

        db.query('DELETE FROM comments WHERE post_id = ?', [postId], (err) => {
          if (err) {
            console.error('删除评论失败:', err);
          }

          // 删除帖子
          db.query('DELETE FROM posts WHERE id = ?', [postId], (err) => {
            if (err) {
              console.error('删除帖子失败:', err);
              return res.status(500).json({ code: 500, error: '服务器错误' });
            }

            res.status(200).json({ code: 200, message: '删除成功' });
          });
        });
      });
    }
  );
});

// 获取帖子详情
router.get('/detail/:post_id', optionalAuth, (req, res) => {
  const postId = req.params.post_id;
  const userId = req.user?.id;

  db.query(
    `SELECT p.*, 
            COALESCE(u.nickname, u.wechat_nickname, u.username) as username, 
            COALESCE(u.avatar, u.wechat_avatar) as avatar,
            (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
            ${userId ? `(SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id AND l.user_id = ${userId}) as is_liked` : '0 as is_liked'}
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.id = ?`,
    [postId],
    (err, results) => {
      if (err) {
        console.error('获取帖子详情失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      if (results.length === 0) {
        return res.status(404).json({ code: 404, error: '帖子不存在' });
      }

      res.status(200).json({ code: 200, post: results[0] });
    }
  );
});

module.exports = router;
