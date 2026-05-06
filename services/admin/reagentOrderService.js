/**
 * 管理端试剂耗材订购服务
 */
const db = require('../../models');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

// ==================== 订单管理 ====================

/**
 * 获取试剂订单列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getOrderList = async (params) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      user_id, 
      status,
      brand_name,
      specification_name,
      start_date,
      end_date,
      keyword,
      order_sn
    } = params;
    
    const where = {};
    if (user_id) where.user_id = user_id;
    if (status !== undefined) where.status = status;
    if (brand_name) where.brand_name = { [Op.like]: `%${brand_name}%` };
    if (specification_name) where.specification_name = { [Op.like]: `%${specification_name}%` };
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }
    if (start_date && end_date) {
      where.delivery_date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      where.delivery_date = { [Op.gte]: start_date };
    } else if (end_date) {
      where.delivery_date = { [Op.lte]: end_date };
    }
    if (order_sn) where.order_sn = order_sn;
    const offset = (page - 1) * pageSize;
    const { count, rows } = await db.ReagentOrder.findAndCountAll({
      where,
      include: [
        { 
          model: db.User, 
          as: 'user', 
          attributes: ['id', 'name', 'phone'] 
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
      // 状态优先（待审核=0、进行中=1 排前）；活跃订单按到货日期升序（临近优先）；非活跃订单不参与日期排序，回退到创建时间降序
      order: [
        [db.sequelize.literal('CASE WHEN `ReagentOrder`.`status` IN (0, 1) THEN 0 ELSE 1 END'), 'ASC'],
        [db.sequelize.literal('CASE WHEN `ReagentOrder`.`status` IN (0, 1) THEN `ReagentOrder`.`delivery_date` ELSE NULL END'), 'ASC'],
        ['created_at', 'DESC']
      ]
    });

    return { 
      list: rows, 
      total: count, 
      page: parseInt(page), 
      pageSize: parseInt(pageSize) 
    };
  } catch (error) {
    logger.error('Get reagent order list failed:', error);
    throw error;
  }
};

/**
 * 获取试剂订单详情
 * @param {Number} id - 订单ID
 * @returns {Promise<Object>}
 */
