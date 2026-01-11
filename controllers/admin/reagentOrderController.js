/**
 * 管理端试剂耗材订购控制器
 */
const reagentOrderService = require('../../services/admin/reagentOrderService');
const { response } = require('../../utils');

// ==================== 订单管理 ====================

/**
 * 获取试剂订单列表
 */
const getOrderList = async (req, res, next) => {
  try {
    const result = await reagentOrderService.getOrderList(req.query);
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
 * 获取试剂订单详情
 */
const getOrderDetail = async (req, res, next) => {
  try {
    const order = await reagentOrderService.getOrderDetail(req.params.id);
    return response.success(res, order);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建试剂订单
 */
const createOrder = async (req, res, next) => {
  try {
    const order = await reagentOrderService.createOrder(req.body);
    return response.success(res, order, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新试剂订单
 */
const updateOrder = async (req, res, next) => {
  try {
    await reagentOrderService.updateOrder(req.params.id, req.body);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 审核试剂订单
 */
const auditOrder = async (req, res, next) => {
  try {
    const { status, rejectReason, handlerId } = req.body;
    await reagentOrderService.auditOrder(
      req.params.id, 
      Number(status), 
      rejectReason, 
      handlerId, 
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
 * 完成试剂订单
 */
const completeOrder = async (req, res, next) => {
  try {
    await reagentOrderService.completeOrder(req.params.id);
    return response.success(res, null, '订单已完成');
  } catch (err) {
    next(err);
  }
};

/**
 * 取消试剂订单
 */
const cancelOrder = async (req, res, next) => {
  try {
    await reagentOrderService.cancelOrder(req.params.id);
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
    const result = await reagentOrderService.getBrandList({
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
    const brand = await reagentOrderService.createBrand(name);
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
    await reagentOrderService.updateBrand(req.params.id, name);
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
    await reagentOrderService.deleteBrand(req.params.id);
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
    const result = await reagentOrderService.getSpecificationList({
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
    const spec = await reagentOrderService.createSpecification(name);
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
    await reagentOrderService.updateSpecification(req.params.id, name);
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
    await reagentOrderService.deleteSpecification(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

// ==================== Options 函数 ====================

/**
 * 获取试剂品牌选项列表
 */
const getBrandOptions = async (req, res, next) => {
  try {
    const options = await reagentOrderService.getBrandOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取试剂规格选项列表
 */
const getSpecificationOptions = async (req, res, next) => {
  try {
    const options = await reagentOrderService.getSpecificationOptions();
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
  
  // 规格管理
  getSpecificationList,
  getSpecificationOptions,
  createSpecification,
  updateSpecification,
  deleteSpecification
};
