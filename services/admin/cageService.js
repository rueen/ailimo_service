/**
 * 管理端笼位租赁服务
 */
const db = require('../../models');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

// ==================== 笼位管理 ====================

/**
 * 获取笼位列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getCageList = async (params) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      animalTypeId, 
      environmentId, 
      status,
      keyword 
    } = params;
    
    const where = {};
    if (animalTypeId) where.animal_type_id = animalTypeId;
    if (environmentId) where.environment_id = environmentId;
    if (status !== undefined) where.status = status;
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }

    const offset = (page - 1) * pageSize;
    const { count, rows } = await db.Cage.findAndCountAll({
      where,
      include: [
        { 
          model: db.AnimalType, 
          as: 'animalType', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.EnvironmentType, 
          as: 'environment', 
          attributes: ['id', 'name'] 
        }
      ],
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
    logger.error('Get cage list failed:', error);
    throw error;
  }
};

/**
 * 获取笼位详情
 * @param {Number} id - 笼位ID
 * @returns {Promise<Object>}
 */
const getCageDetail = async (id) => {
  try {
    const cage = await db.Cage.findByPk(id, {
      include: [
        { 
          model: db.AnimalType, 
          as: 'animalType', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.EnvironmentType, 
          as: 'environment', 
          attributes: ['id', 'name'] 
        }
      ]
    });

    if (!cage) {
      throw new Error('笼位不存在');
    }

    return cage;
  } catch (error) {
    logger.error(`Get cage detail failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 创建笼位
 * @param {Object} data - 笼位数据
 * @returns {Promise<Object>}
 */
const createCage = async (data) => {
  try {
    const cage = await db.Cage.create(data);
    logger.info(`Cage created: id=${cage.id}, quantity=${cage.quantity}`);
    return cage;
  } catch (error) {
    logger.error('Create cage failed:', error);
    throw error;
  }
};

/**
 * 更新笼位
 * @param {Number} id - 笼位ID
 * @param {Object} data - 更新数据
 * @returns {Promise<void>}
 */
const updateCage = async (id, data) => {
  try {
    const cage = await db.Cage.findByPk(id);
    if (!cage) {
      throw new Error('笼位不存在');
    }
    
    await cage.update(data);
    logger.info(`Cage updated: id=${id}`);
  } catch (error) {
    logger.error(`Update cage failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除笼位
 * @param {Number} id - 笼位ID
 * @returns {Promise<void>}
 */
const deleteCage = async (id) => {
  try {
    const cage = await db.Cage.findByPk(id);
    if (!cage) {
      throw new Error('笼位不存在');
    }

    // 检查是否存在关联订单
    const orderCount = await db.CageReservation.count({ 
      where: { cage_id: id } 
    });
    
    if (orderCount > 0) {
      throw new Error('该笼位存在关联订单，无法删除');
    }

    await cage.destroy();
    logger.info(`Cage deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete cage failed: id=${id}`, error);
    throw error;
  }
};

// ==================== 订单管理 ====================

/**
 * 获取预约订单列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getReservationList = async (params) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      cageId, 
      userId, 
      status,
      startDate,
      endDate,
      animalTypeId,
      environmentId
    } = params;
    
    const where = {};
    if (cageId) where.cage_id = cageId;
    if (userId) where.user_id = userId;
    if (status !== undefined) where.status = status;
    if (animalTypeId) where.animal_type_id = animalTypeId;
    if (environmentId) where.environment_id = environmentId;
    if (startDate && endDate) {
      where.reservation_date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      where.reservation_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.reservation_date = { [Op.lte]: endDate };
    }

    const offset = (page - 1) * pageSize;
    const { count, rows } = await db.CageReservation.findAndCountAll({
      where,
      include: [
        { 
          model: db.Cage, 
          as: 'cage',
          attributes: ['id', 'quantity']
        },
        { 
          model: db.User, 
          as: 'user', 
          attributes: ['id', 'name', 'phone'] 
        },
        { 
          model: db.AnimalType, 
          as: 'animalType', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.EnvironmentType, 
          as: 'environment', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.CagePurpose, 
          as: 'purpose', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.Handler, 
          as: 'handler', 
          attributes: ['id', 'name'] 
        },
        {
          model: db.Administrator,
          as: 'auditor',
          attributes: ['id', 'username', 'remark']
        }
      ],
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
    logger.error('Get cage reservation list failed:', error);
    throw error;
  }
};

/**
 * 获取预约订单详情
 * @param {Number} id - 订单ID
 * @returns {Promise<Object>}
 */
const getReservationDetail = async (id) => {
  try {
    const reservation = await db.CageReservation.findByPk(id, {
      include: [
        { 
          model: db.Cage, 
          as: 'cage',
          include: [
            { model: db.AnimalType, as: 'animalType' },
            { model: db.EnvironmentType, as: 'environment' }
          ]
        },
        { 
          model: db.User, 
          as: 'user'
        },
        { 
          model: db.AnimalType, 
          as: 'animalType'
        },
        { 
          model: db.EnvironmentType, 
          as: 'environment'
        },
        { 
          model: db.CagePurpose, 
          as: 'purpose'
        },
        { 
          model: db.Handler, 
          as: 'handler'
        },
        {
          model: db.Administrator,
          as: 'auditor'
        }
      ]
    });

    if (!reservation) {
      throw new Error('订单不存在');
    }

    return reservation;
  } catch (error) {
    logger.error(`Get cage reservation detail failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 创建预约订单（管理端）
 * @param {Object} data - 订单数据
 * @returns {Promise<Object>}
 */
const createReservation = async (data) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { 
      cage_id, 
      reservation_date, 
      time_slots, 
      quantity 
    } = data;

    // 检查笼位是否存在
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

    // 检查时间段可用性（数量）
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
    data.status = 0; // 待审核

    const reservation = await db.CageReservation.create(data, { transaction });
    
    await transaction.commit();
    logger.info(`Cage reservation created: id=${reservation.id}`);
    
    return reservation;
  } catch (error) {
    await transaction.rollback();
    logger.error('Create cage reservation failed:', error);
    throw error;
  }
};

/**
 * 更新预约订单（仅限待审核状态）
 * @param {Number} id - 订单ID
 * @param {Object} data - 更新数据
 * @returns {Promise<void>}
 */
const updateReservation = async (id, data) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const reservation = await db.CageReservation.findByPk(id, { transaction });
    if (!reservation) {
      throw new Error('订单不存在');
    }

    if (reservation.status !== 0) {
      throw new Error('只有待审核的订单才能修改');
    }

    // 如果修改了笼位、日期、时间段或数量，需要重新检查可用性
    if (
      data.cage_id || 
      data.reservation_date || 
      data.time_slots || 
      data.quantity
    ) {
      const cageId = data.cage_id || reservation.cage_id;
      const reservationDate = data.reservation_date || reservation.reservation_date;
      const timeSlots = data.time_slots || reservation.time_slots;
      const quantity = data.quantity || reservation.quantity;

      const cage = await db.Cage.findByPk(cageId, { transaction });
      if (!cage) {
        throw new Error('笼位不存在');
      }

      if (quantity > cage.quantity) {
        throw new Error(`预约数量不能超过笼位总数量（${cage.quantity}）`);
      }

      const timeSlotArray = JSON.parse(timeSlots);
      for (const slot of timeSlotArray) {
        const available = await checkCageAvailability(
          cageId, 
          reservationDate, 
          slot, 
          transaction,
          id // 排除当前订单
        );
        
        if (available < quantity) {
          throw new Error(`时间段 ${slot} 可用数量不足，当前可用：${available}`);
        }
      }

      // 更新动物类型和环境类型快照
      if (data.cage_id) {
        data.animal_type_id = cage.animal_type_id;
        data.environment_id = cage.environment_id;
      }
    }

    await reservation.update(data, { transaction });
    await transaction.commit();
    
    logger.info(`Cage reservation updated: id=${id}`);
  } catch (error) {
    await transaction.rollback();
    logger.error(`Update cage reservation failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 审核预约订单
 * @param {Number} id - 订单ID
 * @param {Number} status - 审核状态（1=通过，2=拒绝）
 * @param {String} rejectReason - 拒绝原因
 * @param {Number} handlerId - 负责人ID
 * @param {Number} adminId - 审核管理员ID
 * @returns {Promise<void>}
 */
const auditReservation = async (id, status, rejectReason, handlerId, adminId) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const reservation = await db.CageReservation.findByPk(id, { 
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    
    if (!reservation) {
      throw new Error('订单不存在');
    }

    if (reservation.status !== 0) {
      throw new Error('该订单已审核');
    }

    // 如果是审核通过，需要再次检查笼位可用性
    if (status === 1) {
      if (!handlerId) {
        throw new Error('审核通过时必须指定负责人');
      }

      const cage = await db.Cage.findByPk(reservation.cage_id, { transaction });
      if (!cage) {
        throw new Error('笼位不存在');
      }

      if (cage.status !== 1) {
        throw new Error('笼位不可用');
      }

      // 检查时间段可用性
      const timeSlots = JSON.parse(reservation.time_slots);
      for (const slot of timeSlots) {
        const available = await checkCageAvailability(
          reservation.cage_id,
          reservation.reservation_date,
          slot,
          transaction,
          id
        );

        if (available < reservation.quantity) {
          throw new Error(`时间段 ${slot} 可用数量不足，当前可用：${available}，审核失败`);
        }
      }
    } else if (status === 2) {
      // 审核拒绝时必须填写拒绝原因
      if (!rejectReason || rejectReason.trim() === '') {
        throw new Error('拒绝时必须填写拒绝原因');
      }
    }

    const updateData = { 
      status, 
      audit_time: new Date(), 
      audit_by: adminId 
    };
    
    if (status === 1) {
      updateData.handler_id = handlerId;
    }
    
    if (status === 2) {
      updateData.reject_reason = rejectReason;
    }

    await reservation.update(updateData, { transaction });
    await transaction.commit();
    
    logger.info(`Cage reservation audited: id=${id}, status=${status}`);
  } catch (error) {
    await transaction.rollback();
    logger.error(`Audit cage reservation failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 完成预约订单
 * @param {Number} id - 订单ID
 * @returns {Promise<void>}
 */
const completeReservation = async (id) => {
  try {
    const reservation = await db.CageReservation.findByPk(id);
    if (!reservation) {
      throw new Error('订单不存在');
    }

    if (reservation.status !== 1) {
      throw new Error('只有进行中的订单才能完成');
    }

    await reservation.update({ 
      status: 3, 
      completed_time: new Date() 
    });

    // 注意：笼位数量在订单完成后自动释放（基于时间过期）
    // 不需要手动释放，因为检查可用性时会排除已过期的订单
    
    logger.info(`Cage reservation completed: id=${id}`);
  } catch (error) {
    logger.error(`Complete cage reservation failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 取消预约订单（释放占用的笼位数量）
 * @param {Number} id - 订单ID
 * @returns {Promise<void>}
 */
const cancelReservation = async (id) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const reservation = await db.CageReservation.findByPk(id, { transaction });
    if (!reservation) {
      throw new Error('订单不存在');
    }

    if (![0, 1].includes(reservation.status)) {
      throw new Error('只有待审核或进行中的订单才能取消');
    }

    await reservation.update({ status: 4 }, { transaction });
    await transaction.commit();

    // 取消订单后，预约的笼位数量自动释放
    logger.info(`Cage reservation cancelled: id=${id}`);
  } catch (error) {
    await transaction.rollback();
    logger.error(`Cancel cage reservation failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 检查笼位在指定日期和时间段的可用数量
 * @param {Number} cageId - 笼位ID
 * @param {String} date - 日期
 * @param {String} timeSlot - 时间段
 * @param {Object} transaction - 事务对象
 * @param {Number} excludeReservationId - 排除的订单ID
 * @returns {Promise<Number>} 可用数量
 */
const checkCageAvailability = async (
  cageId, 
  date, 
  timeSlot, 
  transaction,
  excludeReservationId = null
) => {
  try {
    // 获取笼位总数量
    const cage = await db.Cage.findByPk(cageId, { transaction });
    if (!cage) {
      throw new Error('笼位不存在');
    }

    // 查询该日期、时间段的所有已审核通过（进行中）的预约
    const where = {
      cage_id: cageId,
      reservation_date: date,
      status: [0, 1], // 待审核和进行中的订单都占用数量
      time_slots: {
        [Op.like]: `%${timeSlot}%`
      }
    };

    if (excludeReservationId) {
      where.id = { [Op.ne]: excludeReservationId };
    }

    const reservations = await db.CageReservation.findAll({
      where,
      attributes: ['id', 'quantity', 'time_slots'],
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

    // 可用数量 = 总数量 - 已预约数量
    const available = cage.quantity - reservedQuantity;
    return Math.max(0, available);
  } catch (error) {
    logger.error('Check cage availability failed:', error);
    throw error;
  }
};

// ==================== 用途管理 ====================

/**
 * 获取用途列表
 * @returns {Promise<Array>}
 */
const getPurposeList = async () => {
  try {
    return await db.CagePurpose.findAll({ 
      order: [['created_at', 'DESC']] 
    });
  } catch (error) {
    logger.error('Get cage purpose list failed:', error);
    throw error;
  }
};

/**
 * 创建用途
 * @param {String} name - 用途名称
 * @returns {Promise<Object>}
 */
const createPurpose = async (name) => {
  try {
    // 检查是否重复
    const existing = await db.CagePurpose.findOne({ where: { name } });
    if (existing) {
      throw new Error('该用途已存在');
    }

    const purpose = await db.CagePurpose.create({ name });
    logger.info(`Cage purpose created: id=${purpose.id}, name=${name}`);
    return purpose;
  } catch (error) {
    logger.error('Create cage purpose failed:', error);
    throw error;
  }
};

/**
 * 更新用途
 * @param {Number} id - 用途ID
 * @param {String} name - 用途名称
 * @returns {Promise<void>}
 */
const updatePurpose = async (id, name) => {
  try {
    const purpose = await db.CagePurpose.findByPk(id);
    if (!purpose) {
      throw new Error('用途不存在');
    }

    // 检查名称是否与其他用途重复
    const existing = await db.CagePurpose.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (existing) {
      throw new Error('该用途名称已存在');
    }

    await purpose.update({ name });
    logger.info(`Cage purpose updated: id=${id}`);
  } catch (error) {
    logger.error(`Update cage purpose failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除用途
 * @param {Number} id - 用途ID
 * @returns {Promise<void>}
 */
const deletePurpose = async (id) => {
  try {
    const purpose = await db.CagePurpose.findByPk(id);
    if (!purpose) {
      throw new Error('用途不存在');
    }

    // 检查是否有关联订单
    const orderCount = await db.CageReservation.count({ 
      where: { purpose_id: id } 
    });
    if (orderCount > 0) {
      throw new Error('该用途存在关联订单，无法删除');
    }

    await purpose.destroy();
    logger.info(`Cage purpose deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete cage purpose failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 获取笼位用途选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getPurposeOptions = async () => {
  try {
    const purposes = await db.CagePurpose.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    return purposes;
  } catch (error) {
    logger.error('Get cage purpose options failed:', error);
    throw error;
  }
};

// ==================== 时间段管理 ====================

/**
 * 获取时间段列表（所有或仅启用）
 * @param {Boolean} onlyActive - 是否仅获取启用的时间段
 * @returns {Promise<Array>}
 */
const getTimeSlotList = async (onlyActive = true) => {
  try {
    const where = onlyActive ? { status: 1 } : {};
    return await db.CageTimeSlot.findAll({
      where,
      order: [['sort_order', 'ASC']]
    });
  } catch (error) {
    logger.error('Get cage time slot list failed:', error);
    throw error;
  }
};

/**
 * 创建时间段
 * @param {Object} data - 时间段数据
 * @returns {Promise<Object>}
 */
const createTimeSlot = async (data) => {
  try {
    // 参数验证
    if (!data.start_time || !data.end_time) {
      throw new Error('开始时间和结束时间不能为空');
    }

    // 检查时间段是否重复
    const existing = await db.CageTimeSlot.findOne({
      where: {
        start_time: data.start_time,
        end_time: data.end_time
      }
    });
    if (existing) {
      throw new Error('该时间段已存在');
    }

    const timeSlot = await db.CageTimeSlot.create(data);
    logger.info(`Cage time slot created: id=${timeSlot.id}`);
    return timeSlot;
  } catch (error) {
    logger.error('Create cage time slot failed:', error);
    throw error;
  }
};

/**
 * 更新时间段
 * @param {Number} id - 时间段ID
 * @param {Object} data - 更新数据
 * @returns {Promise<void>}
 */
const updateTimeSlot = async (id, data) => {
  try {
    const timeSlot = await db.CageTimeSlot.findByPk(id);
    if (!timeSlot) {
      throw new Error('时间段不存在');
    }

    // 如果修改了时间，检查是否与其他时间段重复
    if (data.start_time || data.end_time) {
      const startTime = data.start_time || timeSlot.start_time;
      const endTime = data.end_time || timeSlot.end_time;

      const existing = await db.CageTimeSlot.findOne({
        where: {
          start_time: startTime,
          end_time: endTime,
          id: { [Op.ne]: id }
        }
      });
      if (existing) {
        throw new Error('该时间段已存在');
      }
    }

    await timeSlot.update(data);
    logger.info(`Cage time slot updated: id=${id}`);
  } catch (error) {
    logger.error(`Update cage time slot failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除时间段
 * @param {Number} id - 时间段ID
 * @returns {Promise<void>}
 */
const deleteTimeSlot = async (id) => {
  try {
    const timeSlot = await db.CageTimeSlot.findByPk(id);
    if (!timeSlot) {
      throw new Error('时间段不存在');
    }

    await timeSlot.destroy();
    logger.info(`Cage time slot deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete cage time slot failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 获取笼位时间段选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getTimeSlotOptions = async () => {
  try {
    const slots = await db.CageTimeSlot.findAll({
      where: { status: 1 }, // 仅返回启用的时间段
      attributes: ['id', 'start_time', 'end_time', 'description', 'sort_order'],
      order: [['sort_order', 'ASC'], ['start_time', 'ASC']]
    });
    return slots;
  } catch (error) {
    logger.error('Get cage time slot options failed:', error);
    throw error;
  }
};

/**
 * 获取指定笼位在指定日期的可用时间段
 * @param {Number} cageId - 笼位ID
 * @param {String} date - 日期
 * @returns {Promise<Array>}
 */
const getAvailableTimeSlots = async (cageId, date) => {
  try {
    const cage = await db.Cage.findByPk(cageId);
    if (!cage) {
      throw new Error('笼位不存在');
    }

    if (cage.status !== 1) {
      throw new Error('笼位不可用');
    }

    // 获取所有启用的时间段
    const allTimeSlots = await db.CageTimeSlot.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC']]
    });

    // 查询该日期的所有预约
    const reservations = await db.CageReservation.findAll({
      where: {
        cage_id: cageId,
        reservation_date: date,
        status: [0, 1] // 待审核和进行中
      },
      attributes: ['time_slots', 'quantity']
    });

    // 计算每个时间段的已预约数量
    const result = allTimeSlots.map(slot => {
      const timeSlotStr = `${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)}`;
      
      let reservedQuantity = 0;
      for (const reservation of reservations) {
        const slots = JSON.parse(reservation.time_slots);
        if (slots.includes(timeSlotStr)) {
          reservedQuantity += reservation.quantity;
        }
      }

      const available = cage.quantity - reservedQuantity;

      return {
        id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        description: slot.description,
        sort_order: slot.sort_order,
        total_quantity: cage.quantity,
        reserved_quantity: reservedQuantity,
        available_quantity: Math.max(0, available),
        is_available: available > 0
      };
    });

    return result;
  } catch (error) {
    logger.error('Get available time slots failed:', error);
    throw error;
  }
};

module.exports = {
  // 笼位管理
  getCageList,
  getCageDetail,
  createCage,
  updateCage,
  deleteCage,
  
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
  deletePurpose,
  
  // 时间段管理
  getTimeSlotList,
  getTimeSlotOptions,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  getAvailableTimeSlots
};
