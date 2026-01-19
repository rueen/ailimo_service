/**
 * 管理端内容管理服务
 * 包括：案例管理、公司信息、负责人、环境类型、动物类型、统计
 */
const db = require('../../models');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

// ==================== 案例管理 ====================

/**
 * 获取案例列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getCaseList = async (params) => {
  try {
    const { page = 1, pageSize = 10, project_name, status } = params;
    const where = {};
    if (project_name) where.project_name = { [Op.like]: `%${project_name}%` };
    if (status !== undefined) where.status = status;

    const offset = (page - 1) * pageSize;
    const { count, rows } = await db.Case.findAndCountAll({
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
    const caseItem = await db.Case.findByPk(id);
    if (!caseItem) {
      throw new Error('案例不存在');
    }
    return caseItem;
  } catch (error) {
    logger.error(`Get case detail failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 创建案例
 * @param {Object} data - 案例数据
 * @returns {Promise<Object>}
 */
const createCase = async (data) => {
  try {
    const caseItem = await db.Case.create(data);
    logger.info(`Case created: id=${caseItem.id}`);
    return caseItem;
  } catch (error) {
    logger.error('Create case failed:', error);
    throw error;
  }
};

/**
 * 更新案例
 * @param {Number} id - 案例ID
 * @param {Object} data - 更新数据
 * @returns {Promise<void>}
 */
