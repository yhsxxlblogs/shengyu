-- 为 sounds 表添加审核相关字段

-- 添加 visible 字段（如果存在则忽略）
SET @dbname = DATABASE();
SET @tablename = 'sounds';
SET @columnname = 'visible';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT "Column already exists"',
  'ALTER TABLE sounds ADD COLUMN visible TINYINT DEFAULT 1'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加 review_status 字段（如果存在则忽略）
SET @columnname = 'review_status';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT "Column already exists"',
  "ALTER TABLE sounds ADD COLUMN review_status ENUM('none', 'pending', 'approved', 'rejected') DEFAULT 'none'"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 添加 is_official 字段（如果存在则忽略）
SET @columnname = 'is_official';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT "Column already exists"',
  'ALTER TABLE sounds ADD COLUMN is_official TINYINT DEFAULT 0'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 更新现有数据：将所有已有声音的 review_status 设置为 'none'
UPDATE sounds SET review_status = 'none' WHERE review_status IS NULL;

-- 更新现有数据：将所有已有声音的 is_official 设置为 0
UPDATE sounds SET is_official = 0 WHERE is_official IS NULL;

-- 更新现有数据：将所有已有声音的 visible 设置为 1
UPDATE sounds SET visible = 1 WHERE visible IS NULL;

SELECT 'Migration completed successfully' AS result;
