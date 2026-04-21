/**
 * 安全配置
 * 包含JWT密钥、CORS配置、文件上传限制等
 */

require('dotenv').config();
const crypto = require('crypto');

// JWT配置
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  refreshExpiresIn: '7d'
};

// CORS配置
const CORS_CONFIG = {
  allowedOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://shengyu.supersyh.xyz',
    'https://shengyu.supersyh.xyz',
    'http://localhost'
  ],
  
  corsOptions: {
    origin: (origin, callback) => {
      // 允许没有origin的请求（如移动应用）
      if (!origin || CORS_CONFIG.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('CORS拒绝:', origin);
        callback(new Error('不允许的Origin'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }
};

// 文件上传配置
const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxImageSize: 2 * 1024 * 1024, // 2MB
  maxSoundSize: 10 * 1024 * 1024, // 10MB
  
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedSoundTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  
  // 文件签名验证
  fileSignatures: {
    'image/jpeg': ['FFD8FF'],
    'image/png': ['89504E47'],
    'image/gif': ['47494638'],
    'image/webp': ['52494646'],
    'audio/mpeg': ['494433', 'FFE3', 'FFE0'],
    'audio/wav': ['52494646'],
    'audio/ogg': ['4F676753'],
    'audio/webm': ['1A45DFA3']
  }
};

// 速率限制配置
const RATE_LIMIT_CONFIG = {
  // API通用限制
  api: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100
  },
  
  // 认证相关限制
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true
  },
  
  // 严格限制（敏感操作）
  strict: {
    windowMs: 60 * 1000, // 1分钟
    max: 10
  },
  
  // 上传限制
  upload: {
    windowMs: 60 * 1000,
    max: 5
  }
};

// 输入限制配置
const INPUT_CONFIG = {
  maxSearchLength: 100,
  maxContentLength: 1000,
  maxCommentLength: 500,
  maxMessageLength: 1000,
  maxUsernameLength: 30,
  maxPasswordLength: 100
};

// WebSocket配置
const WEBSOCKET_CONFIG = {
  allowedOrigins: CORS_CONFIG.allowedOrigins,
  pingInterval: 30000, // 30秒
  pingTimeout: 5000 // 5秒
};

// 安全响应头配置
const SECURITY_HEADERS = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "http:", "https:"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

// 验证码配置
const CAPTCHA_CONFIG = {
  expiresIn: 5 * 60 * 1000, // 5分钟
  length: 4,
  width: 120,
  height: 40,
  noise: 2,
  color: true,
  background: '#f0f0f0'
};

// 会话配置
const SESSION_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // 24小时
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict'
};

module.exports = {
  JWT_CONFIG,
  CORS_CONFIG,
  UPLOAD_CONFIG,
  RATE_LIMIT_CONFIG,
  INPUT_CONFIG,
  WEBSOCKET_CONFIG,
  SECURITY_HEADERS,
  CAPTCHA_CONFIG,
  SESSION_CONFIG
};
