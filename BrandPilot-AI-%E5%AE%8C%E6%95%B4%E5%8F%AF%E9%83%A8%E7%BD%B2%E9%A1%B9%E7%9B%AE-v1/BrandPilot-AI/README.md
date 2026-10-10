# BrandPilot AI｜智能营销策略工作台

**AI 营销解决方案专员作品集项目（独立开发演示，不属于蓝色光标官方产品）**

这是一套可实际运行的营销自动化 Web App，包含：营销 Brief 表单 → 大语言模型分析 → 用户洞察 → 品牌定位与渠道策略 → AIGC 文案与短视频脚本 → 7 天执行排期 → 指标与风险 → Markdown 报告导出。

## 项目文件

- `index.html`：工作台网页
- `styles.css`：响应式界面设计
- `app.js`：表单、报告展示、复制导出、错误提示
- `sample-report.js`：**明确标注为虚构预设示例**；方便没有 API Key 时预览页面，绝非真实模型生成。
- `api/generate.js`：服务端调用 OpenAI-compatible Chat Completions API
- `api/health.js`：检查服务端是否配置 AI Key（不会返回 Key）
- `server.js`：零依赖本地开发服务
- `.env.example`：环境变量参考；自己创建 `.env.local`，不要分享含有真实 Key 的文件

## 方案 A：最快上线（GitHub + Vercel）

**你要准备：** GitHub 账户、Vercel 账户，以及一个提供 Chat Completions 接口的模型 API Key（例如 DeepSeek；模型 API 通常独立计费，ChatGPT Plus 不能替代 API 费用）。

1. 解压本项目，把 `BrandPilot-AI` 文件夹里的文件上传到**私人 GitHub 仓库根目录**（GitHub 网页端 `Add file → Upload files`）。千万不要上传 `.env.local`。
2. 在 Vercel 创建新项目，连接该仓库并 `Import`。选择框架类型 **Other**（静态 HTML + Vercel Functions），无需 build command。
3. 在 Vercel 项目的 `Settings → Environment Variables` 添加：

   | Name | Value |
   | --- | --- |
   | `AI_API_KEY` | 你自己的模型服务 API Key |
   | `AI_BASE_URL` | `https://api.deepseek.com/v1` |
   | `AI_MODEL` | `deepseek-chat` |

4. 部署。部署后访问 `.vercel.app` 地址，网页顶部应显示“AI 已就绪”。如果是“AI 服务待配置”，检查环境变量配置的环境范围，并进行一次 **Redeploy**。
5. 点击“填入示例” → “生成 AI 营销方案” → 测试六个标签与下载报告，再用手机和浏览器无痕模式访问确认可用。
6. 把最终可公开访问的 **网页 URL** 填入应聘方的 AI 应用能力文档提交入口；如有额外 PDF 或截图要求，按招聘通知操作。

> 注意：公开网页意味着任何访客都能点击生成并消耗部署者的模型 API 额度。提交前应设置供应商侧**消费上限或限额**，使用低额度单独 API Key；测试完成也可以暂停模型 Key。生产长期公开使用应追加身份认证、服务端速率限制、防滥用和日志告警。

## 方案 B：在自己电脑先运行（Windows / macOS）

1. 安装 Node.js 18.18 或更新版本（建议 Node.js 20/22）。
2. 解压并在项目文件夹打开终端。
3. 复制 `.env.example` 为 `.env.local`，填入真实 Key（不要保留示例占位文字）。
4. 运行 `npm start`，打开 `http://localhost:3000`。
5. 本地未配置 Key 也能预览**预设示例报告**；点击生成时会明确显示“AI 服务尚未配置”，不会拿固定文案冒充实际生成。

**Windows PowerShell：**
```powershell
Copy-Item .env.example .env.local
notepad .env.local
npm start
```

**macOS / Linux：**
```bash
cp .env.example .env.local
# 打开 .env.local 填写模型 Key
npm start
```

注意：不要用双击 `index.html` 的 `file://` 方式测试 API；请在 `http://localhost:3000` 或已部署的网址下访问。

## 更换模型（OpenAI 兼容格式）

将环境变量修改为对应服务。例：
```
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
AI_API_KEY=你的OpenAI平台APIKey
```

接口采用 `/chat/completions`，要求模型兼容 `response_format: { "type": "json_object" }`。不同兼容服务可能有模型名或 JSON 输出能力差异；更换平台需要实测。

## 测试

运行 `npm test` 检查表单校验、服务端缺少 Key、模型接口兼容响应和错误处理。前端可以自行使用浏览器开发者工具测试。

## 功能说明与注意事项

- 客户输入和模型回复**没有写进数据库**，仅本次请求提交给用户配置的模型服务；请遵守第三方模型服务的数据处理条款，避免输入客户机密。
- API Key **仅放在服务端环境变量**，永远不要粘贴到前端源代码或 GitHub。
- 生成结果为 AI 策略建议，不是市场调研报告；不要把推测包装成事实，也不要声明虚构预算分配必然有效。
- 导出格式是 `.md`（通用 Markdown，可用 Typora/Word 等打开转换）。这是可用功能，不是 PDF 导出。
- 这是一版适合面试作品集的 MVP：支持功能展示和真实 AI 调用，不含数据库、多人登录、自动抓取社媒数据、实际广告投放或持续运行的独立 Agent。

## 面试中如何介绍（约 40 秒）

“我做了一个面向品牌营销需求的 AI 工作台。用户只需要输入品牌定位、受众、预算和投放渠道，工具就会通过服务端 AI 模型，把需求拆解成用户洞察、传播主张、渠道策略、AIGC 文案、7 天执行规划以及指标建议。我特意把生成内容与预设示例区分开，并要求模型标注未验证的假设，因为实际营销场景里，AI 的价值不仅是提速，更在于产出结构化且能够人工审核的方案。”

## 离线预览文件

另附单独文件 `BrandPilot-AI-离线交互预览.html` 可直接在浏览器打开查看界面、切换报告和导出虚构示例，不需要 Node.js。离线预览不能调用真实 AI，**不要把离线文件当作上线作品链接提交**。
