/**
 * 用户端订单服务
 * 包括：设备租赁、笼位租赁、实验代操作、动物订购、试剂耗材订购、案例、公司信息
 */
const db = require('../../models');
const { validator } = require('../../utils');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

// ==================== 设备租赁订单 ====================

/**
 * 创建设备租赁订单
 * @param {Number} userId - 用户ID
 * @param {Object} data - 订单数据
 * @returns {Promise<Object>}
 */
const createEquipmentReservation = async (userId, data) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { equipment_id, reservation_date, time_slots } = data;

    // 检查设备是否存在且可用
    const equipment = await db.Equipment.findByPk(equipment_id, { transaction });
    if (!equipment) {
      throw new Error('设备不存在');
    }

    if (equipment.status !== 1) {
      throw new Error('设备不可用');
    }

    // 检查时间段可用性
    const timeSlotArray = JSON.parse(time_slots);
    for (const slot of timeSlotArray) {
      const isAvailable = await checkEquipmentAvailability(
        equipment_id,
        reservation_date,
        slot,
        transaction
      );

      if (!isAvailable) {
        throw new Error(`时间段 ${slot} 已被预约，请选择其他时间`);
      }
    }

    const reservation = await db.EquipmentReservation.create({
      ...data,
      user_id: userId,
      status: 0 // 待审核
    }, { transaction });

    await transaction.commit();
    logger.info(`Equipment reservation created by user: userId=${userId}, reservationId=${reservation.id}`);
    
    return reservation;
  } catch (error) {
    await transaction.rollback();
    logger.error('Create equipment reservation failed:', error);
    throw error;
  }
};

/**
 * 检查设备在指定日期和时间段是否可用
 */
const checkEquipmentAvailability = async (equipmentId, date, timeSlot, transaction) => {
  const existingReservation = await db.EquipmentReservation.findOne({
    where: {
      equipment_id: equipmentId,
      reservation_date: date,
      status: [0, 1], // 待审核和进行中
      time_slots: {
        [Op.like]: `%${timeSlot}%`
      }
    },
    transaction
  });

  return !existingReservation;
};

// ==================== 笼位租赁订单 ====================

/**
 * 创建笼位租赁订单
 * @param {Number} userId - 用户ID
 * @param {Object} data - 订单数据
 * @returns {Promise<Object>}
 */
const createCageReservation = async (userId, data) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { cage_id, reservation_date, time_slots, quantity } = data;

    // 检查笼位是否存在且可用
    const cage = await db.Cage.findByPk(cage_id, { transaction });
    if (!cage) {
      throw new Error('笼位不存在');
    }

    if (cage.status !== 1) {
      throw new Error('笼位不可用');
    }

    // 检查预约数量
    if (quantity > cage.quantity) {
      throw new Error(`预约数量不能超过笼位总数量（${cage.quantity}）`);
    }

    // 检查时间段可用数量
    const timeSlotArray = JSON.parse(time_slots);
    for (const slot of timeSlotArray) {
      const available = await checkCageAvailability(
        cage_id,
        reservation_date,
        slot,
        transaction
      );

      if (available < quantity) {
        throw new Error(`时间段 ${slot} 可用数量不足，当前可用：${available}`);
      }
    }

    // 补充动物类型和环境类型（从笼位数据快照）
    data.animal_type_id = cage.animal_type_id;
    data.environment_id = cage.environment_id;

    const reservation = await db.CageReservation.create({
      ...data,
      user_id: userId,
      status: 0 // 待审核
    }, { transaction });

    await transaction.commit();
    logger.info(`Cage reservation created by user: userId=${userId}, reservationId=${reservation.id}`);
    
    return reservation;
  } catch (error) {
    await transaction.rollback();
    logger.error('Create cage reservation failed:', error);
    throw error;
  }
};

/**
 * 检查笼位在指定日期和时间段的可用数量
 */
