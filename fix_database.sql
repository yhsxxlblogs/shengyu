-- 修复数据库结构，添加缺失的字段

-- 添加 wechat_nickname 字段到 users 表
ALTER TABLE `users` 
ADD COLUMN `wechat_nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信昵称' AFTER `wechat_avatar`;

-- 检查是否成功添加
DESCRIBE `users`;
