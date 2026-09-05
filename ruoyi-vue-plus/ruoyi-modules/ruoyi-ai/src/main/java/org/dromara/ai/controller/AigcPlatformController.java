package org.dromara.ai.controller;

import cn.dev33.satoken.annotation.SaCheckLogin;
import cn.dev33.satoken.annotation.SaIgnore;
import cn.dev33.satoken.annotation.SaCheckPermission;
import cn.dev33.satoken.stp.StpUtil;
import lombok.RequiredArgsConstructor;
import org.dromara.common.core.domain.R;
import org.dromara.common.satoken.utils.LoginHelper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.LinkedHashMap;

/** Business APIs that remain usable before an external model is configured. */
@RestController
@RequestMapping("/aigc")
@RequiredArgsConstructor
public class AigcPlatformController {
    private final JdbcTemplate jdbc;
    private final AigcUsageReportService usageReportService;

    @GetMapping("/features")
    @SaIgnore
    public R<List<Map<String, Object>>> features() {
        return R.ok(jdbc.queryForList("select feature_code,feature_name,menu_permission,gateway_model_id,credits_per_call,enabled,required_package_level from aigc_feature_config where enabled='1' order by id"));
    }

    @SaCheckLogin
    @GetMapping("/permissions")
    public R<Set<String>> permissions() {
        return R.ok(LoginHelper.getLoginUser().getMenuPermission());
    }

    @GetMapping("/models")
    @SaIgnore
    public R<List<Map<String, Object>>> models(@RequestParam(required = false) String capability) {
        String sql = "select m.id,m.model_code,m.model_name,m.capability,m.cost_credits,m.default_params from aigc_gateway_model m join aigc_gateway g on g.id=m.gateway_id where m.enabled='1' and g.enabled='1'";
        if (capability != null && !capability.isBlank()) sql += " and m.capability=?";
        sql += " order by m.cost_credits,m.model_name";
        return R.ok(capability == null || capability.isBlank() ? jdbc.queryForList(sql) : jdbc.queryForList(sql, capability));
    }

    @GetMapping("/packages")
    @SaIgnore
    public R<List<Map<String, Object>>> packages() {
        return R.ok(jdbc.queryForList("select id,package_name,credits,price,valid_days from aigc_package where status='0' order by price"));
    }

    @SaCheckLogin
    @GetMapping("/orders")
    public R<List<Map<String, Object>>> orders() {
        return R.ok(jdbc.queryForList("select o.order_no,p.package_name,o.amount,o.credits,o.status,o.gateway_order_no,o.paid_time,o.create_time " +
            "from aigc_order o left join aigc_package p on p.id=o.package_id where o.user_id=? order by o.id desc limit 100", LoginHelper.getUserId()));
    }

    @SaCheckLogin
    @GetMapping("/credit-flows")
    public R<List<Map<String, Object>>> creditFlows() {
        return R.ok(jdbc.queryForList("select change_amount,balance,source,order_no,remark,create_time from aigc_credit_flow " +
            "where user_id=? order by id desc limit 200", LoginHelper.getUserId()));
    }

    @SaCheckPermission("billing:package:list")
    @GetMapping("/admin/packages")
    public R<List<Map<String, Object>>> adminPackages() {
        return R.ok(jdbc.queryForList("select id,package_name,credits,price,status,create_time from aigc_package order by price,id"));
    }

    @SaCheckPermission("billing:package:add")
    @PostMapping("/admin/packages")
    public R<Void> addPackage(@RequestBody PackageRequest request) {
        String error = validatePackage(request);
        if (error != null) return R.fail(error);
        jdbc.update("insert into aigc_package(package_name,credits,price,valid_days,status) values(?,?,?,0,?)",
            request.packageName().trim(), request.credits(), request.price(), normalizeStatus(request.status()));
        return R.ok();
    }

    @SaCheckPermission("billing:package:edit")
    @PutMapping("/admin/packages/{id}")
    public R<Void> updatePackage(@PathVariable Long id, @RequestBody PackageRequest request) {
        String error = validatePackage(request);
        if (error != null) return R.fail(error);
        return jdbc.update("update aigc_package set package_name=?,credits=?,price=?,status=? where id=?",
            request.packageName().trim(), request.credits(), request.price(), normalizeStatus(request.status()), id) > 0 ? R.ok() : R.fail("套餐不存在");
    }

