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

// 文件过滤器 - 图片
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = config.upload.allowedImageTypes;
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'), false);
  }
};

// 文件过滤器 - 文档
const documentFileFilter = (req, file, cb) => {
  const allowedDocumentTypes = [
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/pdf', // .pdf
    'text/plain' // .txt
  ];
  
  if (allowedDocumentTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型，仅支持 doc, docx, txt, pdf, xls, xlsx, ppt, pptx 格式'), false);
  }
};

// 创建图片上传实例
const imageUpload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize
  },
  fileFilter: imageFileFilter
});

// 创建文档上传实例
const documentUpload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  },
  fileFilter: documentFileFilter
});

/**
 * 单文件上传中间件 - 图片
 */
const uploadSingle = (fieldName = 'file') => {
  return (req, res, next) => {
    const uploadHandler = imageUpload.single(fieldName);
    
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
 * 单文件上传中间件 - 文档
 */
const uploadDocumentSingle = (fieldName = 'file') => {
  return (req, res, next) => {
    const uploadHandler = documentUpload.single(fieldName);
    
    uploadHandler(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return response.badRequest(res, '文件大小不能超过 20MB');
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
 * 多文件上传中间件 - 图片
 */
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return (req, res, next) => {
    const uploadHandler = imageUpload.array(fieldName, maxCount);
    
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
  uploadDocumentSingle,
  uploadMultiple
};
