-- 平台普通用户管理菜单与操作权限。可重复执行，不修改用户业务数据。
SET NAMES utf8mb4;

INSERT IGNORE INTO sys_menu (menu_id,menu_name,parent_id,order_num,path,component,query_param,is_frame,is_cache,menu_type,visible,status,perms,icon,active_menu,ext,create_dept,create_by,create_time,remark)
VALUES (1761400000000002027,'平台用户管理',0,29,'billing/user','billing/user/index','','N','Y','C','0','0','billing:user:list','user','','',1761000000000000103,1761100000000000001,NOW(),'用户端普通用户管理');
INSERT IGNORE INTO sys_menu (menu_id,menu_name,parent_id,order_num,menu_type,visible,status,perms,create_dept,create_by,create_time,remark) VALUES
(1761400000000002106,'调整用户余额',1761400000000002027,1,'F','0','0','billing:user:balance',1761000000000000103,1761100000000000001,NOW(),'调整平台用户余额'),
(1761400000000002107,'封禁解封用户',1761400000000002027,2,'F','0','0','billing:user:status',1761000000000000103,1761100000000000001,NOW(),'封禁时立即注销全部会话'),
(1761400000000002108,'强制用户下线',1761400000000002027,3,'F','0','0','billing:user:logout',1761000000000000103,1761100000000000001,NOW(),'注销平台用户全部会话'),
(1761400000000002109,'删除平台用户',1761400000000002027,4,'F','0','0','billing:user:remove',1761000000000000103,1761100000000000001,NOW(),'逻辑删除并注销全部会话');

-- INSERT IGNORE 不会修正已存在记录，显式更新确保重复发布也能恢复正确名称。
UPDATE sys_menu SET menu_name='平台用户管理', remark='用户端普通用户管理' WHERE menu_id=1761400000000002027;
UPDATE sys_menu SET menu_name='调整用户余额', remark='调整平台用户余额' WHERE menu_id=1761400000000002106;
UPDATE sys_menu SET menu_name='封禁解封用户', remark='封禁时立即注销全部会话' WHERE menu_id=1761400000000002107;
UPDATE sys_menu SET menu_name='强制用户下线', remark='注销平台用户全部会话' WHERE menu_id=1761400000000002108;
UPDATE sys_menu SET menu_name='删除平台用户', remark='逻辑删除并注销全部会话' WHERE menu_id=1761400000000002109;
