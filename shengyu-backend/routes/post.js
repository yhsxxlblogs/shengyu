const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const fs = require('fs');
const { cacheMiddleware, clearCache, CACHE_KEYS, CACHE_TTL } = require('../middleware/cache');

const router = express.Router();

// 确保上传目录存在
const imagesDir = path.join(__dirname, '../uploads/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  },
  fileFilter: function (req, file, cb) {
    // 只允许上传图片
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 发布帖子
router.post('/create', upload.single('image'), (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });

  try {
    const decoded = jwt.verify(token, 'secret_key');
    const { content, sound_url } = req.body;

    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;
    }

    db.query(
      'INSERT INTO posts (user_id, sound_id, content, image_url) VALUES (?, ?, ?, ?)',
      [decoded.id, null, content, imageUrl],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        // 清除帖子列表缓存
        clearCache('posts:list:*');
        res.status(201).json({ message: '发布成功', post_id: results.insertId });
      }
    );
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// 获取帖子列表（支持搜索，添加缓存）
router.get('/list',
  cacheMiddleware(CACHE_KEYS.POSTS_LIST, CACHE_TTL.POSTS_LIST, (req) => {
    const { q } = req.query;
    const token = req.headers.authorization?.split(' ')[1];
    let userId = 'anonymous';
    if (token) {
      try {
        const decoded = jwt.verify(token, 'secret_key');
        userId = decoded.id;
      } catch (e) {}
    }
    return `${userId}:${q || 'all'}`;
  }),
  (req, res) => {
    const { q } = req.query;
    const token = req.headers.authorization?.split(' ')[1];
    let currentUserId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, 'secret_key');
        currentUserId = decoded.id;
      } catch (error) {
        // token无效，继续作为未登录用户处理
      }
    }

    // 使用反规范化字段 like_count 和 comment_count，避免子查询
    let query = `
      SELECT p.*, u.username, u.avatar
             ${currentUserId ? `, EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id) as is_following` : ''}
             ${currentUserId ? `, EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) as liked` : ''}
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
    `;

    // 如果有搜索关键词，添加WHERE条件
    if (q) {
      query += ` WHERE p.content LIKE ? OR u.username LIKE ?`;
    }

    query += ` ORDER BY p.created_at DESC`;

    let params = [];
    if (currentUserId) {
      params.push(currentUserId);
      params.push(currentUserId);
    }
    if (q) {
      params.push(`%${q}%`, `%${q}%`);
    }

    db.query(query, params, (err, results) => {
      if (err) {
        console.error('获取帖子列表失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.status(200).json({ posts: results });
    });
  }
);

// 点赞/取消点赞
router.post('/like/:post_id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });

  try {
    const decoded = jwt.verify(token, 'secret_key');
    const { post_id } = req.params;

    // 检查是否已点赞
    db.query(
      'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
      [post_id, decoded.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });

        if (results.length > 0) {
          // 取消点赞
          db.query(
            'DELETE FROM likes WHERE post_id = ? AND user_id = ?',
            [post_id, decoded.id],
            (err) => {
              if (err) return res.status(500).json({ error: '服务器错误' });
              // 清除帖子相关缓存
              clearCache(`*post*${post_id}*`);
              clearCache('posts:list:*');
              res.status(200).json({ message: '取消点赞成功' });
            }
          );
        } else {
          // 点赞
          db.query(
            'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
            [post_id, decoded.id],
            (err) => {
              if (err) return res.status(500).json({ error: '服务器错误' });
              // 清除帖子相关缓存
              clearCache(`*post*${post_id}*`);
              clearCache('posts:list:*');
              res.status(200).json({ message: '点赞成功' });
            }
          );
        }
      }
    );
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// 发表评论
router.post('/comment/:post_id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });

  try {
    const decoded = jwt.verify(token, 'secret_key');
    const { post_id } = req.params;
    const { content } = req.body;

    db.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [post_id, decoded.id, content],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        // 清除帖子相关缓存
        clearCache(`*post*${post_id}*`);
        clearCache('posts:list:*');
        res.status(201).json({ message: '评论成功' });
      }
    );
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// 获取帖子评论（添加缓存）
router.get('/comments/:post_id',
  cacheMiddleware('post:comments:', 60), // 缓存1分钟
  (req, res) => {
    const { post_id } = req.params;
    
    db.query(
      `
        SELECT c.*, u.username, u.avatar
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at DESC
      `,
      [post_id],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        res.status(200).json({ comments: results });
      }
    );
  }
);

