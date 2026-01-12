/**
 * 管理端认证控制器
 */
const authService = require('../../services/admin/authService');
const { response, validator } = require('../../utils');

/**
 * 管理员登录
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 参数验证
    if (!username || !password) {
      return response.badRequest(res, '用户名和密码不能为空');
    }

    // 获取客户端IP
    const ip = req.ip || req.connection.remoteAddress;

    // 执行登录
    const result = await authService.login(username, password, ip);

    return response.success(res, result, '登录成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取当前管理员信息
 */
const getProfile = async (req, res, next) => {
  try {
    const adminId = req.userId;

    const admin = await authService.getProfile(adminId);

    return response.success(res, admin);
  } catch (err) {
    next(err);
  }
};

/**
 * 修改密码
 */
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const adminId = req.userId;

    // 参数验证
    if (!oldPassword || !newPassword) {
      return response.badRequest(res, '旧密码和新密码不能为空');
    }

    // 验证新密码格式
    if (!validator.isValidPassword(newPassword)) {
      return response.badRequest(res, '新密码格式不正确（6-20位，包含字母和数字）');
    }

    // 修改密码
    await authService.changePassword(adminId, oldPassword, newPassword);

    return response.success(res, null, '密码修改成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 退出登录
 */
const logout = async (req, res, next) => {
  try {
    // JWT无状态，前端删除Token即可
    return response.success(res, null, '退出成功');
  } catch (err) {
    next(err);
  }
};

// ==================== 管理员管理 ====================

/**
 * 获取管理员列表
 */
const getAdministratorList = async (req, res, next) => {
  try {
    const { page, pageSize, username, roleId, status } = req.query;
    const result = await authService.getAdministratorList({
      page,
      pageSize,
      username,
      roleId,
      status
    });
    return response.success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取管理员详情
 */
const getAdministratorDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await authService.getAdministratorDetail(id);
    return response.success(res, admin);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建管理员
 */
const createAdministrator = async (req, res, next) => {
  try {
    const { username, password, remark, roleId } = req.body;
    
    // 参数验证
    if (!username || !password || !roleId) {
      return response.badRequest(res, '用户名、密码和角色ID不能为空');
    }

    // 验证用户名格式（3-20位字母数字下划线）
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return response.badRequest(res, '用户名格式不正确（3-20位字母数字下划线）');
    }

    // 验证密码格式
    const { validator } = require('../../utils');
    if (!validator.isValidPassword(password)) {
      return response.badRequest(res, '密码格式不正确（6-20位，包含字母和数字）');
    }

    const admin = await authService.createAdministrator({
      username,
      password,
      remark,
      roleId
    });
    return response.success(res, admin, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新管理员
 */
const updateAdministrator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password, remark, roleId, status } = req.body;
    const currentAdminId = req.userId;

    // 如果修改密码，验证密码格式
    if (password) {
      const { validator } = require('../../utils');
      if (!validator.isValidPassword(password)) {
        return response.badRequest(res, '密码格式不正确（6-20位，包含字母和数字）');
      }
    }

    await authService.updateAdministrator(id, {
      password,
      remark,
      roleId,
      status
    }, currentAdminId);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除管理员
 */
const deleteAdministrator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentAdminId = req.userId;
    await authService.deleteAdministrator(id, currentAdminId);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取管理员选项列表
 */
const getAdministratorOptions = async (req, res, next) => {
  try {
    const options = await authService.getAdministratorOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

// ==================== 角色管理 ====================

/**
 * 获取角色列表
 */
const getRoleList = async (req, res, next) => {
  try {
    const { page, pageSize, name } = req.query;
    const result = await authService.getRoleList({
      page,
      pageSize,
      name
    });
    return response.success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取角色详情
 */
const getRoleDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = await authService.getRoleDetail(id);
    return response.success(res, role);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建角色
 */
const createRole = async (req, res, next) => {
  try {
    const { name, description, permission_ids } = req.body;
    
    // 参数验证
    if (!name || !permission_ids || !Array.isArray(permission_ids)) {
      return response.badRequest(res, '角色名称和权限ID数组不能为空');
    }

    const role = await authService.createRole({
      name,
      description,
      permissionIds: permission_ids  // 转换为服务层使用的命名
    });
    return response.success(res, role, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新角色
 */
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, permission_ids } = req.body;

    await authService.updateRole(id, {
      name,
      description,
      permissionIds: permission_ids  // 转换为服务层使用的命名
    });
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除角色
 */
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    await authService.deleteRole(id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

// ==================== 权限管理 ====================

/**
 * 获取权限树形列表
 */
const getPermissionList = async (req, res, next) => {
  try {
    const permissions = await authService.getPermissionList();
    return response.success(res, permissions);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建权限
 */
const createPermission = async (req, res, next) => {
  try {
    const { name, code, resource, method, parentId, sortOrder } = req.body;
    
    // 参数验证
    if (!name || !code || !resource || !method) {
      return response.badRequest(res, '权限名称、代码、资源路径和请求方法不能为空');
    }

    const permission = await authService.createPermission({
      name,
      code,
      resource,
      method,
      parentId: parentId || 0,
      sortOrder: sortOrder || 0
    });
    return response.success(res, permission, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新权限
 */
const updatePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, resource, method, parentId, sortOrder } = req.body;

    await authService.updatePermission(id, {
      name,
      code,
      resource,
      method,
      parentId,
      sortOrder
    });
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除权限
 */
const deletePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    await authService.deletePermission(id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  getProfile,
  changePassword,
  logout,
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
  getPermissionList,
  createPermission,
  updatePermission,
  deletePermission
};
