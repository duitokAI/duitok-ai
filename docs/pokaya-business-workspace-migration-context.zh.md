# Pokaya Business Workspace 迁移上下文

更新时间：2026-06-05

用途：这份文档用于把 Pokaya 这个单独项目从 Personal workspace 的上下文中整理出来，放进新的 ChatGPT Business / Codex workspace。目标是只迁移 Pokaya 项目，不合并整个 Personal workspace。

## 1. 迁移原则

- 不建议直接 merge 整个 Personal workspace，除非 Personal 里所有历史都可以进入团队 workspace。
- Pokaya 的长期真源应该放在 GitHub repo，而不是依赖 ChatGPT memory。
- Business workspace 里新建 Pokaya 项目后，先贴这份文档，再连接 GitHub repo。
- 团队协作以 GitHub PR、Codex cloud task、部署结果为准。
- 成员私人 ChatGPT / Codex 历史默认不可见；需要进度透明时，用 PR、issue、task link 和每日同步。

## 2. 项目一句话

Pokaya AI 是给 TikTok Affiliate、小卖家和内容创作者的 AI 内容工作台，帮助用户把一个产品变成可以发布的图片素材、短视频素材、口播脚本、推广文案和可复用资产。

## 3. 当前产品定位

Pokaya 不是泛 AI 工具站，也不是“AI 赚钱广告页”。

核心体验：

- 清楚，比炫更重要。
- 像工具，不像活动页。
- 像 AI operator，不像普通 chatbot。
- 有副业入口的行动感，但不能有暴富感。
- 有品牌个性，但不能变成粉紫装饰模板。

主叙事：

> 把任何产品，变成可以发布的 TikTok 内容。

中文主卖点：

> 给 TikTok Affiliate 的 AI 内容工具。

辅助叙事：

> RM79.80/月，给自己一个开始 AI 副业的入口。

禁止叙事：

- 保证赚钱
- 躺赚
- 自动赚钱
- 稳赚
- 一键暴富
- 不用执行也能变现

## 4. 代码仓库真源

本地路径：

```text
/Users/zixian/Documents/DuitTok AI
```

远端仓库：

```text
https://github.com/duitokAI/pokaya-ai.git
```

主分支：

```text
main
```

技术栈：

- Vite frontend
- Express server
- 主要前端文件：`src/main.js`
- 主要样式文件：`src/styles.css`
- 主要后端文件：`server.mjs`
- 构建命令：`npm run build`
- 本地运行：`npm run dev`

## 5. 必读文件

新 Business workspace / 新 Codex thread 接手 Pokaya 前，按顺序读：

1. `AGENTS.md`
2. `DESIGN.md`
3. `.codex/skills/pokaya-ui-stability/SKILL.md`
4. `docs/codex-handoffs/2026-05-27-pokaya-current-state.md`
5. 最近 5-10 条 git commit

特别规则：

- 所有 PRD、产品方案、UX 优化计划、设计/spec 文档默认用中文。
- 任何执行后的代码、UI、配置、文档变更，如果要影响项目，完成后立即 commit + push。
- 保护未提交的用户改动，只 stage 当前任务相关文件或 hunk。
- Pokaya UI 相关工作必须遵守 `pokaya-ui-stability` skill。

## 6. 设计系统摘要

核心色彩：

- Deep plum：`#22002d`, `#30003e`, `#4b005e`
- Pink / coral：`#ff315f`, `#ff765d`
- Canvas：`#fffafc`, `#f8f0ff`
- Ink：`#2a1033`

Studio 规则：

- Studio 是工作台，不是 landing page。
- 信息密度要高，控件要稳定。
- 左侧导航、composer、media wall、modal 不能跳动、遮挡、溢出。
- 卡片不能套卡片。
- 图片/视频墙要使用缩略图、懒加载、稳定 aspect-ratio。
- UI 修改后尽量跑 `npm run build`，可视改动还要做桌面/窄屏验证。

