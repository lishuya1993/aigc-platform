# AIGC Platform

正式工程目录，和根目录下的 `aigc-demo` 静态演示互不影响。

## 技术基线

- Java 21
- Spring Boot 3.5.6
- Spring Security（认证与接口授权）
- MyBatis-Plus（数据访问）
- MySQL 8、Redis、RabbitMQ、OSS/COS
- Vue 3 + TypeScript + Element Plus（用户端与管理后台）

Java 21 的虚拟线程通过 `spring.threads.virtual.enabled=true` 开启。生产环境使用 JDK 21 LTS、Docker 和 Nginx。

## 目录

```text
aigc-platform/
  backend/       Spring Boot API
  web/           用户端 Vue 应用（后续接入）
  admin/         管理后台 Vue 应用（后续接入）
  deploy/        Docker/Nginx/初始化脚本
```

首期权限模型包含用户、角色、菜单、按钮权限四层关系，后台菜单和接口权限均从数据库配置，不写死在前端。

## 启动

完整的 IDEA、本地数据库和前后端联调步骤见 [DEVELOPMENT.md](./DEVELOPMENT.md)。正式后端底座为 `ruoyi-vue-plus`，不是早期 `backend` 骨架。当前阶段需要在 IDEA 中打开 `ruoyi-vue-plus`，配置 JDK 21 后运行 `ruoyi-admin` 启动类。

## 开源底座选择

首版使用 Spring Security + MyBatis-Plus，依赖成熟生态且保留后续拆分空间；不引入重型一体化后台脚手架，避免被其目录和升级节奏限制。若后续需要快速搭建运营页面，可在 admin 端按 Element Plus Admin 的开源组件模式补充，不改变后端权限模型。
