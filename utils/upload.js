/**
 * 文件上传工具
 */
const fs = require('fs').promises;
const config = require('../config');
const logger = require('../config/logger');

/**
 * 获取OSS客户端（延迟加载ali-oss以避免启动时的系统错误）
 * @returns {Object|null}
 */
const getOSSClient = () => {
  if (!config.oss.enabled) {
    return null;
  }
  
  // 延迟加载 ali-oss 模块
  const OSS = require('ali-oss');
  
  return new OSS({
    accessKeyId: config.oss.accessKeyId,
    accessKeySecret: config.oss.accessKeySecret,
    bucket: config.oss.bucket,
    region: config.oss.region,
    endpoint: config.oss.endpoint || undefined,
    timeout: config.oss.timeout
  });
};

/**
 * 上传文件到OSS
 * @param {String} localPath - 本地文件路径
 * @param {String} ossPath - OSS文件路径
 * @returns {Promise<String>} OSS文件URL
 */
const uploadToOSS = async (localPath, ossPath) => {
  const client = getOSSClient();
  
  if (!client) {
    throw new Error('OSS未配置');
  }
  
  try {
    const result = await client.put(ossPath, localPath);
    logger.info(`文件上传到OSS成功: ${ossPath}`);
    
    // 将 HTTP 地址转换为 HTTPS
    // ali-oss 的 put 方法默认返回 HTTP 地址，需要手动转换
    const httpsUrl = result.url.replace(/^http:/, 'https:');
    return httpsUrl;
  } catch (err) {
    logger.error(`文件上传到OSS失败: ${err.message}`);
    throw new Error('文件上传失败');
  }
};


/**
 * 上传图片
 * @param {Object} file - Multer文件对象
 * @param {String} directory - 自定义上传目录（如 'equipment', 'cage' 等）
 * @returns {Promise<Object>} 上传结果
 */
const uploadImage = async (file, directory = '') => {
  if (!file) {
    throw new Error('未选择文件');
  }
  
  // 验证文件类型
  if (!config.upload.allowedImageTypes.includes(file.mimetype)) {
    throw new Error('不支持的文件类型');
  }
  
  // 验证文件大小
  if (file.size > config.upload.maxSize) {
    throw new Error(`文件大小不能超过 ${config.upload.maxSize / 1024 / 1024}MB`);
  }
  
  // 强制使用 OSS
  if (!config.oss.enabled) {
    throw new Error('OSS未配置，请联系管理员');
  }
  
  // 构建 OSS 路径
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const filename = config.upload.filename(file.originalname);
  
  // 路径格式: images/{directory}/{year}/{month}/{day}/{filename}
  let ossPath = 'images/';
  if (directory) {
    ossPath += `${directory}/`;
  }
  ossPath += `${year}/${month}/${day}/${filename}`;
  
  const url = await uploadToOSS(file.path, ossPath);
  
  // 删除临时文件
  try {
    await fs.unlink(file.path);
  } catch (err) {
    logger.warn(`删除临时文件失败: ${file.path}`);
  }
  
  return {
    url,
    filename,
    size: file.size,
    mime_type: file.mimetype
  };
};

/**
 * 上传文档
 * @param {Object} file - Multer文件对象
 * @param {String} directory - 自定义上传目录（如 'contracts', 'reports' 等）
 * @returns {Promise<Object>} 上传结果
 */
const uploadDocument = async (file, directory = '') => {
  if (!file) {
    throw new Error('未选择文件');
  }
  
  // 支持的文档类型
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
  
  // 验证文件类型
  if (!allowedDocumentTypes.includes(file.mimetype)) {
    throw new Error('不支持的文件类型，仅支持 doc, docx, txt, pdf, xls, xlsx, ppt, pptx 格式');
  }
  
  // 验证文件大小（20MB）
  const maxDocumentSize = 20 * 1024 * 1024;
  if (file.size > maxDocumentSize) {
    throw new Error('文件大小不能超过 20MB');
  }
  
  // 强制使用 OSS
  if (!config.oss.enabled) {
    throw new Error('OSS未配置，请联系管理员');
  }
  
  // 构建 OSS 路径
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const filename = config.upload.filename(file.originalname);
  
  // 路径格式: documents/{directory}/{year}/{month}/{day}/{filename}
  let ossPath = 'documents/';
  if (directory) {
    ossPath += `${directory}/`;
  }
  ossPath += `${year}/${month}/${day}/${filename}`;
  
  const url = await uploadToOSS(file.path, ossPath);
  
  // 删除临时文件
  try {
    await fs.unlink(file.path);
  } catch (err) {
    logger.warn(`删除临时文件失败: ${file.path}`);
  }
  
  return {
    url,
    filename,
    originalName: file.originalname,
    size: file.size,
    mime_type: file.mimetype
  };
};

/**
 * 删除OSS文件
 * @param {String} ossPath - OSS文件路径
 */
const deleteOSSFile = async (ossPath) => {
  const client = getOSSClient();
  
  if (!client) {
    return;
  }
  
  try {
    await client.delete(ossPath);
    logger.info(`删除OSS文件: ${ossPath}`);
  } catch (err) {
    logger.warn(`删除OSS文件失败: ${ossPath}`);
  }
};

module.exports = {
  uploadToOSS,
  uploadImage,
  uploadDocument,
  deleteOSSFile
};
