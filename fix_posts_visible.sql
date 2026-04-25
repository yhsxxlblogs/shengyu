-- 修复 posts 表缺少 visible 字段的问题
-- 执行前请备份数据库！

-- 检查并添加 visible 字段
SET @dbname = DATABASE();
SET @tablename = 'posts';
SET @columnname = 'visible';

SET @sql = CONCAT(
    'ALTER TABLE ', @tablename,
    ' ADD COLUMN ', @columnname, ' tinyint(1) NULL DEFAULT 1',
    ' COMMENT ''是否可见：1-可见，0-隐藏'''
);

SET @exists = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @dbname
    AND table_name = @tablename
    AND column_name = @columnname
);

SET @sql = IF(@exists = 0, @sql, 'SELECT ''Column already exists'' as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 更新现有数据，确保所有记录都有 visible = 1
UPDATE posts SET visible = 1 WHERE visible IS NULL;

-- 验证结果
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM information_schema.columns
WHERE table_schema = DATABASE()
AND table_name = 'posts'
AND column_name = 'visible';