// 获取用户的帖子
router.get('/my', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    
    // 使用反规范化字段 like_count 和 comment_count
    db.query(
      `
        SELECT p.*, u.username, u.avatar
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
      `,
      [decoded.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        res.status(200).json({ posts: results });
      }
    );
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// 获取用户点赞的帖子
router.get('/likes', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });

  try {
    const decoded = jwt.verify(token, 'secret_key');

    // 使用反规范化字段 like_count 和 comment_count
    db.query(
      `
        SELECT p.*, u.username, u.avatar,
               (SELECT JSON_ARRAYAGG(JSON_OBJECT('id', l.id, 'username', lu.username, 'avatar', lu.avatar))
                FROM likes l
                LEFT JOIN users lu ON l.user_id = lu.id
                WHERE l.post_id = p.id) as likes
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        INNER JOIN likes l ON p.id = l.post_id
        WHERE l.user_id = ?
        ORDER BY p.created_at DESC
      `,
      [decoded.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        res.status(200).json({ posts: results });
      }
    );
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// 获取用户点赞的帖子ID列表（用于前端快速判断点赞状态）
router.get('/liked-ids', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });

  try {
    const decoded = jwt.verify(token, 'secret_key');

    db.query(
      'SELECT post_id FROM likes WHERE user_id = ?',
      [decoded.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        const likedIds = results.map(r => r.post_id);
        res.status(200).json({ likedIds });
      }
    );
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// 删除帖子
router.delete('/delete/:post_id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const { post_id } = req.params;
    
    // 检查帖子是否属于该用户
    db.query(
      'SELECT * FROM posts WHERE id = ? AND user_id = ?',
      [post_id, decoded.id],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        if (results.length === 0) return res.status(403).json({ error: '无权删除此帖子' });
        
        const post = results[0];
        
        // 删除相关的点赞和评论
        db.query('DELETE FROM likes WHERE post_id = ?', [post_id], (err) => {
          if (err) return res.status(500).json({ error: '服务器错误' });
          
          db.query('DELETE FROM comments WHERE post_id = ?', [post_id], (err) => {
            if (err) return res.status(500).json({ error: '服务器错误' });
            
            // 删除帖子
            db.query('DELETE FROM posts WHERE id = ?', [post_id], (err) => {
              if (err) return res.status(500).json({ error: '服务器错误' });
              
              // 删除帖子图片文件
              if (post.image_url) {
                const imagePath = path.join(__dirname, '..', post.image_url);
                fs.unlink(imagePath, (err) => {
                  if (err) console.error('删除图片文件失败:', err);
                });
              }
              
              res.status(200).json({ message: '删除成功' });
            });
          });
        });
      }
    );
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// 获取帖子详情
router.get('/detail/:post_id',
  cacheMiddleware(CACHE_KEYS.POST_DETAIL, CACHE_TTL.POST_DETAIL, (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    let userId = 'anonymous';
    if (token) {
      try {
        const decoded = jwt.verify(token, 'secret_key');
        userId = decoded.id;
      } catch (e) {}
    }
    return `${req.params.post_id}:${userId}`;
  }),
  (req, res) => {
    const { post_id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    let currentUserId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, 'secret_key');
        currentUserId = decoded.id;
      } catch (error) {
        // token无效，继续作为未登录用户处理
      }
    }

    // 使用反规范化字段 like_count 和 comment_count
    let query = `
      SELECT p.*, u.username, u.avatar
             ${currentUserId ? `, EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id) as is_following` : ''}
             ${currentUserId ? `, EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) as liked` : ''}
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `;

    let params = [];
    if (currentUserId) {
      params.push(currentUserId);
      params.push(currentUserId);
    }
    params.push(post_id);

    db.query(query, params, (err, results) => {
      if (err) {
        console.error('获取帖子详情失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      if (results.length === 0) return res.status(404).json({ error: '帖子不存在' });
      res.status(200).json({ post: results[0] });
    });
  }
);

