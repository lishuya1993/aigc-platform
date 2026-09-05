# 本地开发与 IDEA 启动

## 1. 目录说明

```text
aigc-platform/
├─ ruoyi-vue-plus/   正式后端底座，IDEA 打开这里
├─ web/              用户端创作页面（当前为前端工作区）
├─ admin/            临时界面稿，不是正式若依后台
├─ backend/          早期 Spring Boot 骨架，暂不启动
└─ deploy/           部署参考配置
```

正式项目以后以 `ruoyi-vue-plus` 为后端和后台权限底座。`admin` 不要作为正式后台运行。

## 2. IDEA 打开后端

1. 安装 IntelliJ IDEA 2024.3 或更高版本。
2. 下载并解压 JDK 21，例如 `E:\software\jdk-21`。
3. IDEA 选择 **Open**，打开：

   ```text
   E:\project\codex\aigc-platform\ruoyi-vue-plus
   ```

4. 选择 `pom.xml` 导入为 Maven 项目。
5. 打开 **File → Project Structure → Project**：
   - SDK：选择 JDK 21
   - Language level：21
6. 打开 **Settings → Build, Execution, Deployment → Build Tools → Maven**：
   - Maven home：选择本机 Maven 3.9.x
   - User settings：使用本机 `settings.xml`（如有私服配置）
   - JDK for importer：选择 JDK 21
7. 等待 Maven 依赖下载完成。
8. 找到启动类（通常在 `ruoyi-admin` 模块的 `src/main/java` 下），右键运行带有 `main` 方法的 `Application` 类。

项目已提供 `DromaraApplication-local` 运行配置。选择它启动，会把 Java/Jetty 临时文件放到：

```text
E:\project\codex\aigc-platform\runtime\temp
```

如果 IDEA 没有自动显示该配置，打开 `ruoyi-vue-plus/.run/DromaraApplication-local.run.xml` 后重新加载项目。也可以在运行配置的 **VM options** 手动加入：

```text
-Djava.io.tmpdir=E:\project\codex\aigc-platform\runtime\temp
```

也可以在 IDEA Terminal 使用：

```powershell
$env:JAVA_HOME='E:\software\jdk-21'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
java -version
./mvnw.cmd -pl ruoyi-admin -am spring-boot:run -Dspring-boot.run.profiles=local
```

## 3. 数据库与缓存

当前本机连接配置：

```text
MySQL：127.0.0.1:3306
用户：root
密码：123456
Redis：127.0.0.1:6379
```

先在 MySQL 创建业务库，再导入若依基础 SQL：

```sql
CREATE DATABASE IF NOT EXISTS ry_vue_plus DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
```

基础脚本位置：

```text
ruoyi-vue-plus/script/sql/ry_vue.sql
```

AIGC 菜单、套餐和算力表脚本：

```text
ruoyi-vue-plus/script/sql/ry_aigc_platform.sql
```

导入顺序是先 `ry_vue.sql`，再 `ry_aigc_platform.sql`。首次启动前检查若依 `application-local.yml` 中的数据源库名、用户名和密码。

## 4. 前端启动

用户端：

```powershell
cd E:\project\codex\aigc-platform\web
npm install
npm run dev
```

地址：`http://localhost:5173`

说明：用户端的 `/api` 已代理到 `http://localhost:8080`。后端启动后再接真实登录和动态菜单。

## 5. 正式联调顺序

1. JDK 21 + MySQL + Redis 就绪。
2. 导入两个 SQL 脚本。
3. IDEA 启动 `ruoyi-admin` 后端，确认健康检查与登录接口。
4. 用户端保留 `5173` 启动，逐步将模拟生成替换为后端接口。
5. 使用若依后台的用户、角色、菜单管理控制 AIGC 菜单和按钮权限。

## 中转站配置

所有模型请求统一由 Java 后端转发到小李中转站，浏览器不会接触 API Key。启动后端前在 IDEA 的 Run Configuration -> Environment variables 配置：

```text
XIAOLI_BASE_URL=https://xiaoli-api.xyz
XIAOLI_API_KEY=你的中转站Key
XIAOLI_MODEL=你的默认模型名
```

前台的智能文案、文案提取调用 `POST /aigc/generate`，后端按 OpenAI-compatible `POST /v1/chat/completions` 协议转发。支付、模型列表和回调仍需按中转站实际提供的接口文档配置，不能臆造接口地址。

当前不能把 `http://localhost:5174` 的临时页面当成正式若依后台；正式后台应使用 RuoYi 官方 UI 与 `ruoyi-admin` 后端配套启动。
## 从其他电脑开始开发

1. 安装 JDK 21、Node.js 20+、Maven 3.9+、MySQL 8 和 Redis 7。
2. 分别在 `web`、`admin`、`ruoyi-ui` 安装依赖并启动对应开发服务器。
3. 本地后端使用 `ruoyi-vue-plus/ruoyi-admin`，按实际环境设置 `MYSQL_PASSWORD`、`REDIS_PASSWORD`、`XIAOLI_API_KEY` 和邮件变量。
4. 若启用接口加密，设置 `API_DECRYPT_ENABLED=true`、`API_DECRYPT_PRIVATE_KEY`，并在前端环境文件配置匹配的 RSA 公钥/私钥；密钥文件只保存在本机，不提交 Git。
