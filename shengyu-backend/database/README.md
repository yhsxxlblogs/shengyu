# 数据库性能优化方案

## 优化概述

本次数据库优化主要针对声愈项目的高频查询场景，包括：
- 私信消息查询
- 关注/粉丝关系查询
- 帖子列表查询
- 用户统计数据查询

## 优化内容

### 1. 索引优化

为高频查询字段添加索引，显著提升查询性能：

| 表名 | 索引名 | 字段 | 用途 |
|------|--------|------|------|
| messages | idx_messages_sender_receiver | (sender_id, receiver_id) | 加速私信查询 |
| messages | idx_messages_receiver_read | (receiver_id, is_read) | 加速未读数统计 |
| follows | idx_follows_follower_following | (follower_id, following_id) | 加速关注状态检查 |
| posts | idx_posts_user_created | (user_id, created_at) | 加速用户帖子列表 |
| likes | idx_likes_post_user | (post_id, user_id) | 加速点赞状态检查 |

### 2. 反规范化优化

添加冗余统计字段，避免频繁的COUNT(*)查询：

```sql
-- users 表新增字段
posts_count          -- 帖子数
sounds_count         -- 声音数
followers_count      -- 粉丝数
following_count      -- 关注数
likes_received_count -- 获赞数
comments_received_count -- 获评论数

-- posts 表新增字段
like_count           -- 点赞数
comment_count        -- 评论数
```

### 3. 触发器自动维护

创建触发器自动更新统计字段，保持数据一致性：
- `tr_follows_insert/delete` - 自动更新关注/粉丝数
- `tr_posts_insert/delete` - 自动更新帖子数
- `tr_likes_insert/delete` - 自动更新点赞数
- `tr_comments_insert/delete` - 自动更新评论数

### 4. 视图简化查询

创建视图封装复杂查询：
- `v_user_stats` - 用户完整信息（含统计）
- `v_post_details` - 帖子完整信息

## 执行步骤

### 步骤1：备份数据库

```bash
mysqldump -u root -p'@Syh20050608' animal_sound_app > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 步骤2：执行优化脚本

```bash
mysql -u root -p'@Syh20050608' animal_sound_app < optimization.sql
```

### 步骤3：验证优化结果

```sql
-- 查看索引是否创建成功
SHOW INDEX FROM messages;
SHOW INDEX FROM follows;
SHOW INDEX FROM posts;

-- 查看统计字段是否正确
SELECT id, username, posts_count, followers_count, following_count 
FROM users LIMIT 5;

-- 测试查询性能
EXPLAIN SELECT * FROM messages WHERE sender_id = 1 AND receiver_id = 2;
```

## 后端代码修改建议

### 1. 修改用户统计查询

**原代码（social.js）：**
```javascript
// 获取关注数和粉丝数
db.query(
  `SELECT
    (SELECT COUNT(*) FROM follows WHERE follower_id = ?) as following_count,
    (SELECT COUNT(*) FROM follows WHERE following_id = ?) as follower_count`,
  [userId, userId]
);
```

**优化后：**
```javascript
// 直接从users表读取统计字段
db.query(
  'SELECT following_count, followers_count FROM users WHERE id = ?',
  [userId]
);
```

### 2. 修改帖子列表查询

**原代码：**
```javascript
// 需要JOIN likes表统计点赞数
SELECT p.*, 
  (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
  (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
FROM posts p;
```

**优化后：**
```javascript
// 直接读取反规范化字段
SELECT p.*, u.username, u.avatar 
FROM posts p 
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;
```

### 3. 修改私信列表查询

**优化后的查询：**
```javascript
const query = `
  SELECT 
    u.id as user_id,
    u.username,
    u.avatar,
    m.content as last_message,
    m.created_at as last_time,
    m.sender_id as last_sender_id,
    (SELECT COUNT(*) FROM messages 
     USE INDEX(idx_messages_receiver_read)
     WHERE sender_id = u.id AND receiver_id = ? AND is_read = FALSE) as unread_count
  FROM users u
  INNER JOIN (
    SELECT 
      CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_id,
      MAX(id) as last_message_id
    FROM messages
    USE INDEX(idx_messages_sender_receiver)
    WHERE sender_id = ? OR receiver_id = ?
    GROUP BY other_id
  ) latest ON latest.other_id = u.id
  INNER JOIN messages m ON m.id = latest.last_message_id
  ORDER BY m.created_at DESC
  LIMIT ?
`;
```

## 性能提升预期

| 查询场景 | 优化前 | 优化后 | 提升 |
|----------|--------|--------|------|
| 私信列表查询 | 500ms+ | 50ms | 10倍 |
| 关注状态检查 | 100ms | 10ms | 10倍 |
| 用户统计查询 | 300ms | 5ms | 60倍 |
| 帖子列表查询 | 400ms | 30ms | 13倍 |
| 未读消息统计 | 200ms | 20ms | 10倍 |

## 后续优化建议

1. **数据量增长后考虑分区**：当messages表超过100万条时，按时间分区
2. **引入Redis缓存**：缓存用户关注列表、热门帖子等热点数据
3. **读写分离**：数据库压力大时，考虑主从复制分离读写
4. **连接池优化**：根据并发量调整连接池大小

## 注意事项

1. 触发器会增加写入操作的开销，但大幅提升读取性能
2. 统计字段在极端并发下可能有短暂不一致，可接受
3. 定期执行 `ANALYZE TABLE` 更新统计信息
