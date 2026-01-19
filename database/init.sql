-- Ailimo Service 数据库初始化脚本
-- 注意：请在执行此脚本前先创建数据库
-- CREATE DATABASE ailimo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ailimo;

-- ==================== 1. 创建所有表 ====================
-- 请参考 docs/数据库表结构设计.md 中的完整建表语句
-- 此处仅包含初始化数据

-- ==================== 2. 默认角色 ====================
INSERT INTO `roles` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, '超级管理员', '拥有所有权限', NOW(), NOW()),
(2, '设备管理员', '负责设备租赁管理', NOW(), NOW()),
(3, '笼位管理员', '负责笼位预约管理', NOW(), NOW()),
(4, '实验操作管理员', '负责实验代操作管理', NOW(), NOW()),
(5, '订购管理员', '负责动物和试剂订购管理', NOW(), NOW());

-- ==================== 3. 插入默认管理员（密码：123456）====================
INSERT INTO `administrators` (`username`, `password`, `remark`, `role_id`, `status`, `created_at`, `updated_at`) 
VALUES ('admin', '$2a$10$IHH0FUqgd4aFQN00MHNqy.Rw/Nzl0OqDXh/T0syiG7bnFE7ygm9LS', '系统管理员', 1, 1, NOW(), NOW());

-- ==================== 4. 设备租赁时间段 ====================
INSERT INTO `equipment_time_slots` (`start_time`, `end_time`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
('09:00:00', '10:00:00', '', 1, 1, NOW(), NOW()),
('10:00:00', '11:00:00', '', 1, 2, NOW(), NOW()),
('11:00:00', '12:00:00', '', 1, 3, NOW(), NOW()),
('12:00:00', '13:00:00', '', 1, 4, NOW(), NOW()),
('13:00:00', '14:00:00', '', 1, 5, NOW(), NOW()),
('14:00:00', '15:00:00', '', 1, 6, NOW(), NOW()),
('15:00:00', '16:00:00', '', 1, 7, NOW(), NOW()),
('16:00:00', '17:00:00', '', 1, 8, NOW(), NOW()),
('17:00:00', '18:00:00', '', 1, 9, NOW(), NOW());

-- ==================== 5. 笼位预约时间段 ====================
INSERT INTO `cage_time_slots` (`start_time`, `end_time`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
('09:00:00', '10:00:00', '', 1, 1, NOW(), NOW()),
('10:00:00', '11:00:00', '', 1, 2, NOW(), NOW()),
('11:00:00', '12:00:00', '', 1, 3, NOW(), NOW()),
('12:00:00', '13:00:00', '', 1, 4, NOW(), NOW()),
('13:00:00', '14:00:00', '', 1, 5, NOW(), NOW()),
('14:00:00', '15:00:00', '', 1, 6, NOW(), NOW()),
('15:00:00', '16:00:00', '', 1, 7, NOW(), NOW()),
('16:00:00', '17:00:00', '', 1, 8, NOW(), NOW()),
('17:00:00', '18:00:00', '', 1, 9, NOW(), NOW());

-- ==================== 6. 实验代操作时间段 ====================
INSERT INTO `experiment_time_slots` (`start_time`, `end_time`, `description`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
('09:00:00', '12:00:00', '上午时段', 1, 1, NOW(), NOW()),
('13:00:00', '18:00:00', '下午时段', 1, 2, NOW(), NOW()),
('18:00:00', '24:00:00', '晚上时段（加班时间需额外付加班费）', 1, 3, NOW(), NOW());

-- ==================== 7. 系统配置（提前预约天数）====================
INSERT INTO `system_configs` (`config_key`, `config_value`, `description`, `created_at`, `updated_at`) VALUES
('equipment_advance_days', '7', '设备租赁提前预约天数（单位：天）', NOW(), NOW()),
('cage_advance_days', '7', '笼位预约提前预约天数（单位：天）', NOW(), NOW()),
('experiment_advance_days', '7', '实验代操作提前预约天数（单位：天）', NOW(), NOW());

-- ==================== 8. 默认公司信息 ====================
INSERT INTO `company_info` (`id`, `content`, `created_at`, `updated_at`) VALUES (
  1,
  JSON_OBJECT(
    'company_name', '',
    'company_address', '',
    'contact_phone', '',
    'email', '',
    'work_time', '',
    'company_intro', '',
    'service_concept', '',
    'banner_image', JSON_ARRAY(),
    'video_url', ''
  ),
  NOW(),
  NOW()
);

-- ==================== 9. 默认环境类型 ====================
INSERT INTO `environment_types` (`name`, `created_at`, `updated_at`) VALUES
('屏障环境', NOW(), NOW()),
('非屏障环境', NOW(), NOW()),
('SPF环境', NOW(), NOW());

-- ==================== 10. 默认动物类型 ====================
INSERT INTO `animal_types` (`name`, `created_at`, `updated_at`) VALUES
('小鼠', NOW(), NOW()),
('大鼠', NOW(), NOW()),
('兔', NOW(), NOW()),
('豚鼠', NOW(), NOW());

-- ==================== 11. 默认负责人 ====================
INSERT INTO `handlers` (`name`, `created_at`, `updated_at`) VALUES
('张三', NOW(), NOW()),
('李四', NOW(), NOW()),
('王五', NOW(), NOW());

-- ==================== 12. 默认组织机构 ====================
INSERT INTO `organizations` (`name`, `created_at`, `updated_at`) VALUES
('浙江大学', NOW(), NOW()),
('复旦大学', NOW(), NOW()),
('上海交通大学', NOW(), NOW());

-- ==================== 13. 默认课题组 ====================
INSERT INTO `research_groups` (`name`, `organization_id`, `created_at`, `updated_at`) VALUES
('肿瘤免疫研究组', 1, NOW(), NOW()),
('神经科学研究组', 1, NOW(), NOW()),
('分子生物学研究组', 2, NOW(), NOW());

-- ==================== 完成 ====================
-- 初始化完成，默认管理员账号：admin 密码：123456
