/**
 * 批量生成权限脚本
 * 根据预定义的权限配置自动生成权限数据
 * 
 * 使用方法：
 * node scripts/generate-permissions.js
 */

const db = require('../models');
const logger = require('../config/logger');

/**
 * 权限配置
 * 定义系统中所有的权限结构
 */
const PERMISSION_CONFIG = {
  // 一级权限：工作台
  dashboard: {
    name: '工作台',
    code: 'dashboard',
    children: []
  },
  
  // 一级权限：用户管理
  user: {
    name: '用户管理',
    code: 'user',
    children: [
      { name: '用户列表', code: 'user:list' },
      { name: '用户详情', code: 'user:detail' },
      { name: '新增用户', code: 'user:create' },
      { name: '编辑用户', code: 'user:update' },
      { name: '删除用户', code: 'user:delete' },
      { name: '审核用户', code: 'user:audit' },
      // 组织机构
      { 
        name: '组织机构',
        code: 'organization',
        children: [
          { name: '组织机构列表', code: 'organization:list' },
          { name: '新增组织机构', code: 'organization:create' },
          { name: '编辑组织机构', code: 'organization:update' },
          { name: '删除组织机构', code: 'organization:delete' },
        ]
      },
      // 课题组
      { 
        name: '课题组',
        code: 'research_group',
        children: [
          { name: '课题组列表', code: 'research_group:list' },
          { name: '新增课题组', code: 'research_group:create' },
          { name: '编辑课题组', code: 'research_group:update' },
          { name: '删除课题组', code: 'research_group:delete' },
        ]
      },
    ]
  },
  
  // TODO: 后续补充其他模块的权限配置
  // - 设备预约
  equipment: {
    name: '设备预约',
    code: 'equipment_reservation',
    children: [
      { name: '租赁订单', code: 'equipment_reservation:list' },
      { name: '订单详情', code: 'equipment_reservation:detail' },
      { name: '新增订单', code: 'equipment_reservation:create' },
      { name: '编辑订单', code: 'equipment_reservation:update' },
      { name: '审核订单', code: 'equipment_reservation:audit' },
      { name: '完成订单', code: 'equipment_reservation:complete' },
      { name: '取消订单', code: 'equipment_reservation:cancel' },
      // 设备管理
      {
        name: '设备管理',
        code: 'equipment',
        children: [
          { name: '设备列表', code: 'equipment:list' },
          { name: '设备详情', code: 'equipment:detail' },
          { name: '新增设备', code: 'equipment:create' },
          { name: '编辑设备', code: 'equipment:update' },
          { name: '删除设备', code: 'equipment:delete' },
        ]
      },
      // 时间段管理
      {
        name: '时间段管理',
        code: 'equipment_time_slot',
        children: [
          { name: '时间段列表', code: 'equipment_time_slot:list' },
          { name: '新增时间段', code: 'equipment_time_slot:create' },
          { name: '编辑时间段', code: 'equipment_time_slot:update' },
          { name: '删除时间段', code: 'equipment_time_slot:delete' },
        ]
      },
    ]
  },
  // - 笼位预约
  cage: {
    name: '笼位预约',
    code: 'cage_reservation',
    children: [
      { name: '租赁订单', code: 'cage_reservation:list' },
      { name: '订单详情', code: 'cage_reservation:detail' },
      { name: '新增订单', code: 'cage_reservation:create' },
      { name: '编辑订单', code: 'cage_reservation:update' },
      { name: '审核订单', code: 'cage_reservation:audit' },
      { name: '完成订单', code: 'cage_reservation:complete' },
      { name: '取消订单', code: 'cage_reservation:cancel' },
      // 笼位管理
      {
        name: '笼位管理',
        code: 'cage',
        children: [
          { name: '笼位列表', code: 'cage:list' },
          { name: '新增笼位', code: 'cage:create' },
          { name: '编辑笼位', code: 'cage:update' },
          { name: '删除笼位', code: 'cage:delete' },
        ]
      },
      // 笼位用途管理
      {
        name: '用途管理',
        code: 'cage_purpose',
        children: [
          { name: '用途列表', code: 'cage_purpose:list' },
          { name: '新增用途', code: 'cage_purpose:create' },
          { name: '编辑用途', code: 'cage_purpose:update' },
          { name: '删除用途', code: 'cage_purpose:delete' },
        ]
      },
      // 时间段管理
      {
        name: '时间段管理',
        code: 'cage_time_slot',
        children: [
          { name: '时间段列表', code: 'cage_time_slot:list' },
          { name: '新增时间段', code: 'cage_time_slot:create' },
          { name: '编辑时间段', code: 'cage_time_slot:update' },
          { name: '删除时间段', code: 'cage_time_slot:delete' },
        ]
      },
    ]
  },
  // - 实验代操作
  experiment_operation: {
    name: '实验代操作',
    code: 'experiment_operation',
    children: [
      { name: '代操作订单', code: 'experiment_operation:list' },
      { name: '订单详情', code: 'experiment_operation:detail' },
      { name: '新增订单', code: 'experiment_operation:create' },
      { name: '编辑订单', code: 'experiment_operation:update' },
      { name: '审核订单', code: 'experiment_operation:audit' },
      { name: '完成订单', code: 'experiment_operation:complete' },
      { name: '取消订单', code: 'experiment_operation:cancel' },
      // 操作内容管理
      {
        name: '操作内容管理',
        code: 'operation_content',
        children: [
          { name: '操作内容列表', code: 'operation_content:list' },
          { name: '新增操作内容', code: 'operation_content:create' },
          { name: '编辑操作内容', code: 'operation_content:update' },
          { name: '删除操作内容', code: 'operation_content:delete' },
        ]
      },
      // 时间段管理
      {
        name: '时间段管理',
        code: 'experiment_time_slot',
        children: [
          { name: '时间段列表', code: 'experiment_time_slot:list' },
          { name: '新增时间段', code: 'experiment_time_slot:create' },
          { name: '编辑时间段', code: 'experiment_time_slot:update' },
          { name: '删除时间段', code: 'experiment_time_slot:delete' },
        ]
      },
    ]
  },
  // - 动物订购
  animal_order: {
    name: '动物订购',
    code: 'animal_order',
    children: [
      { name: '订购订单', code: 'animal_order:list' },
      { name: '订单详情', code: 'animal_order:detail' },
      { name: '新增订单', code: 'animal_order:create' },
      { name: '编辑订单', code: 'animal_order:update' },
      { name: '审核订单', code: 'animal_order:audit' },
      { name: '完成订单', code: 'animal_order:complete' },
      { name: '取消订单', code: 'animal_order:cancel' },
      // 动物品牌管理
      {
        name: '品牌管理',
        code: 'animal_brand',
        children: [
          { name: '品牌列表', code: 'animal_brand:list' },
          { name: '新增品牌', code: 'animal_brand:create' },
          { name: '编辑品牌', code: 'animal_brand:update' },
          { name: '删除品牌', code: 'animal_brand:delete' },
        ]
      },
      // 动物种类/品系管理
      {
        name: '品系管理',
        code: 'animal_variety',
        children: [
          { name: '品系列表', code: 'animal_variety:list' },
          { name: '新增品系', code: 'animal_variety:create' },
          { name: '编辑品系', code: 'animal_variety:update' },
          { name: '删除品系', code: 'animal_variety:delete' },
        ]
      },
      // 动物规格管理
      {
        name: '规格管理',
        code: 'animal_specification',
        children: [
          { name: '规格列表', code: 'animal_specification:list' },
          { name: '新增规格', code: 'animal_specification:create' },
          { name: '编辑规格', code: 'animal_specification:update' },
          { name: '删除规格', code: 'animal_specification:delete' },
        ]
      },
      // 动物要求管理
      {
        name: '要求管理',
        code: 'animal_requirement',
        children: [
          { name: '要求列表', code: 'animal_requirement:list' },
          { name: '新增要求', code: 'animal_requirement:create' },
          { name: '编辑要求', code: 'animal_requirement:update' },
          { name: '删除要求', code: 'animal_requirement:delete' },
        ]
      },
    ]
  },
  // - 试剂耗材订购
  reagent_order: {
    name: '试剂耗材订购',
    code: 'reagent_order',
    children: [
      { name: '订购订单', code: 'reagent_order:list' },
      { name: '订单详情', code: 'reagent_order:detail' },
      { name: '新增订单', code: 'reagent_order:create' },
      { name: '编辑订单', code: 'reagent_order:update' },
      { name: '审核订单', code: 'reagent_order:audit' },
      { name: '完成订单', code: 'reagent_order:complete' },
      { name: '取消订单', code: 'reagent_order:cancel' },
      // 试剂品牌管理
      {
        name: '品牌管理',
        code: 'reagent_brand',
        children: [
          { name: '品牌列表', code: 'reagent_brand:list' },
          { name: '新增品牌', code: 'reagent_brand:create' },
          { name: '编辑品牌', code: 'reagent_brand:update' },
          { name: '删除品牌', code: 'reagent_brand:delete' },
        ]
      },
      // 试剂规格管理
      {
        name: '规格管理',
        code: 'reagent_specification',
        children: [
          { name: '规格列表', code: 'reagent_specification:list' },
          { name: '新增规格', code: 'reagent_specification:create' },
          { name: '编辑规格', code: 'reagent_specification:update' },
          { name: '删除规格', code: 'reagent_specification:delete' },
        ]
      },
    ]
  },
  // - 内容管理
  content: {
    name: '内容管理',
    code: 'content',
    children: [
      {
        name: '案例管理',
        code: 'case',
        children: [
          { name: '案例列表', code: 'case:list' },
          { name: '案例详情', code: 'case:detail' },
          { name: '新增案例', code: 'case:create' },
          { name: '编辑案例', code: 'case:update' },
          { name: '删除案例', code: 'case:delete' },
        ]
      },
      { name: '公司信息', code: 'company_info' }
    ]
  },
  // - 通用配置管理
  config: {
    name: '通用配置管理',
    code: 'config',
    children: [
      {
        name: '负责人管理',
        code: 'handler',
        children: [
          { name: '负责人列表', code: 'handler:list' },
          { name: '新增负责人', code: 'handler:create' },
          { name: '编辑负责人', code: 'handler:update' },
          { name: '删除负责人', code: 'handler:delete' },
        ]
      },
      {
        name: '环境类型',
        code: 'environment_type',
        children: [
          { name: '环境类型列表', code: 'environment_type:list' },
          { name: '新增环境类型', code: 'environment_type:create' },
          { name: '编辑环境类型', code: 'environment_type:update' },
          { name: '删除环境类型', code: 'environment_type:delete' },
        ]
      },
      {
        name: '动物类型',
        code: 'animal_type',
        children: [
          { name: '动物类型列表', code: 'animal_type:list' },
          { name: '新增动物类型', code: 'animal_type:create' },
          { name: '编辑动物类型', code: 'animal_type:update' },
          { name: '删除动物类型', code: 'animal_type:delete' },
        ]
      },
    ]
  },
  // - 系统管理
  system: {
    name: '系统管理',
    code: 'system',
    children: [
      {
        name: '管理员管理',
        code: 'administrator',
        children: [
          { name: '管理员列表', code: 'administrator:list' },
          { name: '新增管理员', code: 'administrator:create' },
          { name: '编辑管理员', code: 'administrator:update' },
          { name: '删除管理员', code: 'administrator:delete' },
        ]
      },
      {
        name: '角色管理',
        code: 'role',
        children: [
          { name: '角色列表', code: 'role:list' },
          { name: '新增角色', code: 'role:create' },
          { name: '编辑角色', code: 'role:update' },
          { name: '删除角色', code: 'role:delete' },
        ]
      },
      { name: '系统配置', code: 'system_config' },
    ]
  }
};

