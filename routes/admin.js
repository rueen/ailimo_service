/**
 * 管理端路由
 * 基础路径：/api/support
 */
const express = require('express');
const router = express.Router();
const { adminAuth, permission, loginLimiter, uploadSingle } = require('../middlewares');

// 控制器
const authController = require('../controllers/admin/authController');
const userController = require('../controllers/admin/userController');
const equipmentController = require('../controllers/admin/equipmentController');
const cageController = require('../controllers/admin/cageController');
const experimentController = require('../controllers/admin/experimentController');
const animalOrderController = require('../controllers/admin/animalOrderController');
const reagentOrderController = require('../controllers/admin/reagentOrderController');
const contentController = require('../controllers/admin/contentController');
const configController = require('../controllers/admin/configController');
const statisticsController = require('../controllers/admin/statisticsController');
const regionController = require('../controllers/common/regionController');

// ==================== 认证相关 ====================
router.post('/auth/login', loginLimiter, authController.login);
router.get('/auth/profile', adminAuth, authController.getProfile);
router.put('/auth/password', adminAuth, authController.changePassword);
router.post('/auth/logout', adminAuth, authController.logout);

// ==================== 管理员管理 ====================
router.get('/administrators', adminAuth, permission('administrator:list'), authController.getAdministratorList);
router.get('/administrators/options', adminAuth, authController.getAdministratorOptions);
router.get('/administrators/:id', adminAuth, permission('administrator:detail'), authController.getAdministratorDetail);
router.post('/administrators', adminAuth, permission('administrator:create'), authController.createAdministrator);
router.put('/administrators/:id', adminAuth, permission('administrator:update'), authController.updateAdministrator);
router.delete('/administrators/:id', adminAuth, permission('administrator:delete'), authController.deleteAdministrator);

// ==================== 角色管理 ====================
router.get('/roles', adminAuth, permission('role:list'), authController.getRoleList);
router.get('/roles/:id', adminAuth, permission('role:detail'), authController.getRoleDetail);
router.post('/roles', adminAuth, permission('role:create'), authController.createRole);
router.put('/roles/:id', adminAuth, permission('role:update'), authController.updateRole);
router.delete('/roles/:id', adminAuth, permission('role:delete'), authController.deleteRole);

// ==================== 权限管理 ====================
router.get('/permissions', adminAuth, permission('permission:list'), authController.getPermissionList);

// ==================== 用户管理 ====================
router.get('/users', adminAuth, permission('user:list'), userController.getUserList);
router.get('/users/:id', adminAuth, permission('user:detail'), userController.getUserDetail);
router.post('/users', adminAuth, permission('user:create'), userController.createUser);
router.put('/users/:id', adminAuth, permission('user:update'), userController.updateUser);
router.put('/users/:id/audit', adminAuth, permission('user:audit'), userController.auditUser);
router.put('/users/:id/status', adminAuth, permission('user:update'), userController.toggleUserStatus);
router.delete('/users/:id', adminAuth, permission('user:delete'), userController.deleteUser);

// 组织机构
router.get('/organizations', adminAuth, userController.getOrganizationList);
router.get('/organizations/options', adminAuth, userController.getOrganizationOptions);
router.post('/organizations', adminAuth, permission('organization:create'), userController.createOrganization);
router.put('/organizations/:id', adminAuth, permission('organization:update'), userController.updateOrganization);
router.delete('/organizations/:id', adminAuth, permission('organization:delete'), userController.deleteOrganization);

// 课题组
router.get('/research-groups', adminAuth, userController.getResearchGroupList);
router.get('/research-groups/options', adminAuth, userController.getResearchGroupOptions);
router.post('/research-groups', adminAuth, permission('research_group:create'), userController.createResearchGroup);
router.put('/research-groups/:id', adminAuth, permission('research_group:update'), userController.updateResearchGroup);
router.delete('/research-groups/:id', adminAuth, permission('research_group:delete'), userController.deleteResearchGroup);

// ==================== 设备预约 ====================
// 设备管理
router.get('/equipment', adminAuth, permission('equipment:list'), equipmentController.getEquipmentList);
router.get('/equipment/options', adminAuth, equipmentController.getEquipmentOptions);
router.get('/equipment/:id', adminAuth, permission('equipment:detail'), equipmentController.getEquipmentDetail);
router.post('/equipment', adminAuth, permission('equipment:create'), equipmentController.createEquipment);
router.put('/equipment/:id', adminAuth, permission('equipment:update'), equipmentController.updateEquipment);
router.delete('/equipment/:id', adminAuth, permission('equipment:delete'), equipmentController.deleteEquipment);

