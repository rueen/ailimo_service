/**
 * 文件上传中间件
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { response } = require('../utils');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, filename);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedTypes = config.upload.allowedImageTypes;
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 创建上传实例
const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize
  },
  fileFilter
});

/**
 * 单文件上传中间件
 */
const uploadSingle = (fieldName = 'file') => {
  return (req, res, next) => {
    const uploadHandler = upload.single(fieldName);
    
    uploadHandler(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return response.badRequest(res, `文件大小不能超过${config.upload.maxSize / 1024 / 1024}MB`);
          }
          return response.badRequest(res, '文件上传失败');
        }
        return response.badRequest(res, err.message);
      }
      next();
    });
  };
};

/**
 * 多文件上传中间件
 */
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return (req, res, next) => {
    const uploadHandler = upload.array(fieldName, maxCount);
    
    uploadHandler(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return response.badRequest(res, `单个文件大小不能超过${config.upload.maxSize / 1024 / 1024}MB`);
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return response.badRequest(res, `最多上传${maxCount}个文件`);
          }
          return response.badRequest(res, '文件上传失败');
        }
        return response.badRequest(res, err.message);
      }
      next();
    });
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple
};