const checkCageAvailability = async (cageId, date, timeSlot, transaction) => {
  const cage = await db.Cage.findByPk(cageId, { transaction });
  if (!cage) {
    throw new Error('笼位不存在');
  }

  // 查询该日期、时间段的所有已审核通过（待审核和进行中）的预约
  const reservations = await db.CageReservation.findAll({
    where: {
      cage_id: cageId,
      reservation_date: date,
      status: [0, 1],
      time_slots: {
        [Op.like]: `%${timeSlot}%`
      }
    },
    attributes: ['quantity', 'time_slots'],
    transaction
  });

  // 计算已预约的数量
  let reservedQuantity = 0;
  for (const reservation of reservations) {
    const slots = JSON.parse(reservation.time_slots);
    if (slots.includes(timeSlot)) {
      reservedQuantity += reservation.quantity;
    }
  }

  return cage.quantity - reservedQuantity;
};

// ==================== 实验代操作订单 ====================

/**
 * 创建实验代操作订单
 * @param {Number} userId - 用户ID
 * @param {Object} data - 订单数据
 * @returns {Promise<Object>}
 */
const createExperimentOperation = async (userId, data) => {
  try {
    // 检查操作内容是否存在
    const operationContent = await db.OperationContent.findByPk(data.operation_content_id);
    if (!operationContent) {
      throw new Error('操作内容不存在');
    }

    // 检查动物类型是否存在
    if (data.animal_type_id) {
      const animalType = await db.AnimalType.findByPk(data.animal_type_id);
      if (!animalType) {
        throw new Error('动物类型不存在');
      }
    }

    const operation = await db.ExperimentOperation.create({
      ...data,
      user_id: userId,
      status: 0 // 待审核
    });

    logger.info(`Experiment operation created by user: userId=${userId}, operationId=${operation.id}`);
    return operation;
  } catch (error) {
    logger.error('Create experiment operation failed:', error);
    throw error;
  }
};

// ==================== 动物订购 ====================

/**
 * 创建动物订单
 * @param {Number} userId - 用户ID
 * @param {Object} data - 订单数据
 * @returns {Promise<Object>}
 */
const createAnimalOrder = async (userId, data) => {
  try {
    // 验证地区ID
    const regionValidation = await validator.validateRegionIds(data.province_id, data.city_id, data.district_id);
    if (!regionValidation.valid) {
      throw new Error(regionValidation.message);
    }

    const order = await db.AnimalOrder.create({
      ...data,
      user_id: userId,
      status: 0 // 待审核
    });

    logger.info(`Animal order created by user: userId=${userId}, orderId=${order.id}`);
    return order;
  } catch (error) {
    logger.error('Create animal order failed:', error);
    throw error;
  }
};

// ==================== 试剂耗材订购 ====================

/**
 * 创建试剂订单
 * @param {Number} userId - 用户ID
 * @param {Object} data - 订单数据
 * @returns {Promise<Object>}
 */
const createReagentOrder = async (userId, data) => {
  try {
    // 验证地区ID
    const regionValidation = await validator.validateRegionIds(data.province_id, data.city_id, data.district_id);
    if (!regionValidation.valid) {
      throw new Error(regionValidation.message);
    }

    const order = await db.ReagentOrder.create({
      ...data,
      user_id: userId,
      status: 0 // 待审核
    });

    logger.info(`Reagent order created by user: userId=${userId}, orderId=${order.id}`);
    return order;
  } catch (error) {
    logger.error('Create reagent order failed:', error);
    throw error;
  }
};

// ==================== 统一订单查询 ====================

