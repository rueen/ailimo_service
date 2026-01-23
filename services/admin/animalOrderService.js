/**
 * 管理端动物订购服务
 */
const db = require('../../models');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

// ==================== 订单管理 ====================

/**
 * 获取动物订单列表
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
      brand_id,
      variety_id,
      start_date,
      end_date,
      order_sn
    } = params;
    
    const where = {};
    if (user_id) where.user_id = user_id;
    if (status !== undefined) where.status = status;
    if (brand_id) where.brand_id = brand_id;
    if (variety_id) where.variety_id = variety_id;
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
    const { count, rows } = await db.AnimalOrder.findAndCountAll({
      where,
      include: [
        { 
          model: db.AnimalBrand, 
          as: 'brand', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.AnimalVariety, 
          as: 'variety', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.AnimalSpecification, 
          as: 'specification', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.AnimalRequirement, 
          as: 'requirement', 
          attributes: ['id', 'name'] 
        },
        { 
          model: db.EnvironmentType, 
          as: 'environment', 
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
          as: 'auditBy',
          attributes: ['id', 'username']
        },
        { model: db.Region, as: 'province', attributes: ['id', 'name', 'code'] },
        { model: db.Region, as: 'city', attributes: ['id', 'name', 'code'] },
        { model: db.Region, as: 'district', attributes: ['id', 'name', 'code'] }
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
    logger.error('Get animal order list failed:', error);
    throw error;
  }
};

/**
 * 获取动物订单详情
 * @param {Number} id - 订单ID
 * @returns {Promise<Object>}
 */
