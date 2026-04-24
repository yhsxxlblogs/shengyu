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

// 获取所有轮播图（前台用 - 只返回启用的）
router.get('/list', (req, res) => {
  db.query(
    'SELECT id, image_url, title, link_url FROM banners WHERE is_active = 1 ORDER BY sort_order ASC, id ASC',
    (err, results) => {
      if (err) {
        console.error('获取轮播图失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      res.status(200).json({ banners: results });
    }
  );
});

// 获取所有轮播图（后台管理用）
router.get('/admin/list', (req, res) => {
  db.query(
    'SELECT * FROM banners ORDER BY sort_order ASC, id ASC',
    (err, results) => {
      if (err) {
        console.error('获取轮播图失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      res.status(200).json({ code: 200, banners: results });
    }
  );
});

// 获取单个轮播图
router.get('/admin/:id', (req, res) => {
  const { id } = req.params;
  db.query(
    'SELECT * FROM banners WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('获取轮播图失败:', err);
        return res.status(500).json({ code: 500, error: '服务器错误' });
      }
      if (results.length === 0) {
        return res.status(404).json({ code: 404, error: '轮播图不存在' });
      }
      res.status(200).json({ code: 200, banner: results[0] });
    }
  );
});

// 创建轮播图
router.post('/admin/create', upload.single('image'), (req, res) => {
  const { title, link_url, sort_order } = req.body;
  const image_url = req.file ? `/uploads/banners/${req.file.filename}` : '';

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

// 更新轮播图
router.put('/admin/update/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, link_url, sort_order, is_active } = req.body;

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

// 删除轮播图
router.delete('/admin/delete/:id', (req, res) => {
  const { id } = req.params;

  // 先获取图片信息
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

      const image_url = results[0].image_url;

      // 删除数据库记录
      db.query(
        'DELETE FROM banners WHERE id = ?',
        [id],
        (err) => {
          if (err) {
            console.error('删除轮播图失败:', err);
            return res.status(500).json({ error: '服务器错误' });
          }

          // 删除图片文件
          if (image_url) {
            const imagePath = path.join(__dirname, '..', image_url);
            fs.unlink(imagePath, (err) => {
              if (err) console.error('删除图片文件失败:', err);
            });
          }

          res.status(200).json({ message: '轮播图删除成功' });
        }
      );
    }
  );
});

// 更新轮播图状态（启用/禁用）
router.put('/admin/toggle/:id', (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  db.query(
    'UPDATE banners SET is_active = ? WHERE id = ?',
    [is_active, id],
    (err, results) => {
      if (err) {
        console.error('更新轮播图状态失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: '轮播图不存在' });
      }
      res.status(200).json({ message: is_active ? '轮播图已启用' : '轮播图已禁用' });
    }
  );
});

module.exports = router;
