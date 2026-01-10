/**
 * 统一响应格式工具
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {String} message - 提示信息
 * @param {Number} code - 状态码
 */
const success = (res, data = null, message = 'success', code = 200) => {
  return res.status(200).json({
    code,
    message,
    data
  });
};

/**
 * 失败响应
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误信息
 * @param {Number} code - 状态码
 * @param {*} data - 附加数据
 */
const error = (res, message = '操作失败', code = 400, data = null) => {
  return res.status(200).json({
    code,
    message,
    data
  });
};

/**
 * 分页响应
 * @param {Object} res - Express响应对象
 * @param {Array} list - 数据列表
 * @param {Number} total - 总记录数
 * @param {Number} page - 当前页码
 * @param {Number} pageSize - 每页数量
 * @param {String} message - 提示信息
 */
const paginate = (res, list, total, page, pageSize, message = 'success') => {
  const totalPages = Math.ceil(total / pageSize);
  
  return res.status(200).json({
    code: 200,
    message,
    data: {
      list,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages
    }
  });
};

/**
 * 参数错误响应
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误信息
 */
const badRequest = (res, message = '参数错误') => {
  return error(res, message, 400);
};

/**
 * 未授权响应
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误信息
 */
const unauthorized = (res, message = '未登录或Token失效') => {
  return error(res, message, 401);
};

/**
 * 无权限响应
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误信息
 */
const forbidden = (res, message = '无权限访问') => {
  return error(res, message, 403);
};

/**
 * 资源不存在响应
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误信息
 */
const notFound = (res, message = '资源不存在') => {
  return error(res, message, 404);
};

/**
 * 服务器错误响应
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误信息
 */
const serverError = (res, message = '服务器内部错误') => {
  return error(res, message, 500);
};

/**
 * 请求频率超限响应
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误信息
 */
const tooManyRequests = (res, message = '请求频率超限，请稍后再试') => {
  return error(res, message, 429);
};

module.exports = {
  success,
  error,
  paginate,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
  tooManyRequests
};
