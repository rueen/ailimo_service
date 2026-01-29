/**
 * 为动物订购订单表添加数量字段
 * 日期: 2026-01-26
 */

-- 检查并添加 quantity 字段
SELECT COUNT(*) INTO @exist FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'animal_orders'
  AND COLUMN_NAME = 'quantity';

SET @sql = IF(@exist = 0,
  'ALTER TABLE animal_orders ADD COLUMN quantity INT UNSIGNED NOT NULL DEFAULT 1 COMMENT ''数量'' AFTER need_ear_tag',
  'SELECT ''Column quantity already exists in animal_orders'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
