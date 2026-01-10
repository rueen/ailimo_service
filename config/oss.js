/**
 * 阿里云OSS配置
 */
require('dotenv').config();

module.exports = {
  // OSS访问密钥
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  
  // OSS存储桶
  bucket: process.env.OSS_BUCKET || '',
  
  // OSS区域
  region: process.env.OSS_REGION || 'oss-cn-hangzhou',
  
  // OSS端点（可选）
  endpoint: process.env.OSS_ENDPOINT || '',
  
  // 是否启用OSS（根据配置自动判断）
  get enabled() {
    return !!(this.accessKeyId && this.accessKeySecret && this.bucket);
  },
  
  // 超时时间
  timeout: 60000,
  
  // 上传目录前缀
  prefix: {
    image: 'images/',
    document: 'documents/',
    temp: 'temp/'
  }
};
