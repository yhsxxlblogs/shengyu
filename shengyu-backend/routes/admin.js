const express = require('express');
const router = express.Router();
const db = require('../config/db');
const config = require('../config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { requireAdmin, sanitizeFilename } = require('../middleware/security');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const soundsDir = path.join(__dirname, '../uploads/sounds');
    if (!fs.existsSync(soundsDir)) {
      fs.mkdirSync(soundsDir, { recursive: true });
    }
    cb(null, soundsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, 'sound-' + uniqueSuffix + safeExt);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxSoundSize
  },
  fileFilter: function (req, file, cb) {
    const filetypes = config.upload.allowedSoundTypes;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传音频文件'));
    }
  }
});

// 获取当前活跃的通知（供前端展示）- 不需要管理员权限
router.get('/notifications/current', (req, res) => {
  const now = new Date();

  db.query(
    `SELECT id, title, content, type, created_at
     FROM notifications
     WHERE status = 'active'
       AND (publish_at IS NULL OR publish_at <= ?)
       AND (expire_at IS NULL OR expire_at > ?)
     ORDER BY created_at DESC
     LIMIT 1`,
    [now, now],
    (err, results) => {
      if (err) {
        console.error('获取通知失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      if (results.length > 0) {
        res.status(200).json({
          code: 200,
          hasNotification: true,
          notification: results[0]
        });
      } else {
        res.status(200).json({
          code: 200,
          hasNotification: false,
          notification: null
        });
      }
    }
  );
});

// 所有管理接口都需要管理员权限
router.use(requireAdmin);

// 获取所有用户
router.get('/users', (req, res) => {
  console.log('[/admin/users] 收到请求');
  db.query('SELECT id, username, email, avatar, is_active, is_admin, created_at FROM users ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('[/admin/users] 获取用户数据失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误', details: err.message });
    }
    console.log('[/admin/users] 查询到', results.length, '个用户');
    
    // 为每个用户获取统计数据
    const users = results;
    const userIds = users.map(u => u.id);
    
    if (userIds.length === 0) {
      return res.status(200).json({ code: 200, users: [] });
    }
    
    // 获取帖子数统计
    db.query(
      `SELECT user_id, COUNT(*) as count FROM posts WHERE user_id IN (?) GROUP BY user_id`,
      [userIds],
      (err, postsResults) => {
        if (err) {
          console.error('获取帖子统计失败:', err);
          return res.status(200).json({ code: 200, users: results });
        }
        
        const postsCount = {};
        postsResults.forEach(row => {
          postsCount[row.user_id] = row.count;
        });

        // 获取声音数统计
        db.query(
          `SELECT user_id, COUNT(*) as count FROM sounds WHERE user_id IN (?) GROUP BY user_id`,
          [userIds],
          (err, soundsResults) => {
            if (err) {
              console.error('获取声音统计失败:', err);
              return res.status(200).json({ code: 200, users: results });
            }

            const soundsCount = {};
            soundsResults.forEach(row => {
              soundsCount[row.user_id] = row.count;
            });

            // 获取评论数统计
            db.query(
              `SELECT user_id, COUNT(*) as count FROM comments WHERE user_id IN (?) GROUP BY user_id`,
              [userIds],
              (err, commentsResults) => {
                if (err) {
                  console.error('获取评论统计失败:', err);
                  return res.status(200).json({ code: 200, users: results });
                }

                const commentsCount = {};
                commentsResults.forEach(row => {
                  commentsCount[row.user_id] = row.count;
                });

                // 合并统计数据到用户数据
                const usersWithStats = users.map(user => ({
                  ...user,
                  posts_count: postsCount[user.id] || 0,
                  sounds_count: soundsCount[user.id] || 0,
                  comments_count: commentsCount[user.id] || 0
                }));

                res.status(200).json({ code: 200, users: usersWithStats });
              }
            );
          }
        );
      }
    );
  });
});

// 添加用户
router.post('/users', (req, res) => {
  const { username, email, password, is_admin } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ code: 400, error: '缺少必要参数' });
  }

  const bcrypt = require('bcrypt');
  const hashedPassword = bcrypt.hashSync(password, config.security.bcryptRounds);

  db.query(
    'INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, is_admin ? 1 : 0],
    (err, results) => {
      if (err) {
        console.error('添加用户失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, message: '用户添加成功' });
    }
  );
});

// 禁用/启用用户
router.put('/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;
  
  // 不能禁用自己
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ code: 400, error: '不能禁用当前登录账号' });
  }

  db.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id], (err, results) => {
    if (err) {
      console.error('更新用户状态失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ code: 404, error: '用户不存在' });
    }
    res.status(200).json({ code: 200, message: is_active ? '用户已启用' : '用户已禁用' });
  });
});

