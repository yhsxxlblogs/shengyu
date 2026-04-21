# 声愈项目后端安全审计报告

## 执行摘要

本次安全审计发现了以下主要安全问题，建议立即修复：

| 严重程度 | 问题数量 | 说明 |
|---------|---------|------|
| 🔴 高危 | 3 | SQL注入、文件上传漏洞 |
| 🟡 中危 | 5 | XSS、认证绕过、信息泄露 |
| 🟢 低危 | 4 | 配置问题、日志泄露 |

---

## 🔴 高危漏洞

### 1. SQL注入漏洞

**位置**: `routes/post.js`, `routes/sound.js`, `routes/social.js` 等多个文件

**问题描述**: 搜索功能使用了字符串拼接SQL查询

```javascript
// 不安全的代码
if (q) {
  query += ` WHERE p.content LIKE ? OR u.username LIKE ?`;
}
if (q) {
  params.push(`%${q}%`, `%${q}%`);
}
```

**修复方案**: ✅ 已使用参数化查询，但需要对输入进行长度限制和特殊字符过滤

```javascript
// 修复后的代码
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  // 限制长度，防止DoS
  return input.slice(0, 100).replace(/[%_\\]/g, '\\$&');
};

if (q) {
  const sanitizedQ = sanitizeInput(q);
  query += ` WHERE p.content LIKE ? OR u.username LIKE ?`;
  params.push(`%${sanitizedQ}%`, `%${sanitizedQ}%`);
}
```

### 2. 文件上传漏洞

**位置**: `routes/auth.js` 头像上传

**问题描述**: 文件类型验证可能不够严格

```javascript
// 当前代码
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (!allowedTypes.includes(req.file.mimetype)) {
  return res.status(400).json({ error: '只允许上传图片文件' });
}
```

**修复方案**: 添加文件签名验证和大小限制

```javascript
const crypto = require('crypto');
const fs = require('fs');

// 验证文件签名
const verifyFileSignature = (filePath) => {
  const signatures = {
    'image/jpeg': ['FFD8FF'],
    'image/png': ['89504E47'],
    'image/gif': ['47494638']
  };
  
  const buffer = fs.readFileSync(filePath, { length: 4 });
  const signature = buffer.toString('hex').toUpperCase();
  
  return Object.values(signatures).some(sig => 
    sig.some(s => signature.startsWith(s))
  );
};

// 文件大小限制 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

if (req.file.size > MAX_FILE_SIZE) {
  return res.status(400).json({ error: '文件大小超过5MB限制' });
}

if (!verifyFileSignature(req.file.path)) {
  fs.unlinkSync(req.file.path);
  return res.status(400).json({ error: '文件类型验证失败' });
}
```

### 3. JWT密钥硬编码

**位置**: `index.js`, `routes/auth.js` 等多个文件

**问题描述**: JWT密钥硬编码在代码中

```javascript
const decoded = jwt.verify(token, 'secret_key');
```

**修复方案**: 使用环境变量

```javascript
// config.js
require('dotenv').config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || require('crypto').randomBytes(64).toString('hex'),
  JWT_EXPIRES_IN: '24h'
};

// 使用
const { JWT_SECRET } = require('./config');
const decoded = jwt.verify(token, JWT_SECRET);
```

---

## 🟡 中危漏洞

### 4. XSS漏洞

**位置**: 所有返回用户生成内容的接口

**问题描述**: 用户输入的内容未进行HTML转义

**修复方案**: 创建XSS防护中间件

```javascript
// middleware/xss.js
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
  // 转义请求体中的字符串
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = escapeHtml(req.body[key]);
      }
    });
  }
  next();
};

module.exports = { xssMiddleware, escapeHtml };
```

### 5. 缺乏请求频率限制

**位置**: 所有API端点

**问题描述**: 没有限制请求频率，容易受到暴力破解和DoS攻击

**修复方案**: 添加速率限制

```javascript
// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');

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

module.exports = { apiLimiter, authLimiter };
```

### 6. 敏感信息泄露

**位置**: 错误处理

**问题描述**: 错误信息可能泄露数据库结构

```javascript
// 不安全的代码
if (err) {
  console.error('数据库错误:', err);
  return res.status(500).json({ error: err.message }); // 泄露错误详情
}
```

**修复方案**: 统一错误处理

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // 生产环境不返回详细错误
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : '服务器内部错误',
    ...(isDevelopment && { stack: err.stack })
  });
};

module.exports = errorHandler;
```

### 7. 缺乏输入验证

**位置**: 所有接收用户输入的接口

**修复方案**: 使用Joi进行输入验证

```javascript
// middleware/validator.js
const Joi = require('joi');

