-- User-frontend menu permissions. Safe to run repeatedly.
SET NAMES utf8mb4;
USE ry_vue_plus;

INSERT INTO sys_menu
    (menu_id,menu_name,parent_id,order_num,path,component,query_param,is_frame,is_cache,menu_type,visible,status,perms,icon,active_menu,ext,create_dept,create_by,create_time,remark)
VALUES
    (1761400000000002200,'通用文案',1761400000000002000,20,'','','','N','Y','F','0','0','aigc:copywriting:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002201,'AI视频',1761400000000002000,21,'','','','N','Y','F','0','0','aigc:video:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002202,'AI音乐',1761400000000002000,22,'','','','N','Y','F','0','0','aigc:music:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002203,'声音克隆',1761400000000002000,23,'','','','N','Y','F','0','0','aigc:voiceClone:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002204,'形象克隆',1761400000000002000,24,'','','','N','Y','F','0','0','aigc:avatarClone:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002205,'人脸融合',1761400000000002000,25,'','','','N','Y','F','0','0','aigc:faceMerge:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002206,'照片数字人',1761400000000002000,26,'','','','N','Y','F','0','0','aigc:photoDigitalHuman:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002207,'口播文案',1761400000000002000,27,'','','','N','Y','F','0','0','aigc:spokenCopy:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002208,'爆款口播',1761400000000002000,28,'','','','N','Y','F','0','0','aigc:viralSpokenCopy:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002209,'小红书笔记',1761400000000002000,29,'','','','N','Y','F','0','0','aigc:xiaohongshuNote:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002210,'文案改写',1761400000000002000,30,'','','','N','Y','F','0','0','aigc:rewrite:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002211,'标题生成',1761400000000002000,31,'','','','N','Y','F','0','0','aigc:title:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002212,'翻译文案',1761400000000002000,32,'','','','N','Y','F','0','0','aigc:translate:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002213,'情感文案',1761400000000002000,33,'','','','N','Y','F','0','0','aigc:emotion:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002214,'打油诗',1761400000000002000,34,'','','','N','Y','F','0','0','aigc:poem:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002215,'歌词创作',1761400000000002000,35,'','','','N','Y','F','0','0','aigc:lyrics:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002216,'通用写作',1761400000000002000,36,'','','','N','Y','F','0','0','aigc:general:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002217,'智能写作',1761400000000002000,37,'','','','N','Y','F','0','0','aigc:writing:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002218,'营销文案',1761400000000002000,38,'','','','N','Y','F','0','0','aigc:marketing:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002219,'文案仿写',1761400000000002000,39,'','','','N','Y','F','0','0','aigc:imitate:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002220,'AI配音',1761400000000002000,40,'','','','N','Y','F','0','0','aigc:tts:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002221,'我的素材',1761400000000002000,41,'','','','N','Y','F','0','0','aigc:materials:view','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002222,'模板剪辑',1761400000000002000,42,'','','','N','Y','F','0','0','aigc:templateEdit:run','#','','',1761000000000000103,1761100000000000001,NOW(),'用户端菜单权限'),
    (1761400000000002223,'GPT 图片生成',1761400000000002000,43,'','','','N','Y','F','0','0','aigc:gptImage:view','#','','',1761000000000000103,1761100000000000001,NOW(),'提示词生图、选图修改、模型切换')
ON DUPLICATE KEY UPDATE
    menu_name=VALUES(menu_name),perms=VALUES(perms),status='0',remark=VALUES(remark);

-- The default app role receives every current user-frontend permission.
INSERT IGNORE INTO sys_role_menu(role_id,menu_id)
SELECT 1761300000000000010,menu_id
FROM sys_menu
WHERE menu_id=1761400000000002000 OR perms LIKE 'aigc:%' OR perms='system:oss:upload';

-- The GPT-image feature has its own billing/model configuration and menu permission.
INSERT INTO aigc_feature_config(feature_code,feature_name,menu_permission,credits_per_call,enabled)
VALUES ('gpt_image','GPT 图片生成','aigc:gptImage:view',1,'1')
ON DUPLICATE KEY UPDATE feature_name=VALUES(feature_name),menu_permission=VALUES(menu_permission),enabled='1';
UPDATE aigc_feature_config f
JOIN aigc_gateway_model m ON m.model_code='gpt-image-2' AND m.capability='draw' AND m.enabled='1'
JOIN aigc_gateway g ON g.id=m.gateway_id AND g.enabled='1'
SET f.gateway_model_id=m.id
WHERE f.feature_code='gpt_image';

-- Existing users with per-user menu roles should receive the new menu as well.
INSERT IGNORE INTO sys_role_menu(role_id,menu_id)
SELECT DISTINCT ur.role_id,m.menu_id
FROM sys_user u
JOIN sys_user_role ur ON ur.user_id=u.user_id
JOIN sys_role r ON r.role_id=ur.role_id AND r.del_flag='0'
JOIN sys_menu m ON m.perms='aigc:gptImage:view' AND m.status='0'
WHERE u.user_type='app_user' AND u.del_flag='0' AND r.role_key LIKE 'app_user_%';
