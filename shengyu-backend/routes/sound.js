const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const fs = require('fs');
const { cacheMiddleware, clearCache, CACHE_KEYS, CACHE_TTL } = require('../middleware/cache');

const router = express.Router();

// 确保上传目录存在
const soundsDir = path.join(__dirname, '../uploads/sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, soundsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: function (req, file, cb) {
    // 只允许上传音频文件
    const filetypes = /wav|mp3|ogg|aac|flac/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传音频文件'));
    }
  }
});

// 上传声音
router.post('/upload', upload.single('sound'), (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });

  try {
    const decoded = jwt.verify(token, 'secret_key');
    const { animal_type, emotion, duration, visible, submit_for_review } = req.body;

    if (!req.file) return res.status(400).json({ error: '请选择文件' });

    const soundUrl = `/uploads/sounds/${req.file.filename}`;
    const isVisible = visible === 'true' || visible === 1 || visible === true ? 1 : 0;
    const isSubmitForReview = submit_for_review === 'true' || submit_for_review === 1 || submit_for_review === true ? 1 : 0;

    db.query(
      'INSERT INTO sounds (user_id, animal_type, emotion, sound_url, duration, visible, review_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [decoded.id, animal_type, emotion, soundUrl, duration, isVisible, isSubmitForReview ? 'pending' : 'none'],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        // 清除声音相关缓存
        clearCache('sounds:popular');
        clearCache(`*sounds:animal*${animal_type}*`);
        clearCache(`*user*${decoded.id}*`);
        res.status(201).json({ message: '上传成功', sound_id: results.insertId });
      }
    );
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// 获取热门动物声音（添加缓存）
router.get('/popular',
  cacheMiddleware(CACHE_KEYS.POPULAR_SOUNDS, CACHE_TTL.POPULAR_SOUNDS),
  (req, res) => {
    db.query(
      'SELECT * FROM sounds ORDER BY created_at DESC LIMIT 10',
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        res.status(200).json({ sounds: results });
      }
    );
  }
);

// 获取所有动物类型（兼容旧版前端 - 返回数组格式，添加缓存）
router.get('/animal-types',
  cacheMiddleware('animal:types:', 600), // 缓存10分钟
  (req, res) => {
    // 获取所有启用的动物类型
    db.query(
      'SELECT id, type, name, icon, description, category, sort_order FROM animal_types WHERE is_active = 1 ORDER BY sort_order ASC, id ASC',
      (err, results) => {
        if (err) {
          console.error('获取动物类型失败:', err);
          return res.status(500).json({ code: 500, error: '服务器错误' });
        }

        // 返回数组格式（兼容旧版前端）
        const animals = results.map(item => ({
          id: item.id,
          type: item.type,
          name: item.name,
          icon: item.icon || '🐾',
          description: item.description,
          category: item.category || 'other'
        }));

        res.status(200).json({ code: 200, data: animals });
      }
    );
  }
);

// 获取所有动物类型（按分类分组 - 新版格式）
router.get('/animal-types-grouped', (req, res) => {
  // 首先获取所有启用的分类
  db.query(
    'SELECT name, display_name FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, id ASC',
    (err, categoryResults) => {
      if (err) {
        console.error('获取分类失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      // 然后获取所有启用的动物类型
      db.query(
        'SELECT id, type, name, icon, description, category, sort_order FROM animal_types WHERE is_active = 1 ORDER BY sort_order ASC, id ASC',
        (err, results) => {
          if (err) {
            console.error('获取动物类型失败:', err);
            return res.status(500).json({ code: 500, error: '服务器错误' });
          }

          // 按分类分组
          const categories = {};

          // 先初始化所有分类（即使为空）
          categoryResults.forEach(cat => {
            categories[cat.name] = {
              display_name: cat.display_name,
              items: []
            };
          });

          // 将动物类型放入对应分类
          results.forEach(item => {
            const category = item.category || 'other';
            if (categories[category]) {
              categories[category].items.push({
                id: item.id,
                type: item.type,
                name: item.name,
                icon: item.icon || '🐾',
                description: item.description,
                category: item.category
              });
            }
          });

          res.status(200).json({ code: 200, data: categories });
        }
      );
    }
  );
});

// 获取所有分类
router.get('/categories', (req, res) => {
  db.query(
    'SELECT DISTINCT category FROM animal_types WHERE is_active = 1 ORDER BY category ASC',
    (err, results) => {
      if (err) {
        console.error('获取分类失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      const categories = results.map(r => r.category).filter(c => c);
      res.status(200).json({ code: 200, data: categories });
    }
  );
});

// 根据动物类型获取声音（只返回官方音频，用于声鉴页面展示，添加缓存）
router.get('/by-animal/:animal_type',
  cacheMiddleware('sounds:animal:', 300), // 缓存5分钟
  (req, res) => {
    const { animal_type } = req.params;
    db.query(
      `SELECT s.*, u.username 
       FROM sounds s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.animal_type = ? AND s.is_official = 1
       ORDER BY s.created_at DESC`,
      [animal_type],
      (err, results) => {
        if (err) {
          console.error('获取声音失败:', err);
          return res.status(500).json({ code: 500, error: '服务器错误' });
        }
        res.status(200).json({ code: 200, data: results });
      }
    );
  }
);

// 搜索声音
router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: '请输入搜索关键词' });
  
  db.query(
    'SELECT * FROM sounds WHERE animal_type LIKE ? OR emotion LIKE ? ORDER BY created_at DESC',
    [`%${q}%`, `%${q}%`],
    (err, results) => {
      if (err) return res.status(500).json({ error: '服务器错误' });
      res.status(200).json({ sounds: results });
    }
  );
});

