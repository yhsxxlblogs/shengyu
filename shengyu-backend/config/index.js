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
    name: 'shengyu',  // 根据你的数据库名修改
    connectionLimit: 10,
    charset: 'utf8mb4',
  },

  // Redis配置
  redis: {
    host: 'localhost',
    port: 6379,
    password: '@Syh20050608',  // 你的Redis密码
    db: 0,
  },

  // JWT配置
  jwt: {
    secret: 'shengyu_secret_key_change_in_production_2024',
    expiresIn: '1d',
    refreshExpiresIn: '7d',
  },

  // 安全配置
  security: {
    // 允许的域名
    allowedOrigins: ['http://localhost:5173', 'http://localhost:3000', 'http://shengyu.supersyh.xyz'],
    
    // 速率限制
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15分钟
      maxRequests: 100,
    },
    
    // Bcrypt配置
    bcryptRounds: 10,
    
    // 验证码配置
    captchaExpiry: 5 * 60 * 1000, // 5分钟
  },

  // 文件上传配置
  upload: {
    path: path.join(__dirname, '../uploads'),
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxImageSize: 2 * 1024 * 1024, // 2MB
    maxSoundSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: /jpeg|jpg|png|gif|webp/,
    allowedSoundTypes: /wav|mp3|ogg|aac|flac|m4a|webm/,
  },

  // 微信配置 - 需要填写你的微信开放平台配置
  wechat: {
    appId: '',  // 填写你的微信AppID
    appSecret: '',  // 填写你的微信AppSecret
  },

  // 日志配置
  log: {
    level: 'info',
    file: './logs/app.log',
  },

  // 管理员配置
  admin: {
    username: 'admin',
    password: '',
    email: 'admin@example.com',
  },
};

module.exports = config;
