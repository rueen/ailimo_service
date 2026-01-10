/**
 * 加密解密工具
 */
const bcrypt = require('bcryptjs');

/**
 * 密码加密
 * @param {String} password - 明文密码
 * @returns {Promise<String>} 加密后的密码
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

/**
 * 密码验证
 * @param {String} password - 明文密码
 * @param {String} hashedPassword - 加密后的密码
 * @returns {Promise<Boolean>}
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * 生成随机字符串
 * @param {Number} length - 字符串长度
 * @returns {String}
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 生成数字验证码
 * @param {Number} length - 验证码长度
 * @returns {String}
 */
const generateCode = (length = 6) => {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
};

/**
 * 手机号脱敏
 * @param {String} phone - 手机号
 * @returns {String}
 */
const maskPhone = (phone) => {
  if (!phone || phone.length !== 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

module.exports = {
  hashPassword,
  comparePassword,
  generateRandomString,
  generateCode,
  maskPhone
};
