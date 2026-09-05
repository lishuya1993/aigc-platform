package org.dromara.ai.controller;

import cn.dev33.satoken.annotation.SaCheckLogin;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.dromara.common.core.domain.R;
import org.dromara.common.mail.config.properties.MailProperties;
import org.dromara.common.mail.core.MailBuilder;
import org.dromara.common.satoken.utils.LoginHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;

/** 易支付 V1 MD5 adapter. Credentials remain server-side. */
@RestController
@RequestMapping("/aigc/payment/epay")
@RequiredArgsConstructor
@Slf4j
public class EpayController {
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactionTemplate;
    private final ObjectMapper objectMapper;
    private final MailProperties mailProperties;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    @Value("${aigc.payment.epay.gateway:https://pay.xzncraft.cn/plugin/EpayApi/GatewayV1/}") private String gateway;
    @Value("${aigc.payment.epay.pid:}") private String pid;
    @Value("${aigc.payment.epay.key:}") private String key;
    @Value("${aigc.payment.epay.query-url:}") private String configuredQueryUrl;
    @Value("${aigc.payment.epay.notify-url:http://localhost:8080/aigc/payment/epay/notify}") private String notifyUrl;
    @Value("${aigc.payment.epay.return-url:http://localhost:5173/#/billing}") private String returnUrl;
    /** 本地联调模拟支付，生产环境默认关闭。 */
    @Value("${aigc.payment.epay.mock:false}") private boolean mockPayment;
    /** 自定义金额充值的汇率：1 元 = N 余额 */
    @Value("${aigc.payment.custom-rate:10}") private int customRate;
    /** 充值成功通知管理员邮箱，未配置时使用 SMTP 发件人地址。 */
    @Value("${aigc.notification.admin-email:}") private String adminEmail;

    @SaCheckLogin
    @PostMapping("/create")
    public R<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        if (!mockPayment && (pid.isBlank() || key.isBlank())) return R.fail("易支付商户配置未完成");
        Long packageId = body == null || body.get("packageId") == null ? null : Long.valueOf(body.get("packageId").toString());
        BigDecimal customAmount = body == null || body.get("amount") == null ? null : new BigDecimal(body.get("amount").toString());
        if (packageId == null && customAmount == null) return R.fail("请选择套餐或输入充值金额");
        if (packageId != null && customAmount != null) return R.fail("套餐与自定义金额只能二选一");
        String paymentType = Objects.toString(body.get("paymentType"), "alipay");
        if (!Set.of("alipay", "wxpay").contains(paymentType)) return R.fail("不支持的支付方式");

        String orderNo = "LL" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        BigDecimal money;
        String orderName;
        Long credits;
        if (packageId != null) {
            List<Map<String,Object>> rows = jdbc.queryForList("select id,package_name,price,credits from aigc_package where id=? and status='0'", packageId);
            if (rows.isEmpty()) return R.fail("套餐不存在或已下架");
            Map<String,Object> pack = rows.get(0);
            money = new BigDecimal(pack.get("price").toString());
            orderName = pack.get("package_name").toString();
            credits = ((Number) pack.get("credits")).longValue();
        } else {
            if (customAmount.compareTo(BigDecimal.ZERO) <= 0) return R.fail("充值金额必须大于0");
            if (customAmount.scale() > 2) return R.fail("金额最多两位小数");
            if (customRate <= 0) return R.fail("充值汇率未配置");
            credits = customAmount.multiply(new BigDecimal(customRate)).setScale(0, RoundingMode.DOWN).longValue();
            if (credits <= 0) return R.fail("金额过小，至少充值 1 元");
            money = customAmount;
            orderName = "自定义充值";
        }
        jdbc.update("insert into aigc_order(order_no,user_id,package_id,payment_channel_id,amount,credits,status) values(?,?,?,0,?,?,'PENDING')",
            orderNo, LoginHelper.getUserId(), packageId, money, credits);

