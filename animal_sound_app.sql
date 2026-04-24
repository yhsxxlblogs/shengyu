/*
 Navicat Premium Dump SQL

 Source Server         : shengyu-mysql
 Source Server Type    : MySQL
 Source Server Version : 50740 (5.7.40-log)
 Source Host           : 106.14.248.12:3306
 Source Schema         : animal_sound_app

 Target Server Type    : MySQL
 Target Server Version : 50740 (5.7.40-log)
 File Encoding         : 65001

 Date: 24/04/2026 21:47:21
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for animal_types
-- ----------------------------
DROP TABLE IF EXISTS `animal_types`;
CREATE TABLE `animal_types`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '图标颜色或图片路径',
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'other',
  `is_active` tinyint(1) NULL DEFAULT 1,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `sort_order` int(11) NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_sort`(`sort_order`) USING BTREE,
  INDEX `idx_animal_types_category`(`category`) USING BTREE,
  INDEX `idx_animal_types_sort`(`sort_order`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of animal_types
-- ----------------------------
INSERT INTO `animal_types` VALUES (1, 'cat', '猫咪', '🐱', 'popular', 1, '猫咪的各种叫声和情绪', 1, '2026-03-22 12:25:51');
INSERT INTO `animal_types` VALUES (2, 'dog', '狗狗', '🐶', 'popular', 1, '狗狗的各种叫声和情绪', 2, '2026-03-22 12:25:51');
INSERT INTO `animal_types` VALUES (3, 'bird', '小鸟', '🐦', 'other', 1, '鸟类的各种叫声和情绪', 3, '2026-03-22 12:25:51');
INSERT INTO `animal_types` VALUES (4, 'rabbit', '兔子', '🐰', 'other', 1, '兔子的各种叫声和情绪', 4, '2026-03-22 12:25:51');
INSERT INTO `animal_types` VALUES (5, 'hamster', '仓鼠', '🐹', 'other', 1, '仓鼠的各种叫声和情绪', 5, '2026-03-22 12:25:51');
INSERT INTO `animal_types` VALUES (8, 'whale', '鲸鱼', '🐋', 'sleep', 1, '鲸鱼的声音，深沉而宁静', 1, '2026-03-28 18:03:24');
INSERT INTO `animal_types` VALUES (9, 'dolphin', '海豚', '🐬', 'sleep', 1, '海豚的声音，轻快而愉悦', 2, '2026-03-28 18:03:24');
INSERT INTO `animal_types` VALUES (10, 'rain', '雨声', '🌧️', 'sleep', 1, '雨声，助眠的自然声音', 3, '2026-03-28 18:03:24');
INSERT INTO `animal_types` VALUES (11, 'wind', '风声', '🍃', 'sleep', 1, '风声，轻柔的自然声音', 4, '2026-03-28 18:03:24');

-- ----------------------------
-- Table structure for banners
-- ----------------------------
DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '轮播图片URL',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '轮播标题（左下角文字）',
  `link_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '点击跳转链接',
  `sort_order` int(11) NULL DEFAULT 0 COMMENT '排序顺序，数字越小越靠前',
  `is_active` tinyint(4) NULL DEFAULT 1 COMMENT '是否启用：1-启用，0-禁用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '首页轮播图表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of banners
-- ----------------------------
INSERT INTO `banners` VALUES (1, '/uploads/banners/banner-1777001774569-461523166.png', '轮播图 1', '', 0, 1, '2026-04-01 23:53:12', '2026-04-24 11:38:17');
INSERT INTO `banners` VALUES (2, '/uploads/banners/banner-1777001792654-357862075.png', '轮播图 2', '', 1, 1, '2026-04-01 23:53:12', '2026-04-24 11:38:11');
INSERT INTO `banners` VALUES (3, '/uploads/banners/banner-1777001798998-709667989.png', '轮播图 3', '', 2, 1, '2026-04-01 23:53:12', '2026-04-24 11:38:06');
INSERT INTO `banners` VALUES (4, '/uploads/banners/banner-1777001805896-687877693.png', '轮播图 4', '', 3, 1, '2026-04-03 14:56:41', '2026-04-24 11:37:48');
INSERT INTO `banners` VALUES (5, '/uploads/banners/banner-1777001821136-777892140.png', '轮播图 5', '', 4, 1, '2026-04-24 11:37:01', '2026-04-24 11:37:40');

-- ----------------------------
-- Table structure for categories
-- ----------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类标识(英文)',
  `display_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '显示名称',
  `sort_order` int(11) NULL DEFAULT 0 COMMENT '排序',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `name`(`name`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of categories
-- ----------------------------
INSERT INTO `categories` VALUES (1, 'popular', '热门动物', 1, 1, '2026-03-28 18:08:48', '2026-03-28 18:08:48');
INSERT INTO `categories` VALUES (2, 'sleep', '睡前疗愈馆', 2, 1, '2026-03-28 18:08:48', '2026-03-28 18:08:48');
INSERT INTO `categories` VALUES (3, 'other', '其他动物', 3, 1, '2026-03-28 18:08:48', '2026-03-28 18:08:48');

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_comments_post_id`(`post_id`) USING BTREE,
  INDEX `idx_comments_user_id`(`user_id`) USING BTREE,
  INDEX `idx_comments_post_created`(`post_id`, `created_at`) USING BTREE,
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of comments
-- ----------------------------
INSERT INTO `comments` VALUES (2, 2, 2, '哈哈，狗狗确实生气了', '2026-03-24 14:14:54');
INSERT INTO `comments` VALUES (4, 2, 1, '使得 ', '2026-03-25 08:07:28');

-- ----------------------------
-- Table structure for deleted_messages
-- ----------------------------
DROP TABLE IF EXISTS `deleted_messages`;
CREATE TABLE `deleted_messages`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message_id` int(11) NOT NULL,
  `deleted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_message`(`user_id`, `message_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 70 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of deleted_messages
-- ----------------------------
INSERT INTO `deleted_messages` VALUES (1, 1, 59, '2026-04-03 10:33:25');
INSERT INTO `deleted_messages` VALUES (2, 1, 60, '2026-04-03 10:33:25');
INSERT INTO `deleted_messages` VALUES (3, 1, 61, '2026-04-03 10:33:25');
INSERT INTO `deleted_messages` VALUES (4, 1, 58, '2026-04-03 10:33:25');
INSERT INTO `deleted_messages` VALUES (5, 1, 62, '2026-04-03 10:33:25');
INSERT INTO `deleted_messages` VALUES (6, 3, 59, '2026-04-20 19:15:49');
INSERT INTO `deleted_messages` VALUES (7, 3, 60, '2026-04-20 19:15:49');
INSERT INTO `deleted_messages` VALUES (8, 3, 61, '2026-04-20 19:15:49');
INSERT INTO `deleted_messages` VALUES (9, 3, 64, '2026-04-20 19:15:49');
INSERT INTO `deleted_messages` VALUES (10, 3, 65, '2026-04-20 19:15:49');
INSERT INTO `deleted_messages` VALUES (11, 3, 66, '2026-04-20 19:15:49');
INSERT INTO `deleted_messages` VALUES (12, 3, 58, '2026-04-20 19:15:49');
INSERT INTO `deleted_messages` VALUES (13, 3, 62, '2026-04-20 19:15:49');
INSERT INTO `deleted_messages` VALUES (14, 3, 63, '2026-04-20 19:15:49');
INSERT INTO `deleted_messages` VALUES (15, 3, 1, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (16, 3, 2, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (17, 3, 5, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (18, 3, 6, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (19, 3, 11, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (20, 3, 12, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (21, 3, 15, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (22, 3, 16, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (23, 3, 19, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (24, 3, 20, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (25, 3, 21, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (26, 3, 23, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (27, 3, 24, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (28, 3, 3, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (29, 3, 4, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (30, 3, 7, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (31, 3, 8, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (32, 3, 13, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (33, 3, 14, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (34, 3, 17, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (35, 3, 18, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (36, 3, 22, '2026-04-20 19:16:01');
INSERT INTO `deleted_messages` VALUES (37, 1, 64, '2026-04-20 19:41:58');
INSERT INTO `deleted_messages` VALUES (38, 1, 65, '2026-04-20 19:41:58');
INSERT INTO `deleted_messages` VALUES (39, 1, 66, '2026-04-20 19:41:58');
INSERT INTO `deleted_messages` VALUES (40, 1, 67, '2026-04-20 19:41:58');
INSERT INTO `deleted_messages` VALUES (41, 1, 68, '2026-04-20 19:41:58');
INSERT INTO `deleted_messages` VALUES (42, 1, 69, '2026-04-20 19:41:58');
INSERT INTO `deleted_messages` VALUES (43, 1, 63, '2026-04-20 19:41:58');
INSERT INTO `deleted_messages` VALUES (49, 1, 26, '2026-04-20 19:42:02');
INSERT INTO `deleted_messages` VALUES (50, 1, 27, '2026-04-20 19:42:02');
INSERT INTO `deleted_messages` VALUES (51, 1, 28, '2026-04-20 19:42:02');
INSERT INTO `deleted_messages` VALUES (52, 1, 31, '2026-04-20 19:42:02');
INSERT INTO `deleted_messages` VALUES (53, 1, 71, '2026-04-24 11:16:49');
INSERT INTO `deleted_messages` VALUES (54, 1, 73, '2026-04-24 11:16:49');
INSERT INTO `deleted_messages` VALUES (55, 1, 70, '2026-04-24 11:16:49');
INSERT INTO `deleted_messages` VALUES (56, 1, 72, '2026-04-24 11:16:49');
INSERT INTO `deleted_messages` VALUES (57, 1, 74, '2026-04-24 11:16:49');

-- ----------------------------
-- Table structure for favorites
-- ----------------------------
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_post`(`user_id`, `post_id`) USING BTREE,
  INDEX `idx_user`(`user_id`) USING BTREE,
  INDEX `idx_favorites_user_post`(`user_id`, `post_id`) USING BTREE,
  INDEX `idx_favorites_post_id`(`post_id`) USING BTREE,
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of favorites
-- ----------------------------

-- ----------------------------
-- Table structure for follows
-- ----------------------------
DROP TABLE IF EXISTS `follows`;
CREATE TABLE `follows`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `follower_id` int(11) NOT NULL COMMENT '关注者',
  `following_id` int(11) NOT NULL COMMENT '被关注者',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_follow`(`follower_id`, `following_id`) USING BTREE,
  INDEX `idx_follower`(`follower_id`) USING BTREE,
  INDEX `idx_following`(`following_id`) USING BTREE,
  INDEX `idx_follows_follower_following`(`follower_id`, `following_id`) USING BTREE,
  INDEX `idx_follows_following_follower`(`following_id`, `follower_id`) USING BTREE,
  INDEX `idx_follows_created_at`(`created_at`) USING BTREE,
  CONSTRAINT `follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `follows_ibfk_2` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 43 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of follows
-- ----------------------------
INSERT INTO `follows` VALUES (2, 2, 1, '2026-03-28 11:24:27');
INSERT INTO `follows` VALUES (3, 3, 4, '2026-03-28 12:39:00');
INSERT INTO `follows` VALUES (4, 4, 3, '2026-03-28 12:39:00');
INSERT INTO `follows` VALUES (33, 3, 1, '2026-03-28 13:39:40');
INSERT INTO `follows` VALUES (39, 1, 3, '2026-03-31 20:17:51');
INSERT INTO `follows` VALUES (40, 1, 2, '2026-04-21 23:00:27');

-- ----------------------------
-- Table structure for likes
-- ----------------------------
DROP TABLE IF EXISTS `likes`;
CREATE TABLE `likes`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_like`(`post_id`, `user_id`) USING BTREE,
  INDEX `idx_likes_post_user`(`post_id`, `user_id`) USING BTREE,
  INDEX `idx_likes_user_id`(`user_id`) USING BTREE,
  INDEX `idx_likes_post_created`(`post_id`, `created_at`) USING BTREE,
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 27 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of likes
-- ----------------------------
INSERT INTO `likes` VALUES (2, 2, 2, '2026-03-24 14:14:54');
INSERT INTO `likes` VALUES (15, 12, 1, '2026-04-20 20:54:18');
INSERT INTO `likes` VALUES (25, 2, 1, '2026-04-21 23:57:12');
INSERT INTO `likes` VALUES (26, 13, 1, '2026-04-23 10:26:12');

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_messages_sender_receiver`(`sender_id`, `receiver_id`) USING BTREE,
  INDEX `idx_messages_receiver_sender`(`receiver_id`, `sender_id`) USING BTREE,
  INDEX `idx_messages_receiver_read`(`receiver_id`, `is_read`) USING BTREE,
  INDEX `idx_messages_created_at`(`created_at`) USING BTREE,
  INDEX `idx_messages_sender_created`(`sender_id`, `created_at`) USING BTREE,
  INDEX `idx_messages_receiver_created`(`receiver_id`, `created_at`) USING BTREE,
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 77 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of messages
-- ----------------------------
INSERT INTO `messages` VALUES (1, 3, 4, '你好，小红！', 1, '2026-03-28 12:39:10');
INSERT INTO `messages` VALUES (2, 3, 4, '最近怎么样？', 1, '2026-03-28 12:39:10');
INSERT INTO `messages` VALUES (3, 4, 3, '嗨，小明！我很好，谢谢！', 1, '2026-03-28 12:39:10');
INSERT INTO `messages` VALUES (4, 4, 3, '你呢？最近在忙什么？', 1, '2026-03-28 12:39:10');
INSERT INTO `messages` VALUES (5, 3, 4, '我在学习新的编程技术呢', 1, '2026-03-28 12:39:10');
INSERT INTO `messages` VALUES (6, 3, 4, '这个动物声音App很有意思！', 1, '2026-03-28 12:39:10');
INSERT INTO `messages` VALUES (7, 4, 3, '真的吗？我也觉得很有趣！', 1, '2026-03-28 12:39:10');
INSERT INTO `messages` VALUES (8, 4, 3, '你录了什么动物的声音？', 1, '2026-03-28 12:39:10');
INSERT INTO `messages` VALUES (11, 3, 4, '你好，小红！', 1, '2026-03-28 12:39:21');
INSERT INTO `messages` VALUES (12, 3, 4, '最近怎么样？', 1, '2026-03-28 12:39:21');
INSERT INTO `messages` VALUES (13, 4, 3, '嗨，小明！我很好，谢谢！', 1, '2026-03-28 12:39:21');
INSERT INTO `messages` VALUES (14, 4, 3, '你呢？最近在忙什么？', 1, '2026-03-28 12:39:21');
INSERT INTO `messages` VALUES (15, 3, 4, '我在学习新的编程技术呢', 1, '2026-03-28 12:39:21');
INSERT INTO `messages` VALUES (16, 3, 4, '这个动物声音App很有意思！', 1, '2026-03-28 12:39:21');
INSERT INTO `messages` VALUES (17, 4, 3, '真的吗？我也觉得很有趣！', 1, '2026-03-28 12:39:21');
INSERT INTO `messages` VALUES (18, 4, 3, '你录了什么动物的声音？', 1, '2026-03-28 12:39:21');
INSERT INTO `messages` VALUES (19, 3, 4, '我录了猫咪和狗狗的声音', 1, '2026-03-28 12:39:21');
INSERT INTO `messages` VALUES (20, 3, 4, '下次发给你听听', 1, '2026-03-28 12:39:21');
INSERT INTO `messages` VALUES (21, 3, 4, 'hahhahaha', 1, '2026-03-28 12:41:32');
INSERT INTO `messages` VALUES (22, 4, 3, '1111', 1, '2026-03-28 12:53:44');
INSERT INTO `messages` VALUES (23, 3, 4, '22222', 0, '2026-03-28 13:18:01');
INSERT INTO `messages` VALUES (24, 3, 4, '1111', 0, '2026-03-28 19:30:48');
INSERT INTO `messages` VALUES (26, 1, 2, 'hello', 0, '2026-03-28 21:22:32');
INSERT INTO `messages` VALUES (27, 1, 2, '1', 0, '2026-03-28 21:24:18');
INSERT INTO `messages` VALUES (28, 1, 2, '2', 0, '2026-03-28 21:24:22');
INSERT INTO `messages` VALUES (31, 1, 2, '111111111111', 0, '2026-03-29 10:10:25');
INSERT INTO `messages` VALUES (58, 3, 1, 'gello', 1, '2026-03-29 12:16:51');
INSERT INTO `messages` VALUES (59, 1, 3, '111', 1, '2026-03-29 12:17:00');
INSERT INTO `messages` VALUES (60, 1, 3, '泥嚎', 1, '2026-03-29 12:27:28');
INSERT INTO `messages` VALUES (61, 1, 3, '11111111', 1, '2026-04-03 09:54:54');
INSERT INTO `messages` VALUES (62, 3, 1, '1111', 1, '2026-04-03 10:10:48');
INSERT INTO `messages` VALUES (63, 3, 1, '222', 1, '2026-04-03 11:21:29');
INSERT INTO `messages` VALUES (64, 1, 3, '111', 1, '2026-04-17 11:46:39');
INSERT INTO `messages` VALUES (65, 1, 3, '2222', 1, '2026-04-20 19:13:13');
INSERT INTO `messages` VALUES (66, 1, 3, '333', 1, '2026-04-20 19:15:25');
INSERT INTO `messages` VALUES (67, 1, 3, '2222222222222222', 1, '2026-04-20 19:16:19');
INSERT INTO `messages` VALUES (68, 1, 3, 'dddd', 1, '2026-04-20 19:16:58');
INSERT INTO `messages` VALUES (69, 1, 3, '55555555555555', 1, '2026-04-20 19:17:12');
INSERT INTO `messages` VALUES (70, 3, 1, '2222', 1, '2026-04-20 19:44:55');
INSERT INTO `messages` VALUES (71, 1, 3, '1111', 1, '2026-04-23 18:17:47');
INSERT INTO `messages` VALUES (72, 3, 1, '3333333', 1, '2026-04-23 18:38:51');
INSERT INTO `messages` VALUES (73, 1, 3, '你好', 1, '2026-04-23 18:39:03');
INSERT INTO `messages` VALUES (74, 3, 1, '2b', 1, '2026-04-23 18:39:07');
INSERT INTO `messages` VALUES (75, 3, 1, 'sb', 1, '2026-04-24 13:29:56');
INSERT INTO `messages` VALUES (76, 1, 2, 'wwjdn', 0, '2026-04-24 16:19:31');

-- ----------------------------
-- Table structure for notifications
-- ----------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'info',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'active',
  `publish_at` timestamp NULL DEFAULT NULL,
  `expire_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of notifications
-- ----------------------------
INSERT INTO `notifications` VALUES (2, '声愈', '这是一个测试版app，仅供调试。', 'info', 'disabled', NULL, NULL, '2026-04-23 18:04:16');

-- ----------------------------
-- Table structure for posts
-- ----------------------------
DROP TABLE IF EXISTS `posts`;
CREATE TABLE `posts`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sound_id` int(11) NULL DEFAULT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `image_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `sound_id`(`sound_id`) USING BTREE,
  INDEX `idx_posts_user_id`(`user_id`) USING BTREE,
  INDEX `idx_posts_created_at`(`created_at`) USING BTREE,
  INDEX `idx_posts_user_created`(`user_id`, `created_at`) USING BTREE,
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`sound_id`) REFERENCES `sounds` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of posts
-- ----------------------------
INSERT INTO `posts` VALUES (2, 1, NULL, '狗狗生气了，声音好凶啊！', NULL, '2026-03-24 14:14:54');
INSERT INTO `posts` VALUES (12, 3, NULL, 'ooooooooooooooo.o', NULL, '2026-03-28 13:38:51');
INSERT INTO `posts` VALUES (13, 1, NULL, '1111111111111', '/uploads/images/1776911155533.png', '2026-04-23 10:25:55');

-- ----------------------------
-- Table structure for sound_emotions
-- ----------------------------
DROP TABLE IF EXISTS `sound_emotions`;
CREATE TABLE `sound_emotions`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `animal_type_id` int(11) NOT NULL,
  `emotion_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '情绪名称：开心、求偶、寻找同伴等',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `audio_file` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '音频文件路径',
  `color_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '圆形颜色代码，临时使用',
  `icon_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '后续替换的图标图片',
  `duration` int(11) NULL DEFAULT NULL COMMENT '音频时长（秒）',
  `play_count` int(11) NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_animal_type`(`animal_type_id`) USING BTREE,
  CONSTRAINT `sound_emotions_ibfk_1` FOREIGN KEY (`animal_type_id`) REFERENCES `animal_types` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sound_emotions
-- ----------------------------
INSERT INTO `sound_emotions` VALUES (1, 1, '开心', '猫咪开心时的叫声，通常短促轻快', '/uploads/sounds/cat/happy.mp3', '#FFD93D', NULL, 3, 0, '2026-03-22 12:25:51', '2026-03-22 12:25:51');
INSERT INTO `sound_emotions` VALUES (2, 1, '求偶', '猫咪求偶时的叫声，声音较长且带有颤音', '/uploads/sounds/cat/mating.mp3', '#FF6B6B', NULL, 5, 0, '2026-03-22 12:25:51', '2026-03-22 12:25:51');
INSERT INTO `sound_emotions` VALUES (3, 1, '寻找同伴', '猫咪寻找同伴时的呼唤声', '/uploads/sounds/cat/seeking.mp3', '#4ECDC4', NULL, 4, 0, '2026-03-22 12:25:51', '2026-03-22 12:25:51');
INSERT INTO `sound_emotions` VALUES (4, 1, '生气', '猫咪生气时的嘶吼声', '/uploads/sounds/cat/angry.mp3', '#FF4757', NULL, 2, 0, '2026-03-22 12:25:51', '2026-03-22 12:25:51');
INSERT INTO `sound_emotions` VALUES (5, 1, '饥饿', '猫咪饥饿时的乞食叫声', '/uploads/sounds/cat/hungry.mp3', '#FFA502', NULL, 3, 0, '2026-03-22 12:25:51', '2026-03-22 12:25:51');
INSERT INTO `sound_emotions` VALUES (6, 2, '开心', '狗狗开心时的叫声，欢快活泼', '/uploads/sounds/dog/happy.mp3', '#FFD93D', NULL, 2, 0, '2026-03-22 12:25:51', '2026-03-22 12:25:51');
INSERT INTO `sound_emotions` VALUES (7, 2, '警惕', '狗狗警惕时的叫声', '/uploads/sounds/dog/alert.mp3', '#FF6B6B', NULL, 3, 0, '2026-03-22 12:25:51', '2026-03-22 12:25:51');
INSERT INTO `sound_emotions` VALUES (8, 2, '撒娇', '狗狗撒娇时的呜咽声', '/uploads/sounds/dog/whine.mp3', '#95E1D3', NULL, 4, 0, '2026-03-22 12:25:51', '2026-03-22 12:25:51');
INSERT INTO `sound_emotions` VALUES (9, 3, '开心', '鸟类开心时的鸣叫', '/uploads/sounds/bird/happy.mp3', '#FFD93D', NULL, 2, 0, '2026-03-22 12:25:51', '2026-03-22 12:25:51');
INSERT INTO `sound_emotions` VALUES (10, 3, '求偶', '鸟类求偶时的歌声', '/uploads/sounds/bird/mating.mp3', '#FF6B6B', NULL, 5, 0, '2026-03-22 12:25:51', '2026-03-22 12:25:51');

-- ----------------------------
-- Table structure for sound_favorites
-- ----------------------------
DROP TABLE IF EXISTS `sound_favorites`;
CREATE TABLE `sound_favorites`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sound_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_sound`(`user_id`, `sound_id`) USING BTREE,
  INDEX `sound_id`(`sound_id`) USING BTREE,
  INDEX `idx_user`(`user_id`) USING BTREE,
  CONSTRAINT `sound_favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `sound_favorites_ibfk_2` FOREIGN KEY (`sound_id`) REFERENCES `sound_emotions` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sound_favorites
-- ----------------------------

-- ----------------------------
-- Table structure for sounds
-- ----------------------------
DROP TABLE IF EXISTS `sounds`;
CREATE TABLE `sounds`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NULL DEFAULT NULL,
  `animal_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `emotion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sound_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration` int(11) NOT NULL,
  `visible` tinyint(1) NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `review_status` enum('none','pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'none',
  `is_official` tinyint(4) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_sounds_user_id`(`user_id`) USING BTREE,
  INDEX `idx_sounds_animal_type`(`animal_type`) USING BTREE,
  INDEX `idx_sounds_visible`(`visible`) USING BTREE,
  INDEX `idx_sounds_created_at`(`created_at`) USING BTREE,
  CONSTRAINT `sounds_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sounds
-- ----------------------------

-- ----------------------------
-- Table structure for system_sounds
-- ----------------------------
DROP TABLE IF EXISTS `system_sounds`;
CREATE TABLE `system_sounds`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_id` int(11) NOT NULL COMMENT '关联的类型ID',
  `emotion` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '情绪/场景',
  `sound_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '声音文件URL',
  `duration` int(11) NULL DEFAULT 0 COMMENT '时长(秒)',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '描述',
  `is_active` tinyint(1) NULL DEFAULT 1 COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `type_id`(`type_id`) USING BTREE,
  CONSTRAINT `system_sounds_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `animal_types` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of system_sounds
-- ----------------------------

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '用户名（账号密码登录必填，微信登录可选）',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮箱（账号密码登录必填，微信登录可选）',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_admin` tinyint(1) NULL DEFAULT 0,
  `wechat_openid` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信用户唯一标识',
  `wechat_unionid` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信开放平台唯一标识',
  `wechat_avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '微信头像URL',
  `login_type` enum('password','wechat') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT 'password' COMMENT '登录方式：password-账号密码, wechat-微信登录',
  `nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `email`(`email`) USING BTREE,
  UNIQUE INDEX `wechat_openid`(`wechat_openid`) USING BTREE,
  INDEX `idx_users_email`(`email`) USING BTREE,
  INDEX `idx_users_created_at`(`created_at`) USING BTREE,
  INDEX `idx_wechat_openid`(`wechat_openid`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'syh', '216@qq.com', '$2b$10$8SV07S5R/Wy4sNSwcy1NoeL.Tmq3B4TlPMzUh119Z6c15dfyvROfy', '/uploads/avatars/avatar-1774568981815-934797905.jpg', '2026-03-24 14:14:54', 1, NULL, NULL, NULL, 'password', NULL, '2026-04-24 17:54:18');
INSERT INTO `users` VALUES (2, 'testuser', 'test@example.com', '$2b$10$e6kvKZQDI/ip7bNjpVvCJerCW/3MuaTdJonGlXVbcQAMZIg7AE6Qe', NULL, '2026-03-24 14:14:54', 0, NULL, NULL, NULL, 'password', NULL, '2026-04-24 17:54:18');
INSERT INTO `users` VALUES (3, 'xiaoming', 'xiaoming@test.com', '$2b$10$NWk7qfuziHgOtI2zNJQt4OYPiL5bUZCdge5jjKJW8VuUkMw3I9M7G', '/uploads/avatars/avatar-1774672987611-589894771.png', '2026-03-28 12:38:53', 0, NULL, NULL, NULL, 'password', NULL, '2026-04-24 17:54:18');
INSERT INTO `users` VALUES (4, 'xiaohong', 'xiaohong@test.com', '$2b$10$NWk7qfuziHgOtI2zNJQt4OYPiL5bUZCdge5jjKJW8VuUkMw3I9M7G', NULL, '2026-03-28 12:38:53', 0, NULL, NULL, NULL, 'password', NULL, '2026-04-24 17:54:18');
INSERT INTO `users` VALUES (5, 'wx_QwV41xB0', NULL, NULL, 'https://thirdwx.qlogo.cn/mmopen/vi_32/CImxRsDib1JWSK3PbvSUKHwq36bqxlE2sMCMV3H4KTxtUicRwb3bAK1FHghkYGmUlyt6VLUDpZTq2MlmOmpUicAVCM6mebibR5vq5lsmJH8VBnQ/132', '2026-04-24 17:55:59', 0, 'oyC5j2UlOhRyOo9hl2ZyQwV41xB0', 'oCW9y2W6V40pY2_rHU4TYT2gha2I', 'https://thirdwx.qlogo.cn/mmopen/vi_32/CImxRsDib1JWSK3PbvSUKHwq36bqxlE2sMCMV3H4KTxtUicRwb3bAK1FHghkYGmUlyt6VLUDpZTq2MlmOmpUicAVCM6mebibR5vq5lsmJH8VBnQ/132', 'wechat', 'Sword.', '2026-04-24 17:56:46');

-- ----------------------------
-- View structure for v_popular_posts
-- ----------------------------
DROP VIEW IF EXISTS `v_popular_posts`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_popular_posts` AS select `p`.`id` AS `id`,`p`.`user_id` AS `user_id`,`p`.`content` AS `content`,`p`.`image_url` AS `image_url`,`p`.`created_at` AS `created_at`,`u`.`username` AS `username`,`u`.`avatar` AS `avatar`,(select count(0) from `likes` `l` where (`l`.`post_id` = `p`.`id`)) AS `like_count`,(select count(0) from `comments` `c` where (`c`.`post_id` = `p`.`id`)) AS `comment_count`,(((select count(0) from `likes` `l` where (`l`.`post_id` = `p`.`id`)) * 2) + ((select count(0) from `comments` `c` where (`c`.`post_id` = `p`.`id`)) * 3)) AS `heat_score` from (`posts` `p` join `users` `u` on((`p`.`user_id` = `u`.`id`))) having (`heat_score` > 0) order by `heat_score` desc,`p`.`created_at` desc;

-- ----------------------------
-- View structure for v_post_details
-- ----------------------------
DROP VIEW IF EXISTS `v_post_details`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_post_details` AS select `p`.`id` AS `id`,`p`.`user_id` AS `user_id`,`p`.`sound_id` AS `sound_id`,`p`.`content` AS `content`,`p`.`image_url` AS `image_url`,`p`.`created_at` AS `created_at`,`p`.`like_count` AS `like_count`,`p`.`comment_count` AS `comment_count`,`u`.`username` AS `username`,`u`.`avatar` AS `avatar` from (`posts` `p` join `users` `u` on((`p`.`user_id` = `u`.`id`)));

-- ----------------------------
-- View structure for v_post_list
-- ----------------------------
DROP VIEW IF EXISTS `v_post_list`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_post_list` AS select `p`.`id` AS `id`,`p`.`user_id` AS `user_id`,`p`.`content` AS `content`,`p`.`image_url` AS `image_url`,`p`.`created_at` AS `created_at`,`u`.`username` AS `username`,`u`.`avatar` AS `avatar`,(select count(0) from `likes` `l` where (`l`.`post_id` = `p`.`id`)) AS `like_count`,(select count(0) from `comments` `c` where (`c`.`post_id` = `p`.`id`)) AS `comment_count`,((select count(0) from `likes` `l` where (`l`.`post_id` = `p`.`id`)) + (select count(0) from `comments` `c` where (`c`.`post_id` = `p`.`id`))) AS `heat_score` from (`posts` `p` join `users` `u` on((`p`.`user_id` = `u`.`id`))) order by `p`.`created_at` desc;

-- ----------------------------
-- View structure for v_post_stats
-- ----------------------------
DROP VIEW IF EXISTS `v_post_stats`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_post_stats` AS select `p`.`id` AS `id`,`p`.`user_id` AS `user_id`,`p`.`content` AS `content`,`p`.`image_url` AS `image_url`,`p`.`created_at` AS `created_at`,`u`.`username` AS `username`,`u`.`avatar` AS `avatar`,(select count(0) from `likes` `l` where (`l`.`post_id` = `p`.`id`)) AS `like_count`,(select count(0) from `comments` `c` where (`c`.`post_id` = `p`.`id`)) AS `comment_count` from (`posts` `p` join `users` `u` on((`p`.`user_id` = `u`.`id`)));

-- ----------------------------
-- View structure for v_user_stats
-- ----------------------------
DROP VIEW IF EXISTS `v_user_stats`;
CREATE ALGORITHM = UNDEFINED SQL SECURITY DEFINER VIEW `v_user_stats` AS select `u`.`id` AS `id`,`u`.`username` AS `username`,`u`.`email` AS `email`,`u`.`avatar` AS `avatar`,`u`.`created_at` AS `created_at`,(select count(0) from `posts` `p` where (`p`.`user_id` = `u`.`id`)) AS `posts_count`,(select count(0) from `sounds` `s` where (`s`.`user_id` = `u`.`id`)) AS `sounds_count`,(select count(0) from `follows` `f` where (`f`.`following_id` = `u`.`id`)) AS `followers_count`,(select count(0) from `follows` `f` where (`f`.`follower_id` = `u`.`id`)) AS `following_count`,(select count(0) from (`likes` `l` join `posts` `p` on((`l`.`post_id` = `p`.`id`))) where (`p`.`user_id` = `u`.`id`)) AS `likes_received_count`,(select count(0) from (`comments` `c` join `posts` `p` on((`c`.`post_id` = `p`.`id`))) where (`p`.`user_id` = `u`.`id`)) AS `comments_received_count` from `users` `u`;

SET FOREIGN_KEY_CHECKS = 1;
