/**
 * JWT工具
 */
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 生成Token
 * @param {Object} payload - 载荷数据
 * @param {String} expiresIn - 过期时间
 * @returns {String} Token
 */
const generateToken = (payload, expiresIn) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  });
};

/**
 * 生成管理端Token
 * @param {Object} admin - 管理员信息
 * @returns {String} Token
 */
const generateAdminToken = (admin) => {
  const payload = {
    id: admin.id,
    username: admin.username,
    roleId: admin.role_id,
    type: 'admin'
  };
  
  return generateToken(payload, config.jwt.adminExpire);
};

/**
 * 生成用户端Token
 * @param {Object} user - 用户信息
 * @returns {String} Token
 */
const generateUserToken = (user) => {
  const payload = {
    id: user.id,
    phone: user.phone,
    type: 'user'
  };
  
  return generateToken(payload, config.jwt.userExpire);
};

/**
 * 验证Token
 * @param {String} token - Token
 * @returns {Object|null} 解析后的载荷数据
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    });
  } catch (err) {
    return null;
  }
};

/**
 * 解析Token（不验证）
 * @param {String} token - Token
 * @returns {Object|null}
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateToken,
  generateAdminToken,
  generateUserToken,
  verifyToken,
  decodeToken
};
