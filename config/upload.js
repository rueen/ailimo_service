/**
 * 文件上传配置
 */
require('dotenv').config();
const path = require('path');

module.exports = {
  // 上传目录
  uploadPath: path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads'),
  
  // 最大文件大小（字节）
  maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880'), // 5MB
  
  // 允许的图片格式
  allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  
  // 允许的图片扩展名
  allowedImageExts: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  
  // 文件名生成规则
  filename: (originalname) => {
    const ext = path.extname(originalname);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${random}${ext}`;
  },
  
  // 目录结构（按日期分类）
  destination: (uploadPath) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return path.join(uploadPath, 'images', year.toString(), month, day);
  }
};