// 设备预约订单
router.get('/equipment-reservations', adminAuth, permission('equipment_reservation:list'), equipmentController.getReservationList);
router.get('/equipment-reservations/:id', adminAuth, permission('equipment_reservation:detail'), equipmentController.getReservationDetail);
router.post('/equipment-reservations', adminAuth, permission('equipment_reservation:create'), equipmentController.createReservation);
router.put('/equipment-reservations/:id', adminAuth, permission('equipment_reservation:update'), equipmentController.updateReservation);
router.put('/equipment-reservations/:id/audit', adminAuth, permission('equipment_reservation:audit'), equipmentController.auditReservation);
router.put('/equipment-reservations/:id/complete', adminAuth, permission('equipment_reservation:complete'), equipmentController.completeReservation);
router.put('/equipment-reservations/:id/cancel', adminAuth, permission('equipment_reservation:cancel'), equipmentController.cancelReservation);

// 设备时间段
router.get('/equipment-time-slots', adminAuth, equipmentController.getTimeSlotList);
router.get('/equipment-time-slots/options', adminAuth, equipmentController.getTimeSlotOptions);
router.post('/equipment-time-slots', adminAuth, permission('equipment_time_slot:create'), equipmentController.createTimeSlot);
router.put('/equipment-time-slots/:id', adminAuth, permission('equipment_time_slot:update'), equipmentController.updateTimeSlot);
router.delete('/equipment-time-slots/:id', adminAuth, permission('equipment_time_slot:delete'), equipmentController.deleteTimeSlot);
router.get('/equipment/:id/available-slots', adminAuth, equipmentController.getAvailableSlots);
router.get('/equipment-available-slots', adminAuth, equipmentController.getAvailableSlots);

// ==================== 笼位预约 ====================
// 笼位管理
router.get('/cages/environments-by-animal-type', adminAuth, cageController.getEnvironmentsByAnimalType);
router.get('/cages/available-quantity', adminAuth, cageController.getCageAvailableQuantity);
router.get('/cages', adminAuth, permission('cage:list'), cageController.getCageList);
router.get('/cages/:id', adminAuth, permission('cage:detail'), cageController.getCageDetail);
router.post('/cages', adminAuth, permission('cage:create'), cageController.createCage);
router.put('/cages/:id', adminAuth, permission('cage:update'), cageController.updateCage);
router.delete('/cages/:id', adminAuth, permission('cage:delete'), cageController.deleteCage);

// 笼位预约订单
router.get('/cage-reservations', adminAuth, permission('cage_reservation:list'), cageController.getReservationList);
router.get('/cage-reservations/:id', adminAuth, permission('cage_reservation:detail'), cageController.getReservationDetail);
router.post('/cage-reservations', adminAuth, permission('cage_reservation:create'), cageController.createReservation);
router.put('/cage-reservations/:id', adminAuth, permission('cage_reservation:update'), cageController.updateReservation);
router.put('/cage-reservations/:id/audit', adminAuth, permission('cage_reservation:audit'), cageController.auditReservation);
router.put('/cage-reservations/:id/complete', adminAuth, permission('cage_reservation:complete'), cageController.completeReservation);
router.put('/cage-reservations/:id/cancel', adminAuth, permission('cage_reservation:cancel'), cageController.cancelReservation);

// 笼位用途
router.get('/cage-purposes', adminAuth, cageController.getPurposeList);
router.get('/cage-purposes/options', adminAuth, cageController.getPurposeOptions);
router.post('/cage-purposes', adminAuth, permission('cage_purpose:create'), cageController.createPurpose);
router.put('/cage-purposes/:id', adminAuth, permission('cage_purpose:update'), cageController.updatePurpose);
router.delete('/cage-purposes/:id', adminAuth, permission('cage_purpose:delete'), cageController.deletePurpose);

// ==================== 实验代操作 ====================
// 实验操作订单
router.get('/experiment-operations', adminAuth, permission('experiment_operation:list'), experimentController.getOperationList);
router.get('/experiment-operations/:id', adminAuth, permission('experiment_operation:detail'), experimentController.getOperationDetail);
router.post('/experiment-operations', adminAuth, permission('experiment_operation:create'), experimentController.createOperation);
router.put('/experiment-operations/:id', adminAuth, permission('experiment_operation:update'), experimentController.updateOperation);
router.put('/experiment-operations/:id/audit', adminAuth, permission('experiment_operation:audit'), experimentController.auditOperation);
router.put('/experiment-operations/:id/complete', adminAuth, permission('experiment_operation:complete'), experimentController.completeOperation);
router.put('/experiment-operations/:id/cancel', adminAuth, permission('experiment_operation:cancel'), experimentController.cancelOperation);

