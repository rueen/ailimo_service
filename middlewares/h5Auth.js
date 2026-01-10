/**
 * 用户端认证中间件
 */
const auth = require('./auth');

/**
 * 用户端JWT认证
 */
const h5Auth = auth({
  userType: 'user',
  errorMsg: '请先登录'
});

module.exports = h5Auth;
