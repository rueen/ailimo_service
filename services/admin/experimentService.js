/**
 * 管理端实验代操作服务
 */
const db = require('../../models');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

// ==================== 实验操作订单管理 ====================

/**
 * 获取实验操作订单列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getOperationList = async (params) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      user_id,
      user_name,
      user_phone,
      status,
      operation_content_id,
      animal_type_id,
      handler_id,
      reservation_date,
      start_date,
      end_date,
      order_sn,
    } = params;

    const where = {};
    if (user_id) where.user_id = user_id;
    if (status !== undefined) where.status = status;
    if (operation_content_id) where.operation_content_id = operation_content_id;
    if (animal_type_id) where.animal_type_id = animal_type_id;
    if (handler_id) where.handler_id = handler_id;
    if (order_sn) where.order_sn = order_sn;
    // 日期筛选：使用 JSON 查询匹配包含指定日期的订单
    if (reservation_date) {
      // 精确匹配包含某个日期的订单
      where[Op.and] = db.sequelize.literal(
        `JSON_SEARCH(time_slots, 'one', '${reservation_date}%', NULL, '$[*]') IS NOT NULL`
      );
    } else if (start_date || end_date) {
      // 日期范围查询：查询 time_slots 中任意时间段的日期在范围内的订单
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
    const { count, rows } = await db.ExperimentOperation.findAndCountAll({
      where,
      include: [
        {
          model: db.OperationContent,
          as: 'operation_content',
          attributes: ['id', 'name']
        },
        {
          model: db.AnimalType,
          as: 'animal_type',
          attributes: ['id', 'name']
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'phone'],
          where: hasUserWhere ? userWhere : undefined,
          required: hasUserWhere
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
      col: 'id'
    });

    return {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (error) {
    logger.error('Get experiment operation list failed:', error);
    throw error;
  }
};

/**
 * 获取实验操作订单详情
 * @param {Number} id - 订单ID
 * @returns {Promise<Object>}
 */
