-- 修复数据库视图
-- 删除所有有问题的视图并重新创建

-- 删除旧视图
DROP VIEW IF EXISTS `v_post_details`;
DROP VIEW IF EXISTS `v_popular_posts`;
DROP VIEW IF EXISTS `v_post_list`;
DROP VIEW IF EXISTS `v_post_stats`;
DROP VIEW IF EXISTS `v_user_stats`;

-- 重新创建 v_post_details 视图（使用子查询计算点赞和评论数）
CREATE VIEW `v_post_details` AS
SELECT
    `p`.`id` AS `id`,
    `p`.`user_id` AS `user_id`,
    `p`.`sound_id` AS `sound_id`,
    `p`.`content` AS `content`,
    `p`.`image_url` AS `image_url`,
    `p`.`created_at` AS `created_at`,
    (SELECT COUNT(*) FROM `likes` `l` WHERE `l`.`post_id` = `p`.`id`) AS `like_count`,
    (SELECT COUNT(*) FROM `comments` `c` WHERE `c`.`post_id` = `p`.`id`) AS `comment_count`,
    COALESCE(`u`.`nickname`, `u`.`wechat_nickname`, `u`.`username`) AS `username`,
    COALESCE(`u`.`avatar`, `u`.`wechat_avatar`) AS `avatar`
FROM `posts` `p`
JOIN `users` `u` ON `p`.`user_id` = `u`.`id`;

-- 重新创建 v_popular_posts 视图
CREATE VIEW `v_popular_posts` AS
SELECT
    `p`.`id` AS `id`,
    `p`.`user_id` AS `user_id`,
    `p`.`content` AS `content`,
    `p`.`image_url` AS `image_url`,
    `p`.`created_at` AS `created_at`,
    COALESCE(`u`.`nickname`, `u`.`wechat_nickname`, `u`.`username`) AS `username`,
    COALESCE(`u`.`avatar`, `u`.`wechat_avatar`) AS `avatar`,
    (SELECT COUNT(*) FROM `likes` `l` WHERE `l`.`post_id` = `p`.`id`) AS `like_count`,
    (SELECT COUNT(*) FROM `comments` `c` WHERE `c`.`post_id` = `p`.`id`) AS `comment_count`,
    (((SELECT COUNT(*) FROM `likes` `l` WHERE `l`.`post_id` = `p`.`id`) * 2) + ((SELECT COUNT(*) FROM `comments` `c` WHERE `c`.`post_id` = `p`.`id`) * 3)) AS `heat_score`
FROM `posts` `p`
JOIN `users` `u` ON `p`.`user_id` = `u`.`id`
HAVING `heat_score` > 0
ORDER BY `heat_score` DESC, `p`.`created_at` DESC;

-- 重新创建 v_post_list 视图
CREATE VIEW `v_post_list` AS
SELECT
    `p`.`id` AS `id`,
    `p`.`user_id` AS `user_id`,
    `p`.`content` AS `content`,
    `p`.`image_url` AS `image_url`,
    `p`.`created_at` AS `created_at`,
    COALESCE(`u`.`nickname`, `u`.`wechat_nickname`, `u`.`username`) AS `username`,
    COALESCE(`u`.`avatar`, `u`.`wechat_avatar`) AS `avatar`,
    (SELECT COUNT(*) FROM `likes` `l` WHERE `l`.`post_id` = `p`.`id`) AS `like_count`,
    (SELECT COUNT(*) FROM `comments` `c` WHERE `c`.`post_id` = `p`.`id`) AS `comment_count`,
    ((SELECT COUNT(*) FROM `likes` `l` WHERE `l`.`post_id` = `p`.`id`) + (SELECT COUNT(*) FROM `comments` `c` WHERE `c`.`post_id` = `p`.`id`)) AS `heat_score`
FROM `posts` `p`
JOIN `users` `u` ON `p`.`user_id` = `u`.`id`
ORDER BY `p`.`created_at` DESC;

-- 重新创建 v_post_stats 视图
CREATE VIEW `v_post_stats` AS
SELECT
    `p`.`id` AS `id`,
    `p`.`user_id` AS `user_id`,
    `p`.`content` AS `content`,
    `p`.`image_url` AS `image_url`,
    `p`.`created_at` AS `created_at`,
    COALESCE(`u`.`nickname`, `u`.`wechat_nickname`, `u`.`username`) AS `username`,
    COALESCE(`u`.`avatar`, `u`.`wechat_avatar`) AS `avatar`,
    (SELECT COUNT(*) FROM `likes` `l` WHERE `l`.`post_id` = `p`.`id`) AS `like_count`,
    (SELECT COUNT(*) FROM `comments` `c` WHERE `c`.`post_id` = `p`.`id`) AS `comment_count`
FROM `posts` `p`
JOIN `users` `u` ON `p`.`user_id` = `u`.`id`;

-- 重新创建 v_user_stats 视图
CREATE VIEW `v_user_stats` AS
SELECT
    `u`.`id` AS `id`,
    COALESCE(`u`.`nickname`, `u`.`wechat_nickname`, `u`.`username`) AS `username`,
    `u`.`email` AS `email`,
    COALESCE(`u`.`avatar`, `u`.`wechat_avatar`) AS `avatar`,
    `u`.`created_at` AS `created_at`,
    (SELECT COUNT(*) FROM `posts` `p` WHERE `p`.`user_id` = `u`.`id`) AS `posts_count`,
    (SELECT COUNT(*) FROM `sounds` `s` WHERE `s`.`user_id` = `u`.`id`) AS `sounds_count`,
    (SELECT COUNT(*) FROM `follows` `f` WHERE `f`.`following_id` = `u`.`id`) AS `followers_count`,
    (SELECT COUNT(*) FROM `follows` `f` WHERE `f`.`follower_id` = `u`.`id`) AS `following_count`,
    (SELECT COUNT(*) FROM `likes` `l` JOIN `posts` `p` ON `l`.`post_id` = `p`.`id` WHERE `p`.`user_id` = `u`.`id`) AS `likes_received_count`,
    (SELECT COUNT(*) FROM `comments` `c` JOIN `posts` `p` ON `c`.`post_id` = `p`.`id` WHERE `p`.`user_id` = `u`.`id`) AS `comments_received_count`
FROM `users` `u`;

-- 刷新权限
FLUSH TABLES;
