const crypto = require('crypto');

// 存储验证码的内存存储（生产环境建议使用 Redis）
const captchaStore = new Map();

// 验证码有效期（5分钟）
const CAPTCHA_EXPIRY = 5 * 60 * 1000;

// 生成随机验证码文本
function generateCaptchaText(length = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆的字符
  let text = '';
  for (let i = 0; i < length; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

// 生成验证码图片的 Base64 字符串
function generateCaptchaImage(text) {
  const width = 120;
  const height = 40;
  const fontSize = 24;
  const canvas = Buffer.alloc(2048); // 预分配缓冲区
  
  // 简单的验证码图片生成（实际项目中可以使用 Canvas 库）
  // 这里返回一个包含验证码的 SVG 图片
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f5f5f5"/>
      ${Array.from({ length: 5 }).map((_, i) => `
        <line 
          x1="${Math.random() * width}" 
          y1="${Math.random() * height}" 
          x2="${Math.random() * width}" 
          y2="${Math.random() * height}" 
          stroke="#ddd" 
          stroke-width="1" 
        />
      `).join('')}
      ${text.split('').map((char, index) => `
        <text 
          x="${20 + index * 25}" 
          y="${height / 2 + fontSize / 3}" 
          font-size="${fontSize}" 
          font-family="Arial, sans-serif" 
          fill="#333" 
          transform="rotate(${Math.random() * 20 - 10}, ${20 + index * 25}, ${height / 2})"
        >
          ${char}
        </text>
      `).join('')}
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// 生成验证码
exports.generateCaptcha = function() {
  const text = generateCaptchaText();
  const image = generateCaptchaImage(text);
  const token = crypto.randomBytes(16).toString('hex');
  
  // 存储验证码
  captchaStore.set(token, {
    text: text.toLowerCase(),
    createdAt: Date.now()
  });
  
  // 清理过期验证码
  setTimeout(() => {
    captchaStore.delete(token);
  }, CAPTCHA_EXPIRY);
  
  return {
    token,
    image
  };
};

// 验证验证码
exports.verifyCaptcha = function(token, input) {
  const captcha = captchaStore.get(token);
  if (!captcha) {
    return false;
  }
  
  // 检查是否过期
  if (Date.now() - captcha.createdAt > CAPTCHA_EXPIRY) {
    captchaStore.delete(token);
    return false;
  }
  
  const isValid = captcha.text === input.toLowerCase();
  
  // 验证后删除验证码
  captchaStore.delete(token);
  
  return isValid;
};

// 清理过期验证码（定期执行）
exports.cleanupExpiredCaptchas = function() {
  const now = Date.now();
  for (const [token, captcha] of captchaStore.entries()) {
    if (now - captcha.createdAt > CAPTCHA_EXPIRY) {
      captchaStore.delete(token);
    }
  }
};

// 每30秒清理一次过期验证码
setInterval(exports.cleanupExpiredCaptchas, 30000);
