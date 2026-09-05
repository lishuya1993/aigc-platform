-- 用户日用量统计菜单与按钮权限。可重复执行，不会修改现有业务数据。
INSERT IGNORE INTO sys_menu (menu_id,menu_name,parent_id,order_num,path,component,query_param,is_frame,is_cache,menu_type,visible,status,perms,icon,active_menu,ext,create_dept,create_by,create_time,remark)
VALUES (1761400000000002026,'用户用量统计',0,36,'billing/usage','billing/usage/index','','N','Y','C','0','0','billing:usage:list','chart-line','','',1761000000000000103,1761100000000000001,NOW(),'按日用户消费与充值统计');
INSERT IGNORE INTO sys_menu (menu_id,menu_name,parent_id,order_num,menu_type,visible,status,perms,create_dept,create_by,create_time)
VALUES (1761400000000002105,'发送用量日报',1761400000000002026,1,'F','0','0','billing:usage:email',1761000000000000103,1761100000000000001,NOW());
