/**
 * 用户端订单服务
 * 包括：设备预约、笼位预约、实验代操作、动物订购、试剂耗材订购、案例、公司信息
 */
const db = require('../../models');
const { validator } = require('../../utils');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

// ==================== 设备预约订单 ====================

/**
 * 创建设备预约订单
 * @param {Number} userId - 用户ID
 * @param {Object} data - 订单数据
 * @returns {Promise<Object>}
 */
const createEquipmentReservation = async (userId, data) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { equipment_id, time_slots } = data;

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

    // 3. 验证时间段格式和有效性（新格式：包含日期）
    const timeSlotArray = typeof time_slots === 'string' ? JSON.parse(time_slots) : time_slots;
    if (!Array.isArray(timeSlotArray) || timeSlotArray.length === 0) {
      throw new Error('时间段格式错误或为空');
    }

    // 4. 提取并验证所有日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const advanceDaysConfig = await db.SystemConfig.findOne({
      where: { config_key: 'equipment_advance_days' }
    });
    const advanceDays = advanceDaysConfig ? parseInt(advanceDaysConfig.config_value) : 7;
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + advanceDays);

    for (const slot of timeSlotArray) {
      // 验证格式：必须是 "YYYY-MM-DD HH:MM-HH:MM"
      const match = slot.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}-\d{2}:\d{2})$/);
      if (!match) {
        throw new Error(`时间段格式错误：${slot}，正确格式为 "YYYY-MM-DD HH:MM-HH:MM"`);
      }

      const dateStr = match[1];
      const reservationDate = new Date(dateStr);
      
      // 验证日期不能是过去
      if (reservationDate < today) {
        throw new Error(`预约日期 ${dateStr} 不能是过去的日期`);
      }

      // 验证日期不能超过提前预约天数
      if (reservationDate > maxDate) {
        throw new Error(`预约日期 ${dateStr} 不能超过${advanceDays}天`);
      }
    }

    // 5. 检查设备在选定时间段是否已被预约（使用数据库行锁防止并发）
    const isAvailable = await checkEquipmentAvailability(
      equipment_id,
      timeSlotArray,
      transaction
    );

    if (!isAvailable) {
      throw new Error('所选时间段部分或全部已被预约，请选择其他时间');
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
 * 检查设备时间段是否可用（新格式：包含日期）
 * @param {Number} equipmentId - 设备ID
 * @param {Array} timeSlots - 时间段数组，格式：["2026-01-22 09:00-10:00", ...]
 * @param {Transaction} transaction - 事务对象
 * @returns {Promise<Boolean>}
 */
const checkEquipmentAvailability = async (equipmentId, timeSlots, transaction) => {
  // 查询该设备的所有有效订单（待审核、进行中状态）
  const existingReservations = await db.EquipmentReservation.findAll({
    where: {
      equipment_id: equipmentId,
      status: { [Op.in]: [0, 1] } // 待审核或进行中
    },
    attributes: ['time_slots'],
    transaction
  });

  // 提取所有已预约的时间段
  const bookedSlots = [];
  existingReservations.forEach(reservation => {
    if (reservation.time_slots && Array.isArray(reservation.time_slots)) {
      bookedSlots.push(...reservation.time_slots);
    }
  });

  // 检查是否有冲突
  const hasConflict = timeSlots.some(slot => bookedSlots.includes(slot));
  
  return !hasConflict;
};

// ==================== 笼位预约订单 ====================

/**
 * 创建笼位预约订单
 * @param {Number} userId - 用户ID
 * @param {Object} data - 订单数据
 * @returns {Promise<Object>}
 */
const createCageReservation = async (userId, data) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { animal_type_id, environment_id, start_date, end_date, quantity } = data;

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

    // 检查日期范围内的可用数量
    const availableQuantity = await checkCageAvailabilityForDateRange(
      cage.id,
      start_date,
      end_date,
      transaction
    );

    if (availableQuantity < quantity) {
      throw new Error(`日期范围内可用数量不足，当前最小可用：${availableQuantity}`);
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
 * 检查笼位在指定日期范围的可用数量（返回最小值）
 * @param {Number} cageId - 笼位ID
 * @param {String} startDate - 开始日期 (YYYY-MM-DD)
 * @param {String} endDate - 结束日期 (YYYY-MM-DD 或 NULL)
 * @param {Object} transaction - 事务对象
 * @param {Number} excludeReservationId - 排除的订单ID（可选）
 * @returns {Promise<Number>} 日期范围内的最小可用数量
 */
const checkCageAvailabilityForDateRange = async (cageId, startDate, endDate, transaction, excludeReservationId = null) => {
  const cage = await db.Cage.findByPk(cageId, { transaction });
  if (!cage) {
    throw new Error('笼位不存在');
  }

  const totalQuantity = cage.quantity;

  // 如果是长期预约（end_date为null），只检查开始日期当天
  if (!endDate) {
    const reservedQuantity = await getReservedQuantityForDate(cageId, startDate, transaction, excludeReservationId);
    return totalQuantity - reservedQuantity;
  }

  // 遍历日期范围内的每一天，计算最小可用数量
  const start = new Date(startDate);
  const end = new Date(endDate);
  let minAvailable = totalQuantity;

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const reservedQuantity = await getReservedQuantityForDate(cageId, dateStr, transaction, excludeReservationId);
    const available = totalQuantity - reservedQuantity;
    minAvailable = Math.min(minAvailable, available);
  }

  return Math.max(0, minAvailable);
};

/**
 * 获取指定笼位在指定日期的已预约数量
 * @param {Number} cageId - 笼位ID
 * @param {String} date - 日期 (YYYY-MM-DD)
 * @param {Object} transaction - 事务对象
 * @param {Number} excludeReservationId - 排除的订单ID
 * @returns {Promise<Number>}
 */
const getReservedQuantityForDate = async (cageId, date, transaction, excludeReservationId = null) => {
  const where = {
    cage_id: cageId,
    status: [0, 1], // 待审核和进行中
    [Op.or]: [
      // 情况1：start_date <= date AND (end_date >= date OR end_date IS NULL)
      {
        start_date: { [Op.lte]: date },
        [Op.or]: [
          { end_date: { [Op.gte]: date } },
          { end_date: null }
        ]
      }
    ]
  };

  if (excludeReservationId) {
    where.id = { [Op.ne]: excludeReservationId };
  }

  const reservations = await db.CageReservation.findAll({
    where,
    attributes: ['quantity'],
    transaction
  });

  return reservations.reduce((sum, r) => sum + r.quantity, 0);
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
    const { page = 1, page_size = 10, type, status, start_date, end_date } = params;

    // 如果指定了type，只查询该类型的订单
    if (type) {
      return await getOrdersByType(userId, type, { page, page_size, status, start_date, end_date });
    }

    // 未指定type，聚合查询所有类型的订单
    const allOrders = [];
    const types = ['equipment', 'cage', 'experiment', 'animal', 'reagent'];
    
    for (const orderType of types) {
      const orders = await getOrdersByType(userId, orderType, { status, start_date, end_date }, false);
      allOrders.push(...orders);
    }

    // 按创建时间倒序排列
    allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 分页
    const offset = (page - 1) * page_size;
    const total = allOrders.length;
    const list = allOrders.slice(offset, offset + parseInt(page_size));

    return {
      list,
      total,
      page: parseInt(page),
      page_size: parseInt(page_size),
      total_pages: Math.ceil(total / page_size)
    };
  } catch (error) {
    logger.error('Get my orders failed:', error);
    throw error;
  }
};

