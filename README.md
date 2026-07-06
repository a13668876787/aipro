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

## 运营后台和访问统计

这个站点现在支持“像真实网站一样”的轻量后台：

- 今日 PV / UV
- 外部访客和站长本人访问
- 访问时间、页面、脱敏 IP、地区、设备
- 热门页面
- 点击行为：收藏、已读、复制选题、打开链接

前台仍然部署在 GitHub Pages，统计后端使用 Cloudflare Worker + D1。

### 隐私和判断逻辑

- 默认不在后台展示完整 IP，只展示脱敏 IP，例如 `113.88.xxx.xxx`。
- Worker 会保存 IP 哈希，用来辅助统计 UV，但不把原始 IP 写入数据库。
- “哪些是我访问的”不靠 IP 判断，而是靠站长设备标记。你在 `/admin/` 输入后台密钥后，点击“把当前设备标记为站长”，之后这个浏览器的访问会显示为“站长”。
- 后台密钥不写进前端代码，只存在你的浏览器 localStorage 和 Cloudflare Worker Secret。

### 部署 Cloudflare Worker

1. 安装并登录 Wrangler：

```bash
npm install
npx wrangler login
```

2. 创建 D1 数据库：

```bash
npx wrangler d1 create ai-radar-pro-analytics
```

把命令输出里的 `database_id` 填到 `worker/wrangler.toml`。

3. 初始化数据库表：

```bash
npx wrangler d1 execute ai-radar-pro-analytics --file worker/schema.sql
```

4. 设置 Worker Secret：

```bash
npx wrangler secret put ADMIN_KEY --config worker/wrangler.toml
npx wrangler secret put OWNER_TOKEN --config worker/wrangler.toml
npx wrangler secret put IP_HASH_SALT --config worker/wrangler.toml
```

建议：

- `ADMIN_KEY`：后台登录密钥，自己保存好。
- `OWNER_TOKEN`：站长设备识别 token，可以是一段很长的随机字符串。
- `IP_HASH_SALT`：IP 哈希盐，随便生成一段长随机字符串。

5. 部署 Worker：

```bash
npm run worker:deploy
```

部署后你会得到类似：

```text
https://ai-radar-pro-analytics.你的账号.workers.dev
```

### 让 GitHub Pages 接入统计

在 GitHub 仓库里打开：

`Settings -> Secrets and variables -> Actions -> Variables -> New repository variable`

新增：

```text
PUBLIC_ANALYTICS_ENDPOINT=https://你的-worker.workers.dev
```

然后重新运行 GitHub Actions 部署。前台会自动把访问和点击事件发到 Worker。

### 使用后台

打开：

```text
https://a13668876787.github.io/aipro/admin/
```

填写：

- Worker API 地址
- `ADMIN_KEY`

点击“保存并刷新”。第一次使用时再点击“把当前设备标记为站长”。
