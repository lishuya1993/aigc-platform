-- AIGC 平台业务菜单与收费初始化，导入后由若依后台继续编辑权限和可见性。
SET @aigc_parent = 1761400000000002000;
INSERT IGNORE INTO sys_menu (menu_id,menu_name,parent_id,order_num,path,component,query_param,is_frame,is_cache,menu_type,visible,status,perms,icon,active_menu,ext,create_dept,create_by,create_time,remark)
VALUES (@aigc_parent,'AIGC创作',0,20,'aigc','Layout','','N','Y','M','0','0','','sparkles','','',1761000000000000103,1761100000000000001,NOW(),'AIGC创作');
INSERT IGNORE INTO sys_menu (menu_id,menu_name,parent_id,order_num,path,component,query_param,is_frame,is_cache,menu_type,visible,status,perms,icon,active_menu,ext,create_dept,create_by,create_time,remark) VALUES
 (1761400000000002001,'智能文案',@aigc_parent,1,'copywriting','aigc/copywriting/index','','N','Y','C','0','0','aigc:copywriting:view','edit','','',1761000000000000103,1761100000000000001,NOW(),'智能文案'),
 (1761400000000002002,'文案提取',@aigc_parent,2,'extract','aigc/extract/index','','N','Y','C','0','0','aigc:extract:view','document','','',1761000000000000103,1761100000000000001,NOW(),'文案提取'),
 (1761400000000002003,'AI绘图',@aigc_parent,3,'drawing','aigc/drawing/index','','N','Y','C','0','0','aigc:drawing:view','image','','',1761000000000000103,1761100000000000001,NOW(),'AI绘图'),
 (1761400000000002006,'GPT 图片生成',@aigc_parent,6,'gpt-image','aigc/drawing/index','','N','Y','C','0','0','aigc:gptImage:view','image','','',1761000000000000103,1761100000000000001,NOW(),'提示词生图、选图修改、模型切换'),
 (1761400000000002004,'照片数字人',@aigc_parent,4,'digital-human','aigc/digitalHuman/index','','N','Y','C','0','0','aigc:digitalHuman:view','user','','',1761000000000000103,1761100000000000001,NOW(),'照片数字人'),
 (1761400000000002005,'我的作品',@aigc_parent,5,'works','aigc/works/index','','N','Y','C','0','0','aigc:works:view','folder','','',1761000000000000103,1761100000000000001,NOW(),'我的作品');
