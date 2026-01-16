/**
 * 管理端认证服务
 */
const db = require('../../models');
const { crypto, jwt } = require('../../utils');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

/**
 * 管理员登录
 * @param {String} username - 用户名
 * @param {String} password - 密码
 * @param {String} ip - 登录IP
 * @returns {Promise<Object>}
 */
const login = async (username, password, ip) => {
  try {
    // 查询管理员
    const admin = await db.Administrator.findOne({
      where: { username },
      include: [
        {
          model: db.Role,
          as: 'role',
          include: [
            {
              model: db.Permission,
              as: 'permissions',
              through: { attributes: [] }
            }
          ]
        }
      ]
    });

    if (!admin) {
      throw new Error('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await crypto.comparePassword(password, admin.password);
    if (!isPasswordValid) {
      throw new Error('用户名或密码错误');
    }

    // 检查账号状态
    if (admin.status === 0) {
      throw new Error('账号已被禁用');
    }

    // 更新最后登录信息
    await admin.update({
      last_login_time: new Date(),
      last_login_ip: ip
    });

    // 生成Token
    const token = jwt.generateAdminToken(admin);

    // 构造返回数据
    const result = {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        remark: admin.remark,
        role: admin.role ? {
          id: admin.role.id,
          name: admin.role.name,
          description: admin.role.description
        } : null,
        permissions: admin.role && admin.role.permissions ? 
          admin.role.permissions.map(p => ({
            id: p.id,
            name: p.name,
            code: p.code
          })) : []
      }
    };

    logger.info(`Admin login successful: ${username} from ${ip}`);
    return result;
  } catch (err) {
    logger.error(`Admin login failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取管理员信息
 * @param {Number} adminId - 管理员ID
 * @returns {Promise<Object>}
 */
const getProfile = async (adminId) => {
  try {
    const admin = await db.Administrator.findByPk(adminId, {
      attributes: ['id', 'username', 'remark', 'last_login_time', 'last_login_ip'],
      include: [
        {
          model: db.Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!admin) {
      throw new Error('管理员不存在');
    }

    return admin;
  } catch (err) {
    logger.error(`Get admin profile failed: ${err.message}`);
    throw err;
  }
};

/**
 * 修改密码
 * @param {Number} adminId - 管理员ID
 * @param {String} oldPassword - 旧密码
 * @param {String} newPassword - 新密码
 * @returns {Promise<void>}
 */
const changePassword = async (adminId, oldPassword, newPassword) => {
  try {
    const admin = await db.Administrator.findByPk(adminId);

    if (!admin) {
      throw new Error('管理员不存在');
    }

    // 验证旧密码
    const isPasswordValid = await crypto.comparePassword(oldPassword, admin.password);
    if (!isPasswordValid) {
      throw new Error('旧密码错误');
    }

    // 加密新密码
    const hashedPassword = await crypto.hashPassword(newPassword);

    // 更新密码
    await admin.update({ password: hashedPassword });

    logger.info(`Admin password changed: ${admin.username}`);
  } catch (err) {
    logger.error(`Change admin password failed: ${err.message}`);
    throw err;
  }
};

// ==================== 管理员管理 ====================

/**
 * 获取管理员列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getAdministratorList = async (params) => {
  try {
    const { page = 1, pageSize = 10, username, roleId, status } = params;
    
    const where = {};
    if (username) where.username = { [Op.like]: `%${username}%` };
    if (roleId) where.role_id = roleId;
    if (status !== undefined) where.status = status;

    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await db.Administrator.findAndCountAll({
      where,
      include: [
        { 
          model: db.Role, 
          as: 'role', 
          attributes: ['id', 'name'] 
        }
      ],
      attributes: ['id', 'username', 'remark', 'status', 'last_login_time', 'created_at'],
      offset,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    return {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize)
    };
  } catch (err) {
    logger.error(`Get administrator list failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取管理员详情
 * @param {Number} id - 管理员ID
 * @returns {Promise<Object>}
 */
const getAdministratorDetail = async (id) => {
  try {
    const admin = await db.Administrator.findByPk(id, {
      include: [
        {
          model: db.Role,
          as: 'role',
          include: [
            {
              model: db.Permission,
              as: 'permissions',
              through: { attributes: [] }
            }
          ]
        }
      ],
      attributes: ['id', 'username', 'remark', 'status', 'last_login_time', 'created_at']
    });

    if (!admin) {
      throw new Error('管理员不存在');
    }

    return admin;
  } catch (err) {
    logger.error(`Get administrator detail failed: ${err.message}`);
    throw err;
  }
};

/**
 * 创建管理员
 * @param {Object} data - 管理员数据
 * @returns {Promise<Object>}
 */
const createAdministrator = async (data) => {
  try {
    const { username, password, remark, roleId, status = 1 } = data;

    // 验证用户名是否已存在
    const existing = await db.Administrator.findOne({ where: { username } });
    if (existing) {
      throw new Error('用户名已存在');
    }

    // 验证角色是否存在
    const role = await db.Role.findByPk(roleId);
    if (!role) {
      throw new Error('角色不存在');
    }

    // 加密密码
    const hashedPassword = await crypto.hashPassword(password);

    // 创建管理员
    const admin = await db.Administrator.create({
      username,
      password: hashedPassword,
      remark: remark || null,
      role_id: roleId,
      status: status
    });

    logger.info(`Administrator created: id=${admin.id}, username=${username}, status=${status}`);
    return admin;
  } catch (err) {
    logger.error(`Create administrator failed: ${err.message}`);
    throw err;
  }
};

/**
 * 更新管理员
 * @param {Number} id - 管理员ID
 * @param {Object} data - 更新数据
 * @param {Number} currentAdminId - 当前登录管理员ID
 * @returns {Promise<void>}
 */
const updateAdministrator = async (id, data, currentAdminId) => {
  try {
    const admin = await db.Administrator.findByPk(id);
    if (!admin) {
      throw new Error('管理员不存在');
    }

    // 不允许修改admin账号的角色（假设username为'admin'是超级管理员）
    if (admin.username === 'admin' && data.roleId !== undefined && data.roleId !== admin.role_id) {
      throw new Error('不允许修改超级管理员角色');
    }

    const updateData = {};
    if (data.password !== undefined) {
      updateData.password = await crypto.hashPassword(data.password);
    }
    if (data.remark !== undefined) updateData.remark = data.remark;
    if (data.roleId !== undefined) {
      // 验证角色是否存在
      const role = await db.Role.findByPk(data.roleId);
      if (!role) {
        throw new Error('角色不存在');
      }
      updateData.role_id = data.roleId;
    }
    if (data.status !== undefined) updateData.status = data.status;

    await admin.update(updateData);
    logger.info(`Administrator updated: id=${id}`);
  } catch (err) {
    logger.error(`Update administrator failed: ${err.message}`);
    throw err;
  }
};

/**
 * 删除管理员
 * @param {Number} id - 管理员ID
 * @param {Number} currentAdminId - 当前登录管理员ID
 * @returns {Promise<void>}
 */
const deleteAdministrator = async (id, currentAdminId) => {
  try {
    const admin = await db.Administrator.findByPk(id);
    if (!admin) {
      throw new Error('管理员不存在');
    }

    // 不允许删除admin账号
    if (admin.username === 'admin') {
      throw new Error('不允许删除超级管理员账号');
    }

    // 不允许删除自己的账号
    if (id === currentAdminId) {
      throw new Error('不允许删除自己的账号');
    }

    await admin.destroy();
    logger.info(`Administrator deleted: id=${id}`);
  } catch (err) {
    logger.error(`Delete administrator failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取管理员选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getAdministratorOptions = async () => {
  try {
    const administrators = await db.Administrator.findAll({
      where: { status: 1 }, // 仅返回启用的管理员
      attributes: ['id', 'username', 'remark'],
      include: [
        { model: db.Role, as: 'role', attributes: ['id', 'name'] }
      ],
      order: [['username', 'ASC']]
    });
    return administrators;
  } catch (err) {
    logger.error(`Get administrator options failed: ${err.message}`);
    throw err;
  }
};

// ==================== 角色管理 ====================

/**
 * 获取角色列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getRoleList = async (params) => {
  try {
    const { page = 1, pageSize = 10, name } = params;
    
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };

    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await db.Role.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    return {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize)
    };
  } catch (err) {
    logger.error(`Get role list failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取角色详情
 * @param {Number} id - 角色ID
 * @returns {Promise<Object>}
 */
const getRoleDetail = async (id) => {
  try {
    const role = await db.Role.findByPk(id, {
      include: [
        {
          model: db.Permission,
          as: 'permissions',
          through: { attributes: [] }
        }
      ]
    });

    if (!role) {
      throw new Error('角色不存在');
    }

    return role;
  } catch (err) {
    logger.error(`Get role detail failed: ${err.message}`);
    throw err;
  }
};

/**
 * 创建角色
 * @param {Object} data - 角色数据
 * @returns {Promise<Object>}
 */
const createRole = async (data) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { name, description, permissionIds } = data;

    // 验证角色名称是否已存在
    const existing = await db.Role.findOne({ where: { name }, transaction });
    if (existing) {
      throw new Error('角色名称已存在');
    }

    // 创建角色
    const role = await db.Role.create({
      name,
      description: description || null
    }, { transaction });

    // 插入角色权限关联
    if (permissionIds && permissionIds.length > 0) {
      // 验证权限是否存在
      const permissions = await db.Permission.findAll({
        where: { id: permissionIds },
        transaction
      });
      if (permissions.length !== permissionIds.length) {
        throw new Error('部分权限不存在');
      }

      // 批量插入角色权限关联
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: role.id,
        permission_id: permissionId
      }));
      await db.RolePermission.bulkCreate(rolePermissions, { transaction });
    }

    await transaction.commit();
    logger.info(`Role created: id=${role.id}, name=${name}`);
    return role;
  } catch (err) {
    await transaction.rollback();
    logger.error(`Create role failed: ${err.message}`);
    throw err;
  }
};

/**
 * 更新角色
 * @param {Number} id - 角色ID
 * @param {Object} data - 更新数据
 * @returns {Promise<void>}
 */
const updateRole = async (id, data) => {
  const transaction = await db.sequelize.transaction();
  try {
    const role = await db.Role.findByPk(id, { transaction });
    if (!role) {
      throw new Error('角色不存在');
    }

    // 不允许修改超级管理员角色（id=1）
    if (id === 1) {
      throw new Error('不允许修改超级管理员角色');
    }

    const updateData = {};
    if (data.name !== undefined) {
      // 验证角色名称是否已存在（排除自己）
      const existing = await db.Role.findOne({
        where: { name: data.name, id: { [Op.ne]: id } },
        transaction
      });
      if (existing) {
        throw new Error('角色名称已存在');
      }
      updateData.name = data.name;
    }
    if (data.description !== undefined) updateData.description = data.description;

    await role.update(updateData, { transaction });

    // 更新权限关联
    if (data.permissionIds !== undefined) {
      // 删除旧的权限关联
      await db.RolePermission.destroy({
        where: { role_id: id },
        transaction
      });

      // 插入新的权限关联
      if (data.permissionIds.length > 0) {
        // 验证权限是否存在
        const permissions = await db.Permission.findAll({
          where: { id: data.permissionIds },
          transaction
        });
        if (permissions.length !== data.permissionIds.length) {
          throw new Error('部分权限不存在');
        }

        const rolePermissions = data.permissionIds.map(permissionId => ({
          role_id: id,
          permission_id: permissionId
        }));
        await db.RolePermission.bulkCreate(rolePermissions, { transaction });
      }
    }

    await transaction.commit();
    logger.info(`Role updated: id=${id}`);
  } catch (err) {
    await transaction.rollback();
    logger.error(`Update role failed: ${err.message}`);
    throw err;
  }
};

/**
 * 删除角色
 * @param {Number} id - 角色ID
 * @returns {Promise<void>}
 */
const deleteRole = async (id) => {
  const transaction = await db.sequelize.transaction();
  try {
    const role = await db.Role.findByPk(id, { transaction });
    if (!role) {
      throw new Error('角色不存在');
    }

    // 不允许删除超级管理员角色（id=1）
    if (id === 1) {
      throw new Error('不允许删除超级管理员角色');
    }

    // 检查是否有管理员正在使用此角色
    const adminCount = await db.Administrator.count({
      where: { role_id: id },
      transaction
    });
    if (adminCount > 0) {
      throw new Error('该角色正在被使用，无法删除');
    }

    // 删除角色权限关联
    await db.RolePermission.destroy({
      where: { role_id: id },
      transaction
    });

    // 删除角色
    await role.destroy({ transaction });

    await transaction.commit();
    logger.info(`Role deleted: id=${id}`);
  } catch (err) {
    await transaction.rollback();
    logger.error(`Delete role failed: ${err.message}`);
    throw err;
  }
};

// ==================== 权限管理 ====================

/**
 * 构建权限树
 * @param {Array} permissions - 权限列表
 * @param {Number} parentId - 父级ID
 * @returns {Array}
 */
const buildPermissionTree = (permissions, parentId = 0) => {
  return permissions
    .filter(p => p.parent_id === parentId)
    .map(p => ({
      id: p.id,
      name: p.name,
      code: p.code,
      parent_id: p.parent_id,
      sort_order: p.sort_order,
      children: buildPermissionTree(permissions, p.id)
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
};

/**
 * 获取权限树形列表
 * @returns {Promise<Array>}
 */
const getPermissionList = async () => {
  try {
    const permissions = await db.Permission.findAll({
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });

    return buildPermissionTree(permissions);
  } catch (err) {
    logger.error(`Get permission list failed: ${err.message}`);
    throw err;
  }
};


module.exports = {
  login,
  getProfile,
  changePassword,
  // 管理员管理
  getAdministratorList,
  getAdministratorDetail,
  createAdministrator,
  updateAdministrator,
  deleteAdministrator,
  getAdministratorOptions,
  // 角色管理
  getRoleList,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  // 权限管理
  getPermissionList
};
