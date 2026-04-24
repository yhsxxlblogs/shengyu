const redis = require('redis');
const config = require('./index');

// 创建 Redis 客户端
const client = redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  db: config.redis.db,
  retry_strategy: function(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('Redis 连接被拒绝');
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
  console.log('Redis 连接成功');
});

client.on('error', (err) => {
  console.error('Redis 错误:', err);
});

// 将 Redis 方法转换为 Promise
const getAsync = (key) => {
  return new Promise((resolve, reject) => {
    client.get(key, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const setAsync = (key, value, ttl) => {
  return new Promise((resolve, reject) => {
    if (ttl) {
      client.setex(key, ttl, value, (err, result) => {
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

const delAsync = (...keys) => {
  return new Promise((resolve, reject) => {
    client.del(keys, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const keysAsync = (pattern) => {
  return new Promise((resolve, reject) => {
    client.keys(pattern, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const existsAsync = (key) => {
  return new Promise((resolve, reject) => {
    client.exists(key, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const expireAsync = (key, seconds) => {
  return new Promise((resolve, reject) => {
    client.expire(key, seconds, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const ttlAsync = (key) => {
  return new Promise((resolve, reject) => {
    client.ttl(key, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

module.exports = {
  client,
  getAsync,
  setAsync,
  delAsync,
  keysAsync,
  existsAsync,
  expireAsync,
  ttlAsync
};