const getOrderDetail = async (id) => {
  try {
    const order = await db.ReagentOrder.findByPk(id, {
      include: [
        { model: db.User, as: 'user' },
        { model: db.Handler, as: 'handler' },
        { model: db.Administrator, as: 'auditBy', attributes: ['id', 'username'] },
        { model: db.Region, as: 'province' },
        { model: db.Region, as: 'city' },
        { model: db.Region, as: 'district' }
      ]
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 转换 auditBy 为 audit_by
    const data = order.toJSON();
    if (data.auditBy) {
      data.audit_by = data.auditBy;
      delete data.auditBy;
    }
    return data;
  } catch (error) {
    logger.error(`Get reagent order detail failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 创建试剂订单（管理端）
 * @param {Object} data - 订单数据
 * @param {Number} adminId - 管理员ID（可选）
 * @returns {Promise<Object>}
 */
const createOrder = async (data, adminId = null) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    // 生成订单号
    const { generateOrderSn, ORDER_PREFIX } = require('../../utils/orderSn');
    const { ORDER_SOURCE } = require('../../utils/constants');
    const orderSn = await generateOrderSn(ORDER_PREFIX.REAGENT, transaction);

    // 设置订单字段
    data.order_sn = orderSn;
    data.status = 0; // 待审核
    data.source = adminId ? ORDER_SOURCE.ADMIN : ORDER_SOURCE.USER;
    data.created_by_admin_id = adminId || null;

    const order = await db.ReagentOrder.create(data, { transaction });
    
    await transaction.commit();
    logger.info(`Reagent order created: id=${order.id}, sn=${orderSn}, source=${data.source}`);
    return order;
  } catch (error) {
    await transaction.rollback();
    logger.error('Create reagent order failed:', error);
    throw error;
  }
};

/**
 * 更新试剂订单（仅限待审核状态）
 * @param {Number} id - 订单ID
 * @param {Object} data - 更新数据
 * @returns {Promise<void>}
 */
const updateOrder = async (id, data) => {
  try {
    const order = await db.ReagentOrder.findByPk(id);
    if (!order) {
      throw new Error('订单不存在');
    }

    // if (order.status !== 0) {
    //   throw new Error('只有待审核的订单才能修改');
    // }

    await order.update(data);
    logger.info(`Reagent order updated: id=${id}`);
  } catch (error) {
    logger.error(`Update reagent order failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 审核试剂订单
 * @param {Number} id - 订单ID
 * @param {Number} status - 审核状态（1=通过，2=拒绝）
 * @param {String} rejectReason - 拒绝原因
 * @param {Number} handlerId - 负责人ID
 * @param {Number} adminId - 审核管理员ID
 * @returns {Promise<void>}
 */
const auditOrder = async (id, status, rejectReason, handlerId, adminId) => {
  try {
    const order = await db.ReagentOrder.findByPk(id, {
      include: [{ model: db.User, as: 'user' }]
    });
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 0) {
      throw new Error('该订单已审核');
    }

    if (status === 1 && !handlerId) {
      throw new Error('审核通过时必须指定负责人');
    }

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

    await order.update(updateData);
    logger.info(`Reagent order audited: id=${id}, status=${status}`);
    
    // 发送短信通知
    if (order.user && order.user.phone) {
      const { sendOrderNotification } = require('../../utils/sms');
      const templateCode = status === 1 ? 'SMS_501095396' : 'SMS_500970389'; // 审核通过/未通过
      await sendOrderNotification(order.user.phone, templateCode, {
        order_type_name: '试剂耗材订购'
      });
    }
  } catch (error) {
    logger.error(`Audit reagent order failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 批量审核试剂耗材订单
 * @param {Number[]} ids - 订单ID列表
 * @param {Number} status - 审核状态（1=通过，2=拒绝）
 * @param {String} rejectReason - 拒绝原因
 * @param {Number} handlerId - 负责人ID
 * @param {Number} adminId - 审核管理员ID
 * @returns {Promise<{success_count: number, failed_ids: number[]}>}
 */
const batchAuditOrders = async (ids, status, rejectReason, handlerId, adminId) => {
  const results = await Promise.allSettled(
    ids.map(id => auditOrder(id, status, rejectReason, handlerId, adminId))
  );

  const failedIds = [];
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      failedIds.push(ids[index]);
      logger.warn(`Batch audit reagent order failed: id=${ids[index]}, reason=${result.reason?.message}`);
    }
  });

  const successCount = ids.length - failedIds.length;
  logger.info(`Batch audit reagent orders: total=${ids.length}, success=${successCount}`);

  return { success_count: successCount, failed_ids: failedIds };
};

/**
 * 完成试剂订单
 * @param {Number} id - 订单ID
 * @returns {Promise<void>}
 */
const completeOrder = async (id) => {
  try {
    const order = await db.ReagentOrder.findByPk(id, {
      include: [{ model: db.User, as: 'user' }]
    });
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 1) {
      throw new Error('只有进行中的订单才能完成');
    }

    await order.update({ 
      status: 3, 
      completed_time: new Date() 
    });
    
    logger.info(`Reagent order completed: id=${id}`);
    
    // 发送短信通知
    if (order.user && order.user.phone) {
      const { sendOrderNotification } = require('../../utils/sms');
      await sendOrderNotification(order.user.phone, 'SMS_501015384', {
        order_type_name: '试剂耗材订购'
      });
    }
  } catch (error) {
    logger.error(`Complete reagent order failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 取消试剂订单
 * @param {Number} id - 订单ID
 * @returns {Promise<void>}
 */
const cancelOrder = async (id) => {
  try {
    const order = await db.ReagentOrder.findByPk(id, {
      include: [{ model: db.User, as: 'user' }]
    });
    if (!order) {
      throw new Error('订单不存在');
    }

    if (![0, 1].includes(order.status)) {
      throw new Error('只有待审核或进行中的订单才能取消');
    }

    await order.update({ status: 4, cancel_time: new Date() });
    logger.info(`Reagent order cancelled: id=${id}`);
    
    // 发送短信通知
    if (order.user && order.user.phone) {
      const { sendOrderNotification } = require('../../utils/sms');
      await sendOrderNotification(order.user.phone, 'SMS_500995405', {
        order_type_name: '试剂耗材订购'
      });
    }
  } catch (error) {
    logger.error(`Cancel reagent order failed: id=${id}`, error);
    throw error;
  }
};


/**
 * 导出试剂耗材订单列表（不分页）
 * @param {Object} params - 查询参数（同 getOrderList，忽略 page/pageSize）
 * @returns {Promise<Array>}
 */
const exportOrderList = async (params) => {
  try {
    const {
      user_id,
      status,
      brand_name,
      specification_name,
      start_date,
      end_date,
      keyword,
      order_sn
    } = params;

    const where = {};
    if (user_id) where.user_id = user_id;
    if (status !== undefined) where.status = status;
    if (brand_name) where.brand_name = { [Op.like]: `%${brand_name}%` };
    if (specification_name) where.specification_name = { [Op.like]: `%${specification_name}%` };
    if (keyword) where.name = { [Op.like]: `%${keyword}%` };
    if (start_date && end_date) {
      where.delivery_date = { [Op.between]: [start_date, end_date] };
    } else if (start_date) {
      where.delivery_date = { [Op.gte]: start_date };
    } else if (end_date) {
      where.delivery_date = { [Op.lte]: end_date };
    }
    if (order_sn) where.order_sn = order_sn;

    const rows = await db.ReagentOrder.findAll({
      where,
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'name', 'phone'] },
        { model: db.Handler, as: 'handler', attributes: ['id', 'name'] },
        { model: db.Administrator, as: 'auditBy', attributes: ['id', 'username'] }
      ],
      order: [['created_at', 'DESC']],
    });

    return rows.map(order => {
      const data = order.toJSON();
      if (data.auditBy) {
        data.audit_by = data.auditBy;
        delete data.auditBy;
      }
      return data;
    });
  } catch (error) {
    logger.error('Export reagent order list failed:', error);
    throw error;
  }
};

module.exports = {
  // 订单管理
  getOrderList,
  getOrderDetail,
  createOrder,
  updateOrder,
  auditOrder,
  batchAuditOrders,
  completeOrder,
  cancelOrder,
  exportOrderList
};