    @SaCheckPermission("billing:package:remove")
    @DeleteMapping("/admin/packages/{id}")
    public R<Void> deletePackage(@PathVariable Long id) {
        if (!jdbc.queryForList("select id from aigc_order where package_id=? limit 1", id).isEmpty()) return R.fail("该套餐已有订单，只能下架不能删除");
        return jdbc.update("delete from aigc_package where id=?", id) > 0 ? R.ok() : R.fail("套餐不存在");
    }

    @SaCheckPermission("gateway:model:list")
    @GetMapping("/admin/models")
    public R<List<Map<String, Object>>> adminModels() {
        return R.ok(jdbc.queryForList("select m.id,g.gateway_name,m.model_code,m.model_name,m.capability,m.cost_credits,m.default_params,m.enabled,m.create_time " +
            "from aigc_gateway_model m join aigc_gateway g on g.id=m.gateway_id order by m.capability,m.cost_credits,m.model_name"));
    }

    @SaCheckPermission("gateway:model:edit")
    @PutMapping("/admin/models/{id}")
    public R<Void> updateModel(@PathVariable Long id, @RequestBody ModelAdminRequest request) {
        if (request == null || request.credits() == null || request.credits() < 0) return R.fail("模型扣费必须为非负数");
        String params = request.defaultParams() == null || request.defaultParams().isBlank() ? null : request.defaultParams().trim();
        return jdbc.update("update aigc_gateway_model set cost_credits=?,enabled=?,default_params=? where id=?",
            request.credits(), normalizeEnabled(request.enabled()), params, id) > 0 ? R.ok() : R.fail("模型不存在");
    }

    @SaCheckPermission("gateway:feature:list")
    @GetMapping("/admin/features")
    public R<List<Map<String, Object>>> adminFeatures() {
        return R.ok(jdbc.queryForList("select id,feature_code,feature_name,gateway_model_id,credits_per_call,enabled,menu_permission,update_time from aigc_feature_config order by id"));
    }

    @SaCheckPermission("gateway:feature:edit")
    @PutMapping("/admin/features/{id}")
    public R<Void> updateFeature(@PathVariable Long id, @RequestBody FeatureAdminRequest request) {
        if (request == null || request.credits() == null || request.credits() < 0) return R.fail("功能最低扣费必须为非负数");
        if (request.gatewayModelId() != null) {
            List<Map<String, Object>> model = jdbc.queryForList("select id from aigc_gateway_model where id=?", request.gatewayModelId());
            if (model.isEmpty()) return R.fail("默认模型不存在");
        }
        return jdbc.update("update aigc_feature_config set credits_per_call=?,enabled=?,gateway_model_id=? where id=?",
            request.credits(), normalizeEnabled(request.enabled()), request.gatewayModelId(), id) > 0 ? R.ok() : R.fail("功能不存在");
    }

    @SaCheckPermission("billing:order:list")
    @GetMapping("/admin/orders")
    public R<List<Map<String, Object>>> adminOrders() {
        return R.ok(jdbc.queryForList("select o.order_no,u.user_name,u.email,p.package_name,o.amount,o.credits,o.status,o.gateway_order_no,o.paid_time,o.create_time " +
            "from aigc_order o left join sys_user u on u.user_id=o.user_id left join aigc_package p on p.id=o.package_id order by o.id desc limit 500"));
    }

    @SaCheckPermission("billing:credit:list")
    @GetMapping("/admin/credit-flows")
    public R<List<Map<String, Object>>> adminCreditFlows() {
        return R.ok(jdbc.queryForList("select f.id,u.user_name,u.email,f.change_amount,f.balance,f.source,f.order_no,f.remark,f.create_time " +
            "from aigc_credit_flow f left join sys_user u on u.user_id=f.user_id order by f.id desc limit 1000"));
    }

