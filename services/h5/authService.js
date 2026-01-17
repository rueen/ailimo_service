/**
 * 用户端认证服务
 */
const db = require('../../models');
const { jwt, sms, validator } = require('../../utils');
const config = require('../../config');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

/**
 * 发送验证码
 * @param {String} phone - 手机号
 * @param {Number} type - 类型：1-登录 2-注册
 * @returns {Promise<Object>}
 */
const sendCode = async (phone, type) => {
  try {
    // 检查当天发送次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const count = await db.SmsCode.count({
      where: {
        phone,
        created_at: {
          [Op.gte]: today
        }
      }
    });

    if (count >= config.sms.code.maxSendPerDay) {
      throw new Error('今日发送验证码次数已达上限');
    }

    // 发送验证码
    const result = await sms.sendCode(phone);

    // 保存验证码记录
    const expireTime = new Date(Date.now() + config.sms.code.expire * 1000);
    await db.SmsCode.create({
      phone,
      code: result.code,
      type,
      expire_time: expireTime
    });

    logger.info(`SMS code sent to ${phone}, type: ${type}`);
    return { message: result.message };
  } catch (err) {
    logger.error(`Send SMS code failed: ${err.message}`);
    throw err;
  }
};

/**
 * 用户登录
 * @param {String} phone - 手机号
 * @param {String} code - 验证码
 * @returns {Promise<Object>}
 */
const login = async (phone, code) => {
  try {
    // 查询最新的验证码记录
    const smsCode = await db.SmsCode.findOne({
      where: {
        phone,
        type: 1, // 登录
        is_used: 0
      },
      order: [['created_at', 'DESC']]
    });

    // 验证验证码
    const verifyResult = sms.verifyCode(phone, code, smsCode);
    if (!verifyResult.valid) {
      throw new Error(verifyResult.message);
    }

    // 标记验证码已使用
    await smsCode.update({ is_used: 1 });

    // 查询用户
    let user = await db.User.findOne({
      where: { phone },
      include: [
        { model: db.Organization, as: 'organization', attributes: ['id', 'name'] },
        { model: db.ResearchGroup, as: 'research_group', attributes: ['id', 'name'] }
      ]
    });

    if (!user) {
      throw new Error('用户不存在，请先注册');
    }

    // 检查用户状态
    if (user.status === 0) {
      throw new Error('账号已被禁用');
    }

    if (user.audit_status === 0) {
      throw new Error('账号审核中，请等待审核通过');
    }

    if (user.audit_status === 2) {
      throw new Error(`账号审核未通过：${user.reject_reason || '未说明原因'}`);
    }

    // 生成Token
    const token = jwt.generateUserToken(user);

    logger.info(`User login successful: ${phone}`);
    return {
      token,
      user: {
        id: user.id,
        userNo: user.user_no,
        name: user.name,
        phone: user.phone,
        organization: user.organization,
        research_group: user.research_group,
        status: user.status,
        auditStatus: user.audit_status
      }
    };
  } catch (err) {
    logger.error(`User login failed: ${err.message}`);
    throw err;
  }
};

/**
 * 用户注册
 * @param {Object} userData - 用户数据
 * @returns {Promise<Object>}
 */
const register = async (userData) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { name, phone, code, organization_id, research_group_id, province_id, city_id, district_id, address } = userData;

    // 查询最新的验证码记录
    const smsCode = await db.SmsCode.findOne({
      where: {
        phone,
        type: 2, // 注册
        is_used: 0
      },
      order: [['created_at', 'DESC']]
    });

    // 验证验证码
    const verifyResult = sms.verifyCode(phone, code, smsCode);
    if (!verifyResult.valid) {
      throw new Error(verifyResult.message);
    }

    // 检查手机号是否已注册
    const existUser = await db.User.findOne({ where: { phone } });
    if (existUser) {
      throw new Error('该手机号已注册');
    }

    // 验证地区ID（可选）
    if (province_id || city_id || district_id) {
      const regionValidation = await validator.validateRegionIdsOptional(province_id, city_id, district_id);
      if (!regionValidation.valid) {
        throw new Error(regionValidation.message);
      }
    }

    // 生成用户编号
    const { generateUserNo } = require('../../utils/orderSn');
    const userNo = await generateUserNo(transaction);

    // 标记验证码已使用
    await smsCode.update({ is_used: 1 }, { transaction });

    // 创建用户
    const user = await db.User.create({
      user_no: userNo,
      name,
      phone,
      organization_id,
      research_group_id,
      province_id,
      city_id,
      district_id,
      address,
      status: 1,
      audit_status: 0 // 待审核
    }, { transaction });

    await transaction.commit();
    logger.info(`User registered: ${phone}, user_no: ${userNo}`);
    return {
      message: '注册成功，等待管理员审核',
      userId: user.id,
      userNo: userNo
    };
  } catch (err) {
    await transaction.rollback();
    logger.error(`User register failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取用户信息
 * @param {Number} userId - 用户ID
 * @returns {Promise<Object>}
 */
const getProfile = async (userId) => {
  try {
    const user = await db.User.findByPk(userId, {
      attributes: { exclude: ['audit_by'] },
      include: [
        { model: db.Organization, as: 'organization', attributes: ['id', 'name'] },
        { model: db.ResearchGroup, as: 'research_group', attributes: ['id', 'name'] },
        { model: db.Region, as: 'province', attributes: ['id', 'name', 'code'] },
        { model: db.Region, as: 'city', attributes: ['id', 'name', 'code'] },
        { model: db.Region, as: 'district', attributes: ['id', 'name', 'code'] }
      ]
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  } catch (err) {
    logger.error(`Get user profile failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取用户审核状态
 * @param {Number} userId - 用户ID
 * @returns {Promise<Object>}
 */
const getAuditStatus = async (userId) => {
  try {
    const user = await db.User.findByPk(userId, {
      attributes: ['id', 'user_no', 'name', 'phone', 'audit_status', 'reject_reason', 'audit_time', 'created_at']
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 审核状态文本映射
    const auditStatusMap = {
      0: '待审核',
      1: '审核通过',
      2: '审核拒绝'
    };

    return {
      user_id: user.id,
      user_no: user.user_no,
      name: user.name,
      phone: user.phone,
      audit_status: user.audit_status,
      audit_status_text: auditStatusMap[user.audit_status] || '未知状态',
      reject_reason: user.reject_reason,
      audit_time: user.audit_time,
      created_at: user.created_at
    };
  } catch (err) {
    logger.error(`Get user audit status failed: ${err.message}`);
    throw err;
  }
};

module.exports = {
  sendCode,
  login,
  register,
  getProfile,
  getAuditStatus
};
