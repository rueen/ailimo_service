/**
 * 管理端其他服务服务
 */
const db = require('../../models');
const logger = require('../../config/logger');
const { Op } = require('sequelize');

/**
 * 获取其他服务列表
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>}
 */
const getOtherServiceList = async (params) => {
  try {
    const { page = 1, pageSize = 10, title, status } = params;
    const where = {};
    
    if (title) {
      where.title = { [Op.like]: `%${title}%` };
    }
    if (status !== undefined) {
      where.status = status;
    }

    const offset = (page - 1) * pageSize;
    const { count, rows } = await db.OtherService.findAndCountAll({
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
    const service = await db.OtherService.findByPk(id);
    if (!service) {
      throw new Error('其他服务不存在');
    }
    return service;
  } catch (error) {
    logger.error(`Get other service detail failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 创建其他服务
 * @param {Object} data - 其他服务数据
 * @returns {Promise<Object>}
 */
const createOtherService = async (data) => {
  try {
    const service = await db.OtherService.create(data);
    logger.info(`Other service created: id=${service.id}`);
    return service;
  } catch (error) {
    logger.error('Create other service failed:', error);
    throw error;
  }
};

/**
 * 更新其他服务
 * @param {Number} id - 其他服务ID
 * @param {Object} data - 更新数据
 * @returns {Promise<void>}
 */
const updateOtherService = async (id, data) => {
  try {
    const service = await db.OtherService.findByPk(id);
    if (!service) {
      throw new Error('其他服务不存在');
    }
    await service.update(data);
    logger.info(`Other service updated: id=${id}`);
  } catch (error) {
    logger.error(`Update other service failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 删除其他服务
 * @param {Number} id - 其他服务ID
 * @returns {Promise<void>}
 */
const deleteOtherService = async (id) => {
  try {
    const service = await db.OtherService.findByPk(id);
    if (!service) {
      throw new Error('其他服务不存在');
    }
    await service.destroy();
    logger.info(`Other service deleted: id=${id}`);
  } catch (error) {
    logger.error(`Delete other service failed: id=${id}`, error);
    throw error;
  }
};

module.exports = {
  getOtherServiceList,
  getOtherServiceDetail,
  createOtherService,
  updateOtherService,
  deleteOtherService
};
