/**
 * 数据库表同步脚本
 * 使用 Sequelize 自动创建所有表
 */
require('dotenv').config();
const db = require('../models');

async function syncDatabase() {
  try {
    console.log('开始同步数据库表结构...');
    
    // 同步所有模型到数据库
    // force: false - 不会删除已存在的表
    // alter: true - 会修改表结构以匹配模型定义
    await db.sequelize.sync({ alter: true });
    
    console.log('✅ 数据库表结构同步成功！');
    console.log('\n已创建/更新以下表：');
    console.log('- users (用户表)');
    console.log('- organizations (组织机构表)');
    console.log('- research_groups (课题组表)');
    console.log('- administrators (管理员表)');
    console.log('- roles (角色表)');
    console.log('- permissions (权限表)');
    console.log('- role_permissions (角色权限关联表)');
    console.log('- equipment (设备表)');
    console.log('- equipment_reservations (设备预约订单表)');
    console.log('- equipment_time_slots (设备时间段表)');
    console.log('- cages (笼位表)');
    console.log('- cage_reservations (笼位预约订单表)');
    console.log('- cage_purposes (笼位用途表)');
    console.log('- cage_time_slots (笼位时间段表)');
    console.log('- operation_contents (操作内容表)');
    console.log('- experiment_operations (实验代操作订单表)');
    console.log('- experiment_time_slots (实验时间段表)');
    console.log('- animal_brands (动物品牌表)');
    console.log('- animal_varieties (动物种类表)');
    console.log('- animal_specifications (动物规格表)');
    console.log('- animal_requirements (动物要求表)');
    console.log('- animal_orders (动物订购订单表)');
    console.log('- reagent_brands (试剂品牌表)');
    console.log('- reagent_specifications (试剂规格表)');
    console.log('- reagent_orders (试剂订购订单表)');
    console.log('- cases (案例表)');
    console.log('- company_info (公司信息表)');
    console.log('- system_configs (系统配置表)');
    console.log('- sms_codes (短信验证码表)');
    console.log('- environment_types (环境类型表)');
    console.log('- animal_types (动物类型表)');
    console.log('- handlers (负责人表)');
    console.log('\n现在可以执行初始化数据脚本：');
    console.log('mysql -u root ailimo < database/init.sql');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库表结构同步失败：', error);
    process.exit(1);
  }
}

syncDatabase();
