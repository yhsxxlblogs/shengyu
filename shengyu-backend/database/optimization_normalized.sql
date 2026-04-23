-- ============================================
-- 声愈项目 - 数据库规范化优化脚本 (MySQL 5.7)
-- 遵循第三范式，移除反规范化统计字段
-- 使用索引优化和缓存策略替代
-- ============================================

-- 设置忽略错误继续执行
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. 删除反规范化统计字段
-- ============================================

-- 1.1 移除 users 表的统计字段
ALTER TABLE users 
DROP COLUMN IF EXISTS posts_count,
DROP COLUMN IF EXISTS sounds_count,
DROP COLUMN IF EXISTS followers_count,
DROP COLUMN IF EXISTS following_count,
DROP COLUMN IF EXISTS likes_received_count,
DROP COLUMN IF EXISTS comments_received_count;

-- 1.2 移除 posts 表的统计字段
ALTER TABLE posts
DROP COLUMN IF EXISTS like_count,
DROP COLUMN IF EXISTS comment_count;

-- ============================================
-- 2. 核心索引优化
-- ============================================

-- 2.1 users 表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 2.2 posts 表索引
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at);

-- 2.3 likes 表索引（覆盖点赞查询）
CREATE INDEX IF NOT EXISTS idx_likes_post_user ON likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_created ON likes(post_id, created_at);

-- 2.4 comments 表索引（覆盖评论查询）
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at);

-- 2.5 follows 表索引（覆盖关注查询）
CREATE INDEX IF NOT EXISTS idx_follows_follower_following ON follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_follower ON follows(following_id, follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- 2.6 sounds 表索引
CREATE INDEX IF NOT EXISTS idx_sounds_user_id ON sounds(user_id);
CREATE INDEX IF NOT EXISTS idx_sounds_animal_type ON sounds(animal_type);
CREATE INDEX IF NOT EXISTS idx_sounds_visible ON sounds(visible);
CREATE INDEX IF NOT EXISTS idx_sounds_created_at ON sounds(created_at);

-- 2.7 messages 表索引
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender ON messages(receiver_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 2.8 favorites 表索引
CREATE INDEX IF NOT EXISTS idx_favorites_user_sound ON favorites(user_id, sound_id);
CREATE INDEX IF NOT EXISTS idx_favorites_sound_id ON favorites(sound_id);

-- 2.9 animal_types 表索引
CREATE INDEX IF NOT EXISTS idx_animal_types_category ON animal_types(category);
CREATE INDEX IF NOT EXISTS idx_animal_types_sort ON animal_types(sort_order);

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
-- 5. 创建高效查询函数（可选，用于复杂统计）
-- ============================================

-- 5.1 获取用户统计函数
DELIMITER //

DROP FUNCTION IF EXISTS fn_get_user_stats//
CREATE FUNCTION fn_get_user_stats(user_id INT, stat_type VARCHAR(20))
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE result INT DEFAULT 0;
    
    CASE stat_type
        WHEN 'posts' THEN
            SELECT COUNT(*) INTO result FROM posts WHERE user_id = user_id;
        WHEN 'sounds' THEN
            SELECT COUNT(*) INTO result FROM sounds WHERE user_id = user_id;
        WHEN 'followers' THEN
            SELECT COUNT(*) INTO result FROM follows WHERE following_id = user_id;
        WHEN 'following' THEN
            SELECT COUNT(*) INTO result FROM follows WHERE follower_id = user_id;
        WHEN 'likes_received' THEN
            SELECT COUNT(*) INTO result 
            FROM likes l 
            JOIN posts p ON l.post_id = p.id 
            WHERE p.user_id = user_id;
        WHEN 'comments_received' THEN
            SELECT COUNT(*) INTO result 
            FROM comments c 
            JOIN posts p ON c.post_id = p.id 
            WHERE p.user_id = user_id;
        ELSE
            SET result = 0;
    END CASE;
    
    RETURN result;
END//

-- 5.2 获取帖子统计函数
DROP FUNCTION IF EXISTS fn_get_post_stats//
CREATE FUNCTION fn_get_post_stats(post_id INT, stat_type VARCHAR(20))
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE result INT DEFAULT 0;
    
    CASE stat_type
        WHEN 'likes' THEN
            SELECT COUNT(*) INTO result FROM likes WHERE post_id = post_id;
        WHEN 'comments' THEN
            SELECT COUNT(*) INTO result FROM comments WHERE post_id = post_id;
        ELSE
            SET result = 0;
    END CASE;
    
    RETURN result;
END//

DELIMITER ;

-- ============================================
-- 6. 查询优化提示
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
