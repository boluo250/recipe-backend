const rateLimit = require('express-rate-limit');
const { logger } = require('../config/logger');

// 通用API速率限制 - 每分钟100次请求
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟
  max: 100, // 每个IP每分钟最多100次请求
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true, // 返回标准的 `RateLimit-*` headers
  legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip || req.connection.remoteAddress,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: '1 minute'
    });
  }
});

// 文件上传严格限制 - 每小时10次
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 10, // 每个IP每小时最多10次文件上传
  message: {
    error: 'Upload limit exceeded',
    message: 'Too many upload requests, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip || req.connection.remoteAddress,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      error: 'Upload limit exceeded',
      message: 'Too many upload requests, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

// 用户内容提交限制 - 每小时5次
const userSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 每个IP每小时最多5次内容提交
  message: {
    error: 'Submission limit exceeded',
    message: 'Too many submissions, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Submission rate limit exceeded', {
      ip: req.ip || req.connection.remoteAddress,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    res.status(429).json({
      error: 'Submission limit exceeded',
      message: 'Too many submissions, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

module.exports = {
  apiLimiter,
  uploadLimiter,
  userSubmissionLimiter
};