const getOrderDetail = async (id) => {
  try {
    const order = await db.AnimalOrder.findByPk(id, {
      include: [
        { model: db.AnimalBrand, as: 'brand' },
        { model: db.AnimalVariety, as: 'variety' },
        { model: db.AnimalSpecification, as: 'specification' },
        { model: db.AnimalRequirement, as: 'requirement' },
        { model: db.EnvironmentType, as: 'environment' },
        { model: db.User, as: 'user' },
        { model: db.Handler, as: 'handler' },
        { model: db.Administrator, as: 'auditBy', attributes: ['id', 'username'] },
        { model: db.Region, as: 'province', attributes: ['id', 'name', 'code'] },
        { model: db.Region, as: 'city', attributes: ['id', 'name', 'code'] },
        { model: db.Region, as: 'district', attributes: ['id', 'name', 'code'] }
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
    logger.error(`Get animal order detail failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 创建动物订单（管理端）
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
    const orderSn = await generateOrderSn(ORDER_PREFIX.ANIMAL, transaction);

    // 设置订单字段
    data.order_sn = orderSn;
    data.status = 0; // 待审核
    data.source = adminId ? ORDER_SOURCE.ADMIN : ORDER_SOURCE.USER;
    data.created_by_admin_id = adminId || null;

    const order = await db.AnimalOrder.create(data, { transaction });
    
    await transaction.commit();
    logger.info(`Animal order created: id=${order.id}, sn=${orderSn}, source=${data.source}`);
    return order;
  } catch (error) {
    await transaction.rollback();
    logger.error('Create animal order failed:', error);
    throw error;
  }
};

/**
 * 更新动物订单（仅限待审核状态）
 * @param {Number} id - 订单ID
 * @param {Object} data - 更新数据
 * @returns {Promise<void>}
 */
const updateOrder = async (id, data) => {
  try {
    const order = await db.AnimalOrder.findByPk(id);
    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 0) {
      throw new Error('只有待审核的订单才能修改');
    }

    await order.update(data);
    logger.info(`Animal order updated: id=${id}`);
  } catch (error) {
    logger.error(`Update animal order failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 审核动物订单
 * @param {Number} id - 订单ID
 * @param {Number} status - 审核状态（1=通过，2=拒绝）
 * @param {String} rejectReason - 拒绝原因
 * @param {Number} handlerId - 负责人ID
 * @param {Number} adminId - 审核管理员ID
 * @returns {Promise<void>}
 */
const auditOrder = async (id, status, rejectReason, handlerId, adminId) => {
  try {
    const order = await db.AnimalOrder.findByPk(id);
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
    logger.info(`Animal order audited: id=${id}, status=${status}`);
  } catch (error) {
    logger.error(`Audit animal order failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 完成动物订单
 * @param {Number} id - 订单ID
 * @returns {Promise<void>}
 */
const completeOrder = async (id) => {
  try {
    const order = await db.AnimalOrder.findByPk(id);
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
    
    logger.info(`Animal order completed: id=${id}`);
  } catch (error) {
    logger.error(`Complete animal order failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 取消动物订单
 * @param {Number} id - 订单ID
 * @returns {Promise<void>}
 */
const cancelOrder = async (id) => {
  try {
    const order = await db.AnimalOrder.findByPk(id);
    if (!order) {
      throw new Error('订单不存在');
    }

    if (![0, 1].includes(order.status)) {
      throw new Error('只有待审核或进行中的订单才能取消');
    }

    await order.update({ status: 4, cancel_time: new Date() });
    logger.info(`Animal order cancelled: id=${id}`);
  } catch (error) {
    logger.error(`Cancel animal order failed: id=${id}`, error);
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
    
    const { count, rows } = await db.AnimalBrand.findAndCountAll({
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
    logger.error('Get animal brand list failed:', error);
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
    const existing = await db.AnimalBrand.findOne({ where: { name } });
    if (existing) {
      throw new Error('该品牌已存在');
    }

    const brand = await db.AnimalBrand.create({ name });
    logger.info(`Animal brand created: id=${brand.id}, name=${name}`);
    return brand;
  } catch (error) {
    logger.error('Create animal brand failed:', error);
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
    const brand = await db.AnimalBrand.findByPk(id);
    if (!brand) {
      throw new Error('品牌不存在');
    }

    const existing = await db.AnimalBrand.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (existing) {
      throw new Error('该品牌名称已存在');
    }

    await brand.update({ name });
    logger.info(`Animal brand updated: id=${id}`);
  } catch (error) {
    logger.error(`Update animal brand failed: id=${id}`, error);
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
    const brand = await db.AnimalBrand.findByPk(id);
    if (!brand) {
      throw new Error('品牌不存在');
    }

    const orderCount = await db.AnimalOrder.count({ where: { brand_id: id } });
    if (orderCount > 0) {
      throw new Error('该品牌存在关联订单，无法删除');
    }

    await brand.destroy();
    logger.info(`Animal brand deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete animal brand failed: id=${id}`, error);
    throw error;
  }
};

// ==================== 品系管理 ====================

/**
 * 获取品系列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getVarietyList = async (params) => {
  try {
    const { page = 1, pageSize = 10, name, brand_id } = params;
    
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };
    if (brand_id) where.brand_id = brand_id;

    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await db.AnimalVariety.findAndCountAll({
      where,
      include: [
        { model: db.AnimalBrand, as: 'brand', attributes: ['id', 'name'] }
      ],
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
    logger.error('Get animal variety list failed:', error);
    throw error;
  }
};

/**
 * 创建品系
 * @param {Object} data - 品系数据
 * @returns {Promise<Object>}
 */
const createVariety = async (data) => {
  try {
    const existing = await db.AnimalVariety.findOne({ 
      where: { 
        name: data.name,
        brand_id: data.brand_id
      } 
    });
    if (existing) {
      throw new Error('该品系已存在');
    }

    const variety = await db.AnimalVariety.create(data);
    logger.info(`Animal variety created: id=${variety.id}`);
    return variety;
  } catch (error) {
    logger.error('Create animal variety failed:', error);
    throw error;
  }
};

/**
 * 更新品系
 * @param {Number} id - 品系ID
 * @param {Object} data - 更新数据
 * @returns {Promise<void>}
 */
const updateVariety = async (id, data) => {
  try {
    const variety = await db.AnimalVariety.findByPk(id);
    if (!variety) {
      throw new Error('品系不存在');
    }

    if (data.name || data.brand_id) {
      const name = data.name || variety.name;
      const brandId = data.brand_id || variety.brand_id;

      const existing = await db.AnimalVariety.findOne({ 
        where: { 
          name,
          brand_id: brandId,
          id: { [Op.ne]: id }
        } 
      });
      if (existing) {
        throw new Error('该品系已存在');
      }
    }

    await variety.update(data);
    logger.info(`Animal variety updated: id=${id}`);
  } catch (error) {
    logger.error(`Update animal variety failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除品系
 * @param {Number} id - 品系ID
 * @returns {Promise<void>}
 */
const deleteVariety = async (id) => {
  try {
    const variety = await db.AnimalVariety.findByPk(id);
    if (!variety) {
      throw new Error('品系不存在');
    }

    const orderCount = await db.AnimalOrder.count({ where: { variety_id: id } });
    if (orderCount > 0) {
      throw new Error('该品系存在关联订单，无法删除');
    }

    await variety.destroy();
    logger.info(`Animal variety deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete animal variety failed: id=${id}`, error);
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
    
    const { count, rows } = await db.AnimalSpecification.findAndCountAll({
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
    logger.error('Get animal specification list failed:', error);
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
    const existing = await db.AnimalSpecification.findOne({ where: { name } });
    if (existing) {
      throw new Error('该规格已存在');
    }

    const spec = await db.AnimalSpecification.create({ name });
    logger.info(`Animal specification created: id=${spec.id}`);
    return spec;
  } catch (error) {
    logger.error('Create animal specification failed:', error);
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
    const spec = await db.AnimalSpecification.findByPk(id);
    if (!spec) {
      throw new Error('规格不存在');
    }

    const existing = await db.AnimalSpecification.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (existing) {
      throw new Error('该规格名称已存在');
    }

    await spec.update({ name });
    logger.info(`Animal specification updated: id=${id}`);
  } catch (error) {
    logger.error(`Update animal specification failed: id=${id}`, error);
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
    const spec = await db.AnimalSpecification.findByPk(id);
    if (!spec) {
      throw new Error('规格不存在');
    }

    const orderCount = await db.AnimalOrder.count({ where: { specification_id: id } });
    if (orderCount > 0) {
      throw new Error('该规格存在关联订单，无法删除');
    }

    await spec.destroy();
    logger.info(`Animal specification deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete animal specification failed: id=${id}`, error);
    throw error;
  }
};

// ==================== 需求管理 ====================

/**
 * 获取需求列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getRequirementList = async (params) => {
  try {
    const { page = 1, pageSize = 10, name } = params;
    
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };

    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await db.AnimalRequirement.findAndCountAll({
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
    logger.error('Get animal requirement list failed:', error);
    throw error;
  }
};

/**
 * 创建需求
 * @param {String} name - 需求名称
 * @returns {Promise<Object>}
 */
const createRequirement = async (name) => {
  try {
    const existing = await db.AnimalRequirement.findOne({ where: { name } });
    if (existing) {
      throw new Error('该需求已存在');
    }

    const req = await db.AnimalRequirement.create({ name });
    logger.info(`Animal requirement created: id=${req.id}`);
    return req;
  } catch (error) {
    logger.error('Create animal requirement failed:', error);
    throw error;
  }
};

/**
 * 更新需求
 * @param {Number} id - 需求ID
 * @param {String} name - 需求名称
 * @returns {Promise<void>}
 */
const updateRequirement = async (id, name) => {
  try {
    const req = await db.AnimalRequirement.findByPk(id);
    if (!req) {
      throw new Error('需求不存在');
    }

    const existing = await db.AnimalRequirement.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (existing) {
      throw new Error('该需求名称已存在');
    }

    await req.update({ name });
    logger.info(`Animal requirement updated: id=${id}`);
  } catch (error) {
    logger.error(`Update animal requirement failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除需求
 * @param {Number} id - 需求ID
 * @returns {Promise<void>}
 */
const deleteRequirement = async (id) => {
  try {
    const req = await db.AnimalRequirement.findByPk(id);
    if (!req) {
      throw new Error('需求不存在');
    }

    const orderCount = await db.AnimalOrder.count({ where: { requirement_id: id } });
    if (orderCount > 0) {
      throw new Error('该需求存在关联订单，无法删除');
    }

    await req.destroy();
    logger.info(`Animal requirement deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete animal requirement failed: id=${id}`, error);
    throw error;
  }
};

// ==================== Options 函数 ====================

/**
 * 获取动物品牌选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getBrandOptions = async () => {
  try {
    const brands = await db.AnimalBrand.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    return brands;
  } catch (error) {
    logger.error('Get animal brand options failed:', error);
    throw error;
  }
};

/**
 * 获取动物品种选项列表（用于下拉选择）
 * @param {Number} brandId - 品牌ID（可选）
 * @returns {Promise<Array>}
 */
const getVarietyOptions = async (brandId) => {
  try {
    const where = brandId ? { brand_id: brandId } : {};
    const varieties = await db.AnimalVariety.findAll({
      where,
      attributes: ['id', 'name', 'brand_id'],
      include: [
        { model: db.AnimalBrand, as: 'brand', attributes: ['id', 'name'] }
      ],
      order: [['name', 'ASC']]
    });
    return varieties;
  } catch (error) {
    logger.error('Get animal variety options failed:', error);
    throw error;
  }
};

/**
 * 获取动物规格选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getSpecificationOptions = async () => {
  try {
    const specs = await db.AnimalSpecification.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    return specs;
  } catch (error) {
    logger.error('Get animal specification options failed:', error);
    throw error;
  }
};

/**
 * 获取动物要求选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getRequirementOptions = async () => {
  try {
    const requirements = await db.AnimalRequirement.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    return requirements;
  } catch (error) {
    logger.error('Get animal requirement options failed:', error);
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
  
  // 品系管理
  getVarietyList,
  getVarietyOptions,
  createVariety,
  updateVariety,
  deleteVariety,
  
  // 规格管理
  getSpecificationList,
  getSpecificationOptions,
  createSpecification,
  updateSpecification,
  deleteSpecification,
  
  // 需求管理
  getRequirementList,
  getRequirementOptions,
  createRequirement,
  updateRequirement,
  deleteRequirement
};
