/**
 * 请求参数验证中间件
 */
const { validationResult } = require('express-validator');
const { response } = require('../utils');

/**
 * 验证请求参数
 * @returns {Function} Express中间件
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return response.badRequest(res, errorMessages);
  }
  
  next();
};

module.exports = validate;
