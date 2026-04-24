const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { authenticateToken, optionalAuth, sanitizeInput } = require('../middleware/security');

// 确保上传目录存在
const soundsDir = path.join(__dirname, '../uploads/sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
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

// 上传声音
router.post('/upload', authenticateToken, upload.single('sound'), (req, res) => {
  const userId = req.user.id;
  const { animal_type, emotion, duration } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: '请选择要上传的音频文件' });
  }

  if (!animal_type || !emotion) {
    // 删除上传的文件
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: '请填写动物类型和情绪' });
  }

  const soundUrl = '/uploads/sounds/' + req.file.filename;

  db.query(
    'INSERT INTO sounds (user_id, animal_type, emotion, sound_url, duration, review_status) VALUES (?, ?, ?, ?, ?, "pending")',
    [userId, animal_type, emotion, soundUrl, duration || 0],
    (err, results) => {
      if (err) {
        console.error('上传声音失败:', err);
        // 删除上传的文件
        fs.unlinkSync(req.file.path);
        return res.status(500).json({ error: '服务器错误' });
      }

      res.status(201).json({
        message: '上传成功，等待审核',
        sound: {
          id: results.insertId,
          animal_type,
          emotion,
          sound_url: soundUrl,
          duration: duration || 0
        }
      });
    }
  );
});

