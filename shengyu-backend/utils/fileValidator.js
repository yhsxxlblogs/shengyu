/**
 * 文件验证工具
 * 用于验证上传文件的类型、大小、签名等
 */

const fs = require('fs');
const path = require('path');
const { UPLOAD_CONFIG } = require('../config/security');

/**
 * 验证文件签名（魔数）
 * @param {string} filePath - 文件路径
 * @param {string} expectedType - 期望的文件类型
 * @returns {boolean} 验证结果
 */
const verifyFileSignature = (filePath, expectedType) => {
  try {
    const buffer = fs.readFileSync(filePath, { length: 8 });
    const signature = buffer.toString('hex').toUpperCase();
    
    const validSignatures = UPLOAD_CONFIG.fileSignatures[expectedType];
    if (!validSignatures) return false;
    
    return validSignatures.some(sig => signature.startsWith(sig));
  } catch (error) {
    console.error('文件签名验证失败:', error);
    return false;
  }
};

/**
 * 验证文件类型
 * @param {Object} file - multer文件对象
 * @param {Array} allowedTypes - 允许的类型列表
 * @returns {Object} 验证结果 { valid: boolean, error?: string }
 */
const validateFileType = (file, allowedTypes) => {
  if (!file) {
    return { valid: false, error: '未找到文件' };
  }
  
  // 验证mimetype
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: `不支持的文件类型: ${file.mimetype}` };
  }
  
  // 验证文件签名
  if (!verifyFileSignature(file.path, file.mimetype)) {
    // 删除可疑文件
    try {
      fs.unlinkSync(file.path);
    } catch (e) {}
    return { valid: false, error: '文件类型验证失败，可能包含恶意内容' };
  }
  
  return { valid: true };
};

/**
 * 验证文件大小
 * @param {Object} file - multer文件对象
 * @param {number} maxSize - 最大大小（字节）
 * @returns {Object} 验证结果
 */
const validateFileSize = (file, maxSize) => {
  if (!file) {
    return { valid: false, error: '未找到文件' };
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return { 
      valid: false, 
      error: `文件大小超过限制: ${fileSizeMB}MB > ${maxSizeMB}MB` 
    };
  }
  
  return { valid: true };
};

/**
 * 验证图片文件
 * @param {Object} file - multer文件对象
 * @returns {Object} 验证结果
 */
const validateImage = (file) => {
  // 验证类型
  const typeResult = validateFileType(file, UPLOAD_CONFIG.allowedImageTypes);
  if (!typeResult.valid) return typeResult;
  
  // 验证大小
  const sizeResult = validateFileSize(file, UPLOAD_CONFIG.maxImageSize);
  if (!sizeResult.valid) return sizeResult;
  
  return { valid: true };
};

/**
 * 验证音频文件
 * @param {Object} file - multer文件对象
 * @returns {Object} 验证结果
 */
const validateSound = (file) => {
  // 验证类型
  const typeResult = validateFileType(file, UPLOAD_CONFIG.allowedSoundTypes);
  if (!typeResult.valid) return typeResult;
  
  // 验证大小
  const sizeResult = validateFileSize(file, UPLOAD_CONFIG.maxSoundSize);
  if (!sizeResult.valid) return sizeResult;
  
  return { valid: true };
};

/**
 * 安全删除文件
 * @param {string} filePath - 文件路径
 */
const safeDeleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('文件已删除:', filePath);
    }
  } catch (error) {
    console.error('删除文件失败:', error);
  }
};

/**
 * 生成安全的文件名
 * @param {string} originalName - 原始文件名
 * @returns {string} 安全的文件名
 */
const generateSafeFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const ext = path.extname(originalName).toLowerCase();
  return `${timestamp}-${random}${ext}`;
};

/**
 * 检查文件名是否安全
 * @param {string} filename - 文件名
 * @returns {boolean} 是否安全
 */
const isSafeFileName = (filename) => {
  // 检查是否包含路径遍历字符
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }
  
  // 检查是否包含非法字符
  const illegalChars = /[<>:"|?*\x00-\x1f]/;
  if (illegalChars.test(filename)) {
    return false;
  }
  
  // 检查是否为隐藏文件
  if (filename.startsWith('.')) {
    return false;
  }
  
  return true;
};

/**
 * 获取文件MIME类型
 * @param {string} filePath - 文件路径
 * @returns {string} MIME类型
 */
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.webm': 'audio/webm'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

module.exports = {
  verifyFileSignature,
  validateFileType,
  validateFileSize,
  validateImage,
  validateSound,
  safeDeleteFile,
  generateSafeFileName,
  isSafeFileName,
  getMimeType
};
