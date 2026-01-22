/**
 * 数据统计服务
 */
const db = require('../../models');
const logger = require('../../config/logger');
const { Op } = require('sequelize');
const moment = require('moment');
const sequelize = require('../../models').sequelize;

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

/**
 * 获取实验代操作详细统计数据
 * @param {String} start_date - 开始日期 (YYYY-MM-DD)
 * @param {String} end_date - 结束日期 (YYYY-MM-DD)
 * @returns {Promise<Object>}
 */
const getExperimentOperationDetailedStatistics = async (start_date, end_date) => {
  try {
    // 1. 生成日期数组
    const dates = [];
    const currentDate = moment(start_date);
    const endMoment = moment(end_date);
    
    while (currentDate.isSameOrBefore(endMoment)) {
      dates.push(currentDate.format('YYYY-MM-DD'));
      currentDate.add(1, 'day');
    }

    // 2. 查询已完成订单的统计数据
    const statistics = await db.ExperimentOperation.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('completed_time')), 'date'],
        'user_id',
        'operation_content_id',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity']
      ],
      where: {
        status: 3, // 已完成
        completed_time: {
          [Op.gte]: start_date + ' 00:00:00',
          [Op.lte]: end_date + ' 23:59:59'
        }
      },
      group: ['date', 'user_id', 'operation_content_id'],
      order: [
        [sequelize.fn('DATE', sequelize.col('completed_time')), 'ASC'],
        ['user_id', 'ASC'],
        ['operation_content_id', 'ASC']
      ],
      raw: true
    });

    // 3. 获取涉及的用户信息
    const userIds = [...new Set(statistics.map(s => s.user_id))];
    let users = [];
    if (userIds.length > 0) {
      users = await db.User.findAll({
        attributes: ['id', 'name'],
        where: {
          id: { [Op.in]: userIds }
        },
        order: [['id', 'ASC']],
        raw: true
      });
    }

    // 4. 获取每个用户涉及的操作类型
    let userOperations = [];
    if (statistics.length > 0) {
      userOperations = await db.ExperimentOperation.findAll({
        attributes: [
          'user_id',
          'operation_content_id'
        ],
        where: {
          status: 3,
          completed_time: {
            [Op.gte]: start_date + ' 00:00:00',
            [Op.lte]: end_date + ' 23:59:59'
          }
        },
        include: [{
          model: db.OperationContent,
          as: 'operation_content',
          attributes: ['id', 'name']
        }],
        group: ['user_id', 'operation_content_id'],
        order: [['user_id', 'ASC'], ['operation_content_id', 'ASC']],
        raw: true
      });
    }

    // 5. 组织用户和操作类型数据
    const usersData = users.map(user => {
      const userOps = userOperations
        .filter(uo => uo.user_id === user.id)
        .map(uo => ({
          id: uo.operation_content_id,
          name: uo['operation_content.name']
        }));
      
      return {
        id: user.id,
        name: user.name,
        operations: userOps
      };
    });

    // 6. 组织统计数据对象
    const data = {};
    statistics.forEach(stat => {
      const key = `${stat.date}_${stat.user_id}_${stat.operation_content_id}`;
      data[key] = parseInt(stat.total_quantity);
    });

    return {
      dates,
      users: usersData,
      data
    };
  } catch (error) {
    logger.error('Get experiment operation detailed statistics failed:', error);
    throw error;
  }
};

module.exports = {
  getOverviewStatistics,
  getExperimentOperationDetailedStatistics
};
