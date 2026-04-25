-- 添加 messages 表的 is_system 字段
-- 用于标记系统消息（如关注提示）

-- 检查字段是否存在
SET @dbname = DATABASE();
SET @tablename = 'messages';
SET @columnname = 'is_system';

SET @exists = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = @dbname
    AND table_name = @tablename
    AND column_name = @columnname
);

-- 如果字段不存在则添加
SET @sql = IF(@exists = 0, 
    'ALTER TABLE messages ADD COLUMN is_system tinyint(1) NULL DEFAULT FALSE COMMENT "是否为系统消息"',
    'SELECT "Column already exists" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 验证结果
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
FROM information_schema.columns
WHERE table_schema = DATABASE()
AND table_name = 'messages'
AND column_name = 'is_system';