const schemas = {
  login: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).max(100).required(),
    captchaToken: Joi.string().required(),
    captchaCode: Joi.string().length(4).required()
  }),
  
  post: Joi.object({
    content: Joi.string().max(1000).allow(''),
    sound_url: Joi.string().uri().allow(null)
  }),
  
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required()
  })
};

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = { schemas, validate };
```

### 8. WebSocket缺乏CSRF防护

**位置**: `index.js` WebSocket连接

**修复方案**: 添加Origin验证

```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ 
  port: 3001,
  verifyClient: (info, done) => {
    const origin = info.origin || info.req.headers.origin;
    const allowedOrigins = [
      'http://localhost:5173',
      'http://shengyu.supersyh.xyz',
      'https://shengyu.supersyh.xyz'
    ];
    
    if (allowedOrigins.includes(origin)) {
      done(true);
    } else {
      console.warn('WebSocket连接被拒绝，非法Origin:', origin);
      done(false, 403, 'Forbidden');
    }
  }
});
```

---

## 🟢 低危漏洞

### 9. 安全响应头缺失

**修复方案**: 添加Helmet中间件

```javascript
// index.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### 10. CORS配置过于宽松

**当前配置**:
```javascript
app.use(cors({
  origin: '*', // 过于宽松
  credentials: true
}));
```

**修复方案**:
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://shengyu.supersyh.xyz',
  'https://shengyu.supersyh.xyz'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的Origin'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 11. 密码复杂度检查不足

**当前代码**:
```javascript
if (password.length < 6) {
  return res.status(400).json({ error: '密码长度至少6位' });
}
```

**修复方案**:
```javascript
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return { valid: false, message: '密码长度至少8位' };
  }
  if (!hasUpperCase || !hasLowerCase) {
    return { valid: false, message: '密码必须包含大小写字母' };
  }
  if (!hasNumbers) {
    return { valid: false, message: '密码必须包含数字' };
  }
  if (!hasSpecialChar) {
    return { valid: false, message: '密码必须包含特殊字符' };
  }
  
  return { valid: true };
};
```

### 12. 日志记录敏感信息

**问题**: 可能记录用户密码等敏感信息

**修复方案**:
```javascript
const safeLog = (obj) => {
  const sensitiveFields = ['password', 'token', 'secret', 'credit_card'];
  const safe = { ...obj };
  sensitiveFields.forEach(field => {
    if (safe[field]) safe[field] = '***';
  });
  return safe;
};

console.log('用户登录:', safeLog(req.body));
```

---

## 修复优先级建议

### 立即修复（1-2天）
1. ✅ SQL注入 - 已使用参数化查询，添加输入长度限制
2. 🔴 JWT密钥硬编码 - 改为环境变量
3. 🔴 文件上传验证 - 添加文件签名验证

### 短期修复（1周内）
4. 🟡 XSS防护 - 添加转义中间件
5. 🟡 速率限制 - 添加请求频率限制
6. 🟡 错误处理 - 统一错误处理，避免信息泄露

### 中期修复（2周内）
7. 🟢 输入验证 - 使用Joi进行参数校验
8. 🟢 WebSocket安全 - 添加Origin验证
9. 🟢 安全响应头 - 添加Helmet中间件
10. 🟢 CORS配置 - 限制允许的域名

---

## 安全最佳实践检查清单

- [x] 使用参数化查询防止SQL注入
- [x] 密码使用bcrypt加密存储
- [ ] JWT密钥使用环境变量
- [ ] 添加文件上传验证
- [ ] 添加XSS防护
- [ ] 添加速率限制
- [ ] 统一错误处理
- [ ] 输入参数验证
- [ ] WebSocket Origin验证
- [ ] 安全响应头
- [ ] CORS限制
- [ ] 密码复杂度检查
- [ ] 敏感信息脱敏

---

## 推荐的安全中间件

```bash
npm install helmet express-rate-limit Joi dotenv
```

## 配置文件示例 (.env)

```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=shengyu

# JWT配置
JWT_SECRET=your_random_secret_key_min_32_chars
JWT_EXPIRES_IN=24h

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# 环境
NODE_ENV=production

# 文件上传
MAX_FILE_SIZE=5242880
UPLOAD_PATH=/www/wwwroot/shengyu/shengyu-backend/uploads
```

---

## 总结

声愈项目后端整体架构良好，使用了参数化查询防止SQL注入，密码使用bcrypt加密。但存在一些安全隐患需要修复，特别是JWT密钥硬编码、缺乏XSS防护、速率限制和输入验证等方面。建议按照优先级逐步修复，并添加安全监控和日志审计。