// 操作内容
router.get('/operation-contents', adminAuth, experimentController.getOperationContentList);
router.get('/operation-contents/options', adminAuth, experimentController.getOperationContentOptions);
router.post('/operation-contents', adminAuth, permission('operation_content:create'), experimentController.createOperationContent);
router.put('/operation-contents/:id', adminAuth, permission('operation_content:update'), experimentController.updateOperationContent);
router.delete('/operation-contents/:id', adminAuth, permission('operation_content:delete'), experimentController.deleteOperationContent);

// 实验时间段
router.get('/experiment-time-slots', adminAuth, experimentController.getTimeSlotList);
router.get('/experiment-time-slots/options', adminAuth, experimentController.getTimeSlotOptions);
router.post('/experiment-time-slots', adminAuth, permission('experiment_time_slot:create'), experimentController.createTimeSlot);
router.put('/experiment-time-slots/:id', adminAuth, permission('experiment_time_slot:update'), experimentController.updateTimeSlot);
router.delete('/experiment-time-slots/:id', adminAuth, permission('experiment_time_slot:delete'), experimentController.deleteTimeSlot);

// ==================== 动物订购 ====================
// 动物订单
router.get('/animal-orders', adminAuth, permission('animal_order:list'), animalOrderController.getOrderList);
router.get('/animal-orders/:id', adminAuth, permission('animal_order:detail'), animalOrderController.getOrderDetail);
router.post('/animal-orders', adminAuth, permission('animal_order:create'), animalOrderController.createOrder);
router.put('/animal-orders/:id', adminAuth, permission('animal_order:update'), animalOrderController.updateOrder);
router.put('/animal-orders/:id/audit', adminAuth, permission('animal_order:audit'), animalOrderController.auditOrder);
router.put('/animal-orders/:id/complete', adminAuth, permission('animal_order:complete'), animalOrderController.completeOrder);
router.put('/animal-orders/:id/cancel', adminAuth, permission('animal_order:cancel'), animalOrderController.cancelOrder);

// 动物品牌
router.get('/animal-brands', adminAuth, animalOrderController.getBrandList);
router.get('/animal-brands/options', adminAuth, animalOrderController.getBrandOptions);
router.post('/animal-brands', adminAuth, permission('animal_brand:create'), animalOrderController.createBrand);
router.put('/animal-brands/:id', adminAuth, permission('animal_brand:update'), animalOrderController.updateBrand);
router.delete('/animal-brands/:id', adminAuth, permission('animal_brand:delete'), animalOrderController.deleteBrand);

// 动物品系
router.get('/animal-varieties', adminAuth, animalOrderController.getVarietyList);
router.get('/animal-varieties/options', adminAuth, animalOrderController.getVarietyOptions);
router.post('/animal-varieties', adminAuth, permission('animal_variety:create'), animalOrderController.createVariety);
router.put('/animal-varieties/:id', adminAuth, permission('animal_variety:update'), animalOrderController.updateVariety);
router.delete('/animal-varieties/:id', adminAuth, permission('animal_variety:delete'), animalOrderController.deleteVariety);

// 动物规格
router.get('/animal-specifications', adminAuth, animalOrderController.getSpecificationList);
router.get('/animal-specifications/options', adminAuth, animalOrderController.getSpecificationOptions);
router.post('/animal-specifications', adminAuth, permission('animal_specification:create'), animalOrderController.createSpecification);
router.put('/animal-specifications/:id', adminAuth, permission('animal_specification:update'), animalOrderController.updateSpecification);
router.delete('/animal-specifications/:id', adminAuth, permission('animal_specification:delete'), animalOrderController.deleteSpecification);

// 动物需求
router.get('/animal-requirements', adminAuth, animalOrderController.getRequirementList);
router.get('/animal-requirements/options', adminAuth, animalOrderController.getRequirementOptions);
router.post('/animal-requirements', adminAuth, permission('animal_requirement:create'), animalOrderController.createRequirement);
router.put('/animal-requirements/:id', adminAuth, permission('animal_requirement:update'), animalOrderController.updateRequirement);
router.delete('/animal-requirements/:id', adminAuth, permission('animal_requirement:delete'), animalOrderController.deleteRequirement);

// ==================== 试剂耗材订购 ====================
// 试剂订单
router.get('/reagent-orders', adminAuth, permission('reagent_order:list'), reagentOrderController.getOrderList);
router.get('/reagent-orders/:id', adminAuth, permission('reagent_order:detail'), reagentOrderController.getOrderDetail);
router.post('/reagent-orders', adminAuth, permission('reagent_order:create'), reagentOrderController.createOrder);
router.put('/reagent-orders/:id', adminAuth, permission('reagent_order:update'), reagentOrderController.updateOrder);
router.put('/reagent-orders/:id/audit', adminAuth, permission('reagent_order:audit'), reagentOrderController.auditOrder);
router.put('/reagent-orders/:id/complete', adminAuth, permission('reagent_order:complete'), reagentOrderController.completeOrder);
router.put('/reagent-orders/:id/cancel', adminAuth, permission('reagent_order:cancel'), reagentOrderController.cancelOrder);

