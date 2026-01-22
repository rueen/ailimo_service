/**
 * 管理端其他服务控制器
 */
const otherServiceService = require('../../services/admin/otherServiceService');
const { response } = require('../../utils');

/**
 * 获取其他服务列表
 */
const getOtherServiceList = async (req, res, next) => {
  try {
    const result = await otherServiceService.getOtherServiceList(req.query);
    return response.paginate(
      res, 
      result.list, 
      result.total, 
      result.page, 
      result.pageSize
    );
  } catch (err) {
    next(err);
  }
};

/**
 * 获取其他服务详情
 */
const getOtherServiceDetail = async (req, res, next) => {
  try {
    const service = await otherServiceService.getOtherServiceDetail(req.params.id);
    return response.success(res, service);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建其他服务
 */
const createOtherService = async (req, res, next) => {
  try {
    const service = await otherServiceService.createOtherService(req.body);
    return response.success(res, service, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新其他服务
 */
const updateOtherService = async (req, res, next) => {
  try {
    await otherServiceService.updateOtherService(req.params.id, req.body);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除其他服务
 */
const deleteOtherService = async (req, res, next) => {
  try {
    await otherServiceService.deleteOtherService(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOtherServiceList,
  getOtherServiceDetail,
  createOtherService,
  updateOtherService,
  deleteOtherService
};
