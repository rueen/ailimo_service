/**
 * 地区控制器（公共）
 */
const regionService = require('../../services/common/regionService');
const { response } = require('../../utils');

/**
 * 获取地区列表
 */
const getRegionList = async (req, res, next) => {
  try {
    const { parent_id, level } = req.query;
    const regions = await regionService.getRegionList({ parent_id, level });
    return response.success(res, regions);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取地区详情
 */
const getRegionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const region = await regionService.getRegionById(id);
    return response.success(res, region);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取地区树形结构（可选）
 */
const getRegionTree = async (req, res, next) => {
  try {
    const tree = await regionService.getRegionTree();
    return response.success(res, tree);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRegionList,
  getRegionById,
  getRegionTree
};
