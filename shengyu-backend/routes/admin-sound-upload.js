const express = require('express');
const router = express.Router();
const db = require('../config/db');
const config = require('../config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAdmin } = require('../middleware/security');

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

// 添加系统声音（支持文件上传）- 在 body-parser 之前注册
router.post('/system-sounds', requireAdmin, upload.single('sound'), (req, res) => {
  const { animal_type, emotion, duration, description } = req.body;
  const soundUrl = req.file ? '/uploads/sounds/' + req.file.filename : req.body.sound_url;

  if (!animal_type || !emotion || !soundUrl) {
    return res.status(400).json({ code: 400, error: '缺少必要参数' });
  }

  // 验证 animal_type 是否有效
  db.query('SELECT id FROM animal_types WHERE type = ?', [animal_type], (err, results) => {
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
router.put('/system-sounds/:id', requireAdmin, upload.single('sound'), (req, res) => {
  const { id } = req.params;
  const { animal_type, emotion, duration, description } = req.body;
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
