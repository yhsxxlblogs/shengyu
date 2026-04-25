/**
 * 声愈项目配置文件
 * 直接配置，不使用dotenv
 */

const path = require('path');

// 默认配置
const config = {
  // 环境
  env: 'production',
  isDevelopment: false,
  isProduction: true,

  // 服务器配置
  server: {
    port: 3000,
    wsPort: 3001,
    host: '0.0.0.0',
  },

  // 数据库配置
  database: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '@Syh20050608',
    name: 'animal_sound_app',
    connectionLimit: 10,
    charset: 'utf8mb4',
  },

  // Redis配置
  redis: {
    host: 'localhost',
    port: 6379,
    password: '',  // 无密码
    db: 0,
  },

  // JWT配置
  jwt: {
    secret: 'secret_key',
    expiresIn: '1d',
    refreshExpiresIn: '7d',
  },

  // 安全配置
  security: {
    // 允许的域名
    allowedOrigins: ['http://localhost:5173', 'http://localhost:3000', 'http://shengyu.supersyh.xyz'],
    
    // 速率限制
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 100,
    },
    
    // Bcrypt配置
    bcryptRounds: 10,
    
    // 验证码配置
    captchaExpiry: 5 * 60 * 1000,
  },

  // 文件上传配置
  upload: {
    path: '/www/wwwroot/shengyu/shengyu-backend/uploads',
    maxFileSize: 100 * 1024 * 1024,  // 100MB
    maxImageSize: 100 * 1024 * 1024, // 100MB，支持大图片上传
    maxSoundSize: 100 * 1024 * 1024, // 100MB
    allowedImageTypes: /jpeg|jpg|png|gif|webp/,
    allowedSoundTypes: /wav|mp3|ogg|aac|flac|m4a|webm/,
  },

  // 微信配置
  wechat: {
    appId: 'wx4e46471a06b5124c',
    appSecret: 'a4d717bdb57054454be38bcef2756318',
  },

  // 日志配置
  log: {
    level: 'info',
    file: './logs/app.log',
  },
};

module.exports = config;
