# 正式若依管理后台启动

后端 `DromaraApplication` 运行在 `http://localhost:8080` 时，官方 UI 通过 Vite 代理真实连接后端。

```powershell
cd E:\project\codex\aigc-platform\ruoyi-ui
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install
pnpm dev
```

地址：`http://localhost:5175`

代理关系：

```text
/dev-api/*  ->  http://localhost:8080/*
```

不要再使用 `http://localhost:5174` 作为正式管理后台；那是早期临时界面稿。用户端演示仍可用 `http://localhost:5173`，后续把其 API 改为同一后端即可。
