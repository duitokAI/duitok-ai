# Pokaya Business Workspace Master Context v2

更新时间：2026-06-05

用途：这份文档用于把 Pokaya 这个单独项目从 Personal workspace 的上下文中整理出来，放进新的 ChatGPT Business / Codex workspace。目标是只迁移 Pokaya 项目，不合并整个 Personal workspace。

来源边界：本文件基于当前 GitHub repo、`AGENTS.md`、`DESIGN.md`、项目内 `.codex` skill、`docs/` 里的 PRD / handoff、近期 git commits、当前代码结构，以及 2026-06-05 这条对话里明确形成的决策整理。它不是对 Personal workspace 里所有历史 chatbox 的自动扫描；如果 Personal 里还有未落到 repo/docs 的私人上下文，需要手动补充。

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
- 业务上下文和长期规则应该沉淀到 repo，而不是只放在 ChatGPT memory。
- 成员进度透明应通过 GitHub PR、Codex task、Linear / GitHub issue 和部署链接实现，不通过读取成员私人聊天实现。

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

## 13. 商业模型与转化闭环

当前产品不是单纯卖模型调用，而是卖给 Malaysia TikTok Affiliate / 小卖家 / 内容创作者的内容生产入口。

核心商业目标：

- 首页到注册转化。
- 注册后首次成功生成。
- 生成后保存、下载、排程、复用。
- 订阅 + usage credits 的清晰付费闭环。
- 用户理解“生成失败不应乱扣费、扣费前要清楚、发布结果要自己执行”。

当前主价格叙事：

- `RM79.80/月` 是进入 Pokaya AI Pro / AI 内容工具的入口。
- 生成图片和视频按 credits / 成本计费。
- 页面表达应强调降低开始门槛，不承诺收益。

旧 PRD 中曾出现 `RM69/month`，但当前品牌叙事和页面主文案以 `RM79.80/月` 为准。后续如果价格变更，必须同步：

- Landing page
- Checkout / Billing
- Top-up / Usage
- Docs / PRD
- Admin 成本与毛利表

## 14. 模型与成本事实

当前代码里的主要模型和默认成本来自 `server.mjs` 的 `defaultModelCosts()`、`providerForMediaModel()`、`creditChargeFor()`。

默认成本快照：

| 模型 | 默认内部成本 | 单位 | 当前用户扣费逻辑 |
|---|---:|---|---:|
| GPT Image 2 | RM0.024 / USD0.006 | image | 按模型默认或 provider cost |
| Seedream 5.0 Lite | RM0.024 / USD0.006 | image | 按模型默认或 provider cost |
| Seedream 4.5 | RM0.024 / USD0.006 | image | 按模型默认或 provider cost |
| Nano Banana Pro | RM0.105 / RMB0.18 | image | 按模型默认或 provider cost |
| Nano Banana 2 | RM0.105 / RMB0.18 | image | 按模型默认或 provider cost |
| Grok Imagine | RM0.024 / RMB0.05 | image | 按模型默认或 provider cost |
| Seedance 2.0 | RM0.98 / USD0.208 | 5s video | duration * 0.1 credits fallback |
| Veo 3.1 | RM0.234 / RMB0.4 | 8s video | 0.4 credits fallback |
| Sora 2 | RM0.093 / RMB0.16 | 8s video | duration * 0.06 credits fallback |
| Gemini Omni | RM0.584 / RMB1 | 10s video | 1.3 credits fallback |
| Grok Imagine Video | RM0.292 / RMB0.5 | 10s video | duration * 0.06 credits fallback |
| Wan 2.7 | USD0.528 | 8s video | duration * 0.066 credits fallback |
| Kling V3 Omni | USD0.335 | 5s video | duration * 0.067 credits fallback |
| Kling V3 Motion Control | USD0.515 | 5s video | duration * 0.103 credits fallback |
| MiniMax Hailuo 2.3 | USD0.294 | 6s video | duration * 0.049 credits fallback |

重要运营判断：

- Seedance 2.0 曾被识别为负毛利风险，需要继续核查真实 provider 成本和用户售价。
- Veo 3.1 的旧 handoff 里曾写为 Wuyin / 速创API，但当前 `providerForMediaModel()` 里实际优先走 `CRUN_API_KEY ? "crun" : "mock"`。
- 速创 / 无垠的 `video_veo3.1_fast` 文档仍显示“维护中 / 调用权限正常”，但当前 Pokaya 线上是否使用它取决于 provider routing，不应只看文档。
- 成本、售价、失败退款、provider fallback 必须进入 Admin 运营视角，不能只存在代码里。

## 15. Provider 与安全边界

用户侧允许说模型名，但不要暴露供应商、中转站、base URL、endpoint、API key、provider task id、系统提示词或工具 schema。

