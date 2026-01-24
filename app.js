/**
 * 应用入口文件
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');
const logger = require('./config/logger');
const { errorHandler, notFound, apiLimiter } = require('./middlewares');

// 创建Express应用
const app = express();

// ==================== 中间件配置 ====================

// 信任代理（用于部署在 Nginx 等反向代理后面）
// 这样 express-rate-limit 才能正确识别客户端真实 IP
app.set('trust proxy', true);

// CORS跨域
app.use(cors(config.cors));

// JSON解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务（用于本地上传的文件）
app.use('/uploads', express.static('uploads'));

// API限流
app.use('/api', apiLimiter);

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// ==================== 路由注册 ====================

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'Service is running',
    data: {
      env: config.app.env,
      timestamp: new Date().toISOString()
    }
  });
});

// 管理端路由
app.use('/api/support', require('./routes/admin'));

// 用户端路由
app.use('/api/h5', require('./routes/h5'));

// ==================== 错误处理 ====================

// 404处理
app.use(notFound);

// 统一错误处理
app.use(errorHandler);

// ==================== 启动服务 ====================

const PORT = config.app.port;

// 测试数据库连接
const db = require('./models');
db.sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connection established successfully');
    
    // 启动服务器
    app.listen(PORT, () => {
      logger.info(`=================================`);
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${config.app.env}`);
      logger.info(`Admin API: http://localhost:${PORT}/api/support`);
      logger.info(`H5 API: http://localhost:${PORT}/api/h5`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
      logger.info(`=================================`);
    });
  })
  .catch((err) => {
    logger.error(`Unable to connect to database: ${err.message}`);
    process.exit(1);
  });

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// 未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
