const { logger } = require('../config/logger');

const accessLogMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // 记录请求开始
  logger.info('HTTP Request Started', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // 重写 res.end 来记录响应信息
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // 记录请求完成
    logger.info('HTTP Request Completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length') || 0,
      timestamp: new Date().toISOString()
    });

    // 调用原始的 end 方法
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = accessLogMiddleware; 