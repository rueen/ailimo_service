/**
 * 批量生成权限脚本
 * 从路由文件中提取权限信息，自动生成权限数据
 * 
 * 使用方法：
 * node scripts/generate-permissions.js
 */

const fs = require('fs');
const path = require('path');
const db = require('../models');
const logger = require('../config/logger');

/**
 * 权限模块分组配置
 * 定义父级权限和子权限的映射关系
 */
const PERMISSION_GROUPS = {
  // 工作台
  'dashboard': {
    name: '工作台',
    code: 'dashboard',
    children: []
  },
  // 用户管理
  'user': {
    name: '用户管理',
    code: 'user',
    children: [
      { code: 'user', name: '用户管理' },
      { code: 'organization', name: '组织机构' },
      { code: 'research_group', name: '课题组' }
    ]
  },
  // 设备租赁
  'equipment': {
    name: '设备租赁',
    code: 'equipment',
    children: [
      { code: 'equipment', name: '设备管理' },
      { code: 'equipment_reservation', name: '设备订单' },
      { code: 'equipment_time_slot', name: '设备时间段' }
    ]
  },
  // 笼位租赁
  'cage': {
    name: '笼位租赁',
    code: 'cage',
    children: [
      { code: 'cage', name: '笼位管理' },
      { code: 'cage_reservation', name: '笼位订单' },
      { code: 'cage_purpose', name: '笼位用途' },
      { code: 'cage_time_slot', name: '笼位时间段' }
    ]
  },
  // 实验代操作
  'experiment': {
    name: '实验代操作',
    code: 'experiment',
    children: [
      { code: 'experiment_operation', name: '实验订单' },
      { code: 'operation_content', name: '操作内容' },
      { code: 'experiment_time_slot', name: '实验时间段' }
    ]
  },
  // 动物订购
  'animal': {
    name: '动物订购',
    code: 'animal',
    children: [
      { code: 'animal_order', name: '动物订单' },
      { code: 'animal_brand', name: '动物品牌' },
      { code: 'animal_variety', name: '动物品系' },
      { code: 'animal_specification', name: '动物规格' },
      { code: 'animal_requirement', name: '动物需求' }
    ]
  },
  // 试剂耗材订购
  'reagent': {
    name: '试剂耗材订购',
    code: 'reagent',
    children: [
      { code: 'reagent_order', name: '试剂订单' },
      { code: 'reagent_brand', name: '试剂品牌' },
      { code: 'reagent_specification', name: '试剂规格' }
    ]
  },
  // 内容管理
  'content': {
    name: '内容管理',
    code: 'content',
    children: [
      { code: 'case', name: '案例管理' },
      { code: 'company_info', name: '公司信息' }
    ]
  },
  // 通用配置管理
  'config': {
    name: '通用配置管理',
    code: 'config',
    children: [
      { code: 'handler', name: '负责人管理' },
      { code: 'environment_type', name: '环境类型' },
      { code: 'animal_type', name: '动物类型' }
    ]
  },
  // 系统管理
  'system': {
    name: '系统管理',
    code: 'system',
    children: [
      { code: 'administrator', name: '管理员管理' },
      { code: 'role', name: '角色管理' },
      { code: 'permission', name: '权限管理' },
      { code: 'system_config', name: '系统配置' }
    ]
  }
};

/**
 * 权限操作类型映射
 */
const ACTION_NAMES = {
  'list': '列表',
  'detail': '详情',
  'create': '创建',
  'update': '更新',
  'delete': '删除',
  'audit': '审核',
  'complete': '完成',
  'cancel': '取消',
  'view': '查看',
  'statistics': '统计'
};

/**
 * HTTP方法映射
 */
const METHOD_MAP = {
  'GET': 'GET',
  'POST': 'POST',
  'PUT': 'PUT',
  'DELETE': 'DELETE'
};

/**
 * 手动定义的权限列表（用于路由文件中没有但需要创建的权限）
 */
const MANUAL_PERMISSIONS = [
  {
    code: 'dashboard:view',
    method: 'GET',
    path: '/api/support/dashboard',
    name: '工作台查看'
  }
];

/**
 * 解析路由文件，提取权限信息
 */
