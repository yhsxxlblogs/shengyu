-- 紧急修复 animal_types 表的 icon 字段（emoji 被损坏成问号）
-- 执行前请备份！

UPDATE `animal_types` SET `icon` = '🐱' WHERE `type` = 'cat';
UPDATE `animal_types` SET `icon` = '🐶' WHERE `type` = 'dog';
UPDATE `animal_types` SET `icon` = '🐦' WHERE `type` = 'bird';
UPDATE `animal_types` SET `icon` = '🐰' WHERE `type` = 'rabbit';
UPDATE `animal_types` SET `icon` = '🐹' WHERE `type` = 'hamster';
UPDATE `animal_types` SET `icon` = '🐳' WHERE `type` = 'whale';
UPDATE `animal_types` SET `icon` = '🐬' WHERE `type` = 'dolphin';
UPDATE `animal_types` SET `icon` = '🌧️' WHERE `type` = 'rain';
UPDATE `animal_types` SET `icon` = '💨' WHERE `type` = 'wind';

-- 如果有其他类型，请根据实际情况添加
-- 查询当前所有类型：SELECT type, name FROM animal_types;