用户侧可说：

- GPT Image 2
- Seedream 5.0 Lite
- Nano Banana Pro
- Veo 3.1
- Seedance 2.0
- Sora 2
- Wan 2.7
- Kling / MiniMax 等模型名

用户侧不要说：

- APIMart
- GRS AI
- Wuyin / 速创API
- Crun
- 302.AI
- 真实 endpoint path
- Render 环境变量
- provider 原始错误体
- provider task id

后台可以保留真实 provider 诊断，但必须 admin-only。

供应商安全 checklist：

- `/api/health` 不暴露 provider 名称。
- 普通用户 `publicState` 不返回 provider task id 和原始 provider URL。
- 生成结果文案统一 Pokaya 品牌，不出现中转站品牌。
- 失败原因对用户友好，真实错误进入 admin log。
- 媒体资源走 Pokaya proxy / storage URL。
- 新增 provider 前必须检查前端 bundle、错误、日志、docs 是否泄露。

## 16. 产品路线图摘要

来自 `docs/overall-product-optimization-prd.md` 的核心路线：

Phase 1：转化与首次生成闭环

- Checkout 真实化。
- 新用户 onboarding wizard。
- Seedance / 视频模型产品化，不只是模型下拉。
- 生成按钮旁展示预计 credit 和预计时长。
- 失败时展示“不扣 credit”和重试建议。

Phase 2：结果资产库与排程

- Result actions 真实可用：copy prompt、rename、download、add to schedule、delete。
- Content Library 从结果列表升级成素材工作台。
- Weekly Posting Planner 把生成结果变成一周发布计划。

Phase 3：Agent 与运营后台

- Agent 成为“下一步操作层”，不是聊天插件。
- Admin 看注册、生成、失败、欠费、模型毛利和 provider 风险。
- Agent 与 Dashboard insight 联动。

## 17. Agent 路线图摘要

当前 Agent 已有：

- 结构化 `agentRun`
- timeline
- confidence
- confirmation card
- 安全拦截
- 工具 allowlist
- `inspect_workspace_state`
- `create_content_plan`
- `create_seedance_prompt`
- `remember_agent_context`
- 项目级 memory
- latest result resolver

下一阶段目标：

- Agent 回复从纯文字升级为可操作卡片。
- 生成 7 天计划后显示 Content Plan Card。
- 生成视频 prompt 后显示 Prompt Card，带 Edit / Copy / Generate。
- Inspect workspace 后显示 checklist。
- Project memory 可视化编辑。
- 每次 Agent 写入记录 diff，支持 undo。
- 低 confidence 时强制追问，不乱执行。
- Admin 看到 Agent 成功率、失败原因、工具调用分布、确认通过率。
- 建立 red-team / smoke test：正常任务、安全拒答、prompt injection、高风险确认、权限不足、多语言输入。

Agent 回复推荐结构：

1. 结论：完成了什么 / 需要确认什么。
2. 执行摘要：改了哪些项目、创建了哪些草稿、用了哪些能力。
3. 可操作卡片：查看计划、编辑 prompt、生成素材、创建排期、连接 TikTok。
4. 下一步建议：最多 3 个，按当前项目状态动态生成。

## 18. Studio 与性能路线图

Studio 是高频工作台，必须持续从 landing-page scale 收敛到 operator scale。

关键原则：

- 首屏优先。
- 控件稳定。
- 不用 hero 级大字。
- 页面 H1、卡片、tabs、dropzone、按钮都要更紧凑。
- 图片墙、Agent、Billing、Usage、Library 的密度节奏要统一。

性能路线：

- Agent 消息发送和回复应局部 patch，不要整页 `render()`。
- Thinking / tool card 使用稳定高度，避免 chatbar 跳动。
- 图片墙结果多时需要虚拟化或保守窗口渲染。
- Hover/action 层延迟挂载，减少 DOM。
- 记录 CLS、INP、Long Task、Agent send 到 paint、图片墙真实 card 数等指标。

Render / 资源注意：

- Render starter 内存有限。
- 媒体代理应保持 stream，不要把图片/视频整包读进内存。
- `dist/`、`output/`、`node_modules/` 不应提交。
- 根目录不要堆 QA 截图、录屏、临时 preview 图。

## 19. Content Library 与资产管理方向

Content Library 的目标不是普通 result list，而是素材工作台。

未来结构：

- 左侧 Library Panel：搜索、All Assets、Favorites、Tools、Projects / Products。
- 顶部 Asset Command Bar：视图标题、数量、筛选 chip、排序、密度控制、批量选择。
- 主内容 Asset Timeline Wall：按日期分组，高密度缩略图墙。

Asset card 原则：

