-- ============================================
-- 声愈项目 - 数据库规范化优化脚本 (MySQL 5.7)
-- 遵循第三范式，移除反规范化统计字段
-- 使用索引优化和缓存策略替代
-- ============================================

-- 设置忽略错误继续执行
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. 删除反规范化统计字段 (MySQL 5.7 兼容版本)
-- ============================================

-- 1.1 移除 users 表的统计字段
-- 使用存储过程检查列是否存在
DELIMITER //

DROP PROCEDURE IF EXISTS DropColumnIfExists//
CREATE PROCEDURE DropColumnIfExists(IN tableName VARCHAR(64), IN columnName VARCHAR(64))
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = tableName 
        AND column_name = columnName
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' DROP COLUMN ', columnName);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//

DELIMITER ;

-- 删除 users 表的统计字段
CALL DropColumnIfExists('users', 'posts_count');
CALL DropColumnIfExists('users', 'sounds_count');
CALL DropColumnIfExists('users', 'followers_count');
CALL DropColumnIfExists('users', 'following_count');
CALL DropColumnIfExists('users', 'likes_received_count');
CALL DropColumnIfExists('users', 'comments_received_count');

-- 删除 posts 表的统计字段
CALL DropColumnIfExists('posts', 'like_count');
CALL DropColumnIfExists('posts', 'comment_count');

-- 删除存储过程
DROP PROCEDURE IF EXISTS DropColumnIfExists;

-- ============================================
-- 2. 核心索引优化 (MySQL 5.7 兼容版本)
-- ============================================

-- 2.1 users 表索引
-- 检查索引是否存在，不存在则创建
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'users' 
                   AND index_name = 'idx_users_email');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_users_email ON users(email)', 'SELECT "Index idx_users_email already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'users' 
                   AND index_name = 'idx_users_created_at');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_users_created_at ON users(created_at)', 'SELECT "Index idx_users_created_at already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.2 posts 表索引
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'posts' 
                   AND index_name = 'idx_posts_user_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_posts_user_id ON posts(user_id)', 'SELECT "Index idx_posts_user_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'posts' 
                   AND index_name = 'idx_posts_created_at');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_posts_created_at ON posts(created_at)', 'SELECT "Index idx_posts_created_at already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'posts' 
                   AND index_name = 'idx_posts_user_created');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_posts_user_created ON posts(user_id, created_at)', 'SELECT "Index idx_posts_user_created already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.3 likes 表索引
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'likes' 
                   AND index_name = 'idx_likes_post_user');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_likes_post_user ON likes(post_id, user_id)', 'SELECT "Index idx_likes_post_user already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'likes' 
                   AND index_name = 'idx_likes_user_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_likes_user_id ON likes(user_id)', 'SELECT "Index idx_likes_user_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'likes' 
                   AND index_name = 'idx_likes_post_created');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_likes_post_created ON likes(post_id, created_at)', 'SELECT "Index idx_likes_post_created already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.4 comments 表索引
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'comments' 
                   AND index_name = 'idx_comments_post_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_comments_post_id ON comments(post_id)', 'SELECT "Index idx_comments_post_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'comments' 
                   AND index_name = 'idx_comments_user_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_comments_user_id ON comments(user_id)', 'SELECT "Index idx_comments_user_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'comments' 
                   AND index_name = 'idx_comments_post_created');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_comments_post_created ON comments(post_id, created_at)', 'SELECT "Index idx_comments_post_created already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.5 follows 表索引
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'follows' 
                   AND index_name = 'idx_follows_follower_following');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_follows_follower_following ON follows(follower_id, following_id)', 'SELECT "Index idx_follows_follower_following already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'follows' 
                   AND index_name = 'idx_follows_following_follower');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_follows_following_follower ON follows(following_id, follower_id)', 'SELECT "Index idx_follows_following_follower already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'follows' 
                   AND index_name = 'idx_follows_created_at');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_follows_created_at ON follows(created_at)', 'SELECT "Index idx_follows_created_at already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.6 sounds 表索引
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'sounds' 
                   AND index_name = 'idx_sounds_user_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_sounds_user_id ON sounds(user_id)', 'SELECT "Index idx_sounds_user_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'sounds' 
                   AND index_name = 'idx_sounds_animal_type');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_sounds_animal_type ON sounds(animal_type)', 'SELECT "Index idx_sounds_animal_type already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'sounds' 
                   AND index_name = 'idx_sounds_visible');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_sounds_visible ON sounds(visible)', 'SELECT "Index idx_sounds_visible already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'sounds' 
                   AND index_name = 'idx_sounds_created_at');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_sounds_created_at ON sounds(created_at)', 'SELECT "Index idx_sounds_created_at already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.7 messages 表索引
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'messages' 
                   AND index_name = 'idx_messages_sender_receiver');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_messages_sender_receiver ON messages(sender_id, receiver_id)', 'SELECT "Index idx_messages_sender_receiver already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'messages' 
                   AND index_name = 'idx_messages_receiver_sender');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_messages_receiver_sender ON messages(receiver_id, sender_id)', 'SELECT "Index idx_messages_receiver_sender already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'messages' 
                   AND index_name = 'idx_messages_receiver_read');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_messages_receiver_read ON messages(receiver_id, is_read)', 'SELECT "Index idx_messages_receiver_read already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'messages' 
                   AND index_name = 'idx_messages_created_at');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_messages_created_at ON messages(created_at)', 'SELECT "Index idx_messages_created_at already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.8 favorites 表索引
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'favorites' 
                   AND index_name = 'idx_favorites_user_sound');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_favorites_user_sound ON favorites(user_id, sound_id)', 'SELECT "Index idx_favorites_user_sound already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'favorites' 
                   AND index_name = 'idx_favorites_sound_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_favorites_sound_id ON favorites(sound_id)', 'SELECT "Index idx_favorites_sound_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.9 animal_types 表索引
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'animal_types' 
                   AND index_name = 'idx_animal_types_category');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_animal_types_category ON animal_types(category)', 'SELECT "Index idx_animal_types_category already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.statistics 
                   WHERE table_schema = DATABASE() 
                   AND table_name = 'animal_types' 
                   AND index_name = 'idx_animal_types_sort');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_animal_types_sort ON animal_types(sort_order)', 'SELECT "Index idx_animal_types_sort already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. 删除触发器（不再需要维护统计字段）
