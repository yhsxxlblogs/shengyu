/**
 * 安全中间件集合
 * 包含XSS防护、输入验证、错误处理等
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

// ========== XSS防护 ==========
const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return unsafe;
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const xssMiddleware = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = escapeHtml(req.body[key]);
      }
    });
  }
  next();
};

// ========== 输入验证 ==========
const schemas = {
  login: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).max(100).required(),
    captchaToken: Joi.string().required(),
    captchaCode: Joi.string().length(4).required()
  }),
  
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().max(100).required(),
    password: Joi.string().min(6).max(100).required()
  }),
  
  post: Joi.object({
    content: Joi.string().max(1000).allow(''),
    sound_url: Joi.string().uri().max(500).allow(null, '')
  }),
  
  comment: Joi.object({
    content: Joi.string().min(1).max(500).required()
  }),
  
  message: Joi.object({
    receiver_id: Joi.number().integer().positive().required(),
    content: Joi.string().min(1).max(1000).required()
  })
};

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

// ========== 速率限制 ==========
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP限制100个请求
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 登录尝试限制
  skipSuccessfulRequests: true,
  message: { error: '登录尝试次数过多，请15分钟后再试' }
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 严格限制
  message: { error: '请求过于频繁' }
});

// ========== 错误处理 ==========
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 不暴露敏感信息
  const statusCode = err.status || 500;
  const message = isDevelopment ? err.message : '服务器内部错误';
  
  res.status(statusCode).json({
    error: message,
    ...(isDevelopment && { stack: err.stack })
  });
};

// ========== 安全响应头 ==========
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "http:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
});

// ========== 密码验证 ==========
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push('密码长度至少8位');
  }
  if (!hasUpperCase || !hasLowerCase) {
    errors.push('密码必须包含大小写字母');
  }
  if (!hasNumbers) {
    errors.push('密码必须包含数字');
  }
  if (!hasSpecialChar) {
    errors.push('密码必须包含特殊字符');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// ========== 输入清理 ==========
const sanitizeInput = (input, maxLength = 100) => {
  if (!input || typeof input !== 'string') return '';
  // 限制长度
  let sanitized = input.slice(0, maxLength);
  // 转义SQL通配符
  sanitized = sanitized.replace(/[%_\\]/g, '\\$&');
  return sanitized;
};

// ========== 安全日志 ==========
const safeLog = (obj) => {
  const sensitiveFields = ['password', 'token', 'secret', 'credit_card', 'cvv', 'ssn'];
  const safe = { ...obj };
  sensitiveFields.forEach(field => {
    if (safe[field]) safe[field] = '***';
  });
  return safe;
};

module.exports = {
  // XSS防护
  escapeHtml,
  xssMiddleware,
  
  // 输入验证
  schemas,
  validate,
  
  // 速率限制
  apiLimiter,
  authLimiter,
  strictLimiter,
  
  // 错误处理
  errorHandler,
  
  // 安全响应头
  helmetConfig,
  
  // 密码验证
  validatePassword,
  
  // 输入清理
  sanitizeInput,
  
  // 安全日志
  safeLog
};
