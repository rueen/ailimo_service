/**
 * 数据模型入口文件
 * 初始化Sequelize，加载所有模型，建立关联关系
 */
const { Sequelize } = require('sequelize');
const config = require('../config/database');
const logger = require('../config/logger');

// 创建Sequelize实例
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// 测试数据库连接
sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connection established successfully');
  })
  .catch((err) => {
    logger.error(`Unable to connect to database: ${err.message}`);
  });

// 加载所有模型
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// 用户相关模型
db.User = require('./User')(sequelize);
db.Organization = require('./Organization')(sequelize);
db.ResearchGroup = require('./ResearchGroup')(sequelize);

// 管理员相关模型
db.Administrator = require('./Administrator')(sequelize);
db.Role = require('./Role')(sequelize);
db.Permission = require('./Permission')(sequelize);
db.RolePermission = require('./RolePermission')(sequelize);

// 通用配置模型
db.EnvironmentType = require('./EnvironmentType')(sequelize);
db.AnimalType = require('./AnimalType')(sequelize);
db.Handler = require('./Handler')(sequelize);

// 设备租赁模型
db.Equipment = require('./Equipment')(sequelize);
db.EquipmentReservation = require('./EquipmentReservation')(sequelize);
db.EquipmentTimeSlot = require('./EquipmentTimeSlot')(sequelize);

// 笼位预约模型
db.Cage = require('./Cage')(sequelize);
db.CageReservation = require('./CageReservation')(sequelize);
db.CagePurpose = require('./CagePurpose')(sequelize);
db.CageTimeSlot = require('./CageTimeSlot')(sequelize);

// 实验代操作模型
db.OperationContent = require('./OperationContent')(sequelize);
db.ExperimentOperation = require('./ExperimentOperation')(sequelize);
db.ExperimentTimeSlot = require('./ExperimentTimeSlot')(sequelize);

// 动物订购模型
db.AnimalBrand = require('./AnimalBrand')(sequelize);
db.AnimalVariety = require('./AnimalVariety')(sequelize);
db.AnimalSpecification = require('./AnimalSpecification')(sequelize);
db.AnimalRequirement = require('./AnimalRequirement')(sequelize);
db.AnimalOrder = require('./AnimalOrder')(sequelize);

// 试剂耗材模型
db.ReagentBrand = require('./ReagentBrand')(sequelize);
db.ReagentSpecification = require('./ReagentSpecification')(sequelize);
db.ReagentOrder = require('./ReagentOrder')(sequelize);

// 其他模型
db.Case = require('./Case')(sequelize);
db.CompanyInfo = require('./CompanyInfo')(sequelize);
db.SystemConfig = require('./SystemConfig')(sequelize);
db.SmsCode = require('./SmsCode')(sequelize);
db.Region = require('./Region')(sequelize);

// ==================== 建立模型关联关系 ====================

// 用户相关关联
db.User.belongsTo(db.Organization, { foreignKey: 'organization_id', as: 'organization' });
db.User.belongsTo(db.ResearchGroup, { foreignKey: 'research_group_id', as: 'research_group' });
db.User.belongsTo(db.Administrator, { foreignKey: 'audit_by', as: 'auditBy' });
db.User.belongsTo(db.Region, { foreignKey: 'province_id', as: 'province' });
db.User.belongsTo(db.Region, { foreignKey: 'city_id', as: 'city' });
db.User.belongsTo(db.Region, { foreignKey: 'district_id', as: 'district' });

db.ResearchGroup.belongsTo(db.Organization, { foreignKey: 'organization_id', as: 'organization' });

// 管理员相关关联
db.Administrator.belongsTo(db.Role, { foreignKey: 'role_id', as: 'role' });

// 角色权限多对多关联
db.Role.belongsToMany(db.Permission, { 
  through: db.RolePermission, 
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions'
});
db.Permission.belongsToMany(db.Role, { 
  through: db.RolePermission, 
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles'
});

