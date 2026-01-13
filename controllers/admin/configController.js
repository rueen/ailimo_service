/**
 * 管理端系统配置控制器
 */
const configService = require('../../services/admin/configService');
const { response } = require('../../utils');

/**
 * 获取所有系统配置
 */
const getAllConfigs = async (req, res, next) => {
  try {
    const configs = await configService.getAllConfigs();
    return response.success(res, configs);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取单个配置
 */
const getConfig = async (req, res, next) => {
  try {
    const { key } = req.params;
    const config = await configService.getConfig(key);
    return response.success(res, config);
  } catch (err) {
    next(err);
  }
};

/**
 * 更新配置
 */
const updateConfig = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { config_value } = req.body;
    
    if (config_value === undefined || config_value === null) {
      return response.badRequest(res, '配置值不能为空');
    }

    await configService.updateConfig(key, config_value);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取提前预约天数配置
 */
const getAdvanceDaysConfigs = async (req, res, next) => {
  try {
    const configs = await configService.getAdvanceDaysConfigs();
    return response.success(res, configs);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllConfigs,
  getConfig,
  updateConfig,
  getAdvanceDaysConfigs
};
