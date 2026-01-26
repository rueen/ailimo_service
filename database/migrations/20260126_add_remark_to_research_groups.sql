/**
 * 为课题组表添加备注字段
 * 日期: 2026-01-26
 */

-- 检查并添加 remark 字段
SELECT COUNT(*) INTO @exist FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'research_groups' 
  AND COLUMN_NAME = 'remark';

SET @sql = IF(@exist = 0, 
  'ALTER TABLE research_groups ADD COLUMN remark VARCHAR(500) NULL COMMENT ''备注'' AFTER department_id',
  'SELECT ''Column remark already exists in research_groups'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
