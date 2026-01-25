-- =============================================
-- 试剂耗材订购表结构调整迁移脚本
-- 创建日期: 2026-01-25
-- 说明: 
--   1. 移除 reagent_brands 和 reagent_specifications 表
--   2. 调整 reagent_orders 表,将品牌和规格从关联改为文本字段
--   3. 此脚本适用于无历史数据的情况
--   4. 支持重复执行（幂等性）
-- =============================================

-- 开始事务
START TRANSACTION;

-- =============================================
-- 第一步: 调整 reagent_orders 表结构
-- =============================================

-- 1.1 添加新的文本字段（如果不存在）
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'reagent_orders' 
    AND COLUMN_NAME = 'brand_name'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE `reagent_orders` ADD COLUMN `brand_name` VARCHAR(200) NOT NULL COMMENT ''品牌名称'' AFTER `name`',
  'SELECT "Column brand_name already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'reagent_orders' 
    AND COLUMN_NAME = 'specification_name'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE `reagent_orders` ADD COLUMN `specification_name` VARCHAR(200) NOT NULL COMMENT ''规格名称'' AFTER `brand_name`',
  'SELECT "Column specification_name already exists"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.2 删除外键约束（如果存在）
SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'reagent_orders' 
    AND COLUMN_NAME = 'brand_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL, 
  CONCAT('ALTER TABLE `reagent_orders` DROP FOREIGN KEY `', @constraint_name, '`'),
  'SELECT "No foreign key constraint for brand_id"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @constraint_name = (
  SELECT CONSTRAINT_NAME 
  FROM information_schema.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'reagent_orders' 
    AND COLUMN_NAME = 'specification_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL, 
  CONCAT('ALTER TABLE `reagent_orders` DROP FOREIGN KEY `', @constraint_name, '`'),
  'SELECT "No foreign key constraint for specification_id"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.3 删除索引（如果存在）
SET @index_exists = (
  SELECT COUNT(*) 
  FROM information_schema.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'reagent_orders' 
    AND INDEX_NAME = 'idx_brand'
);

SET @sql = IF(@index_exists > 0,
  'ALTER TABLE `reagent_orders` DROP INDEX `idx_brand`',
  'SELECT "Index idx_brand does not exist"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1.4 删除旧字段（如果存在）
SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'reagent_orders' 
    AND COLUMN_NAME = 'brand_id'
);

SET @sql = IF(@column_exists > 0,
  'ALTER TABLE `reagent_orders` DROP COLUMN `brand_id`',
  'SELECT "Column brand_id does not exist"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'reagent_orders' 
    AND COLUMN_NAME = 'specification_id'
);

SET @sql = IF(@column_exists > 0,
  'ALTER TABLE `reagent_orders` DROP COLUMN `specification_id`',
  'SELECT "Column specification_id does not exist"'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================
-- 第二步: 删除品牌表和规格表
-- =============================================

-- 2.1 删除试剂耗材品牌表（如果存在）
DROP TABLE IF EXISTS `reagent_brands`;

-- 2.2 删除试剂耗材规格表（如果存在）
DROP TABLE IF EXISTS `reagent_specifications`;

-- 提交事务
COMMIT;

-- =============================================
-- 迁移完成提示
-- =============================================
SELECT '迁移成功完成！' AS message;
SELECT 'reagent_orders 表已更新：brand_name 和 specification_name 字段已添加' AS status;
SELECT 'reagent_brands 和 reagent_specifications 表已删除' AS status;
-- =============================================