        if (mockPayment) {
            PaymentNotice notice = completePayment(orderNo, "MOCK-" + orderNo);
            if (notice != null) sendPaymentMail(notice);
            return R.ok(Map.of("orderNo", orderNo, "paymentUrl", returnUrl, "mock", true));
        }
        Map<String,String> params = new LinkedHashMap<>();
        params.put("pid", pid); params.put("type", paymentType); params.put("out_trade_no", orderNo);
        params.put("notify_url", notifyUrl); params.put("return_url", returnUrl);
        params.put("name", orderName); params.put("money", money.toPlainString());
        params.put("sign", sign(params));
        params.put("sign_type", "MD5");
        StringBuilder url = new StringBuilder(gateway).append(gateway.contains("?") ? (gateway.endsWith("?") || gateway.endsWith("&") ? "" : "&") : "?");
        params.forEach((name,value) -> url.append(encode(name)).append('=').append(encode(value)).append('&'));
        return R.ok(Map.of("orderNo", orderNo, "paymentUrl", url.substring(0, url.length()-1)));
    }

    @SaCheckLogin
    @GetMapping("/query/{orderNo}")
    public R<Map<String, Object>> query(@PathVariable String orderNo) {
        List<Map<String,Object>> rows = userOrder(orderNo);
        if (rows.isEmpty()) return R.fail("订单不存在");
        if ("PENDING".equals(String.valueOf(rows.get(0).get("status")))) tryReconcile(orderNo);
        return R.ok(userOrder(orderNo).get(0));
    }

    @RequestMapping(value = "/notify", method = {RequestMethod.GET, RequestMethod.POST})
    public String notify(HttpServletRequest request) {
        Map<String,String> params = new TreeMap<>();
        Collections.list(request.getParameterNames()).forEach(name -> {
            if (!name.equals("sign") && !name.equals("sign_type")) params.put(name, request.getParameter(name));
        });
        String receivedSign = Optional.ofNullable(request.getParameter("sign")).orElse("");
        if (key.isBlank() || !MessageDigest.isEqual(sign(params).getBytes(StandardCharsets.UTF_8), receivedSign.getBytes(StandardCharsets.UTF_8))) return "fail";
        if (!pid.equals(request.getParameter("pid"))) return "fail";
        if (!"TRADE_SUCCESS".equals(request.getParameter("trade_status"))) return "success";
        String orderNo = request.getParameter("out_trade_no");
        List<Map<String, Object>> orders = jdbc.queryForList("select amount from aigc_order where order_no=?", orderNo);
        if (orders.isEmpty() || !sameMoney(orders.get(0).get("amount"), request.getParameter("money"))) return "fail";
        PaymentNotice notice = completePayment(orderNo, request.getParameter("trade_no"));
        if (notice != null) sendPaymentMail(notice);
        return "success";
    }

    private List<Map<String, Object>> userOrder(String orderNo) {
        return jdbc.queryForList("select order_no,amount,credits,status,paid_time,create_time from aigc_order where order_no=? and user_id=?", orderNo, LoginHelper.getUserId());
    }

    /** Query reconciliation keeps LL orders usable when a bridge cannot forward callbacks. */
    private void tryReconcile(String orderNo) {
        if (pid.isBlank() || key.isBlank()) return;
        try {
            String queryUrl = configuredQueryUrl.isBlank() ? gateway.replace("submit.php", "api.php") : configuredQueryUrl;
            String url = queryUrl + (queryUrl.contains("?") ? "&" : "?") + "act=order&pid=" + encode(pid) + "&key=" + encode(key) + "&out_trade_no=" + encode(orderNo);
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).timeout(Duration.ofSeconds(15)).GET().build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) return;
            JsonNode result = objectMapper.readTree(response.body());
            boolean paid = "TRADE_SUCCESS".equalsIgnoreCase(result.path("trade_status").asText())
                || (result.path("status").asInt() == 1 && !result.path("trade_no").asText().isBlank());
            if (!paid) return;
            List<Map<String, Object>> orders = jdbc.queryForList("select amount from aigc_order where order_no=?", orderNo);
            String money = result.path("money").asText();
            if (orders.isEmpty() || (!money.isBlank() && !sameMoney(orders.get(0).get("amount"), money))) return;
            PaymentNotice notice = completePayment(orderNo, result.path("trade_no").asText());
            if (notice != null) sendPaymentMail(notice);
        } catch (Exception ex) {
            log.warn("query epay order {} failed: {}", orderNo, ex.getMessage());
        }
    }

    private PaymentNotice completePayment(String orderNo, String gatewayOrderNo) {
        return transactionTemplate.execute(status -> {
            int changed = jdbc.update("update aigc_order set status='PAID',gateway_order_no=?,paid_time=now() where order_no=? and status='PENDING'", gatewayOrderNo, orderNo);
            if (changed == 0) return null;
            Map<String,Object> order = jdbc.queryForMap("select o.user_id,o.credits,u.email from aigc_order o left join sys_user u on u.user_id=o.user_id where o.order_no=?", orderNo);
            jdbc.update("insert ignore into aigc_user_account(user_id,balance) values(?,0)", order.get("user_id"));
            jdbc.queryForMap("select balance from aigc_user_account where user_id=? for update", order.get("user_id"));
            jdbc.update("update aigc_user_account set balance=balance+? where user_id=?", order.get("credits"), order.get("user_id"));
            long balance = ((Number) jdbc.queryForMap("select balance from aigc_user_account where user_id=?", order.get("user_id")).get("balance")).longValue();
            jdbc.update("insert into aigc_credit_flow(user_id,change_amount,balance,source,order_no,remark) values(?,?,?,'PAYMENT',?,'套餐充值')", order.get("user_id"), order.get("credits"), balance, orderNo);
            return new PaymentNotice(orderNo, Objects.toString(order.get("email"), ""), ((Number) order.get("credits")).longValue(), balance);
        });
    }

    private void sendPaymentMail(PaymentNotice notice) {
        LinkedHashSet<String> recipients = new LinkedHashSet<>();
        if (!notice.email().isBlank()) recipients.add(notice.email());
        String ownerEmail = adminEmail.isBlank() ? mailProperties.getFrom() : adminEmail;
        if (ownerEmail == null || ownerEmail.isBlank()) ownerEmail = mailProperties.getUser();
        if (ownerEmail != null && !ownerEmail.isBlank()) recipients.add(ownerEmail);
        if (recipients.isEmpty()) return;
        try {
            MailBuilder.of().to(recipients).subject("ll 平台充值成功")
                .text("订单 " + notice.orderNo() + " 已支付成功。到账余额：" + notice.credits()
                    + "，用户当前余额：" + notice.balance() + "。")
                .send();
        } catch (Exception ex) {
            log.error("send payment email for order {} failed", notice.orderNo(), ex);
        }
    }

    private String sign(Map<String,String> params) {
        StringJoiner joiner = new StringJoiner("&");
        new TreeMap<>(params).forEach((name,value) -> { if (value != null && !value.isBlank()) joiner.add(name + "=" + value); });
        return md5(joiner + key);
    }
    private boolean sameMoney(Object expected, String actual) {
        if (actual == null || actual.isBlank()) return false;
        try { return new BigDecimal(String.valueOf(expected)).compareTo(new BigDecimal(actual)) == 0; } catch (Exception ex) { return false; }
    }
    private String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
    private String md5(String value) {
        try {
            byte[] bytes = MessageDigest.getInstance("MD5").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte item : bytes) hex.append(String.format("%02x", item));
            return hex.toString();
        } catch (Exception ex) { throw new IllegalStateException(ex); }
    }
    private record PaymentNotice(String orderNo, String email, long credits, long balance) {}
}
