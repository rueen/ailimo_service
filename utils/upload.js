/**
 * 文件上传工具
 */
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');
const logger = require('../config/logger');

/**
 * 确保目录存在
 * @param {String} dirPath - 目录路径
 */
const ensureDir = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (err) {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

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
    return result.url;
  } catch (err) {
    logger.error(`文件上传到OSS失败: ${err.message}`);
    throw new Error('文件上传失败');
  }
};

/**
 * 保存文件到本地
 * @param {Object} file - Multer文件对象
 * @param {String} subDir - 子目录（如 'images'）
 * @returns {Promise<Object>} 文件信息
 */
const saveToLocal = async (file, subDir = 'images') => {
  const uploadPath = config.upload.uploadPath;
  const destDir = config.upload.destination(uploadPath);
  
  // 确保目录存在
  await ensureDir(destDir);
  
  // 生成文件名
  const filename = config.upload.filename(file.originalname);
  const filePath = path.join(destDir, filename);
  
  // 移动文件
  await fs.rename(file.path, filePath);
  
  // 生成相对URL
  const relativePath = path.relative(uploadPath, filePath);
  const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;
  
  logger.info(`文件保存到本地: ${filePath}`);
  
  return {
    url,
    filename,
    path: filePath,
    size: file.size,
    mimeType: file.mimetype
  };
};

/**
 * 上传图片
 * @param {Object} file - Multer文件对象
 * @returns {Promise<Object>} 上传结果
 */
const uploadImage = async (file) => {
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
  
  // 如果配置了OSS，上传到OSS
  if (config.oss.enabled) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const filename = config.upload.filename(file.originalname);
    const ossPath = `${config.oss.prefix.image}${year}/${month}/${day}/${filename}`;
    
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
      mimeType: file.mimetype
    };
  }
  
  // 否则保存到本地
  return await saveToLocal(file, 'images');
};

/**
 * 删除本地文件
 * @param {String} filePath - 文件路径
 */
const deleteLocalFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    logger.info(`删除本地文件: ${filePath}`);
  } catch (err) {
    logger.warn(`删除本地文件失败: ${filePath}`);
  }
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
  ensureDir,
  uploadToOSS,
  saveToLocal,
  uploadImage,
  deleteLocalFile,
  deleteOSSFile
};
