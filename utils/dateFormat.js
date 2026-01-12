/**
 * 日期格式化工具
 */
const moment = require('moment');

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm:ss
 * @param {Date|String} date - 日期对象或日期字符串
 * @returns {String|null}
 */
const formatDateTime = (date) => {
  if (!date) return null;
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date|String} date - 日期对象或日期字符串
 * @returns {String|null}
 */
const formatDate = (date) => {
  if (!date) return null;
  return moment(date).format('YYYY-MM-DD');
};

/**
 * 格式化时间段显示格式（HH:mm-HH:mm）
 * @param {String} startTime - 开始时间（HH:mm:ss 或 HH:mm）
 * @param {String} endTime - 结束时间（HH:mm:ss 或 HH:mm）
 * @returns {String}
 */
const formatTimeSlot = (startTime, endTime) => {
  if (!startTime || !endTime) return '';
  // 提取小时和分钟（去掉秒）
  const start = startTime.substring(0, 5);
  const end = endTime.substring(0, 5);
  // 去掉小时部分的前导零（9:00 而不是 09:00），但保留分钟部分
  const startFormatted = start.replace(/^0(\d:)/, '$1');
  const endFormatted = end.replace(/^0(\d:)/, '$1');
  return `${startFormatted}-${endFormatted}`;
};

/**
 * 判断是否为日期字符串（ISO格式或类似格式）
 * @param {*} value - 值
 * @returns {Boolean}
 */
const isDateString = (value) => {
  if (typeof value !== 'string') return false;
  // 匹配 ISO 格式：2026-01-11T12:11:51.000Z 或 2026-01-11 12:11:51 等
  return /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(value);
};

/**
 * 递归格式化对象中的日期字段
 * @param {*} data - 需要格式化的数据（可以是对象、数组、基本类型）
 * @returns {*}
 */
const formatDatesInObject = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  // 如果是日期对象，直接格式化
  if (data instanceof Date) {
    return formatDateTime(data);
  }

  // 如果是数组，递归处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => formatDatesInObject(item));
  }

  // 如果是对象，递归处理每个属性
  if (typeof data === 'object') {
    // Sequelize 模型实例，转换为普通对象
    if (data.dataValues) {
      data = data.dataValues;
    }
    
    const formatted = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        
        // 跳过 Sequelize 内部属性
        if (key.startsWith('_') || key === 'isNewRecord') {
          continue;
        }
        
        // 检查是否是日期字段（常见的日期字段名）
        if (key.match(/(_at|_time|Date|Time)$/i)) {
          if (value instanceof Date) {
            formatted[key] = formatDateTime(value);
          } else if (isDateString(value)) {
            formatted[key] = formatDateTime(value);
          } else {
            formatted[key] = formatDatesInObject(value);
          }
        } else {
          formatted[key] = formatDatesInObject(value);
        }
      }
    }
    return formatted;
  }

  // 其他类型直接返回
  return data;
};

module.exports = {
  formatDateTime,
  formatDate,
  formatTimeSlot,
  formatDatesInObject
};
