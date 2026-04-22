
---

## 七、缓存问题解决方案

### 7.1 缓存雪崩 (Cache Avalanche)

**问题描述：**
大量缓存同时过期，导致大量请求直接打到数据库，造成数据库压力过大甚至宕机。

**解决方案：**

#### 1. 随机过期时间
```javascript
// 基础5分钟 + 随机0-5分钟 = 5-10分钟随机过期时间
const baseTTL = 300;
const randomTTL = Math.floor(Math.random() * 300);
const cacheTTL = baseTTL + randomTTL;
await redis.setAsync('popular:posts', JSON.stringify(results), cacheTTL);
```

#### 2. 定时任务提前更新
```javascript
// 每5分钟更新一次缓存，避免缓存过期
setInterval(updatePopularPostsCache, 5 * 60 * 1000);
```

#### 3. 热点数据永不过期
热门帖子使用定时任务更新，不设置过期时间，避免过期瞬间的并发问题。

---

### 7.2 缓存击穿 (Cache Breakdown)

**问题描述：**
热点数据过期瞬间，大量请求同时查询数据库，造成数据库压力突增。

**解决方案：**

#### 1. 互斥锁防止并发重建
```javascript
// 使用Redis分布式锁
const lockKey = 'lock:popular:posts';
const lock = await redis.setAsync(lockKey, '1', 'EX', 10, 'NX');

if (lock) {
  try {
    // 查询数据库并重建缓存
    const results = await db.query(...);
    await redis.setAsync('popular:posts', JSON.stringify(results), 300);
  } finally {
    await redis.delAsync(lockKey);
  }
}
```

#### 2. 热点数据永不过期
```javascript
// 热门帖子使用定时任务每5分钟更新，不设置过期时间
async function updatePopularPostsCache() {
  const results = await db.query(...);
  await redis.setAsync('popular:posts', JSON.stringify(results));
  // 不设置过期时间，由定时任务更新
}
```

#### 3. 异步更新策略
```javascript
// 缓存即将过期时，异步更新缓存
if (ttl < 60) { // 剩余时间小于60秒
  // 异步更新，不阻塞当前请求
  updateCacheAsync(key);
}
```

---

### 7.3 缓存穿透 (Cache Penetration)

**问题描述：**
查询不存在的数据，缓存中没有，数据库中也没有，每次请求都要访问数据库。

**解决方案：**

#### 1. 空值缓存（布隆过滤器替代方案）
```javascript
// 即使结果为空，也缓存空数组
const cacheTTL = results.length > 0 ? 300 : 60; // 空数据缓存60秒
await redis.setAsync('popular:posts', JSON.stringify(results), cacheTTL);

// 读取时判断
const cachedPosts = await redis.getAsync('popular:posts');
if (cachedPosts) {
  const posts = JSON.parse(cachedPosts);
  if (posts.length === 0) {
    return res.status(200).json({ posts: [] }); // 直接返回空数组
  }
  // 处理有数据的情况
}
```

#### 2. 参数校验
```javascript
// 对非法参数进行校验，直接返回错误
if (!postId || isNaN(postId)) {
  return res.status(400).json({ error: '无效的帖子ID' });
}
```

#### 3. 接口限流
```javascript
// 对同一IP的请求进行限流
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100 // 最多100次请求
});
app.use('/api/', limiter);
```

---

### 7.4 实际应用案例

#### 热门帖子缓存实现
```javascript
// routes/post.js - 获取热门帖子
router.get('/popular', async (req, res) => {
  try {
    // 1. 优先从Redis缓存获取
    const cachedPosts = await redis.getAsync('popular:posts');
    
    if (cachedPosts) {
      let posts = JSON.parse(cachedPosts);
      
      // 2. 如果缓存为空数组，直接返回（防止缓存穿透）
      if (posts.length === 0) {
        return res.status(200).json({ posts: [] });
      }
      
      // 3. 处理点赞状态并返回
      // ...
      return res.status(200).json({ posts });
    }

    // 4. 缓存未命中，从数据库查询
    const results = await db.query(...);
    
    // 5. 写入缓存（空数组也缓存，防止缓存穿透）
    // 使用随机过期时间防止缓存雪崩
    const baseTTL = 300; // 基础5分钟
    const randomTTL = Math.floor(Math.random() * 300); // 随机0-5分钟
    const cacheTTL = results.length > 0 ? baseTTL + randomTTL : 60;
    
    await redis.setAsync('popular:posts', JSON.stringify(results), cacheTTL);
    
    res.status(200).json({ posts: results });
  } catch (error) {
    console.error('获取热门帖子出错:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});
```

#### 定时任务更新缓存
```javascript
// index.js - 定时更新热门帖子缓存
async function updatePopularPostsCache() {
  try {
    const results = await db.query(...);
    
    // 使用随机过期时间防止缓存雪崩
    const baseTTL = 300;
    const randomTTL = Math.floor(Math.random() * 300);
    const cacheTTL = results.length > 0 ? baseTTL + randomTTL : 60;
    
    await redis.setAsync('popular:posts', JSON.stringify(results), cacheTTL);
    console.log(`[${new Date().toLocaleString()}] 热门帖子缓存已更新，共 ${results.length} 条，TTL: ${cacheTTL}s`);
  } catch (error) {
    console.error('更新热门帖子缓存出错:', error);
  }
}

// 每5分钟更新一次（防止缓存击穿）
setInterval(updatePopularPostsCache, 5 * 60 * 1000);
updatePopularPostsCache(); // 启动时立即执行
```

---

## 八、性能优化总结

### 8.1 数据库优化
- **索引优化**：常用查询字段建立索引
- **反规范化**：冗余统计字段，减少JOIN查询
- **连接池**：使用连接池管理数据库连接
- **软删除**：使用标记位代替物理删除

### 8.2 Redis缓存优化
- **缓存雪崩**：随机过期时间 + 定时任务更新
- **缓存击穿**：热点数据永不过期 + 互斥锁
- **缓存穿透**：空值缓存 + 参数校验
- **缓存粒度**：合理设置缓存键，避免缓存过大

### 8.3 应用层优化
- **分页查询**：大数据量使用分页，避免一次性加载
- **异步处理**：非关键操作使用异步处理
- **接口限流**：防止恶意请求和突发流量
- **错误降级**：缓存失败时直接查询数据库，不影响主流程

### 8.4 部署优化
- **读写分离**：数据库主从复制，读写分离（可扩展）
- **负载均衡**：多台服务器负载均衡（可扩展）
- **CDN加速**：静态资源使用CDN加速（可扩展）
- **监控告警**：性能监控和异常告警（可扩展）

---

**文档版本：** v1.1  
**更新日期：** 2026-04-22  
**更新内容：** 添加缓存问题解决方案（雪崩、击穿、穿透）