    @SaCheckPermission("billing:usage:list")
    @GetMapping("/admin/usage/daily")
    public R<Map<String, Object>> adminDailyUsage(@RequestParam(required = false) String date) {
        return R.ok(usageReportService.dailyUsage(parseReportDate(date, LocalDate.now())));
    }

    @SaCheckPermission("billing:usage:email")
    @PostMapping("/admin/usage/daily/email")
    public R<Void> sendDailyUsageEmail(@RequestParam(required = false) String date) {
        try {
            usageReportService.sendDailyReport(parseReportDate(date, LocalDate.now().minusDays(1)));
            return R.ok();
        } catch (IllegalStateException ex) {
            return R.fail(ex.getMessage());
        }
    }

    private LocalDate parseReportDate(String date, LocalDate fallback) {
        if (date == null || date.isBlank()) return fallback;
        try {
            return LocalDate.parse(date);
        } catch (Exception ex) {
            throw new IllegalArgumentException("日期格式应为 yyyy-MM-dd");
        }
    }

    private String validatePackage(PackageRequest request) {
        if (request == null || request.packageName() == null || request.packageName().isBlank()) return "套餐名称不能为空";
        if (request.credits() == null || request.credits() <= 0) return "到账余额必须大于 0";
        if (request.price() == null || request.price().signum() <= 0) return "支付金额必须大于 0";
        return null;
    }

    private String normalizeStatus(String status) { return "1".equals(status) ? "1" : "0"; }
    private String normalizeEnabled(String enabled) { return "0".equals(enabled) ? "0" : "1"; }

    @SaCheckLogin
    @GetMapping("/account")
    public R<Map<String, Object>> account() {
        Long userId = LoginHelper.getUserId();
        jdbc.update("insert ignore into aigc_user_account(user_id,balance) values(?,0)", userId);
        List<Map<String, Object>> rows = jdbc.queryForList("select balance from aigc_user_account where user_id=?", userId);
        return R.ok(Map.of("userId", userId, "balance", rows.isEmpty() ? 0 : rows.get(0).get("balance")));
    }

    @SaCheckLogin
    @Transactional(rollbackFor = Exception.class)
    @PostMapping("/tasks")
    public R<Map<String, Object>> createTask(@RequestBody TaskRequest request) {
        if (request == null || request.featureCode() == null || request.featureCode().isBlank()) return R.fail("功能编码不能为空");
        Long userId = LoginHelper.getUserId();
        List<Map<String, Object>> configs = jdbc.queryForList("select f.credits_per_call,f.enabled,f.menu_permission,m.enabled model_enabled,m.cost_credits from aigc_feature_config f left join aigc_gateway_model m on m.id=f.gateway_model_id where f.feature_code=?", request.featureCode());
        if (configs.isEmpty() || !"1".equals(String.valueOf(configs.get(0).get("enabled")))) return R.fail("该功能暂未开放");
        String permission = String.valueOf(configs.get(0).get("menu_permission"));
        if (!permission.isBlank() && !"null".equalsIgnoreCase(permission)) StpUtil.checkPermission(permission);
        long cost = ((Number) configs.get(0).get("credits_per_call")).longValue();
        if (request.modelCode() != null && !request.modelCode().isBlank()) {
            List<Map<String,Object>> selected = jdbc.queryForList("select cost_credits from aigc_gateway_model m join aigc_gateway g on g.id=m.gateway_id where m.model_code=? and m.enabled='1' and g.enabled='1'", request.modelCode());
            if (selected.isEmpty()) return R.fail("所选模型不可用");
            cost = Math.max(cost, ((Number) selected.get(0).get("cost_credits")).longValue());
        }
        jdbc.update("insert ignore into aigc_user_account(user_id,balance) values(?,0)", userId);
        Map<String, Object> account = jdbc.queryForMap("select balance from aigc_user_account where user_id=? for update", userId);
        long balance = ((Number) account.get("balance")).longValue();
        if (balance < cost) return R.fail("算力余额不足，请先购买套餐");
        String taskNo = "AIGC" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        jdbc.update("insert into aigc_task(task_no,user_id,feature_code,model_code,request_body,status,credits_cost) values(?,?,?,?,?,'WAITING_CONFIG',?)", taskNo, userId, request.featureCode(), request.modelCode(), request.requestBody() == null ? "{}" : request.requestBody(), cost);
        jdbc.update("update aigc_user_account set balance=balance-? where user_id=? and balance>=?", cost, userId, cost);
        jdbc.update("insert into aigc_credit_flow(user_id,change_amount,balance,source,order_no,remark) values(?,?,?,'TASK',?,?)", userId, -cost, balance - cost, taskNo, request.featureCode());
        return R.ok(Map.of("taskNo", taskNo, "status", "WAITING_CONFIG", "creditsCost", cost));
    }

