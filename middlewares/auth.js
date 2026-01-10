/**
 * 认证中间件（通用）
 */
const { jwt: jwtUtil, response } = require('../utils');
const logger = require('../config/logger');

/**
 * JWT认证中间件
 * @param {Object} options - 配置选项
 * @returns {Function} Express中间件
 */
const auth = (options = {}) => {
  const {
    userType = 'user',  // 用户类型：admin/user
    errorMsg = '请先登录'
  } = options;
  
  return async (req, res, next) => {
    try {
      // 从请求头获取Token
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return response.unauthorized(res, errorMsg);
      }
      
      const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
      
      if (!token) {
        return response.unauthorized(res, errorMsg);
      }
      
      // 验证Token
      const decoded = jwtUtil.verifyToken(token);
      
      if (!decoded) {
        return response.unauthorized(res, 'Token无效或已过期');
      }
      
      // 验证用户类型
      if (decoded.type !== userType) {
        return response.unauthorized(res, '无权访问');
      }
      
      // 将解析后的用户信息附加到请求对象
      req.user = decoded;
      req.userId = decoded.id;
      
      next();
    } catch (err) {
      logger.error(`Auth middleware error: ${err.message}`);
      return response.unauthorized(res, '身份验证失败');
    }
  };
};

module.exports = auth;
