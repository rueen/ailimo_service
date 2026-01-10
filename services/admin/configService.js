/**
 * 管理端系统配置服务
 */
const db = require('../../models');
const logger = require('../../config/logger');

/**
 * 获取所有系统配置
 * @returns {Promise<Array>}
 */
const getAllConfigs = async () => {
  try {
    return await db.SystemConfig.findAll({
      order: [['key', 'ASC']]
    });
  } catch (error) {
    logger.error('Get all configs failed:', error);
    throw error;
  }
};

/**
 * 获取单个配置
 * @param {String} key - 配置键
 * @returns {Promise<Object>}
 */
const getConfig = async (key) => {
  try {
    const config = await db.SystemConfig.findOne({ where: { key } });
    if (!config) {
      throw new Error('配置项不存在');
    }
    return config;
  } catch (error) {
    logger.error(`Get config failed: key=${key}`, error);
    throw error;
  }
};

/**
 * 更新配置
 * @param {String} key - 配置键
 * @param {String} value - 配置值
 * @returns {Promise<void>}
 */
const updateConfig = async (key, value) => {
  try {
    const config = await db.SystemConfig.findOne({ where: { key } });
    if (!config) {
      throw new Error('配置项不存在');
    }

    await config.update({ value });
    logger.info(`Config updated: key=${key}, value=${value}`);
  } catch (error) {
    logger.error(`Update config failed: key=${key}`, error);
    throw error;
  }
};

/**
 * 获取提前预约天数配置
 * @returns {Promise<Object>}
 */
const getAdvanceDaysConfigs = async () => {
  try {
    const configs = await db.SystemConfig.findAll({
      where: {
        key: ['equipment_advance_days', 'cage_advance_days', 'experiment_advance_days']
      }
    });

    const result = {};
    configs.forEach(config => {
      result[config.key] = parseInt(config.value) || 7;
    });

    return {
      equipment_advance_days: result.equipment_advance_days || 7,
      cage_advance_days: result.cage_advance_days || 7,
      experiment_advance_days: result.experiment_advance_days || 7
    };
  } catch (error) {
    logger.error('Get advance days configs failed:', error);
    throw error;
  }
};

module.exports = {
  getAllConfigs,
  getConfig,
  updateConfig,
  getAdvanceDaysConfigs
};
