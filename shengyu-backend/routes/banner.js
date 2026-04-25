const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

const router = express.Router();

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

// 注意：创建和更新轮播图（含文件上传）的路由已移至 banner-upload.js
// 该文件在 body-parser 之前加载，避免 multipart 请求被错误解析为 JSON

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
