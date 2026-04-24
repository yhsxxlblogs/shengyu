const redis = require('../config/redis');

// 缓存中间件
const cacheMiddleware = (key, ttl = 300) => {
  return async (req, res, next) => {
    const cacheKey = typeof key === 'function' ? key(req) : key;
    
    try {
      const cachedData = await redis.getAsync(cacheKey);
      
      if (cachedData) {
        console.log(`[Cache Hit] ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }
      
      // 保存原始的 res.json 方法
      const originalJson = res.json.bind(res);
      
      // 重写 res.json 方法以缓存响应
      res.json = (data) => {
        // 只缓存成功的响应
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setAsync(cacheKey, JSON.stringify(data), ttl)
            .then(() => console.log(`[Cache Set] ${cacheKey}, TTL: ${ttl}s`))
            .catch(err => console.error('缓存设置失败:', err));
        }
        
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      console.error('缓存中间件错误:', error);
      next();
    }
  };
};

// 清除缓存
const clearCache = async (pattern) => {
  try {
    const keys = await redis.keysAsync(pattern);
    if (keys.length > 0) {
      await redis.delAsync(...keys);
      console.log(`[Cache Clear] 清除 ${keys.length} 个缓存: ${pattern}`);
    }
    return keys.length;
  } catch (error) {
    console.error('清除缓存失败:', error);
    return 0;
  }
};

// 缓存标签清除
const clearCacheByTags = async (tags) => {
  const tagArray = Array.isArray(tags) ? tags : [tags];
  let clearedCount = 0;
  
  for (const tag of tagArray) {
    const count = await clearCache(`*:${tag}:*`);
    clearedCount += count;
  }
  
  return clearedCount;
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearCacheByTags
};
