/**
 * 创建笼位房间表并为笼位相关表添加 room_id 字段
 * 日期: 2026-01-26
 */

-- 1. 创建笼位房间表
CREATE TABLE IF NOT EXISTS `cage_rooms` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '房间ID',
  `name` VARCHAR(100) NOT NULL COMMENT '房间名称',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='笼位房间表';

-- 2. 为 cages 表添加 room_id 字段
SELECT COUNT(*) INTO @exist FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'cages'
  AND COLUMN_NAME = 'room_id';

SET @sql = IF(@exist = 0,
  'ALTER TABLE cages ADD COLUMN room_id INT UNSIGNED NULL COMMENT ''房间ID'' AFTER environment_id, ADD INDEX idx_room (room_id)',
  'SELECT ''Column room_id already exists in cages'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 为 cage_reservations 表添加 room_id 字段
SELECT COUNT(*) INTO @exist FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'cage_reservations'
  AND COLUMN_NAME = 'room_id';

SET @sql = IF(@exist = 0,
  'ALTER TABLE cage_reservations ADD COLUMN room_id INT UNSIGNED NULL COMMENT ''房间ID'' AFTER environment_id, ADD INDEX idx_room (room_id)',
  'SELECT ''Column room_id already exists in cage_reservations'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
