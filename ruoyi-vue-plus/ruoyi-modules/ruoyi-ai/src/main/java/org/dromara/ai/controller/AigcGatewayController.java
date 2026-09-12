package org.dromara.ai.controller;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.dromara.common.core.domain.R;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.annotation.PostConstruct;
import cn.dev33.satoken.annotation.SaCheckLogin;
import cn.dev33.satoken.annotation.SaCheckPermission;
import cn.dev33.satoken.stp.StpUtil;
import org.dromara.common.satoken.utils.LoginHelper;
import org.dromara.common.oss.client.OssClient;
import org.dromara.common.oss.factory.OssFactory;
import org.dromara.common.oss.model.Options;
import org.dromara.common.oss.model.PutObjectResult;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.Objects;
import org.springframework.transaction.support.TransactionTemplate;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/aigc")
@RequiredArgsConstructor
public class AigcGatewayController {
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactionTemplate;
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    @Value("${aigc.gateway.base-url:https://xiaoli-api.xyz}") private String baseUrl;
    @Value("${aigc.gateway.api-key:}") private String apiKey;
    @Value("${aigc.gateway.image-api-key:}") private String imageApiKey;
    @Value("${aigc.gateway.model:gpt-4o-mini}") private String defaultModel;
    @Value("${aigc.gateway.sync-on-startup:true}") private boolean syncOnStartup;
    @Value("${aigc.tts.base-url:http://172.18.0.1:8799}") private String ttsBaseUrl;
    @Value("${aigc.vidu.base-url:}") private String viduBaseUrl;
    @Value("${aigc.vidu.api-key:}") private String viduApiKey;
    @Value("${aigc.vidu.model:vidu-video-q2-turbo}") private String viduModel;

    private String clean(String value) {
        if (value == null) return "";
        String cleaned = value.trim();
        if (cleaned.length() >= 2 && ((cleaned.startsWith("\"") && cleaned.endsWith("\"")) || (cleaned.startsWith("'") && cleaned.endsWith("'")))) {
            cleaned = cleaned.substring(1, cleaned.length() - 1).trim();
        }
        return cleaned;
    }

    private String gatewayBaseUrl() { return clean(baseUrl).replaceAll("/$", ""); }
    private String gatewayApiKey() { return clean(apiKey); }
    private String imageGatewayApiKey() { return clean(imageApiKey); }

