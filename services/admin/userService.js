/**
 * 管理端用户管理服务
 */
const db = require('../../models');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

/**
 * 获取用户列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getUserList = async (params) => {
  try {
    const { page = 1, pageSize = 10, name, phone, organizationId, auditStatus, status } = params;
    
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (phone) where.phone = { [Op.like]: `%${phone}%` };
    if (organizationId) where.organization_id = organizationId;
    if (auditStatus !== undefined) where.audit_status = auditStatus;
    if (status !== undefined) where.status = status;

    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await db.User.findAndCountAll({
      where,
      include: [
        { model: db.Organization, as: 'organization', attributes: ['id', 'name'] },
        { model: db.ResearchGroup, as: 'research_group', attributes: ['id', 'name'] },
        { model: db.Administrator, as: 'auditor', attributes: ['id', 'username'] }
      ],
      offset,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    return {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (err) {
    logger.error(`Get user list failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取用户详情
 * @param {Number} userId - 用户ID
 * @returns {Promise<Object>}
 */
const getUserDetail = async (userId) => {
  try {
    const user = await db.User.findByPk(userId, {
      include: [
        { model: db.Organization, as: 'organization', attributes: ['id', 'name'] },
        { model: db.ResearchGroup, as: 'research_group', attributes: ['id', 'name'] },
        { model: db.Administrator, as: 'auditor', attributes: ['id', 'username'] }
      ]
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return user;
  } catch (err) {
    logger.error(`Get user detail failed: ${err.message}`);
    throw err;
  }
};

/**
 * 创建用户（管理端手动创建）
 * @param {Object} userData - 用户数据
 * @param {Number} adminId - 创建人ID
 * @returns {Promise<Object>}
 */
const createUser = async (userData, adminId) => {
  try {
    // 检查手机号是否已存在
    const existingUser = await db.User.findOne({ where: { phone: userData.phone } });
    if (existingUser) {
      throw new Error('该手机号已被注册');
    }

    // 验证组织机构是否存在
    if (userData.organization_id) {
      const org = await db.Organization.findByPk(userData.organization_id);
      if (!org) {
        throw new Error('组织机构不存在');
      }
    }

    // 验证课题组是否存在
    if (userData.research_group_id) {
      const group = await db.ResearchGroup.findByPk(userData.research_group_id);
      if (!group) {
        throw new Error('课题组不存在');
      }
    }

    // 如果未传入审核状态，管理端创建的用户默认审核通过
    const auditStatus = userData.audit_status !== undefined ? userData.audit_status : 1;
    
    // 构建创建数据
    const createData = {
      ...userData,
      audit_status: auditStatus,
      status: userData.status !== undefined ? userData.status : 1
    };
    
    // 如果审核状态为1（审核通过），记录审核时间和审核人
    if (auditStatus === 1) {
      createData.audit_time = new Date();
      createData.audit_by = adminId;
    }

    const user = await db.User.create(createData);

    logger.info(`User created by admin: userId=${user.id}, auditStatus=${auditStatus}, by=${adminId}`);
    return user;
  } catch (err) {
    logger.error(`Create user failed: ${err.message}`);
    throw err;
  }
};

/**
 * 更新用户信息
 * @param {Number} userId - 用户ID
 * @param {Object} userData - 更新数据
 * @returns {Promise<void>}
 */
const updateUser = async (userId, userData) => {
  try {
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 如果修改手机号，检查是否重复
    if (userData.phone && userData.phone !== user.phone) {
      const existingUser = await db.User.findOne({ 
        where: { 
          phone: userData.phone,
          id: { [Op.ne]: userId }
        } 
      });
      if (existingUser) {
        throw new Error('该手机号已被其他用户使用');
      }
    }

    // 验证组织机构
    if (userData.organization_id) {
      const org = await db.Organization.findByPk(userData.organization_id);
      if (!org) {
        throw new Error('组织机构不存在');
      }
    }

    // 验证课题组
    if (userData.research_group_id) {
      const group = await db.ResearchGroup.findByPk(userData.research_group_id);
      if (!group) {
        throw new Error('课题组不存在');
      }
    }

    await user.update(userData);
    logger.info(`User updated: userId=${userId}`);
  } catch (err) {
    logger.error(`Update user failed: ${err.message}`);
    throw err;
  }
};

/**
 * 审核用户
 * @param {Number} userId - 用户ID
 * @param {Number} auditStatus - 审核状态：1-通过 2-拒绝
 * @param {String} rejectReason - 拒绝原因
 * @param {Number} adminId - 审核人ID
 * @returns {Promise<void>}
 */
const auditUser = async (userId, auditStatus, rejectReason, adminId) => {
  try {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }

    if (user.audit_status !== 0) {
      throw new Error('该用户已审核，无法重复审核');
    }

    const updateData = {
      audit_status: auditStatus,
      audit_time: new Date(),
      audit_by: adminId
    };

    if (auditStatus === 2) {
      if (!rejectReason) {
        throw new Error('拒绝时必须填写拒绝原因');
      }
      updateData.reject_reason = rejectReason;
    }

    await user.update(updateData);
    
    logger.info(`User audited: userId=${userId}, status=${auditStatus}, by=${adminId}`);
  } catch (err) {
    logger.error(`Audit user failed: ${err.message}`);
    throw err;
  }
};

/**
 * 启用/禁用用户
 * @param {Number} userId - 用户ID
 * @param {Number} status - 状态：0-禁用 1-启用
 * @returns {Promise<void>}
 */
const toggleUserStatus = async (userId, status) => {
  try {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }

    await user.update({ status });
    
    logger.info(`User status toggled: userId=${userId}, status=${status}`);
  } catch (err) {
    logger.error(`Toggle user status failed: ${err.message}`);
    throw err;
  }
};