/**
 * 获取我的订单列表
 * @param {Number} userId - 用户ID
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getMyOrders = async (userId, params) => {
  try {
    const { page = 1, pageSize = 10, type, status } = params;

    if (!type) {
      throw new Error('订单类型不能为空');
    }

    let model, include;
    switch (type) {
      case 'equipment':
        model = db.EquipmentReservation;
        include = [
          { model: db.Equipment, as: 'equipment', attributes: ['id', 'name'] },
          { model: db.Handler, as: 'handler', attributes: ['id', 'name'] }
        ];
        break;
      case 'cage':
        model = db.CageReservation;
        include = [
          { model: db.Cage, as: 'cage', attributes: ['id', 'quantity'] },
          { model: db.AnimalType, as: 'animalType', attributes: ['id', 'name'] },
          { model: db.EnvironmentType, as: 'environment', attributes: ['id', 'name'] },
          { model: db.CagePurpose, as: 'purpose', attributes: ['id', 'name'] },
          { model: db.Handler, as: 'handler', attributes: ['id', 'name'] }
        ];
        break;
      case 'experiment':
        model = db.ExperimentOperation;
        include = [
          { model: db.OperationContent, as: 'operationContent', attributes: ['id', 'name'] },
          { model: db.AnimalType, as: 'animalType', attributes: ['id', 'name'] },
          { model: db.Handler, as: 'handler', attributes: ['id', 'name'] }
        ];
        break;
      case 'animal':
        model = db.AnimalOrder;
        include = [
          { model: db.AnimalBrand, as: 'brand', attributes: ['id', 'name'] },
          { model: db.AnimalVariety, as: 'variety', attributes: ['id', 'name'] },
          { model: db.AnimalSpecification, as: 'specification', attributes: ['id', 'name'] },
          { model: db.Handler, as: 'handler', attributes: ['id', 'name'] }
        ];
        break;
      case 'reagent':
        model = db.ReagentOrder;
        include = [
          { model: db.ReagentBrand, as: 'brand', attributes: ['id', 'name'] },
          { model: db.ReagentSpecification, as: 'specification', attributes: ['id', 'name'] },
          { model: db.Handler, as: 'handler', attributes: ['id', 'name'] }
        ];
        break;
      default:
        throw new Error('订单类型不正确');
    }

    const where = { user_id: userId };
    if (status !== undefined) where.status = status;

    const offset = (page - 1) * pageSize;
    const { count, rows } = await model.findAndCountAll({
      where,
      include,
      offset,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    return { 
      list: rows, 
      total: count, 
      page: parseInt(page), 
      pageSize: parseInt(pageSize) 
    };
  } catch (error) {
    logger.error('Get my orders failed:', error);
    throw error;
  }
};

/**
 * 获取订单详情
 * @param {Number} userId - 用户ID
 * @param {String} type - 订单类型
 * @param {Number} orderId - 订单ID
 * @returns {Promise<Object>}
 */
const getOrderDetail = async (userId, type, orderId) => {
  try {
    let model, include;
    switch (type) {
      case 'equipment':
        model = db.EquipmentReservation;
        include = [
          { model: db.Equipment, as: 'equipment' },
          { model: db.Handler, as: 'handler' }
        ];
        break;
      case 'cage':
        model = db.CageReservation;
        include = [
          { model: db.Cage, as: 'cage' },
          { model: db.AnimalType, as: 'animalType' },
          { model: db.EnvironmentType, as: 'environment' },
          { model: db.CagePurpose, as: 'purpose' },
          { model: db.Handler, as: 'handler' }
        ];
        break;
      case 'experiment':
        model = db.ExperimentOperation;
        include = [
          { model: db.OperationContent, as: 'operationContent' },
          { model: db.AnimalType, as: 'animalType' },
          { model: db.Handler, as: 'handler' }
        ];
        break;
      case 'animal':
        model = db.AnimalOrder;
        include = [
          { model: db.AnimalBrand, as: 'brand' },
          { model: db.AnimalVariety, as: 'variety' },
          { model: db.AnimalSpecification, as: 'specification' },
          { model: db.AnimalRequirement, as: 'requirement' },
          { model: db.EnvironmentType, as: 'environment' },
          { model: db.Handler, as: 'handler' }
        ];
        break;
      case 'reagent':
        model = db.ReagentOrder;
        include = [
          { model: db.ReagentBrand, as: 'brand' },
          { model: db.ReagentSpecification, as: 'specification' },
          { model: db.Handler, as: 'handler' }
        ];
        break;
      default:
        throw new Error('订单类型不正确');
    }

    const order = await model.findOne({
      where: { id: orderId, user_id: userId },
      include
    });

    if (!order) {
      throw new Error('订单不存在或无权访问');
    }

    return order;
  } catch (error) {
    logger.error('Get order detail failed:', error);
    throw error;
  }
};

