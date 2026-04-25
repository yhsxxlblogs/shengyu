const express = require('express');
const router = express.Router();
const db = require('../config/db');
const config = require('../config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAdmin } = require('../middleware/security');

// 注意：此路由文件在 index.js 中使用 /api/admin-upload 路径挂载
// 所以这里的 /system-sounds 实际路径是 /api/admin-upload/system-sounds

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

// 创建 multer 实例用于解析 multipart 表单（包括文件和字段）
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxSoundSize
  }
});

// 错误处理中间件
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ code: 400, error: '文件大小超过限制' });
    }
    return res.status(400).json({ code: 400, error: '文件上传错误: ' + err.message });
  }
  if (err) {
    return res.status(400).json({ code: 400, error: err.message });
  }
  next();
};

// 添加系统声音（支持文件上传）- 在 body-parser 之前注册
router.post('/system-sounds', requireAdmin, upload.single('sound'), handleMulterError, (req, res) => {
  console.log('[admin-sound-upload] 收到请求');
  console.log('[admin-sound-upload] req.body:', req.body);
  console.log('[admin-sound-upload] req.file:', req.file);
  
  // 检查 req.body 是否存在
  if (!req.body) {
    return res.status(400).json({ code: 400, error: '请求体解析失败' });
  }
  
  // multer 会将表单字段解析到 req.body
  const animal_type = req.body.type_id || req.body.animal_type;
  const emotion = req.body.emotion;
  const duration = req.body.duration;
  const description = req.body.description;
  const soundUrl = req.file ? '/uploads/sounds/' + req.file.filename : req.body.sound_url;

  console.log('[admin-sound-upload] 解析参数:', { animal_type, emotion, duration, soundUrl: soundUrl ? '存在' : '缺失' });

  if (!animal_type || !emotion || !soundUrl) {
    return res.status(400).json({ code: 400, error: '缺少必要参数' });
  }
  
  // 验证文件类型
  if (req.file) {
    const filetypes = config.upload.allowedSoundTypes;
    const extname = filetypes.test(path.extname(req.file.originalname).toLowerCase());
    const mimetype = filetypes.test(req.file.mimetype);
    if (!extname || !mimetype) {
      // 删除无效文件
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ code: 400, error: '只允许上传音频文件' });
    }
  }

  // 验证 animal_type 是否有效（可能是 ID 或 type 字符串）
  db.query('SELECT id, type FROM animal_types WHERE id = ? OR type = ?', [animal_type, animal_type], (err, results) => {
    if (err) {
      console.error('验证动物类型失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }

    if (results.length === 0) {
      return res.status(400).json({ code: 400, error: '无效的动物类型' });
    }

    const animalTypeId = results[0].id;

    db.query(
      'INSERT INTO sounds (animal_type, emotion, sound_url, duration, is_system, description, review_status) VALUES (?, ?, ?, ?, 1, ?, "approved")',
      [animalTypeId, emotion, soundUrl, duration || 0, description || ''],
      (err, result) => {
        if (err) {
          console.error('添加系统声音失败:', err);
          return res.status(500).json({ code: 500, error: '服务器错误' });
        }
        res.status(201).json({
          code: 201,
          message: '系统声音添加成功',
          data: { id: result.insertId }
        });
      }
    );
  });
});

// 更新系统声音（支持文件上传）- 在 body-parser 之前注册
router.put('/system-sounds/:id', requireAdmin, upload.single('sound'), handleMulterError, (req, res) => {
  const { id } = req.params;
  // multer 会将表单字段解析到 req.body
  const animal_type = req.body.type_id || req.body.animal_type;
  const emotion = req.body.emotion;
  const duration = req.body.duration;
  const description = req.body.description;
  const soundUrl = req.file ? '/uploads/sounds/' + req.file.filename : req.body.sound_url;

  if (!animal_type || !emotion) {
    return res.status(400).json({ code: 400, error: '缺少必要参数' });
  }

  // 先查询原声音信息
  db.query('SELECT sound_url FROM sounds WHERE id = ? AND is_system = 1', [id], (err, results) => {
    if (err) {
      console.error('查询系统声音失败:', err);
      return res.status(500).json({ code: 500, error: '服务器错误' });
    }

    if (results.length === 0) {
      return res.status(404).json({ code: 404, error: '系统声音不存在' });
    }

    const oldSoundUrl = results[0].sound_url;
    const finalSoundUrl = soundUrl || oldSoundUrl;

    // 验证 animal_type 是否有效
    db.query('SELECT id FROM animal_types WHERE type = ?', [animal_type], (err, typeResults) => {
      if (err) {
        console.error('验证动物类型失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      if (typeResults.length === 0) {
        return res.status(400).json({ code: 400, error: '无效的动物类型' });
      }

      const animalTypeId = typeResults[0].id;

      db.query(
        'UPDATE sounds SET animal_type = ?, emotion = ?, sound_url = ?, duration = ?, description = ? WHERE id = ? AND is_system = 1',
        [animalTypeId, emotion, finalSoundUrl, duration || 0, description || '', id],
        (err) => {
          if (err) {
            console.error('更新系统声音失败:', err);
            return res.status(500).json({ code: 500, error: '服务器错误' });
          }

          // 如果有新文件上传，删除旧文件
          if (req.file && oldSoundUrl) {
            const oldFilePath = path.join(__dirname, '..', oldSoundUrl);
            fs.unlink(oldFilePath, (err) => {
              if (err) console.error('删除旧声音文件失败:', err);
            });
          }

          res.status(200).json({
            code: 200,
            message: '系统声音更新成功'
          });
        }
      );
    });
  });
});

module.exports = router;
