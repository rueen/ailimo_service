/**
 * 数据验证工具
 */

/**
 * 验证手机号
 * @param {String} phone - 手机号
 * @returns {Boolean}
 */
const isValidPhone = (phone) => {
  const phoneReg = /^1[3-9]\d{9}$/;
  return phoneReg.test(phone);
};

/**
 * 验证邮箱
 * @param {String} email - 邮箱
 * @returns {Boolean}
 */
const isValidEmail = (email) => {
  const emailReg = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailReg.test(email);
};

/**
 * 验证密码格式（6-20位，包含字母和数字）
 * @param {String} password - 密码
 * @returns {Boolean}
 */
const isValidPassword = (password) => {
  const passwordReg = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/;
  return passwordReg.test(password);
};

/**
 * 验证验证码（6位数字）
 * @param {String} code - 验证码
 * @returns {Boolean}
 */
const isValidCode = (code) => {
  const codeReg = /^\d{6}$/;
  return codeReg.test(code);
};

/**
 * 验证日期格式（YYYY-MM-DD）
 * @param {String} date - 日期
 * @returns {Boolean}
 */
const isValidDate = (date) => {
  const dateReg = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateReg.test(date)) return false;
  
  // 验证日期是否有效
  const d = new Date(date);
  return d instanceof Date && !isNaN(d) && d.toISOString().slice(0, 10) === date;
};

/**
 * 验证时间格式（HH:mm 或 HH:mm:ss）
 * @param {String} time - 时间
 * @returns {Boolean}
 */
const isValidTime = (time) => {
  const timeReg = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return timeReg.test(time);
};

/**
 * 验证URL格式
 * @param {String} url - URL
 * @returns {Boolean}
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * 验证是否为正整数
 * @param {*} value - 值
 * @returns {Boolean}
 */
const isPositiveInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
};

/**
 * 验证是否为非负整数
 * @param {*} value - 值
 * @returns {Boolean}
 */
const isNonNegativeInteger = (value) => {
  const num = Number(value);
  return Number.isInteger(num) && num >= 0;
};

/**
 * 清理XSS危险字符
 * @param {String} str - 字符串
 * @returns {String}
 */
const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return str;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * 验证express-validator错误
 * @param {Object} req - Express请求对象
 * @returns {Array|null} 错误数组或null
 */
const validationResult = (req) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return errors.array();
  }
  
  return null;
};

module.exports = {
  isValidPhone,
  isValidEmail,
  isValidPassword,
  isValidCode,
  isValidDate,
  isValidTime,
  isValidUrl,
  isPositiveInteger,
  isNonNegativeInteger,
  sanitizeHtml,
  validationResult
};
