/**
 * 管理端实验代操作控制器
 */
const experimentService = require('../../services/admin/experimentService');
const { response } = require('../../utils');

// ==================== 实验操作订单管理 ====================

/**
 * 获取实验操作订单列表
 */
const getOperationList = async (req, res, next) => {
  try {
    const result = await experimentService.getOperationList(req.query);
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
 * 获取实验操作订单详情
 */
const getOperationDetail = async (req, res, next) => {
  try {
    const operation = await experimentService.getOperationDetail(req.params.id);
    return response.success(res, operation);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建实验操作订单
 */
const createOperation = async (req, res, next) => {
  try {
    const operation = await experimentService.createOperation(req.body);
    return response.success(res, operation, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新实验操作订单
 */
const updateOperation = async (req, res, next) => {
  try {
    await experimentService.updateOperation(req.params.id, req.body);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 审核实验操作订单
 */
const auditOperation = async (req, res, next) => {
  try {
    const { status, rejectReason, handlerId } = req.body;
    await experimentService.auditOperation(
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
 * 完成实验操作订单
 */
const completeOperation = async (req, res, next) => {
  try {
    await experimentService.completeOperation(req.params.id);
    return response.success(res, null, '订单已完成');
  } catch (err) {
    next(err);
  }
};

/**
 * 取消实验操作订单
 */
const cancelOperation = async (req, res, next) => {
  try {
    await experimentService.cancelOperation(req.params.id);
    return response.success(res, null, '订单已取消');
  } catch (err) {
    next(err);
  }
};

// ==================== 操作内容管理 ====================

/**
 * 获取操作内容列表
 */
const getOperationContentList = async (req, res, next) => {
  try {
    const list = await experimentService.getOperationContentList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建操作内容
 */
const createOperationContent = async (req, res, next) => {
  try {
    const { name } = req.body;
    const content = await experimentService.createOperationContent(name);
    return response.success(res, content, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新操作内容
 */
const updateOperationContent = async (req, res, next) => {
  try {
    const { name } = req.body;
    await experimentService.updateOperationContent(req.params.id, name);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除操作内容
 */
const deleteOperationContent = async (req, res, next) => {
  try {
    await experimentService.deleteOperationContent(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取操作内容选项列表（用于下拉选择）
 */
const getOperationContentOptions = async (req, res, next) => {
  try {
    const options = await experimentService.getOperationContentOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

// ==================== 时间段管理 ====================

/**
 * 获取时间段列表
 */
const getTimeSlotList = async (req, res, next) => {
  try {
    const { all } = req.query;
    const list = await experimentService.getTimeSlotList(all !== 'true');
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建时间段
 */
const createTimeSlot = async (req, res, next) => {
  try {
    const timeSlot = await experimentService.createTimeSlot(req.body);
    return response.success(res, timeSlot, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新时间段
 */
const updateTimeSlot = async (req, res, next) => {
  try {
    await experimentService.updateTimeSlot(req.params.id, req.body);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除时间段
 */
const deleteTimeSlot = async (req, res, next) => {
  try {
    await experimentService.deleteTimeSlot(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取实验时间段选项列表（用于下拉选择）
 */
const getTimeSlotOptions = async (req, res, next) => {
  try {
    const options = await experimentService.getTimeSlotOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  // 订单管理
  getOperationList,
  getOperationDetail,
  createOperation,
  updateOperation,
  auditOperation,
  completeOperation,
  cancelOperation,
  
  // 操作内容管理
  getOperationContentList,
  getOperationContentOptions,
  createOperationContent,
  updateOperationContent,
  deleteOperationContent,
  
  // 时间段管理
  getTimeSlotList,
  getTimeSlotOptions,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot
};
