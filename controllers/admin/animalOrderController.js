/**
 * 管理端动物订购控制器
 */
const animalOrderService = require('../../services/admin/animalOrderService');
const { response } = require('../../utils');

// ==================== 订单管理 ====================

/**
 * 获取动物订单列表
 */
const getOrderList = async (req, res, next) => {
  try {
    const result = await animalOrderService.getOrderList(req.query);
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
 * 获取动物订单详情
 */
const getOrderDetail = async (req, res, next) => {
  try {
    const order = await animalOrderService.getOrderDetail(req.params.id);
    return response.success(res, order);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建动物订单
 */
const createOrder = async (req, res, next) => {
  try {
    const order = await animalOrderService.createOrder(req.body);
    return response.success(res, order, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新动物订单
 */
const updateOrder = async (req, res, next) => {
  try {
    await animalOrderService.updateOrder(req.params.id, req.body);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 审核动物订单
 */
const auditOrder = async (req, res, next) => {
  try {
    const { status, reject_reason, handler_id } = req.body;
    await animalOrderService.auditOrder(
      req.params.id, 
      Number(status), 
      reject_reason, 
      handler_id, 
      req.userId
    );
    return response.success(
      res, 
      null, 
      status == 1 ? '审核通过' : '审核拒绝'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * 完成动物订单
 */
const completeOrder = async (req, res, next) => {
  try {
    await animalOrderService.completeOrder(req.params.id);
    return response.success(res, null, '订单已完成');
  } catch (err) {
    next(err);
  }
};

/**
 * 取消动物订单
 */
const cancelOrder = async (req, res, next) => {
  try {
    await animalOrderService.cancelOrder(req.params.id);
    return response.success(res, null, '订单已取消');
  } catch (err) {
    next(err);
  }
};

// ==================== 品牌管理 ====================

/**
 * 获取品牌列表
 */
const getBrandList = async (req, res, next) => {
  try {
    const { page, pageSize, name } = req.query;
    const result = await animalOrderService.getBrandList({
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
 * 创建品牌
 */
const createBrand = async (req, res, next) => {
  try {
    const { name } = req.body;
    const brand = await animalOrderService.createBrand(name);
    return response.success(res, brand, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新品牌
 */
const updateBrand = async (req, res, next) => {
  try {
    const { name } = req.body;
    await animalOrderService.updateBrand(req.params.id, name);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除品牌
 */
const deleteBrand = async (req, res, next) => {
  try {
    await animalOrderService.deleteBrand(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

// ==================== 品系管理 ====================

/**
 * 获取品系列表
 */
const getVarietyList = async (req, res, next) => {
  try {
    const { page, pageSize, name, brandId } = req.query;
    const result = await animalOrderService.getVarietyList({
      page,
      pageSize,
      name,
      brandId
    });
    return response.success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建品系
 */
const createVariety = async (req, res, next) => {
  try {
    const variety = await animalOrderService.createVariety(req.body);
    return response.success(res, variety, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新品系
 */
const updateVariety = async (req, res, next) => {
  try {
    await animalOrderService.updateVariety(req.params.id, req.body);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除品系
 */
const deleteVariety = async (req, res, next) => {
  try {
    await animalOrderService.deleteVariety(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

// ==================== 规格管理 ====================

/**
 * 获取规格列表
 */
const getSpecificationList = async (req, res, next) => {
  try {
    const { page, pageSize, name } = req.query;
    const result = await animalOrderService.getSpecificationList({
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
 * 创建规格
 */
const createSpecification = async (req, res, next) => {
  try {
    const { name } = req.body;
    const spec = await animalOrderService.createSpecification(name);
    return response.success(res, spec, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新规格
 */
const updateSpecification = async (req, res, next) => {
  try {
    const { name } = req.body;
    await animalOrderService.updateSpecification(req.params.id, name);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除规格
 */
const deleteSpecification = async (req, res, next) => {
  try {
    await animalOrderService.deleteSpecification(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

// ==================== 需求管理 ====================

/**
 * 获取需求列表
 */
const getRequirementList = async (req, res, next) => {
  try {
    const { page, pageSize, name } = req.query;
    const result = await animalOrderService.getRequirementList({
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
 * 创建需求
 */
const createRequirement = async (req, res, next) => {
  try {
    const { name } = req.body;
    const req_item = await animalOrderService.createRequirement(name);
    return response.success(res, req_item, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新需求
 */
const updateRequirement = async (req, res, next) => {
  try {
    const { name } = req.body;
    await animalOrderService.updateRequirement(req.params.id, name);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除需求
 */
const deleteRequirement = async (req, res, next) => {
  try {
    await animalOrderService.deleteRequirement(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

// ==================== Options 函数 ====================

/**
 * 获取动物品牌选项列表
 */
const getBrandOptions = async (req, res, next) => {
  try {
    const options = await animalOrderService.getBrandOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取动物品种选项列表
 */
const getVarietyOptions = async (req, res, next) => {
  try {
    const { brandId } = req.query;
    const options = await animalOrderService.getVarietyOptions(brandId);
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取动物规格选项列表
 */
const getSpecificationOptions = async (req, res, next) => {
  try {
    const options = await animalOrderService.getSpecificationOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取动物要求选项列表
 */
const getRequirementOptions = async (req, res, next) => {
  try {
    const options = await animalOrderService.getRequirementOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  // 订单管理
  getOrderList,
  getOrderDetail,
  createOrder,
  updateOrder,
  auditOrder,
  completeOrder,
  cancelOrder,
  
  // 品牌管理
  getBrandList,
  getBrandOptions,
  createBrand,
  updateBrand,
  deleteBrand,
  
  // 品系管理
  getVarietyList,
  getVarietyOptions,
  createVariety,
  updateVariety,
  deleteVariety,
  
  // 规格管理
  getSpecificationList,
  getSpecificationOptions,
  createSpecification,
  updateSpecification,
  deleteSpecification,
  
  // 需求管理
  getRequirementList,
  getRequirementOptions,
  createRequirement,
  updateRequirement,
  deleteRequirement
};
