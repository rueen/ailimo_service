/**
 * H5端其他服务控制器
 */
const otherServiceService = require('../../services/h5/otherServiceService');
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

module.exports = {
  getOtherServiceList,
  getOtherServiceDetail
};