// 试剂品牌
router.get('/reagent-brands', adminAuth, reagentOrderController.getBrandList);
router.get('/reagent-brands/options', adminAuth, reagentOrderController.getBrandOptions);
router.post('/reagent-brands', adminAuth, permission('reagent_brand:create'), reagentOrderController.createBrand);
router.put('/reagent-brands/:id', adminAuth, permission('reagent_brand:update'), reagentOrderController.updateBrand);
router.delete('/reagent-brands/:id', adminAuth, permission('reagent_brand:delete'), reagentOrderController.deleteBrand);

// 试剂规格
router.get('/reagent-specifications', adminAuth, reagentOrderController.getSpecificationList);
router.get('/reagent-specifications/options', adminAuth, reagentOrderController.getSpecificationOptions);
router.post('/reagent-specifications', adminAuth, permission('reagent_specification:create'), reagentOrderController.createSpecification);
router.put('/reagent-specifications/:id', adminAuth, permission('reagent_specification:update'), reagentOrderController.updateSpecification);
router.delete('/reagent-specifications/:id', adminAuth, permission('reagent_specification:delete'), reagentOrderController.deleteSpecification);

// ==================== 内容管理 ====================
// 案例管理
router.get('/cases', adminAuth, permission('case:list'), contentController.getCaseList);
router.get('/cases/:id', adminAuth, permission('case:detail'), contentController.getCaseDetail);
router.post('/cases', adminAuth, permission('case:create'), contentController.createCase);
router.put('/cases/:id', adminAuth, permission('case:update'), contentController.updateCase);
router.delete('/cases/:id', adminAuth, permission('case:delete'), contentController.deleteCase);

// 公司信息
router.get('/company-info', adminAuth, permission('company_info:view'), contentController.getCompanyInfo);
router.put('/company-info', adminAuth, permission('company_info:update'), contentController.updateCompanyInfo);

// 负责人管理
router.get('/handlers', adminAuth, permission('handler:list'), contentController.getHandlerList);
router.get('/handlers/options', adminAuth, contentController.getHandlerOptions);
router.get('/handlers/statistics', adminAuth, permission('handler:statistics'), contentController.getHandlerStatistics);
router.post('/handlers', adminAuth, permission('handler:create'), contentController.createHandler);
router.put('/handlers/:id', adminAuth, permission('handler:update'), contentController.updateHandler);
router.delete('/handlers/:id', adminAuth, permission('handler:delete'), contentController.deleteHandler);

// 环境类型管理
router.get('/environment-types', adminAuth, contentController.getEnvironmentTypeList);
router.get('/environment-types/options', adminAuth, contentController.getEnvironmentTypeOptions);
router.post('/environment-types', adminAuth, permission('environment_type:create'), contentController.createEnvironmentType);
router.put('/environment-types/:id', adminAuth, permission('environment_type:update'), contentController.updateEnvironmentType);
router.delete('/environment-types/:id', adminAuth, permission('environment_type:delete'), contentController.deleteEnvironmentType);

// 动物类型管理
router.get('/animal-types', adminAuth, contentController.getAnimalTypeList);
router.get('/animal-types/options', adminAuth, contentController.getAnimalTypeOptions);
router.post('/animal-types', adminAuth, permission('animal_type:create'), contentController.createAnimalType);
router.put('/animal-types/:id', adminAuth, permission('animal_type:update'), contentController.updateAnimalType);
router.delete('/animal-types/:id', adminAuth, permission('animal_type:delete'), contentController.deleteAnimalType);

// ==================== 系统配置 ====================
router.get('/system-configs', adminAuth, configController.getAllConfigs);
router.get('/system-configs/:key', adminAuth, configController.getConfig);
router.put('/system-configs/:key', adminAuth, permission('system_config:update'), configController.updateConfig);
router.get('/advance-days', adminAuth, configController.getAdvanceDaysConfigs);

// ==================== 数据统计 ====================
router.get('/statistics/overview', adminAuth, permission('statistics:overview'), statisticsController.getOverviewStatistics);

// ==================== 地区管理（公共） ====================
router.get('/regions', adminAuth, regionController.getRegionList);
router.get('/regions/tree', adminAuth, regionController.getRegionTree);
router.get('/regions/:id', adminAuth, regionController.getRegionById);

// ==================== 文件上传 ====================
router.post('/upload/image', adminAuth, uploadSingle('file'), async (req, res, next) => {
  try {
    const { upload } = require('../utils');
    const { directory } = req.body; // 可选的目录参数，如 'equipment', 'cage' 等
    const result = await upload.uploadImage(req.file, directory);
    return res.json({ code: 200, message: '上传成功', data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
