/**
 * 导入完整的省市区数据
 * 数据来源：modood/Administrative-divisions-of-China
 * GitHub: https://github.com/modood/Administrative-divisions-of-China
 */

const axios = require('axios');
const db = require('../models');
const logger = require('../config/logger');

// 数据源 URL（使用 GitHub raw 文件）
const DATA_SOURCES = {
  // 省级数据
  provinces: 'https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/provinces.json',
  // 市级数据
  cities: 'https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/cities.json',
  // 区县数据
  areas: 'https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/master/dist/areas.json'
};

/**
 * 下载数据
 */
const fetchData = async (url) => {
  try {
    console.log(`正在下载：${url}`);
    const response = await axios.get(url, { timeout: 30000 });
    console.log(`✓ 下载成功，共 ${response.data.length} 条数据`);
    return response.data;
  } catch (error) {
    console.error(`✗ 下载失败：${error.message}`);
    throw error;
  }
};

/**
 * 导入省级数据
 */
const importProvinces = async (provinces) => {
  console.log('\n开始导入省级数据...');
  let count = 0;

  for (let i = 0; i < provinces.length; i++) {
    const item = provinces[i];
    try {
      await db.Region.create({
        id: parseInt(item.code.substring(0, 2)) * 10000, // 使用前两位数字 * 10000 作为 ID
        name: item.name,
        code: item.code,
        parent_id: 0,
        level: 1,
        sort_order: i + 1,
        status: 1
      });
      count++;
      process.stdout.write(`\r进度：${count}/${provinces.length}`);
    } catch (error) {
      console.error(`\n插入失败：${item.name}，错误：${error.message}`);
    }
  }
  console.log(`\n✓ 省级数据导入完成，共 ${count} 条`);
};

/**
 * 导入市级数据
 */
const importCities = async (cities) => {
  console.log('\n开始导入市级数据...');
  let count = 0;

  for (let i = 0; i < cities.length; i++) {
    const item = cities[i];
    try {
      // 计算父级 ID（省份 ID）
      const provinceCode = item.code.substring(0, 2);
      const parentId = parseInt(provinceCode) * 10000;

      // 使用前 4 位数字 * 100 作为 ID
      const cityId = parseInt(item.code.substring(0, 4)) * 100;

      await db.Region.create({
        id: cityId,
        name: item.name,
        code: item.code,
        parent_id: parentId,
        level: 2,
        sort_order: i + 1,
        status: 1
      });
      count++;
      if (count % 50 === 0) {
        process.stdout.write(`\r进度：${count}/${cities.length}`);
      }
    } catch (error) {
      console.error(`\n插入失败：${item.name}，错误：${error.message}`);
    }
  }
  console.log(`\n✓ 市级数据导入完成，共 ${count} 条`);
};

/**
 * 导入区县数据
 */
const importAreas = async (areas) => {
  console.log('\n开始导入区县数据...');
  let count = 0;

  for (let i = 0; i < areas.length; i++) {
    const item = areas[i];
    try {
      // 计算父级 ID（市级 ID）
      const cityCode = item.code.substring(0, 4);
      const parentId = parseInt(cityCode) * 100;

      // 直接使用 6 位编码作为 ID
      const areaId = parseInt(item.code);

      await db.Region.create({
        id: areaId,
        name: item.name,
        code: item.code,
        parent_id: parentId,
        level: 3,
        sort_order: i + 1,
        status: 1
      });
      count++;
      if (count % 100 === 0) {
        process.stdout.write(`\r进度：${count}/${areas.length}`);
      }
    } catch (error) {
      console.error(`\n插入失败：${item.name}，错误：${error.message}`);
    }
  }
  console.log(`\n✓ 区县数据导入完成，共 ${count} 条`);
};

/**
 * 主函数
 */
const main = async () => {
  try {
    console.log('========================================');
    console.log('开始导入全国省市区数据');
    console.log('数据来源：modood/Administrative-divisions-of-China');
    console.log('========================================\n');

    // 1. 创建表（如果不存在）
    console.log('检查并创建 regions 表...');
    await db.Region.sync({ force: false });
    console.log('✓ 表准备完成\n');

    // 2. 清空现有数据
    console.log('正在清空现有数据...');
    await db.Region.destroy({ where: {}, truncate: true });
    console.log('✓ 清空完成\n');

    // 3. 下载数据
    console.log('开始下载数据...');
    const [provinces, cities, areas] = await Promise.all([
      fetchData(DATA_SOURCES.provinces),
      fetchData(DATA_SOURCES.cities),
      fetchData(DATA_SOURCES.areas)
    ]);

    // 4. 导入数据
    await importProvinces(provinces);
    await importCities(cities);
    await importAreas(areas);

    // 5. 统计信息
    console.log('\n========================================');
    console.log('导入完成！');
    console.log('========================================');
    
    const stats = await db.Region.findAll({
      attributes: [
        'level',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']
      ],
      group: ['level']
    });

    console.log('\n数据统计：');
    stats.forEach(stat => {
      const levelName = stat.level === 1 ? '省级' : stat.level === 2 ? '市级' : '区县';
      console.log(`  ${levelName}：${stat.dataValues.count} 条`);
    });

    console.log('\n可以开始使用地区查询接口了！');
    console.log('示例：');
    console.log('  GET /api/h5/regions?level=1  # 查询所有省份');
    console.log('  GET /api/h5/regions?parent_id=440000&level=2  # 查询广东省的市');
    console.log('  GET /api/h5/regions?parent_id=440300&level=3  # 查询深圳市的区');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n导入失败：', error);
    process.exit(1);
  }
};

// 执行导入
main();