// 获取热门声音
router.get('/popular', (req, res) => {
  const { limit = 10 } = req.query;
  const limitNum = Math.min(parseInt(limit), 20);

  if (isNaN(limitNum) || limitNum < 1) {
    return res.status(400).json({ code: 400, error: '无效的参数' });
  }

  db.query(
    `SELECT s.*, u.username
     FROM sounds s
     LEFT JOIN users u ON s.user_id = u.id
     WHERE s.visible = 1 AND s.review_status = 'approved'
     ORDER BY s.created_at DESC
     LIMIT ?`,
    [limitNum],
    (err, results) => {
      if (err) {
        console.error('获取热门声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 获取动物类型列表
router.get('/animal-types', (req, res) => {
  db.query(
    'SELECT * FROM animal_types WHERE is_active = 1 ORDER BY sort_order, id',
    (err, results) => {
      if (err) {
        console.error('获取动物类型失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 获取按分类分组的动物类型
router.get('/animal-types-grouped', (req, res) => {
  db.query(
    `SELECT category, 
            JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', id,
                'type', type,
                'name', name,
                'icon', icon,
                'description', description
              )
            ) as types
     FROM animal_types 
     WHERE is_active = 1 
     GROUP BY category 
     ORDER BY MIN(sort_order)`,
    (err, results) => {
      if (err) {
        console.error('获取分组动物类型失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      // 解析JSON字符串
      try {
        const grouped = results.map(row => ({
          category: row.category,
          types: typeof row.types === 'string' ? JSON.parse(row.types) : row.types
        }));
        res.status(200).json({ code: 200, data: grouped });
      } catch (parseErr) {
        console.error('解析JSON失败:', parseErr);
        res.status(200).json({ code: 200, data: [] });
      }
    }
  );
});

// 按动物类型获取声音
router.get('/by-animal/:type', (req, res) => {
  const { type } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50);
  const offset = (pageNum - 1) * limitNum;

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ code: 400, error: '无效的分页参数' });
  }

  db.query(
    `SELECT s.*, u.username
     FROM sounds s
     LEFT JOIN users u ON s.user_id = u.id
     WHERE s.animal_type = ? AND s.visible = 1 AND s.review_status = 'approved'
     ORDER BY s.is_official DESC, s.created_at DESC
     LIMIT ? OFFSET ?`,
    [type, limitNum, offset],
    (err, results) => {
      if (err) {
        console.error('获取声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 搜索声音
router.get('/search', (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ code: 400, error: '请输入搜索关键词' });
  }

  // 限制搜索关键词长度
  if (q.length > 50) {
    return res.status(400).json({ code: 400, error: '搜索关键词过长' });
  }

  const searchPattern = `%${q}%`;

  db.query(
    `SELECT s.*, u.username
     FROM sounds s
     LEFT JOIN users u ON s.user_id = u.id
     WHERE (s.animal_type LIKE ? OR s.emotion LIKE ?)
       AND s.visible = 1 AND s.review_status = 'approved'
     ORDER BY s.created_at DESC
     LIMIT 50`,
    [searchPattern, searchPattern],
    (err, results) => {
      if (err) {
        console.error('搜索声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 获取声音详情
router.get('/detail/:id', optionalAuth, (req, res) => {
  const soundId = req.params.id;

  db.query(
    `SELECT s.*, u.username, u.avatar
     FROM sounds s
     LEFT JOIN users u ON s.user_id = u.id
     WHERE s.id = ?`,
    [soundId],
    (err, results) => {
      if (err) {
        console.error('获取声音详情失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      if (results.length === 0) {
        return res.status(404).json({ code: 404, error: '声音不存在' });
      }

      const sound = results[0];

      // 检查权限
      if (!sound.visible && sound.user_id !== req.user?.id && !req.user?.is_admin) {
        return res.status(403).json({ code: 403, error: '无权访问此声音' });
      }

      res.status(200).json({ code: 200, data: sound });
    }
  );
});

// 获取我的声音
router.get('/my', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50);
  const offset = (pageNum - 1) * limitNum;

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({ code: 400, error: '无效的分页参数' });
  }

  db.query(
    `SELECT s.*, u.username
     FROM sounds s
     LEFT JOIN users u ON s.user_id = u.id
     WHERE s.user_id = ?
     ORDER BY s.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limitNum, offset],
    (err, results) => {
      if (err) {
        console.error('获取我的声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 切换声音可见性
router.put('/:id/visibility', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const soundId = req.params.id;
  const { visible } = req.body;

  // 检查声音是否属于当前用户
  db.query(
    'SELECT user_id FROM sounds WHERE id = ?',
    [soundId],
    (err, results) => {
      if (err) {
        console.error('检查声音失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: '声音不存在' });
      }

      if (results[0].user_id !== userId && !req.user.is_admin) {
        return res.status(403).json({ error: '无权修改此声音' });
      }

      db.query(
        'UPDATE sounds SET visible = ? WHERE id = ?',
        [visible ? 1 : 0, soundId],
        (err) => {
          if (err) {
            console.error('更新可见性失败:', err);
            return res.status(500).json({ error: '服务器错误' });
          }

          res.status(200).json({
            message: visible ? '声音已设为公开' : '声音已设为私有',
            visible: !!visible
          });
        }
      );
    }
  );
});

// 删除声音
router.delete('/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const soundId = req.params.id;

  // 获取声音信息
  db.query(
    'SELECT user_id, sound_url FROM sounds WHERE id = ?',
    [soundId],
    (err, results) => {
      if (err) {
        console.error('获取声音失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: '声音不存在' });
      }

      const sound = results[0];

      // 检查权限
      if (sound.user_id !== userId && !req.user.is_admin) {
        return res.status(403).json({ error: '无权删除此声音' });
      }

      // 删除文件
      if (sound.sound_url) {
        const soundPath = path.join(__dirname, '..', sound.sound_url);
        if (fs.existsSync(soundPath)) {
          try {
            fs.unlinkSync(soundPath);
          } catch (e) {
            console.error('删除声音文件失败:', e);
          }
        }
      }

      // 删除数据库记录
      db.query('DELETE FROM sounds WHERE id = ?', [soundId], (err) => {
        if (err) {
          console.error('删除声音失败:', err);
          return res.status(500).json({ error: '服务器错误' });
        }

        res.status(200).json({ message: '删除成功' });
      });
    }
  );
});

// ========== 管理后台接口 ==========

// 获取分类列表（管理后台）
router.get('/admin/categories', authenticateToken, (req, res) => {
  db.query('SELECT * FROM categories ORDER BY sort_order', (err, results) => {
    if (err) {
      console.error('获取分类失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    res.status(200).json({ code: 200, data: results });
  });
});

// 添加分类
router.post('/admin/categories', authenticateToken, (req, res) => {
  const { name, display_name, sort_order } = req.body;
  db.query(
    'INSERT INTO categories (name, display_name, sort_order) VALUES (?, ?, ?)',
    [name, display_name, sort_order || 0],
    (err, results) => {
      if (err) {
        console.error('添加分类失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, message: '添加成功', data: { id: results.insertId } });
    }
  );
});

// 更新分类
router.put('/admin/categories/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, display_name, sort_order } = req.body;
  db.query(
    'UPDATE categories SET name = ?, display_name = ?, sort_order = ? WHERE id = ?',
    [name, display_name, sort_order, id],
    (err) => {
      if (err) {
        console.error('更新分类失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, message: '更新成功' });
    }
  );
});

// 删除分类
router.delete('/admin/categories/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM categories WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('删除分类失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    res.status(200).json({ code: 200, message: '删除成功' });
  });
});

// 获取动物类型列表（管理后台）
router.get('/admin/animal-types', authenticateToken, (req, res) => {
  db.query('SELECT * FROM animal_types ORDER BY sort_order', (err, results) => {
    if (err) {
      console.error('获取动物类型失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    res.status(200).json({ code: 200, data: results });
  });
});

// 添加动物类型
router.post('/admin/animal-types', authenticateToken, (req, res) => {
  const { type, name, icon, category, description } = req.body;
  db.query(
    'INSERT INTO animal_types (type, name, icon, category, description) VALUES (?, ?, ?, ?, ?)',
    [type, name, icon, category, description],
    (err, results) => {
      if (err) {
        console.error('添加动物类型失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, message: '添加成功', data: { id: results.insertId } });
    }
  );
});

// 更新动物类型
router.put('/admin/animal-types/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { type, name, icon, category, description } = req.body;
  db.query(
    'UPDATE animal_types SET type = ?, name = ?, icon = ?, category = ?, description = ? WHERE id = ?',
    [type, name, icon, category, description, id],
    (err) => {
      if (err) {
        console.error('更新动物类型失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, message: '更新成功' });
    }
  );
});

// 删除动物类型
router.delete('/admin/animal-types/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM animal_types WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('删除动物类型失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    res.status(200).json({ code: 200, message: '删除成功' });
  });
});

// 获取系统声音列表（管理后台）
router.get('/admin/system-sounds', authenticateToken, (req, res) => {
  db.query(
    'SELECT s.*, at.name as animal_type_name FROM sounds s LEFT JOIN animal_types at ON s.animal_type = at.type WHERE s.user_id IS NULL ORDER BY s.id DESC',
    (err, results) => {
      if (err) {
        console.error('获取系统声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 添加系统声音
router.post('/admin/system-sounds', authenticateToken, upload.single('sound'), (req, res) => {
  const { animal_type, emotion, duration } = req.body;
  const soundUrl = req.file ? '/uploads/sounds/' + req.file.filename : req.body.sound_url;

  if (!animal_type || !emotion || !soundUrl) {
    return res.status(400).json({ code: 400, error: '缺少必要参数' });
  }

  db.query(
    'INSERT INTO sounds (user_id, animal_type, emotion, sound_url, duration, visible) VALUES (NULL, ?, ?, ?, ?, 1)',
    [animal_type, emotion, soundUrl, duration || 0],
    (err, results) => {
      if (err) {
        console.error('添加系统声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, message: '添加成功', data: { id: results.insertId } });
    }
  );
});

// 更新系统声音
router.put('/admin/system-sounds/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { animal_type, emotion, sound_url, duration } = req.body;

  db.query(
    'UPDATE sounds SET animal_type = ?, emotion = ?, sound_url = ?, duration = ? WHERE id = ? AND user_id IS NULL',
    [animal_type, emotion, sound_url, duration, id],
    (err) => {
      if (err) {
        console.error('更新系统声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, message: '更新成功' });
    }
  );
});

// 删除系统声音
router.delete('/admin/system-sounds/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM sounds WHERE id = ? AND user_id IS NULL', [id], (err) => {
    if (err) {
      console.error('删除系统声音失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    res.status(200).json({ code: 200, message: '删除成功' });
  });
});

// 获取用户声音列表（管理后台）
router.get('/admin/user-sounds', authenticateToken, (req, res) => {
  db.query(
    `SELECT s.*, u.username, at.name as animal_type_name 
     FROM sounds s 
     LEFT JOIN users u ON s.user_id = u.id 
     LEFT JOIN animal_types at ON s.animal_type = at.type 
     WHERE s.user_id IS NOT NULL 
     ORDER BY s.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error('获取用户声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, data: results });
    }
  );
});

// 审核用户声音
router.put('/admin/user-sounds/:id/review', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'

  db.query(
    'UPDATE sounds SET review_status = ? WHERE id = ?',
    [status, id],
    (err) => {
      if (err) {
        console.error('审核声音失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, message: '审核完成' });
    }
  );
});

// 删除用户声音
router.delete('/admin/user-sounds/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM sounds WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('删除用户声音失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }
    res.status(200).json({ code: 200, message: '删除成功' });
  });
});

module.exports = router;
