/**
 * 短信工具
 */
const config = require('../config');
const logger = require('../config/logger');
const { generateCode } = require('./crypto');

/**
 * 发送短信验证码
 * @param {String} phone - 手机号
 * @param {Object} options - 选项
 * @returns {Promise<Object>}
 */
const sendCode = async (phone, options = {}) => {
  const code = options.code || generateCode(config.sms.code.length);
  
  // 如果未配置短信服务或使用模拟模式
  if (!config.sms.enabled || config.sms.mockMode.enabled) {
    logger.info(`[短信模拟] 发送验证码到 ${phone}: ${code}`);
    console.log(`\n========== 短信验证码 ==========`);
    console.log(`手机号: ${phone}`);
    console.log(`验证码: ${code}`);
    console.log(`有效期: ${config.sms.code.expire / 60} 分钟`);
    console.log(`===============================\n`);
    
    return {
      success: true,
      code,
      message: '验证码已发送（模拟模式）'
    };
  }
  
  // TODO: 实际短信发送逻辑
  // 这里预留接入第三方短信服务商的代码
  try {
    // 示例：阿里云短信服务
    // const Core = require('@alicloud/pop-core');
    // const client = new Core({
    //   accessKeyId: config.sms.accessKeyId,
    //   accessKeySecret: config.sms.accessKeySecret,
    //   endpoint: 'https://dysmsapi.aliyuncs.com',
    //   apiVersion: '2017-05-25'
    // });
    
    // const params = {
    //   PhoneNumbers: phone,
    //   SignName: config.sms.signName,
    //   TemplateCode: config.sms.templateCode,
    //   TemplateParam: JSON.stringify({ code })
    // };
    
    // const result = await client.request('SendSms', params, { method: 'POST' });
    
    logger.info(`发送验证码到 ${phone}: ${code}`);
    
    return {
      success: true,
      code,
      message: '验证码已发送'
    };
  } catch (err) {
    logger.error(`发送验证码失败: ${err.message}`);
    throw new Error('发送验证码失败');
  }
};

/**
 * 验证短信验证码
 * @param {String} phone - 手机号
 * @param {String} code - 验证码
 * @param {Object} smsCodeRecord - 数据库中的验证码记录
 * @returns {Object}
 */
const verifyCode = (phone, code, smsCodeRecord) => {
  if (!smsCodeRecord) {
    return {
      valid: false,
      message: '验证码不存在或已过期'
    };
  }
  
  if (smsCodeRecord.is_used === 1) {
    return {
      valid: false,
      message: '验证码已使用'
    };
  }
  
  if (new Date() > new Date(smsCodeRecord.expire_time)) {
    return {
      valid: false,
      message: '验证码已过期'
    };
  }
  
  if (smsCodeRecord.code !== code) {
    return {
      valid: false,
      message: '验证码错误'
    };
  }
  
  return {
    valid: true,
    message: '验证成功'
  };
};

module.exports = {
  sendCode,
  verifyCode
};