    @SaCheckLogin
    @PostMapping("/orders")
    public R<Map<String, Object>> createOrder(@RequestBody OrderRequest request) {
        if (request == null || request.packageId() == null) return R.fail("套餐不能为空");
        List<Map<String, Object>> packages = jdbc.queryForList("select id,package_name,credits,price from aigc_package where id=? and status='0'", request.packageId());
        if (packages.isEmpty()) return R.fail("套餐不存在或已下架");
        Map<String, Object> p = packages.get(0);
        String orderNo = "LL" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        jdbc.update("insert into aigc_order(order_no,user_id,package_id,payment_channel_id,amount,credits,status) values(?,?,?,0,?,?, 'PENDING')", orderNo, LoginHelper.getUserId(), request.packageId(), p.get("price"), p.get("credits"));
        return R.ok(Map.of("orderNo", orderNo, "amount", p.get("price"), "status", "PENDING", "paymentRequired", true));
    }

    @SaCheckLogin
    @GetMapping("/tasks")
    public R<List<Map<String, Object>>> tasks() {
        StpUtil.checkPermission("aigc:works:view");
        return R.ok(jdbc.queryForList("select task_no,feature_code,model_code,status,credits_cost,result_body,error_message,create_time,update_time from aigc_task where user_id=? order by id desc limit 100", LoginHelper.getUserId()));
    }

    public record TaskRequest(String featureCode, String modelCode, String requestBody) {}
    public record OrderRequest(Long packageId) {}
    public record PackageRequest(String packageName, Long credits, java.math.BigDecimal price, String status) {}
    public record ModelAdminRequest(Long credits, String enabled, String defaultParams) {}
    public record FeatureAdminRequest(Long credits, String enabled, Long gatewayModelId) {}
    public record BalanceAdjustRequest(Long amount, String remark) {}
    public record UserMenuPermissionRequest(List<Long> menuIds, Boolean inheritDefault) {}

    @SaCheckPermission("billing:user:list")
    @GetMapping("/admin/gateway")
    public R<List<Map<String, Object>>> adminGateway() {
        return R.ok(jdbc.queryForList("select id,gateway_code,gateway_name,base_url,api_key,enabled,timeout_ms,create_time from aigc_gateway order by id"));
    }

    @SaCheckPermission("billing:user:list")
    @GetMapping("/admin/users")
    public R<List<Map<String, Object>>> adminUsers(@RequestParam(required = false) String keyword) {
        String sql = "select u.user_id,u.user_name,u.nick_name,u.email,u.phone_number,u.status,ifnull(a.balance,0) balance,u.create_time " +
            "from sys_user u left join aigc_user_account a on a.user_id=u.user_id " +
            "where u.user_type='app_user' and u.del_flag='0'";
        if (keyword != null && !keyword.isBlank()) {
            String kw = "%" + keyword.trim() + "%";
            return R.ok(jdbc.queryForList(sql + " and (u.user_name like ? or u.nick_name like ? or u.email like ?) order by u.create_time desc limit 300", kw, kw, kw));
        }
        return R.ok(jdbc.queryForList(sql + " order by u.create_time desc limit 300"));
    }

