-- 添加 sounds 表缺失的字段
-- 用于支持系统声音的 is_active 和 description 字段

-- 添加 is_active 字段
ALTER TABLE sounds
ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NULL DEFAULT 1 COMMENT '是否启用：1-启用，0-禁用';

-- 添加 description 字段
ALTER TABLE sounds
ADD COLUMN IF NOT EXISTS description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '声音描述';

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_sounds_is_active ON sounds(is_active);
