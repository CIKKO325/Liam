# BrandPilot AI V1.2 — Netlify 专用版

**蓝色光标 2027 秋招 | AI 营销解决方案专员：AI 自动化工具作品**

这是独立制作的可运行网页作品集，不属于蓝色光标的官方产品。它支持营销 Brief 输入 → AI 分析 → 用户洞察、品牌与渠道策略、创意文案、7 天排期和评估指标 → 一键导出 Markdown 报告。

⚠️ 首页默认的虚构示例**不是真实 AI 生成**；只有在部署后添加模型 API Key 并点击「生成 AI 营销方案」成功返回，才是实时 AI 输出。

## A. 推荐：在你已经创建的 GitHub 仓库 Liam 中部署（不用重新注册 GitHub）

1. 解压 `BrandPilot-AI-Netlify-v1.2.zip`，**进入 `BrandPilot-AI-Netlify` 文件夹内部**。
2. 打开 GitHub 中已经创建的 `CIKK0325/Liam` 仓库主页（页面顶部显示 `main` 分支、`Code` 按钮）。点击 `Add file` → `Upload files`。
3. 从电脑中选中 `BrandPilot-AI-Netlify` 文件夹**里面所有文件与文件夹**（尤其 `public/`、`netlify/`、`api/`、`netlify.toml`、`package.json`），拖入 GitHub 上传区域。不要拖 ZIP，也不要拖外层 `BrandPilot-AI-Netlify` 文件夹。点击 `Commit changes`。
4. 成功后，在 `CIKK0325/Liam` 仓库主页的**最外层**直接能看见 `public`、`netlify`、`api` 文件夹与 `netlify.toml`，这才是正确目录。你原先上传的很长的 `BrandPilot-AI-%E5.../BrandPilot-AI` 文件夹可以保留，不会影响本版部署。
5. 打开 https://app.netlify.com/start → `Import an existing project` → 选 GitHub → 授权选 `CIKK0325/Liam`。
6. Netlify 的部署设置：`Base directory` 留空（仓库根目录）；`Build command` 留空；`Publish directory` 填 `public`。`netlify.toml` 已经定义 `public` 和 `netlify/functions`，一般会自动填好。不要填 `BrandPilot-AI-%E5...` 那条旧路径。
7. 点击 `Deploy` / `Deploy site`。Netlify 会给出 `https://...netlify.app` 网站链接。**此时还没有配置 AI Key，页面可展示预设示例，点击生成会给出待配置提示。**
8. 到 Netlify 项目的 `Project configuration / Site configuration → Environment variables`（不同界面命名略有区别），添加三个变量：

   | Key | Value |
   | --- | --- |
   | `AI_API_KEY` | 你在 DeepSeek 开放平台 https://platform.deepseek.com/ 创建的 API Key（不公开） |
   | `AI_BASE_URL` | `https://api.deepseek.com` |
   | `AI_MODEL` | `deepseek-flash` |

   如果界面显示 `Scopes`，保证包含 **Functions**。完成后在 `Deploys` 里重新部署，使新配置生效。
9. 重新打开网站，顶部应该显示 **AI 已就绪**。填入示例后点击 **生成 AI 营销方案**，查看六个模块、导出报告；再通过无痕窗口测试公开访问。

## B. 项目结构

```text
BrandPilot-AI-Netlify/
├── netlify.toml             # Netlify 网站、服务端 Function、/api 路由
├── public/                  # 真正发布给公众的网页静态文件
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── sample-report.js
│   └── assets/favicon.svg
├── netlify/functions/       # Netlify 服务端函数（不直接公开代码）
│   ├── generate.mjs         # POST /api/generate（真实模型）
│   └── health.mjs           # GET /api/health（配置状态）
├── api/generate.js          # 核心模型提示词、校验、JSON 解析
├── api/health.js            # 本地兼容接口
├── tests/                   # 自动化测试
├── server.js                # 本地预览专用，不用于线上发布
└── package.json
```

## C. 常见问题

- 如果上传后只看到 `BrandPilot-AI-Netlify` 一个文件夹，说明还是多套了一层：Netlify 需要设置对应 Base directory 或重新把里面的文件上传到仓库最外层。
- 如果网站显示 404，确认 Netlify 的 **Publish directory 为 `public`**、Base directory 为**仓库根目录**。
- 如果网站能打开但模型显示“服务状态未知”，检查部署日志是否打包了 `netlify/functions/health.mjs`、`netlify.toml` 是否在仓库根目录。
- 如果显示“AI 服务待配置”，到 Environment variables 填模型密钥并重新部署。
- 如果模型 401 或 429，检查 DeepSeek 平台 API Key 和额度；ChatGPT 付费订阅不能代替 DeepSeek API 额度。
- AI 输出长报告可能较慢，前后端已有超时和错误提示，具体耗时依赖模型供应商。
- 报告导出为 Markdown（`.md`），不是 PDF。

## D. 使用与安全

- 千万别把 API Key 放入 GitHub 或网页代码。**仅填入 Netlify 的 Environment variables。**
- 若有人恶意点击生成，会消费你的模型额度。上线前建议在 DeepSeek 控制台设置额度提醒/预算限制，谨慎共享链接。当前示例尚未实现登录鉴权或强制速率限制。
- 输入与报告**不存进项目数据库**；用户输入会发送给所接模型服务以生成内容，请勿填真实商业机密。
- AI 输出可能有错，不代表真实的广告投放、舆情采集或可靠市场调研。正式使用前应核验、合规审核。

## E. 开发测试

Node.js 20+ 环境下：`npm test`。用 `npm start` 在本地 `http://localhost:3000` 查看静态网页和本地 API 测试，需用 `.env.local` 才能真实连接模型。

Netlify 文档：https://docs.netlify.com/start/quickstarts/deploy-from-repository/
