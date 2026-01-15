/**
 * 用户端路由
 * 基础路径：/api/h5
 */
const express = require('express');
const router = express.Router();
const { h5Auth, smsLimiter, uploadSingle } = require('../middlewares');

// 控制器
const authController = require('../controllers/h5/authController');
const orderController = require('../controllers/h5/orderController');
const regionController = require('../controllers/common/regionController');

// ==================== 认证相关 ====================
router.post('/auth/send-code', smsLimiter, authController.sendCode);
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/profile', h5Auth, authController.getProfile);
router.post('/auth/logout', h5Auth, authController.logout);

// ==================== 地区管理（公共） ====================
router.get('/regions', regionController.getRegionList);
router.get('/regions/tree', regionController.getRegionTree);
router.get('/regions/:id', regionController.getRegionById);

// ==================== 文件上传 ====================
router.post('/upload/image', h5Auth, uploadSingle('file'), async (req, res, next) => {
  try {
    const { upload } = require('../utils');
    const { directory } = req.body; // 可选的目录参数
    const result = await upload.uploadImage(req.file, directory);
    return res.json({ code: 200, message: '上传成功', data: result });
  } catch (err) {
    next(err);
  }
});

// ==================== 订单提交 ====================
router.post('/equipment-orders', h5Auth, orderController.createEquipmentReservation);
router.post('/cage-orders', h5Auth, orderController.createCageReservation);
router.post('/experiment-orders', h5Auth, orderController.createExperimentOperation);
router.post('/animal-orders', h5Auth, orderController.createAnimalOrder);
router.post('/reagent-orders', h5Auth, orderController.createReagentOrder);

// ==================== 我的订单 ====================
router.get('/my-orders', h5Auth, orderController.getMyOrders);
router.get('/my-orders/:type/:id', h5Auth, orderController.getOrderDetail);

// ==================== 时间段查询 ====================
router.get('/equipment-time-slots', orderController.getEquipmentTimeSlots);
router.get('/cage-time-slots', orderController.getCageTimeSlots);
router.get('/experiment-time-slots', orderController.getExperimentTimeSlots);

// ==================== 基础数据查询 ====================
router.get('/equipment', orderController.getEquipmentList);
router.get('/cages', orderController.getCageList);
router.get('/operation-contents', orderController.getOperationContentList);
router.get('/animal-brands', orderController.getAnimalBrandList);
router.get('/animal-varieties', orderController.getAnimalVarietyList);
router.get('/animal-specifications', orderController.getAnimalSpecificationList);
router.get('/animal-requirements', orderController.getAnimalRequirementList);
router.get('/reagent-brands', orderController.getReagentBrandList);
router.get('/reagent-specifications', orderController.getReagentSpecificationList);
router.get('/organizations', orderController.getOrganizationList);
router.get('/research-groups', orderController.getResearchGroupList);
router.get('/environment-types', orderController.getEnvironmentTypeList);
router.get('/animal-types', orderController.getAnimalTypeList);
router.get('/cage-purposes', orderController.getCagePurposeList);

// ==================== 系统配置 ====================
router.get('/advance-days', orderController.getAdvanceDaysConfigs);

// ==================== 案例和公司信息 ====================
router.get('/cases', orderController.getCaseList);
router.get('/cases/:id', orderController.getCaseDetail);
router.get('/company-info', orderController.getCompanyInfo);

module.exports = router;
