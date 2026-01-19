/**
 * 订单号生成工具
 */
const db = require('../models');

/**
 * 订单类型前缀映射
 */
const ORDER_PREFIX = {
  EQUIPMENT: 'EQ',      // 设备租赁
  CAGE: 'CG',           // 笼位预约
  EXPERIMENT: 'EX',     // 实验代操作
  ANIMAL: 'AN',         // 动物订购
  REAGENT: 'RG',        // 试剂耗材
  USER: 'U'             // 用户编号
};

/**
 * 生成订单号
 * @param {String} prefix - 订单前缀（使用 ORDER_PREFIX 中的常量）
 * @param {Object} transaction - 可选的事务对象
 * @returns {Promise<String>} 订单号，格式：前缀 + 年月日 + 4位序号，如 EQ202601160001
 */
async function generateOrderSn(prefix, transaction = null) {
  // 获取当前日期字符串（YYYYMMDD）
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');
  
  // 构建查询条件
  const pattern = `${prefix}${dateStr}%`;
  
  // 根据不同订单类型查询对应表和字段
  let tableName, fieldName;
  switch (prefix) {
    case ORDER_PREFIX.EQUIPMENT:
      tableName = 'equipment_reservations';
      fieldName = 'order_sn';
      break;
    case ORDER_PREFIX.CAGE:
      tableName = 'cage_reservations';
      fieldName = 'order_sn';
      break;
    case ORDER_PREFIX.EXPERIMENT:
      tableName = 'experiment_operations';
      fieldName = 'order_sn';
      break;
    case ORDER_PREFIX.ANIMAL:
      tableName = 'animal_orders';
      fieldName = 'order_sn';
      break;
    case ORDER_PREFIX.REAGENT:
      tableName = 'reagent_orders';
      fieldName = 'order_sn';
      break;
    case ORDER_PREFIX.USER:
      tableName = 'users';
      fieldName = 'user_no';
      break;
    default:
      throw new Error(`未知的订单类型前缀: ${prefix}`);
  }
  
  try {
    // 查询今日该类型的最大序号（使用 FOR UPDATE 锁定，防止并发问题）
    const [result] = await db.sequelize.query(
      `SELECT COALESCE(MAX(CAST(RIGHT(${fieldName}, 4) AS UNSIGNED)), 0) as max_seq
       FROM ${tableName}
       WHERE ${fieldName} LIKE :pattern
       FOR UPDATE`,
      {
        replacements: { pattern },
        type: db.sequelize.QueryTypes.SELECT,
        transaction
      }
    );
    
    // 生成新的序号（确保转换为数字类型）
    const maxSeq = parseInt(result.max_seq, 10) || 0;
    const nextSeq = maxSeq + 1;
    
    // 生成完整编号：前缀 + 日期 + 序号（4位，不足补0）
    const sn = `${prefix}${dateStr}${nextSeq.toString().padStart(4, '0')}`;
    
    return sn;
  } catch (error) {
    console.error('生成编号失败:', error);
    throw new Error('生成编号失败');
  }
}

/**
 * 生成用户编号（简化调用）
 * @param {Object} transaction - 可选的事务对象
 * @returns {Promise<String>} 用户编号，格式：U + 年月日 + 4位序号，如 U202601160001
 */
async function generateUserNo(transaction = null) {
  return generateOrderSn(ORDER_PREFIX.USER, transaction);
}

module.exports = {
  ORDER_PREFIX,
  generateOrderSn,
  generateUserNo
};
