/**
 * 从本地 JSON 文件导入省市区数据
 * 使用方法：
 * 1. 先从 GitHub 下载数据文件到 database/regions/ 目录
 * 2. 运行此脚本导入数据库
 */

const fs = require('fs');
const path = require('path');
const db = require('../models');

// 本地数据文件路径
const DATA_DIR = path.join(__dirname, '../database/regions');
const FILES = {
  provinces: path.join(DATA_DIR, 'provinces.json'),
  cities: path.join(DATA_DIR, 'cities.json'),
  areas: path.join(DATA_DIR, 'areas.json')
};

/**
 * 读取本地文件
 */
const readLocalFile = (filePath) => {
  try {
    console.log(`读取文件：${filePath}`);
    const data = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    console.log(`✓ 读取成功，共 ${jsonData.length} 条数据`);
    return jsonData;
  } catch (error) {
    console.error(`✗ 读取失败：${error.message}`);
    throw error;
  }
};

/**
 * 检查文件是否存在
 */
const checkFiles = () => {
  console.log('检查数据文件...\n');
  
  const missingFiles = [];
  Object.entries(FILES).forEach(([key, filePath]) => {
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${key}.json 存在`);
    } else {
      console.log(`✗ ${key}.json 不存在`);
      missingFiles.push(key);
    }
  });

  if (missingFiles.length > 0) {
    console.log('\n缺少数据文件，请按以下步骤操作：');
    console.log('\n1. 访问 GitHub 仓库：');
    console.log('   https://github.com/modood/Administrative-divisions-of-China');
    console.log('\n2. 下载以下文件到 database/regions/ 目录：');
    console.log('   - dist/provinces.json');
    console.log('   - dist/cities.json');
    console.log('   - dist/areas.json');
    console.log('\n或者使用 import-regions.js 脚本自动下载。\n');
    return false;
  }

  console.log('\n✓ 所有数据文件准备就绪\n');
  return true;
};

/**
 * 导入省级数据
 */
const importProvinces = async (provinces) => {
  console.log('开始导入省级数据...');
  let count = 0;

  for (let i = 0; i < provinces.length; i++) {
    const item = provinces[i];
    try {
      await db.Region.create({
        id: parseInt(item.code.substring(0, 2)) * 10000,
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
      const provinceCode = item.code.substring(0, 2);
      const parentId = parseInt(provinceCode) * 10000;
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
      const cityCode = item.code.substring(0, 4);
      const parentId = parseInt(cityCode) * 100;
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
    console.log('从本地文件导入全国省市区数据');
    console.log('========================================\n');

    // 1. 检查文件
    if (!checkFiles()) {
      process.exit(1);
    }

    // 2. 创建表（如果不存在）
    console.log('检查并创建 regions 表...');
    await db.Region.sync({ force: false });
    console.log('✓ 表准备完成\n');

    // 3. 清空现有数据（禁用外键检查以避免约束问题）
    console.log('正在清空现有数据...');
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.Region.destroy({ where: {}, truncate: true });
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ 清空完成\n');

    // 4. 读取数据
    console.log('开始读取数据文件...\n');
    const provinces = readLocalFile(FILES.provinces);
    const cities = readLocalFile(FILES.cities);
    const areas = readLocalFile(FILES.areas);
    console.log('');

    // 5. 导入数据
    await importProvinces(provinces);
    await importCities(cities);
    await importAreas(areas);

    // 6. 统计信息
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

    console.log('\n可以开始使用地区查询接口了！\n');

    process.exit(0);
  } catch (error) {
    console.error('\n导入失败：', error);
    process.exit(1);
  }
};

// 执行导入
main();
