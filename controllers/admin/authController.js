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

module.exports = {
  login,
  getProfile,
  changePassword,
  logout
};