// ==================== 获取案例列表 ====================

/**
 * 获取案例列表（仅显示已发布的）
 * @returns {Promise<Array>}
 */
const getCaseList = async () => {
  try {
    return await db.Case.findAll({
      where: { status: 1 },
      attributes: ['id', 'project_name', 'summary', 'images', 'created_at'],
      order: [['created_at', 'DESC']]
    });
  } catch (error) {
    logger.error('Get case list failed:', error);
    throw error;
  }
};

/**
 * 获取案例详情
 * @param {Number} id - 案例ID
 * @returns {Promise<Object>}
 */
const getCaseDetail = async (id) => {
  try {
    const caseItem = await db.Case.findOne({
      where: { id, status: 1 }
    });

    if (!caseItem) {
      throw new Error('案例不存在');
    }

    return caseItem;
  } catch (error) {
    logger.error(`Get case detail failed: id=${id}`, error);
    throw error;
  }
};

// ==================== 获取公司信息 ====================

/**
 * 获取公司信息
 * @returns {Promise<Object>}
 */
const getCompanyInfo = async () => {
  try {
    const info = await db.CompanyInfo.findByPk(1);
    if (!info) {
      return {
        company_name: '',
        address: '',
        phone: '',
        email: '',
        working_hours: '',
        introduction: '',
        service_philosophy: ''
      };
    }
    return info;
  } catch (error) {
    logger.error('Get company info failed:', error);
    throw error;
  }
};

// ==================== 获取时间段列表 ====================

/**
 * 获取设备租赁时间段列表
 * @returns {Promise<Array>}
 */
const getEquipmentTimeSlots = async () => {
  try {
    const slots = await db.EquipmentTimeSlot.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC']]
    });
    
    // 添加 display_time 字段
    const { formatTimeSlot } = require('../../utils/dateFormat');
    return slots.map(slot => {
      const slotData = slot.toJSON();
      slotData.display_time = formatTimeSlot(slotData.start_time, slotData.end_time);
      return slotData;
    });
  } catch (error) {
    logger.error('Get equipment time slots failed:', error);
    throw error;
  }
};

/**
 * 获取笼位租赁时间段列表
 * @returns {Promise<Array>}
 */
const getCageTimeSlots = async () => {
  try {
    const slots = await db.CageTimeSlot.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC']]
    });
    
    // 添加 display_time 字段
    const { formatTimeSlot } = require('../../utils/dateFormat');
    return slots.map(slot => {
      const slotData = slot.toJSON();
      slotData.display_time = formatTimeSlot(slotData.start_time, slotData.end_time);
      return slotData;
    });
  } catch (error) {
    logger.error('Get cage time slots failed:', error);
    throw error;
  }
};

/**
 * 获取实验代操作时间段列表
 * @returns {Promise<Array>}
 */
const getExperimentTimeSlots = async () => {
  try {
    const slots = await db.ExperimentTimeSlot.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC']]
    });
    
    // 添加 display_time 字段
    const { formatTimeSlot } = require('../../utils/dateFormat');
    return slots.map(slot => {
      const slotData = slot.toJSON();
      slotData.display_time = formatTimeSlot(slotData.start_time, slotData.end_time);
      return slotData;
    });
  } catch (error) {
    logger.error('Get experiment time slots failed:', error);
    throw error;
  }
};

// ==================== 获取基础数据列表 ====================

/**
 * 获取设备列表
 * @returns {Promise<Array>}
 */