/* Legacy shape retained below for reference only. */
/* INSERT INTO sys_menu (menu_name,parent_id,order_num,path,component,menu_type,visible,status,perms,icon,create_dept,create_by,create_time) VALUES
('智能文案',@aigc_parent,1,'copywriting','aigc/copywriting/index','C','0','0','aigc:copywriting:view','edit',0,1,NOW()),
('文案提取',@aigc_parent,2,'extract','aigc/extract/index','C','0','0','aigc:extract:view','document',0,1,NOW()),
('AI绘图',@aigc_parent,2,'drawing','aigc/drawing/index','C','0','0','aigc:drawing:view','image',0,1,NOW()),
('照片数字人',@aigc_parent,3,'digital-human','aigc/digitalHuman/index','C','0','0','aigc:digitalHuman:view','user',0,1,NOW()),
('我的作品',@aigc_parent,4,'works','aigc/works/index','C','0','0','aigc:works:view','folder',0,1,NOW()); */
-- 运行操作作为按钮权限配置给角色；管理员可在若依菜单管理中分别授予。
INSERT IGNORE INTO sys_menu (menu_id,menu_name,parent_id,order_num,menu_type,visible,status,perms,create_dept,create_by,create_time)
VALUES (1761400000000002010,'提取文案',1761400000000002002,1,'F','0','0','aigc:extract:run',1761000000000000103,1761100000000000001,NOW());
/*
('套餐管理',0,30,'billing/package','billing/package/index','C','0','0','billing:package:list','money',0,1,NOW()),
('订单管理',0,31,'billing/order','billing/order/index','C','0','0','billing:order:list','pay',0,1,NOW()),
('算力流水',0,32,'billing/credit','billing/credit/index','C','0','0','billing:credit:list','chart',0,1,NOW()),
('中转站渠道',0,33,'gateway/xiaoli','gateway/xiaoli/index','C','0','0','gateway:xiaoli:list','connection',0,1,NOW()),
('模型配置',0,34,'gateway/model','gateway/model/index','C','0','0','gateway:model:list','cpu',0,1,NOW()),
('功能定价',0,35,'gateway/feature','gateway/feature/index','C','0','0','gateway:feature:list','price-tag',0,1,NOW()); */
INSERT IGNORE INTO sys_menu (menu_id,menu_name,parent_id,order_num,path,component,query_param,is_frame,is_cache,menu_type,visible,status,perms,icon,active_menu,ext,create_dept,create_by,create_time,remark) VALUES
(1761400000000002020,'套餐管理',0,30,'billing/package','billing/package/index','','N','Y','C','0','0','billing:package:list','money','','',1761000000000000103,1761100000000000001,NOW(),'套餐管理'),
(1761400000000002021,'订单管理',0,31,'billing/order','billing/order/index','','N','Y','C','0','0','billing:order:list','pay','','',1761000000000000103,1761100000000000001,NOW(),'订单管理'),
(1761400000000002022,'算力流水',0,32,'billing/credit','billing/credit/index','','N','Y','C','0','0','billing:credit:list','chart','','',1761000000000000103,1761100000000000001,NOW(),'算力流水'),
(1761400000000002023,'中转站渠道',0,33,'gateway/xiaoli','gateway/xiaoli/index','','N','Y','C','0','0','gateway:xiaoli:list','connection','','',1761000000000000103,1761100000000000001,NOW(),'中转站渠道'),
(1761400000000002024,'模型配置',0,34,'gateway/model','gateway/model/index','','N','Y','C','0','0','gateway:model:list','cpu','','',1761000000000000103,1761100000000000001,NOW(),'模型配置'),
(1761400000000002025,'功能定价',0,35,'gateway/feature','gateway/feature/index','','N','Y','C','0','0','gateway:feature:list','price-tag','','',1761000000000000103,1761100000000000001,NOW(),'功能定价');
INSERT IGNORE INTO sys_menu (menu_id,menu_name,parent_id,order_num,menu_type,visible,status,perms,create_dept,create_by,create_time) VALUES
(1761400000000002100,'新增套餐',1761400000000002020,1,'F','0','0','billing:package:add',1761000000000000103,1761100000000000001,NOW()),
(1761400000000002101,'修改套餐',1761400000000002020,2,'F','0','0','billing:package:edit',1761000000000000103,1761100000000000001,NOW()),
(1761400000000002102,'删除套餐',1761400000000002020,3,'F','0','0','billing:package:remove',1761000000000000103,1761100000000000001,NOW()),
(1761400000000002103,'修改模型费率',1761400000000002024,1,'F','0','0','gateway:model:edit',1761000000000000103,1761100000000000001,NOW()),
(1761400000000002104,'修改功能费率',1761400000000002025,1,'F','0','0','gateway:feature:edit',1761000000000000103,1761100000000000001,NOW());