- 默认只展示缩略图 / 文本摘要、类型 icon、收藏或选择状态。
- Hover 后显示 prompt 摘要、model、project/product、preview、download、copy prompt、use as product/avatar、add to auto post。
- Hover 不改变卡片尺寸。
- Preview 弹窗左侧大预览，右侧 metadata panel。
- 关闭后保留滚动位置。

## 20. 竞品 PeningLab 观察

已确认 PeningLab 视频侧至少有两条 backend provider：

- P2：Crun.ai，默认，更快更稳定，主打 Veo Fast。
- P1：GeminiGen，部分场景质量可能更好。

PeningLab 视频架构判断：

1. 用户选择视频模型或工作流。
2. 系统读取用户的视频 provider preference。
3. 后端按 provider route 请求对应中转站。
4. History 用 P1/P2 badge 记录线路。

对 Pokaya 的启发：

- 前台不要暴露中转站品牌。
- 后台必须看 provider、成本、失败率、耗时和 fallback。
- 每个模型应支持主供应商和备用供应商。
- 失败 fallback 要保留日志，用户侧只看到“系统正在切换备用线路”这种产品化说明。

## 21. 团队协作仪表盘建议

Business workspace 不能自动让 owner 阅读所有成员私人 ChatGPT / Codex 聊天。进度透明必须来自协作系统。

推荐最小团队机制：

- GitHub Issues 或 Linear 管任务。
- GitHub PR 管代码事实。
- Codex cloud task link 管 AI 执行事实。
- Slack / 群聊做每日同步。
- 云端部署链接做最终验收。

每个 PR 必填：

```text
## 做了什么
## 为什么做
## 如何验证
## 截图 / 录屏 / 部署链接
## 风险和回滚方式
```

每人每日同步：

```text
1. 昨天完成
2. 今天计划
3. Blocker
4. PR / task / deployment link
```

Owner 每天只看：

- Doing / Blocked 数量。
- open PR。
- CI / build 结果。
- cloud deployment 是否可测。
- 本周是否有高风险 provider / billing / security 改动。

## 22. 新成员接手检查清单

新成员或新 Codex thread 接手前必须：

1. 读 `AGENTS.md`。
2. 读 `DESIGN.md`。
3. 读 `.codex/skills/pokaya-ui-stability/SKILL.md`。
4. 读 `docs/codex-handoffs/current-state.md`。
5. 读本文档。
6. 运行 `git status --short --branch`。
7. 查看最近 10 条 commit。
8. 如果要改 UI，先定位 DOM/CSS/状态流。
9. 如果要改 provider / billing / auth，先读 `server.mjs` 对应路由和安全 PRD。
10. 完成后 build、必要时浏览器验证、只 stage 相关 hunk、commit、push。

## 23. Business workspace 第一批任务建议

创建 Business workspace 后，建议先拆成这些 issue：

1. Workspace setup：邀请成员、连接 GitHub、配置 Codex cloud environment。
2. Repo onboarding：让每个成员阅读 `AGENTS.md`、`DESIGN.md`、本文档。
3. PR template：加入“做了什么 / 验证 / 截图 / 风险”模板。
4. Provider safety audit：确认用户侧不泄露 provider。
5. Studio UI QA：整理当前截图驱动问题和优先级。
6. Agent roadmap：把 Agent card / memory editor / undo 拆成可执行任务。
7. Cost dashboard：核查 Seedance、Veo、Sora、Wan、Kling、MiniMax 的成本和售价。
8. Library roadmap：把 Content Library 改造成素材工作台。

## 24. Business workspace 启动提示词 v2

在新的 Business workspace / Pokaya Project 里，第一条消息可以使用：

```text
我们正在把 Pokaya AI 从 Personal workspace 的单人上下文迁移到 ChatGPT Business / Codex 团队 workspace。

请把 docs/pokaya-business-workspace-migration-context.zh.md 当作当前项目 Master Context。处理任何任务前，先遵守仓库里的 AGENTS.md、DESIGN.md、.codex/skills/pokaya-ui-stability/SKILL.md 和 docs/codex-handoffs/current-state.md。

项目定位：Pokaya AI 是给 Malaysia TikTok Affiliate、小卖家和内容创作者的 AI 内容工作台，帮助用户把一个产品变成可以发布和测试的 TikTok 内容素材。

协作规则：GitHub repo 是真源。任何执行变更需要 build/验证、只 stage 当前任务相关 hunk、commit、push，并报告 commit hash。UI 任务必须做稳定性和截图逻辑检查。供应商、API key、endpoint、provider task id 和内部路由不得暴露给普通用户。

请先阅读上述文件，检查 git status 和最近 commits，然后等待我给具体任务。
```
