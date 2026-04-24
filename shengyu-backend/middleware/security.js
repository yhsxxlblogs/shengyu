/**
 * 安全中间件
 * 包含管理员认证、请求验证、XSS防护等功能
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * JWT认证中间件
 * 验证请求中的JWT Token
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供访问令牌' });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: '令牌已过期', code: 'TOKEN_EXPIRED' });
      }
      return res.status(403).json({ error: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

/**
 * 管理员认证中间件
 * 验证用户是否为管理员
 */
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未提供访问令牌' });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效' });
    }
    
    if (!user.is_admin) {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    req.user = user;
    next();
  });
};

/**
 * 可选认证中间件
 * 验证token（如果存在），但不强制要求
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

/**
 * XSS防护 - 清理用户输入
 * @param {string} input - 用户输入
 * @returns {string} 清理后的字符串
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .replace(/`/g, '&#96;');
};

/**
 * 请求体清理中间件
 * 清理请求体中的潜在XSS代码
 */
const sanitizeRequestBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeObject = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeInput(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };
    sanitizeObject(req.body);
  }
  next();
};

/**
 * 参数验证中间件
 * 验证请求参数是否存在且有效
 */
const validateParams = (requiredParams) => {
  return (req, res, next) => {
    const missing = [];
    const params = { ...req.body, ...req.params, ...req.query };
    
    for (const param of requiredParams) {
      if (params[param] === undefined || params[param] === null || params[param] === '') {
        missing.push(param);
      }
    }
    
    if (missing.length > 0) {
      return res.status(400).json({ 
        error: '缺少必要参数', 
        missing: missing 
      });
    }
    
    next();
  };
};

/**
 * SQL注入检测
 * 检测字符串中是否包含SQL注入特征
 */
const detectSqlInjection = (input) => {
  if (typeof input !== 'string') return false;
  
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /UNION\s+SELECT/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /DROP\s+TABLE/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * SQL注入防护中间件
 */
const sqlInjectionProtection = (req, res, next) => {
  const checkObject = (obj, path = '') => {
    for (const key in obj) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof obj[key] === 'string') {
        if (detectSqlInjection(obj[key])) {
          return { detected: true, path: currentPath, value: obj[key] };
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        const result = checkObject(obj[key], currentPath);
        if (result.detected) return result;
      }
    }
    return { detected: false };
  };
  
  const bodyCheck = req.body ? checkObject(req.body) : { detected: false };
  const queryCheck = req.query ? checkObject(req.query) : { detected: false };
  const paramsCheck = req.params ? checkObject(req.params) : { detected: false };
  
  if (bodyCheck.detected || queryCheck.detected || paramsCheck.detected) {
    const violation = bodyCheck.detected ? bodyCheck : (queryCheck.detected ? queryCheck : paramsCheck);
    console.warn(`SQL注入检测: ${violation.path} = ${violation.value}`);
    return res.status(403).json({ error: '请求包含非法字符' });
  }
  
  next();
};

/**
 * 文件路径安全验证
 * 防止路径遍历攻击
 */
const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') return '';
  
  // 移除路径分隔符和危险字符
  return filename
    .replace(/\\/g, '')
    .replace(/\//g, '')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '');
};

/**
 * 请求大小限制中间件
 */
const requestSizeLimit = (maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length']);
    
    if (contentLength && contentLength > maxSize) {
      return res.status(413).json({ error: '请求体过大' });
    }
    
    next();
  };
};

/**
 * 安全响应头中间件
 */
const securityHeaders = (req, res, next) => {
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS保护
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 禁止MIME类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // 引用策略
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 内容安全策略（生产环境）
  if (config.isProduction) {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' ws: wss:");
  }
  
  next();
};

/**
 * 请求日志中间件
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
    
    if (config.isDevelopment) {
      console.log(`[${new Date().toISOString()}] ${logData.method} ${logData.url} ${logData.status} ${logData.duration}`);
    }
  });
  
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  sanitizeInput,
  sanitizeRequestBody,
  validateParams,
  detectSqlInjection,
  sqlInjectionProtection,
  sanitizeFilename,
  requestSizeLimit,
  securityHeaders,
  requestLogger,
};
