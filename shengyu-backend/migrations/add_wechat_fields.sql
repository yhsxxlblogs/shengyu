-- 添加微信登录相关字段到 users 表
-- 执行时间: 2026-04-24

-- 修改 users 表结构，允许 username、email、password 为 NULL（为了支持微信登录用户）
SET @dbname = DATABASE();
SET @tablename = 'users';

-- 修改 username 字段允许 NULL
SET @column_exists = (SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_schema = @dbname 
  AND table_name = @tablename 
  AND column_name = 'username');

SET @sql = IF(@column_exists > 0, 
  'ALTER TABLE users MODIFY COLUMN username VARCHAR(50) NULL COMMENT "用户名（账号密码登录必填，微信登录可选）"',
  'SELECT "username 字段不存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 修改 email 字段允许 NULL
SET @column_exists = (SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_schema = @dbname 
  AND table_name = @tablename 
  AND column_name = 'email');

SET @sql = IF(@column_exists > 0, 
  'ALTER TABLE users MODIFY COLUMN email VARCHAR(100) NULL COMMENT "邮箱（账号密码登录必填，微信登录可选）"',
  'SELECT "email 字段不存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 修改 password 字段允许 NULL
SET @column_exists = (SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_schema = @dbname 
  AND table_name = @tablename 
  AND column_name = 'password');

SET @sql = IF(@column_exists > 0, 
  'ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL COMMENT "密码（账号密码登录必填，微信登录可选）"',
  'SELECT "password 字段不存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 wechat_openid 字段
SET @column_exists = (SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_schema = @dbname 
  AND table_name = @tablename 
  AND column_name = 'wechat_openid');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(64) UNIQUE COMMENT "微信用户唯一标识"',
  'SELECT "wechat_openid 字段已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 wechat_unionid 字段
SET @column_exists = (SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_schema = @dbname 
  AND table_name = @tablename 
  AND column_name = 'wechat_unionid');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN wechat_unionid VARCHAR(64) COMMENT "微信开放平台唯一标识"',
  'SELECT "wechat_unionid 字段已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 wechat_nickname 字段
SET @column_exists = (SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_schema = @dbname 
  AND table_name = @tablename 
  AND column_name = 'wechat_nickname');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN wechat_nickname VARCHAR(100) COMMENT "微信昵称"',
  'SELECT "wechat_nickname 字段已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 wechat_avatar 字段
SET @column_exists = (SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_schema = @dbname 
  AND table_name = @tablename 
  AND column_name = 'wechat_avatar');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN wechat_avatar VARCHAR(255) COMMENT "微信头像URL"',
  'SELECT "wechat_avatar 字段已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 login_type 字段，用于区分登录方式
SET @column_exists = (SELECT COUNT(*) 
  FROM information_schema.columns 
  WHERE table_schema = @dbname 
  AND table_name = @tablename 
  AND column_name = 'login_type');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE users ADD COLUMN login_type ENUM("password", "wechat") DEFAULT "password" COMMENT "登录方式：password-账号密码, wechat-微信登录"',
  'SELECT "login_type 字段已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 为 wechat_openid 添加索引
SET @index_exists = (SELECT COUNT(*) 
  FROM information_schema.statistics 
  WHERE table_schema = @dbname 
  AND table_name = @tablename 
  AND index_name = 'idx_wechat_openid');

SET @sql = IF(@index_exists = 0, 
  'CREATE INDEX idx_wechat_openid ON users(wechat_openid)',
  'SELECT "idx_wechat_openid 索引已存在"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 验证字段添加成功
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_COMMENT
FROM information_schema.columns 
WHERE table_schema = @dbname 
AND table_name = @tablename 
AND (column_name LIKE 'wechat%' OR column_name IN ('username', 'email', 'password', 'login_type'))
ORDER BY ordinal_position;
