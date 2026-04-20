-- ============================================
-- 声愈项目 - 数据库性能优化脚本 (MySQL 5.7 最终版)
-- 执行前请备份数据库
-- ============================================

-- 设置忽略错误继续执行
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. 高频查询表索引优化
-- ============================================

-- messages 表索引
CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX idx_messages_receiver_sender ON messages(receiver_id, sender_id);
CREATE INDEX idx_messages_receiver_read ON messages(receiver_id, is_read);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_sender_created ON messages(sender_id, created_at);
CREATE INDEX idx_messages_receiver_created ON messages(receiver_id, created_at);

-- follows 表索引
CREATE INDEX idx_follows_follower_following ON follows(follower_id, following_id);
CREATE INDEX idx_follows_following_follower ON follows(following_id, follower_id);
CREATE INDEX idx_follows_created_at ON follows(created_at);

-- posts 表索引
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);

-- likes 表索引
CREATE INDEX idx_likes_post_user ON likes(post_id, user_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- comments 表索引
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at);

-- sounds 表索引
CREATE INDEX idx_sounds_user_id ON sounds(user_id);
CREATE INDEX idx_sounds_animal_type ON sounds(animal_type);
CREATE INDEX idx_sounds_visible ON sounds(visible);
CREATE INDEX idx_sounds_created_at ON sounds(created_at);

-- users 表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ============================================
-- 2. deleted_messages 软删除表索引
-- ============================================

-- 检查表是否存在并创建索引
SET @table_exists = (SELECT COUNT(*) 
                     FROM information_schema.tables 
                     WHERE table_schema = DATABASE() 
                     AND table_name = 'deleted_messages');

