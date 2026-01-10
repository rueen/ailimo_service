/**
 * 中间件入口
 */
const { errorHandler, notFound } = require('./errorHandler');
const auth = require('./auth');
const adminAuth = require('./adminAuth');
const h5Auth = require('./h5Auth');
const permission = require('./permission');
const { apiLimiter, loginLimiter, smsLimiter } = require('./rateLimit');
const validate = require('./validate');
const { uploadSingle, uploadMultiple } = require('./upload');

module.exports = {
  // 错误处理
  errorHandler,
  notFound,
  
  // 认证
  auth,
  adminAuth,
  h5Auth,
  
  // 权限
  permission,
  
  // 限流
  apiLimiter,
  loginLimiter,
  smsLimiter,
  
  // 验证
  validate,
  
  // 文件上传
  uploadSingle,
  uploadMultiple
};
