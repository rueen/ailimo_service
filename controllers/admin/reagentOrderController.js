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
    const order = await reagentOrderService.createOrder(req.body, req.userId);
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
    const { status, reject_reason, handler_id } = req.body;
    await reagentOrderService.auditOrder(
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


module.exports = {
  // 订单管理
  getOrderList,
  getOrderDetail,
  createOrder,
  updateOrder,
  auditOrder,
  completeOrder,
  cancelOrder
};