function parseRoutes() {
  const routeFile = path.join(__dirname, '../routes/admin.js');
  const content = fs.readFileSync(routeFile, 'utf-8');
  
  const permissions = [];
  // 匹配路由定义，支持多个中间件
  // 例如: router.get('/users', adminAuth, permission('user:list'), userController.getUserList);
  const routeRegex = /router\.(get|post|put|delete)\('([^']+)'[^)]*permission\('([^']+)'\)/gi;
  let match;
  
  while ((match = routeRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2];
    const code = match[3];
    
    // 跳过权限管理本身的权限（避免循环）
    if (code.startsWith('permission:')) {
      continue;
    }
    
    permissions.push({
      method,
      path: `/api/support${routePath}`,
      code,
      name: generatePermissionName(code)
    });
  }
  
  // 添加手动定义的权限（如果路由文件中没有）
  const existingCodes = new Set(permissions.map(p => p.code));
  MANUAL_PERMISSIONS.forEach(perm => {
    if (!existingCodes.has(perm.code)) {
      permissions.push(perm);
    }
  });
  
  return permissions;
}

/**
 * 根据权限代码生成权限名称
 */
function generatePermissionName(code) {
  const parts = code.split(':');
  if (parts.length !== 2) {
    return code;
  }
  
  const [module, action] = parts;
  const actionName = ACTION_NAMES[action] || action;
  
  // 查找模块名称
  for (const group of Object.values(PERMISSION_GROUPS)) {
    for (const child of group.children) {
      if (child.code === module) {
        return `${child.name}${actionName}`;
      }
    }
  }
  
  // 如果找不到，使用模块代码
  return `${module}${actionName}`;
}

/**
 * 构建权限树结构
 */
function buildPermissionTree(permissions) {
  const tree = [];
  const parentMap = new Map(); // 存储父级权限ID
  
  // 先创建父级权限（模块）
  for (const [key, group] of Object.entries(PERMISSION_GROUPS)) {
    const parent = {
      name: group.name,
      code: group.code,
      resource: '',
      method: '',
      parentId: 0,
      sortOrder: Object.keys(PERMISSION_GROUPS).indexOf(key) + 1,
      children: []
    };
    tree.push(parent);
    parentMap.set(group.code, parent);
  }
  
  // 创建二级权限（子模块）
  for (const [key, group] of Object.entries(PERMISSION_GROUPS)) {
    const parent = parentMap.get(group.code);
    group.children.forEach((child, index) => {
      const childPermission = {
        name: child.name,
        code: child.code,
        resource: '',
        method: '',
        parentId: parent.code,
        sortOrder: index + 1,
        children: []
      };
      parent.children.push(childPermission);
      parentMap.set(child.code, childPermission);
    });
  }
  
  // 添加具体权限（操作）
  permissions.forEach(perm => {
    const parts = perm.code.split(':');
    if (parts.length !== 2) return;
    
    const [module, action] = parts;
    const modulePerm = parentMap.get(module);
    
    if (modulePerm) {
      const actionName = ACTION_NAMES[action] || action;
      const permission = {
        name: `${modulePerm.name}${actionName}`,
        code: perm.code,
        resource: perm.path,
        method: perm.method,
        parentId: modulePerm.code,
        sortOrder: modulePerm.children.length + 1
      };
      modulePerm.children.push(permission);
    }
  });
  
  return tree;
}

/**
 * 扁平化权限树（用于数据库插入）
 * 返回按层级分组的权限列表
 */
function flattenPermissionTree(tree) {
  const level1 = []; // 一级权限（模块）
  const level2 = []; // 二级权限（子模块）
  const level3 = []; // 三级权限（具体操作）
  
  for (const node of tree) {
    // 一级权限
    level1.push({
      name: node.name,
      code: node.code,
      resource: node.resource || '',
      method: node.method || '',
      parentId: 0,
      sortOrder: node.sortOrder || 0
    });
    
    // 处理子节点
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        // 判断是二级还是三级权限（有resource的是三级）
        if (child.resource) {
          // 三级权限（具体操作）
          level3.push({
            name: child.name,
            code: child.code,
            resource: child.resource,
            method: child.method,
            parentId: child.parentId, // 使用code作为临时标识
            sortOrder: child.sortOrder || 0
          });
        } else {
          // 二级权限（子模块）
          level2.push({
            name: child.name,
            code: child.code,
            resource: child.resource || '',
            method: child.method || '',
            parentId: child.parentId, // 使用code作为临时标识
            sortOrder: child.sortOrder || 0
          });
          
          // 处理三级权限
          if (child.children && child.children.length > 0) {
            for (const grandChild of child.children) {
              level3.push({
                name: grandChild.name,
                code: grandChild.code,
                resource: grandChild.resource,
                method: grandChild.method,
                parentId: grandChild.parentId, // 使用code作为临时标识
                sortOrder: grandChild.sortOrder || 0
              });
            }
          }
        }
      }
    }
  }
  
  return { level1, level2, level3 };
}

/**
 * 批量创建权限
 */
