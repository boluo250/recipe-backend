const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const recipeRoutes = require('./routes/recipes');
const path = require('path');
const { logger } = require('./config/logger');
const accessLogMiddleware = require('./middleware/accessLogger');
const { apiLimiter } = require('./middleware/rateLimiter');

dotenv.config();
const app = express();

// 使用访问日志中间件
app.use(accessLogMiddleware);

// 应用速率限制
app.use(apiLimiter);

app.use(cors());
app.use(express.json());
// 配置静态文件服务
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// 连接 MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  logger.info('Connected to MongoDB successfully');
}).catch((err) => {
  logger.error('MongoDB connection error:', { error: err.message, stack: err.stack });
});

// 路由
app.use('/api/recipes', recipeRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress
  });
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 404 处理
app.use('*', (req, res) => {
  logger.warn('Route not found:', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress
  });
  
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});