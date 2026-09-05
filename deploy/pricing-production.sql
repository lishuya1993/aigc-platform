-- Restore the production model allowlist after aigc-app startup synchronization.
USE ry_vue_plus;

UPDATE aigc_gateway_model SET enabled = '0';
UPDATE aigc_gateway_model
SET enabled = '1'
WHERE model_code IN (
    'gpt-5.5',
    'gpt-5.6-luna',
    'gpt-5.6-sol',
    'gpt-5.6-terra',
    'gpt-image-2',
    'vidu-video-q2-turbo'
);

UPDATE aigc_gateway_model
SET cost_credits = 3
WHERE model_code IN ('gpt-5.5', 'gpt-5.6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra');

UPDATE aigc_gateway_model
SET cost_credits = 1
WHERE model_code = 'vidu-video-q2-turbo';

UPDATE aigc_feature_config
SET gateway_model_id = (
    SELECT id FROM aigc_gateway_model WHERE model_code = 'gpt-5.6-terra' LIMIT 1
), credits_per_call = 1, enabled = '1'
WHERE feature_code IN (
    'copywriting',
    'emotion',
    'extract',
    'general',
    'imitate',
    'lyrics',
    'marketing',
    'poem',
    'rewrite',
    'spoken_copy',
    'title',
    'translate',
    'viral_spoken_copy',
    'writing',
    'xiaohongshu_note'
);

UPDATE aigc_feature_config
SET gateway_model_id = (
    SELECT id FROM aigc_gateway_model WHERE model_code = 'gpt-image-2' LIMIT 1
), credits_per_call = 1, enabled = '1'
WHERE feature_code = 'image';

UPDATE aigc_feature_config
SET gateway_model_id = (
    SELECT id FROM aigc_gateway_model WHERE model_code = 'vidu-video-q2-turbo' LIMIT 1
), credits_per_call = 1, enabled = '1'
WHERE feature_code = 'video';