    @SaCheckPermission("billing:user:list")
    @GetMapping("/admin/users/{userId}/menu-permissions")
    public R<Map<String, Object>> appUserMenuPermissions(@PathVariable Long userId) {
        requireAppUser(userId);
        List<Map<String, Object>> menus = jdbc.queryForList(
            "select menu_id,menu_name,perms from sys_menu where status='0' and perms like 'aigc:%' order by order_num,menu_id");
        String customRoleKey = "app_user_" + userId;
        List<Long> selected = jdbc.queryForList(
            "select distinct rm.menu_id from sys_user_role ur join sys_role r on r.role_id=ur.role_id and r.del_flag='0' " +
                "join sys_role_menu rm on rm.role_id=r.role_id join sys_menu m on m.menu_id=rm.menu_id " +
                "where ur.user_id=? and r.role_key=? and m.perms like 'aigc:%'", Long.class, userId, customRoleKey);
        boolean custom = !selected.isEmpty() || !jdbc.queryForList(
            "select r.role_id from sys_user_role ur join sys_role r on r.role_id=ur.role_id where ur.user_id=? and r.role_key=? and r.del_flag='0'",
            userId, customRoleKey).isEmpty();
        if (!custom) selected = menus.stream().map(row -> ((Number) row.get("menu_id")).longValue()).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("menus", menus);
        result.put("selectedMenuIds", selected);
        result.put("inheritDefault", !custom);
        return R.ok(result);
    }

    @SaCheckPermission("billing:user:status")
    @PutMapping("/admin/users/{userId}/menu-permissions")
    @Transactional(rollbackFor = Exception.class)
    public R<Void> updateAppUserMenuPermissions(@PathVariable Long userId, @RequestBody UserMenuPermissionRequest request) {
        requireAppUser(userId);
        Long defaultRoleId = jdbc.queryForObject("select role_id from sys_role where role_key='app_user' and del_flag='0' limit 1", Long.class);
        if (defaultRoleId == null) return R.fail("应用用户默认角色未配置");
        String customRoleKey = "app_user_" + userId;
        List<Long> customRoleIds = jdbc.queryForList("select role_id from sys_role where role_key=?", Long.class, customRoleKey);
        if (Boolean.TRUE.equals(request == null ? null : request.inheritDefault())) {
            jdbc.update("delete from sys_user_role where user_id=?", userId);
            jdbc.update("insert into sys_user_role(user_id,role_id) values(?,?)", userId, defaultRoleId);
            if (!customRoleIds.isEmpty()) {
                jdbc.update("delete from sys_role_menu where role_id=?", customRoleIds.get(0));
                jdbc.update("update sys_role set del_flag='1',status='1',update_time=now() where role_id=?", customRoleIds.get(0));
            }
            StpUtil.logout(userId);
            return R.ok();
        }
        List<Long> requestedIds = request == null || request.menuIds() == null ? List.of() : request.menuIds().stream().distinct().toList();
        List<Long> allowedIds = requestedIds.isEmpty() ? List.of() : jdbc.queryForList(
            "select menu_id from sys_menu where status='0' and perms like 'aigc:%' and menu_id in (" +
                String.join(",", requestedIds.stream().map(x -> "?").toList()) + ")", Long.class, requestedIds.toArray());
        Long customRoleId;
        if (customRoleIds.isEmpty()) {
            customRoleId = Math.abs(UUID.randomUUID().getMostSignificantBits());
            jdbc.update("insert into sys_role(role_id,role_name,role_key,role_sort,data_scope,menu_check_strictly,dept_check_strictly,status,del_flag,create_dept,create_by,create_time,remark) " +
                    "values(?,?,?,99,'1',1,1,'0','0',?,?,now(),'用户端个人菜单权限')",
                customRoleId, "用户端-" + userId, customRoleKey, LoginHelper.getDeptId(), LoginHelper.getUserId());
        } else {
            customRoleId = customRoleIds.get(0);
            jdbc.update("update sys_role set status='0',del_flag='0',update_time=now() where role_id=?", customRoleId);
        }
        jdbc.update("delete from sys_role_menu where role_id=?", customRoleId);
        for (Long menuId : allowedIds) jdbc.update("insert into sys_role_menu(role_id,menu_id) values(?,?)", customRoleId, menuId);
        List<Long> uploadMenus = jdbc.queryForList("select menu_id from sys_menu where perms='system:oss:upload' and status='0'", Long.class);
        for (Long menuId : uploadMenus) jdbc.update("insert ignore into sys_role_menu(role_id,menu_id) values(?,?)", customRoleId, menuId);
        jdbc.update("delete from sys_user_role where user_id=?", userId);
        jdbc.update("insert into sys_user_role(user_id,role_id) values(?,?)", userId, customRoleId);
        StpUtil.logout(userId);
        return R.ok();
    }

