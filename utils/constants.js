/**
 * 系统常量定义
 */

/**
 * 订单来源枚举
 */
const ORDER_SOURCE = {
  USER: 0,      // 用户创建
  ADMIN: 1      // 管理员创建
};

/**
 * 订单来源标签映射
 */
const ORDER_SOURCE_LABEL = {
  0: '用户创建',
  1: '管理员创建'
};

/**
 * 订单状态枚举（通用）
 */
const ORDER_STATUS = {
  PENDING: 0,       // 待审核/待处理
  IN_PROGRESS: 1,   // 进行中
  REJECTED: 2,      // 已拒绝
  COMPLETED: 3,     // 已完成
  CANCELLED: 4      // 已取消
};

/**
 * 订单状态标签映射
 */
const ORDER_STATUS_LABEL = {
  0: '待审核',
  1: '进行中',
  2: '已拒绝',
  3: '已完成',
  4: '已取消'
};

module.exports = {
  ORDER_SOURCE,
  ORDER_SOURCE_LABEL,
  ORDER_STATUS,
  ORDER_STATUS_LABEL
};
