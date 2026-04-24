const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const captcha = require('../utils/captcha');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const avatarsDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, avatarsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
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

const router = express.Router();

// 注册
router.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  
  // 先检查用户名是否已存在
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, usernameResults) => {
    if (err) return res.status(500).json({ error: '服务器错误' });
    if (usernameResults.length > 0) return res.status(400).json({ error: '用户名已被注册' });
    
    // 再检查邮箱是否已存在
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, emailResults) => {
      if (err) return res.status(500).json({ error: '服务器错误' });
      if (emailResults.length > 0) return res.status(400).json({ error: '邮箱已被注册' });
      
      // 密码加密
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      // 插入用户数据，设置默认头像
      const defaultAvatar = '/uploads/avatars/default-avatar.svg';
      db.query(
        'INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, defaultAvatar],
        (err, results) => {
          if (err) return res.status(500).json({ error: '服务器错误' });

          // 生成token
          const token = jwt.sign({ id: results.insertId }, 'secret_key', { expiresIn: '1d' });

          res.status(201).json({ message: '注册成功', token, user: { id: results.insertId, username, email, avatar: defaultAvatar } });
        }
      );
    });
  });
});

// 登录
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // 查找用户（支持邮箱或用户名登录）
  db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, email], (err, results) => {
    if (err) return res.status(500).json({ error: '服务器错误' });
    if (results.length === 0) return res.status(400).json({ error: '用户名/邮箱或密码错误' });

    const user = results[0];

    // 验证密码
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: '用户名/邮箱或密码错误' });
    }

    // 生成token
    const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, 'secret_key', { expiresIn: '1d' });

    res.status(200).json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        is_admin: user.is_admin
      }
    });
  });
});

// 管理员登录（后台专用）
router.post('/admin/login', (req, res) => {
  const { username, password, captchaToken, captchaCode } = req.body;

  if (!captchaToken || !captchaCode) {
    return res.status(400).json({ error: '缺少验证码参数' });
  }

  if (!captcha.verifyCaptcha(captchaToken, captchaCode)) {
    return res.status(400).json({ error: '验证码错误或已过期，请重新输入' });
  }

  // 查找用户（支持用户名或邮箱登录）
  db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], (err, results) => {
    if (err) return res.status(500).json({ error: '服务器错误' });
    if (results.length === 0) return res.status(400).json({ error: '用户名或密码错误' });

    const user = results[0];

    // 验证密码
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ error: '用户名或密码错误' });
    }

    // 验证是否为管理员
    if (!user.is_admin) {
      return res.status(403).json({ error: '无管理员权限' });
    }

    // 生成token
    const token = jwt.sign({ id: user.id, is_admin: true }, 'secret_key', { expiresIn: '1d' });

    res.status(200).json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        is_admin: true
      }
    });
  });
});

// 验证token
router.get('/validate', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权', valid: false });
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    // 检查用户是否存在
    db.query('SELECT id FROM users WHERE id = ?', [decoded.id], (err, results) => {
      if (err) return res.status(500).json({ error: '服务器错误', valid: false });
      if (results.length === 0) return res.status(404).json({ error: '用户不存在', valid: false });
      res.status(200).json({ valid: true, userId: decoded.id });
    });
  } catch (error) {
    res.status(401).json({ error: '无效的token', valid: false });
  }
});

