/**
 * 微信控制器（H5端）
 * 
 * @description 处理微信相关接口
 */
const { response } = require('../../utils');
const { getJssdkConfig } = require('../../utils/wechat');
const logger = require('../../config/logger');

/**
 * 获取微信 JSSDK 配置
 * 
 * @route GET /api/h5/wechat-js-config
 * @param {Object} req.query.url - 当前页面完整 URL
 */
exports.getWechatJsConfig = async (req, res, next) => {
  try {
    let { url } = req.query;

    // 验证 URL 参数
    if (!url) {
      return response.error(res, '缺少 url 参数', 400);
    }

    // URL 可能被编码，需要解码
    // 例如: https:%2F%2Fwww.ailimolab.com%2F -> https://www.ailimolab.com/
    try {
      url = decodeURIComponent(url);
    } catch (decodeError) {
      // 如果解码失败，使用原始 URL
      logger.warn('URL 解码失败，使用原始 URL:', decodeError.message);
    }

    // 验证 URL 格式
    try {
      new URL(url);
    } catch (error) {
      logger.error('URL 格式不正确:', { url, error: error.message });
      return response.error(res, 'URL 格式不正确', 400);
    }

    // 获取微信配置
    const config = await getJssdkConfig(url);

    logger.info('获取微信 JSSDK 配置成功', {
      url,
      appId: config.appId
    });

    return response.success(res, config, '获取配置成功');
  } catch (error) {
    logger.error('获取微信 JSSDK 配置失败:', {
      error: error.message,
      stack: error.stack,
      url: req.query.url
    });
    return response.error(res, '获取微信配置失败', 500);
  }
};
