# AI 今日雷达 Pro

漂亮公开的 AI 今日资讯站 + AI 工具目录 + 赚钱机会库 + 可筛选资料库。

核心原则：**第一性原理 + 对抗式审查**。每条资讯和机会都必须回答：真实机制是什么、谁受益、我承担什么风险、什么能独立验证、最可能失败在哪里。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:4321/`。

## 构建和验收

```bash
npm run build
npm test
npm run test:e2e
npm run preview
```

## 内容维护

- 每日资讯：`src/content/daily/*.mdx`
- 赚钱机会：`src/content/opportunities/*.mdx`
- 资料库：`src/content/library/*.mdx`
- AI 工具目录：`src/data/tools.json`

## 公开访问

推到 GitHub 后，在仓库开启 `Settings -> Pages -> Build and deployment -> GitHub Actions`。

当前外部访问地址：`https://a13668876787.github.io/aipro/`。

默认外部访问地址格式：`https://你的用户名.github.io/仓库名/`。

如果仓库名是 `你的用户名.github.io`，把 workflow 里的 `ASTRO_BASE` 改成 `/`。
