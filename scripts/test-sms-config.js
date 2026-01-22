/**
 * 短信配置验证脚本
 * 用于验证阿里云短信服务配置是否正确
 */
require('dotenv').config();
const config = require('../config');

console.log('\n========== 短信配置验证 ==========\n');

// 检查配置项
const checks = [
  {
    name: 'AccessKeyId',
    value: config.sms.accessKeyId,
    valid: !!config.sms.accessKeyId && config.sms.accessKeyId.length > 0
  },
  {
    name: 'AccessKeySecret',
    value: config.sms.accessKeySecret ? '***' + config.sms.accessKeySecret.slice(-4) : '',
    valid: !!config.sms.accessKeySecret && config.sms.accessKeySecret.length > 0
  },
  {
    name: '短信签名',
    value: config.sms.signName,
    valid: !!config.sms.signName && config.sms.signName.length > 0
  },
  {
    name: '短信模板代码',
    value: config.sms.templateCode,
    valid: !!config.sms.templateCode && config.sms.templateCode.length > 0
  }
];

let allValid = true;

checks.forEach(check => {
  const status = check.valid ? '✅' : '❌';
  console.log(`${status} ${check.name}: ${check.value || '(未配置)'}`);
  if (!check.valid) {
    allValid = false;
  }
});

console.log('\n========== 服务状态 ==========\n');
console.log(`短信服务启用: ${config.sms.enabled ? '✅ 是' : '❌ 否'}`);
console.log(`模拟模式: ${config.sms.mockMode.enabled ? '⚠️  开启（不会发送真实短信）' : '✅ 关闭（将发送真实短信）'}`);

console.log('\n========== 验证码配置 ==========\n');
console.log(`验证码长度: ${config.sms.code.length} 位`);
console.log(`有效期: ${config.sms.code.expire / 60} 分钟`);
console.log(`每日最大发送次数: ${config.sms.code.maxSendPerDay} 次/手机号`);

console.log('\n========== 验证结果 ==========\n');

if (allValid && config.sms.enabled) {
  console.log('✅ 配置验证通过！短信服务已就绪。');
  console.log('\n提示：');
  console.log('- 请确保阿里云短信签名已审核通过');
  console.log('- 请确保短信模板已审核通过');
  console.log('- 建议先通过用户端接口测试短信发送功能');
  console.log('- 测试接口：POST /api/h5/auth/send-code');
} else if (!config.sms.enabled) {
  console.log('❌ 短信服务未启用！请检查 AccessKey 配置。');
} else {
  console.log('❌ 配置不完整！请检查上述标记为 ❌ 的配置项。');
}

console.log('\n=====================================\n');
