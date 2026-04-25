-- 修复数据库结构，添加缺失的字段和索引
-- 执行前请备份数据库！

-- ============================================
-- 1. 修复 users 表
-- ============================================

-- 添加微信登录相关字段
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `login_type` ENUM('password', 'wechat') DEFAULT 'password' COMMENT '登录方式：password-账号密码, wechat-微信登录' AFTER `is_admin`,
ADD COLUMN IF NOT EXISTS `wechat_openid` VARCHAR(64) UNIQUE COMMENT '微信用户唯一标识' AFTER `login_type`,
ADD COLUMN IF EXISTS `wechat_unionid` VARCHAR(64) COMMENT '微信开放平台统一标识' AFTER `wechat_openid`,
ADD COLUMN IF NOT EXISTS `wechat_avatar` VARCHAR(255) COMMENT '微信头像URL' AFTER `wechat_unionid`,
ADD COLUMN IF NOT EXISTS `nickname` VARCHAR(100) COMMENT '用户昵称' AFTER `avatar`,
ADD COLUMN IF NOT EXISTS `bio` TEXT COMMENT '个人简介' AFTER `nickname`,
ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否激活：1-激活，0-禁用' AFTER `bio`,
ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER `created_at`;

-- 添加索引
ALTER TABLE `users`
ADD INDEX IF NOT EXISTS `idx_wechat_openid` (`wechat_openid`) USING BTREE,
ADD INDEX IF NOT EXISTS `idx_is_active` (`is_active`) USING BTREE,
ADD INDEX IF NOT EXISTS `idx_login_type` (`login_type`) USING BTREE;

-- 删除重复的 email 索引（保留 UNIQUE 约束）
-- ALTER TABLE `users` DROP INDEX IF EXISTS `idx_users_email`;

-- ============================================
-- 2. 修复 posts 表
-- ============================================

-- 添加 visible 字段
ALTER TABLE `posts`
ADD COLUMN IF NOT EXISTS `visible` TINYINT(1) DEFAULT 1 COMMENT '是否可见：1-可见，0-隐藏' AFTER `image_url`,
ADD INDEX IF NOT EXISTS `idx_visible` (`visible`) USING BTREE;

-- 更新现有数据的 visible 字段
UPDATE `posts` SET `visible` = 1 WHERE `visible` IS NULL;

-- ============================================
-- 3. 修复视图（使用 COALESCE 优先显示微信昵称）
-- ============================================

DROP VIEW IF EXISTS `v_post_details`;
DROP VIEW IF EXISTS `v_post_stats`;
DROP VIEW IF EXISTS `v_post_list`;
DROP VIEW IF EXISTS `v_popular_posts`;
DROP VIEW IF EXISTS `v_user_stats`;

-- 帖子详情视图
CREATE VIEW `v_post_details` AS
SELECT
    `p`.`id` AS `id`,
    `p`.`user_id` AS `user_id`,
    `p`.`sound_id` AS `sound_id`,
    `p`.`content` AS `content`,
    `p`.`image_url` AS `image_url`,
    `p`.`created_at` AS `created_at`,
    `p`.`like_count` AS `like_count`,
    `p`.`comment_count` AS `comment_count`,
    COALESCE(`u`.`nickname`, `u`.`wechat_nickname`, `u`.`username`) AS `username`,
    COALESCE(`u`.`avatar`, `u`.`wechat_avatar`) AS `avatar`
FROM `posts` `p`
JOIN `users` `u` ON `p`.`user_id` = `u`.`id`;

-- 帖子统计视图
CREATE VIEW `v_post_stats` AS
SELECT
    `p`.`id` AS `id`,
    `p`.`user_id` AS `user_id`,
    `p`.`content` AS `content`,
    `p`.`image_url` AS `image_url`,
    `p`.`created_at` AS `created_at`,
    `p`.`like_count` AS `like_count`,
    `p`.`comment_count` AS `comment_count`,
    COALESCE(`u`.`nickname`, `u`.`wechat_nickname`, `u`.`username`) AS `username`,
    COALESCE(`u`.`avatar`, `u`.`wechat_avatar`) AS `avatar`
FROM `posts` `p`
JOIN `users` `u` ON `p`.`user_id` = `u`.`id`;

-- 帖子列表视图
CREATE VIEW `v_post_list` AS
SELECT
    `p`.`id` AS `id`,
    `p`.`user_id` AS `user_id`,
    `p`.`content` AS `content`,
    `p`.`image_url` AS `image_url`,
    `p`.`created_at` AS `created_at`,
    `p`.`like_count` AS `like_count`,
    `p`.`comment_count` AS `comment_count`,
    (`p`.`like_count` + `p`.`comment_count`) AS `heat_score`,
    COALESCE(`u`.`nickname`, `u`.`wechat_nickname`, `u`.`username`) AS `username`,
    COALESCE(`u`.`avatar`, `u`.`wechat_avatar`) AS `avatar`
FROM `posts` `p`
JOIN `users` `u` ON `p`.`user_id` = `u`.`id`
ORDER BY `p`.`created_at` DESC;

-- 热门帖子视图
CREATE VIEW `v_popular_posts` AS
SELECT
    `p`.`id` AS `id`,
    `p`.`user_id` AS `user_id`,
    `p`.`content` AS `content`,
    `p`.`image_url` AS `image_url`,
    `p`.`created_at` AS `created_at`,
    `p`.`like_count` AS `like_count`,
    `p`.`comment_count` AS `comment_count`,
    (`p`.`like_count` * 2 + `p`.`comment_count` * 3) AS `heat_score`,
    COALESCE(`u`.`nickname`, `u`.`wechat_nickname`, `u`.`username`) AS `username`,
    COALESCE(`u`.`avatar`, `u`.`wechat_avatar`) AS `avatar`
FROM `posts` `p`
JOIN `users` `u` ON `p`.`user_id` = `u`.`id`
HAVING `heat_score` > 0
ORDER BY `heat_score` DESC, `p`.`created_at` DESC;

-- 用户统计视图
CREATE VIEW `v_user_stats` AS
SELECT
    `u`.`id` AS `id`,
    COALESCE(`u`.`nickname`, `u`.`wechat_nickname`, `u`.`username`) AS `username`,
    `u`.`email` AS `email`,
    COALESCE(`u`.`avatar`, `u`.`wechat_avatar`) AS `avatar`,
    `u`.`created_at` AS `created_at`,
    `u`.`posts_count` AS `posts_count`,
    `u`.`sounds_count` AS `sounds_count`,
    `u`.`followers_count` AS `followers_count`,
    `u`.`following_count` AS `following_count`,
    `u`.`likes_received_count` AS `likes_received_count`,
    `u`.`comments_received_count` AS `comments_received_count`
FROM `users` `u`;

-- 刷新权限
FLUSH TABLES;
