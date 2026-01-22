/**
 * H5端其他服务服务
 */
const db = require('../../models');
const logger = require('../../config/logger');

/**
 * 获取其他服务列表（仅返回已启用的）
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getOtherServiceList = async (params) => {
  try {
    const { page = 1, pageSize = 10 } = params;
    
    const where = {
      status: 1  // 仅返回已启用的
    };

    const offset = (page - 1) * pageSize;
    const { count, rows } = await db.OtherService.findAndCountAll({
      where,
      attributes: ['id', 'title', 'content', 'created_at', 'updated_at'],
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
    logger.error('Get other service list failed:', error);
    throw error;
  }
};

/**
 * 获取其他服务详情
 * @param {Number} id - 其他服务ID
 * @returns {Promise<Object>}
 */
const getOtherServiceDetail = async (id) => {
  try {
    const service = await db.OtherService.findOne({
      where: {
        id,
        status: 1  // 仅返回已启用的
      },
      attributes: ['id', 'title', 'content', 'created_at', 'updated_at']
    });
    
    if (!service) {
      throw new Error('其他服务不存在或已禁用');
    }
    
    return service;
  } catch (error) {
    logger.error(`Get other service detail failed: id=${id}`, error);
    throw error;
  }
};

module.exports = {
  getOtherServiceList,
  getOtherServiceDetail
};
