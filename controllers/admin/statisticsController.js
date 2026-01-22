/**
 * 数据统计控制器
 */
const statisticsService = require('../../services/admin/statisticsService');
const { response } = require('../../utils');

/**
 * 获取综合统计数据
 */
const getOverviewStatistics = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const data = await statisticsService.getOverviewStatistics({
      start_date,
      end_date
    });
    
    return response.success(res, data);
  } catch (error) {
    return response.error(res, error.message);
  }
};

/**
 * 获取实验代操作详细统计数据
 */
const getExperimentOperationStatistics = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    // 参数验证
    if (!start_date || !end_date) {
      return response.badRequest(res, '开始日期和结束日期不能为空');
    }

    // 日期格式验证
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
      return response.badRequest(res, '日期格式不正确，请使用 YYYY-MM-DD 格式');
    }

    // 日期范围验证
    if (start_date > end_date) {
      return response.badRequest(res, '开始日期不能晚于结束日期');
    }

    const data = await statisticsService.getExperimentOperationDetailedStatistics(
      start_date,
      end_date
    );

    // 如果没有数据，返回友好提示（但仍保持数据结构）
    if (!data || (data.users && data.users.length === 0 && Object.keys(data.data || {}).length === 0)) {
      return response.success(res, data, '暂无数据');
    }

    return response.success(res, data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewStatistics,
  getExperimentOperationStatistics
};
