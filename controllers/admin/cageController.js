/**
 * 管理端笼位预约控制器
 */
const cageService = require('../../services/admin/cageService');
const { response } = require('../../utils');

// ==================== 笼位管理 ====================

/**
 * 获取笼位列表
 */
const getCageList = async (req, res, next) => {
  try {
    const result = await cageService.getCageList(req.query);
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
 * 获取笼位详情
 */
const getCageDetail = async (req, res, next) => {
  try {
    const cage = await cageService.getCageDetail(req.params.id);
    return response.success(res, cage);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建笼位
 */
const createCage = async (req, res, next) => {
  try {
    const cage = await cageService.createCage(req.body);
    return response.success(res, cage, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新笼位
 */
const updateCage = async (req, res, next) => {
  try {
    await cageService.updateCage(req.params.id, req.body);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除笼位
 */
const deleteCage = async (req, res, next) => {
  try {
    await cageService.deleteCage(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 根据动物类型获取环境类型选项
 */
const getEnvironmentsByAnimalType = async (req, res, next) => {
  try {
    const { animal_type_id } = req.query;
    
    if (!animal_type_id) {
      return response.badRequest(res, '动物类型ID不能为空');
    }
    
    const environments = await cageService.getEnvironmentsByAnimalType(animal_type_id);
    return response.success(res, environments);
  } catch (err) {
    next(err);
  }
};

/**
 * 查询笼位剩余可用数量
 */
const getCageAvailableQuantity = async (req, res, next) => {
  try {
    const { animal_type_id, environment_id, start_date, end_date, exclude_reservation_id } = req.query;
    
    if (!animal_type_id) {
      return response.badRequest(res, '动物类型ID不能为空');
    }
    if (!environment_id) {
      return response.badRequest(res, '环境ID不能为空');
    }
    if (!start_date) {
      return response.badRequest(res, '开始日期不能为空');
    }
    
    const result = await cageService.getCageAvailableQuantity({
      animal_type_id,
      environment_id,
      start_date,
      end_date: end_date || null,
      exclude_reservation_id: exclude_reservation_id ? parseInt(exclude_reservation_id) : null
    });
    return response.success(res, result);
  } catch (err) {
    next(err);
  }
};

// ==================== 订单管理 ====================

/**
 * 获取预约订单列表
 */
const getReservationList = async (req, res, next) => {
  try {
    const result = await cageService.getReservationList(req.query);
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
 * 获取预约订单详情
 */
const getReservationDetail = async (req, res, next) => {
  try {
    const reservation = await cageService.getReservationDetail(req.params.id);
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
    const reservation = await cageService.createReservation(req.body, req.userId);
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
    await cageService.updateReservation(req.params.id, req.body);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 审核预约订单
 */
const auditReservation = async (req, res, next) => {
  try {
    const { status, reject_reason, handler_id } = req.body;
    await cageService.auditReservation(
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
 * 完成预约订单
 */
const completeReservation = async (req, res, next) => {
  try {
    await cageService.completeReservation(req.params.id);
    return response.success(res, null, '订单已完成');
  } catch (err) {
    next(err);
  }
};

/**
 * 取消预约订单
 */
const cancelReservation = async (req, res, next) => {
  try {
    await cageService.cancelReservation(req.params.id);
    return response.success(res, null, '订单已取消');
  } catch (err) {
    next(err);
  }
};

// ==================== 用途管理 ====================

/**
 * 获取用途列表
 */
const getPurposeList = async (req, res, next) => {
  try {
    const { page, pageSize, name } = req.query;
    const result = await cageService.getPurposeList({
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
 * 创建用途
 */
const createPurpose = async (req, res, next) => {
  try {
    const { name } = req.body;
    const purpose = await cageService.createPurpose(name);
    return response.success(res, purpose, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新用途
 */
const updatePurpose = async (req, res, next) => {
  try {
    const { name } = req.body;
    await cageService.updatePurpose(req.params.id, name);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除用途
 */
const deletePurpose = async (req, res, next) => {
  try {
    await cageService.deletePurpose(req.params.id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取笼位用途选项列表（用于下拉选择）
 */
const getPurposeOptions = async (req, res, next) => {
  try {
    const options = await cageService.getPurposeOptions();
    return response.success(res, options);
  } catch (err) {
    next(err);
  }
};


module.exports = {
  // 笼位管理
  getCageList,
  getCageDetail,
  createCage,
  updateCage,
  deleteCage,
  getEnvironmentsByAnimalType,
  getCageAvailableQuantity,
  
  // 订单管理
  getReservationList,
  getReservationDetail,
  createReservation,
  updateReservation,
  auditReservation,
  completeReservation,
  cancelReservation,
  
  // 用途管理
  getPurposeList,
  getPurposeOptions,
  createPurpose,
  updatePurpose,
  deletePurpose
};