const getEquipmentList = async () => {
  try {
    return await db.Equipment.findAll({
      where: { status: 1 },
      attributes: ['id', 'name', 'details'],
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get equipment list failed:', error);
    throw error;
  }
};

/**
 * 获取笼位列表
 * @returns {Promise<Array>}
 */
const getCageList = async () => {
  try {
    return await db.Cage.findAll({
      where: { status: 1 },
      include: [
        { model: db.AnimalType, as: 'animalType', attributes: ['id', 'name'] },
        { model: db.EnvironmentType, as: 'environment', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });
  } catch (error) {
    logger.error('Get cage list failed:', error);
    throw error;
  }
};

/**
 * 获取操作内容列表
 * @returns {Promise<Array>}
 */
const getOperationContentList = async () => {
  try {
    return await db.OperationContent.findAll({
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get operation content list failed:', error);
    throw error;
  }
};

/**
 * 获取动物品牌列表
 * @returns {Promise<Array>}
 */
const getAnimalBrandList = async () => {
  try {
    return await db.AnimalBrand.findAll({
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get animal brand list failed:', error);
    throw error;
  }
};

/**
 * 获取动物品系列表
 * @param {Number} brandId - 品牌ID（可选）
 * @returns {Promise<Array>}
 */
const getAnimalVarietyList = async (brandId) => {
  try {
    const where = brandId ? { brand_id: brandId } : {};
    return await db.AnimalVariety.findAll({
      where,
      include: [
        { model: db.AnimalBrand, as: 'brand', attributes: ['id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get animal variety list failed:', error);
    throw error;
  }
};

// ==================== 系统配置 ====================

/**
 * 获取提前预约天数配置
 * @returns {Promise<Object>}
 */
const getAdvanceDaysConfigs = async () => {
  try {
    const configs = await db.SystemConfig.findAll({
      where: {
        key: ['equipment_advance_days', 'cage_advance_days', 'experiment_advance_days']
      }
    });

    const result = {};
    configs.forEach(config => {
      result[config.key] = parseInt(config.value) || 7;
    });

    return {
      equipment_advance_days: result.equipment_advance_days || 7,
      cage_advance_days: result.cage_advance_days || 7,
      experiment_advance_days: result.experiment_advance_days || 7
    };
  } catch (error) {
    logger.error('Get advance days configs failed:', error);
    throw error;
  }
};

/**
 * 获取环境类型列表
 * @returns {Promise<Array>}
 */
const getEnvironmentTypeList = async () => {
  try {
    return await db.EnvironmentType.findAll({
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get environment type list failed:', error);
    throw error;
  }
};

/**
 * 获取动物类型列表
 * @returns {Promise<Array>}
 */
const getAnimalTypeList = async () => {
  try {
    return await db.AnimalType.findAll({
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get animal type list failed:', error);
    throw error;
  }
};

/**
 * 获取笼位用途列表
 * @returns {Promise<Array>}
 */
const getCagePurposeList = async () => {
  try {
    return await db.CagePurpose.findAll({
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get cage purpose list failed:', error);
    throw error;
  }
};

/**
 * 获取动物规格列表
 * @returns {Promise<Array>}
 */
const getAnimalSpecificationList = async () => {
  try {
    return await db.AnimalSpecification.findAll({
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get animal specification list failed:', error);
    throw error;
  }
};

/**
 * 获取动物需求列表
 * @returns {Promise<Array>}
 */
const getAnimalRequirementList = async () => {
  try {
    return await db.AnimalRequirement.findAll({
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get animal requirement list failed:', error);
    throw error;
  }
};

/**
 * 获取试剂品牌列表
 * @returns {Promise<Array>}
 */
const getReagentBrandList = async () => {
  try {
    return await db.ReagentBrand.findAll({
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get reagent brand list failed:', error);
    throw error;
  }
};

/**
 * 获取试剂规格列表
 * @returns {Promise<Array>}
 */
const getReagentSpecificationList = async () => {
  try {
    return await db.ReagentSpecification.findAll({
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get reagent specification list failed:', error);
    throw error;
  }
};

/**
 * 获取组织机构列表
 * @returns {Promise<Array>}
 */
const getOrganizationList = async () => {
  try {
    return await db.Organization.findAll({
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get organization list failed:', error);
    throw error;
  }
};

/**
 * 获取课题组列表
 * @param {Number} organization_id - 组织ID（可选）
 * @returns {Promise<Array>}
 */
const getResearchGroupList = async (organization_id) => {
  try {
    const where = organization_id ? { organization_id: organization_id } : {};
    return await db.ResearchGroup.findAll({
      where,
      include: [
        { model: db.Organization, as: 'organization', attributes: ['id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get research group list failed:', error);
    throw error;
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
