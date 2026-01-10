/**
 * 统一错误处理中间件
 */
const logger = require('../config/logger');
const { response } = require('../utils');

/**
 * 404错误处理
 */
const notFound = (req, res, next) => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  return response.notFound(res, '请求的资源不存在');
};

/**
 * 全局错误处理
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}\nStack: ${err.stack}`);
  
  // Sequelize错误
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message).join(', ');
    return response.badRequest(res, messages);
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return response.badRequest(res, '数据已存在');
  }
  
  if (err.name === 'SequelizeDatabaseError') {
    return response.serverError(res, '数据库操作失败');
  }
  
  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return response.unauthorized(res, 'Token无效');
  }
  
  if (err.name === 'TokenExpiredError') {
    return response.unauthorized(res, 'Token已过期');
  }
  
  // Multer错误（文件上传）
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return response.badRequest(res, '文件大小超出限制');
    }
    return response.badRequest(res, '文件上传失败');
  }
  
  // 默认错误
  const message = err.message || '服务器内部错误';
  const code = err.code || 500;
  
  return response.error(res, message, code);
};

module.exports = {
  notFound,
  errorHandler
};
