const express = require('express');
const router = express.Router();
const db = require('../config/db');
const config = require('../config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/security');

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

// 用户上传声音 - 在 body-parser 之前注册
router.post('/upload', authenticateToken, upload.single('sound'), handleMulterError, (req, res) => {
  console.log('[sound-upload] 收到请求');
  console.log('[sound-upload] req.body:', req.body);
  console.log('[sound-upload] req.file:', req.file);
  
  const userId = req.user.id;
  // 使用可选链访问 req.body
  const animal_type = req.body?.animal_type;
  const emotion = req.body?.emotion;
  const duration = req.body?.duration;
  const visible = req.body?.visible;
  const submit_for_review = req.body?.submit_for_review;

  if (!req.file) {
    return res.status(400).json({ code: 400, error: '请选择要上传的音频文件' });
  }
  
  // 验证文件类型
  const filetypes = config.upload.allowedSoundTypes;
  const extname = filetypes.test(path.extname(req.file.originalname).toLowerCase());
  const mimetype = filetypes.test(req.file.mimetype);
  if (!extname || !mimetype) {
    // 删除无效文件
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ code: 400, error: '只允许上传音频文件' });
  }

  if (!animal_type || !emotion) {
    // 删除上传的文件
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ code: 400, error: '请填写声音名称和情绪标签' });
  }

  const soundUrl = '/uploads/sounds/' + req.file.filename;
  
  // 处理 visible 参数
  const isVisible = visible === 'true' || visible === true ? 1 : 0;
  
  // 处理 submit_for_review 参数
  const shouldSubmitForReview = submit_for_review === 'true' || submit_for_review === true;
  const reviewStatus = shouldSubmitForReview ? 'pending' : 'none';

  db.query(
    'INSERT INTO sounds (user_id, animal_type, emotion, sound_url, duration, visible, review_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, animal_type, emotion, soundUrl, duration || 0, isVisible, reviewStatus],
    (err, results) => {
      if (err) {
        console.error('上传声音失败:', err);
        // 删除上传的文件
        fs.unlinkSync(req.file.path);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }

      res.status(201).json({
        code: 201,
        message: shouldSubmitForReview ? '上传成功，等待审核' : '上传成功',
        sound_id: results.insertId,
        sound: {
          id: results.insertId,
          animal_type,
          emotion,
          sound_url: soundUrl,
          duration: duration || 0,
          review_status: reviewStatus
        }
      });
    }
  );
});

module.exports = router;