/**
 * 根据类型获取订单
 * @param {Number} userId - 用户ID
 * @param {String} type - 订单类型
 * @param {Object} filters - 过滤条件
 * @param {Boolean} paginate - 是否分页
 * @returns {Promise<Object|Array>}
 */
const getOrdersByType = async (userId, type, filters = {}, paginate = true) => {
  const { page = 1, page_size = 10, status, start_date, end_date } = filters;

  let model, include, typeConfig;
  const typeMap = {
    equipment: '设备预约',
    cage: '笼位预约',
    experiment: '实验代操作',
    animal: '动物订购',
    reagent: '试剂耗材订购'
  };

    switch (type) {
      case 'equipment':
        model = db.EquipmentReservation;
        include = [
          { model: db.Equipment, as: 'equipment', attributes: ['id', 'name'] },
          { model: db.Handler, as: 'handler', attributes: ['id', 'name'] }
        ];
      typeConfig = { titleField: 'equipment.name' };
        break;
      case 'cage':
        model = db.CageReservation;
        include = [
        { model: db.AnimalType, as: 'animal_type', attributes: ['id', 'name'] },
          { model: db.EnvironmentType, as: 'environment', attributes: ['id', 'name'] },
          { model: db.Handler, as: 'handler', attributes: ['id', 'name'] }
        ];
      typeConfig = { dateField: 'start_date' }; // 笼位预约使用 start_date
        break;
      case 'experiment':
        model = db.ExperimentOperation;
        include = [
        { model: db.OperationContent, as: 'operation_content', attributes: ['id', 'name'] },
        { model: db.AnimalType, as: 'animal_type', attributes: ['id', 'name'] },
          { model: db.Handler, as: 'handler', attributes: ['id', 'name'] }
        ];
      typeConfig = {};
        break;
      case 'animal':
        model = db.AnimalOrder;
        include = [
          { model: db.AnimalBrand, as: 'brand', attributes: ['id', 'name'] },
          { model: db.AnimalVariety, as: 'variety', attributes: ['id', 'name'] },
          { model: db.Handler, as: 'handler', attributes: ['id', 'name'] }
        ];
      typeConfig = { dateField: 'delivery_date', titleField: 'variety.name' };
        break;
      case 'reagent':
        model = db.ReagentOrder;
        include = [
          { model: db.Handler, as: 'handler', attributes: ['id', 'name'] }
        ];
      typeConfig = { dateField: 'delivery_date', titleField: 'name' };
        break;
      default:
        throw new Error('订单类型不正确');
    }

    const where = { user_id: userId };
    if (status !== undefined) where.status = status;
  
  // 日期筛选逻辑
  if (start_date || end_date) {
    if (typeConfig.dateField) {
      // 笼位预约、动物订购、试剂耗材订购：使用原有的 dateField
      where[typeConfig.dateField] = {};
      if (start_date) where[typeConfig.dateField][Op.gte] = start_date;
      if (end_date) where[typeConfig.dateField][Op.lte] = end_date;
    } else {
      // 设备预约、实验代操作：使用 JSON 查询 time_slots
      const conditions = [];
      if (start_date) {
        conditions.push(`JSON_SEARCH(time_slots, 'one', '${start_date}%', NULL, '$[*]') IS NOT NULL`);
      }
      if (end_date) {
        conditions.push(`JSON_SEARCH(time_slots, 'one', '${end_date}%', NULL, '$[*]') IS NOT NULL`);
      }
      if (conditions.length > 0) {
        where[Op.and] = db.sequelize.literal(conditions.join(' OR '));
      }
    }
  }

  const queryOptions = {
      where,
      include,
      order: [['created_at', 'DESC']]
  };

  if (paginate) {
    const offset = (page - 1) * page_size;
    queryOptions.offset = offset;
    queryOptions.limit = parseInt(page_size);

    const { count, rows } = await model.findAndCountAll(queryOptions);
    
    const list = rows.map(order => formatOrderForList(order, type, typeConfig));

    return { 
      list,
      total: count, 
      page: parseInt(page), 
      page_size: parseInt(page_size),
      total_pages: Math.ceil(count / page_size)
    };
  } else {
    // 不分页，返回所有数据
    const rows = await model.findAll(queryOptions);
    return rows.map(order => formatOrderForList(order, type, typeConfig));
  }
};

