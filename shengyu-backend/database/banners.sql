-- ============================================
-- 轮播图表结构
-- ============================================

-- 创建轮播图表
CREATE TABLE IF NOT EXISTS banners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  image_url VARCHAR(500) NOT NULL COMMENT '轮播图片URL',
  title VARCHAR(100) DEFAULT NULL COMMENT '轮播标题（左下角文字）',
  link_url VARCHAR(500) DEFAULT NULL COMMENT '点击跳转链接',
  sort_order INT DEFAULT 0 COMMENT '排序顺序，数字越小越靠前',
  is_active TINYINT DEFAULT 1 COMMENT '是否启用：1-启用，0-禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首页轮播图表';

-- 插入默认的3条轮播数据（图片留空，后续在后台修改）
INSERT INTO banners (image_url, title, sort_order, is_active) VALUES
('', '轮播图 1', 1, 1),
('', '轮播图 2', 2, 1),
('', '轮播图 3', 3, 1);
