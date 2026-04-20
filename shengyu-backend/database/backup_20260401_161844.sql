-- MySQL dump 10.13  Distrib 5.7.40, for Linux (x86_64)
--
-- Host: localhost    Database: animal_sound_app
-- ------------------------------------------------------
-- Server version	5.7.40-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `animal_types`
--

DROP TABLE IF EXISTS `animal_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `animal_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '图标颜色或图片路径',
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'other',
  `is_active` tinyint(1) DEFAULT '1',
  `description` text COLLATE utf8mb4_unicode_ci,
  `sort_order` int(11) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sort` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `animal_types`
--

LOCK TABLES `animal_types` WRITE;
/*!40000 ALTER TABLE `animal_types` DISABLE KEYS */;
INSERT INTO `animal_types` VALUES (1,'cat','猫咪','?','popular',1,'猫咪的各种叫声和情绪',1,'2026-03-22 04:25:51'),(2,'dog','狗狗','?','popular',1,'狗狗的各种叫声和情绪',2,'2026-03-22 04:25:51'),(3,'bird','小鸟','?','other',1,'鸟类的各种叫声和情绪',3,'2026-03-22 04:25:51'),(4,'rabbit','兔子','?','other',1,'兔子的各种叫声和情绪',4,'2026-03-22 04:25:51'),(5,'hamster','仓鼠','?','other',1,'仓鼠的各种叫声和情绪',5,'2026-03-22 04:25:51'),(8,'whale','鲸鱼','?','sleep',1,'鲸鱼的声音，深沉而宁静',1,'2026-03-28 10:03:24'),(9,'dolphin','海豚','?','sleep',1,'海豚的声音，轻快而愉悦',2,'2026-03-28 10:03:24'),(10,'rain','雨声','?️','sleep',1,'雨声，助眠的自然声音',3,'2026-03-28 10:03:24'),(11,'wind','风声','?','sleep',1,'风声，轻柔的自然声音',4,'2026-03-28 10:03:24');
/*!40000 ALTER TABLE `animal_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '分类标识(英文)',
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '显示名称',
  `sort_order` int(11) DEFAULT '0' COMMENT '排序',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'popular','热门动物',1,1,'2026-03-28 10:08:48','2026-03-28 10:08:48'),(2,'sleep','睡前疗愈馆',2,1,'2026-03-28 10:08:48','2026-03-28 10:08:48'),(3,'other','其他动物',3,1,'2026-03-28 10:08:48','2026-03-28 10:08:48');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `post_id` (`post_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
INSERT INTO `comments` VALUES (2,2,2,'哈哈，狗狗确实生气了','2026-03-24 06:14:54'),(4,2,1,'使得 ','2026-03-25 00:07:28'),(6,11,1,'加油哦','2026-03-25 14:34:41'),(7,11,1,'还有社区页面点击评论图标会上拉弹出空白的bug也要修','2026-03-25 14:36:10'),(8,11,1,'111','2026-03-26 23:39:38');
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `favorites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_post` (`user_id`,`post_id`),
  KEY `post_id` (`post_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favorites`
--

LOCK TABLES `favorites` WRITE;
/*!40000 ALTER TABLE `favorites` DISABLE KEYS */;
/*!40000 ALTER TABLE `favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follows`
--

DROP TABLE IF EXISTS `follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `follows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `follower_id` int(11) NOT NULL COMMENT '关注者',
  `following_id` int(11) NOT NULL COMMENT '被关注者',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_follow` (`follower_id`,`following_id`),
  KEY `idx_follower` (`follower_id`),
  KEY `idx_following` (`following_id`),
  CONSTRAINT `follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `follows_ibfk_2` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follows`
--

LOCK TABLES `follows` WRITE;
/*!40000 ALTER TABLE `follows` DISABLE KEYS */;
INSERT INTO `follows` VALUES (2,2,1,'2026-03-28 03:24:27'),(3,3,4,'2026-03-28 04:39:00'),(4,4,3,'2026-03-28 04:39:00'),(33,3,1,'2026-03-28 05:39:40'),(35,1,2,'2026-03-29 02:10:02'),(39,1,3,'2026-03-31 12:17:51');
/*!40000 ALTER TABLE `follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_like` (`post_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likes`
--

LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
INSERT INTO `likes` VALUES (2,2,2,'2026-03-24 06:14:54'),(6,2,1,'2026-03-24 11:56:23'),(13,11,1,'2026-03-26 02:20:24');
/*!40000 ALTER TABLE `likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `receiver_id` (`receiver_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`),
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,3,4,'你好，小红！',1,'2026-03-28 04:39:10'),(2,3,4,'最近怎么样？',1,'2026-03-28 04:39:10'),(3,4,3,'嗨，小明！我很好，谢谢！',1,'2026-03-28 04:39:10'),(4,4,3,'你呢？最近在忙什么？',1,'2026-03-28 04:39:10'),(5,3,4,'我在学习新的编程技术呢',1,'2026-03-28 04:39:10'),(6,3,4,'这个动物声音App很有意思！',1,'2026-03-28 04:39:10'),(7,4,3,'真的吗？我也觉得很有趣！',1,'2026-03-28 04:39:10'),(8,4,3,'你录了什么动物的声音？',1,'2026-03-28 04:39:10'),(11,3,4,'你好，小红！',1,'2026-03-28 04:39:21'),(12,3,4,'最近怎么样？',1,'2026-03-28 04:39:21'),(13,4,3,'嗨，小明！我很好，谢谢！',1,'2026-03-28 04:39:21'),(14,4,3,'你呢？最近在忙什么？',1,'2026-03-28 04:39:21'),(15,3,4,'我在学习新的编程技术呢',1,'2026-03-28 04:39:21'),(16,3,4,'这个动物声音App很有意思！',1,'2026-03-28 04:39:21'),(17,4,3,'真的吗？我也觉得很有趣！',1,'2026-03-28 04:39:21'),(18,4,3,'你录了什么动物的声音？',1,'2026-03-28 04:39:21'),(19,3,4,'我录了猫咪和狗狗的声音',1,'2026-03-28 04:39:21'),(20,3,4,'下次发给你听听',1,'2026-03-28 04:39:21'),(21,3,4,'hahhahaha',1,'2026-03-28 04:41:32'),(22,4,3,'1111',1,'2026-03-28 04:53:44'),(23,3,4,'22222',0,'2026-03-28 05:18:01'),(24,3,4,'1111',0,'2026-03-28 11:30:48'),(26,1,2,'hello',0,'2026-03-28 13:22:32'),(27,1,2,'1',0,'2026-03-28 13:24:18'),(28,1,2,'2',0,'2026-03-28 13:24:22'),(31,1,2,'111111111111',0,'2026-03-29 02:10:25'),(58,3,1,'gello',1,'2026-03-29 04:16:51'),(59,1,3,'111',1,'2026-03-29 04:17:00'),(60,1,3,'泥嚎',0,'2026-03-29 04:27:28');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `publish_at` timestamp NULL DEFAULT NULL,
  `expire_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (27,'521','521','info','active',NULL,NULL,'2026-03-29 03:28:04');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sound_id` int(11) DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `sound_id` (`sound_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `posts_ibfk_2` FOREIGN KEY (`sound_id`) REFERENCES `sounds` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (2,1,NULL,'狗狗生气了，声音好凶啊！',NULL,'2026-03-24 06:14:54'),(11,1,NULL,'明日备忘录：修改帖子头像圆形显示，退出登录按钮调小，导入热门动物音频，添加关注和私信功能',NULL,'2026-03-25 14:34:27'),(12,3,NULL,'ooooooooooooooo.o',NULL,'2026-03-28 05:38:51');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sound_emotions`
--

DROP TABLE IF EXISTS `sound_emotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sound_emotions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `animal_type_id` int(11) NOT NULL,
  `emotion_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '情绪名称：开心、求偶、寻找同伴等',
  `description` text COLLATE utf8mb4_unicode_ci,
  `audio_file` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '音频文件路径',
  `color_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '圆形颜色代码，临时使用',
  `icon_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '后续替换的图标图片',
  `duration` int(11) DEFAULT NULL COMMENT '音频时长（秒）',
  `play_count` int(11) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_animal_type` (`animal_type_id`),
  CONSTRAINT `sound_emotions_ibfk_1` FOREIGN KEY (`animal_type_id`) REFERENCES `animal_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sound_emotions`
--

LOCK TABLES `sound_emotions` WRITE;
/*!40000 ALTER TABLE `sound_emotions` DISABLE KEYS */;
INSERT INTO `sound_emotions` VALUES (1,1,'开心','猫咪开心时的叫声，通常短促轻快','/uploads/sounds/cat/happy.mp3','#FFD93D',NULL,3,0,'2026-03-22 04:25:51','2026-03-22 04:25:51'),(2,1,'求偶','猫咪求偶时的叫声，声音较长且带有颤音','/uploads/sounds/cat/mating.mp3','#FF6B6B',NULL,5,0,'2026-03-22 04:25:51','2026-03-22 04:25:51'),(3,1,'寻找同伴','猫咪寻找同伴时的呼唤声','/uploads/sounds/cat/seeking.mp3','#4ECDC4',NULL,4,0,'2026-03-22 04:25:51','2026-03-22 04:25:51'),(4,1,'生气','猫咪生气时的嘶吼声','/uploads/sounds/cat/angry.mp3','#FF4757',NULL,2,0,'2026-03-22 04:25:51','2026-03-22 04:25:51'),(5,1,'饥饿','猫咪饥饿时的乞食叫声','/uploads/sounds/cat/hungry.mp3','#FFA502',NULL,3,0,'2026-03-22 04:25:51','2026-03-22 04:25:51'),(6,2,'开心','狗狗开心时的叫声，欢快活泼','/uploads/sounds/dog/happy.mp3','#FFD93D',NULL,2,0,'2026-03-22 04:25:51','2026-03-22 04:25:51'),(7,2,'警惕','狗狗警惕时的叫声','/uploads/sounds/dog/alert.mp3','#FF6B6B',NULL,3,0,'2026-03-22 04:25:51','2026-03-22 04:25:51'),(8,2,'撒娇','狗狗撒娇时的呜咽声','/uploads/sounds/dog/whine.mp3','#95E1D3',NULL,4,0,'2026-03-22 04:25:51','2026-03-22 04:25:51'),(9,3,'开心','鸟类开心时的鸣叫','/uploads/sounds/bird/happy.mp3','#FFD93D',NULL,2,0,'2026-03-22 04:25:51','2026-03-22 04:25:51'),(10,3,'求偶','鸟类求偶时的歌声','/uploads/sounds/bird/mating.mp3','#FF6B6B',NULL,5,0,'2026-03-22 04:25:51','2026-03-22 04:25:51');
/*!40000 ALTER TABLE `sound_emotions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sound_favorites`
--

DROP TABLE IF EXISTS `sound_favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sound_favorites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sound_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_sound` (`user_id`,`sound_id`),
  KEY `sound_id` (`sound_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `sound_favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sound_favorites_ibfk_2` FOREIGN KEY (`sound_id`) REFERENCES `sound_emotions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sound_favorites`
--

LOCK TABLES `sound_favorites` WRITE;
/*!40000 ALTER TABLE `sound_favorites` DISABLE KEYS */;
/*!40000 ALTER TABLE `sound_favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sounds`
--

DROP TABLE IF EXISTS `sounds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sounds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `animal_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emotion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sound_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration` int(11) NOT NULL,
  `visible` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `review_status` enum('none','pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'none',
  `is_official` tinyint(4) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `sounds_ibfk_1` (`user_id`),
  CONSTRAINT `sounds_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sounds`
--

LOCK TABLES `sounds` WRITE;
/*!40000 ALTER TABLE `sounds` DISABLE KEYS */;
/*!40000 ALTER TABLE `sounds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_sounds`
--

DROP TABLE IF EXISTS `system_sounds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_sounds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_id` int(11) NOT NULL COMMENT '关联的类型ID',
  `emotion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '情绪/场景',
  `sound_url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '声音文件URL',
  `duration` int(11) DEFAULT '0' COMMENT '时长(秒)',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT '描述',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '是否启用',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `system_sounds_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `animal_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_sounds`
--

LOCK TABLES `system_sounds` WRITE;
/*!40000 ALTER TABLE `system_sounds` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_sounds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_admin` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'syh','216@qq.com','$2b$10$8SV07S5R/Wy4sNSwcy1NoeL.Tmq3B4TlPMzUh119Z6c15dfyvROfy','/uploads/avatars/avatar-1774568981815-934797905.jpg','2026-03-24 06:14:54',1),(2,'testuser','test@example.com','$2b$10$e6kvKZQDI/ip7bNjpVvCJerCW/3MuaTdJonGlXVbcQAMZIg7AE6Qe',NULL,'2026-03-24 06:14:54',0),(3,'xiaoming','xiaoming@test.com','$2b$10$NWk7qfuziHgOtI2zNJQt4OYPiL5bUZCdge5jjKJW8VuUkMw3I9M7G','/uploads/avatars/avatar-1774672987611-589894771.png','2026-03-28 04:38:53',0),(4,'xiaohong','xiaohong@test.com','$2b$10$NWk7qfuziHgOtI2zNJQt4OYPiL5bUZCdge5jjKJW8VuUkMw3I9M7G',NULL,'2026-03-28 04:38:53',0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-01 16:18:45