/**
 * 格式化订单数据用于列表显示
 * @param {Object} order - 订单对象
 * @param {String} type - 订单类型
 * @param {Object} typeConfig - 类型配置
 * @returns {Object}
 */
const formatOrderForList = (order, type, typeConfig) => {
  const typeNameMap = {
    equipment: '设备预约',
    cage: '笼位预约',
    experiment: '实验代操作',
    animal: '动物订购',
    reagent: '试剂耗材订购'
  };

  const statusTextMap = {
    0: '待审核',
    1: '进行中',
    2: '已拒绝',
    3: '已完成',
    4: '已取消'
  };

  let title, date;
  const orderData = order.toJSON ? order.toJSON() : order;

  switch (type) {
    case 'equipment':
      title = orderData.equipment?.name || '';
      // 从 time_slots 中提取第一个日期作为展示日期
      date = extractFirstDateFromSlots(orderData.time_slots);
      break;
    case 'cage':
      title = `${orderData.animal_type?.name || ''}-${orderData.environment?.name || ''}-${orderData.quantity}个`;
      date = orderData.start_date;
      break;
    case 'experiment':
      title = `${orderData.operation_content?.name || ''}-${orderData.animal_type?.name || ''}-${orderData.quantity}只`;
      // 从 time_slots 中提取第一个日期作为展示日期
      date = extractFirstDateFromSlots(orderData.time_slots);
      break;
    case 'animal':
      title = orderData.variety?.name || '';
      date = orderData.delivery_date;
      break;
    case 'reagent':
      title = orderData.name || '';
      date = orderData.delivery_date;
      break;
  }

  /**
   * 从 time_slots 中提取第一个日期
   * @param {Array} timeSlots - 格式：["2026-01-10 09:00-10:00", ...]
   * @returns {String} - 日期字符串或空字符串
   */
  function extractFirstDateFromSlots(timeSlots) {
    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return '';
    }
    const match = timeSlots[0].match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  }

  return {
    id: orderData.id,
    type,
    type_name: typeNameMap[type],
    title,
    date,
    status: orderData.status,
    status_text: statusTextMap[orderData.status] || '未知',
    created_at: orderData.created_at
  };
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
    const typeNameMap = {
      equipment: '设备预约',
      cage: '笼位预约',
      experiment: '实验代操作',
      animal: '动物订购',
      reagent: '试剂耗材订购'
    };

    const statusTextMap = {
      0: '待审核',
      1: '进行中',
      2: '已拒绝',
      3: '已完成',
      4: '已取消'
    };

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
          { model: db.AnimalType, as: 'animal_type' },
          { model: db.EnvironmentType, as: 'environment' },
          { model: db.CagePurpose, as: 'purpose' },
          { model: db.Handler, as: 'handler' }
        ];
        break;
      case 'experiment':
        model = db.ExperimentOperation;
        include = [
          { model: db.OperationContent, as: 'operation_content' },
          { model: db.AnimalType, as: 'animal_type' },
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
          { model: db.Handler, as: 'handler' },
          { model: db.Region, as: 'province', attributes: ['id', 'name', 'code'] },
          { model: db.Region, as: 'city', attributes: ['id', 'name', 'code'] },
          { model: db.Region, as: 'district', attributes: ['id', 'name', 'code'] }
        ];
        break;
      case 'reagent':
        model = db.ReagentOrder;
        include = [
          { model: db.Handler, as: 'handler' },
          { model: db.Region, as: 'province', attributes: ['id', 'name', 'code'] },
          { model: db.Region, as: 'city', attributes: ['id', 'name', 'code'] },
          { model: db.Region, as: 'district', attributes: ['id', 'name', 'code'] }
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

    // 转换为普通对象并添加 type、type_name 和 status_text 字段
    const orderData = order.toJSON();
    orderData.type = type;
    orderData.type_name = typeNameMap[type];
    orderData.status_text = statusTextMap[orderData.status] || '未知';

    return orderData;
  } catch (error) {
    logger.error('Get order detail failed:', error);
    throw error;
  }
};