async function createPermissions() {
  try {
    logger.info('开始生成权限数据...');
    
    // 解析路由
    const routePermissions = parseRoutes();
    logger.info(`从路由文件中提取到 ${routePermissions.length} 个权限`);
    
    // 构建权限树
    const tree = buildPermissionTree(routePermissions);
    
    // 扁平化权限树
    const { level1, level2, level3 } = flattenPermissionTree(tree);
    
    logger.info(`权限统计：一级权限 ${level1.length} 个，二级权限 ${level2.length} 个，三级权限 ${level3.length} 个`);
    
    // 开始事务
    const transaction = await db.sequelize.transaction();
    
    try {
      const permissionIdMap = new Map(); // 存储 code -> id 的映射
      
      // 插入一级权限
      for (const perm of level1) {
        const [permission, created] = await db.Permission.findOrCreate({
          where: { code: perm.code },
          defaults: {
            name: perm.name,
            code: perm.code,
            resource: perm.resource,
            method: perm.method,
            parent_id: 0,
            sort_order: perm.sortOrder
          },
          transaction
        });
        
        // 如果权限已存在，但 parent_id 不正确，需要更新
        if (!created && permission.parent_id !== 0) {
          await permission.update({
            parent_id: 0,
            sort_order: perm.sortOrder
          }, { transaction });
          logger.info(`更新一级权限的父级: ${perm.name} (${perm.code})`);
        }
        
        permissionIdMap.set(perm.code, permission.id);
        if (created) {
          logger.info(`创建一级权限: ${perm.name} (${perm.code})`);
        } else {
          logger.info(`权限已存在: ${perm.name} (${perm.code})`);
        }
      }
      
      // 插入二级权限
      for (const perm of level2) {
        // 检查该权限是否已经作为一级权限存在
        const existingAsLevel1 = permissionIdMap.get(perm.code);
        if (existingAsLevel1) {
          // 如果已经作为一级权限存在，跳过（避免将一级权限降级为二级权限）
          logger.info(`跳过：${perm.name} (${perm.code}) 已作为一级权限存在`);
          continue;
        }
        
        const parentId = permissionIdMap.get(perm.parentId);
        if (!parentId) {
          logger.warn(`找不到父级权限: ${perm.parentId}`);
          continue;
        }
        
        const [permission, created] = await db.Permission.findOrCreate({
          where: { code: perm.code },
          defaults: {
            name: perm.name,
            code: perm.code,
            resource: perm.resource,
            method: perm.method,
            parent_id: parentId,
            sort_order: perm.sortOrder
          },
          transaction
        });
        
        // 如果权限已存在，但 parent_id 不正确，需要更新
        if (!created && permission.parent_id !== parentId) {
          await permission.update({
            parent_id: parentId,
            sort_order: perm.sortOrder
          }, { transaction });
          logger.info(`更新二级权限的父级: ${perm.name} (${perm.code})`);
        }
        
        permissionIdMap.set(perm.code, permission.id);
        if (created) {
          logger.info(`创建二级权限: ${perm.name} (${perm.code})`);
        } else {
          logger.info(`权限已存在: ${perm.name} (${perm.code})`);
        }
      }
      
      // 插入三级权限（具体操作权限）
      for (const perm of level3) {
        const parentId = permissionIdMap.get(perm.parentId);
        if (!parentId) {
          logger.warn(`找不到父级权限: ${perm.parentId}`);
          continue;
        }
        
        const [permission, created] = await db.Permission.findOrCreate({
          where: { code: perm.code },
          defaults: {
            name: perm.name,
            code: perm.code,
            resource: perm.resource,
            method: perm.method,
            parent_id: parentId,
            sort_order: perm.sortOrder
          },
          transaction
        });
        
        // 如果权限已存在，但 parent_id 不正确，需要更新
        if (!created && permission.parent_id !== parentId) {
          await permission.update({
            parent_id: parentId,
            sort_order: perm.sortOrder
          }, { transaction });
          logger.info(`更新三级权限的父级: ${perm.name} (${perm.code})`);
        }
        
        if (created) {
          logger.info(`创建三级权限: ${perm.name} (${perm.code})`);
        } else {
          logger.info(`权限已存在: ${perm.name} (${perm.code})`);
        }
      }
      
      await transaction.commit();
      logger.info('✅ 权限生成完成！');
      
      // 输出统计信息
      const totalCount = await db.Permission.count();
      logger.info(`当前数据库中共有 ${totalCount} 个权限`);
      
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
    
  } catch (err) {
    logger.error(`生成权限失败: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// 执行脚本
if (require.main === module) {
  createPermissions()
    .then(() => {
      logger.info('脚本执行完成');
      process.exit(0);
    })
    .catch(err => {
      logger.error(`脚本执行失败: ${err.message}`);
      console.error(err);
      process.exit(1);
    });
}

module.exports = { createPermissions, parseRoutes, buildPermissionTree };
