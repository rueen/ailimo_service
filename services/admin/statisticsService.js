/**
 * 数据统计服务
 */
const db = require('../../models');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

/**
 * 获取综合统计数据
 * @param {Object} params - 查询参数
 * @param {String} params.start_date - 开始日期
 * @param {String} params.end_date - 结束日期
 * @returns {Promise<Object>}
 */
const getOverviewStatistics = async (params = {}) => {
  try {
    const { start_date, end_date } = params;
    
    // 构建日期范围条件
    const dateWhere = {};
    if (start_date || end_date) {
      dateWhere.created_at = {};
      if (start_date) dateWhere.created_at[Op.gte] = start_date;
      if (end_date) dateWhere.created_at[Op.lte] = end_date;
    }

    // 用户统计
    const users = await getUserStatistics(dateWhere);
    
    // 设备预约统计
    const equipment_reservations = await getEquipmentReservationStatistics(dateWhere);
    
    // 笼位预约统计
    const cage_reservations = await getCageReservationStatistics(dateWhere);
    
    // 实验代操作统计
    const experiment_operations = await getExperimentOperationStatistics(dateWhere);
    
    // 动物订购统计
    const animal_orders = await getAnimalOrderStatistics(dateWhere);
    
    // 试剂耗材订购统计
    const reagent_orders = await getReagentOrderStatistics(dateWhere);

    return {
      users,
      equipment_reservations,
      cage_reservations,
      experiment_operations,
      animal_orders,
      reagent_orders
    };
  } catch (error) {
    logger.error('Get overview statistics failed:', error);
    throw error;
  }
};

/**
 * 获取用户统计数据
 * @param {Object} dateWhere - 日期条件
 * @returns {Promise<Object>}
 */
const getUserStatistics = async (dateWhere) => {
  const total = await db.User.count({ where: dateWhere });
  const pending = await db.User.count({ 
    where: { ...dateWhere, audit_status: 0 } 
  });
  const approved = await db.User.count({ 
    where: { ...dateWhere, audit_status: 1 } 
  });
  const rejected = await db.User.count({ 
    where: { ...dateWhere, audit_status: 2 } 
  });
  
  return { total, pending, approved, rejected };
};

/**
 * 获取设备预约统计数据
 * @param {Object} dateWhere - 日期条件
 * @returns {Promise<Object>}
 */
const getEquipmentReservationStatistics = async (dateWhere) => {
  const total = await db.EquipmentReservation.count({ where: dateWhere });
  const pending = await db.EquipmentReservation.count({ 
    where: { ...dateWhere, status: 0 } 
  });
  const in_progress = await db.EquipmentReservation.count({ 
    where: { ...dateWhere, status: 1 } 
  });
  const completed = await db.EquipmentReservation.count({ 
    where: { ...dateWhere, status: 3 } 
  });
  const rejected = await db.EquipmentReservation.count({ 
    where: { ...dateWhere, status: 2 } 
  });
  const cancelled = await db.EquipmentReservation.count({ 
    where: { ...dateWhere, status: 4 } 
  });
  
  return { total, pending, in_progress, completed, rejected, cancelled };
};

/**
 * 获取笼位预约统计数据
 * @param {Object} dateWhere - 日期条件
 * @returns {Promise<Object>}
 */
const getCageReservationStatistics = async (dateWhere) => {
  const total = await db.CageReservation.count({ where: dateWhere });
  const pending = await db.CageReservation.count({ 
    where: { ...dateWhere, status: 0 } 
  });
  const in_progress = await db.CageReservation.count({ 
    where: { ...dateWhere, status: 1 } 
  });
  const completed = await db.CageReservation.count({ 
    where: { ...dateWhere, status: 3 } 
  });
  const rejected = await db.CageReservation.count({ 
    where: { ...dateWhere, status: 2 } 
  });
  const cancelled = await db.CageReservation.count({ 
    where: { ...dateWhere, status: 4 } 
  });
  
  return { total, pending, in_progress, completed, rejected, cancelled };
};

/**
 * 获取实验代操作统计数据
 * @param {Object} dateWhere - 日期条件
 * @returns {Promise<Object>}
 */
const getExperimentOperationStatistics = async (dateWhere) => {
  const total = await db.ExperimentOperation.count({ where: dateWhere });
  const pending = await db.ExperimentOperation.count({ 
    where: { ...dateWhere, status: 0 } 
  });
  const in_progress = await db.ExperimentOperation.count({ 
    where: { ...dateWhere, status: 1 } 
  });
  const completed = await db.ExperimentOperation.count({ 
    where: { ...dateWhere, status: 3 } 
  });
  const rejected = await db.ExperimentOperation.count({ 
    where: { ...dateWhere, status: 2 } 
  });
  const cancelled = await db.ExperimentOperation.count({ 
    where: { ...dateWhere, status: 4 } 
  });
  
  return { total, pending, in_progress, completed, rejected, cancelled };
};

/**
 * 获取动物订购统计数据
 * @param {Object} dateWhere - 日期条件
 * @returns {Promise<Object>}
 */
const getAnimalOrderStatistics = async (dateWhere) => {
  const total = await db.AnimalOrder.count({ where: dateWhere });
  const pending = await db.AnimalOrder.count({ 
    where: { ...dateWhere, status: 0 } 
  });
  const in_progress = await db.AnimalOrder.count({ 
    where: { ...dateWhere, status: 1 } 
  });
  const completed = await db.AnimalOrder.count({ 
    where: { ...dateWhere, status: 3 } 
  });
  const rejected = await db.AnimalOrder.count({ 
    where: { ...dateWhere, status: 2 } 
  });
  const cancelled = await db.AnimalOrder.count({ 
    where: { ...dateWhere, status: 4 } 
  });
  
  return { total, pending, in_progress, completed, rejected, cancelled };
};

/**
 * 获取试剂耗材订购统计数据
 * @param {Object} dateWhere - 日期条件
 * @returns {Promise<Object>}
 */
const getReagentOrderStatistics = async (dateWhere) => {
  const total = await db.ReagentOrder.count({ where: dateWhere });
  const pending = await db.ReagentOrder.count({ 
    where: { ...dateWhere, status: 0 } 
  });
  const in_progress = await db.ReagentOrder.count({ 
    where: { ...dateWhere, status: 1 } 
  });
  const completed = await db.ReagentOrder.count({ 
    where: { ...dateWhere, status: 3 } 
  });
  const rejected = await db.ReagentOrder.count({ 
    where: { ...dateWhere, status: 2 } 
  });
  const cancelled = await db.ReagentOrder.count({ 
    where: { ...dateWhere, status: 4 } 
  });
  
  return { total, pending, in_progress, completed, rejected, cancelled };
};

module.exports = {
  getOverviewStatistics
};