// ==================== 获取案例列表 ====================

/**
 * 获取案例列表（仅显示已发布的）
 * @param {Object} params - 查询参数
 * @param {Number} params.page - 页码
 * @param {Number} params.page_size - 每页数量
 * @param {String} params.project_name - 项目名称（可选）
 * @param {String} params.project_summary - 项目概述（可选）
 * @returns {Promise<Object>}
 */
const getCaseList = async (params = {}) => {
  try {
    const { page = 1, page_size = 10, project_name, project_summary } = params;
    const offset = (page - 1) * page_size;
    
    // 构建查询条件
    const where = { status: 1 };
    if (project_name) {
      where.project_name = { [db.Sequelize.Op.like]: `%${project_name}%` };
    }
    if (project_summary) {
      where.project_summary = { [db.Sequelize.Op.like]: `%${project_summary}%` };
    }
    
    // 查询列表和总数
    const { count, rows } = await db.Case.findAndCountAll({
      where,
      attributes: ['id', 'project_name', 'project_summary', 'images', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: parseInt(page_size),
      offset: offset
    });
    
    return {
      list: rows,
      total: count,
      page: parseInt(page),
      page_size: parseInt(page_size),
      total_pages: Math.ceil(count / page_size)
    };
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
 * 获取设备预约时间段列表
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
      attributes: ['id', 'start_time', 'end_time', 'description'],
      order: [['sort_order', 'ASC']]
    });

    // 查询该设备的所有有效订单（待审核或进行中）
    const reservations = await db.EquipmentReservation.findAll({
      where: {
        equipment_id: equipmentId,
        status: { [Op.in]: [0, 1] } // 待审核或进行中
      },
      attributes: ['time_slots']
    });

    // 提取该日期已预约的时间段
    const bookedSlots = [];
    reservations.forEach(reservation => {
      if (reservation.time_slots && Array.isArray(reservation.time_slots)) {
        // 筛选出指定日期的时间段
        const dateSlotsForDate = reservation.time_slots.filter(slot => {
          return slot.startsWith(date + ' ');
        });
        // 提取时间部分（去掉日期前缀）
        dateSlotsForDate.forEach(slot => {
          const timeStr = slot.substring(11); // 提取 "09:00-10:00" 部分
          bookedSlots.push(timeStr);
        });
      }
    });

    // 构建返回数据
    const result = allTimeSlots.map(slot => {
      // 格式化时间显示（去掉秒，如 "09:00:00" -> "09:00"）
      const startTime = slot.start_time.substring(0, 5);
      const endTime = slot.end_time.substring(0, 5);
      const displayTime = `${startTime}-${endTime}`;
      
      return {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        display_time: displayTime,
        description: slot.description || '',
        available: !bookedSlots.includes(displayTime)
      };
    });

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
        { model: db.AnimalType, as: 'animal_type', attributes: ['id', 'name'] },
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
 * 查询笼位在指定日期范围内的剩余可用数量
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getCageAvailableQuantity = async (params) => {
  try {
    const { animal_type_id, environment_id, start_date, end_date, exclude_reservation_id } = params;

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
        available_quantity: 0
      };
    }

    const totalQuantity = cage.quantity;

    // 计算日期范围内的最小可用数量
    const availableQuantity = await checkCageAvailabilityForDateRange(
      cage.id,
      start_date,
      end_date,
      null, // 无事务
      exclude_reservation_id // 排除的订单ID
    );

    return {
      total_quantity: totalQuantity,
      available_quantity: availableQuantity
    };
  } catch (error) {
    logger.error('Get cage available quantity failed:', error);
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
        config_key: ['equipment_advance_days', 'cage_advance_days', 'experiment_advance_days']
      }
    });

    const result = {};
    configs.forEach(config => {
      result[config.config_key] = parseInt(config.config_value) || 7;
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
 * 获取学院列表
 * @param {Number} organization_id - 组织ID（可选）
 * @returns {Promise<Array>}
 */
const getDepartmentList = async (organization_id) => {
  try {
    const where = organization_id ? { organization_id: organization_id } : {};
    return await db.Department.findAll({
      where,
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get department list failed:', error);
    throw error;
  }
};

/**
 * 获取课题组列表
 * @param {Number} department_id - 学院ID（可选）
 * @returns {Promise<Array>}
 */
const getResearchGroupList = async (department_id) => {
  try {
    const where = department_id ? { department_id: department_id } : {};
    return await db.ResearchGroup.findAll({
      where,
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
  getExperimentTimeSlots,
  
  // 基础数据
  getEquipmentList,
  getEquipmentDetail,
  getEquipmentAvailableSlots,
  getCageList,
  getEnvironmentsByAnimalType,
  getCageAvailableQuantity,
  getOperationContentList,
  getAnimalBrandList,
  getAnimalVarietyList,
  getAnimalSpecificationList,
  getAnimalRequirementList,
  getOrganizationList,
  getDepartmentList,
  getResearchGroupList,
  getEnvironmentTypeList,
  getAnimalTypeList,
  getCagePurposeList,
  
  // 系统配置
  getAdvanceDaysConfigs
};
