/**
 * 用户端认证控制器
 */
const authService = require('../../services/h5/authService');
const { response, validator } = require('../../utils');

/**
 * 发送验证码
 */
const sendCode = async (req, res, next) => {
  try {
    const { phone, type } = req.body;

    // 参数验证
    if (!phone) {
      return response.badRequest(res, '手机号不能为空');
    }

    if (!validator.isValidPhone(phone)) {
      return response.badRequest(res, '手机号格式不正确');
    }

    if (!type || ![1, 2].includes(Number(type))) {
      return response.badRequest(res, '验证码类型不正确');
    }

    // 发送验证码
    const result = await authService.sendCode(phone, Number(type));

    return response.success(res, null, result.message);
  } catch (err) {
    next(err);
  }
};

/**
 * 用户登录
 */
const login = async (req, res, next) => {
  try {
    const { phone, code } = req.body;

    // 参数验证
    if (!phone || !code) {
      return response.badRequest(res, '手机号和验证码不能为空');
    }

    if (!validator.isValidPhone(phone)) {
      return response.badRequest(res, '手机号格式不正确');
    }

    if (!validator.isValidCode(code)) {
      return response.badRequest(res, '验证码格式不正确');
    }

    // 执行登录
    const result = await authService.login(phone, code);

    return response.success(res, result, '登录成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 用户注册
 */
const register = async (req, res, next) => {
  try {
    const { name, phone, code, organization_id, research_group_id, province_id, city_id, district_id, address } = req.body;

    // 参数验证
    if (!name || !phone || !code) {
      return response.badRequest(res, '姓名、手机号和验证码不能为空');
    }

    if (!validator.isValidPhone(phone)) {
      return response.badRequest(res, '手机号格式不正确');
    }

    if (!validator.isValidCode(code)) {
      return response.badRequest(res, '验证码格式不正确');
    }

    // 注册用户
    const result = await authService.register({
      name,
      phone,
      code,
      organization_id,
      research_group_id,
      province_id,
      city_id,
      district_id,
      address
    });

    return response.success(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取用户信息
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await authService.getProfile(userId);

    return response.success(res, user);
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
  sendCode,
  login,
  register,
  getProfile,
  logout
};
