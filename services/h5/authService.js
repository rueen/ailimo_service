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
    // ===== 第一步：验证业务规则（不影响频率限制） =====
    
    // type=2 表示注册，type=1 表示登录
    // 注册时检查手机号是否已被注册
    if (type === 2) {
      const existUser = await db.User.findOne({ where: { phone } });
      if (existUser) {
        throw new Error('该手机号已注册，请直接登录');
      }
    }
    
    // 登录时检查手机号是否已注册
    if (type === 1) {
      const existUser = await db.User.findOne({ where: { phone } });
      if (!existUser) {
        throw new Error('该手机号未注册，请先注册');
      }
    }
    
    // ===== 第二步：检查发送频率（只有业务规则通过后才检查） =====
    
    // 检查1分钟内是否已发送过
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCode = await db.SmsCode.findOne({
      where: {
        phone,
        created_at: {
          [Op.gte]: oneMinuteAgo
        }
      },
      order: [['created_at', 'DESC']]
    });

    if (recentCode) {
      throw new Error('发送验证码过于频繁，请1分钟后再试');
    }
    
    // 检查当天发送次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await db.SmsCode.count({
      where: {
        phone,
        created_at: {
          [Op.gte]: today
        }
      }
    });

    if (todayCount >= config.sms.code.maxSendPerDay) {
      throw new Error('今日发送验证码次数已达上限');
    }

    // ===== 第三步：发送验证码 =====
    const result = await sms.sendCode(phone);

    // ===== 第四步：发送成功后才保存记录（这样创建时间就是真实发送时间） =====
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
        { model: db.Department, as: 'department', attributes: ['id', 'name'] },
        { model: db.ResearchGroup, as: 'research_group', attributes: ['id', 'name'] }
      ]
    });

    if (!user) {
      throw new Error('用户不存在，请先注册');
    }

    // 检查用户状态（只检查是否被禁用，审核状态不影响登录）
    if (user.status === 0) {
      throw new Error('账号已被禁用');
    }

    // 生成Token（审核中、审核未通过的用户也允许登录，由前端根据audit_status显示相应页面）
    const token = jwt.generateUserToken(user);

    logger.info(`User login successful: ${phone}, audit_status: ${user.audit_status}`);
    return {
      token,
      user: {
        id: user.id,
        userNo: user.user_no,
        name: user.name,
        phone: user.phone,
        organization: user.organization,
        department: user.department,
        research_group: user.research_group,
        status: user.status,
        audit_status: user.audit_status,
        reject_reason: user.reject_reason || null  // 如果是审核未通过，返回拒绝原因
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
    const { 
      name, phone, code, 
      organization_id, department_id, research_group_id,
      user_input_organization_name, user_input_department_name, user_input_research_group_name,
      province_id, city_id, district_id, address 
    } = userData;

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

    // 验证组织机构/学院/课题组逻辑
    if (organization_id) {
      const org = await db.Organization.findByPk(organization_id);
      if (!org) {
        throw new Error('组织机构不存在');
      }
    } else if (!user_input_organization_name) {
      throw new Error('请选择组织机构或输入组织机构名称');
    }

    if (department_id) {
      const dept = await db.Department.findByPk(department_id);
      if (!dept) {
        throw new Error('学院不存在');
      }
      if (organization_id && dept.organization_id !== organization_id) {
        throw new Error('学院不属于所选的组织机构');
      }
    } else if (!user_input_department_name) {
      throw new Error('请选择学院或输入学院名称');
    }

    if (research_group_id) {
      const group = await db.ResearchGroup.findByPk(research_group_id);
      if (!group) {
        throw new Error('课题组不存在');
      }
      if (department_id && group.department_id !== department_id) {
        throw new Error('课题组不属于所选的学院');
      }
    } else if (!user_input_research_group_name) {
      throw new Error('请选择课题组或输入课题组名称');
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
      organization_id: organization_id || null,
      department_id: department_id || null,
      research_group_id: research_group_id || null,
      user_input_organization_name: organization_id ? null : user_input_organization_name,
      user_input_department_name: department_id ? null : user_input_department_name,
      user_input_research_group_name: research_group_id ? null : user_input_research_group_name,
      province_id,
      city_id,
      district_id,
      address,
      status: 1,
      audit_status: 0 // 待审核
    }, { transaction });

    await transaction.commit();

    // 重新查询用户（包含关联数据）
    const userWithRelations = await db.User.findByPk(user.id, {
      include: [
        { model: db.Organization, as: 'organization', attributes: ['id', 'name'] },
        { model: db.Department, as: 'department', attributes: ['id', 'name'] },
        { model: db.ResearchGroup, as: 'research_group', attributes: ['id', 'name'] }
      ]
    });

    // 生成Token（注册成功后自动登录）
    const token = jwt.generateUserToken(userWithRelations);

    logger.info(`User registered and logged in: ${phone}, user_no: ${userNo}, audit_status: 0`);
    return {
      message: '注册成功',
      token,
      user: {
        id: userWithRelations.id,
        userNo: userWithRelations.user_no,
        name: userWithRelations.name,
        phone: userWithRelations.phone,
        organization: userWithRelations.organization,
        department: userWithRelations.department,
        research_group: userWithRelations.research_group,
        status: userWithRelations.status,
        audit_status: userWithRelations.audit_status,
        reject_reason: null
      }
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
        { model: db.Department, as: 'department', attributes: ['id', 'name'] },
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