-- ============================================

DROP TRIGGER IF EXISTS tr_follows_insert;
DROP TRIGGER IF EXISTS tr_follows_delete;
DROP TRIGGER IF EXISTS tr_posts_insert;
DROP TRIGGER IF EXISTS tr_posts_delete;
DROP TRIGGER IF EXISTS tr_sounds_insert;
DROP TRIGGER IF EXISTS tr_sounds_delete;
DROP TRIGGER IF EXISTS tr_likes_insert;
DROP TRIGGER IF EXISTS tr_likes_delete;
DROP TRIGGER IF EXISTS tr_comments_insert;
DROP TRIGGER IF EXISTS tr_comments_delete;

-- ============================================
-- 4. 创建统计视图（用于查询时实时计算）
-- ============================================

-- 4.1 用户统计视图
DROP VIEW IF EXISTS v_user_stats;
CREATE VIEW v_user_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.avatar,
    u.created_at,
    (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) AS posts_count,
    (SELECT COUNT(*) FROM sounds s WHERE s.user_id = u.id) AS sounds_count,
    (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) AS followers_count,
    (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id) AS following_count,
    (SELECT COUNT(*) FROM likes l 
     JOIN posts p ON l.post_id = p.id 
     WHERE p.user_id = u.id) AS likes_received_count,
    (SELECT COUNT(*) FROM comments c 
     JOIN posts p ON c.post_id = p.id 
     WHERE p.user_id = u.id) AS comments_received_count
FROM users u;

-- 4.2 帖子统计视图
DROP VIEW IF EXISTS v_post_stats;
CREATE VIEW v_post_stats AS
SELECT 
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.created_at,
    u.username,
    u.avatar,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
FROM posts p
JOIN users u ON p.user_id = u.id;

-- 4.3 帖子列表视图（带统计，用于首页/社区）
DROP VIEW IF EXISTS v_post_list;
CREATE VIEW v_post_list AS
SELECT 
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.created_at,
    u.username,
    u.avatar,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) + 
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS heat_score
FROM posts p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;

-- 4.4 热门帖子视图（按热度排序）
DROP VIEW IF EXISTS v_popular_posts;
CREATE VIEW v_popular_posts AS
SELECT 
    p.id,
    p.user_id,
    p.content,
    p.image_url,
    p.created_at,
    u.username,
    u.avatar,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
    (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) * 2 + 
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) * 3 AS heat_score
FROM posts p
JOIN users u ON p.user_id = u.id
HAVING heat_score > 0
ORDER BY heat_score DESC, p.created_at DESC;

-- ============================================
-- 5. 查询优化提示
-- ============================================

/*
规范化后的查询建议：

1. 获取用户统计：
   SELECT * FROM v_user_stats WHERE id = ?;
   
2. 获取帖子统计：
   SELECT * FROM v_post_stats WHERE id = ?;
   
3. 获取帖子列表（带统计）：
   SELECT * FROM v_post_list LIMIT 20 OFFSET 0;
   
4. 获取热门帖子：
   SELECT * FROM v_popular_posts LIMIT 10;
   
5. 使用缓存策略：
   - 用户统计：缓存10分钟
   - 帖子统计：缓存5分钟
   - 热门帖子：缓存5分钟，定时更新
*/

-- 恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;

SELECT '数据库规范化优化脚本执行完成！已移除反规范化字段，添加索引优化' as result;