// 搜索帖子
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: '请输入搜索关键词' });

  // 使用反规范化字段 like_count 和 comment_count
  db.query(
    `
      SELECT p.*, u.username, u.avatar
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.content LIKE ? OR u.username LIKE ?
      ORDER BY p.created_at DESC
    `,
    [`%${q}%`, `%${q}%`],
    (err, results) => {
      if (err) return res.status(500).json({ error: '服务器错误' });
      res.status(200).json({ posts: results });
    }
  );
});

// 管理用：删除帖子（无需token验证）
router.delete('/admin/delete/:post_id', (req, res) => {
  const { post_id } = req.params;

  // 先获取帖子信息
  db.query(
    'SELECT * FROM posts WHERE id = ?',
    [post_id],
    (err, results) => {
      if (err) {
        console.error('获取帖子失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: '帖子不存在' });
      }

      const post = results[0];

      // 删除相关的点赞和评论
      db.query('DELETE FROM likes WHERE post_id = ?', [post_id], (err) => {
        if (err) console.error('删除点赞失败:', err);

        db.query('DELETE FROM comments WHERE post_id = ?', [post_id], (err) => {
          if (err) console.error('删除评论失败:', err);

          // 删除帖子
          db.query('DELETE FROM posts WHERE id = ?', [post_id], (err) => {
            if (err) {
              console.error('删除帖子失败:', err);
              return res.status(500).json({ error: '服务器错误' });
            }

            // 删除帖子图片文件
            if (post.image_url) {
              const imagePath = path.join(__dirname, '..', post.image_url);
              fs.unlink(imagePath, (err) => {
                if (err) console.error('删除图片文件失败:', err);
              });
            }

            res.status(200).json({ message: '帖子删除成功' });
          });
        });
      });
    }
  );
});

// 获取热门帖子（按点赞数和评论数排序）
router.get('/popular', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    let currentUserId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, 'secret_key');
        currentUserId = decoded.id;
      } catch (error) {
        // token无效，继续作为未登录用户处理
      }
    }

    // 优先从Redis缓存获取
    const redis = require('../config/redis');
    const cachedPosts = await redis.getAsync('popular:posts');
    
    if (cachedPosts) {
      let posts = JSON.parse(cachedPosts);
      
      // 如果用户已登录，查询该用户的点赞状态
      if (currentUserId) {
        const postIds = posts.map(p => p.id);
        if (postIds.length > 0) {
          const likedQuery = `SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (?)`;
          db.query(likedQuery, [currentUserId, postIds], (err, likedResults) => {
            if (err) {
              console.error('查询点赞状态失败:', err);
            } else {
              const likedSet = new Set(likedResults.map(r => r.post_id));
              posts = posts.map(p => ({
                ...p,
                liked: likedSet.has(p.id)
              }));
            }
            return res.status(200).json({ posts });
          });
        } else {
          return res.status(200).json({ posts });
        }
      } else {
        return res.status(200).json({ posts });
      }
      return;
    }

    // 缓存未命中，从数据库查询
    let query = `
      SELECT p.*, u.username, u.avatar
             ${currentUserId ? `, EXISTS(SELECT 1 FROM follows WHERE follower_id = ? AND following_id = p.user_id) as is_following` : ''}
             ${currentUserId ? `, EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id) as liked` : ''}
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY (p.like_count + p.comment_count) DESC, p.created_at DESC
      LIMIT 10
    `;

    let params = [];
    if (currentUserId) {
      params.push(currentUserId);
      params.push(currentUserId);
    }

    db.query(query, params, (err, results) => {
      if (err) {
        console.error('获取热门帖子失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      
      // 存入Redis缓存
      redis.setAsync('popular:posts', JSON.stringify(results), 300).catch(err => {
        console.error('缓存热门帖子失败:', err);
      });
      
      res.status(200).json({ posts: results });
    });
  } catch (error) {
    console.error('获取热门帖子出错:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;