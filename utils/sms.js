/**
 * 短信工具
 */
const Dysmsapi20170525 = require('@alicloud/dysmsapi20170525').default;
const { SendSmsRequest } = require('@alicloud/dysmsapi20170525');
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
  
  // 阿里云短信发送
  try {
    // 创建客户端
    const client = new Dysmsapi20170525({
      accessKeyId: config.sms.accessKeyId,
      accessKeySecret: config.sms.accessKeySecret,
      endpoint: 'dysmsapi.aliyuncs.com'
    });
    
    // 发送短信请求参数
    const sendSmsRequest = new SendSmsRequest({
      phoneNumbers: phone,
      signName: config.sms.signName,
      templateCode: config.sms.templateCode,
      templateParam: JSON.stringify({ code })
    });
    
    // 发送短信
    const result = await client.sendSms(sendSmsRequest);
    
    // 检查发送结果
    if (result.body.code === 'OK') {
      logger.info(`短信发送成功 - 手机号: ${phone}, 验证码: ${code}, BizId: ${result.body.bizId}`);
      return {
        success: true,
        code,
        message: '验证码已发送',
        bizId: result.body.bizId
      };
    } else {
      logger.error(`短信发送失败 - Code: ${result.body.code}, Message: ${result.body.message}`);
      throw new Error(result.body.message || '短信发送失败');
    }
  } catch (err) {
    logger.error(`发送短信异常 - 手机号: ${phone}, 错误: ${err.message}`);
    throw new Error('发送验证码失败，请稍后重试');
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