    private void requireAppUser(Long userId) {
        if (jdbc.queryForList("select user_id from sys_user where user_id=? and user_type='app_user' and del_flag='0'", userId).isEmpty()) {
            throw new IllegalArgumentException("平台用户不存在");
        }
    }

    @SaCheckPermission("billing:user:balance")
    @Transactional(rollbackFor = Exception.class)
    @PostMapping("/admin/users/{userId}/balance")
    public R<Void> adjustUserBalance(@PathVariable Long userId, @RequestBody BalanceAdjustRequest request) {
        if (request == null || request.amount() == null) return R.fail("调整金额不能为空");
        long amount = request.amount();
        if (amount == 0) return R.fail("调整金额不能为0");
        List<Map<String, Object>> users = jdbc.queryForList(
            "select user_id from sys_user where user_id=? and user_type='app_user' and del_flag='0'", userId);
        if (users.isEmpty()) return R.fail("用户不存在");
        jdbc.update("insert ignore into aigc_user_account(user_id,balance) values(?,0)", userId);
        jdbc.queryForMap("select balance from aigc_user_account where user_id=? for update", userId);
        jdbc.update("update aigc_user_account set balance=balance+? where user_id=?", amount, userId);
        long balance = ((Number) jdbc.queryForMap("select balance from aigc_user_account where user_id=?", userId).get("balance")).longValue();
        String remark = request.remark() == null || request.remark().isBlank() ? "后台调整" : request.remark().trim();
        jdbc.update("insert into aigc_credit_flow(user_id,change_amount,balance,source,order_no,remark) values(?,?,?,'ADMIN',null,?)", userId, amount, balance, remark);
        return R.ok();
    }

    @SaCheckPermission("billing:user:status")
    @PutMapping("/admin/users/{userId}/status")
    public R<Void> updateAppUserStatus(@PathVariable Long userId, @RequestBody UserStatusRequest request) {
        if (request == null || !("0".equals(request.status()) || "1".equals(request.status()))) {
            return R.fail("用户状态参数错误");
        }
        int changed = jdbc.update("update sys_user set status=?,update_time=now() where user_id=? and user_type='app_user' and del_flag='0'",
            request.status(), userId);
        if (changed == 0) return R.fail("平台用户不存在");
        if ("1".equals(request.status())) StpUtil.logout(userId);
        return R.ok();
    }

    @SaCheckPermission("billing:user:logout")
    @PostMapping("/admin/users/{userId}/logout")
    public R<Void> logoutAppUser(@PathVariable Long userId) {
        if (jdbc.queryForList("select user_id from sys_user where user_id=? and user_type='app_user' and del_flag='0'", userId).isEmpty()) {
            return R.fail("平台用户不存在");
        }
        StpUtil.logout(userId);
        return R.ok();
    }

    @SaCheckPermission("billing:user:remove")
    @DeleteMapping("/admin/users/{userId}")
    @Transactional(rollbackFor = Exception.class)
    public R<Void> deleteAppUser(@PathVariable Long userId) {
        if (jdbc.queryForList("select user_id from sys_user where user_id=? and user_type='app_user' and del_flag='0'", userId).isEmpty()) {
            return R.fail("平台用户不存在");
        }
        jdbc.update("delete from sys_user_role where user_id=?", userId);
        jdbc.update("delete from sys_user_post where user_id=?", userId);
        int changed = jdbc.update("update sys_user set status='1',del_flag='1',update_time=now() where user_id=? and user_type='app_user' and del_flag='0'", userId);
        if (changed == 0) return R.fail("删除失败");
        StpUtil.logout(userId);
        return R.ok();
    }

    public record UserStatusRequest(String status) {}
}
