package org.dromara.ai.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.dromara.common.mail.config.properties.MailProperties;
import org.dromara.common.mail.core.MailBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Aggregates ledger records so the operations team can audit daily user consumption. */
@Service
@RequiredArgsConstructor
@Slf4j
public class AigcUsageReportService {
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

    private final JdbcTemplate jdbc;
    private final MailProperties mailProperties;

    @Value("${aigc.notification.admin-email:}")
    private String adminEmail;

    public Map<String, Object> dailyUsage(LocalDate date) {
        LocalDate nextDate = date.plusDays(1);
        List<Map<String, Object>> rows = jdbc.queryForList("""
            select u.user_id,u.user_name,u.nick_name,u.email,
                   sum(case when f.source='TASK' and f.change_amount < 0 then 1 else 0 end) as task_count,
                   coalesce(sum(case when f.source='TASK' and f.change_amount < 0 then -f.change_amount else 0 end),0) as consumed_credits,
                   coalesce(sum(case when f.source='REFUND' then f.change_amount else 0 end),0) as refunded_credits,
                   coalesce(sum(case when f.source='PAYMENT' then f.change_amount else 0 end),0) as recharged_credits,
                   coalesce(max(a.balance),0) as current_balance
              from sys_user u
              left join aigc_credit_flow f on f.user_id=u.user_id and f.create_time >= ? and f.create_time < ?
              left join aigc_user_account a on a.user_id=u.user_id
             where u.user_type='app_user'
             group by u.user_id,u.user_name,u.nick_name,u.email
            having task_count > 0 or recharged_credits > 0 or refunded_credits > 0
             order by consumed_credits desc, task_count desc, u.user_id
            """, date.atStartOfDay(), nextDate.atStartOfDay());
        long taskCount = number(rows, "task_count");
        long consumed = number(rows, "consumed_credits");
        long refunded = number(rows, "refunded_credits");
        long recharged = number(rows, "recharged_credits");
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("date", DATE_FORMAT.format(date));
        summary.put("activeUsers", rows.size());
        summary.put("taskCount", taskCount);
        summary.put("consumedCredits", consumed);
        summary.put("refundedCredits", refunded);
        summary.put("rechargedCredits", recharged);
        summary.put("rows", rows);
        return summary;
    }

    @Scheduled(cron = "${aigc.notification.daily-usage-cron:0 10 0 * * *}", zone = "Asia/Shanghai")
    public void sendPreviousDayReport() {
        try {
            sendDailyReport(LocalDate.now().minusDays(1));
        } catch (Exception ex) {
            log.error("send aigc daily usage report failed", ex);
        }
    }

    public void sendDailyReport(LocalDate date) {
        String recipient = adminEmail == null || adminEmail.isBlank() ? mailProperties.getFrom() : adminEmail;
        if (recipient == null || recipient.isBlank()) recipient = mailProperties.getUser();
        if (recipient == null || recipient.isBlank()) throw new IllegalStateException("管理员日报邮箱未配置");
        Map<String, Object> report = dailyUsage(date);
        MailBuilder.of().to(recipient)
            .subject("LL 平台每日用量报告 " + report.get("date"))
            .text(renderReport(report))
            .send();
    }

    private long number(List<Map<String, Object>> rows, String key) {
        return rows.stream().map(row -> row.get(key)).filter(Number.class::isInstance)
            .map(Number.class::cast).mapToLong(Number::longValue).sum();
    }

    private String renderReport(Map<String, Object> report) {
        StringBuilder body = new StringBuilder("LL 平台每日用量报告\n日期：")
            .append(report.get("date"))
            .append("\n活跃用户：").append(report.get("activeUsers"))
            .append("\n任务次数：").append(report.get("taskCount"))
            .append("\n消耗算力：").append(report.get("consumedCredits"))
            .append("\n退还算力：").append(report.get("refundedCredits"))
            .append("\n充值到账：").append(report.get("rechargedCredits"))
            .append("\n\n用户明细：\n");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rows = (List<Map<String, Object>>) report.get("rows");
        if (rows.isEmpty()) return body.append("当天没有充值或消费记录。\n").toString();
        for (Map<String, Object> row : rows) {
            body.append(row.get("email")).append(" | 任务 ").append(row.get("task_count"))
                .append(" | 消耗 ").append(row.get("consumed_credits"))
                .append(" | 退款 ").append(row.get("refunded_credits"))
                .append(" | 充值 ").append(row.get("recharged_credits"))
                .append(" | 余额 ").append(row.get("current_balance")).append('\n');
        }
        return body.toString();
    }
}
