/*
 * @Author: diaochan
 * @Date: 2026-01-09 14:08:24
 * @LastEditors: diaochan diaochan@seatent.com
 * @LastEditTime: 2026-01-19 17:30:44
 * @Description: 
 */
/**
 * 限流中间件
 */
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { response } = require('../utils');

/**
 * 创建限流中间件
 * @param {Object} options - 配置选项
 * @returns {Function} Express中间件
 */
const createRateLimit = (options = {}) => {
  const defaultOptions = {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: '请求频率过高，请稍后再试',
    standardHeaders: true,
    legacyHeaders: false
  };
  
  // 合并配置
  const mergedOptions = {
    ...defaultOptions,
    ...options
  };
  
  // 使用合并后的 message
  mergedOptions.handler = (req, res) => {
    return response.tooManyRequests(res, mergedOptions.message);
  };
  
  return rateLimit(mergedOptions);
};

/**
 * 通用API限流
 */
const apiLimiter = createRateLimit({
  windowMs: 60 * 1000,  // 1分钟
  max: 500              // 最多500次请求
});

/**
 * 登录接口限流
 */
const loginLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 5,                     // 最多5次尝试
  message: '登录尝试次数过多，请15分钟后再试'
});

/**
 * 短信验证码限流
 */
const smsLimiter = createRateLimit({
  windowMs: 60 * 1000,  // 1分钟
  max: 1,               // 最多1次请求
  message: '发送验证码过于频繁，请1分钟后再试'
});

module.exports = {
  createRateLimit,
  apiLimiter,
  loginLimiter,
  smsLimiter
};