// 设置/取消管理员
router.put('/users/:id/admin', (req, res) => {
  const { id } = req.params;
  const { is_admin } = req.body;
  
  // 不能取消自己的管理员权限
  if (parseInt(id) === req.user.id && !is_admin) {
    return res.status(400).json({ code: 400, error: '不能取消自己的管理员权限' });
  }

  db.query('UPDATE users SET is_admin = ? WHERE id = ?', [is_admin ? 1 : 0, id], (err, results) => {
    if (err) {
      console.error('更新管理员状态失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ code: 404, error: '用户不存在' });
    }
    res.status(200).json({ code: 200, message: is_admin ? '已设为管理员' : '已取消管理员权限' });
  });
});

// 删除用户
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  
  // 不能删除自己
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ code: 400, error: '不能删除当前登录账号' });
  }

  db.query('DELETE FROM users WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('删除用户失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ code: 404, error: '用户不存在' });
    }
    res.status(200).json({ code: 200, message: '删除成功' });
  });
});

// 获取用户的帖子
router.get('/users/:id/posts', (req, res) => {
  const { id } = req.params;
  
  db.query(
    `SELECT p.*, 
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
     FROM posts p
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`,
    [id],
    (err, results) => {
      if (err) {
        console.error('获取用户帖子失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 获取用户的声音
router.get('/users/:id/sounds', (req, res) => {
  const { id } = req.params;
  
  db.query(
    `SELECT * FROM sounds WHERE user_id = ? ORDER BY created_at DESC`,
    [id],
    (err, results) => {
      if (err) {
        console.error('获取用户声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 获取用户的评论
router.get('/users/:id/comments', (req, res) => {
  const { id } = req.params;
  
  db.query(
    `SELECT c.*, p.content as post_content
     FROM comments c
     LEFT JOIN posts p ON c.post_id = p.id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [id],
    (err, results) => {
      if (err) {
        console.error('获取用户评论失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// ========== 音频审核管理（必须放在 /sounds 之前）==========

// 获取待审核的音频列表
router.get('/sounds/pending', (req, res) => {
  db.query(
    `SELECT s.*, u.username 
     FROM sounds s
     LEFT JOIN users u ON s.user_id = u.id
     WHERE s.review_status = 'pending'
     ORDER BY s.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error('获取待审核音频失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 获取所有音频（包括审核状态）
router.get('/sounds/all', (req, res) => {
  const { status } = req.query;
  let query = `SELECT s.*, u.username 
               FROM sounds s
               LEFT JOIN users u ON s.user_id = u.id`;
  let params = [];
  
  if (status && status !== 'all') {
    query += ` WHERE s.review_status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY s.created_at DESC`;
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('获取音频列表失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    res.status(200).json({ code: 200, data: results });
  });
});

// 审核音频 - 通过
router.put('/sounds/:id/approve', (req, res) => {
  const { id } = req.params;
  
  db.query(
    'UPDATE sounds SET review_status = "approved", is_official = 1 WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('审核音频失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ code: 404, error: '音频不存在' });
      }
      res.status(200).json({ code: 200, message: '音频审核通过' });
    }
  );
});

// 审核音频 - 拒绝
router.put('/sounds/:id/reject', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  db.query(
    'UPDATE sounds SET review_status = "rejected", is_official = 0 WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('拒绝音频失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ code: 404, error: '音频不存在' });
      }
      res.status(200).json({ code: 200, message: '音频已拒绝', data: { reason } });
    }
  );
});

// 设置/取消官方音频
router.put('/sounds/:id/official', (req, res) => {
  const { id } = req.params;
  const { is_official } = req.body;
  
  db.query(
    'UPDATE sounds SET is_official = ? WHERE id = ?',
    [is_official ? 1 : 0, id],
    (err, results) => {
      if (err) {
        console.error('设置官方音频失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ code: 404, error: '音频不存在' });
      }
      res.status(200).json({ code: 200, message: is_official ? '已设为官方音频' : '已取消官方音频' });
    }
  );
});

// 获取所有声音（基础列表，放在后面避免拦截具体路由）
router.get('/sounds', (req, res) => {
  db.query(
    `SELECT s.id, s.user_id, u.username, s.animal_type, s.emotion, s.sound_url, s.duration, s.created_at
     FROM sounds s
     LEFT JOIN users u ON s.user_id = u.id`,
    (err, results) => {
      if (err) {
        console.error('获取声音数据失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 添加声音
router.post('/sounds', upload.single('sound'), (req, res) => {
  const { animal_type, emotion, duration } = req.body;
  const soundUrl = req.file ? '/uploads/sounds/' + req.file.filename : null;

  if (!animal_type || !emotion || !duration || !soundUrl) {
    return res.status(400).json({ code: 400, error: '缺少必要参数' });
  }

  db.query(
    'INSERT INTO sounds (user_id, animal_type, emotion, sound_url, duration) VALUES (?, ?, ?, ?, ?)',
    [1, animal_type, emotion, soundUrl, duration], // 暂时使用固定用户ID
    (err, results) => {
      if (err) {
        console.error('添加声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, message: '声音添加成功' });
    }
  );
});

// 删除声音
router.delete('/sounds/:id', (req, res) => {
  const { id } = req.params;

  // 先获取声音文件路径
  db.query('SELECT sound_url FROM sounds WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('获取声音失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    
    if (results.length > 0 && results[0].sound_url) {
      const soundPath = path.join(__dirname, '..', results[0].sound_url);
      if (fs.existsSync(soundPath)) {
        try {
          fs.unlinkSync(soundPath);
        } catch (e) {
          console.error('删除声音文件失败:', e);
        }
      }
    }

    db.query('DELETE FROM sounds WHERE id = ?', [id], (err, results) => {
      if (err) {
        console.error('删除声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, message: '删除成功' });
    });
  });
});

// 获取所有帖子
router.get('/posts', (req, res) => {
  db.query(
    `SELECT p.id, p.user_id, u.username, p.content, p.image_url, p.sound_id,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
            p.created_at
     FROM posts p
     LEFT JOIN users u ON p.user_id = u.id`,
    (err, results) => {
      if (err) {
        console.error('获取帖子数据失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, posts: results });
    }
  );
});

// 删除帖子
router.delete('/posts/:id', (req, res) => {
  const { id } = req.params;

  // 先获取帖子信息以删除图片
  db.query('SELECT image_url FROM posts WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('获取帖子失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    
    // 删除图片文件
    if (results.length > 0 && results[0].image_url) {
      const imagePath = path.join(__dirname, '..', results[0].image_url);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {
          console.error('删除图片文件失败:', e);
        }
      }
    }

    // 先删除相关的点赞和评论
    db.query('DELETE FROM likes WHERE post_id = ?', [id], (err) => {
      if (err) {
        console.error('删除点赞失败:', err);
      }

      db.query('DELETE FROM comments WHERE post_id = ?', [id], (err) => {
        if (err) {
          console.error('删除评论失败:', err);
        }

        // 最后删除帖子
        db.query('DELETE FROM posts WHERE id = ?', [id], (err, results) => {
          if (err) {
            console.error('删除帖子失败:', err);
            return res.status(500).json({ code: 500, error: '服务器错误' });
          }
          if (results.affectedRows === 0) {
            return res.status(404).json({ code: 404, error: '帖子不存在' });
          }
          res.status(200).json({ code: 200, message: '删除成功' });
        });
      });
    });
  });
});

// 发送通知 - 支持定时发布和定时销毁
router.post('/notification', (req, res) => {
  const { title, content, type, publishAt, expireAt } = req.body;

  if (!title || !content) {
    return res.status(400).json({ code: 400, error: '缺少必要参数' });
  }

  // 确定状态：如果有定时发布时间且在未来，则为pending
  let status = 'active';
  if (publishAt) {
    const publishTime = new Date(publishAt);
    if (publishTime > new Date()) {
      status = 'pending';
    }
  }

  // 先将所有现有的active通知禁用（如果新通知是active状态）
  const disableOldNotifications = status === 'active' ? 
    new Promise((resolve, reject) => {
      db.query(
        `UPDATE notifications SET status = 'disabled' WHERE status = 'active'`,
        (err, results) => {
          if (err) {
            console.error('禁用旧通知失败:', err);
            reject(err);
          } else {
            resolve(results);
          }
        }
      );
    }) : Promise.resolve();

  disableOldNotifications.then(() => {
    // 存储新通知到数据库
    db.query(
      `INSERT INTO notifications (title, content, type, status, publish_at, expire_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, type || 'info', status, publishAt || null, expireAt || null],
      (err, results) => {
        if (err) {
          console.error('发送通知失败:', err);
          return res.status(500).json({ code: 500, error: '服务器错误' });
        }
        // 返回成功响应和通知ID
        res.status(200).json({
          code: 200,
          message: status === 'pending' ? '定时通知设置成功' : '通知发送成功',
          data: {
            id: results.insertId,
            title,
            content,
            type: type || 'info',
            status,
            publishAt,
            expireAt
          }
        });
      }
    );
  }).catch(err => {
    res.status(500).json({ code: 500, error: '服务器错误' });
  });
});

// 获取所有通知（管理用）
router.get('/notification', (req, res) => {
  db.query(
    'SELECT id, title, content, type, status, created_at FROM notifications ORDER BY created_at DESC',
    (err, results) => {
      if (err) {
        console.error('获取通知列表失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, notifications: results });
    }
  );
});

// 删除通知
router.delete('/notification/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM notifications WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('删除通知失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ code: 404, error: '通知不存在' });
    }
    res.status(200).json({ code: 200, message: '通知删除成功' });
  });
});

// 清空所有通知
router.delete('/notifications/clear', (req, res) => {
  // 清空通知表
  db.query('DELETE FROM notifications', (err, results) => {
    if (err) {
      console.error('清空通知失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    res.status(200).json({ code: 200, message: '所有通知已清除' });
  });
});

// 获取前端版本信息
router.get('/frontend-version', (req, res) => {
  try {
    const versionFile = path.join(__dirname, '../version.json');

    if (fs.existsSync(versionFile)) {
      const versionInfo = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
      res.status(200).json({
        code: 200,
        data: {
          version: versionInfo.version,
          description: versionInfo.description,
          build: versionInfo.build,
          updatedAt: versionInfo.updatedAt
        }
      });
    } else {
      res.status(200).json({
        code: 200,
        data: {
          version: '1.0.0',
          description: '初始版本',
          build: 1
        }
      });
    }
  } catch (error) {
    console.error('获取版本信息失败:', error);
    res.status(500).json({ code: 500, error: '服务器错误' });
  }
});

// ========== 动物类型管理 ==========

// 获取所有动物类型
router.get('/animal-types', (req, res) => {
  db.query('SELECT * FROM animal_types ORDER BY id', (err, results) => {
    if (err) {
      console.error('获取动物类型失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    res.status(200).json({ code: 200, data: results });
  });
});

// 添加动物类型
router.post('/animal-types', (req, res) => {
  const { type, name, icon, description } = req.body;

  if (!type || !name) {
    return res.status(400).json({ code: 400, error: '类型和名称不能为空' });
  }

  db.query(
    'INSERT INTO animal_types (type, name, icon, description) VALUES (?, ?, ?, ?)',
    [type, name, icon || '', description || ''],
    (err, results) => {
      if (err) {
        console.error('添加动物类型失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ 
        code: 200,
        message: '动物类型添加成功',
        data: { id: results.insertId }
      });
    }
  );
});

// 更新动物类型
router.put('/animal-types/:id', (req, res) => {
  const { id } = req.params;
  const { type, name, icon, description } = req.body;

  if (!type || !name) {
    return res.status(400).json({ code: 400, error: '类型和名称不能为空' });
  }

  db.query(
    'UPDATE animal_types SET type = ?, name = ?, icon = ?, description = ? WHERE id = ?',
    [type, name, icon || '', description || '', id],
    (err, results) => {
      if (err) {
        console.error('更新动物类型失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ code: 404, error: '动物类型不存在' });
      }
      res.status(200).json({ code: 200, message: '动物类型更新成功' });
    }
  );
});

// 删除动物类型
router.delete('/animal-types/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM animal_types WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('删除动物类型失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ code: 404, error: '动物类型不存在' });
    }
    res.status(200).json({ code: 200, message: '动物类型删除成功' });
  });
});

// ========== 系统声音管理（按动物类型） ==========

// 获取所有系统声音（按动物类型分类）
router.get('/system-sounds', (req, res) => {
  db.query(
    `SELECT s.*, u.username 
     FROM sounds s
     LEFT JOIN users u ON s.user_id = u.id
     WHERE s.user_id IS NULL
     ORDER BY s.animal_type, s.id`,
    (err, results) => {
      if (err) {
        console.error('获取系统声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 注意：添加和更新系统声音的路由已移至 admin-sound-upload.js
// 该文件在 body-parser 之前加载，避免 multipart 请求被错误解析为 JSON

// 删除系统声音
router.delete('/system-sounds/:id', (req, res) => {
  const { id } = req.params;

  // 先获取声音文件路径
  db.query('SELECT sound_url FROM sounds WHERE id = ? AND user_id IS NULL', [id], (err, results) => {
    if (err) {
      console.error('获取系统声音失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    
    if (results.length > 0 && results[0].sound_url) {
      const soundPath = path.join(__dirname, '..', results[0].sound_url);
      if (fs.existsSync(soundPath)) {
        try {
          fs.unlinkSync(soundPath);
        } catch (e) {
          console.error('删除声音文件失败:', e);
        }
      }
    }

    db.query(
      'DELETE FROM sounds WHERE id = ? AND user_id IS NULL',
      [id],
      (err, results) => {
        if (err) {
          console.error('删除系统声音失败:', err);
          return res.status(500).json({ code: 500, error: '服务器错误' });
        }
        if (results.affectedRows === 0) {
          return res.status(404).json({ code: 404, error: '系统声音不存在或无权限删除' });
        }
        res.status(200).json({ code: 200, message: '系统声音删除成功' });
      }
    );
  });
});

module.exports = router;
