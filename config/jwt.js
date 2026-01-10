/**
 * JWT配置
 */
require('dotenv').config();

module.exports = {
  // JWT密钥
  secret: process.env.JWT_SECRET || 'ailimo_jwt_secret_key_2026',
  
  // 管理端Token过期时间
  adminExpire: process.env.JWT_ADMIN_EXPIRE || '7d',
  
  // 用户端Token过期时间
  userExpire: process.env.JWT_USER_EXPIRE || '30d',
  
  // Token签发者
  issuer: 'ailimo-service',
  
  // Token接收者
  audience: 'ailimo-client'
};
