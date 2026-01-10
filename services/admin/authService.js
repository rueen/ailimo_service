/**
 * 管理端认证服务
 */
const db = require('../../models');
const { crypto, jwt } = require('../../utils');
const logger = require('../../config/logger');

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
            code: p.code,
            resource: p.resource,
            method: p.method
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

module.exports = {
  login,
  getProfile,
  changePassword
};