const updateCase = async (id, data) => {
  try {
    const caseItem = await db.Case.findByPk(id);
    if (!caseItem) {
      throw new Error('案例不存在');
    }
    await caseItem.update(data);
    logger.info(`Case updated: id=${id}`);
  } catch (error) {
    logger.error(`Update case failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除案例
 * @param {Number} id - 案例ID
 * @returns {Promise<void>}
 */
const deleteCase = async (id) => {
  try {
    const caseItem = await db.Case.findByPk(id);
    if (!caseItem) {
      throw new Error('案例不存在');
    }
    await caseItem.destroy();
    logger.info(`Case deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete case failed: id=${id}`, error);
    throw error;
  }
};

// ==================== 公司信息管理 ====================

/**
 * 获取公司信息
 * @returns {Promise<Object>}
 */
const getCompanyInfo = async () => {
  try {
    let info = await db.CompanyInfo.findByPk(1);
    if (!info) {
      // 如果不存在，创建默认记录
      info = await db.CompanyInfo.create({ 
        id: 1,
        content: {
          company_name: '',
          company_address: '',
          contact_phone: '',
          email: '',
          work_time: '',
          company_intro: '',
          service_concept: '',
          banner_image: [],
          video_url: ''
        }
      });
    }
    // 返回 content 内容
    return info.content || {};
  } catch (error) {
    logger.error('Get company info failed:', error);
    throw error;
  }
};

/**
 * 更新公司信息
 * @param {Object} data - 更新数据（JSON 对象）
 * @returns {Promise<Object>}
 */
const updateCompanyInfo = async (data) => {
  try {
    let info = await db.CompanyInfo.findByPk(1);
    if (!info) {
      // 如果不存在，创建新记录
      info = await db.CompanyInfo.create({ 
        id: 1,
        content: data
      });
    } else {
      // 更新 content 字段
      await info.update({ content: data });
    }
    logger.info('Company info updated');
    // 返回更新后的 content
    return info.content;
  } catch (error) {
    logger.error('Update company info failed:', error);
    throw error;
  }
};

// ==================== 负责人管理 ====================

/**
 * 获取负责人列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getHandlerList = async (params) => {
  try {
    const { page = 1, pageSize = 10, name } = params;
    const where = {};
    if (name) where.name = { [Op.like]: `%${name}%` };

    const offset = (page - 1) * pageSize;
    const { count, rows } = await db.Handler.findAndCountAll({
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
  } catch (error) {
    logger.error('Get handler list failed:', error);
    throw error;
  }
};

/**
 * 获取所有负责人（不分页）
 * @returns {Promise<Array>}
 */
const getAllHandlers = async () => {
  try {
    return await db.Handler.findAll({
      order: [['name', 'ASC']]
    });
  } catch (error) {
    logger.error('Get all handlers failed:', error);
    throw error;
  }
};

/**
 * 创建负责人
 * @param {String} name - 负责人姓名
 * @returns {Promise<Object>}
 */
const createHandler = async (name) => {
  try {
    const existing = await db.Handler.findOne({ where: { name } });
    if (existing) {
      throw new Error('该负责人已存在');
    }

    const handler = await db.Handler.create({ name });
    logger.info(`Handler created: id=${handler.id}, name=${name}`);
    return handler;
  } catch (error) {
    logger.error('Create handler failed:', error);
    throw error;
  }
};

/**
 * 更新负责人
 * @param {Number} id - 负责人ID
 * @param {String} name - 负责人姓名
 * @returns {Promise<void>}
 */
const updateHandler = async (id, name) => {
  try {
    const handler = await db.Handler.findByPk(id);
    if (!handler) {
      throw new Error('负责人不存在');
    }

    const existing = await db.Handler.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (existing) {
      throw new Error('该负责人姓名已存在');
    }

    await handler.update({ name });
    logger.info(`Handler updated: id=${id}`);
  } catch (error) {
    logger.error(`Update handler failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除负责人
 * @param {Number} id - 负责人ID
 * @returns {Promise<void>}
 */
const deleteHandler = async (id) => {
  try {
    const handler = await db.Handler.findByPk(id);
    if (!handler) {
      throw new Error('负责人不存在');
    }

    // 检查各业务模块是否有关联
    const equipmentCount = await db.EquipmentReservation.count({ where: { handler_id: id } });
    const cageCount = await db.CageReservation.count({ where: { handler_id: id } });
    const experimentCount = await db.ExperimentOperation.count({ where: { handler_id: id } });
    const animalCount = await db.AnimalOrder.count({ where: { handler_id: id } });
    const reagentCount = await db.ReagentOrder.count({ where: { handler_id: id } });

    if (equipmentCount + cageCount + experimentCount + animalCount + reagentCount > 0) {
      throw new Error('该负责人存在关联订单，无法删除');
    }

    await handler.destroy();
    logger.info(`Handler deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete handler failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 获取负责人选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getHandlerOptions = async () => {
  try {
    const handlers = await db.Handler.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    return handlers;
  } catch (error) {
    logger.error('Get handler options failed:', error);
    throw error;
  }
};

/**
 * 获取负责人完成订单统计
 * @param {Number} handler_id - 负责人ID（可选）
 * @returns {Promise<Array>}
 */
const getHandlerStatistics = async (params = {}) => {
  try {
    const { handler_id, page = 1, page_size = 10, start_date, end_date } = params;
    
    // 如果指定了负责人ID，直接查询该负责人
    if (handler_id) {
      const handler = await db.Handler.findByPk(handler_id);
      if (!handler) {
        return {
          list: [],
          total: 0,
          page: parseInt(page),
          page_size: parseInt(page_size),
          total_pages: 0
        };
      }
      
      const stat = await calculateHandlerStatistics(handler, start_date, end_date);
      return {
        list: [stat],
        total: 1,
        page: 1,
        page_size: 1,
        total_pages: 1
      };
    }

    // 否则分页查询所有负责人
    const offset = (page - 1) * page_size;
    const { count, rows } = await db.Handler.findAndCountAll({
      limit: parseInt(page_size),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    if (count === 0) {
      return {
        list: [],
        total: 0,
        page: parseInt(page),
        page_size: parseInt(page_size),
        total_pages: 0
      };
    }

    const statistics = [];
    for (const handler of rows) {
      const stat = await calculateHandlerStatistics(handler, start_date, end_date);
      statistics.push(stat);
    }

    return {
      list: statistics,
      total: count,
      page: parseInt(page),
      page_size: parseInt(page_size),
      total_pages: Math.ceil(count / page_size)
    };
  } catch (error) {
    logger.error('Get handler statistics failed:', error);
    throw error;
  }
};

/**
 * 计算单个负责人的统计数据
 * @param {Object} handler - 负责人对象
 * @param {String} start_date - 开始日期（可选）
 * @param {String} end_date - 结束日期（可选）
 * @returns {Promise<Object>}
 */
const calculateHandlerStatistics = async (handler, start_date, end_date) => {
  const { Op } = require('sequelize');
  
  // 构建日期范围条件
  const dateWhere = {};
  if (start_date || end_date) {
    dateWhere.created_at = {};
    if (start_date) dateWhere.created_at[Op.gte] = start_date;
    if (end_date) dateWhere.created_at[Op.lte] = end_date;
  }

  // 设备预约统计
  const equipmentCompleted = await db.EquipmentReservation.count({
    where: { handler_id: handler.id, status: 3, ...dateWhere }
  });
  const equipmentInProgress = await db.EquipmentReservation.count({
    where: { handler_id: handler.id, status: 1, ...dateWhere }
  });

  // 笼位预约统计
  const cageCompleted = await db.CageReservation.count({
    where: { handler_id: handler.id, status: 3, ...dateWhere }
  });
  const cageInProgress = await db.CageReservation.count({
    where: { handler_id: handler.id, status: 1, ...dateWhere }
  });

  // 实验代操作统计
  const experimentCompleted = await db.ExperimentOperation.count({
    where: { handler_id: handler.id, status: 3, ...dateWhere }
  });
  const experimentInProgress = await db.ExperimentOperation.count({
    where: { handler_id: handler.id, status: 1, ...dateWhere }
  });

  // 动物订购统计
  const animalCompleted = await db.AnimalOrder.count({
    where: { handler_id: handler.id, status: 3, ...dateWhere }
  });
  const animalInProgress = await db.AnimalOrder.count({
    where: { handler_id: handler.id, status: 1, ...dateWhere }
  });

  // 试剂耗材订购统计
  const reagentCompleted = await db.ReagentOrder.count({
    where: { handler_id: handler.id, status: 3, ...dateWhere }
  });
  const reagentInProgress = await db.ReagentOrder.count({
    where: { handler_id: handler.id, status: 1, ...dateWhere }
  });

  return {
    handler_id: handler.id,
    handler_name: handler.name,
    equipment: {
      completed: equipmentCompleted,
      in_progress: equipmentInProgress
    },
    cage: {
      completed: cageCompleted,
      in_progress: cageInProgress
    },
    experiment: {
      completed: experimentCompleted,
      in_progress: experimentInProgress
    },
    animal: {
      completed: animalCompleted,
      in_progress: animalInProgress
    },
    reagent: {
      completed: reagentCompleted,
      in_progress: reagentInProgress
    },
    total: {
      completed: equipmentCompleted + cageCompleted + experimentCompleted + 
                 animalCompleted + reagentCompleted,
      in_progress: equipmentInProgress + cageInProgress + experimentInProgress + 
                   animalInProgress + reagentInProgress
    }
  };
};

// ==================== 环境类型管理 ====================

/**
 * 获取环境类型列表（分页）
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getEnvironmentTypeList = async (params = {}) => {
  try {
    const { page = 1, pageSize = 10, name } = params;
    
    const where = {};
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    const offset = (page - 1) * pageSize;
    const { count, rows } = await db.EnvironmentType.findAndCountAll({
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
  } catch (error) {
    logger.error('Get environment type list failed:', error);
    throw error;
  }
};

/**
 * 创建环境类型
 * @param {String} name - 类型名称
 * @returns {Promise<Object>}
 */
const createEnvironmentType = async (name) => {
  try {
    const existing = await db.EnvironmentType.findOne({ where: { name } });
    if (existing) {
      throw new Error('该环境类型已存在');
    }

    const type = await db.EnvironmentType.create({ name });
    logger.info(`Environment type created: id=${type.id}, name=${name}`);
    return type;
  } catch (error) {
    logger.error('Create environment type failed:', error);
    throw error;
  }
};

/**
 * 更新环境类型
 * @param {Number} id - 类型ID
 * @param {String} name - 类型名称
 * @returns {Promise<void>}
 */
const updateEnvironmentType = async (id, name) => {
  try {
    const type = await db.EnvironmentType.findByPk(id);
    if (!type) {
      throw new Error('环境类型不存在');
    }

    const existing = await db.EnvironmentType.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (existing) {
      throw new Error('该环境类型名称已存在');
    }

    await type.update({ name });
    logger.info(`Environment type updated: id=${id}`);
  } catch (error) {
    logger.error(`Update environment type failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除环境类型
 * @param {Number} id - 类型ID
 * @returns {Promise<void>}
 */
const deleteEnvironmentType = async (id) => {
  try {
    const type = await db.EnvironmentType.findByPk(id);
    if (!type) {
      throw new Error('环境类型不存在');
    }

    // 检查是否有关联数据
    const cageCount = await db.Cage.count({ where: { environment_id: id } });
    if (cageCount > 0) {
      throw new Error('该环境类型存在关联笼位，无法删除');
    }

    await type.destroy();
    logger.info(`Environment type deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete environment type failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 获取环境类型选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getEnvironmentTypeOptions = async () => {
  try {
    const types = await db.EnvironmentType.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    return types;
  } catch (error) {
    logger.error('Get environment type options failed:', error);
    throw error;
  }
};

// ==================== 动物类型管理 ====================

/**
 * 获取动物类型列表（分页）
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getAnimalTypeList = async (params = {}) => {
  try {
    const { page = 1, pageSize = 10, name } = params;
    
    const where = {};
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    const offset = (page - 1) * pageSize;
    const { count, rows } = await db.AnimalType.findAndCountAll({
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
  } catch (error) {
    logger.error('Get animal type list failed:', error);
    throw error;
  }
};

/**
 * 创建动物类型
 * @param {String} name - 类型名称
 * @returns {Promise<Object>}
 */
const createAnimalType = async (name) => {
  try {
    const existing = await db.AnimalType.findOne({ where: { name } });
    if (existing) {
      throw new Error('该动物类型已存在');
    }

    const type = await db.AnimalType.create({ name });
    logger.info(`Animal type created: id=${type.id}, name=${name}`);
    return type;
  } catch (error) {
    logger.error('Create animal type failed:', error);
    throw error;
  }
};

/**
 * 更新动物类型
 * @param {Number} id - 类型ID
 * @param {String} name - 类型名称
 * @returns {Promise<void>}
 */
const updateAnimalType = async (id, name) => {
  try {
    const type = await db.AnimalType.findByPk(id);
    if (!type) {
      throw new Error('动物类型不存在');
    }

    const existing = await db.AnimalType.findOne({ 
      where: { 
        name,
        id: { [Op.ne]: id }
      } 
    });
    if (existing) {
      throw new Error('该动物类型名称已存在');
    }

    await type.update({ name });
    logger.info(`Animal type updated: id=${id}`);
  } catch (error) {
    logger.error(`Update animal type failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除动物类型
 * @param {Number} id - 类型ID
 * @returns {Promise<void>}
 */
const deleteAnimalType = async (id) => {
  try {
    const type = await db.AnimalType.findByPk(id);
    if (!type) {
      throw new Error('动物类型不存在');
    }

    // 检查是否有关联数据
    const cageCount = await db.Cage.count({ where: { animal_type_id: id } });
    if (cageCount > 0) {
      throw new Error('该动物类型存在关联笼位，无法删除');
    }

    await type.destroy();
    logger.info(`Animal type deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete animal type failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 获取动物类型选项列表（用于下拉选择）
 * @returns {Promise<Array>}
 */
const getAnimalTypeOptions = async () => {
  try {
    const types = await db.AnimalType.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    return types;
  } catch (error) {
    logger.error('Get animal type options failed:', error);
    throw error;
  }
};

module.exports = {
  // 案例管理
  getCaseList,
  getCaseDetail,
  createCase,
  updateCase,
  deleteCase,
  
  // 公司信息
  getCompanyInfo,
  updateCompanyInfo,
  
  // 负责人管理
  getHandlerList,
  getAllHandlers,
  createHandler,
  updateHandler,
  deleteHandler,
  getHandlerOptions,
  getHandlerStatistics,
  
  // 环境类型管理
  getEnvironmentTypeList,
  createEnvironmentType,
  updateEnvironmentType,
  deleteEnvironmentType,
  getEnvironmentTypeOptions,
  
  // 动物类型管理
  getAnimalTypeList,
  createAnimalType,
  updateAnimalType,
  deleteAnimalType,
  getAnimalTypeOptions
};