/**
 * 递归处理权限节点
 * @param {Object} node - 权限节点
 * @param {String|Number} parentCode - 父级权限代码（0 表示顶级）
 * @param {Number} sortOrder - 排序号
 * @param {Array} result - 结果数组
 * @returns {Number} 下一个排序号
 */
function processPermissionNode(node, parentCode, sortOrder, result) {
  // 添加当前节点
  result.push({
    name: node.name,
    code: node.code,
    parent_code: parentCode, // 暂时用 code 标识父级，后续会转换为 id
    sort_order: sortOrder
  });

  // 递归处理子节点
  if (node.children && node.children.length > 0) {
    let childSortOrder = 1;
    node.children.forEach(child => {
      childSortOrder = processPermissionNode(child, node.code, childSortOrder, result);
    });
  }

  return sortOrder + 1;
}

/**
 * 扁平化权限树结构（支持多级权限）
 * @param {Object} config - 权限配置对象
 * @returns {Array} 扁平化的权限列表
 */
function flattenPermissions(config) {
  const permissions = [];
  let parentSortOrder = 1;

  for (const key in config) {
    const module = config[key];
    parentSortOrder = processPermissionNode(module, 0, parentSortOrder, permissions);
  }

  return permissions;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('========================================');
    console.log('开始批量生成权限数据');
    console.log('========================================\n');

    // 1. 连接数据库
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully');
    console.log('✓ 数据库连接成功\n');

    // 2. 清空现有权限数据
    console.log('正在清空现有权限数据...');
    
    // 先删除角色权限关联
    await db.RolePermission.destroy({ where: {} });
    console.log('✓ 清空角色权限关联');
    
    // 再删除权限数据
    await db.Permission.destroy({ where: {} });
    console.log('✓ 清空权限数据\n');

    // 3. 扁平化权限配置
    console.log('正在处理权限配置...');
    const flatPermissions = flattenPermissions(PERMISSION_CONFIG);
    console.log(`✓ 共处理 ${flatPermissions.length} 条权限\n`);

    // 4. 创建权限数据（按层级顺序创建）
    console.log('开始导入权限数据...');
    
    const parentIdMap = new Map(); // code -> id 映射
    let createdCount = 0;
    const totalCount = flatPermissions.length;

    // 循环创建，每次只创建父级已存在的权限
    let remaining = [...flatPermissions];
    let lastCreatedCount = 0;

    while (remaining.length > 0) {
      const toCreate = [];
      const stillRemaining = [];

      for (const perm of remaining) {
        // 检查父级是否已创建
        const parentId = perm.parent_code === 0 ? 0 : parentIdMap.get(perm.parent_code);
        
        if (perm.parent_code === 0 || parentId) {
          // 父级已存在，可以创建
          toCreate.push({ ...perm, parentId });
        } else {
          // 父级还未创建，等待下一轮
          stillRemaining.push(perm);
        }
      }

      // 如果本轮没有创建任何权限，说明有循环依赖或错误
      if (toCreate.length === 0) {
        console.error('\n✗ 错误: 检测到权限依赖问题，以下权限无法创建：');
        stillRemaining.forEach(perm => {
          console.error(`  - ${perm.name} (${perm.code})，父级: ${perm.parent_code}`);
        });
        throw new Error('权限依赖错误，无法继续创建');
      }

      // 创建本轮可以创建的权限
      for (const perm of toCreate) {
        const created = await db.Permission.create({
          name: perm.name,
          code: perm.code,
          parent_id: perm.parentId,
          sort_order: perm.sort_order
        });
        
        parentIdMap.set(perm.code, created.id);
        createdCount++;
        
        // 判断层级
        const level = perm.parent_code === 0 ? 1 : 
          (parentIdMap.has(perm.parent_code) && 
           flatPermissions.find(p => p.code === perm.parent_code)?.parent_code === 0) ? 2 : 3;
        const levelLabel = level === 1 ? '一级' : level === 2 ? '二级' : level === 3 ? '三级' : `${level}级`;
        
        console.log(`✓ [${createdCount}/${totalCount}] 创建${levelLabel}权限: ${perm.name} (${perm.code})`);
      }

      remaining = stillRemaining;
    }

    console.log('\n========================================');
    console.log(`✓ 权限生成完成！共创建 ${createdCount} 条权限`);
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('\n导入失败：', error);
    logger.error(`Permission generation failed: ${error.message}`);
    process.exit(1);
  }
}

// 运行主函数
main();
