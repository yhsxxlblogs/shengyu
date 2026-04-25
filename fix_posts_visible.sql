-- 添加 visible 字段到 posts 表
ALTER TABLE `posts` 
ADD COLUMN `visible` tinyint(1) NULL DEFAULT 1 COMMENT '是否可见：1-可见，0-隐藏' AFTER `image_url`,
ADD INDEX `idx_posts_visible` (`visible`) USING BTREE;

-- 更新现有数据为可见
UPDATE `posts` SET `visible` = 1 WHERE `visible` IS NULL;