CREATE TABLE IF NOT EXISTS aigc_package (id BIGINT PRIMARY KEY AUTO_INCREMENT, package_name VARCHAR(64) NOT NULL, credits BIGINT NOT NULL, price DECIMAL(10,2) NOT NULL, valid_days INT NOT NULL DEFAULT 30, status CHAR(1) NOT NULL DEFAULT '0', create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS aigc_user_account (user_id BIGINT PRIMARY KEY, balance BIGINT NOT NULL DEFAULT 0, update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS aigc_credit_flow (id BIGINT PRIMARY KEY AUTO_INCREMENT, user_id BIGINT NOT NULL, change_amount BIGINT NOT NULL, balance BIGINT NOT NULL, source VARCHAR(32) NOT NULL, order_no VARCHAR(64), remark VARCHAR(255), create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, INDEX idx_credit_user(user_id));
INSERT INTO aigc_package(package_name,credits,price,valid_days,status) VALUES ('体验套餐',100,9.90,30,'0'),('创作者套餐',1000,59.90,90,'0'),('专业套餐',5000,199.00,365,'0');

-- 唯一的外部渠道：小李中转站。api_key 字段必须使用若依加密组件保存，禁止返回给用户端。
CREATE TABLE IF NOT EXISTS aigc_gateway (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  gateway_code VARCHAR(32) NOT NULL UNIQUE,
  gateway_name VARCHAR(64) NOT NULL,
  base_url VARCHAR(255) NOT NULL,
  api_key VARCHAR(1024) NOT NULL,
  enabled CHAR(1) NOT NULL DEFAULT '0',
  timeout_ms INT NOT NULL DEFAULT 60000,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS aigc_gateway_model (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  gateway_id BIGINT NOT NULL,
  model_code VARCHAR(128) NOT NULL,
  model_name VARCHAR(128) NOT NULL,
  capability VARCHAR(32) NOT NULL COMMENT 'chat,image,audio,video,digital_human,extract',
  enabled CHAR(1) NOT NULL DEFAULT '0',
  default_params JSON,
  cost_credits BIGINT NOT NULL DEFAULT 0 COMMENT '平台向用户扣除的算力，不等同中转站成本',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_gateway_model(gateway_id, model_code)
);
CREATE TABLE IF NOT EXISTS aigc_feature_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  feature_code VARCHAR(64) NOT NULL UNIQUE,
  feature_name VARCHAR(64) NOT NULL,
  menu_permission VARCHAR(128) NOT NULL,
  gateway_model_id BIGINT,
  credits_per_call BIGINT NOT NULL DEFAULT 0,
  enabled CHAR(1) NOT NULL DEFAULT '0',
  required_package_level INT NOT NULL DEFAULT 0,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS aigc_payment_channel (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  gateway_id BIGINT NOT NULL,
  channel_code VARCHAR(32) NOT NULL UNIQUE,
  channel_name VARCHAR(64) NOT NULL,
  create_order_path VARCHAR(255) NOT NULL,
  query_order_path VARCHAR(255),
  refund_path VARCHAR(255),
  callback_secret VARCHAR(1024),
  enabled CHAR(1) NOT NULL DEFAULT '0',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS aigc_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  package_id BIGINT NOT NULL,
  payment_channel_id BIGINT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  credits BIGINT NOT NULL,
  status VARCHAR(16) NOT NULL COMMENT 'PENDING,PAID,CLOSED,REFUNDED',
  gateway_order_no VARCHAR(128),
  paid_time DATETIME,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_user(user_id)
);
CREATE TABLE IF NOT EXISTS aigc_task (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_no VARCHAR(64) NOT NULL UNIQUE,
  user_id BIGINT NOT NULL,
  feature_code VARCHAR(64) NOT NULL,
  model_code VARCHAR(128) NOT NULL,
  request_body JSON NOT NULL,
  gateway_task_no VARCHAR(128),
  status VARCHAR(16) NOT NULL COMMENT 'PENDING,RUNNING,SUCCESS,FAILED',
  credits_cost BIGINT NOT NULL DEFAULT 0,
  result_body JSON,
  error_message VARCHAR(1000),
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_task_user(user_id), INDEX idx_task_status(status)
);
INSERT INTO aigc_gateway(gateway_code,gateway_name,base_url,api_key,enabled)
VALUES ('xiaoli','小李中转站','https://xiaoli-api.xyz','CHANGE_ME_ENCRYPTED','1');
INSERT INTO aigc_feature_config(feature_code,feature_name,menu_permission,credits_per_call,enabled) VALUES
('copywriting','智能写作','aigc:copywriting:view',1,'1'),
('extract','文案提取','aigc:extract:run',1,'1'),
('video','文案转视频','aigc:video:run',1,'1'),
('image','AI绘图','aigc:drawing:view',10,'1'),
('gpt_image','GPT 图片生成','aigc:gptImage:view',1,'1'),
('digital_human','照片数字人','aigc:digitalHuman:view',30,'1'),
('music','AI音乐','aigc:music:run',10,'1'),
('voice_clone','声音克隆','aigc:voiceClone:run',20,'1'),
('avatar_clone','形象克隆','aigc:avatarClone:run',30,'1'),
('face_merge','人脸融合','aigc:faceMerge:run',20,'1'),
('photo_dh','照片数字人','aigc:photoDigitalHuman:run',30,'1');
