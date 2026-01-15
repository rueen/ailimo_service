/**
 * 管理端设备租赁服务
 */
const db = require('../../models');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

/**
 * 获取设备列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getEquipmentList = async (params) => {
  try {
    const { page = 1, pageSize = 10, name, status } = params;
    
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (status !== undefined) where.status = status;

    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await db.Equipment.findAndCountAll({
      where,
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
  } catch (err) {
    logger.error(`Get equipment list failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取设备详情
 * @param {Number} id - 设备ID
 * @returns {Promise<Object>}
 */
const getEquipmentDetail = async (id) => {
  try {
    const equipment = await db.Equipment.findByPk(id);
    if (!equipment) {
      throw new Error('设备不存在');
    }
    return equipment;
  } catch (err) {
    logger.error(`Get equipment detail failed: ${err.message}`);
    throw err;
  }
};

/**
 * 创建设备
 * @param {Object} data - 设备数据
 * @returns {Promise<Object>}
 */
const createEquipment = async (data) => {
  try {
    const { name, details } = data;
    const equipment = await db.Equipment.create({ name, details });
    logger.info(`Equipment created: ${name}`);
    return equipment;
  } catch (err) {
    logger.error(`Create equipment failed: ${err.message}`);
    throw err;
  }
};

/**
 * 更新设备
 * @param {Number} id - 设备ID
 * @param {Object} data - 设备数据
 * @returns {Promise<void>}
 */
const updateEquipment = async (id, data) => {
  try {
    const equipment = await db.Equipment.findByPk(id);
    if (!equipment) {
      throw new Error('设备不存在');
    }
    await equipment.update(data);
    logger.info(`Equipment updated: id=${id}`);
  } catch (err) {
    logger.error(`Update equipment failed: ${err.message}`);
    throw err;
  }
};

/**
 * 删除设备
 * @param {Number} id - 设备ID
 * @returns {Promise<void>}
 */
