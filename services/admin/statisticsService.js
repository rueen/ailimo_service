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

    // 2. 查询已完成的订单（获取完整数据，在应用层解析 time_slots）
    const orders = await db.ExperimentOperation.findAll({
      attributes: ['user_id', 'operation_content_id', 'quantity', 'time_slots'],
      where: {
        status: 3 // 已完成
      },
      raw: true
    });

    // 3. 解析 time_slots，按预约日期分组统计
    const statisticsMap = new Map();
    
    orders.forEach(order => {
      const timeSlots = typeof order.time_slots === 'string' 
        ? JSON.parse(order.time_slots) 
        : order.time_slots;
      
      // 从每个时间段中提取日期
      const reservationDates = new Set();
      timeSlots.forEach(slot => {
        // 格式：["2026-01-22 09:00-12:00"]
        const date = slot.split(' ')[0]; // 提取日期部分
        
        // 只统计在查询范围内的日期
        if (date >= start_date && date <= end_date) {
          reservationDates.add(date);
        }
      });
      
      // 对每个预约日期累加数量
      reservationDates.forEach(date => {
        const key = `${date}_${order.user_id}_${order.operation_content_id}`;
        const currentQuantity = statisticsMap.get(key) || 0;
        statisticsMap.set(key, currentQuantity + order.quantity);
      });
    });

    // 4. 提取涉及的用户ID和操作类型ID
    const userIds = new Set();
    const userOperationMap = new Map(); // 存储每个用户涉及的操作类型
    
    statisticsMap.forEach((quantity, key) => {
      const [date, userId, operationContentId] = key.split('_');
      userIds.add(parseInt(userId));
      
      if (!userOperationMap.has(userId)) {
        userOperationMap.set(userId, new Set());
      }
      userOperationMap.get(userId).add(operationContentId);
    });

    // 5. 查询用户信息（包含组织、学院、课题组等关联信息）
    let users = [];
    if (userIds.size > 0) {
      users = await db.User.findAll({
        attributes: [
          'id', 
          'name', 
          'user_no',
          'phone',
          'organization_id',
          'department_id',
          'research_group_id',
          'user_input_organization_name',
          'user_input_department_name',
          'user_input_research_group_name'
        ],
        where: {
          id: { [Op.in]: Array.from(userIds) }
        },
        include: [
          {
            model: db.Organization,
            as: 'organization',
            attributes: ['id', 'name'],
            required: false
          },
          {
            model: db.Department,
            as: 'department',
            attributes: ['id', 'name'],
            required: false
          },
          {
            model: db.ResearchGroup,
            as: 'research_group',
            attributes: ['id', 'name'],
            required: false
          }
        ],
        order: [['id', 'ASC']]
      });
    }

    // 6. 查询操作类型信息
    const operationContentIds = new Set();
    userOperationMap.forEach(ops => {
      ops.forEach(id => operationContentIds.add(id));
    });
    
    let operationContents = [];
    if (operationContentIds.size > 0) {
      operationContents = await db.OperationContent.findAll({
        attributes: ['id', 'name'],
        where: {
          id: { [Op.in]: Array.from(operationContentIds) }
        },
        raw: true
      });
    }
    
    const operationContentMap = new Map();
    operationContents.forEach(oc => {
      operationContentMap.set(String(oc.id), oc.name);
    });

    // 7. 组织用户和操作类型数据
    const usersData = users.map(user => {
      const userOpsIds = userOperationMap.get(String(user.id)) || new Set();
      const operations = Array.from(userOpsIds).map(opId => ({
        id: parseInt(opId),
        name: operationContentMap.get(opId) || ''
      })).sort((a, b) => a.id - b.id);
      
      return {
        id: user.id,
        name: user.name,
        user_no: user.user_no,
        phone: user.phone,
        organization: user.organization ? {
          id: user.organization.id,
          name: user.organization.name
        } : (user.user_input_organization_name ? {
          id: null,
          name: user.user_input_organization_name
        } : null),
        department: user.department ? {
          id: user.department.id,
          name: user.department.name
        } : (user.user_input_department_name ? {
          id: null,
          name: user.user_input_department_name
        } : null),
        research_group: user.research_group ? {
          id: user.research_group.id,
          name: user.research_group.name
        } : (user.user_input_research_group_name ? {
          id: null,
          name: user.user_input_research_group_name
        } : null),
        operations
      };
    });

    // 8. 组织统计数据对象
    const data = {};
    statisticsMap.forEach((quantity, key) => {
      data[key] = quantity;
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