SET @sql = IF(@table_exists > 0, 
              'CREATE INDEX idx_deleted_msgs_user_message ON deleted_messages(user_id, message_id)',
              'SELECT "deleted_messages 表不存在，跳过索引创建" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql2 = IF(@table_exists > 0,
               'CREATE INDEX idx_deleted_msgs_user_other ON deleted_messages(user_id, other_user_id)',
               'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- ============================================
-- 3. 添加统计字段（反规范化优化）
-- ============================================

-- 3.1 users 表添加统计字段
ALTER TABLE users 
ADD COLUMN posts_count INT DEFAULT 0 COMMENT '帖子数',
ADD COLUMN sounds_count INT DEFAULT 0 COMMENT '声音数',
ADD COLUMN followers_count INT DEFAULT 0 COMMENT '粉丝数',
ADD COLUMN following_count INT DEFAULT 0 COMMENT '关注数',
ADD COLUMN likes_received_count INT DEFAULT 0 COMMENT '获赞数',
ADD COLUMN comments_received_count INT DEFAULT 0 COMMENT '获评论数';

-- 3.2 posts 表添加统计字段
ALTER TABLE posts
ADD COLUMN like_count INT DEFAULT 0 COMMENT '点赞数',
ADD COLUMN comment_count INT DEFAULT 0 COMMENT '评论数';

-- ============================================
-- 4. 初始化统计字段数据
-- ============================================

-- 4.1 更新用户帖子数
UPDATE users u 
SET posts_count = (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id);

-- 4.2 更新用户声音数
UPDATE users u 
SET sounds_count = (SELECT COUNT(*) FROM sounds s WHERE s.user_id = u.id);

-- 4.3 更新用户粉丝数
UPDATE users u 
SET followers_count = (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id);

-- 4.4 更新用户关注数
UPDATE users u 
SET following_count = (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id);

-- 4.5 更新帖子点赞数
UPDATE posts p 
SET like_count = (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id);

-- 4.6 更新帖子评论数
UPDATE posts p 
SET comment_count = (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id);

-- 4.7 更新用户获赞数
UPDATE users u 
SET likes_received_count = COALESCE((
    SELECT COUNT(*) FROM likes l 
    JOIN posts p ON l.post_id = p.id 
    WHERE p.user_id = u.id
), 0);

-- 4.8 更新用户获评论数
UPDATE users u 
SET comments_received_count = COALESCE((
    SELECT COUNT(*) FROM comments c 
    JOIN posts p ON c.post_id = p.id 
    WHERE p.user_id = u.id
), 0);

-- ============================================
-- 5. 创建触发器自动维护统计字段
-- ============================================

DELIMITER //

-- 删除已存在的触发器
DROP TRIGGER IF EXISTS tr_follows_insert//
DROP TRIGGER IF EXISTS tr_follows_delete//
DROP TRIGGER IF EXISTS tr_posts_insert//
DROP TRIGGER IF EXISTS tr_posts_delete//
DROP TRIGGER IF EXISTS tr_sounds_insert//
DROP TRIGGER IF EXISTS tr_sounds_delete//
DROP TRIGGER IF EXISTS tr_likes_insert//
DROP TRIGGER IF EXISTS tr_likes_delete//
DROP TRIGGER IF EXISTS tr_comments_insert//
DROP TRIGGER IF EXISTS tr_comments_delete//

-- 5.1 follows 表触发器
CREATE TRIGGER tr_follows_insert
AFTER INSERT ON follows
FOR EACH ROW
BEGIN
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE users SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
END//

CREATE TRIGGER tr_follows_delete
AFTER DELETE ON follows
FOR EACH ROW
BEGIN
    UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE users SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
END//

-- 5.2 posts 表触发器
CREATE TRIGGER tr_posts_insert
AFTER INSERT ON posts
FOR EACH ROW
BEGIN
    UPDATE users SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
END//

CREATE TRIGGER tr_posts_delete
AFTER DELETE ON posts
FOR EACH ROW
BEGIN
    UPDATE users SET posts_count = posts_count - 1 WHERE id = OLD.user_id;
END//

-- 5.3 sounds 表触发器
CREATE TRIGGER tr_sounds_insert
AFTER INSERT ON sounds
FOR EACH ROW
BEGIN
    UPDATE users SET sounds_count = sounds_count + 1 WHERE id = NEW.user_id;
END//

CREATE TRIGGER tr_sounds_delete
AFTER DELETE ON sounds
FOR EACH ROW
BEGIN
    UPDATE users SET sounds_count = sounds_count - 1 WHERE id = OLD.user_id;
END//

-- 5.4 likes 表触发器
CREATE TRIGGER tr_likes_insert
AFTER INSERT ON likes
FOR EACH ROW
BEGIN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    UPDATE users u 
    JOIN posts p ON u.id = p.user_id 
    SET u.likes_received_count = u.likes_received_count + 1 
    WHERE p.id = NEW.post_id;
END//

CREATE TRIGGER tr_likes_delete
AFTER DELETE ON likes
FOR EACH ROW
BEGIN
    UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    UPDATE users u 
    JOIN posts p ON u.id = p.user_id 
    SET u.likes_received_count = u.likes_received_count - 1 
    WHERE p.id = OLD.post_id;
END//

-- 5.5 comments 表触发器
CREATE TRIGGER tr_comments_insert
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    UPDATE users u 
    JOIN posts p ON u.id = p.user_id 
    SET u.comments_received_count = u.comments_received_count + 1 
    WHERE p.id = NEW.post_id;
END//

CREATE TRIGGER tr_comments_delete
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    UPDATE users u 
    JOIN posts p ON u.id = p.user_id 
    SET u.comments_received_count = u.comments_received_count - 1 
    WHERE p.id = OLD.post_id;
END//

DELIMITER ;

-- ============================================
-- 6. 创建视图简化复杂查询
-- ============================================

-- 6.1 用户完整信息视图（包含统计数据）
DROP VIEW IF EXISTS v_user_stats;
CREATE VIEW v_user_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.avatar,
    u.created_at,
    u.posts_count,
    u.sounds_count,
    u.followers_count,
    u.following_count,
    u.likes_received_count,
    u.comments_received_count
FROM users u;

-- 6.2 帖子完整信息视图
DROP VIEW IF EXISTS v_post_details;
CREATE VIEW v_post_details AS
SELECT 
    p.id,
    p.user_id,
    p.sound_id,
    p.content,
    p.image_url,
    p.created_at,
    p.like_count,
    p.comment_count,
    u.username,
    u.avatar
FROM posts p
JOIN users u ON p.user_id = u.id;

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

SELECT '数据库优化脚本执行完成！' as result;