// 获取声音详情（添加缓存）
router.get('/detail/:id',
  cacheMiddleware('sound:detail:', 300), // 缓存5分钟
  (req, res) => {
    const { id } = req.params;
    
    db.query(
      `
        SELECT s.*, u.username
        FROM sounds s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
      `,
      [id],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        if (results.length === 0) return res.status(404).json({ error: '声音不存在' });
        res.status(200).json({ code: 200, data: results[0] });
      }
    );
  }
);

// 获取用户自己的声音列表
router.get('/my', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权' });
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const userId = decoded.id;
    
    db.query(
      'SELECT * FROM sounds WHERE user_id = ? ORDER BY created_at DESC',
      [userId],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        res.status(200).json({ sounds: results });
      }
    );
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// 切换声音的可见性
router.put('/:id/visibility', (req, res) => {
  const { id } = req.params;
  const { visible } = req.body;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: '未授权' });
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const userId = decoded.id;
    
    // 先检查声音是否存在且属于当前用户
    db.query(
      'SELECT * FROM sounds WHERE id = ? AND user_id = ?',
      [id, userId],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        if (results.length === 0) return res.status(404).json({ error: '声音不存在或无权限' });
        
        // 更新可见性
        db.query(
          'UPDATE sounds SET visible = ? WHERE id = ?',
          [visible, id],
          (err, results) => {
            if (err) return res.status(500).json({ error: '服务器错误' });
            res.status(200).json({ message: '更新成功', visible });
          }
        );
      }
    );
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// 删除声音
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: '未授权' });
  
  try {
    const decoded = jwt.verify(token, 'secret_key');
    const userId = decoded.id;
    
    // 先检查声音是否存在且属于当前用户
    db.query(
      'SELECT * FROM sounds WHERE id = ? AND user_id = ?',
      [id, userId],
      (err, results) => {
        if (err) return res.status(500).json({ error: '服务器错误' });
        if (results.length === 0) return res.status(404).json({ error: '声音不存在或无权限' });
        
        const sound = results[0];
        
        // 删除文件
        const fs = require('fs');
        const soundPath = path.join(__dirname, '..', sound.sound_url);
        console.log('尝试删除音频文件:', soundPath);
        if (fs.existsSync(soundPath)) {
          fs.unlinkSync(soundPath);
          console.log('音频文件已删除:', soundPath);
        } else {
          console.log('音频文件不存在:', soundPath);
        }
        
        // 先删除关联的帖子引用
        db.query(
          'UPDATE posts SET sound_id = NULL WHERE sound_id = ?',
          [id],
          (err) => {
            if (err) console.error('更新帖子引用失败:', err);
            
            // 删除数据库记录
            db.query(
              'DELETE FROM sounds WHERE id = ?',
              [id],
              (err, results) => {
                if (err) return res.status(500).json({ error: '服务器错误' });
                res.status(200).json({ message: '删除成功' });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(401).json({ error: '无效的token' });
  }
});

// ========== 管理接口 ==========

// 获取所有动物类型（管理用，包含所有字段）
router.get('/admin/animal-types', (req, res) => {
  db.query(
    'SELECT * FROM animal_types ORDER BY category ASC, sort_order ASC, id ASC',
    (err, results) => {
      if (err) {
        console.error('获取动物类型失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 添加动物类型
router.post('/admin/animal-types', (req, res) => {
  const { type, name, icon, description, category, sort_order } = req.body;
  
  if (!type || !name) {
    return res.status(400).json({ error: '类型和名称不能为空' });
  }
  
  db.query(
    'INSERT INTO animal_types (type, name, icon, description, category, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    [type, name, icon || '🐾', description || '', category || 'other', sort_order || 0],
    (err, results) => {
      if (err) {
        console.error('添加动物类型失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.status(201).json({ message: '添加成功', id: results.insertId });
    }
  );
});

// 更新动物类型
router.put('/admin/animal-types/:id', (req, res) => {
  const { id } = req.params;
  const { type, name, icon, description, category, sort_order, is_active } = req.body;
  
  db.query(
    'UPDATE animal_types SET type = ?, name = ?, icon = ?, description = ?, category = ?, sort_order = ?, is_active = ? WHERE id = ?',
    [type, name, icon, description, category, sort_order, is_active, id],
    (err, results) => {
      if (err) {
        console.error('更新动物类型失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: '动物类型不存在' });
      }
      res.status(200).json({ message: '更新成功' });
    }
  );
});

// 删除动物类型
router.delete('/admin/animal-types/:id', (req, res) => {
  const { id } = req.params;
  
  db.query(
    'DELETE FROM animal_types WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('删除动物类型失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: '动物类型不存在' });
      }
      res.status(200).json({ message: '删除成功' });
    }
  );
});

// ========== 分类管理接口 ==========

// 获取所有分类（管理用）
router.get('/admin/categories', (req, res) => {
  db.query(
    'SELECT * FROM categories ORDER BY sort_order ASC, id ASC',
    (err, results) => {
      if (err) {
        console.error('获取分类失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 添加新分类
router.post('/admin/categories', (req, res) => {
  const { name, display_name, sort_order } = req.body;

  if (!name || !display_name) {
    return res.status(400).json({ error: '分类标识和显示名称不能为空' });
  }

  // 验证分类名称格式
  const validName = /^[a-zA-Z0-9_]+$/.test(name);
  if (!validName) {
    return res.status(400).json({ error: '分类标识只能包含字母、数字和下划线' });
  }

  db.query(
    'INSERT INTO categories (name, display_name, sort_order) VALUES (?, ?, ?)',
    [name, display_name, sort_order || 0],
    (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: '分类标识已存在' });
        }
        console.error('添加分类失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.status(201).json({ message: '分类添加成功', id: results.insertId });
    }
  );
});

// 更新分类
router.put('/admin/categories/:id', (req, res) => {
  const { id } = req.params;
  const { display_name, sort_order, is_active } = req.body;

  db.query(
    'UPDATE categories SET display_name = ?, sort_order = ?, is_active = ? WHERE id = ?',
    [display_name, sort_order, is_active, id],
    (err, results) => {
      if (err) {
        console.error('更新分类失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: '分类不存在' });
      }
      res.status(200).json({ message: '分类更新成功' });
    }
  );
});

// 删除分类
router.delete('/admin/categories/:id', (req, res) => {
  const { id } = req.params;

  // 首先获取分类名称
  db.query(
    'SELECT name FROM categories WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('获取分类失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: '分类不存在' });
      }

      const categoryName = results[0].name;

      // 将该分类下的动物类型移动到 'other' 分类
      db.query(
        'UPDATE animal_types SET category = ? WHERE category = ?',
        ['other', categoryName],
        (err) => {
          if (err) {
            console.error('更新动物类型分类失败:', err);
            return res.status(500).json({ error: '服务器错误' });
          }

          // 删除分类
          db.query(
            'DELETE FROM categories WHERE id = ?',
            [id],
            (err, results) => {
              if (err) {
                console.error('删除分类失败:', err);
                return res.status(500).json({ error: '服务器错误' });
              }
              res.status(200).json({ message: '分类删除成功，相关动物类型已移动到"其他动物"' });
            }
          );
        }
      );
    }
  );
});

// ========== 系统声音管理接口 ==========

// 获取所有系统声音（管理用）
router.get('/admin/system-sounds', (req, res) => {
  db.query(
    `SELECT ss.*, at.name as type_name, at.category as type_category
     FROM system_sounds ss
     LEFT JOIN animal_types at ON ss.type_id = at.id
     ORDER BY ss.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error('获取系统声音失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 上传系统声音
router.post('/admin/system-sounds', upload.single('sound'), (req, res) => {
  const { type_id, emotion, duration, description } = req.body;

  if (!type_id || !emotion) {
    return res.status(400).json({ error: '类型和情绪不能为空' });
  }

  if (!req.file) {
    return res.status(400).json({ error: '请选择音频文件' });
  }

  const soundUrl = `/uploads/sounds/${req.file.filename}`;

  db.query(
    'INSERT INTO system_sounds (type_id, emotion, sound_url, duration, description) VALUES (?, ?, ?, ?, ?)',
    [type_id, emotion, soundUrl, duration || 0, description || ''],
    (err, results) => {
      if (err) {
        console.error('上传系统声音失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.status(201).json({ message: '系统声音上传成功', id: results.insertId });
    }
  );
});

// 更新系统声音
router.put('/admin/system-sounds/:id', (req, res) => {
  const { id } = req.params;
  const { type_id, emotion, duration, description, is_active } = req.body;

  db.query(
    'UPDATE system_sounds SET type_id = ?, emotion = ?, duration = ?, description = ?, is_active = ? WHERE id = ?',
    [type_id, emotion, duration, description, is_active, id],
    (err, results) => {
      if (err) {
        console.error('更新系统声音失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: '系统声音不存在' });
      }
      res.status(200).json({ message: '系统声音更新成功' });
    }
  );
});

// 删除系统声音
router.delete('/admin/system-sounds/:id', (req, res) => {
  const { id } = req.params;

  // 先获取声音文件路径
  db.query(
    'SELECT sound_url FROM system_sounds WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('获取系统声音失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: '系统声音不存在' });
      }

      const soundUrl = results[0].sound_url;

      // 删除文件
      const fs = require('fs');
      const soundPath = path.join(__dirname, '..', soundUrl);
      if (fs.existsSync(soundPath)) {
        fs.unlinkSync(soundPath);
      }

      // 删除数据库记录
      db.query(
        'DELETE FROM system_sounds WHERE id = ?',
        [id],
        (err, results) => {
          if (err) {
            console.error('删除系统声音失败:', err);
            return res.status(500).json({ error: '服务器错误' });
          }
          res.status(200).json({ message: '系统声音删除成功' });
        }
      );
    }
  );
});

// ========== 用户声音管理接口 ==========

// 获取所有用户声音（管理用）
router.get('/admin/user-sounds', (req, res) => {
  db.query(
    `SELECT s.*, u.username
     FROM sounds s
     LEFT JOIN users u ON s.user_id = u.id
     ORDER BY s.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error('获取用户声音失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 审核用户声音
router.put('/admin/user-sounds/:id/review', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: '无效的审核状态' });
  }

  db.query(
    'UPDATE sounds SET review_status = ? WHERE id = ?',
    [status, id],
    (err, results) => {
      if (err) {
        console.error('审核声音失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: '声音不存在' });
      }
      res.status(200).json({ message: '审核状态更新成功' });
    }
  );
});

// 删除用户声音（管理用）
router.delete('/admin/user-sounds/:id', (req, res) => {
  const { id } = req.params;

  // 先获取声音文件路径
  db.query(
    'SELECT sound_url FROM sounds WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('获取声音失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: '声音不存在' });
      }

      const soundUrl = results[0].sound_url;

      // 删除文件
      const fs = require('fs');
      const soundPath = path.join(__dirname, '..', soundUrl);
      if (fs.existsSync(soundPath)) {
        fs.unlinkSync(soundPath);
      }

      // 先更新关联的帖子
      db.query(
        'UPDATE posts SET sound_id = NULL WHERE sound_id = ?',
        [id],
        (err) => {
          if (err) console.error('更新帖子引用失败:', err);

          // 删除数据库记录
          db.query(
            'DELETE FROM sounds WHERE id = ?',
            [id],
            (err, results) => {
              if (err) {
                console.error('删除声音失败:', err);
                return res.status(500).json({ error: '服务器错误' });
              }
              res.status(200).json({ message: '声音删除成功' });
            }
          );
        }
      );
    }
  );
});

// ========== 前端接口：获取系统声音 ==========

// 根据动物类型获取系统声音（用于声鉴页面）
router.get('/system/by-type/:type_id', (req, res) => {
  const { type_id } = req.params;

  db.query(
    `SELECT ss.*, at.name as type_name, at.icon
     FROM system_sounds ss
     LEFT JOIN animal_types at ON ss.type_id = at.id
     WHERE ss.type_id = ? AND ss.is_active = 1
     ORDER BY ss.created_at DESC`,
    [type_id],
    (err, results) => {
      if (err) {
        console.error('获取系统声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 获取所有启用的系统声音（按类型分组）
router.get('/system/all', (req, res) => {
  db.query(
    `SELECT ss.*, at.name as type_name, at.icon, at.category
     FROM system_sounds ss
     LEFT JOIN animal_types at ON ss.type_id = at.id
     WHERE ss.is_active = 1 AND at.is_active = 1
     ORDER BY at.sort_order ASC, ss.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error('获取系统声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

module.exports = router;