/**
 * 删除用户
 * @param {Number} userId - 用户ID
 * @returns {Promise<void>}
 */
const deleteUser = async (userId) => {
  try {
    const user = await db.User.findByPk(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查是否有关联订单
    const hasOrders = await Promise.all([
      db.EquipmentReservation.count({ where: { user_id: userId } }),
      db.CageReservation.count({ where: { user_id: userId } }),
      db.ExperimentOperation.count({ where: { user_id: userId } }),
      db.AnimalOrder.count({ where: { user_id: userId } }),
      db.ReagentOrder.count({ where: { user_id: userId } })
    ]);

    if (hasOrders.some(count => count > 0)) {
      throw new Error('该用户存在关联订单，无法删除');
    }

    await user.destroy();
    
    logger.info(`User deleted: userId=${userId}`);
  } catch (err) {
    logger.error(`Delete user failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取组织机构列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getOrganizationList = async (params) => {
  try {
    const { page = 1, pageSize = 10, name } = params;
    
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };

    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await db.Organization.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    return {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (err) {
    logger.error(`Get organization list failed: ${err.message}`);
    throw err;
  }
};

/**
 * 创建组织机构
 * @param {String} name - 组织名称
 * @returns {Promise<Object>}
 */
const createOrganization = async (name) => {
  try {
    const organization = await db.Organization.create({ name });
    logger.info(`Organization created: ${name}`);
    return organization;
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw new Error('组织机构名称已存在');
    }
    logger.error(`Create organization failed: ${err.message}`);
    throw err;
  }
};

/**
 * 更新组织机构
 * @param {Number} id - 组织ID
 * @param {String} name - 组织名称
 * @returns {Promise<void>}
 */
const updateOrganization = async (id, name) => {
  try {
    const organization = await db.Organization.findByPk(id);
    if (!organization) {
      throw new Error('组织机构不存在');
    }
    await organization.update({ name });
    logger.info(`Organization updated: id=${id}`);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw new Error('组织机构名称已存在');
    }
    logger.error(`Update organization failed: ${err.message}`);
    throw err;
  }
};

/**
 * 删除组织机构
 * @param {Number} id - 组织ID
 * @returns {Promise<void>}
 */
const deleteOrganization = async (id) => {
  try {
    const organization = await db.Organization.findByPk(id);
    if (!organization) {
      throw new Error('组织机构不存在');
    }

    // 检查是否有关联用户或课题组
    const userCount = await db.User.count({ where: { organization_id: id } });
    const groupCount = await db.ResearchGroup.count({ where: { organization_id: id } });
    
    if (userCount > 0 || groupCount > 0) {
      throw new Error('该组织机构存在关联数据，无法删除');
    }

    await organization.destroy();
    logger.info(`Organization deleted: id=${id}`);
  } catch (err) {
    logger.error(`Delete organization failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取课题组列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getResearchGroupList = async (params) => {
  try {
    const { page = 1, pageSize = 10, name, organizationId } = params;
    
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (organizationId) where.organization_id = organizationId;

    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await db.ResearchGroup.findAndCountAll({
      where,
      include: [
        { model: db.Organization, as: 'organization', attributes: ['id', 'name'] }
      ],
      offset,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    return {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (err) {
    logger.error(`Get research group list failed: ${err.message}`);
    throw err;
  }
};

/**
 * 创建课题组
 * @param {String} name - 课题组名称
 * @param {Number} organizationId - 组织ID
 * @returns {Promise<Object>}
 */
const createResearchGroup = async (name, organizationId) => {
  try {
    const group = await db.ResearchGroup.create({ 
      name, 
      organization_id: organizationId 
    });
    logger.info(`Research group created: ${name}`);
    return group;
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw new Error('该组织机构下已存在同名课题组');
    }
    logger.error(`Create research group failed: ${err.message}`);
    throw err;
  }
};

/**
 * 更新课题组
 * @param {Number} id - 课题组ID
 * @param {String} name - 课题组名称
 * @param {Number} organizationId - 组织ID
 * @returns {Promise<void>}
 */
const updateResearchGroup = async (id, name, organizationId) => {
  try {
    const group = await db.ResearchGroup.findByPk(id);
    if (!group) {
      throw new Error('课题组不存在');
    }
    await group.update({ name, organization_id: organizationId });
    logger.info(`Research group updated: id=${id}`);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw new Error('该组织机构下已存在同名课题组');
    }
    logger.error(`Update research group failed: ${err.message}`);
    throw err;
  }
};

/**
 * 删除课题组
 * @param {Number} id - 课题组ID
 * @returns {Promise<void>}
 */
const deleteResearchGroup = async (id) => {
  try {
    const group = await db.ResearchGroup.findByPk(id);
    if (!group) {
      throw new Error('课题组不存在');
    }

    // 检查是否有关联用户
    const userCount = await db.User.count({ where: { research_group_id: id } });
    if (userCount > 0) {
      throw new Error('该课题组存在关联用户，无法删除');
    }

    await group.destroy();
    logger.info(`Research group deleted: id=${id}`);
  } catch (err) {
    logger.error(`Delete research group failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取组织机构选项列表
 * @returns {Promise<Array>}
 */
const getOrganizationOptions = async () => {
  try {
    const organizations = await db.Organization.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    return organizations;
  } catch (err) {
    logger.error(`Get organization options failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取课题组选项列表
 * @param {Number} organizationId - 组织ID（可选）
 * @returns {Promise<Array>}
 */
const getResearchGroupOptions = async (organizationId) => {
  try {
    const where = organizationId ? { organization_id: organizationId } : {};
    const groups = await db.ResearchGroup.findAll({
      where,
      attributes: ['id', 'name', 'organization_id'],
      include: [
        { model: db.Organization, as: 'organization', attributes: ['id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });
    return groups;
  } catch (err) {
    logger.error(`Get research group options failed: ${err.message}`);
    throw err;
  }
};

module.exports = {
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  auditUser,
  toggleUserStatus,
  deleteUser,
  getOrganizationList,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getResearchGroupList,
  createResearchGroup,
  updateResearchGroup,
  deleteResearchGroup,
  getOrganizationOptions,
  getResearchGroupOptions
};