// 设备租赁关联
db.EquipmentReservation.belongsTo(db.Equipment, { foreignKey: 'equipment_id', as: 'equipment' });
db.EquipmentReservation.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.EquipmentReservation.belongsTo(db.Handler, { foreignKey: 'handler_id', as: 'handler' });
db.EquipmentReservation.belongsTo(db.Administrator, { foreignKey: 'audit_by', as: 'auditBy' });

// 笼位预约关联
db.Cage.belongsTo(db.AnimalType, { foreignKey: 'animal_type_id', as: 'animal_type' });
db.Cage.belongsTo(db.EnvironmentType, { foreignKey: 'environment_id', as: 'environment' });

db.CageReservation.belongsTo(db.Cage, { foreignKey: 'cage_id', as: 'cage' });
db.CageReservation.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.CageReservation.belongsTo(db.AnimalType, { foreignKey: 'animal_type_id', as: 'animal_type' });
db.CageReservation.belongsTo(db.EnvironmentType, { foreignKey: 'environment_id', as: 'environment' });
db.CageReservation.belongsTo(db.CagePurpose, { foreignKey: 'purpose_id', as: 'purpose' });
db.CageReservation.belongsTo(db.Handler, { foreignKey: 'handler_id', as: 'handler' });
db.CageReservation.belongsTo(db.Administrator, { foreignKey: 'audit_by', as: 'auditBy' });

// 实验代操作关联
db.ExperimentOperation.belongsTo(db.OperationContent, { foreignKey: 'operation_content_id', as: 'operation_content' });
db.ExperimentOperation.belongsTo(db.AnimalType, { foreignKey: 'animal_type_id', as: 'animal_type' });
db.ExperimentOperation.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.ExperimentOperation.belongsTo(db.Handler, { foreignKey: 'handler_id', as: 'handler' });
db.ExperimentOperation.belongsTo(db.Administrator, { foreignKey: 'audit_by', as: 'auditBy' });

// 动物订购关联
db.AnimalVariety.belongsTo(db.AnimalBrand, { foreignKey: 'brand_id', as: 'brand' });

db.AnimalOrder.belongsTo(db.AnimalBrand, { foreignKey: 'brand_id', as: 'brand' });
db.AnimalOrder.belongsTo(db.AnimalVariety, { foreignKey: 'variety_id', as: 'variety' });
db.AnimalOrder.belongsTo(db.AnimalSpecification, { foreignKey: 'specification_id', as: 'specification' });
db.AnimalOrder.belongsTo(db.AnimalRequirement, { foreignKey: 'requirement_id', as: 'requirement' });
db.AnimalOrder.belongsTo(db.EnvironmentType, { foreignKey: 'environment_id', as: 'environment' });
db.AnimalOrder.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.AnimalOrder.belongsTo(db.Handler, { foreignKey: 'handler_id', as: 'handler' });
db.AnimalOrder.belongsTo(db.Administrator, { foreignKey: 'audit_by', as: 'auditBy' });
db.AnimalOrder.belongsTo(db.Region, { foreignKey: 'province_id', as: 'province' });
db.AnimalOrder.belongsTo(db.Region, { foreignKey: 'city_id', as: 'city' });
db.AnimalOrder.belongsTo(db.Region, { foreignKey: 'district_id', as: 'district' });

// 试剂耗材关联
db.ReagentOrder.belongsTo(db.ReagentBrand, { foreignKey: 'brand_id', as: 'brand' });
db.ReagentOrder.belongsTo(db.ReagentSpecification, { foreignKey: 'specification_id', as: 'specification' });
db.ReagentOrder.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.ReagentOrder.belongsTo(db.Handler, { foreignKey: 'handler_id', as: 'handler' });
db.ReagentOrder.belongsTo(db.Administrator, { foreignKey: 'audit_by', as: 'auditBy' });
db.ReagentOrder.belongsTo(db.Region, { foreignKey: 'province_id', as: 'province' });
db.ReagentOrder.belongsTo(db.Region, { foreignKey: 'city_id', as: 'city' });
db.ReagentOrder.belongsTo(db.Region, { foreignKey: 'district_id', as: 'district' });

module.exports = db;
