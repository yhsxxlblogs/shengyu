let redisModule;
let redisAvailable = false;

try {
  redisModule = require('../config/redis');
  redisAvailable = true;
} catch (error) {
  console.warn('Redis模块加载失败，缓存功能将不可用:', error.message);
  redisModule = {
    getAsync: () => Promise.resolve(null),
    setAsync: () => Promise.resolve(),
    delAsync: () => Promise.resolve(),
    client: null,
    CACHE_KEYS: {},
    CACHE_TTL: {}
  };
}

const { getAsync, setAsync, delAsync, client, CACHE_KEYS, CACHE_TTL } = redisModule;

/**
 * 缓存中间件 - 用于缓存API响应
 * @param {string} keyPrefix - 缓存键前缀
 * @param {number} ttl - 缓存过期时间（秒）
 * @param {function} keyGenerator - 生成缓存键的函数
 */
const cacheMiddleware = (keyPrefix, ttl, keyGenerator = null) => {
  return async (req, res, next) => {
    // 如果Redis不可用，直接跳过缓存
    if (!redisAvailable) {
      return next();
    }

    try {
      // 生成缓存键
      let cacheKey;
      if (keyGenerator) {
        cacheKey = keyPrefix + keyGenerator(req);
      } else {
        cacheKey = keyPrefix + (req.params.id || req.params.userId || req.params.post_id || 'default');
      }

      // 尝试从缓存获取
      const cachedData = await getAsync(cacheKey);
      if (cachedData) {
        console.log(`[Cache Hit] ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      // 缓存未命中，继续处理请求
      console.log(`[Cache Miss] ${cacheKey}`);
      
      // 重写res.json方法以缓存响应
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // 只缓存成功的响应
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setAsync(cacheKey, JSON.stringify(data), ttl).catch(err => {
            console.error('缓存设置失败:', err);
          });
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

/**
 * 清除缓存
 * @param {string} pattern - 缓存键模式（支持通配符）
 */
const clearCache = async (pattern) => {
  if (!redisAvailable || !client) {
    return;
  }
  
  try {
    client.keys(pattern, (err, keys) => {
      if (err) {
        console.error('获取缓存键失败:', err);
        return;
      }
      if (keys.length > 0) {
        client.del(keys, (err) => {
          if (err) {
            console.error('清除缓存失败:', err);
          } else {
            console.log(`[Cache Clear] 已清除 ${keys.length} 个缓存键，模式: ${pattern}`);
          }
        });
      }
    });
  } catch (error) {
    console.error('清除缓存错误:', error);
  }
};

/**
 * 清除用户相关缓存
 * @param {number} userId - 用户ID
 */
const clearUserCache = async (userId) => {
  await clearCache(`*user*${userId}*`);
  await clearCache(`*follow*${userId}*`);
};

/**
 * 清除帖子相关缓存
 * @param {number} postId - 帖子ID
 */
const clearPostCache = async (postId) => {
  await clearCache(`*post*${postId}*`);
  await clearCache('posts:list:*');
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearUserCache,
  clearPostCache,
  CACHE_KEYS,
  CACHE_TTL
};
