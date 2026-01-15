/**
 * 管理端设备租赁控制器
 */
const equipmentService = require('../../services/admin/equipmentService');
const { response } = require('../../utils');

// ==================== 设备管理 ====================

/**
 * 获取设备列表
 */
const getEquipmentList = async (req, res, next) => {
  try {
    const params = req.query;
    const result = await equipmentService.getEquipmentList(params);
    return response.paginate(res, result.list, result.total, result.page, result.pageSize);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取设备详情
 */
const getEquipmentDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const equipment = await equipmentService.getEquipmentDetail(id);
    return response.success(res, equipment);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建设备
 */
const createEquipment = async (req, res, next) => {
  try {
    const { name, details } = req.body;

    if (!name) {
      return response.badRequest(res, '设备名称不能为空');
    }

    const equipment = await equipmentService.createEquipment({ name, details });
    return response.success(res, equipment, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新设备
 */
const updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    await equipmentService.updateEquipment(id, data);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除设备
 */
const deleteEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    await equipmentService.deleteEquipment(id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取设备选项列表（用于下拉选择）
 */
const getEquipmentOptions = async (req, res, next) => {
  try {
    const options = await equipmentService.getEquipmentOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

// ==================== 订单管理 ====================

/**
 * 获取订单列表
 */
const getReservationList = async (req, res, next) => {
  try {
    const params = req.query;
    const result = await equipmentService.getReservationList(params);
    return response.paginate(res, result.list, result.total, result.page, result.pageSize);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取订单详情
 */
const getReservationDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reservation = await equipmentService.getReservationDetail(id);
    return response.success(res, reservation);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建预约订单
 */
const createReservation = async (req, res, next) => {
  try {
    const reservation = await equipmentService.createReservation(req.body);
    return response.success(res, reservation, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新预约订单
 */
const updateReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await equipmentService.updateReservation(id, req.body);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 审核订单
 */
const auditReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reject_reason, handler_id } = req.body;
    const adminId = req.userId;

    if (!status || ![1, 2].includes(Number(status))) {
      return response.badRequest(res, '审核状态不正确');
    }

    await equipmentService.auditReservation(id, Number(status), reject_reason, handler_id, adminId);
    
    const message = status == 1 ? '审核通过' : '审核拒绝';
    return response.success(res, null, message);
  } catch (err) {
    next(err);
  }
};

/**
 * 完成订单
 */
const completeReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await equipmentService.completeReservation(id);
    return response.success(res, null, '订单已完成');
  } catch (err) {
    next(err);
  }
};

/**
 * 取消订单
 */
const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await equipmentService.cancelReservation(id);
    return response.success(res, null, '订单已取消');
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
    const { status } = req.query;
    const slots = await equipmentService.getTimeSlotList(status);
    return response.success(res, slots);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建时间段
 */
const createTimeSlot = async (req, res, next) => {
  try {
    const { start_time, end_time, description, sort_order } = req.body;

    if (!start_time || !end_time) {
      return response.badRequest(res, '开始时间和结束时间不能为空');
    }

    const slot = await equipmentService.createTimeSlot({ start_time, end_time, description, sort_order });
    return response.success(res, slot, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新时间段
 */
const updateTimeSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const timeSlot = await equipmentService.updateTimeSlot(id, data);
    return response.success(res, timeSlot, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除时间段
 */
const deleteTimeSlot = async (req, res, next) => {
  try {
    const { id } = req.params;
    await equipmentService.deleteTimeSlot(id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取时间段选项列表（用于下拉选择）
 */
const getTimeSlotOptions = async (req, res, next) => {
  try {
    const options = await equipmentService.getTimeSlotOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取设备可用时间段
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    // 支持路径参数和查询参数两种方式
    const equipmentId = req.params.id || req.query.equipmentId;
    const date = req.query.date;

    if (!equipmentId || !date) {
      return response.badRequest(res, '设备ID和日期不能为空');
    }

    const slots = await equipmentService.getAvailableSlots(equipmentId, date);
    return response.success(res, slots);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEquipmentList,
  getEquipmentDetail,
  getEquipmentOptions,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getReservationList,
  getReservationDetail,
  createReservation,
  updateReservation,
  auditReservation,
  completeReservation,
  cancelReservation,
  getTimeSlotList,
  getTimeSlotOptions,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  getAvailableSlots
};