const getOperationDetail = async (id) => {
  try {
    const operation = await db.ExperimentOperation.findByPk(id, {
      include: [
        { 
          model: db.OperationContent, 
          as: 'operation_content'
        },
        { 
          model: db.AnimalType, 
          as: 'animal_type'
        },
        { 
          model: db.User, 
          as: 'user'
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

    if (!operation) {
      throw new Error('订单不存在');
    }

    // 转换 auditBy 为 audit_by
    const data = operation.toJSON();
    if (data.auditBy) {
      data.audit_by = data.auditBy;
      delete data.auditBy;
    }
    return data;
  } catch (error) {
    logger.error(`Get experiment operation detail failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 创建实验操作订单（管理端）
 * @param {Object} data - 订单数据
 * @param {Number} adminId - 管理员ID（可选）
 * @returns {Promise<Object>}
 */
const createOperation = async (data, adminId = null) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // 检查操作内容是否存在
    const operationContent = await db.OperationContent.findByPk(data.operation_content_id);
    if (!operationContent) {
      throw new Error('操作内容不存在');
    }

    // 检查动物类型是否存在
    const animalType = await db.AnimalType.findByPk(data.animal_type_id);
    if (!animalType) {
      throw new Error('动物类型不存在');
    }

    // 检查用户是否存在
    const user = await db.User.findByPk(data.user_id);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 生成订单号
    const { generateOrderSn, ORDER_PREFIX } = require('../../utils/orderSn');
    const { ORDER_SOURCE } = require('../../utils/constants');
    const orderSn = await generateOrderSn(ORDER_PREFIX.EXPERIMENT, transaction);

    // 设置订单字段
    data.order_sn = orderSn;
    data.status = 0; // 待审核
    data.source = adminId ? ORDER_SOURCE.ADMIN : ORDER_SOURCE.USER;
    data.created_by_admin_id = adminId || null;

    const operation = await db.ExperimentOperation.create(data, { transaction });
    
    await transaction.commit();
    logger.info(`Experiment operation created: id=${operation.id}, sn=${orderSn}, source=${data.source}`);
    
    return operation;
  } catch (error) {
    await transaction.rollback();
    logger.error('Create experiment operation failed:', error);
    throw error;
  }
};

/**
 * 更新实验操作订单（仅限待审核状态）
 * @param {Number} id - 订单ID
 * @param {Object} data - 更新数据
 * @returns {Promise<void>}
 */
const updateOperation = async (id, data) => {
  try {
    const operation = await db.ExperimentOperation.findByPk(id);
    if (!operation) {
      throw new Error('订单不存在');
    }

    if (operation.status !== 0) {
      throw new Error('只有待审核的订单才能修改');
    }

    // 如果修改了操作内容，检查是否存在
    if (data.operation_content_id) {
      const operationContent = await db.OperationContent.findByPk(data.operation_content_id);
      if (!operationContent) {
        throw new Error('操作内容不存在');
      }
    }

    // 如果修改了动物类型，检查是否存在
    if (data.animal_type_id) {
      const animalType = await db.AnimalType.findByPk(data.animal_type_id);
      if (!animalType) {
        throw new Error('动物类型不存在');
      }
    }

    await operation.update(data);
    logger.info(`Experiment operation updated: id=${id}`);
  } catch (error) {
    logger.error(`Update experiment operation failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 审核实验操作订单
 * @param {Number} id - 订单ID
 * @param {Number} status - 审核状态（1=通过，2=拒绝）
 * @param {String} rejectReason - 拒绝原因
 * @param {Number} handlerId - 负责人ID
 * @param {Number} adminId - 审核管理员ID
 * @returns {Promise<void>}
 */
const auditOperation = async (id, status, rejectReason, handlerId, adminId) => {
  try {
    const operation = await db.ExperimentOperation.findByPk(id);
    if (!operation) {
      throw new Error('订单不存在');
    }

    if (operation.status !== 0) {
      throw new Error('该订单已审核');
    }

    // 审核通过时必须指定负责人
    if (status === 1 && !handlerId) {
      throw new Error('审核通过时必须指定负责人');
    }

    // 审核拒绝时必须填写拒绝原因
    if (status === 2) {
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

    await operation.update(updateData);
    logger.info(`Experiment operation audited: id=${id}, status=${status}`);
  } catch (error) {
    logger.error(`Audit experiment operation failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 完成实验操作订单
 * @param {Number} id - 订单ID
 * @returns {Promise<void>}
 */
const completeOperation = async (id) => {
  try {
    const operation = await db.ExperimentOperation.findByPk(id);
    if (!operation) {
      throw new Error('订单不存在');
    }

    if (operation.status !== 1) {
      throw new Error('只有进行中的订单才能完成');
    }

    await operation.update({ 
      status: 3, 
      completed_time: new Date() 
    });
    
    logger.info(`Experiment operation completed: id=${id}`);
  } catch (error) {
    logger.error(`Complete experiment operation failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 取消实验操作订单
 * @param {Number} id - 订单ID
 * @returns {Promise<void>}
 */
const cancelOperation = async (id) => {
  try {
    const operation = await db.ExperimentOperation.findByPk(id);
    if (!operation) {
      throw new Error('订单不存在');
    }

    if (![0, 1].includes(operation.status)) {
      throw new Error('只有待审核或进行中的订单才能取消');
    }

    await operation.update({ status: 4, cancel_time: new Date() });
    logger.info(`Experiment operation cancelled: id=${id}`);
  } catch (error) {
    logger.error(`Cancel experiment operation failed: id=${id}`, error);
    throw error;
  }
};

// ==================== 操作内容管理 ====================

/**
 * 获取操作内容列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getOperationContentList = async (params) => {
  try {
    const { page = 1, pageSize = 10, name } = params;
    
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };

    const offset = (page - 1) * pageSize;
    const { count, rows } = await db.OperationContent.findAndCountAll({
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
    logger.error('Get operation content list failed:', error);
    throw error;
  }
};

/**
 * 创建操作内容
 * @param {String} name - 内容名称
 * @returns {Promise<Object>}
 */
const createOperationContent = async (name) => {
  try {
    // 检查是否重复
    const existing = await db.OperationContent.findOne({ where: { name } });
    if (existing) {
      throw new Error('该操作内容已存在');
    }

    const content = await db.OperationContent.create({ name });
    logger.info(`Operation content created: id=${content.id}, name=${name}`);
    return content;
  } catch (error) {
    logger.error('Create operation content failed:', error);
    throw error;
  }
};

/**
 * 更新操作内容
 * @param {Number} id - 内容ID
 * @param {String} name - 内容名称
 * @returns {Promise<void>}
 */
const updateOperationContent = async (id, name) => {
  try {
    const content = await db.OperationContent.findByPk(id);
    if (!content) {
      throw new Error('操作内容不存在');
    }

    // 检查名称是否与其他内容重复
    const existing = await db.OperationContent.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (existing) {
      throw new Error('该操作内容名称已存在');
    }

    await content.update({ name });
    logger.info(`Operation content updated: id=${id}`);
  } catch (error) {
    logger.error(`Update operation content failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除操作内容
 * @param {Number} id - 内容ID
 * @returns {Promise<void>}
 */
const deleteOperationContent = async (id) => {
  try {
    const content = await db.OperationContent.findByPk(id);
    if (!content) {
      throw new Error('操作内容不存在');
    }

    // 检查是否有关联订单
    const orderCount = await db.ExperimentOperation.count({ 
      where: { operation_content_id: id } 
    });
    if (orderCount > 0) {
      throw new Error('该操作内容存在关联订单，无法删除');
    }

    await content.destroy();
    logger.info(`Operation content deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete operation content failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 获取操作内容选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getOperationContentOptions = async () => {
  try {
    const contents = await db.OperationContent.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    return contents;
  } catch (error) {
    logger.error('Get operation content options failed:', error);
    throw error;
  }
};

// ==================== 时间段管理 ====================

/**
 * 获取时间段列表（所有或仅启用）
 * @param {Boolean} onlyActive - 是否仅获取启用的时间段
 * @returns {Promise<Array>}
 */
const getTimeSlotList = async (status) => {
  try {
    const where = {};
    if (status !== undefined) {
      where.status = parseInt(status);
    }
    
    const slots = await db.ExperimentTimeSlot.findAll({
      where,
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
    logger.error('Get experiment time slot list failed:', error);
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
    const existing = await db.ExperimentTimeSlot.findOne({
      where: {
        start_time: data.start_time,
        end_time: data.end_time
      }
    });
    if (existing) {
      throw new Error('该时间段已存在');
    }

    const timeSlot = await db.ExperimentTimeSlot.create(data);
    logger.info(`Experiment time slot created: id=${timeSlot.id}`);
    
    // 添加 display_time 字段
    const { formatTimeSlot } = require('../../utils/dateFormat');
    const slotData = timeSlot.toJSON();
    slotData.display_time = formatTimeSlot(slotData.start_time, slotData.end_time);
    return slotData;
  } catch (error) {
    logger.error('Create experiment time slot failed:', error);
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
    const timeSlot = await db.ExperimentTimeSlot.findByPk(id);
    if (!timeSlot) {
      throw new Error('时间段不存在');
    }

    // 如果修改了时间，检查是否与其他时间段重复
    if (data.start_time || data.end_time) {
      const startTime = data.start_time || timeSlot.start_time;
      const endTime = data.end_time || timeSlot.end_time;

      const existing = await db.ExperimentTimeSlot.findOne({
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
    logger.info(`Experiment time slot updated: id=${id}`);
    
    // 重新加载数据以获取更新后的值
    await timeSlot.reload();
    
    // 添加 display_time 字段
    const { formatTimeSlot } = require('../../utils/dateFormat');
    const slotData = timeSlot.toJSON();
    slotData.display_time = formatTimeSlot(slotData.start_time, slotData.end_time);
    return slotData;
  } catch (error) {
    logger.error(`Update experiment time slot failed: id=${id}`, error);
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
    const timeSlot = await db.ExperimentTimeSlot.findByPk(id);
    if (!timeSlot) {
      throw new Error('时间段不存在');
    }

    await timeSlot.destroy();
    logger.info(`Experiment time slot deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete experiment time slot failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 获取实验时间段选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getTimeSlotOptions = async () => {
  try {
    const slots = await db.ExperimentTimeSlot.findAll({
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
  } catch (error) {
    logger.error('Get experiment time slot options failed:', error);
    throw error;
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