const deleteEquipment = async (id) => {
  try {
    const equipment = await db.Equipment.findByPk(id);
    if (!equipment) {
      throw new Error('设备不存在');
    }

    // 检查是否有关联订单
    const orderCount = await db.EquipmentReservation.count({ where: { equipment_id: id } });
    if (orderCount > 0) {
      throw new Error('该设备存在关联订单，无法删除');
    }

    await equipment.destroy();
    logger.info(`Equipment deleted: id=${id}`);
  } catch (err) {
    logger.error(`Delete equipment failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取设备选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getEquipmentOptions = async () => {
  try {
    const equipment = await db.Equipment.findAll({
      where: { status: 1 }, // 仅返回启用的设备
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    return equipment;
  } catch (err) {
    logger.error(`Get equipment options failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取设备租赁订单列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getReservationList = async (params) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      equipment_id, 
      equipment_name,
      user_id, 
      user_name,
      user_phone,
      status,
      reservation_date,
      start_date, 
      end_date 
    } = params;
    
    const where = {};
    if (equipment_id) where.equipment_id = equipment_id;
    if (user_id) where.user_id = user_id;
    if (status !== undefined) where.status = status;
    
    // 日期筛选：支持单日期精确查询或日期范围查询
    if (reservation_date) {
      // 精确匹配某个日期
      where.reservation_date = reservation_date;
    } else if (start_date && end_date) {
      // 日期范围查询
      where.reservation_date = {
        [Op.between]: [start_date, end_date]
      };
    }

    // 构建关联查询的 where 条件
    const equipmentWhere = {};
    if (equipment_name) {
      equipmentWhere.name = { [Op.like]: `%${equipment_name}%` };
    }

    const userWhere = {};
    if (user_name) {
      userWhere.name = { [Op.like]: `%${user_name}%` };
    }
    if (user_phone) {
      userWhere.phone = { [Op.like]: `%${user_phone}%` };
    }

    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await db.EquipmentReservation.findAndCountAll({
      where,
      include: [
        { 
          model: db.Equipment, 
          as: 'equipment', 
          attributes: ['id', 'name'],
          where: Object.keys(equipmentWhere).length > 0 ? equipmentWhere : undefined,
          required: Object.keys(equipmentWhere).length > 0
        },
        { 
          model: db.User, 
          as: 'user', 
          attributes: ['id', 'name', 'phone'],
          where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
          required: Object.keys(userWhere).length > 0
        },
        { model: db.Handler, as: 'handler', attributes: ['id', 'name'] },
        { model: db.Administrator, as: 'auditBy', attributes: ['id', 'username'] }
      ],
      offset,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    // 转换 auditBy 为 audit_by
    const list = rows.map(reservation => {
      const data = reservation.toJSON();
      if (data.auditBy) {
        data.audit_by = data.auditBy;
        delete data.auditBy;
      }
      return data;
    });

    return {
      list,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (err) {
    logger.error(`Get equipment reservation list failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取订单详情
 * @param {Number} id - 订单ID
 * @returns {Promise<Object>}
 */
const getReservationDetail = async (id) => {
  try {
    const reservation = await db.EquipmentReservation.findByPk(id, {
      include: [
        { model: db.Equipment, as: 'equipment', attributes: ['id', 'name', 'details'] },
        { model: db.User, as: 'user', attributes: ['id', 'name', 'phone'] },
        { model: db.Handler, as: 'handler', attributes: ['id', 'name'] },
        { model: db.Administrator, as: 'auditBy', attributes: ['id', 'username'] }
      ]
    });

    if (!reservation) {
      throw new Error('订单不存在');
    }

    // 转换 auditBy 为 audit_by
    const data = reservation.toJSON();
    if (data.auditBy) {
      data.audit_by = data.auditBy;
      delete data.auditBy;
    }

    return data;
  } catch (err) {
    logger.error(`Get equipment reservation detail failed: ${err.message}`);
    throw err;
  }
};

/**
 * 创建设备预约订单（管理端）
 * @param {Object} data - 订单数据
 * @returns {Promise<Object>}
 */
const createReservation = async (data) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { equipment_id, reservation_date, time_slots } = data;

    // 检查设备是否存在
    const equipment = await db.Equipment.findByPk(equipment_id, { transaction });
    if (!equipment) {
      throw new Error('设备不存在');
    }

    if (equipment.status !== 1) {
      throw new Error('设备不可用');
    }

    // 检查时间段可用性
    const isAvailable = await checkEquipmentAvailability(
      equipment_id,
      reservation_date,
      time_slots
    );

    if (!isAvailable) {
      throw new Error('所选时间段部分或全部已被预约');
    }

    // 创建订单（待审核状态）
    data.status = 0;
    const reservation = await db.EquipmentReservation.create(data, { transaction });
    
    await transaction.commit();
    logger.info(`Equipment reservation created: id=${reservation.id}`);
    
    return reservation;
  } catch (err) {
    await transaction.rollback();
    logger.error(`Create equipment reservation failed: ${err.message}`);
    throw err;
  }
};

/**
 * 更新设备预约订单（仅限待审核状态）
 * @param {Number} id - 订单ID
 * @param {Object} data - 更新数据
 * @returns {Promise<void>}
 */
const updateReservation = async (id, data) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const reservation = await db.EquipmentReservation.findByPk(id, { transaction });
    if (!reservation) {
      throw new Error('订单不存在');
    }

    if (reservation.status !== 0) {
      throw new Error('只有待审核的订单才能修改');
    }

    // 如果修改了设备、日期或时间段，需要重新检查可用性
    if (data.equipment_id || data.reservation_date || data.time_slots) {
      const equipmentId = data.equipment_id || reservation.equipment_id;
      const reservationDate = data.reservation_date || reservation.reservation_date;
      const timeSlots = data.time_slots || reservation.time_slots;

      const equipment = await db.Equipment.findByPk(equipmentId, { transaction });
      if (!equipment) {
        throw new Error('设备不存在');
      }

      if (equipment.status !== 1) {
        throw new Error('设备不可用');
      }

      const isAvailable = await checkEquipmentAvailability(
        equipmentId,
        reservationDate,
        timeSlots,
        id // 排除当前订单
      );

      if (!isAvailable) {
        throw new Error('所选时间段部分或全部已被预约');
      }
    }

    await reservation.update(data, { transaction });
    await transaction.commit();
    
    logger.info(`Equipment reservation updated: id=${id}`);
  } catch (err) {
    await transaction.rollback();
    logger.error(`Update equipment reservation failed: ${err.message}`);
    throw err;
  }
};

/**
 * 检查设备时间段是否可用
 * @param {Number} equipmentId - 设备ID
 * @param {String} date - 预约日期
 * @param {Array} timeSlots - 时间段数组
 * @param {Number} excludeReservationId - 排除的订单ID（更新时使用）
 * @returns {Promise<Boolean>}
 */
const checkEquipmentAvailability = async (equipmentId, date, timeSlots, excludeReservationId = null) => {
  try {
    // 查询该设备在该日期的所有有效订单（待审核、进行中状态）
    const where = {
      equipment_id: equipmentId,
      reservation_date: date,
      status: { [Op.in]: [0, 1] } // 待审核或进行中
    };

    if (excludeReservationId) {
      where.id = { [Op.ne]: excludeReservationId };
    }

    const existingReservations = await db.EquipmentReservation.findAll({
      where,
      attributes: ['time_slots']
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
  } catch (err) {
    logger.error(`Check equipment availability failed: ${err.message}`);
    throw err;
  }
};

/**
 * 审核订单
 * @param {Number} id - 订单ID
 * @param {Number} status - 审核状态：1-通过 2-拒绝
 * @param {String} rejectReason - 拒绝原因
 * @param {Number} handlerId - 负责人ID
 * @param {Number} adminId - 审核人ID
 * @returns {Promise<void>}
 */
const auditReservation = async (id, status, rejectReason, handlerId, adminId) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const reservation = await db.EquipmentReservation.findByPk(id, { transaction });
    
    if (!reservation) {
      throw new Error('订单不存在');
    }

    if (reservation.status !== 0) {
      throw new Error('该订单已审核，无法重复审核');
    }

    // 审核通过时检查设备可用性
    if (status === 1) {
      const isAvailable = await checkEquipmentAvailability(
        reservation.equipment_id,
        reservation.reservation_date,
        reservation.time_slots,
        id
      );

      if (!isAvailable) {
        throw new Error('所选时间段已被预约，审核失败');
      }

      if (!handlerId) {
        throw new Error('审核通过时必须指定负责人');
      }
    }

    const updateData = {
      status,
      audit_time: new Date(),
      audit_by: adminId
    };

    if (status === 1) {
      updateData.handler_id = handlerId;
    } else if (status === 2) {
      if (!rejectReason) {
        throw new Error('拒绝时必须填写拒绝原因');
      }
      updateData.reject_reason = rejectReason;
    }

    await reservation.update(updateData, { transaction });
    await transaction.commit();
    
    logger.info(`Equipment reservation audited: id=${id}, status=${status}, by=${adminId}`);
  } catch (err) {
    await transaction.rollback();
    logger.error(`Audit equipment reservation failed: ${err.message}`);
    throw err;
  }
};

/**
 * 完成订单
 * @param {Number} id - 订单ID
 * @returns {Promise<void>}
 */
const completeReservation = async (id) => {
  try {
    const reservation = await db.EquipmentReservation.findByPk(id);
    
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
    
    logger.info(`Equipment reservation completed: id=${id}`);
  } catch (err) {
    logger.error(`Complete equipment reservation failed: ${err.message}`);
    throw err;
  }
};

/**
 * 取消订单
 * @param {Number} id - 订单ID
 * @returns {Promise<void>}
 */
const cancelReservation = async (id) => {
  try {
    const reservation = await db.EquipmentReservation.findByPk(id);
    
    if (!reservation) {
      throw new Error('订单不存在');
    }

    if (![0, 1].includes(reservation.status)) {
      throw new Error('只有待审核或进行中的订单才能取消');
    }

    await reservation.update({ status: 4 });
    
    logger.info(`Equipment reservation cancelled: id=${id}`);
  } catch (err) {
    logger.error(`Cancel equipment reservation failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取时间段列表
 * @returns {Promise<Array>}
 */
const getTimeSlotList = async (status) => {
  try {
    const where = {};
    if (status !== undefined) {
      where.status = parseInt(status);
    }
    
    const slots = await db.EquipmentTimeSlot.findAll({
      where,
      order: [['sort_order', 'ASC'], ['start_time', 'ASC']]
    });
    
    // 添加 display_time 字段
    const { formatTimeSlot } = require('../../utils/dateFormat');
    return slots.map(slot => {
      const slotData = slot.toJSON();
      slotData.display_time = formatTimeSlot(slotData.start_time, slotData.end_time);
      return slotData;
    });
  } catch (err) {
    logger.error(`Get equipment time slot list failed: ${err.message}`);
    throw err;
  }
};

/**
 * 创建时间段
 * @param {Object} data - 时间段数据
 * @returns {Promise<Object>}
 */
const createTimeSlot = async (data) => {
  try {
    const { start_time, end_time, description, sort_order } = data;
    
    // 参数验证
    if (!start_time || !end_time) {
      throw new Error('开始时间和结束时间不能为空');
    }

    const slot = await db.EquipmentTimeSlot.create({
      start_time,
      end_time,
      description,
      sort_order
    });
    logger.info(`Equipment time slot created`);
    
    // 添加 display_time 字段
    const { formatTimeSlot } = require('../../utils/dateFormat');
    const slotData = slot.toJSON();
    slotData.display_time = formatTimeSlot(slotData.start_time, slotData.end_time);
    return slotData;
  } catch (err) {
    logger.error(`Create equipment time slot failed: ${err.message}`);
    throw err;
  }
};

/**
 * 更新时间段
 * @param {Number} id - 时间段ID
 * @param {Object} data - 时间段数据
 * @returns {Promise<void>}
 */
const updateTimeSlot = async (id, data) => {
  try {
    const slot = await db.EquipmentTimeSlot.findByPk(id);
    if (!slot) {
      throw new Error('时间段不存在');
    }

    const updateData = {};
    if (data.start_time !== undefined) updateData.start_time = data.start_time;
    if (data.end_time !== undefined) updateData.end_time = data.end_time;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;

    await slot.update(updateData);
    logger.info(`Equipment time slot updated: id=${id}`);
    
    // 重新加载数据以获取更新后的值
    await slot.reload();
    
    // 添加 display_time 字段
    const { formatTimeSlot } = require('../../utils/dateFormat');
    const slotData = slot.toJSON();
    slotData.display_time = formatTimeSlot(slotData.start_time, slotData.end_time);
    return slotData;
  } catch (err) {
    logger.error(`Update equipment time slot failed: ${err.message}`);
    throw err;
  }
};

/**
 * 删除时间段
 * @param {Number} id - 时间段ID
 * @returns {Promise<void>}
 */
const deleteTimeSlot = async (id) => {
  try {
    const slot = await db.EquipmentTimeSlot.findByPk(id);
    if (!slot) {
      throw new Error('时间段不存在');
    }

    await slot.destroy();
    logger.info(`Equipment time slot deleted: id=${id}`);
  } catch (err) {
    logger.error(`Delete equipment time slot failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取时间段选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getTimeSlotOptions = async () => {
  try {
    const slots = await db.EquipmentTimeSlot.findAll({
      where: { status: 1 }, // 仅返回启用的时间段
      attributes: ['id', 'start_time', 'end_time', 'description', 'sort_order', 'status'],
      order: [['sort_order', 'ASC'], ['start_time', 'ASC']]
    });
    
    // 添加 display_time 字段
    const { formatTimeSlot } = require('../../utils/dateFormat');
    return slots.map(slot => {
      const slotData = slot.toJSON();
      slotData.display_time = formatTimeSlot(slotData.start_time, slotData.end_time);
      return slotData;
    });
    return slots;
  } catch (err) {
    logger.error(`Get equipment time slot options failed: ${err.message}`);
    throw err;
  }
};

/**
 * 获取设备在指定日期的可用时间段
 * @param {Number} equipmentId - 设备ID
 * @param {String} date - 日期
 * @returns {Promise<Array>}
 */
const getAvailableSlots = async (equipmentId, date) => {
  try {
    // 获取所有启用的时间段
    const allSlots = await db.EquipmentTimeSlot.findAll({
      where: { status: 1 },
      order: [['sort_order', 'ASC'], ['start_time', 'ASC']]
    });

    // 查询该设备在该日期的所有有效订单
    const reservations = await db.EquipmentReservation.findAll({
      where: {
        equipment_id: equipmentId,
        reservation_date: date,
        status: { [Op.in]: [0, 1] } // 待审核或进行中
      },
      attributes: ['time_slots']
    });

    // 提取已预约的时间段
    const bookedSlots = [];
    reservations.forEach(reservation => {
      if (reservation.time_slots && Array.isArray(reservation.time_slots)) {
        bookedSlots.push(...reservation.time_slots);
      }
    });

    // 标记可用性
    const result = allSlots.map(slot => {
      const slotStr = `${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)}`;
      return {
        id: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        display_time: slotStr,
        description: slot.description,
        available: !bookedSlots.includes(slotStr)
      };
    });

    return result;
  } catch (err) {
    logger.error(`Get available slots failed: ${err.message}`);
    throw err;
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
  getAvailableSlots,
  checkEquipmentAvailability
};
