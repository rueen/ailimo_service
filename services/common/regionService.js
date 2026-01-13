/**
 * 地区服务（公共）
 */
const db = require('../../models');
const logger = require('../../config/logger');

/**
 * 获取地区列表
 * @param {Object} params - 查询参数
 * @param {Number} params.parent_id - 父级ID
 * @param {Number} params.level - 地区层级
 * @returns {Promise<Array>}
 */
const getRegionList = async (params = {}) => {
  try {
    const { parent_id, level } = params;
    const where = { status: 1 };

    // 如果指定了父级ID
    if (parent_id !== undefined) {
      where.parent_id = parseInt(parent_id);
    } else if (level !== undefined) {
      // 如果指定了层级但没指定父级ID
      where.level = parseInt(level);
      // 如果查询省级（level=1），默认parent_id=0
      if (parseInt(level) === 1) {
        where.parent_id = 0;
      }
    } else {
      // 默认返回省级列表
      where.level = 1;
      where.parent_id = 0;
    }

    const regions = await db.Region.findAll({
      where,
      attributes: ['id', 'name', 'code', 'parent_id', 'level', 'sort_order'],
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });

    return regions;
  } catch (error) {
    logger.error('Get region list failed:', error);
    throw error;
  }
};

/**
 * 获取地区详情
 * @param {Number} id - 地区ID
 * @returns {Promise<Object>}
 */
const getRegionById = async (id) => {
  try {
    const region = await db.Region.findByPk(id, {
      attributes: ['id', 'name', 'code', 'parent_id', 'level', 'sort_order', 'status']
    });

    if (!region) {
      throw new Error('地区不存在');
    }

    return region;
  } catch (error) {
    logger.error(`Get region by id failed: id=${id}`, error);
    throw error;
  }
};

/**
 * 获取地区树形结构（可选功能，用于一次性获取完整的省市区树）
 * @returns {Promise<Array>}
 */
const getRegionTree = async () => {
  try {
    // 获取所有启用的地区
    const allRegions = await db.Region.findAll({
      where: { status: 1 },
      attributes: ['id', 'name', 'code', 'parent_id', 'level', 'sort_order'],
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });

    // 构建树形结构
    const buildTree = (regions, parentId = 0) => {
      return regions
        .filter(r => r.parent_id === parentId)
        .map(r => ({
          id: r.id,
          name: r.name,
          code: r.code,
          parent_id: r.parent_id,
          level: r.level,
          sort_order: r.sort_order,
          children: buildTree(regions, r.id)
        }));
    };

    return buildTree(allRegions);
  } catch (error) {
    logger.error('Get region tree failed:', error);
    throw error;
  }
};

module.exports = {
  getRegionList,
  getRegionById,
  getRegionTree
};
