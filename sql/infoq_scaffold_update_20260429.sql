SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO `sys_menu` (
    `menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query_param`,
    `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`,
    `create_dept`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`
)
SELECT
    2026042910, '服务监控', 2, 4, 'server', 'monitor/server/index', '',
    1, 0, 'C', '0', '0', 'monitor:server:list', 'server',
    103, 1, NOW(), 1, NOW(), '服务监控菜单'
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu` WHERE `menu_id` = 2026042910);

INSERT INTO `sys_menu` (
    `menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query_param`,
    `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`,
    `create_dept`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`
)
SELECT
    2026042920, '连接池监控', 2, 6, 'dataSource', 'monitor/dataSource/index', '',
    1, 0, 'C', '0', '0', 'monitor:dataSource:list', 'monitor',
    103, 1, NOW(), 1, NOW(), 'Hikari 连接池监控菜单'
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu` WHERE `menu_id` = 2026042920);

INSERT INTO `sys_menu` (
    `menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query_param`,
    `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`,
    `create_dept`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`
)
SELECT
    2026042911, '服务监控查询', 2026042910, 1, '#', '', '',
    1, 0, 'F', '0', '0', 'monitor:server:list', '#',
    103, 1, NOW(), 1, NOW(), ''
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu` WHERE `menu_id` = 2026042911);

INSERT INTO `sys_menu` (
    `menu_id`, `menu_name`, `parent_id`, `order_num`, `path`, `component`, `query_param`,
    `is_frame`, `is_cache`, `menu_type`, `visible`, `status`, `perms`, `icon`,
    `create_dept`, `create_by`, `create_time`, `update_by`, `update_time`, `remark`
)
SELECT
    2026042921, '连接池监控查询', 2026042920, 1, '#', '', '',
    1, 0, 'F', '0', '0', 'monitor:dataSource:list', '#',
    103, 1, NOW(), 1, NOW(), ''
WHERE NOT EXISTS (SELECT 1 FROM `sys_menu` WHERE `menu_id` = 2026042921);

INSERT INTO `sys_role_menu` (`role_id`, `menu_id`)
SELECT 1, `sys_menu`.`menu_id`
FROM `sys_menu`
WHERE `sys_menu`.`menu_id` IN (2026042910, 2026042911, 2026042920, 2026042921)
  AND NOT EXISTS (
    SELECT 1
    FROM `sys_role_menu` rm
    WHERE rm.`role_id` = 1
      AND rm.`menu_id` = `sys_menu`.`menu_id`
  );

INSERT INTO `sys_role_menu` (`role_id`, `menu_id`)
SELECT 3, 2
WHERE EXISTS (
    SELECT 1
    FROM `sys_menu`
    WHERE `menu_id` = 2
)
  AND NOT EXISTS (
    SELECT 1
    FROM `sys_role_menu` rm
    WHERE rm.`role_id` = 3
      AND rm.`menu_id` = 2
  );

INSERT INTO `sys_role_menu` (`role_id`, `menu_id`)
SELECT 3, `sys_menu`.`menu_id`
FROM `sys_menu`
WHERE `sys_menu`.`menu_id` IN (2026042910, 2026042911)
  AND NOT EXISTS (
    SELECT 1
    FROM `sys_role_menu` rm
    WHERE rm.`role_id` = 3
      AND rm.`menu_id` = `sys_menu`.`menu_id`
  );

DELETE FROM `sys_role_menu`
WHERE `role_id` = 3
  AND `menu_id` IN (2026042920, 2026042921);

SET FOREIGN_KEY_CHECKS = 1;
