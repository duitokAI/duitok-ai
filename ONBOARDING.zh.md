# Pokaya AI 新成员上手指南

欢迎加入。本文档帮你在本机把开发环境跑起来，并对齐项目协作规则。

## 1. 前置条件

- macOS / Linux（Windows 建议用 WSL2）
- Node.js ≥ 20（建议用 [nvm](https://github.com/nvm-sh/nvm) 管理）
- Git
- [GitHub CLI](https://cli.github.com/)：`brew install gh`
- 已经被加为 `duitokAI/pokaya-ai` 的 collaborator（找 zixian 确认）

## 2. 登录 GitHub

在你自己的电脑上：

```bash
gh auth login
```

选项依次选：`GitHub.com` → `HTTPS` → `Login with a web browser`，登录你**有权限的那个 GitHub 账号**。

验证：

```bash
gh auth status
gh repo view duitokAI/pokaya-ai
```

能看到 repo 信息就说明权限 OK。

## 3. Clone 仓库

```bash
cd ~/Documents          # 或你习惯放代码的目录
git clone https://github.com/duitokAI/pokaya-ai.git
cd pokaya-ai
```

## 4. 安装依赖 & 配置环境变量

```bash
npm install
cp .env.example .env
```

打开 `.env`，向 zixian 索取以下 key（按需）：

- `APIMART_API_KEY`、`OPENAI_API_KEY`、`GEMINI_API_KEY`、`DEEPSEEK_API_KEY`、`GRSAI_API_KEY` 等 AI provider key
- `WUYIN_API_KEY`、`CRUN_API_KEY`、`AI302_API_KEY`、`ELEVENLABS_API_KEY`、`MINIMAX_API_KEY`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`（Google OAuth）
- `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET`（TikTok OAuth）
- `DATABASE_URL`（Postgres / Supabase；本地开发可留空，会 fallback 到 `data/db.json`）

不要把 `.env` 提交到 git。

## 5. 启动本地服务

```bash
npm run dev
```

默认监听 `http://localhost:4173`。Vite 会自动接管前端 HMR，后端就是 `server.mjs`。

## 6. 启动 Claude Code（重要）

必须**在 repo 目录里**启动 Claude，否则它看不到代码：

```bash
cd ~/Documents/pokaya-ai
claude
```

进入会话后第一句话告诉它：

> 读 AGENTS.md 和 DESIGN.md，按里面的规则做事。

之后 Claude 会自动遵守：

- 写给用户的 PRD / 文档默认用**中文**
- 任何代码 / 配置 / 文档改动后**自动 commit & push** 到 remote
- 不引入新的前端框架 / UI 库 / 路由架构
- Studio / backend 使用紫橙色系（`#210024`、`#32103A`、`#8B1A78`、`#C12B62`、`#FF6738`），不要硬编码新颜色
- UI 改动遵循 `.codex/skills/pokaya-ui-stability/SKILL.md`

## 7. 协作规则速查

完整版见 [AGENTS.md](AGENTS.md)、[DESIGN.md](DESIGN.md)。要点：

- **保留无关本地改动**：只 stage / commit 跟当前任务相关的文件，不要 `git add -A` 一把梭
- **不要 revert 别人的改动**，除非明确被要求
- **不要 force push** 到 `main`
- **PRD 文件名可以用英文 slug**，但内容必须中文
- **只写当前任务必要的代码**，不要顺手重构 / 加抽象 / 加防御性代码

## 8. 部署

代码 push 到 `main` 后会自动触发云端部署（Railway / Fly.io / Vercel 等，看 zixian 当前用哪个）。本地预览不算数，最终结果在云端确认。

## 9. 遇到问题

- 权限相关 / API key 缺失 → 找 zixian
- Claude 行为奇怪 / 不按规则 → 检查它有没有读 `AGENTS.md`，没读就让它读一遍
- 不确定要不要 push → 默认 push；除非是纯 PRD 规划文档
