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

    // 1. 验证当前用户是否已登录且审核已通过
    const user = await db.User.findByPk(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    if (user.audit_status !== 1) {
      throw new Error('用户审核未通过，无法提交订单');
    }

    // 2. 验证设备是否存在且启用
    const equipment = await db.Equipment.findByPk(equipment_id, { 
      transaction,
      lock: transaction.LOCK.UPDATE  // 加悲观锁防止并发
    });
    if (!equipment) {
      throw new Error('设备不存在');
    }
    if (equipment.status !== 1) {
      throw new Error('设备不可用');
    }

    // 3. 验证预约日期不能是过去的日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reservationDate = new Date(reservation_date);
    if (reservationDate < today) {
      throw new Error('预约日期不能是过去的日期');
    }

    // 4. 验证预约日期不能超过提前预约天数限制
    const advanceDaysConfig = await db.SystemConfig.findOne({
      where: { key: 'equipment_advance_days' }
    });
    const advanceDays = advanceDaysConfig ? parseInt(advanceDaysConfig.value) : 7;
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + advanceDays);
    if (reservationDate > maxDate) {
      throw new Error(`预约日期不能超过${advanceDays}天`);
    }

    // 5. 验证时间段格式和有效性
    const timeSlotArray = typeof time_slots === 'string' ? JSON.parse(time_slots) : time_slots;
    if (!Array.isArray(timeSlotArray) || timeSlotArray.length === 0) {
      throw new Error('时间段格式错误或为空');
    }

    // 6. 检查设备在选定时间段是否已被预约（使用数据库行锁防止并发）
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

    // 7. 自动关联当前登录用户
    // 8. 创建订单
    const { generateOrderSn, ORDER_PREFIX } = require('../../utils/orderSn');
    const { ORDER_SOURCE } = require('../../utils/constants');
    const orderSn = await generateOrderSn(ORDER_PREFIX.EQUIPMENT, transaction);

    const reservation = await db.EquipmentReservation.create({
      ...data,
      user_id: userId,
      order_sn: orderSn,
      status: 0, // 待审核
      source: ORDER_SOURCE.USER,
      created_by_admin_id: null
    }, { transaction });

    await transaction.commit();
    logger.info(`Equipment reservation created by user: userId=${userId}, reservationId=${reservation.id}, sn=${orderSn}`);
    
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
    const { animal_type_id, environment_id, reservation_date, time_slots, quantity } = data;

    // 根据动物类型+环境查询匹配的笼位，并加锁防止并发问题
    const cage = await db.Cage.findOne({
      where: {
        animal_type_id,
        environment_id,
        status: 1  // 只查询启用的笼位
      },
      transaction,
      lock: transaction.LOCK.UPDATE  // 加悲观锁
    });

    if (!cage) {
      throw new Error('未找到匹配的笼位（动物类型+环境）');
    }

    // 检查预约数量
    if (quantity > cage.quantity) {
      throw new Error(`预约数量不能超过笼位总数量（${cage.quantity}）`);
    }

    // 检查时间段可用数量
    const timeSlotArray = typeof time_slots === 'string' ? JSON.parse(time_slots) : time_slots;
    for (const slot of timeSlotArray) {
      const available = await checkCageAvailability(
        cage.id,
        reservation_date,
        slot,
        transaction
      );

      if (available < quantity) {
        throw new Error(`时间段 ${slot} 可用数量不足，当前可用：${available}`);
      }
    }

    // 生成订单号
    const { generateOrderSn, ORDER_PREFIX } = require('../../utils/orderSn');
    const { ORDER_SOURCE } = require('../../utils/constants');
    const orderSn = await generateOrderSn(ORDER_PREFIX.CAGE, transaction);

    // 自动分配笼位ID
    const reservation = await db.CageReservation.create({
      ...data,
      cage_id: cage.id,
      user_id: userId,
      order_sn: orderSn,
      status: 0, // 待审核
      source: ORDER_SOURCE.USER,
      created_by_admin_id: null
    }, { transaction });

    await transaction.commit();
    logger.info(`Cage reservation created by user: userId=${userId}, reservationId=${reservation.id}, cage_id=${cage.id}, sn=${orderSn}`);
    
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

  // 查询该笼位、该日期的所有待审核和进行中的预约
  // 注意：不在 SQL 中过滤 time_slots，因为 JSON 字段的 LIKE 查询不可靠
  const reservations = await db.CageReservation.findAll({
    where: {
      cage_id: cageId,
      reservation_date: date,
      status: [0, 1] // 待审核和进行中的订单都占用数量
    },
    attributes: ['quantity', 'time_slots'],
    transaction
  });

  // 在应用层过滤并计算已预约的数量
  let reservedQuantity = 0;
  for (const reservation of reservations) {
    const slots = reservation.time_slots;
    // 确保 slots 是数组，并且包含指定的时间段
    if (Array.isArray(slots) && slots.includes(timeSlot)) {
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
  const transaction = await db.sequelize.transaction();
  
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

    // 生成订单号
    const { generateOrderSn, ORDER_PREFIX } = require('../../utils/orderSn');
    const { ORDER_SOURCE } = require('../../utils/constants');
    const orderSn = await generateOrderSn(ORDER_PREFIX.EXPERIMENT, transaction);

    const operation = await db.ExperimentOperation.create({
      ...data,
      user_id: userId,
      order_sn: orderSn,
      status: 0, // 待审核
      source: ORDER_SOURCE.USER,
      created_by_admin_id: null
    }, { transaction });

    await transaction.commit();
    logger.info(`Experiment operation created by user: userId=${userId}, operationId=${operation.id}, sn=${orderSn}`);
    return operation;
  } catch (error) {
    await transaction.rollback();
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
  const transaction = await db.sequelize.transaction();
  
  try {
    // 验证地区ID
    const regionValidation = await validator.validateRegionIds(data.province_id, data.city_id, data.district_id);
    if (!regionValidation.valid) {
      throw new Error(regionValidation.message);
    }

    // 生成订单号
    const { generateOrderSn, ORDER_PREFIX } = require('../../utils/orderSn');
    const { ORDER_SOURCE } = require('../../utils/constants');
    const orderSn = await generateOrderSn(ORDER_PREFIX.ANIMAL, transaction);

    const order = await db.AnimalOrder.create({
      ...data,
      user_id: userId,
      order_sn: orderSn,
      status: 0, // 待审核
      source: ORDER_SOURCE.USER,
      created_by_admin_id: null
    }, { transaction });

    await transaction.commit();
    logger.info(`Animal order created by user: userId=${userId}, orderId=${order.id}, sn=${orderSn}`);
    return order;
  } catch (error) {
    await transaction.rollback();
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
  const transaction = await db.sequelize.transaction();
  
  try {
    // 验证地区ID
    const regionValidation = await validator.validateRegionIds(data.province_id, data.city_id, data.district_id);
    if (!regionValidation.valid) {
      throw new Error(regionValidation.message);
    }

    // 生成订单号
    const { generateOrderSn, ORDER_PREFIX } = require('../../utils/orderSn');
    const { ORDER_SOURCE } = require('../../utils/constants');
    const orderSn = await generateOrderSn(ORDER_PREFIX.REAGENT, transaction);

    const order = await db.ReagentOrder.create({
      ...data,
      user_id: userId,
      order_sn: orderSn,
      status: 0, // 待审核
      source: ORDER_SOURCE.USER,
      created_by_admin_id: null
    }, { transaction });

    await transaction.commit();
    logger.info(`Reagent order created by user: userId=${userId}, orderId=${order.id}, sn=${orderSn}`);
    return order;
  } catch (error) {
    await transaction.rollback();
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
        company_address: '',
        contact_phone: '',
        email: '',
        work_time: '',
        company_intro: '',
        service_concept: '',
        banner_image: [],
        video_url: ''
      };
    }
    // 返回 content JSON 对象
    return info.content || {};
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
 * 获取设备列表（无需登录，无分页）
 * @param {String} name - 可选，设备名称模糊查询
 * @returns {Promise<Array>}
 */
const getEquipmentList = async (name) => {
  try {
    const where = { status: 1 };
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }
    
    return await db.Equipment.findAll({
      where,
      attributes: ['id', 'name', 'details'],
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get equipment list failed:', error);
    throw error;
  }
};

/**
 * 获取设备详情（无需登录）
 * @param {Number} id - 设备ID
 * @returns {Promise<Object>}
 */
const getEquipmentDetail = async (id) => {
  try {
    const equipment = await db.Equipment.findByPk(id, {
      attributes: ['id', 'name', 'details']
    });
    
    if (!equipment) {
      throw new Error('设备不存在');
    }
    
    return equipment;
  } catch (error) {
    logger.error('Get equipment detail failed:', error);
    throw error;
  }
};

/**
 * 查询设备可用时间段
 * @param {Number} equipmentId - 设备ID
 * @param {String} date - 查询日期
 * @returns {Promise<Array>}
 */
const getEquipmentAvailableSlots = async (equipmentId, date) => {
  try {
    // 验证设备是否存在
    const equipment = await db.Equipment.findByPk(equipmentId);
    if (!equipment) {
      throw new Error('设备不存在');
    }

    // 验证日期参数
    if (!date) {
      throw new Error('日期参数必填');
    }

    // 查询所有启用的时间段配置
    const allTimeSlots = await db.EquipmentTimeSlot.findAll({
      where: { status: 1 },
      attributes: ['id', 'start_time', 'end_time', 'display_time', 'description'],
      order: [['sort_order', 'ASC']]
    });

    // 查询该设备在该日期已预约的时间段（状态为待审核或进行中）
    const reservations = await db.EquipmentReservation.findAll({
      where: {
        equipment_id: equipmentId,
        reservation_date: date,
        status: [0, 1] // 待审核和进行中
      },
      attributes: ['time_slots']
    });

    // 提取所有已预约的时间段
    const bookedSlots = new Set();
    reservations.forEach(reservation => {
      const slots = reservation.time_slots;
      if (Array.isArray(slots)) {
        slots.forEach(slot => bookedSlots.add(slot));
      }
    });

    // 构建返回数据
    const result = allTimeSlots.map(slot => ({
      id: slot.id,
      startTime: slot.start_time,
      endTime: slot.end_time,
      display_time: slot.display_time,
      description: slot.description || '',
      available: !bookedSlots.has(slot.display_time)
    }));

    return result;
  } catch (error) {
    logger.error('Get equipment available slots failed:', error);
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
 * 根据动物类型获取环境类型选项
 * @param {Number} animalTypeId - 动物类型ID
 * @returns {Promise<Array>}
 */
const getEnvironmentsByAnimalType = async (animalTypeId) => {
  try {
    // 查询该动物类型的所有笼位
    const cages = await db.Cage.findAll({
      where: { 
        animal_type_id: animalTypeId,
        status: 1  // 只查询启用的笼位
      },
      include: [
        {
          model: db.EnvironmentType,
          as: 'environment',
          attributes: ['id', 'name']
        }
      ],
      attributes: ['environment_id'],
      group: ['environment_id']  // 去重
    });

    // 提取并去重环境类型
    const environments = [];
    const envIds = new Set();
    
    for (const cage of cages) {
      if (cage.environment && !envIds.has(cage.environment.id)) {
        envIds.add(cage.environment.id);
        environments.push({
          id: cage.environment.id,
          name: cage.environment.name
        });
      }
    }

    return environments;
  } catch (error) {
    logger.error(`Get environments by animal type failed: animal_type_id=${animalTypeId}`, error);
    throw error;
  }
};

/**
 * 查询笼位可用时间段
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getAvailableTimeSlotsByType = async (params) => {
  try {
    const { animal_type_id, environment_id, date } = params;

    // 验证动物类型和环境是否存在
    const animalType = await db.AnimalType.findByPk(animal_type_id);
    if (!animalType) {
      throw new Error('动物类型不存在');
    }

    const environment = await db.EnvironmentType.findByPk(environment_id);
    if (!environment) {
      throw new Error('环境类型不存在');
    }

    // 查询匹配的笼位总数量
    const cage = await db.Cage.findOne({
      where: {
        animal_type_id,
        environment_id,
        status: 1
      }
    });

    // 如果没有匹配的笼位，返回空结果
    if (!cage) {
      return {
        total_quantity: 0,
        time_slots: []
      };
    }

    const totalQuantity = cage.quantity;

    // 获取所有启用的时间段
    const allTimeSlots = await db.CageTimeSlot.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC'], ['start_time', 'ASC']]
    });

    // 查询该日期、该动物类型+环境的所有预约
    const reservations = await db.CageReservation.findAll({
      where: {
        animal_type_id,
        environment_id,
        reservation_date: date,
        status: [0, 1] // 待审核和进行中
      },
      attributes: ['time_slots', 'quantity']
    });

    // 计算每个时间段的已预约数量
    const timeSlots = allTimeSlots.map(slot => {
      const timeSlotStr = `${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)}`;
      
      let reservedQuantity = 0;
      for (const reservation of reservations) {
        const slots = reservation.time_slots;
        if (slots && slots.includes(timeSlotStr)) {
          reservedQuantity += reservation.quantity;
        }
      }

      const availableQuantity = Math.max(0, totalQuantity - reservedQuantity);

      return {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        display_time: `${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)}`,
        description: slot.description || '',
        available_quantity: availableQuantity
      };
    });

    return {
      total_quantity: totalQuantity,
      time_slots: timeSlots
    };
  } catch (error) {
    logger.error('Get available time slots by type failed:', error);
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
  getEquipmentDetail,
  getEquipmentAvailableSlots,
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
