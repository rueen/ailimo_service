/*
 * @Author: diaochan
 * @Date: 2026-01-09 14:06:42
 * @LastEditors: diaochan
 * @LastEditTime: 2026-01-12 18:54:28
 * @Description: 
 */
/**
 * 配置入口文件
 * 统一导出所有配置
 */
const database = require('./database');
const logger = require('./logger');
const jwt = require('./jwt');
const oss = require('./oss');
const upload = require('./upload');
const sms = require('./sms');

module.exports = {
  // 应用配置
  app: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production'
  },
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // 限流配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 60秒
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '200')      // 最多100次请求
  },
  
  // 数据库配置
  database,
  
  // 日志配置
  logger,
  
  // JWT配置
  jwt,
  
  // OSS配置
  oss,
  
  // 上传配置
  upload,
  
  // 短信配置
  sms
};
