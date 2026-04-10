/**
 * 管理端笼位预约服务
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
      animal_type_id, 
      environment_id, 
      status,
      keyword 
    } = params;
    
    const where = {};
    if (animal_type_id) where.animal_type_id = animal_type_id;
    if (environment_id) where.environment_id = environment_id;
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
          as: 'animal_type', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.EnvironmentType, 
          as: 'environment', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.CageRoom, 
          as: 'room', 
          attributes: ['id', 'name'],
          required: false
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
          as: 'animal_type', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.EnvironmentType, 
          as: 'environment', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.CageRoom, 
          as: 'room', 
          attributes: ['id', 'name'],
          required: false
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
 * 根据动物类型和环境类型获取房间选项
 * @param {Number} animalTypeId - 动物类型ID
 * @param {Number} environmentId - 环境类型ID
 * @returns {Promise<Array>}
 */
const getRoomsByAnimalTypeAndEnvironment = async (animalTypeId, environmentId) => {
  try {
    // 查询该动物类型和环境类型下的所有笼位
    const cages = await db.Cage.findAll({
      where: { 
        animal_type_id: animalTypeId,
        environment_id: environmentId,
        status: 1,  // 只查询启用的笼位
        room_id: { [Op.ne]: null }  // room_id 不为空
      },
      include: [
        {
          model: db.CageRoom,
          as: 'room',
          attributes: ['id', 'name']
        }
      ],
      attributes: ['room_id'],
      group: ['room_id']  // 去重
    });

    // 提取并去重房间
    const rooms = [];
    const roomIds = new Set();
    
    for (const cage of cages) {
      if (cage.room && !roomIds.has(cage.room.id)) {
        roomIds.add(cage.room.id);
        rooms.push({
          id: cage.room.id,
          name: cage.room.name
        });
      }
    }

    return rooms;
  } catch (error) {
    logger.error(`Get rooms by animal type and environment failed: animal_type_id=${animalTypeId}, environment_id=${environmentId}`, error);
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
    const { animal_type_id, environment_id, room_id, start_date, end_date, exclude_reservation_id } = params;

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
    const where = {
      animal_type_id,
      environment_id,
      room_id,
      status: 1
    };
    console.log(where, '---where')
    const cage = await db.Cage.findOne({ where });

    // 如果没有匹配的笼位，返回空结果
    if (!cage) {
      return {
        total_quantity: 0,
        available_quantity: 0
      };
    }

    const totalQuantity = cage.quantity;

    // 查询已预约数量
    const reservationWhere = {
      animal_type_id,
      environment_id,
      room_id,
      status: [0, 1] // 待审核和进行中
    };
    
    if (exclude_reservation_id) {
      reservationWhere.id = { [Op.ne]: exclude_reservation_id };
    }

    // 计算日期范围内每一天的已预约数量，取最大值
    let maxReservedQuantity = 0;
    
    if (start_date) {
      const startDate = new Date(start_date);
      const endDate = end_date ? new Date(end_date) : new Date(start_date);
      
      // 遍历日期范围
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        // 查询在该日期有重叠的所有订单
        const reservations = await db.CageReservation.findAll({
          where: {
            ...reservationWhere,
            start_date: { [Op.lte]: dateStr },
            [Op.or]: [
              { end_date: { [Op.gte]: dateStr } },
              { end_date: null } // 长期预约
            ]
          }
        });
        
        // 累加该日期的预约数量
        const reservedQuantity = reservations.reduce((sum, res) => sum + res.quantity, 0);
        maxReservedQuantity = Math.max(maxReservedQuantity, reservedQuantity);
      }
    }

    const availableQuantity = totalQuantity - maxReservedQuantity;

    return {
      total_quantity: totalQuantity,
      available_quantity: Math.max(0, availableQuantity)
    };
  } catch (error) {
    logger.error('Get cage available quantity failed:', error);
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
      cage_id, 
      user_id,
      user_name,
      user_phone,
      status,
      reservation_date,
      start_date,
      end_date,
      animal_type_id,
      environment_id,
      purpose_id,
      order_sn,
    } = params;
    
    const where = {};
    if (cage_id) where.cage_id = cage_id;
    if (user_id) where.user_id = user_id;
    if (status !== undefined) where.status = status;
    if (animal_type_id) where.animal_type_id = animal_type_id;
    if (environment_id) where.environment_id = environment_id;
    if (purpose_id) where.purpose_id = purpose_id;
    if (order_sn) where.order_sn = order_sn;
    // 日期筛选：基于 start_date
    if (reservation_date) {
      // 兼容旧参数名，精确匹配某个日期
      where.start_date = reservation_date;
    } else if (start_date && end_date) {
      // 日期范围查询
      where.start_date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      where.start_date = { [Op.gte]: start_date };
    } else if (end_date) {
      where.start_date = { [Op.lte]: end_date };
    }

    // 构建用户搜索条件
    const userWhere = {};
    let hasUserWhere = false;
    if (user_name) {
      userWhere.name = { [Op.like]: `%${user_name}%` };
      hasUserWhere = true;
    }
    if (user_phone) {
      userWhere.phone = { [Op.like]: `%${user_phone}%` };
      hasUserWhere = true;
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
          attributes: ['id', 'name', 'phone'],
          where: hasUserWhere ? userWhere : undefined,
          required: hasUserWhere
        },
        { 
          model: db.AnimalType, 
          as: 'animal_type', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.EnvironmentType, 
          as: 'environment', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.CageRoom, 
          as: 'room', 
          attributes: ['id', 'name'],
          required: false
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
          as: 'auditBy',
          attributes: ['id', 'username']
        }
      ],
      offset,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']],
      // 当在 include 中使用 where 条件时，需要添加 distinct 来确保正确计数
      distinct: true,
      // 使用列名指定 distinct 的字段（使用主键）
      col: 'id'
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
            { model: db.AnimalType, as: 'animal_type' },
            { model: db.EnvironmentType, as: 'environment' },
            { model: db.CageRoom, as: 'room', required: false }
          ]
        },
        { 
          model: db.User, 
          as: 'user'
        },
        { 
          model: db.AnimalType, 
          as: 'animal_type'
        },
        { 
          model: db.EnvironmentType, 
          as: 'environment'
        },
        { 
          model: db.CageRoom, 
          as: 'room', 
          attributes: ['id', 'name'],
          required: false
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
          as: 'auditBy',
          attributes: ['id', 'username']
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
const createReservation = async (data, adminId = null) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { 
      animal_type_id,
      environment_id,
      room_id,
      start_date, 
      end_date, 
      quantity 
    } = data;

    // 根据动物类型+环境+房间查询匹配的笼位，并加锁防止并发问题
    const where = {
      animal_type_id,
      environment_id,
      status: 1  // 只查询启用的笼位
    };
    
    // 如果指定了房间，必须匹配房间ID
    if (room_id) {
      where.room_id = room_id;
    }
    
    const cage = await db.Cage.findOne({
      where,
      transaction,
      lock: transaction.LOCK.UPDATE  // 加悲观锁
    });

    if (!cage) {
      const msg = room_id 
        ? '未找到匹配的笼位（动物类型+环境+房间）' 
        : '未找到匹配的笼位（动物类型+环境）';
      throw new Error(msg);
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
    data.cage_id = cage.id;
    data.order_sn = orderSn;
    data.status = 0; // 待审核
    data.source = adminId ? ORDER_SOURCE.ADMIN : ORDER_SOURCE.USER;
    data.created_by_admin_id = adminId || null;

    const reservation = await db.CageReservation.create(data, { transaction });
    
    await transaction.commit();
    logger.info(`Cage reservation created: id=${reservation.id}, sn=${orderSn}, cage_id=${cage.id}, source=${data.source}`);
    
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

    // if (reservation.status !== 0) {
    //   throw new Error('只有待审核的订单才能修改');
    // }

    // 如果修改了动物类型、环境、笼位、日期或数量，需要重新检查可用性
    if (
      data.animal_type_id || 
      data.environment_id || 
      data.cage_id || 
      data.start_date || 
      data.end_date !== undefined || // end_date可能被设置为null
      data.quantity !== undefined  // 使用 !== undefined 避免 0 被判断为 false
    ) {
      const animalTypeId = data.animal_type_id || reservation.animal_type_id;
      const environmentId = data.environment_id || reservation.environment_id;
      const startDate = data.start_date || reservation.start_date;
      const endDate = data.end_date !== undefined ? data.end_date : reservation.end_date;
      const quantity = data.quantity !== undefined ? data.quantity : reservation.quantity;

      let cage;
      let cageId;

      // 如果修改了动物类型或环境类型，需要重新查找匹配的笼位
      if (data.animal_type_id || data.environment_id) {
        cage = await db.Cage.findOne({
          where: {
            animal_type_id: animalTypeId,
            environment_id: environmentId,
            status: 1
          },
          transaction,
          lock: transaction.LOCK.UPDATE  // 加悲观锁防止并发问题
        });

        if (!cage) {
          throw new Error('未找到匹配的笼位（动物类型+环境）');
        }

        cageId = cage.id;
        // 更新笼位ID和快照字段
        data.cage_id = cage.id;
        data.animal_type_id = animalTypeId;
        data.environment_id = environmentId;
      } else {
        // 如果没有修改动物类型和环境，使用原笼位或指定的笼位
        cageId = data.cage_id || reservation.cage_id;
        cage = await db.Cage.findByPk(cageId, { 
          transaction,
          lock: transaction.LOCK.UPDATE  // 加悲观锁防止并发问题
        });

        if (!cage) {
          throw new Error('笼位不存在');
        }

        // 如果修改了笼位ID，需要更新动物类型和环境类型快照
        if (data.cage_id && data.cage_id !== reservation.cage_id) {
          data.animal_type_id = cage.animal_type_id;
          data.environment_id = cage.environment_id;
        }
      }

      if (quantity > cage.quantity) {
        throw new Error(`预约数量不能超过笼位总数量（${cage.quantity}）`);
      }

      // 检查日期范围内的可用数量（排除当前订单）
      const availableQuantity = await checkCageAvailabilityForDateRange(
        cageId,
        startDate,
        endDate,
        transaction,
        id // 排除当前订单
      );

      if (availableQuantity < quantity) {
        throw new Error(`日期范围内可用数量不足，当前最小可用：${availableQuantity}`);
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
      include: [{ model: db.User, as: 'user' }],
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

      const cage = await db.Cage.findByPk(reservation.cage_id, { 
        transaction,
        lock: transaction.LOCK.UPDATE  // 加悲观锁防止并发问题
      });
      if (!cage) {
        throw new Error('笼位不存在');
      }

      if (cage.status !== 1) {
        throw new Error('笼位不可用');
      }

      // 检查日期范围内的可用性
      const availableQuantity = await checkCageAvailabilityForDateRange(
        reservation.cage_id,
        reservation.start_date,
        reservation.end_date,
        transaction,
        id
      );

      if (availableQuantity < reservation.quantity) {
        throw new Error(`日期范围内可用数量不足，当前最小可用：${availableQuantity}，审核失败`);
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
    
    // 发送短信通知
    if (reservation.user && reservation.user.phone) {
      const { sendOrderNotification } = require('../../utils/sms');
      const templateCode = status === 1 ? 'SMS_501095396' : 'SMS_500970389'; // 审核通过/未通过
      await sendOrderNotification(reservation.user.phone, templateCode, {
        order_type_name: '笼位预约'
      });
    }
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
    const reservation = await db.CageReservation.findByPk(id, {
      include: [{ model: db.User, as: 'user' }]
    });
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
    
    // 发送短信通知
    if (reservation.user && reservation.user.phone) {
      const { sendOrderNotification } = require('../../utils/sms');
      await sendOrderNotification(reservation.user.phone, 'SMS_501015384', {
        order_type_name: '笼位预约'
      });
    }
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
    const reservation = await db.CageReservation.findByPk(id, { 
      include: [{ model: db.User, as: 'user' }],
      transaction 
    });
    if (!reservation) {
      throw new Error('订单不存在');
    }

    if (![0, 1].includes(reservation.status)) {
      throw new Error('只有待审核或进行中的订单才能取消');
    }

    await reservation.update({ status: 4, cancel_time: new Date() }, { transaction });
    await transaction.commit();

    // 取消订单后，预约的笼位数量自动释放
    logger.info(`Cage reservation cancelled: id=${id}`);
    
    // 发送短信通知
    if (reservation.user && reservation.user.phone) {
      const { sendOrderNotification } = require('../../utils/sms');
      await sendOrderNotification(reservation.user.phone, 'SMS_500995405', {
        order_type_name: '笼位预约'
      });
    }
  } catch (error) {
    await transaction.rollback();
    logger.error(`Cancel cage reservation failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 检查笼位在指定日期范围的可用数量（返回最小值）
 * @param {Number} cageId - 笼位ID
 * @param {String} startDate - 开始日期 (YYYY-MM-DD)
 * @param {String} endDate - 结束日期 (YYYY-MM-DD 或 NULL)
 * @param {Object} transaction - 事务对象
 * @param {Number} excludeReservationId - 排除的订单ID
 * @returns {Promise<Number>} 日期范围内的最小可用数量
 */
const checkCageAvailabilityForDateRange = async (
  cageId,
  startDate,
  endDate,
  transaction,
  excludeReservationId = null
) => {
  try {
    const cage = await db.Cage.findByPk(cageId, { transaction });
    if (!cage) {
      throw new Error('笼位不存在');
    }

    const totalQuantity = cage.quantity;

    // 如果是长期预约（end_date为null），只检查开始日期当天
    if (!endDate) {
      const reservedQuantity = await getReservedQuantityForDate(
        cageId,
        startDate,
        transaction,
        excludeReservationId
      );
      return totalQuantity - reservedQuantity;
    }

    // 遍历日期范围内的每一天，计算最小可用数量
    const start = new Date(startDate);
    const end = new Date(endDate);
    let minAvailable = totalQuantity;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const reservedQuantity = await getReservedQuantityForDate(
        cageId,
        dateStr,
        transaction,
        excludeReservationId
      );
      const available = totalQuantity - reservedQuantity;
      minAvailable = Math.min(minAvailable, available);
    }

    logger.debug(`Cage availability check: cageId=${cageId}, startDate=${startDate}, endDate=${endDate}, total=${totalQuantity}, minAvailable=${minAvailable}`);

    return Math.max(0, minAvailable);
  } catch (error) {
    logger.error('Check cage availability for date range failed:', error);
    throw error;
  }
};

/**
 * 获取指定笼位在指定日期的已预约数量
 * @param {Number} cageId - 笼位ID
 * @param {String} date - 日期 (YYYY-MM-DD)
 * @param {Object} transaction - 事务对象
 * @param {Number} excludeReservationId - 排除的订单ID
 * @returns {Promise<Number>}
 */
const getReservedQuantityForDate = async (
  cageId,
  date,
  transaction,
  excludeReservationId = null
) => {
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

// ==================== 用途管理 ====================

/**
 * 获取用途列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getPurposeList = async (params) => {
  try {
    const { page = 1, pageSize = 10, name } = params;
    
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };

    const offset = (page - 1) * pageSize;
    const { count, rows } = await db.CagePurpose.findAndCountAll({
      where,
      offset,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });

    return {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(count / pageSize)
    };
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


/**
 * 导出笼位预约订单列表（不分页）
 * @param {Object} params - 查询参数（同 getReservationList，忽略 page/pageSize）
 * @returns {Promise<Array>}
 */
const exportReservationList = async (params) => {
  try {
    const {
      cage_id,
      user_id,
      user_name,
      user_phone,
      status,
      reservation_date,
      start_date,
      end_date,
      animal_type_id,
      environment_id,
      purpose_id,
      order_sn,
    } = params;

    const where = {};
    if (cage_id) where.cage_id = cage_id;
    if (user_id) where.user_id = user_id;
    if (status !== undefined) where.status = status;
    if (animal_type_id) where.animal_type_id = animal_type_id;
    if (environment_id) where.environment_id = environment_id;
    if (purpose_id) where.purpose_id = purpose_id;
    if (order_sn) where.order_sn = order_sn;
    if (reservation_date) {
      where.start_date = reservation_date;
    } else if (start_date && end_date) {
      where.start_date = { [Op.between]: [start_date, end_date] };
    } else if (start_date) {
      where.start_date = { [Op.gte]: start_date };
    } else if (end_date) {
      where.start_date = { [Op.lte]: end_date };
    }

    const userWhere = {};
    let hasUserWhere = false;
    if (user_name) {
      userWhere.name = { [Op.like]: `%${user_name}%` };
      hasUserWhere = true;
    }
    if (user_phone) {
      userWhere.phone = { [Op.like]: `%${user_phone}%` };
      hasUserWhere = true;
    }

    const rows = await db.CageReservation.findAll({
      where,
      include: [
        { model: db.Cage, as: 'cage', attributes: ['id', 'quantity'] },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'phone'],
          where: hasUserWhere ? userWhere : undefined,
          required: hasUserWhere
        },
        { model: db.AnimalType, as: 'animal_type', attributes: ['id', 'name'] },
        { model: db.EnvironmentType, as: 'environment', attributes: ['id', 'name'] },
        { model: db.CageRoom, as: 'room', attributes: ['id', 'name'], required: false },
        { model: db.CagePurpose, as: 'purpose', attributes: ['id', 'name'] },
        { model: db.Handler, as: 'handler', attributes: ['id', 'name'] },
        { model: db.Administrator, as: 'auditBy', attributes: ['id', 'username'] }
      ],
      order: [['created_at', 'DESC']],
    });

    return rows;
  } catch (error) {
    logger.error('Export cage reservation list failed:', error);
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
  getEnvironmentsByAnimalType,
  getRoomsByAnimalTypeAndEnvironment,
  getCageAvailableQuantity,

  // 订单管理
  getReservationList,
  getReservationDetail,
  createReservation,
  updateReservation,
  auditReservation,
  completeReservation,
  cancelReservation,
  exportReservationList,

  // 用途管理
  getPurposeList,
  getPurposeOptions,
  createPurpose,
  updatePurpose,
  deletePurpose
};
