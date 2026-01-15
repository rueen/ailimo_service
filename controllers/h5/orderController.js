/**
 * 用户端订单控制器
 */
const orderService = require('../../services/h5/orderService');
const { response } = require('../../utils');

// ==================== 订单提交 ====================

/**
 * 提交设备租赁订单
 */
const createEquipmentReservation = async (req, res, next) => {
  try {
    const reservation = await orderService.createEquipmentReservation(req.userId, req.body);
    return response.success(res, reservation, '提交成功，请等待审核');
  } catch (err) {
    next(err);
  }
};

/**
 * 提交笼位租赁订单
 */
const createCageReservation = async (req, res, next) => {
  try {
    const reservation = await orderService.createCageReservation(req.userId, req.body);
    return response.success(res, reservation, '提交成功，请等待审核');
  } catch (err) {
    next(err);
  }
};

/**
 * 提交实验代操作订单
 */
const createExperimentOperation = async (req, res, next) => {
  try {
    const operation = await orderService.createExperimentOperation(req.userId, req.body);
    return response.success(res, operation, '提交成功，请等待审核');
  } catch (err) {
    next(err);
  }
};

/**
 * 提交动物订购订单
 */
const createAnimalOrder = async (req, res, next) => {
  try {
    const order = await orderService.createAnimalOrder(req.userId, req.body);
    return response.success(res, order, '提交成功，请等待审核');
  } catch (err) {
    next(err);
  }
};

/**
 * 提交试剂耗材订购订单
 */
const createReagentOrder = async (req, res, next) => {
  try {
    const order = await orderService.createReagentOrder(req.userId, req.body);
    return response.success(res, order, '提交成功，请等待审核');
  } catch (err) {
    next(err);
  }
};

// ==================== 订单查询 ====================

/**
 * 获取我的订单列表
 */
const getMyOrders = async (req, res, next) => {
  try {
    const result = await orderService.getMyOrders(req.userId, req.query);
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
 * 获取订单详情
 */
const getOrderDetail = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const order = await orderService.getOrderDetail(req.userId, type, id);
    return response.success(res, order);
  } catch (err) {
    next(err);
  }
};

// ==================== 案例和公司信息 ====================

/**
 * 获取案例列表
 */
const getCaseList = async (req, res, next) => {
  try {
    const list = await orderService.getCaseList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取案例详情
 */
const getCaseDetail = async (req, res, next) => {
  try {
    const caseItem = await orderService.getCaseDetail(req.params.id);
    return response.success(res, caseItem);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取公司信息
 */
const getCompanyInfo = async (req, res, next) => {
  try {
    const info = await orderService.getCompanyInfo();
    return response.success(res, info);
  } catch (err) {
    next(err);
  }
};

// ==================== 时间段查询 ====================

/**
 * 获取设备租赁时间段列表
 */
const getEquipmentTimeSlots = async (req, res, next) => {
  try {
    const slots = await orderService.getEquipmentTimeSlots();
    return response.success(res, slots);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取笼位租赁时间段列表
 */
const getCageTimeSlots = async (req, res, next) => {
  try {
    const slots = await orderService.getCageTimeSlots();
    return response.success(res, slots);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取实验代操作时间段列表
 */
const getExperimentTimeSlots = async (req, res, next) => {
  try {
    const slots = await orderService.getExperimentTimeSlots();
    return response.success(res, slots);
  } catch (err) {
    next(err);
  }
};

// ==================== 基础数据查询 ====================

/**
 * 获取设备列表
 */
const getEquipmentList = async (req, res, next) => {
  try {
    const list = await orderService.getEquipmentList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取笼位列表
 */
const getCageList = async (req, res, next) => {
  try {
    const list = await orderService.getCageList();
    return response.success(res, list);
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
    
    const environments = await orderService.getEnvironmentsByAnimalType(animal_type_id);
    return response.success(res, environments);
  } catch (err) {
    next(err);
  }
};

/**
 * 查询笼位可用时间段
 */
const getAvailableTimeSlotsByType = async (req, res, next) => {
  try {
    const { animal_type_id, environment_id, date } = req.query;
    
    if (!animal_type_id) {
      return response.badRequest(res, '动物类型ID不能为空');
    }
    if (!environment_id) {
      return response.badRequest(res, '环境ID不能为空');
    }
    if (!date) {
      return response.badRequest(res, '查询日期不能为空');
    }
    
    const result = await orderService.getAvailableTimeSlotsByType({
      animal_type_id,
      environment_id,
      date
    });
    return response.success(res, result);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取操作内容列表
 */
const getOperationContentList = async (req, res, next) => {
  try {
    const list = await orderService.getOperationContentList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取动物品牌列表
 */
const getAnimalBrandList = async (req, res, next) => {
  try {
    const list = await orderService.getAnimalBrandList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取动物品系列表
 */
const getAnimalVarietyList = async (req, res, next) => {
  try {
    const { brandId } = req.query;
    const list = await orderService.getAnimalVarietyList(brandId);
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取动物规格列表
 */
const getAnimalSpecificationList = async (req, res, next) => {
  try {
    const list = await orderService.getAnimalSpecificationList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取动物需求列表
 */
const getAnimalRequirementList = async (req, res, next) => {
  try {
    const list = await orderService.getAnimalRequirementList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取试剂品牌列表
 */
const getReagentBrandList = async (req, res, next) => {
  try {
    const list = await orderService.getReagentBrandList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取试剂规格列表
 */
const getReagentSpecificationList = async (req, res, next) => {
  try {
    const list = await orderService.getReagentSpecificationList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取组织机构列表
 */
const getOrganizationList = async (req, res, next) => {
  try {
    const list = await orderService.getOrganizationList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取课题组列表
 */
const getResearchGroupList = async (req, res, next) => {
  try {
    const { organization_id } = req.query;
    const list = await orderService.getResearchGroupList(organization_id);
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取环境类型列表
 */
const getEnvironmentTypeList = async (req, res, next) => {
  try {
    const list = await orderService.getEnvironmentTypeList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取动物类型列表
 */
const getAnimalTypeList = async (req, res, next) => {
  try {
    const list = await orderService.getAnimalTypeList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取笼位用途列表
 */
const getCagePurposeList = async (req, res, next) => {
  try {
    const list = await orderService.getCagePurposeList();
    return response.success(res, list);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取提前预约天数配置
 */
const getAdvanceDaysConfigs = async (req, res, next) => {
  try {
    const configs = await orderService.getAdvanceDaysConfigs();
    return response.success(res, configs);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  // 订单提交
  createEquipmentReservation,
  createCageReservation,
  createExperimentOperation,
  createAnimalOrder,
  createReagentOrder,
  
  // 订单查询
  getMyOrders,
  getOrderDetail,
  
  // 案例和公司信息
  getCaseList,
  getCaseDetail,
  getCompanyInfo,
  
  // 时间段
  getEquipmentTimeSlots,
  getCageTimeSlots,
  getExperimentTimeSlots,
  
  // 基础数据
  getEquipmentList,
  getCageList,
  getEnvironmentsByAnimalType,
  getAvailableTimeSlotsByType,
  getOperationContentList,
  getAnimalBrandList,
  getAnimalVarietyList,
  getAnimalSpecificationList,
  getAnimalRequirementList,
  getReagentBrandList,
  getReagentSpecificationList,
  getOrganizationList,
  getResearchGroupList,
  getEnvironmentTypeList,
  getAnimalTypeList,
  getCagePurposeList,
  
  // 系统配置
  getAdvanceDaysConfigs
};
