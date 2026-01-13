/**
 * 数据验证工具
 */
const db = require('../models');

/**
 * 验证密码格式（6-20位，包含字母和数字）
 * @param {String} password - 密码
 * @returns {Boolean}
 */
const isValidPassword = (password) => {
  if (!password || password.length < 6 || password.length > 20) {
    return false;
  }
  // 必须包含字母和数字
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
};

/**
 * 验证手机号格式
 * @param {String} phone - 手机号
 * @returns {Boolean}
 */
const isValidPhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone);
};

/**
 * 验证地区ID是否存在
 * @param {Number} provinceId - 省份ID
 * @param {Number} cityId - 城市ID
 * @param {Number} districtId - 区县ID
 * @returns {Promise<Object>} - { valid: boolean, message: string, regions: object }
 */
const validateRegionIds = async (provinceId, cityId, districtId) => {
  try {
    // 1. 验证省份
    if (!provinceId) {
      return { valid: false, message: '省份ID不能为空' };
    }

    const province = await db.Region.findOne({
      where: { id: provinceId, level: 1, status: 1 }
    });

    if (!province) {
      return { valid: false, message: '省份ID不存在或已禁用' };
    }

    // 2. 验证城市
    if (!cityId) {
      return { valid: false, message: '城市ID不能为空' };
    }

    const city = await db.Region.findOne({
      where: { id: cityId, level: 2, parent_id: provinceId, status: 1 }
    });

    if (!city) {
      return { valid: false, message: '城市ID不存在、已禁用或不属于该省份' };
    }

    // 3. 验证区县
    if (!districtId) {
      return { valid: false, message: '区县ID不能为空' };
    }

    const district = await db.Region.findOne({
      where: { id: districtId, level: 3, parent_id: cityId, status: 1 }
    });

    if (!district) {
      return { valid: false, message: '区县ID不存在、已禁用或不属于该城市' };
    }

    // 返回验证通过及地区信息
    return {
      valid: true,
      message: '地区验证通过',
      regions: {
        province,
        city,
        district
      }
    };
  } catch (error) {
    return { valid: false, message: `地区验证失败: ${error.message}` };
  }
};

/**
 * 验证省市区ID（可选字段，如果有就验证）
 * @param {Number} provinceId - 省份ID（可选）
 * @param {Number} cityId - 城市ID（可选）
 * @param {Number} districtId - 区县ID（可选）
 * @returns {Promise<Object>}
 */
const validateRegionIdsOptional = async (provinceId, cityId, districtId) => {
  // 如果都没有，直接通过
  if (!provinceId && !cityId && !districtId) {
    return { valid: true, message: '未提供地区信息' };
  }

  // 如果提供了任意一个，就必须三个都提供
  if (!provinceId || !cityId || !districtId) {
    return { valid: false, message: '省市区必须同时提供或同时不提供' };
  }

  // 验证地区ID
  return await validateRegionIds(provinceId, cityId, districtId);
};

module.exports = {
  isValidPassword,
  isValidPhone,
  validateRegionIds,
  validateRegionIdsOptional
};