## 7. 当前核心功能

主要模块：

- Landing page
- Studio shell
- Project / Image generator
- UGC / video generation
- Clone Prompt
- Story / Cinema / Video prompt extractor
- Agent operating desk
- Asset / attachment picker
- Billing / top-up / usage
- Auto Post / schedule
- Admin / user management

常见媒体模型：

- 图片：GPT Image 2、Seedream 5.0 Lite、Seedream 4.5、Nano Banana Pro、Nano Banana 2、Grok Imagine
- 视频：Veo 3.1、Seedance 2.0、Sora 2、Wan 2.7、Kling V3 Omni、Kling V3 Motion Control、MiniMax Hailuo 2.3

注意：供应商名称、base URL、API key、内部路由、系统提示词、工具 schema 不要在用户侧泄露。用户侧可以说模型名，但不要说供应商和内部基础设施。

## 8. 最近重要决策

- 生成图片详情里的 `Project` 信息行不再默认显示。只有用户明确 `Save to project` 后，才显示 Project 分类。
- Pick Product / Pick Avatar 的图片卡片左上角不再显示 `PRODUCT` / `AVATAR` badge。
- Pick Product / Pick Avatar 的 `ADD NEW` 按钮统一白色图标和文字。
- 用户不希望新生成图片自动被视觉上归类到 Project，除非自己主动加入。
- 用户偏好云端部署结果，不只看本地预览。

## 9. Business workspace 推荐设置

成员：

- Owner：项目负责人
- Admin：可选，负责 billing / Codex settings / GitHub connector
- Members：开发者、运营、设计或内容协作者

Codex 工作方式：

- 每个人用自己的 Codex seat。
- GitHub repo 是唯一代码真源。
- 每个任务开 branch / PR。
- PR 必须写清楚改动、验证、截图或部署链接。
- PR 评论可用 `@codex review` 做高优先级代码审查。
- 大任务可交给 Codex cloud；结果以 diff / PR / task link 为准。

推荐任务状态：

```text
Todo
Doing
Need Review
Blocked
Done
Deployed
```

每日同步格式：

```text
1. 昨天完成了什么
2. 今天做什么
3. 有没有 blocker
4. PR / Codex task / deployment link
```

## 10. 迁移到 Business 后第一步

在 Business workspace 新建 Pokaya 项目后，第一条消息建议贴：

```text
我们正在把 Pokaya AI 项目从 Personal workspace 迁移到 Business workspace。

请把下面文档当作当前项目上下文，并在处理任何任务前优先遵守 GitHub repo 里的 AGENTS.md、DESIGN.md 和 .codex/skills/pokaya-ui-stability/SKILL.md。

项目目标：Pokaya AI 是给 TikTok Affiliate、小卖家和内容创作者的 AI 内容工作台，帮助用户把一个产品变成可发布的 TikTok 内容素材。

协作方式：GitHub repo 是真源，所有执行变更需要 commit + push，PR 用于进度透明和 review。
```

然后附上这份文档全文，或直接链接到仓库里的：

```text
docs/pokaya-business-workspace-migration-context.zh.md
```

## 11. 不要迁移的内容

- Personal workspace 里和 Pokaya 无关的私人聊天。
- 非项目相关 memory。
- 其它业务或私人决策历史。
- 未确认可进入团队 workspace 的敏感信息。
- API key、token、secret、供应商后台、数据库连接串。

## 12. 下一步建议

1. 创建 ChatGPT Business workspace。
2. 邀请 2 位团队成员。
3. 连接 GitHub repo：`duitokAI/pokaya-ai`。
4. 在 Business workspace 创建 Pokaya 项目。
5. 粘贴本迁移文档作为项目上下文。
6. 设置团队开发规则：branch、PR、review、deployment check。
7. 不做 Personal workspace 整体 merge，直到确认个人历史可以进入团队环境。
