-- 为 users 表添加微信登录相关字段
-- 执行前请确保已备份数据

-- 添加 nickname 字段
ALTER TABLE users ADD COLUMN nickname VARCHAR(100);

-- 添加微信相关字段
ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(100);
ALTER TABLE users ADD COLUMN wechat_unionid VARCHAR(100);
ALTER TABLE users ADD COLUMN wechat_nickname VARCHAR(100);
ALTER TABLE users ADD COLUMN wechat_avatar VARCHAR(255);

-- 添加登录类型字段
ALTER TABLE users ADD COLUMN login_type VARCHAR(20) DEFAULT 'password';

-- 添加更新时间字段
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 添加微信openid索引
ALTER TABLE users ADD INDEX idx_wechat_openid (wechat_openid);

-- 修改 password 字段为可空（微信登录用户可能没有密码）
ALTER TABLE users MODIFY COLUMN password VARCHAR(255);
