/**
 * 声愈项目配置文件
 * 集中管理所有配置项，支持环境变量覆盖
 */

const path = require('path');

// 加载环境变量
require('dotenv').config();

// 默认配置
const config = {
  // 环境
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // 服务器配置
  server: {
    port: parseInt(process.env.PORT) || 3000,
    wsPort: parseInt(process.env.WS_PORT) || 3001,
    host: process.env.HOST || '0.0.0.0',
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '@Syh20050608',
    name: process.env.DB_NAME || 'animal_sound_app',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    charset: 'utf8mb4',
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
  },

  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'shengyu_secret_key_change_in_production_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // 安全配置
  security: {
    // 允许的域名
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:5173', 'http://localhost:3000', 'http://shengyu.supersyh.xyz'],
    
    // 速率限制
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
    
    // Bcrypt配置
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    
    // 验证码配置
    captchaExpiry: 5 * 60 * 1000, // 5分钟
  },

  // 文件上传配置
  upload: {
    path: process.env.UPLOAD_PATH || path.join(__dirname, '../uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    maxImageSize: parseInt(process.env.MAX_IMAGE_SIZE) || 2 * 1024 * 1024, // 2MB
    maxSoundSize: parseInt(process.env.MAX_SOUND_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedImageTypes: /jpeg|jpg|png|gif|webp/,
    allowedSoundTypes: /wav|mp3|ogg|aac|flac|m4a|webm/,
  },

  // 微信配置
  wechat: {
    appId: process.env.WECHAT_APP_ID || '',
    appSecret: process.env.WECHAT_APP_SECRET || '',
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },

  // 管理员配置
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || '',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
  },
};

// 生产环境安全检查
if (config.isProduction) {
  // 检查JWT密钥是否使用默认值
  if (config.jwt.secret === 'shengyu_secret_key_change_in_production_2024') {
    console.warn('警告: 生产环境正在使用默认JWT密钥，请设置 JWT_SECRET 环境变量');
  }
  
  // 检查数据库密码
  if (!config.database.password || config.database.password === '@Syh20050608') {
    console.warn('警告: 生产环境正在使用默认数据库密码，请设置 DB_PASSWORD 环境变量');
  }
  
  // 检查微信配置
  if (!config.wechat.appId || !config.wechat.appSecret) {
    console.warn('警告: 微信配置不完整，请设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET');
  }
}

module.exports = config;
