/**
 * 权限验证中间件
 */
const { response } = require('../utils');
const logger = require('../config/logger');
const db = require('../models');

/**
 * 权限验证中间件
 * @param {String} permissionCode - 权限代码
 * @returns {Function} Express中间件
 */
const permission = (permissionCode) => {
  return async (req, res, next) => {
    try {
      const adminId = req.userId;
      
      if (!adminId) {
        return response.unauthorized(res, '请先登录');
      }
      
      // 查询管理员信息
      const admin = await db.Administrator.findByPk(adminId, {
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
        return response.unauthorized(res, '管理员不存在');
      }
      
      if (admin.status === 0) {
        return response.forbidden(res, '账号已被禁用');
      }
      
      // 超级管理员拥有所有权限
      if (admin.role && admin.role.id === 1) {
        return next();
      }
      
      // 检查权限
      if (!admin.role || !admin.role.permissions) {
        return response.forbidden(res, '无权限访问');
      }
      
      const hasPermission = admin.role.permissions.some(
        p => p.code === permissionCode
      );
      
      if (!hasPermission) {
        logger.warn(`Permission denied: ${admin.username} attempted to access ${permissionCode}`);
        return response.forbidden(res, '无权限访问');
      }
      
      next();
    } catch (err) {
      logger.error(`Permission middleware error: ${err.message}`);
      return response.serverError(res, '权限验证失败');
    }
  };
};

module.exports = permission;