    @SaCheckLogin
    @PostMapping("/generate")
    public R<Map<String, Object>> generate(@RequestBody GenerateRequest request) {
        if (request == null || request.prompt() == null || request.prompt().isBlank()) return R.fail("请输入创作主题");
        String token = gatewayApiKey();
        if (token.isBlank() || token.startsWith("CHANGE_ME")) return R.fail("尚未配置中转站 API Key，请设置环境变量 XIAOLI_API_KEY");
        String featureCode = request.featureCode() == null || request.featureCode().isBlank() ? "copywriting" : request.featureCode().trim();
        String model;
        try {
            // The client chooses a creative capability, never a provider model.
            model = resolveSkillModel(featureCode, "chat");
        } catch (BillingException ex) {
            return R.fail(ex.getMessage());
        }
        Charge charge;
        try {
            charge = transactionTemplate.execute(status -> charge(LoginHelper.getUserId(), featureCode, model, "chat", request.prompt()));
        } catch (BillingException ex) {
            return R.fail(ex.getMessage());
        } catch (Exception ex) {
            log.error("create billed task failed", ex);
            return R.fail("创建计费任务失败，请稍后重试");
        }
        if (charge == null) return R.fail("创建计费任务失败，请稍后重试");
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", model);
            String subject = request.subject() == null ? "" : request.subject().trim();
            String systemInstruction = skillInstruction(featureCode)
                + (subject.isBlank() ? "" : "\n本次用户填写的主题是：【" + subject + "】。你的成稿必须围绕这个主题展开，并具体提到其中的关键对象或场景；如果主题是咖啡店、人物或商品，绝不能改写成泛泛的励志鸡汤。")
                + "\n只输出最终成稿，不要解释你是否理解，也不要用与主题无关的示例替代。";
            payload.put("messages", new Object[]{
                Map.of("role", "system", "content", systemInstruction),
                Map.of("role", "user", "content", request.prompt())
            });
            payload.put("temperature", request.temperature() == null ? 0.7 : request.temperature());
            HttpRequest httpRequest = HttpRequest.newBuilder().uri(URI.create(gatewayBaseUrl() + "/v1/chat/completions"))
                .timeout(Duration.ofSeconds(90)).header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token).POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload))).build();
            HttpResponse<String> response = null;
            for (int attempt = 0; attempt < 3; attempt++) {
                response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
                boolean concurrencyLimited = response.statusCode() == 429
                    || response.body().toLowerCase().contains("concurrency limit exceeded");
                if (!concurrencyLimited || attempt == 2) break;
                Thread.sleep(600L * (attempt + 1));
            }
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() / 100 != 2) {
                String message = "中转站调用失败：" + root.path("error").path("message").asText(response.body());
                refund(charge, message);
                return R.fail(message + "，本次扣费已退回");
            }
            String content = root.path("choices").path(0).path("message").path("content").asText();
            if (content.isBlank()) {
                refund(charge, "中转站返回了空结果");
                return R.fail("中转站返回了空结果，本次扣费已退回");
            }
            long balance = complete(charge, content);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("content", content);
            result.put("model", root.path("model").asText(model));
            result.put("taskNo", charge.taskNo());
            result.put("creditsCost", charge.cost());
            result.put("balance", balance);
            return R.ok(result);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            refund(charge, "模型调用被中断");
            return R.fail("模型调用被中断，本次扣费已退回");
        } catch (Exception ex) {
            log.error("call xiaoli gateway failed", ex);
            refund(charge, ex.getMessage());
            return R.fail("中转站连接失败，本次扣费已退回：" + ex.getMessage());
        }
    }

    @SaCheckLogin
    @PostMapping("/vision/describe")
    public R<Map<String, Object>> describeImage(@RequestBody Map<String, Object> body) {
        String imageUrl = body == null ? null : Objects.toString(body.get("imageUrl"), "");
        if (imageUrl.isBlank()) return R.fail("缺少图片地址");
        String token = gatewayApiKey();
        if (token.isBlank() || token.startsWith("CHANGE_ME")) return R.fail("尚未配置中转站 API Key");
        try {
            Map<String, Object> textContent = new LinkedHashMap<>();
            textContent.put("type", "text");
            textContent.put("text", "请用中文详细描述这张图片的内容：主体、场景、风格、色调，100字以内。用于为图片撰写推广文案。");
            Map<String, Object> imgContent = new LinkedHashMap<>();
            imgContent.put("type", "image_url");
            imgContent.put("image_url", Map.of("url", imageUrl));
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", "qwen-vl-plus");
            payload.put("messages", new Object[]{Map.of("role", "user", "content", new Object[]{textContent, imgContent})});
            payload.put("max_tokens", 300);
            HttpRequest httpRequest = HttpRequest.newBuilder().uri(URI.create(gatewayBaseUrl() + "/v1/chat/completions"))
                .timeout(Duration.ofSeconds(60)).header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload))).build();
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() / 100 != 2) {
                return R.fail("图片理解失败：" + root.path("error").path("message").asText(response.body()));
            }
            String desc = root.path("choices").path(0).path("message").path("content").asText();
            if (desc.isBlank()) return R.fail("图片理解返回为空");
            return R.ok(Map.of("description", desc, "model", "qwen-vl-plus"));
        } catch (Exception ex) {
            log.error("vision describe failed", ex);
            return R.fail("图片理解失败：" + ex.getMessage());
        }
    }

    @SaCheckLogin
    @PostMapping("/video/generate")
    public R<Map<String, Object>> generateVideo(@RequestBody VideoGenerateRequest request) {
        if (request == null || request.prompt() == null || request.prompt().isBlank()) return R.fail("请先生成或输入视频文案");
        String directViduKey = clean(viduApiKey);
        String directViduBase = clean(viduBaseUrl).replaceAll("/$", "");
        boolean useDirectVidu = !directViduKey.isBlank() && !directViduBase.isBlank()
            && request.imageUrl() != null && !request.imageUrl().isBlank();
        String token = gatewayApiKey();
        if (!useDirectVidu && (token.isBlank() || token.startsWith("CHANGE_ME"))) return R.fail("尚未配置中转站 API Key");
        final String selectedModel;
        try { selectedModel = useDirectVidu ? viduModel : resolveSkillModel("video", "video"); }
        catch (BillingException ex) { return R.fail(ex.getMessage()); }
        Charge charge;
        try {
            charge = transactionTemplate.execute(status -> charge(LoginHelper.getUserId(), "video", selectedModel, "video", request.prompt()));
        } catch (BillingException ex) {
            return R.fail(ex.getMessage());
        }
        if (charge == null) return R.fail("创建视频计费任务失败");
        try {
            if (useDirectVidu) {
                Map<String, Object> viduPayload = new LinkedHashMap<>();
                viduPayload.put("model", viduModel);
                viduPayload.put("images", request.imageUrl2() == null || request.imageUrl2().isBlank()
                    ? List.of(request.imageUrl()) : List.of(request.imageUrl(), request.imageUrl2()));
                viduPayload.put("prompt", request.prompt());
                String endpoint = request.imageUrl2() == null || request.imageUrl2().isBlank()
                    ? "/v1/wand/vidu/image-to-video" : "/v1/wand/vidu/start-end-to-video";
                HttpResponse<String> response = sendExternalJson(directViduBase + endpoint, "POST", directViduKey,
                    objectMapper.writeValueAsString(viduPayload));
                JsonNode root = objectMapper.readTree(response.body());
                if (response.statusCode() / 100 != 2) {
                    String message = "Vidu 视频任务提交失败：" + providerError(root, response.body());
                    refund(charge, message);
                    return R.fail(message + "，本次扣费已退回");
                }
                String providerTask = root.path("task_id").asText(root.path("id").asText());
                if (providerTask.isBlank()) { refund(charge, "Vidu 未返回任务编号"); return R.fail("Vidu 未返回任务编号，本次扣费已退回"); }
                jdbc.update("update aigc_task set gateway_task_no=? where task_no=? and status='RUNNING'", "vidu:" + providerTask, charge.taskNo());
                return R.ok(Map.of("taskNo", charge.taskNo(), "status", "RUNNING", "model", viduModel,
                    "creditsCost", charge.cost(), "balance", charge.balance()));
            }
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", selectedModel);
            payload.put("prompt", request.prompt());
            payload.put("duration", request.duration() == null ? 5 : request.duration());
            payload.put("response_format", "url");
            HttpResponse<String> response = sendJson("/v1/video/generations", "POST", token, objectMapper.writeValueAsString(payload));
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() / 100 != 2) {
                String message = "视频任务提交失败：" + providerError(root, response.body());
                refund(charge, message);
                return R.fail(message + "，本次扣费已退回");
            }
            String gatewayTaskNo = root.path("task_id").asText(root.path("id").asText());
            if (gatewayTaskNo.isBlank()) {
                refund(charge, "视频接口未返回任务编号");
                return R.fail("视频接口未返回任务编号，本次扣费已退回");
            }
            jdbc.update("update aigc_task set gateway_task_no=? where task_no=? and status='RUNNING'", gatewayTaskNo, charge.taskNo());
            return R.ok(Map.of("taskNo", charge.taskNo(), "status", "RUNNING", "model", selectedModel,
                "creditsCost", charge.cost(), "balance", charge.balance()));
        } catch (Exception ex) {
            log.error("submit video generation failed", ex);
            refund(charge, ex.getMessage());
            return R.fail("视频任务提交失败，本次扣费已退回：" + ex.getMessage());
        }
    }

    @SaCheckLogin
    @GetMapping("/video/tasks/{taskNo}")
    public R<Map<String, Object>> videoTask(@PathVariable String taskNo) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "select task_no,user_id,status,credits_cost,gateway_task_no,result_body,error_message from aigc_task where task_no=? and user_id=? and feature_code='video'",
            taskNo, LoginHelper.getUserId());
        if (rows.isEmpty()) return R.fail("视频任务不存在");
        Map<String, Object> task = rows.get(0);
        String status = String.valueOf(task.get("status"));
        if ("SUCCESS".equals(status)) return R.ok(savedVideoResult(task));
        if ("FAILED".equals(status)) return R.ok(Map.of("taskNo", taskNo, "status", "FAILED",
            "error", String.valueOf(task.get("error_message")), "balance", currentBalance(LoginHelper.getUserId())));
        String gatewayTaskNo = String.valueOf(task.get("gateway_task_no"));
        if (gatewayTaskNo.isBlank() || "null".equals(gatewayTaskNo)) return R.ok(Map.of("taskNo", taskNo, "status", "RUNNING"));
        try {
            if (gatewayTaskNo.startsWith("vidu:")) {
                String directViduKey = clean(viduApiKey), directViduBase = clean(viduBaseUrl).replaceAll("/$", "");
                if (directViduKey.isBlank() || directViduBase.isBlank()) return R.fail("Vidu 配置不完整");
                HttpResponse<String> response = sendExternalJson(directViduBase + "/v1/wand/vidu/tasks/" + gatewayTaskNo.substring(5), "GET", directViduKey, null);
                JsonNode root = objectMapper.readTree(response.body());
                if (response.statusCode() / 100 != 2) return R.fail("查询 Vidu 任务失败：" + providerError(root, response.body()));
                String providerStatus = root.path("state").asText(root.path("status").asText("processing")).toLowerCase();
                if (providerStatus.matches("failed|failure|cancelled|canceled|error")) {
                    Charge charge = new Charge(taskNo, LoginHelper.getUserId(), ((Number) task.get("credits_cost")).longValue(), 0);
                    String reason = providerError(root, root.path("err_msg").asText("Vidu 视频生成失败")); refund(charge, reason);
                    return R.ok(Map.of("taskNo", taskNo, "status", "FAILED", "error", reason, "balance", currentBalance(LoginHelper.getUserId())));
                }
                String url = root.path("creations").path(0).path("url").asText();
                if (providerStatus.matches("succeeded|success|completed") && !url.isBlank()) {
                    url = persistVideoIfPossible(url);
                    long balance = completeVideo(taskNo, url, root);
                    return R.ok(Map.of("taskNo", taskNo, "status", "SUCCESS", "url", url, "balance", balance));
                }
                return R.ok(Map.of("taskNo", taskNo, "status", "RUNNING", "providerStatus", providerStatus,
                    "progress", root.path("progress").asDouble(0)));
            }
            HttpResponse<String> response = sendJson("/v1/video/generations/" + gatewayTaskNo, "GET", gatewayApiKey(), null);
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() / 100 != 2) return R.fail("查询视频任务失败：" + providerError(root, response.body()));
            String providerStatus = root.path("status").asText("running").toLowerCase();
            if (providerStatus.equals("failed") || providerStatus.equals("failure") || providerStatus.equals("cancelled")) {
                Charge charge = new Charge(taskNo, LoginHelper.getUserId(), ((Number) task.get("credits_cost")).longValue(), 0);
                String reason = providerError(root, "视频生成失败");
                refund(charge, reason);
                return R.ok(Map.of("taskNo", taskNo, "status", "FAILED", "error", reason, "balance", currentBalance(LoginHelper.getUserId())));
            }
            if (providerStatus.equals("succeeded") || providerStatus.equals("success") || providerStatus.equals("completed")) {
                String url = root.path("url").asText();
                if (url.isBlank()) url = root.path("data").path(0).path("url").asText();
                if (url.isBlank()) url = gatewayBaseUrl() + "/v1/videos/" + gatewayTaskNo + "/content";
                long balance = completeVideo(taskNo, url, root);
                return R.ok(Map.of("taskNo", taskNo, "status", "SUCCESS", "url", url, "balance", balance));
            }
            return R.ok(Map.of("taskNo", taskNo, "status", "RUNNING", "providerStatus", providerStatus));
        } catch (Exception ex) {
            log.warn("query video task {} failed: {}", taskNo, ex.getMessage());
            return R.fail("视频任务查询暂时失败，请稍后重试");
        }
    }

    @SaCheckLogin
    @GetMapping("/video/tasks/{taskNo}/content")
    public ResponseEntity<byte[]> videoContent(@PathVariable String taskNo) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "select gateway_task_no from aigc_task where task_no=? and user_id=? and feature_code='video' and status='SUCCESS'",
            taskNo, LoginHelper.getUserId());
        if (rows.isEmpty()) return ResponseEntity.notFound().build();
        String gatewayTaskNo = String.valueOf(rows.get(0).get("gateway_task_no"));
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(gatewayBaseUrl() + "/v1/videos/" + gatewayTaskNo + "/content"))
                .timeout(Duration.ofSeconds(90)).header(HttpHeaders.AUTHORIZATION, "Bearer " + gatewayApiKey()).GET().build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() / 100 != 2) return ResponseEntity.status(response.statusCode()).build();
            String contentType = response.headers().firstValue(HttpHeaders.CONTENT_TYPE).orElse("video/mp4");
            return ResponseEntity.ok().contentType(MediaType.parseMediaType(contentType)).body(response.body());
        } catch (Exception ex) {
            log.warn("proxy video content {} failed: {}", taskNo, ex.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    private HttpResponse<String> sendJson(String path, String method, String token, String body) throws Exception {
        return sendExternalJson(gatewayBaseUrl() + path, method, token, body);
    }

    private HttpResponse<String> sendExternalJson(String url, String method, String token, String body) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder().uri(URI.create(url))
            .timeout(Duration.ofSeconds(90)).header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
            .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        HttpRequest request = "GET".equals(method) ? builder.GET().build() : builder.POST(HttpRequest.BodyPublishers.ofString(body)).build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private String providerError(JsonNode root, String fallback) {
        String message = root.path("error").path("message").asText();
        if (message.isBlank()) message = root.path("message").asText();
        return message.isBlank() ? fallback : message;
    }

    /** Store provider output in the configured OSS bucket so signed provider URLs do not expire. */
    private String persistVideoIfPossible(String providerUrl) {
        try {
            HttpRequest request = HttpRequest.newBuilder().uri(URI.create(providerUrl))
                .timeout(Duration.ofSeconds(90)).GET().build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() / 100 != 2 || response.body().length == 0) return providerUrl;
            OssClient oss = OssFactory.instance();
            String key = "aigc/video/" + UUID.randomUUID().toString().replace("-", "") + ".mp4";
            PutObjectResult result = oss.upload(key, response.body(), Options.builder().setContentType("video/mp4"));
            return result.url();
        } catch (Exception ex) {
            log.warn("persist Vidu video to OSS failed; keeping provider URL: {}", ex.getMessage());
            return providerUrl;
        }
    }

    /**
     * A feature is the user-facing Skill. Its configured model is preferred;
     * a healthy, lowest-cost model with the same capability is the fallback.
     */
    private String resolveSkillModel(String featureCode, String capability) {
        List<Map<String, Object>> preferred = jdbc.queryForList(
            "select m.model_code from aigc_feature_config f " +
                "join aigc_gateway_model m on m.id=f.gateway_model_id " +
                "join aigc_gateway g on g.id=m.gateway_id " +
                "where f.feature_code=? and f.enabled='1' and m.enabled='1' and g.enabled='1' and m.capability=? limit 1",
            featureCode, capability);
        if (!preferred.isEmpty()) return String.valueOf(preferred.get(0).get("model_code"));

        List<Map<String, Object>> fallback = jdbc.queryForList(
            "select m.model_code from aigc_gateway_model m join aigc_gateway g on g.id=m.gateway_id " +
                "where m.enabled='1' and g.enabled='1' and m.capability=? order by m.cost_credits,m.id limit 1", capability);
        if (!fallback.isEmpty()) return String.valueOf(fallback.get(0).get("model_code"));
        throw new BillingException("后台尚未配置“" + featureCode + "” Skill 的可用模型");
    }

    /** A user may choose only a model that is currently enabled for image generation. */
    private String resolveRequestedImageModel(String featureCode, String requestedModel) {
        String model = clean(requestedModel);
        if (model.isBlank()) return resolveSkillModel(featureCode, "draw");
        List<Map<String, Object>> available = jdbc.queryForList(
            "select m.model_code from aigc_gateway_model m join aigc_gateway g on g.id=m.gateway_id " +
                "where m.model_code=? and m.capability='draw' and m.enabled='1' and g.enabled='1' limit 1",
            model);
        if (available.isEmpty()) throw new BillingException("所选图片模型不可用，请在后台模型配置中启用后重试");
        return String.valueOf(available.get(0).get("model_code"));
    }

    private String skillInstruction(String featureCode) {
        String configured = loadSkillInstruction(featureCode);
        if (!configured.isBlank()) {
            return "以下是后台配置的 Skill 执行规范，请严格遵守：\n" + configured;
        }
        return switch (featureCode) {
            case "spoken_copy" -> "你是短视频口播编导。只围绕用户给定主题写可直接朗读的完整口播稿，必须有具体场景、前三秒钩子、自然转折和互动结尾；不得改写成鸡汤、教程或无关主题。";
            case "viral_spoken_copy" -> "你是擅长强钩子和高完播率的爆款口播编导。紧扣用户主题输出可直接拍摄的口播稿，表达有网感但不空泛，不得偏题。";
            case "xiaohongshu_note" -> "你是小红书内容策划。紧扣用户主题输出标题、正文和话题标签，内容具体、可发布，避免空泛说教。";
            case "rewrite" -> "你是专业文案编辑。严格保留原文事实和核心含义，只按用户要求改写、润色、扩写或精简，不新增无关主题。";
            case "title" -> "你是标题策划。只根据用户提供的内容生成标题列表，不写正文，不偏离原主题。";
            case "translate" -> "你是专业翻译。忠实翻译用户原文，保留语义、语气和格式，不扩写、不回答原文中的问题。";
            case "emotion" -> "你是情感文案作者。围绕用户给定对象和主题写有画面感、克制且能引发共鸣的成稿，不输出写作分析。";
            case "poem" -> "你是中文打油诗作者。围绕指定主题创作押韵、朗朗上口的成诗，不写解释。";
            case "lyrics" -> "你是歌词作者。紧扣指定主题和曲风输出包含主歌、副歌等结构的完整歌词，不写创作说明。";
            case "general" -> "你是通用文案助手。准确完成用户给出的写作任务，内容必须紧扣输入，不用无关的通用励志段落代替答案。";
            case "writing" -> "你是长文写作编辑。按用户指定主题、文体和篇幅输出结构完整的文章，事实不确定时不要编造。";
            case "marketing" -> "你是转化型营销文案策划。围绕用户提供的产品、受众和场景提炼卖点并给出明确行动号召，不得偷换产品。";
            case "imitate" -> "你是文案仿写编辑。分析并模仿参考文案的结构和语气，但生成全新表达，保持用户指定主题和用途。";
            case "extract" -> "你是内容提取助手。只从用户提供的材料中提取文案、事实和要点，不补充材料中不存在的信息。";
            default -> "你是中文 AI 创作助手。严格执行用户的具体创作要求，紧扣输入主题直接交付成稿，不解释过程，不输出无关的通用内容。";
        };
    }

    /** Prefer an uploaded business Skill over the built-in fallback prompt. */
    private String loadSkillInstruction(String featureCode) {
        if (featureCode == null || featureCode.isBlank()) return "";
        try {
            List<Map<String, Object>> rows = jdbc.queryForList(
                "select skill_content from sai_skill " +
                    "where lower(name)=lower(?) or lower(name)=lower(?) " +
                    "or lower(description) like lower(?) order by version desc,id desc limit 1",
                featureCode, featureCode.replace('_', '-'), "%" + featureCode + "%");
            if (rows.isEmpty()) return "";
            String content = Objects.toString(rows.get(0).get("skill_content"), "").trim();
            if (content.startsWith("---")) {
                int end = content.indexOf("---", 3);
                if (end >= 0) content = content.substring(end + 3).trim();
            }
            return content.length() > 12000 ? content.substring(0, 12000) : content;
        } catch (Exception ex) {
            log.debug("skill table is unavailable; using built-in instruction for {}", featureCode);
            return "";
        }
    }

    private Charge charge(Long userId, String featureCode, String model, String capability, String prompt) {
        List<Map<String, Object>> features = jdbc.queryForList(
            "select enabled,credits_per_call,gateway_model_id,menu_permission from aigc_feature_config where feature_code=?", featureCode);
        if (features.isEmpty() || !"1".equals(String.valueOf(features.get(0).get("enabled")))) {
            throw new BillingException("该功能暂未开放");
        }
        String permission = Objects.toString(features.get(0).get("menu_permission"), "");
        if (!permission.isBlank()) StpUtil.checkPermission(permission);
        List<Map<String, Object>> modelRows = jdbc.queryForList(
            "select m.cost_credits from aigc_gateway_model m join aigc_gateway g on g.id=m.gateway_id " +
                "where m.model_code=? and m.enabled='1' and g.enabled='1' and m.capability=? limit 1", model, capability);
        if (modelRows.isEmpty()) throw new BillingException("所选模型不可用，请重新选择");
        long featureCost = ((Number) features.get(0).get("credits_per_call")).longValue();
        long modelCost = ((Number) modelRows.get(0).get("cost_credits")).longValue();
        long cost = Math.max(featureCost, modelCost);
        jdbc.update("insert ignore into aigc_user_account(user_id,balance) values(?,0)", userId);
        long balance = ((Number) jdbc.queryForMap(
            "select balance from aigc_user_account where user_id=? for update", userId).get("balance")).longValue();
        if (balance < cost) throw new BillingException("余额不足，本次需扣费 " + cost + "，当前余额 " + balance);
        String taskNo = "AIGC" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        String requestBody;
        try {
            requestBody = objectMapper.writeValueAsString(Map.of("prompt", prompt, "model", model));
        } catch (Exception ex) {
            throw new BillingException("生成请求参数无效");
        }
        jdbc.update("insert into aigc_task(task_no,user_id,feature_code,model_code,request_body,status,credits_cost) values(?,?,?,?,?,'RUNNING',?)",
            taskNo, userId, featureCode, model, requestBody, cost);
        jdbc.update("update aigc_user_account set balance=balance-? where user_id=?", cost, userId);
        jdbc.update("insert into aigc_credit_flow(user_id,change_amount,balance,source,order_no,remark) values(?,?,?,'TASK',?,?)",
            userId, -cost, balance - cost, taskNo, featureCode + " / " + model);
        return new Charge(taskNo, userId, cost, balance - cost);
    }

    private long complete(Charge charge, String content) {
        Long balance = transactionTemplate.execute(status -> {
            try {
                String resultBody = objectMapper.writeValueAsString(Map.of("content", content));
                int updated = jdbc.update("update aigc_task set status='SUCCESS',result_body=?,error_message=null where task_no=? and status='RUNNING'",
                    resultBody, charge.taskNo());
                if (updated != 1) throw new IllegalStateException("计费任务状态异常");
                return ((Number) jdbc.queryForMap("select balance from aigc_user_account where user_id=?", charge.userId()).get("balance")).longValue();
            } catch (Exception ex) {
                throw new IllegalStateException(ex);
            }
        });
        if (balance == null) throw new IllegalStateException("无法读取账户余额");
        return balance;
    }

    private long completeVideo(String taskNo, String url, JsonNode providerResult) {
        Long balance = transactionTemplate.execute(status -> {
            try {
                String resultBody = objectMapper.writeValueAsString(Map.of("url", url, "provider", providerResult));
                jdbc.update("update aigc_task set status='SUCCESS',result_body=?,error_message=null where task_no=? and status='RUNNING'", resultBody, taskNo);
                return currentBalance(LoginHelper.getUserId());
            } catch (Exception ex) {
                throw new IllegalStateException(ex);
            }
        });
        return balance == null ? currentBalance(LoginHelper.getUserId()) : balance;
    }

    private Map<String, Object> savedVideoResult(Map<String, Object> task) {
        try {
            JsonNode result = objectMapper.readTree(String.valueOf(task.get("result_body")));
            return Map.of("taskNo", task.get("task_no"), "status", "SUCCESS", "url", result.path("url").asText(),
                "balance", currentBalance(LoginHelper.getUserId()));
        } catch (Exception ex) {
            return Map.of("taskNo", task.get("task_no"), "status", "SUCCESS", "url", "",
                "balance", currentBalance(LoginHelper.getUserId()));
        }
    }

    private long currentBalance(Long userId) {
        return ((Number) jdbc.queryForMap("select balance from aigc_user_account where user_id=?", userId).get("balance")).longValue();
    }

    private void refund(Charge charge, String reason) {
        try {
            transactionTemplate.executeWithoutResult(status -> {
                int updated = jdbc.update("update aigc_task set status='FAILED',error_message=? where task_no=? and status='RUNNING'",
                    abbreviate(reason), charge.taskNo());
                if (updated != 1) return;
                jdbc.queryForMap("select balance from aigc_user_account where user_id=? for update", charge.userId());
                jdbc.update("update aigc_user_account set balance=balance+? where user_id=?", charge.cost(), charge.userId());
                long balance = ((Number) jdbc.queryForMap("select balance from aigc_user_account where user_id=?", charge.userId()).get("balance")).longValue();
                jdbc.update("insert into aigc_credit_flow(user_id,change_amount,balance,source,order_no,remark) values(?,?,?,'REFUND',?,?)",
                    charge.userId(), charge.cost(), balance, charge.taskNo(), "生成失败自动退款");
            });
        } catch (Exception ex) {
            log.error("refund billed task {} failed", charge.taskNo(), ex);
        }
    }

    private String abbreviate(String value) {
        if (value == null || value.isBlank()) return "模型调用失败";
        return value.length() <= 1000 ? value : value.substring(0, 1000);
    }

    @SaCheckLogin
    @PostMapping("/media/generate")
    public R<Map<String, Object>> generateMedia(@RequestBody MediaGenerateRequest request) {
        if (request == null || request.featureCode() == null || request.featureCode().isBlank()) return R.fail("缺少功能编码");
        String capability = mediaCapability(request.featureCode());
        if (capability == null) return R.fail("不支持的媒体功能");
        if (request.prompt() == null || request.prompt().isBlank()) return R.fail("请输入生成描述");
        final String selectedModel;
        try { selectedModel = resolveSkillModel(request.featureCode(), capability); }
        catch (BillingException ex) { return R.fail(ex.getMessage()); }
        List<Map<String, Object>> configs = jdbc.queryForList(
            "select m.default_params from aigc_gateway_model m join aigc_gateway g on g.id=m.gateway_id " +
                "where m.model_code=? and m.capability=? and m.enabled='1' and g.enabled='1' limit 1", selectedModel, capability);
        if (configs.isEmpty()) return R.fail("所选模型不可用");
        JsonNode adapter = parseAdapter(configs.get(0).get("default_params"));
        String submitPath = adapter.path("submit_path").asText();
        if (submitPath.isBlank()) return R.fail("模型尚未配置 submit_path 接口参数");
        Charge charge;
        try {
            charge = transactionTemplate.execute(status -> charge(LoginHelper.getUserId(), request.featureCode(), selectedModel, capability, request.prompt()));
        } catch (BillingException ex) {
            return R.fail(ex.getMessage());
        }
        if (charge == null) return R.fail("创建媒体计费任务失败");
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", selectedModel);
            payload.put("prompt", request.prompt());
            if (request.inputUrl() != null && !request.inputUrl().isBlank()) payload.put("input_url", request.inputUrl());
            if (request.inputUrl2() != null && !request.inputUrl2().isBlank()) payload.put("input_url_2", request.inputUrl2());
            if (request.options() != null) payload.putAll(request.options());
            HttpResponse<String> response = sendJson(submitPath, "POST", gatewayApiKey(), objectMapper.writeValueAsString(payload));
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() / 100 != 2) {
                String message = "媒体任务提交失败：" + providerError(root, response.body());
                refund(charge, message);
                return R.fail(message + "，本次扣费已退回");
            }
            String url = extractResultUrl(root);
            if (!url.isBlank()) {
                long balance = completeMedia(charge.taskNo(), url, root);
                return R.ok(Map.of("taskNo", charge.taskNo(), "status", "SUCCESS", "url", url,
                    "model", selectedModel, "creditsCost", charge.cost(), "balance", balance));
            }
            String gatewayTaskNo = root.path("task_id").asText(root.path("id").asText());
            if (gatewayTaskNo.isBlank()) {
                refund(charge, "媒体接口未返回结果地址或任务编号");
                return R.fail("媒体接口未返回结果地址或任务编号，本次扣费已退回");
            }
            jdbc.update("update aigc_task set gateway_task_no=? where task_no=? and status='RUNNING'", gatewayTaskNo, charge.taskNo());
            return R.ok(Map.of("taskNo", charge.taskNo(), "status", "RUNNING", "model", selectedModel,
                "creditsCost", charge.cost(), "balance", charge.balance()));
        } catch (Exception ex) {
            log.error("submit media generation failed", ex);
            refund(charge, ex.getMessage());
            return R.fail("媒体任务提交失败，本次扣费已退回：" + ex.getMessage());
        }
    }

    @SaCheckLogin
    @GetMapping("/media/tasks/{taskNo}")
    public R<Map<String, Object>> mediaTask(@PathVariable String taskNo) {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "select t.task_no,t.user_id,t.feature_code,t.model_code,t.status,t.credits_cost,t.gateway_task_no,t.result_body,t.error_message,m.default_params " +
                "from aigc_task t left join aigc_gateway_model m on m.model_code=t.model_code where t.task_no=? and t.user_id=?",
            taskNo, LoginHelper.getUserId());
        if (rows.isEmpty()) return R.fail("媒体任务不存在");
        Map<String, Object> task = rows.get(0);
        String capability = mediaCapability(String.valueOf(task.get("feature_code")));
        if (capability == null) return R.fail("任务类型不正确");
        String status = String.valueOf(task.get("status"));
        if ("SUCCESS".equals(status)) return R.ok(savedMediaResult(task));
        if ("FAILED".equals(status)) return R.ok(Map.of("taskNo", taskNo, "status", "FAILED",
            "error", String.valueOf(task.get("error_message")), "balance", currentBalance(LoginHelper.getUserId())));
        String gatewayTaskNo = Objects.toString(task.get("gateway_task_no"), "");
        JsonNode adapter = parseAdapter(task.get("default_params"));
        String queryPath = adapter.path("query_path").asText();
        if (gatewayTaskNo.isBlank() || queryPath.isBlank()) return R.ok(Map.of("taskNo", taskNo, "status", "RUNNING"));
        try {
            HttpResponse<String> response = sendJson(queryPath.replace("{task_id}", gatewayTaskNo), "GET", gatewayApiKey(), null);
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() / 100 != 2) return R.fail("查询媒体任务失败：" + providerError(root, response.body()));
            String providerStatus = root.path("status").asText("running").toLowerCase();
            if (providerStatus.matches("failed|failure|cancelled|canceled")) {
                Charge charge = new Charge(taskNo, LoginHelper.getUserId(), ((Number) task.get("credits_cost")).longValue(), 0);
                String reason = providerError(root, "媒体生成失败");
                refund(charge, reason);
                return R.ok(Map.of("taskNo", taskNo, "status", "FAILED", "error", reason, "balance", currentBalance(LoginHelper.getUserId())));
            }
            String url = extractResultUrl(root);
            if (providerStatus.matches("succeeded|success|completed") && !url.isBlank()) {
                long balance = completeMedia(taskNo, url, root);
                return R.ok(Map.of("taskNo", taskNo, "status", "SUCCESS", "url", url, "balance", balance));
            }
            return R.ok(Map.of("taskNo", taskNo, "status", "RUNNING", "providerStatus", providerStatus));
        } catch (Exception ex) {
            log.warn("query media task {} failed: {}", taskNo, ex.getMessage());
            return R.fail("媒体任务查询暂时失败，请稍后重试");
        }
    }

    private String mediaCapability(String featureCode) {
        return switch (featureCode) {
            case "music" -> "music";
            case "voice_clone" -> "audio";
            case "avatar_clone", "photo_dh" -> "digital_human";
            case "face_merge" -> "face_merge";
            default -> null;
        };
    }

    private JsonNode parseAdapter(Object value) {
        try { return value == null ? objectMapper.createObjectNode() : objectMapper.readTree(String.valueOf(value)); }
        catch (Exception ignored) { return objectMapper.createObjectNode(); }
    }

    private String extractResultUrl(JsonNode root) {
        String url = root.path("url").asText();
        if (url.isBlank()) url = root.path("audio_url").asText();
        if (url.isBlank()) url = root.path("video_url").asText();
        if (url.isBlank()) url = root.path("data").path("url").asText();
        if (url.isBlank()) url = root.path("data").path(0).path("url").asText();
        if (url.isBlank()) url = root.path("output").path("url").asText();
        return url;
    }

    private long completeMedia(String taskNo, String url, JsonNode providerResult) {
        Long balance = transactionTemplate.execute(status -> {
            try {
                String resultBody = objectMapper.writeValueAsString(Map.of("url", url, "provider", providerResult));
                jdbc.update("update aigc_task set status='SUCCESS',result_body=?,error_message=null where task_no=? and status='RUNNING'", resultBody, taskNo);
                return currentBalance(LoginHelper.getUserId());
            } catch (Exception ex) { throw new IllegalStateException(ex); }
        });
        return balance == null ? currentBalance(LoginHelper.getUserId()) : balance;
    }

    private Map<String, Object> savedMediaResult(Map<String, Object> task) {
        try {
            JsonNode result = objectMapper.readTree(String.valueOf(task.get("result_body")));
            return Map.of("taskNo", task.get("task_no"), "status", "SUCCESS", "url", result.path("url").asText(),
                "balance", currentBalance(LoginHelper.getUserId()));
        } catch (Exception ex) {
            return Map.of("taskNo", task.get("task_no"), "status", "SUCCESS", "url", "",
                "balance", currentBalance(LoginHelper.getUserId()));
        }
    }

    @SaCheckLogin
    @PostMapping("/image/generate")
    public R<Map<String, Object>> generateImage(@RequestBody ImageGenerateRequest request) {
        if (request == null || request.prompt() == null || request.prompt().isBlank()) return R.fail("请输入绘画描述");
        String token = imageGatewayApiKey();
        if (token.isBlank() || token.startsWith("CHANGE_ME")) return R.fail("尚未配置图片生成 API Key");
        String featureCode = clean(request.featureCode());
        if (!featureCode.equals("image") && !featureCode.equals("gpt_image")) featureCode = "image";
        final String selectedModel;
        try { selectedModel = resolveRequestedImageModel(featureCode, request.model()); }
        catch (BillingException ex) { return R.fail(ex.getMessage()); }
        Charge charge;
        try {
            String billingFeatureCode = featureCode;
            charge = transactionTemplate.execute(status -> charge(LoginHelper.getUserId(), billingFeatureCode, selectedModel, "draw", request.prompt()));
        } catch (BillingException ex) {
            return R.fail(ex.getMessage());
        }
        if (charge == null) return R.fail("创建绘图计费任务失败");
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", selectedModel);
            payload.put("prompt", request.prompt());
            payload.put("size", request.size() == null || request.size().isBlank() ? "1024x1024" : request.size());
            List<String> referenceImages = new ArrayList<>();
            if (request.imageUrls() != null) referenceImages.addAll(request.imageUrls().stream().filter(Objects::nonNull).filter(url -> !url.isBlank()).limit(10).toList());
            if (request.imageUrl() != null && !request.imageUrl().isBlank() && !referenceImages.contains(request.imageUrl())) referenceImages.add(0, request.imageUrl());
            if (!referenceImages.isEmpty()) payload.put("images", referenceImages);
            // GPT Image models return b64_json and reject the legacy response_format field.
            // Other OpenAI-compatible image providers still support URL responses.
            if (!isGptImageModel(selectedModel)) payload.put("response_format", "url");
            if (request.quality() != null && !request.quality().isBlank()) payload.put("quality", request.quality());
            if (request.background() != null && !request.background().isBlank()) payload.put("background", request.background());
            if (request.outputFormat() != null && !request.outputFormat().isBlank()) payload.put("output_format", request.outputFormat());
            HttpResponse<String> response = sendJson("/v1/images/generations", "POST", token, objectMapper.writeValueAsString(payload));
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() / 100 != 2) {
                String message = "绘图失败：" + providerError(root, response.body());
                refund(charge, message);
                return R.fail(message + "，本次扣费已退回");
            }
            String url = root.path("data").path(0).path("url").asText();
            if (url.isBlank()) {
                String encoded = root.path("data").path(0).path("b64_json").asText();
                if (!encoded.isBlank()) url = persistBase64Image(encoded, request.outputFormat());
            }
            if (url.isBlank()) {
                refund(charge, "绘图接口未返回图片地址");
                return R.fail("绘图接口未返回图片地址，本次扣费已退回");
            }
            long balance = complete(charge, url);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("url", url);
            result.put("model", selectedModel);
            result.put("taskNo", charge.taskNo());
            result.put("creditsCost", charge.cost());
            result.put("balance", balance);
            return R.ok(result);
        } catch (Exception ex) {
            log.error("call image generation failed", ex);
            refund(charge, ex.getMessage());
            return R.fail("绘图请求失败，本次扣费已退回：" + ex.getMessage());
        }
    }

    private boolean isGptImageModel(String model) {
        String normalized = clean(model).toLowerCase();
        return normalized.matches(".*(gpt[-_]?image|image[-_]?1).*" );
    }

    private String persistBase64Image(String encoded, String outputFormat) {
        try {
            int comma = encoded.indexOf(',');
            if (encoded.startsWith("data:") && comma > 0) encoded = encoded.substring(comma + 1);
            byte[] bytes = Base64.getDecoder().decode(encoded);
            String extension = clean(outputFormat).toLowerCase();
            if (!extension.matches("png|jpeg|jpg|webp")) extension = "png";
            String contentType = extension.equals("png") ? "image/png" : extension.equals("webp") ? "image/webp" : "image/jpeg";
            OssClient oss = OssFactory.instance();
            String key = "aigc/image/" + UUID.randomUUID().toString().replace("-", "") + "." + extension;
            PutObjectResult result = oss.upload(key, bytes, Options.builder().setContentType(contentType));
            return result.url();
        } catch (Exception ex) {
            log.warn("persist GPT Image base64 result to OSS failed: {}", ex.getMessage());
            return "";
        }
    }

    /** Pull all models visible to the configured key into the admin model catalog. */
    @SaCheckPermission("gateway:model:sync")
    @PostMapping("/models/sync")
    public R<Map<String, Object>> syncModels() {
        return R.ok(syncModelsInternal());
    }

    @PostConstruct
    public void syncModelsOnStartup() {
        try {
            ensureMediaFeatures();
            ensureDirectViduCatalog();
            if (syncOnStartup && !gatewayApiKey().isBlank() && !gatewayApiKey().startsWith("CHANGE_ME")) {
                syncModelsInternal();
            }
        } catch (Exception ex) {
            log.warn("initial gateway model sync skipped: {}", ex.getMessage());
        }
    }

    private void ensureMediaFeatures() {
        Object[][] features = {
            {"copywriting", "通用文案", "aigc:copywriting:run", 1L},
            {"spoken_copy", "口播文案", "aigc:spokenCopy:run", 1L},
            {"viral_spoken_copy", "爆款口播", "aigc:viralSpokenCopy:run", 1L},
            {"xiaohongshu_note", "小红书笔记", "aigc:xiaohongshuNote:run", 1L},
            {"rewrite", "文案改写", "aigc:rewrite:run", 1L},
            {"title", "标题生成", "aigc:title:run", 1L},
            {"translate", "翻译文案", "aigc:translate:run", 1L},
            {"emotion", "情感文案", "aigc:emotion:run", 1L},
            {"poem", "打油诗", "aigc:poem:run", 1L},
            {"lyrics", "歌词创作", "aigc:lyrics:run", 1L},
            {"general", "通用写作", "aigc:general:run", 1L},
            {"writing", "智能写作", "aigc:writing:run", 1L},
            {"marketing", "营销文案", "aigc:marketing:run", 1L},
            {"imitate", "文案仿写", "aigc:imitate:run", 1L},
            {"extract", "文案提取", "aigc:extract:run", 1L},
            {"music", "AI音乐", "aigc:music:run", 10L},
            {"voice_clone", "声音克隆", "aigc:voiceClone:run", 20L},
            {"avatar_clone", "形象克隆", "aigc:avatarClone:run", 30L},
            {"face_merge", "人脸融合", "aigc:faceMerge:run", 20L},
            {"photo_dh", "照片数字人", "aigc:photoDigitalHuman:run", 30L}
        };
        for (Object[] feature : features) {
            jdbc.update("insert into aigc_feature_config(feature_code,feature_name,menu_permission,credits_per_call,enabled) values(?,?,?,?,'1') " +
                "on duplicate key update feature_name=values(feature_name),menu_permission=values(menu_permission)", feature);
        }
        // Text Skills should inherit the configured general-copy model instead of
        // silently falling back to the cheapest, often weaker chat model.
        jdbc.update("update aigc_feature_config f join aigc_feature_config base on base.feature_code='copywriting' " +
            "set f.gateway_model_id=base.gateway_model_id where f.gateway_model_id is null and f.feature_code in " +
            "('general','spoken_copy','viral_spoken_copy','xiaohongshu_note','rewrite','title','translate','emotion','poem','lyrics','writing','marketing','imitate','extract')");
    }

    private void ensureDirectViduCatalog() {
        boolean configured = !clean(viduApiKey).isBlank() && !clean(viduBaseUrl).isBlank();
        jdbc.update("insert into aigc_gateway(gateway_code,gateway_name,base_url,api_key,enabled) values('vidu-direct','腾讯混元 Vidu',?,'ENV:VIDU_API_KEY',?) " +
            "on duplicate key update gateway_name=values(gateway_name),base_url=values(base_url),api_key=values(api_key),enabled=values(enabled)",
            clean(viduBaseUrl), configured ? "1" : "0");
        Long gatewayId = jdbc.queryForObject("select id from aigc_gateway where gateway_code='vidu-direct'", Long.class);
        jdbc.update("insert into aigc_gateway_model(gateway_id,model_code,model_name,capability,enabled,cost_credits) values(?,?,?,'video',?,1) " +
            "on duplicate key update model_name=values(model_name),capability='video',enabled=values(enabled)",
            gatewayId, viduModel, "Vidu Q2 Turbo 图生视频", configured ? "1" : "0");
        if (configured) {
            jdbc.update("update aigc_feature_config f join aigc_gateway_model m on m.gateway_id=? and m.model_code=? " +
                "set f.gateway_model_id=m.id where f.feature_code='video' and f.gateway_model_id is null", gatewayId, viduModel);
        }
    }

    private Map<String, Object> syncModelsInternal() {
        String token = gatewayApiKey();
        if (token.isBlank()) throw new IllegalStateException("请先配置中转站 API Key");
        try {
            HttpRequest req = HttpRequest.newBuilder().uri(URI.create(gatewayBaseUrl() + "/v1/models"))
                .timeout(Duration.ofSeconds(30)).header(HttpHeaders.AUTHORIZATION, "Bearer " + token).GET().build();
            HttpResponse<String> response = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 401) throw new IllegalStateException("中转站 API Key 无效或已失效，请重新申请并配置 XIAOLI_API_KEY");
            if (response.statusCode() / 100 != 2) throw new IllegalStateException("模型列表获取失败：HTTP " + response.statusCode());
            JsonNode data = objectMapper.readTree(response.body()).path("data");
            Long gatewayId = jdbc.queryForObject("select id from aigc_gateway where gateway_code='xiaoli' limit 1", Long.class);
            if (gatewayId == null) throw new IllegalStateException("请先初始化小李中转站渠道");
            // Models not returned as OpenAI-compatible text chat models are hidden from users.
            jdbc.update("update aigc_gateway_model set enabled='0' where gateway_id=?", gatewayId);
            int count = 0;
            for (JsonNode model : data) {
                String code = model.path("id").asText(); if (code.isBlank()) continue;
                String capability = modelCapability(model, code);
                if (capability == null) continue;
                jdbc.update("insert into aigc_gateway_model(gateway_id,model_code,model_name,capability,enabled,cost_credits) values(?,?,?,?,'1',1) on duplicate key update model_name=values(model_name),capability=values(capability),enabled='1'", gatewayId, code, code, capability);
                count++;
            }
            return Map.of("count", count);
        } catch (Exception ex) { log.error("sync gateway models failed", ex); throw new IllegalStateException("模型列表同步失败：" + ex.getMessage(), ex); }
    }

    private boolean supportsTextChat(JsonNode model, String code) {
        String normalized = code.toLowerCase();
        if (normalized.matches(".*(image|video|music|tts|whisper|embedding|rerank|dall-e|sora|kolors|flux|midjourney).*")) {
            return false;
        }
        JsonNode endpointTypes = model.path("supported_endpoint_types");
        if (endpointTypes.isArray() && !endpointTypes.isEmpty()) {
            for (JsonNode endpointType : endpointTypes) {
                String type = endpointType.asText().toLowerCase();
                if (type.equals("openai") || type.contains("chat") || type.contains("completion")) return true;
            }
            return false;
        }
        return true;
    }
    private String modelCapability(JsonNode model, String code) {
        String normalized = code.toLowerCase();
        if (normalized.matches(".*(music|suno|udio|song).*")) return "music";
        if (normalized.matches(".*(voice-clone|voice_clone|cosyvoice|elevenlabs|speech-clone).*")) return "audio";
        if (normalized.matches(".*(digital-human|digital_human|heygen|d-id|avatar-video|talking-photo).*")) return "digital_human";
        if (normalized.matches(".*(face-merge|face_merge|facefusion|faceswap|face-swap).*")) return "face_merge";
        if (normalized.matches(".*(video|sora|veo|kling|hailuo|wan2\\.|cogvideo|vidu|seedance).*")) return "video";
        if (normalized.matches(".*(image|draw|flux|dall-e|kolors|z-image|midjourney|stable-diffusion|sd3).*")) return "draw";
        return supportsTextChat(model, code) ? "chat" : null;
    }
    private record Charge(String taskNo, Long userId, long cost, long balance) {}
    private static class BillingException extends RuntimeException {
        BillingException(String message) { super(message); }
    }
    public record GenerateRequest(String prompt, String subject, String model, Double temperature, String featureCode) {}
    public record VideoGenerateRequest(String prompt, String model, Integer duration, String imageUrl, String imageUrl2) {}
    public record ImageGenerateRequest(String prompt, String model, String size, String quality, String background, String outputFormat, String imageUrl, List<String> imageUrls, String featureCode) {}
    public record MediaGenerateRequest(String featureCode, String prompt, String model, String inputUrl, String inputUrl2, Map<String, Object> options) {}

    // ============ 模板剪辑 (图片+配音合成视频) ============
    @SaCheckLogin
    @PostMapping("/video/compose")
    public R<Map<String, Object>> composeVideo(@RequestBody Map<String, Object> body) {
        StpUtil.checkPermission("aigc:templateEdit:run");
        if (body == null) return R.fail("参数不能为空");
        Object imgObj = body.get("images");
        if (!(imgObj instanceof List) || ((List<?>) imgObj).isEmpty()) return R.fail("请至少选择一张图片");
        String text = Objects.toString(body.get("text"), "");
        if (text.isBlank()) return R.fail("请输入配音文案");
        String voice = Objects.toString(body.get("voice"), "");
        if (voice.isBlank()) voice = "zh-CN-XiaoxiaoNeural";
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("images", imgObj);
            payload.put("text", text);
            payload.put("voice", voice);
            HttpRequest req = HttpRequest.newBuilder().uri(URI.create(ttsBaseUrl + "/video/compose"))
                .timeout(Duration.ofSeconds(300)).header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload))).build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(resp.body());
            if (resp.statusCode() / 100 != 2 || root.path("code").asInt() != 200) {
                return R.fail("合成失败：" + root.path("msg").asText(resp.body()));
            }
            String url = root.path("data").path("url").asText();
            if (url.isBlank()) return R.fail("合成失败：无返回地址");
            String taskNo = recordLocalOutput("template_edit", "edge-tts-compose", text, url);
            return R.ok(Map.of("url", url, "taskNo", taskNo));
        } catch (Exception ex) {
            log.error("compose failed", ex);
            return R.fail("合成服务连接失败：" + ex.getMessage());
        }
    }

    // ============ AI 配音 (edge-tts) ============
    @SaCheckLogin
    @PostMapping("/tts")
    public R<Map<String, Object>> tts(@RequestBody Map<String, Object> body) {
        StpUtil.checkPermission("aigc:tts:run");
        String text = body == null ? null : Objects.toString(body.get("text"), "");
        if (text == null || text.isBlank()) return R.fail("请输入配音文本");
        if (text.length() > 3000) return R.fail("文本过长（最多3000字）");
        String voice = body == null ? "" : Objects.toString(body.get("voice"), "");
        if (voice.isBlank()) voice = "zh-CN-XiaoxiaoNeural";
        try {
            Map<String, Object> payload = Map.of("text", text, "voice", voice);
            HttpRequest req = HttpRequest.newBuilder().uri(URI.create(ttsBaseUrl + "/tts"))
                .timeout(Duration.ofSeconds(60)).header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload))).build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(resp.body());
            if (resp.statusCode() / 100 != 2 || root.path("code").asInt() != 200) {
                return R.fail("配音生成失败：" + root.path("msg").asText(resp.body()));
            }
            String url = root.path("data").path("url").asText();
            if (url.isBlank()) return R.fail("配音生成失败：无返回地址");
            String taskNo = recordLocalOutput("tts", "edge-tts", text, url);
            return R.ok(Map.of("url", url, "voice", voice, "taskNo", taskNo));
        } catch (Exception ex) {
            log.error("tts failed", ex);
            return R.fail("配音服务连接失败：" + ex.getMessage());
        }
    }

    // ============ 用户素材 ============
    @SaCheckLogin
    @PostMapping("/material")
    public R<Void> addMaterial(@RequestBody Map<String, Object> body) {
        StpUtil.checkPermission("aigc:materials:view");
        String url = body == null ? null : Objects.toString(body.get("url"), "");
        if (url.isBlank()) return R.fail("缺少素材地址");
        String name = body == null ? "" : Objects.toString(body.get("name"), "");
        jdbc.update("insert into aigc_material(user_id,url,name,type) values(?,?,?,?)",
            LoginHelper.getUserId(), url, name, "image");
        return R.ok();
    }

    @SaCheckLogin
    @GetMapping("/materials")
    public R<List<Map<String, Object>>> listMaterials() {
        StpUtil.checkPermission("aigc:materials:view");
        return R.ok(jdbc.queryForList(
            "select id,url,name,type,create_time from aigc_material where user_id=? order by create_time desc limit 200",
            LoginHelper.getUserId()));
    }

    @SaCheckLogin
    @DeleteMapping("/material/{id}")
    public R<Void> deleteMaterial(@PathVariable Long id) {
        StpUtil.checkPermission("aigc:materials:view");
        jdbc.update("delete from aigc_material where id=? and user_id=?", id, LoginHelper.getUserId());
        return R.ok();
    }

    /** Store free local outputs alongside paid model tasks so the works page is complete. */
    private String recordLocalOutput(String featureCode, String modelCode, String prompt, String url) {
        String taskNo = "AIGC" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
        try {
            String requestBody = objectMapper.writeValueAsString(Map.of("prompt", prompt, "model", modelCode));
            String resultBody = objectMapper.writeValueAsString(Map.of("url", url));
            jdbc.update("insert into aigc_task(task_no,user_id,feature_code,model_code,request_body,status,credits_cost,result_body) values(?,?,?,?,?,'SUCCESS',0,?)",
                taskNo, LoginHelper.getUserId(), featureCode, modelCode, requestBody, resultBody);
            return taskNo;
        } catch (Exception ex) {
            log.warn("record local output failed: {}", ex.getMessage());
            return "";
        }
    }
}
