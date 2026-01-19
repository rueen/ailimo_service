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

module.exports = {
  getOverviewStatistics
};
