INSERT INTO aigc_feature_config(feature_code,feature_name,menu_permission,credits_per_call,enabled)
VALUES ('video','文案转视频','aigc:video:run',1,'1')
ON DUPLICATE KEY UPDATE feature_name=VALUES(feature_name),menu_permission=VALUES(menu_permission);

UPDATE aigc_gateway_model
SET capability='video',enabled='1'
WHERE model_code IN ('Wan-AI/Wan2.2-T2V-A14B','Wan-AI/Wan2.2-I2V-A14B');