// 获取用户信息
router.get('/user', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    db.query('SELECT id, username, email, avatar, nickname, wechat_nickname, wechat_avatar, wechat_openid FROM users WHERE id = ?', [decoded.id], (err, results) => {
      if (err) return res.status(500).json({ error: '服务器错误' });
      if (results.length === 0) return res.status(404).json({ error: '用户不存在' });
      
      const user = results[0];
      // 合并微信信息
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar || user.wechat_avatar,
        nickname: user.nickname || user.wechat_nickname,
        isWechatBound: !!user.wechat_openid
      };
      
      res.status(200).json({ user: userResponse });
    });
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// 获取用户统计数据
router.get('/user/stats', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });

  try {
    const decoded = jwt.verify(token, 'secret_key');
    const userId = decoded.id;

    // 使用子查询获取用户统计数据（规范化设计）
    db.query(
      `SELECT
        (SELECT COUNT(*) FROM posts WHERE user_id = ?) as posts_count,
        (SELECT COUNT(*) FROM sounds WHERE user_id = ?) as sounds_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = ?) as likes_received_count,
        (SELECT COUNT(*) FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.user_id = ?) as comments_received_count`,
      [userId, userId, userId, userId, userId, userId],
      (err, results) => {
        if (err) {
          console.error('获取用户统计失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }
        if (results.length === 0) {
          return res.status(404).json({ error: '用户不存在' });
        }

        const stats = results[0];
        res.status(200).json({
          stats: {
            posts: stats.posts_count,
            sounds: stats.sounds_count,
            likes: stats.likes_received_count,
            comments: stats.comments_received_count,
            following_count: stats.following_count,
            follower_count: stats.followers_count
          }
        });
      }
    );
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// 上传头像
router.post('/avatar', upload.single('avatar'), (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const userId = decoded.id;
    
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的头像' });
    }
    
    // 先查询用户原头像
    db.query('SELECT avatar FROM users WHERE id = ?', [userId], (err, results) => {
      if (err) {
        console.error('查询原头像失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      
      // 删除原头像文件
      if (results[0] && results[0].avatar) {
        const oldAvatarPath = path.join(__dirname, '..', results[0].avatar);
        if (fs.existsSync(oldAvatarPath)) {
          try {
            fs.unlinkSync(oldAvatarPath);
            console.log('原头像已删除:', oldAvatarPath);
          } catch (unlinkErr) {
            console.error('删除原头像失败:', unlinkErr);
          }
        }
      }
      
      const avatarUrl = '/uploads/avatars/' + req.file.filename;
      
      // 更新用户头像
      db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId], (err, results) => {
        if (err) {
          console.error('更新头像失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }
        
        res.status(200).json({ message: '头像上传成功', avatar: avatarUrl });
      });
    });
  } catch (error) {
    console.error('头像上传错误:', error);
    res.status(401).json({ error: '无效的token' });
  }
});

// 搜索用户
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: '请输入搜索关键词' });
  
  db.query(
    'SELECT id, username, email, avatar FROM users WHERE username LIKE ? OR email LIKE ? ORDER BY created_at DESC',
    [`%${q}%`, `%${q}%`],
    (err, results) => {
      if (err) return res.status(500).json({ error: '服务器错误' });
      res.status(200).json({ users: results });
    }
  );
});

// 获取用户公开信息（不需要token）
router.get('/user/:id', (req, res) => {
  const { id } = req.params;
  
  // 获取用户基本信息
  db.query('SELECT id, username, email, avatar FROM users WHERE id = ?', [id], (err, userResults) => {
    if (err) return res.status(500).json({ error: '服务器错误' });
    if (userResults.length === 0) return res.status(404).json({ error: '用户不存在' });
    
    const user = userResults[0];
    
    // 使用子查询获取用户统计数据（规范化设计）
    const getUserStats = new Promise((resolve, reject) => {
      db.query(
        `SELECT
          (SELECT COUNT(*) FROM posts WHERE user_id = ?) as posts_count,
          (SELECT COUNT(*) FROM sounds WHERE user_id = ?) as sounds_count,
          (SELECT COUNT(*) FROM follows WHERE following_id = ?) as followers_count,
          (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
          (SELECT COUNT(*) FROM likes l JOIN posts p ON l.post_id = p.id WHERE p.user_id = ?) as likes_received_count,
          (SELECT COUNT(*) FROM comments c JOIN posts p ON c.post_id = p.id WHERE p.user_id = ?) as comments_received_count`,
        [id, id, id, id, id, id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0] || { posts_count: 0, sounds_count: 0, likes_received_count: 0, comments_received_count: 0, followers_count: 0, following_count: 0 });
        }
      );
    });
    
    // 获取用户的公开音频
    const getUserAudios = new Promise((resolve, reject) => {
      db.query(
        'SELECT id, animal_type, emotion, sound_url, duration, created_at FROM sounds WHERE user_id = ? AND visible = 1 ORDER BY created_at DESC',
        [id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
    
    // 获取用户的帖子（使用子查询获取统计数据）
    const getUserPosts = new Promise((resolve, reject) => {
      db.query(
        `SELECT p.id, p.content, p.image_url, p.created_at,
                (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count
         FROM posts p WHERE p.user_id = ? ORDER BY p.created_at DESC LIMIT 20`,
        [id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
    
    // 获取用户的评论
    const getUserComments = new Promise((resolve, reject) => {
      db.query(
        `SELECT c.id, c.content, c.created_at, p.id as post_id, p.content as post_content
         FROM comments c 
         LEFT JOIN posts p ON c.post_id = p.id 
         WHERE c.user_id = ? ORDER BY c.created_at DESC LIMIT 20`,
        [id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });
    
    // 并行获取所有数据
    Promise.all([getUserStats, getUserAudios, getUserPosts, getUserComments])
      .then(([stats, audios, userPosts, userComments]) => {
        res.status(200).json({
          user: {
            ...user,
            posts: stats.posts_count,
            sounds: stats.sounds_count,
            likes: stats.likes_received_count,
            comments: stats.comments_received_count,
            follower_count: stats.followers_count,
            following_count: stats.following_count
          },
          audios,
          userPosts,
          userComments
        });
      })
      .catch(err => {
        console.error('获取用户公开信息失败:', err);
        res.status(500).json({ error: '服务器错误' });
      });
  });
});

module.exports = router;