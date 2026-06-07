# Pokaya AI 团队项目记忆

本文档是团队协作时给 Codex、产品、设计、工程共同读取的项目记忆。它不是一次性 PRD，而是项目长期上下文：新成员、新 chatbox、新 Codex Business workspace 进入项目时，优先阅读本文件与根目录 `AGENTS.md`。

## 1. 项目定位

Pokaya AI 是面向内容创作者和运营团队的 AI 内容工作台，核心不是展示型 landing page，而是高频生产工具。Studio/backend 界面应优先服务扫描、生成、复用、批量管理和快速纠错。

当前重点集中在：

- Image / Video / Audio / Clone Prompt 多模式内容生成。
- Studio 媒体墙、底部 composer、模型参数、结果卡片、详情预览、失败/排队/生成状态。
- 登录后后台工作台体验，而不是公开营销页。
- PeningLab / provider 能力、模型路由、生成质量和成本控制。

## 2. 团队协作真源

团队协作必须以 GitHub repo 为唯一项目真源：

- Repo: `https://github.com/duitokAI/pokaya-ai`
- 项目规则真源：`AGENTS.md`
- 团队项目记忆：`docs/project-memory.zh.md`
- 项目专用 Codex skill：`.codex/skills/pokaya-ui-stability/SKILL.md`

Codex Memories 可以作为辅助回忆，但不能替代 repo 内文档。所有必须长期生效的规则、设计约束、部署流程、已知坑位，都应写进 repo。

## 3. Codex Business 使用方式

团队成员在 ChatGPT Business / Codex Business 中协作时，应按以下方式进入项目：

1. 使用 Business workspace 登录 Codex。
2. 连接或授权 GitHub repo `duitokAI/pokaya-ai`。
3. Cloud task 选择该 repo 和目标分支。
4. 本地 Codex Desktop 打开 `/Users/zixian/Documents/DuitTok AI` 或各自 clone 的本地路径。
5. 新开 thread 后先确认 Codex 已读取 `AGENTS.md` 和本文件。

推荐给新 thread 的开场检查：

```text
请读取 AGENTS.md 和 docs/project-memory.zh.md，列出当前项目的团队协作规则、设计约束和执行后提交推送要求。
```

## 4. 执行与 Git 规则

除非用户明确说“只写 PRD，不执行”，否则任何实际项目更新完成后都要：

1. 只 stage 当前任务相关文件。
2. commit。
3. push 到远程分支。
4. 在最终回复中报告 commit hash。

必须保护 unrelated local changes。不要把 `.codex/tmp/`、临时截图、缓存、未确认 PRD、`.env`、token、key 一起提交。

默认分支/远程：

- 本地主要分支：`main`
- 远程：`origin`
- Codex 新分支前缀：`codex/`

## 5. PRD 与用户文档语言

用户可见的 PRD、UX 优化方案、执行 PRD、设计/spec 文档默认使用中文。

文件名可以用英文 slug，但正文必须中文。若截图或 UI 原文是英文/Malay，也默认用中文解释问题、建议和取舍。

## 6. Studio 设计系统记忆

Studio/backend 的 Figma-to-code、UI bug fix、视觉还原、响应式修复必须遵守 Purple to Orange Mix：

- `#210024`
- `#32103A`
- `#8B1A78`
- `#C12B62`
- `#FF6738`

使用原则：

- 深 plum 用于 Studio shell、sidebar、media wall 基础面。
- orange 用于主操作、focus、selected edge、确认状态。
- rose/magenta 用于 active 或 hover surface。
- Generate / Confirm 才能使用主渐变。
- Retry / Edit、status badge、parameter pill 必须保持次级视觉。
- 新 Studio 颜色尽量写成 `.studio-shell` 下的 scoped CSS variables。
- 不要让 Studio palette 影响 public landing、login/register、marketing page。

Studio 是生产工具，不要做成营销页。界面应克制、紧凑、可扫描，避免装饰性大卡片、过度 hero、无意义渐变和不稳定 hover。

## 7. Pokaya UI 稳定性规则

以下任务必须使用项目 skill：

`.codex/skills/pokaya-ui-stability/SKILL.md`

适用范围：

- Studio
- sidebar
- settings modal
- composer / bottom bar
- media wall
- billing / usage
- image / video result
- responsive layout
- hover state
- scroll / clipping / z-index
- screenshot 或 screen recording 驱动的 UI bug

核心稳定性要求：

- hover、loading、selected、failed、narrow viewport 不得改变相邻布局尺寸。
- media wall 必须有稳定 aspect-ratio container。
- bottom composer 不得遮挡关键内容，必须预留 bottom safe area。
- modal overlay 必须覆盖完整产品 UI，并拥有自己的滚动行为。
- 文字不能溢出、重叠或挤压按钮。
- 不引入新的 frontend framework、UI kit、animation library 或 routing 架构，除非用户明确要求迁移。

## 8. 最近已知 UX 坑位

从最近的 Studio 录屏和 PRD 讨论中，团队应特别注意：

- 生成新任务时，media wall 不能因为占位卡插入而大幅跳动。
- `Generating` 占位卡不能只是一排空紫块，应有清楚的任务/队列反馈。
- 底部 composer 不能遮住媒体墙最后一排内容。
- 模型下拉菜单不能被底部栏或 viewport 截断。
- 失败卡的 `No Charge` 不应比 `Retry` 更像主按钮。
- 图片 hover 工具条不能挡住人物脸或关键主体。
- 详情侧栏打开时，背景遮罩和右侧面板必须干净、可读、不过度拥挤。
- 顶部 Image / Video / Audio / Clone Prompt tabs 应保持工作台密度，不要过高占用首屏。

## 9. 常用验证方式

UI 或前端改动后，优先验证：

```bash
npm run build
```

可运行本地预览时，还应检查：

- 桌面视口。
- 一个窄屏视口。
- 改动页面和相邻流程。
- clipping、overlap、scroll lock、hover jump、z-index leak、blank media。

如果无法启动浏览器或无法访问云部署，最终回复必须说明实际验证了什么、没有验证什么。

## 10. Business Cloud 环境记忆

Codex Cloud 环境应由 Business workspace 管理：

- GitHub repo 授权给 `duitokAI/pokaya-ai`。
- setup script 由团队统一维护。
- env vars / secrets 在 Codex Business environment 或部署平台里配置。
- secrets 不写入 repo、不写入 `AGENTS.md`、不写入本文档。

Cloud task 会 checkout repo 并运行 setup。只要 `AGENTS.md` 和本文档在 repo 中，Business Codex 就能读取团队协作规则和项目记忆。

## 11. 给 Codex 的默认工作口径

每次接到执行型任务时，Codex 应：

1. 先读 `AGENTS.md`。
2. 如果是 UI/Studio 任务，再读 `.codex/skills/pokaya-ui-stability/SKILL.md`。
3. 保持改动范围小，沿用现有 vanilla JS/CSS/项目结构。
4. 避免 unrelated refactor。
5. 执行验证。
6. 只 stage 相关文件。
7. commit + push。
8. 报告 commit hash 与验证结果。

如果只是用户要求“看看”“诊断”“列问题”，默认不改代码；先输出中文诊断和优先级。
