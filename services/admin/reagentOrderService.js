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
      userId, 
      status,
      brandId,
      startDate,
      endDate,
      keyword
    } = params;
    
    const where = {};
    if (userId) where.user_id = userId;
    if (status !== undefined) where.status = status;
    if (brandId) where.brand_id = brandId;
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }
    if (startDate && endDate) {
      where.delivery_date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      where.delivery_date = { [Op.gte]: startDate };
    } else if (endDate) {
      where.delivery_date = { [Op.lte]: endDate };
    }

    const offset = (page - 1) * pageSize;
    const { count, rows } = await db.ReagentOrder.findAndCountAll({
      where,
      include: [
        { 
          model: db.ReagentBrand, 
          as: 'brand', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.ReagentSpecification, 
          as: 'specification', 
          attributes: ['id', 'name'] 
        },
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
        { model: db.ReagentBrand, as: 'brand' },
        { model: db.ReagentSpecification, as: 'specification' },
        { model: db.User, as: 'user' },
        { model: db.Handler, as: 'handler' },
        { model: db.Administrator, as: 'auditor' }
      ]
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    return order;
  } catch (error) {
    logger.error(`Get reagent order detail failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 创建试剂订单（管理端）
 * @param {Object} data - 订单数据
 * @returns {Promise<Object>}
 */
const createOrder = async (data) => {
  try {
    data.status = 0; // 待审核
    const order = await db.ReagentOrder.create(data);
    logger.info(`Reagent order created: id=${order.id}`);
    return order;
  } catch (error) {
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

    if (order.status !== 0) {
      throw new Error('只有待审核的订单才能修改');
    }

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
    const order = await db.ReagentOrder.findByPk(id);
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
  } catch (error) {
    logger.error(`Audit reagent order failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 完成试剂订单
 * @param {Number} id - 订单ID
 * @returns {Promise<void>}
 */
const completeOrder = async (id) => {
  try {
    const order = await db.ReagentOrder.findByPk(id);
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
    const order = await db.ReagentOrder.findByPk(id);
    if (!order) {
      throw new Error('订单不存在');
    }

    if (![0, 1].includes(order.status)) {
      throw new Error('只有待审核或进行中的订单才能取消');
    }

    await order.update({ status: 4 });
    logger.info(`Reagent order cancelled: id=${id}`);
  } catch (error) {
    logger.error(`Cancel reagent order failed: id=${id}`, error);
    throw error;
  }
};

// ==================== 品牌管理 ====================

/**
 * 获取品牌列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getBrandList = async (params) => {
  try {
    const { page = 1, pageSize = 10, name } = params;
    
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };

    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await db.ReagentBrand.findAndCountAll({
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
    logger.error('Get reagent brand list failed:', error);
    throw error;
  }
};

/**
 * 创建品牌
 * @param {String} name - 品牌名称
 * @returns {Promise<Object>}
 */
const createBrand = async (name) => {
  try {
    const existing = await db.ReagentBrand.findOne({ where: { name } });
    if (existing) {
      throw new Error('该品牌已存在');
    }

    const brand = await db.ReagentBrand.create({ name });
    logger.info(`Reagent brand created: id=${brand.id}, name=${name}`);
    return brand;
  } catch (error) {
    logger.error('Create reagent brand failed:', error);
    throw error;
  }
};

/**
 * 更新品牌
 * @param {Number} id - 品牌ID
 * @param {String} name - 品牌名称
 * @returns {Promise<void>}
 */
const updateBrand = async (id, name) => {
  try {
    const brand = await db.ReagentBrand.findByPk(id);
    if (!brand) {
      throw new Error('品牌不存在');
    }

    const existing = await db.ReagentBrand.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (existing) {
      throw new Error('该品牌名称已存在');
    }

    await brand.update({ name });
    logger.info(`Reagent brand updated: id=${id}`);
  } catch (error) {
    logger.error(`Update reagent brand failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除品牌
 * @param {Number} id - 品牌ID
 * @returns {Promise<void>}
 */
const deleteBrand = async (id) => {
  try {
    const brand = await db.ReagentBrand.findByPk(id);
    if (!brand) {
      throw new Error('品牌不存在');
    }

    const orderCount = await db.ReagentOrder.count({ where: { brand_id: id } });
    if (orderCount > 0) {
      throw new Error('该品牌存在关联订单，无法删除');
    }

    await brand.destroy();
    logger.info(`Reagent brand deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete reagent brand failed: id=${id}`, error);
    throw error;
  }
};

// ==================== 规格管理 ====================

/**
 * 获取规格列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getSpecificationList = async (params) => {
  try {
    const { page = 1, pageSize = 10, name } = params;
    
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };

    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await db.ReagentSpecification.findAndCountAll({
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
    logger.error('Get reagent specification list failed:', error);
    throw error;
  }
};

/**
 * 创建规格
 * @param {String} name - 规格名称
 * @returns {Promise<Object>}
 */
const createSpecification = async (name) => {
  try {
    const existing = await db.ReagentSpecification.findOne({ where: { name } });
    if (existing) {
      throw new Error('该规格已存在');
    }

    const spec = await db.ReagentSpecification.create({ name });
    logger.info(`Reagent specification created: id=${spec.id}`);
    return spec;
  } catch (error) {
    logger.error('Create reagent specification failed:', error);
    throw error;
  }
};

/**
 * 更新规格
 * @param {Number} id - 规格ID
 * @param {String} name - 规格名称
 * @returns {Promise<void>}
 */
const updateSpecification = async (id, name) => {
  try {
    const spec = await db.ReagentSpecification.findByPk(id);
    if (!spec) {
      throw new Error('规格不存在');
    }

    const existing = await db.ReagentSpecification.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (existing) {
      throw new Error('该规格名称已存在');
    }

    await spec.update({ name });
    logger.info(`Reagent specification updated: id=${id}`);
  } catch (error) {
    logger.error(`Update reagent specification failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除规格
 * @param {Number} id - 规格ID
 * @returns {Promise<void>}
 */
const deleteSpecification = async (id) => {
  try {
    const spec = await db.ReagentSpecification.findByPk(id);
    if (!spec) {
      throw new Error('规格不存在');
    }

    const orderCount = await db.ReagentOrder.count({ where: { specification_id: id } });
    if (orderCount > 0) {
      throw new Error('该规格存在关联订单，无法删除');
    }

    await spec.destroy();
    logger.info(`Reagent specification deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete reagent specification failed: id=${id}`, error);
    throw error;
  }
};

// ==================== Options 函数 ====================

/**
 * 获取试剂品牌选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getBrandOptions = async () => {
  try {
    const brands = await db.ReagentBrand.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    return brands;
  } catch (error) {
    logger.error('Get reagent brand options failed:', error);
    throw error;
  }
};

/**
 * 获取试剂规格选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getSpecificationOptions = async () => {
  try {
    const specs = await db.ReagentSpecification.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    return specs;
  } catch (error) {
    logger.error('Get reagent specification options failed:', error);
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
  completeOrder,
  cancelOrder,
  
  // 品牌管理
  getBrandList,
  getBrandOptions,
  createBrand,
  updateBrand,
  deleteBrand,
  
  // 规格管理
  getSpecificationList,
  getSpecificationOptions,
  createSpecification,
  updateSpecification,
  deleteSpecification
};
