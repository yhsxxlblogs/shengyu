const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'banners');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 创建轮播图（支持文件上传）
router.post('/create', upload.single('image'), (req, res) => {
  // 调试日志
  console.log('[Banner Create] req.file:', req.file);
  console.log('[Banner Create] req.body:', req.body);
  
  // 从 req.body 获取文本字段，multer 会自动解析
  const title = req.body?.title || '';
  const link_url = req.body?.link_url || '';
  const sort_order = parseInt(req.body?.sort_order || '0');
  
  const image_url = req.file ? `/uploads/banners/${req.file.filename}` : '';
  
  console.log('[Banner Create] 处理后的数据:', { title, link_url, sort_order, image_url });

  db.query(
    'INSERT INTO banners (image_url, title, link_url, sort_order) VALUES (?, ?, ?, ?)',
    [image_url, title || null, link_url || null, sort_order || 0],
    (err, results) => {
      if (err) {
        console.error('创建轮播图失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.status(201).json({ 
        message: '轮播图创建成功', 
        id: results.insertId,
        banner: {
          id: results.insertId,
          image_url,
          title,
          link_url,
          sort_order: sort_order || 0
        }
      });
    }
  );
});

// 更新轮播图（支持文件上传）
router.put('/update/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  
  // 从 req.body 获取文本字段
  const title = req.body?.title || '';
  const link_url = req.body?.link_url || '';
  const sort_order = parseInt(req.body?.sort_order || '0');
  const is_active = parseInt(req.body?.is_active || '1');

  // 先获取原图片信息
  db.query(
    'SELECT image_url FROM banners WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('查询轮播图失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: '轮播图不存在' });
      }

      const oldImageUrl = results[0].image_url;
      let image_url = oldImageUrl;

      // 如果有新图片上传
      if (req.file) {
        image_url = `/uploads/banners/${req.file.filename}`;

        // 删除旧图片
        if (oldImageUrl) {
          const oldImagePath = path.join(__dirname, '..', oldImageUrl);
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('删除旧图片失败:', err);
          });
        }
      }

      db.query(
        'UPDATE banners SET image_url = ?, title = ?, link_url = ?, sort_order = ?, is_active = ? WHERE id = ?',
        [
          image_url,
          title !== undefined ? title : null,
          link_url !== undefined ? link_url : null,
          sort_order !== undefined ? sort_order : 0,
          is_active !== undefined ? is_active : 1,
          id
        ],
        (err) => {
          if (err) {
            console.error('更新轮播图失败:', err);
            return res.status(500).json({ error: '服务器错误' });
          }
          res.status(200).json({ message: '轮播图更新成功' });
        }
      );
    }
  );
});

module.exports = router;
