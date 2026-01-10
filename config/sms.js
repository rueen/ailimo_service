/**
 * 短信配置
 */
require('dotenv').config();

module.exports = {
  // 短信服务商访问密钥
  accessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || '',
  
  // 短信签名
  signName: process.env.SMS_SIGN_NAME || '艾力默生物',
  
  // 短信模板代码
  templateCode: process.env.SMS_TEMPLATE_CODE || '',
  
  // 验证码配置
  code: {
    length: 6,              // 验证码长度
    expire: 5 * 60,         // 过期时间（秒）
    maxSendPerDay: 10       // 每天最大发送次数
  },
  
  // 是否启用短信（根据配置自动判断）
  get enabled() {
    return !!(this.accessKeyId && this.accessKeySecret);
  },
  
  // 模拟模式（未配置短信服务时使用）
  mockMode: {
    enabled: true,
    defaultCode: '123456'   // 模拟验证码
  }
};
