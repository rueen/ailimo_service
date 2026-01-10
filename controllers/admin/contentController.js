/**
 * 管理端内容管理控制器
 * 包括：案例管理、公司信息、负责人、环境类型、动物类型、统计
 */
const contentService = require('../../services/admin/contentService');
const { response } = require('../../utils');

// ==================== 案例管理 ====================

/**
 * 获取案例列表
 */
const getCaseList = async (req, res, next) => {
  try {
    const result = await contentService.getCaseList(req.query);
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
 * 获取案例详情
 */
const getCaseDetail = async (req, res, next) => {
  try {
    const caseItem = await contentService.getCaseDetail(req.params.id);
    return response.success(res, caseItem);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建案例
 */
const createCase = async (req, res, next) => {
  try {
    const caseItem = await contentService.createCase(req.body);
    return response.success(res, caseItem, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新案例
 */
const updateCase = async (req, res, next) => {
  try {
    await contentService.updateCase(req.params.id, req.body);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除案例
 */
const deleteCase = async (req, res, next) => {
  try {
    await contentService.deleteCase(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

// ==================== 公司信息管理 ====================

/**
 * 获取公司信息
 */
const getCompanyInfo = async (req, res, next) => {
  try {
    const info = await contentService.getCompanyInfo();
    return response.success(res, info);
  } catch (err) {
    next(err);
  }
};

/**
 * 更新公司信息
 */
const updateCompanyInfo = async (req, res, next) => {
  try {
    const info = await contentService.updateCompanyInfo(req.body);
    return response.success(res, info, '更新成功');
  } catch (err) {
    next(err);
  }
};

// ==================== 负责人管理 ====================

/**
 * 获取负责人列表
 */
const getHandlerList = async (req, res, next) => {
  try {
    const { all } = req.query;
    if (all === 'true') {
      const list = await contentService.getAllHandlers();
      return response.success(res, list);
    } else {
      const result = await contentService.getHandlerList(req.query);
      return response.paginate(
        res, 
        result.list, 
        result.total, 
        result.page, 
        result.pageSize
      );
    }
  } catch (err) {
    next(err);
  }
};

/**
 * 创建负责人
 */
const createHandler = async (req, res, next) => {
  try {
    const { name } = req.body;
    const handler = await contentService.createHandler(name);
    return response.success(res, handler, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新负责人
 */
const updateHandler = async (req, res, next) => {
  try {
    const { name } = req.body;
    await contentService.updateHandler(req.params.id, name);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除负责人
 */
const deleteHandler = async (req, res, next) => {
  try {
    await contentService.deleteHandler(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取负责人完成订单统计
 */
const getHandlerStatistics = async (req, res, next) => {
  try {
    const { handlerId } = req.query;
    const statistics = await contentService.getHandlerStatistics(handlerId);
    return response.success(res, statistics);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取负责人选项列表（用于下拉选择）
 */
const getHandlerOptions = async (req, res, next) => {
  try {
    const options = await contentService.getHandlerOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

// ==================== 环境类型管理 ====================

/**
 * 获取环境类型列表
 */
const getEnvironmentTypeList = async (req, res, next) => {
  try {
    const result = await contentService.getEnvironmentTypeList(req.query);
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
 * 创建环境类型
 */
const createEnvironmentType = async (req, res, next) => {
  try {
    const { name } = req.body;
    const type = await contentService.createEnvironmentType(name);
    return response.success(res, type, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新环境类型
 */
const updateEnvironmentType = async (req, res, next) => {
  try {
    const { name } = req.body;
    await contentService.updateEnvironmentType(req.params.id, name);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除环境类型
 */
const deleteEnvironmentType = async (req, res, next) => {
  try {
    await contentService.deleteEnvironmentType(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取环境类型选项列表（用于下拉选择）
 */
const getEnvironmentTypeOptions = async (req, res, next) => {
  try {
    const options = await contentService.getEnvironmentTypeOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

// ==================== 动物类型管理 ====================

/**
 * 获取动物类型列表
 */
const getAnimalTypeList = async (req, res, next) => {
  try {
    const result = await contentService.getAnimalTypeList(req.query);
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
 * 创建动物类型
 */
const createAnimalType = async (req, res, next) => {
  try {
    const { name } = req.body;
    const type = await contentService.createAnimalType(name);
    return response.success(res, type, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新动物类型
 */
const updateAnimalType = async (req, res, next) => {
  try {
    const { name } = req.body;
    await contentService.updateAnimalType(req.params.id, name);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除动物类型
 */
const deleteAnimalType = async (req, res, next) => {
  try {
    await contentService.deleteAnimalType(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取动物类型选项列表（用于下拉选择）
 */
const getAnimalTypeOptions = async (req, res, next) => {
  try {
    const options = await contentService.getAnimalTypeOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  // 案例管理
  getCaseList,
  getCaseDetail,
  createCase,
  updateCase,
  deleteCase,
  
  // 公司信息
  getCompanyInfo,
  updateCompanyInfo,
  
  // 负责人管理
  getHandlerList,
  createHandler,
  updateHandler,
  deleteHandler,
  getHandlerOptions,
  getHandlerStatistics,
  
  // 环境类型管理
  getEnvironmentTypeList,
  createEnvironmentType,
  updateEnvironmentType,
  deleteEnvironmentType,
  getEnvironmentTypeOptions,
  
  // 动物类型管理
  getAnimalTypeList,
  createAnimalType,
  updateAnimalType,
  deleteAnimalType,
  getAnimalTypeOptions
};
