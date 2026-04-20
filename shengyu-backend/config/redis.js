const redis = require('redis');

// 创建Redis客户端
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '@Syh20050608',
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis服务器连接被拒绝');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('重试时间超过1小时');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// 连接事件
client.on('connect', () => {
  console.log('Redis连接成功');
});

client.on('error', (err) => {
  console.error('Redis错误:', err);
});

// 包装异步方法
const getAsync = (key) => {
  return new Promise((resolve, reject) => {
    client.get(key, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const setAsync = (key, value, expireSeconds = null) => {
  return new Promise((resolve, reject) => {
    if (expireSeconds) {
      client.setex(key, expireSeconds, value, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    } else {
      client.set(key, value, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }
  });
};

const delAsync = (key) => {
  return new Promise((resolve, reject) => {
    client.del(key, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const existsAsync = (key) => {
  return new Promise((resolve, reject) => {
    client.exists(key, (err, result) => {
      if (err) reject(err);
      else resolve(result === 1);
    });
  });
};

// 缓存键前缀
const CACHE_KEYS = {
  USER_FOLLOWS: 'user:follows:',
  USER_FOLLOWERS: 'user:followers:',
  USER_STATS: 'user:stats:',
  POST_DETAIL: 'post:detail:',
  POSTS_LIST: 'posts:list:',
  POPULAR_SOUNDS: 'sounds:popular',
  UNREAD_COUNT: 'messages:unread:',
  FOLLOW_STATS: 'follow:stats:'
};

// 缓存过期时间（秒）
const CACHE_TTL = {
  USER_FOLLOWS: 300,      // 5分钟
  USER_FOLLOWERS: 300,
  USER_STATS: 60,         // 1分钟
  POST_DETAIL: 300,
  POSTS_LIST: 60,
  POPULAR_SOUNDS: 600,    // 10分钟
  UNREAD_COUNT: 30,       // 30秒
  FOLLOW_STATS: 60
};

module.exports = {
  client,
  getAsync,
  setAsync,
  delAsync,
  existsAsync,
  CACHE_KEYS,
  CACHE_TTL
};
