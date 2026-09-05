-- Run once against the existing ry_vue_plus database.
-- The user frontend uses client_id=aigc-web; the admin frontend keeps the PC client.
insert ignore into sys_client
  (id, client_id, client_key, client_secret, grant_type, device_type, access_path, ip_whitelist,
   active_timeout, timeout, status, del_flag, create_dept, create_by, create_time, update_by, update_time)
values
  (1762000000000000003, 'aigc-web', 'web', 'web123', 'password', 'web', null, null,
   1800, 604800, '0', '0', 1761000000000000103, 1761100000000000001, now(), 1761100000000000001, now());
