/**
 * 管理端认证中间件
 */
const auth = require('./auth');

/**
 * 管理端JWT认证
 */
const adminAuth = auth({
  userType: 'admin',
  errorMsg: '请登录管理端'
});

module.exports = adminAuth;
