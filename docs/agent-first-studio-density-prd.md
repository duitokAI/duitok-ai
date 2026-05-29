# Duitok Agent 主入口与 Studio 密度统一优化 PRD

最后更新：2026-05-29

## 1. 背景

Duitok AI 已经具备完整的 Studio 骨架：Project、Image、UGC、Auto Content、Original Video、Clone Prompt、Storytelling、Agent、Billing、Content Library、Auto Post、Admin、credits 和生成接口。

当前产品最大问题不是缺少功能，而是用户进入 Studio 后仍然需要自己判断：

- 应该先点哪个功能？
- 今天这个产品该做什么内容？
- 哪个 tab 适合我？
- prompt 要怎么写？
- 生成后下一步怎么保存、排期或发布？

如果 Duitok 继续以 6 个功能 tab 作为主入口，用户感知会停留在“AI 工具集合”。真正应该建立的产品心智是：

> Duitok 是一个 AI content operator。用户告诉它产品和目标，它帮用户判断内容方向、创建项目、填好 prompt、生成素材、安排下一步。

同时，Studio 近期反复出现尺寸偏大、卡片过高、文案被截断、浮层遮挡、页面密度不统一的问题。这说明需要一套全局 Studio density 规范，而不是每次按截图局部修补。

本 PRD 聚焦两个优先级：

1. 把 Agent 从侧边栏聊天页升级为 Studio 主入口。
2. 建立 Studio 全局视觉密度规范，让所有页面像可长期使用的工作台。

## 2. 产品定位

### 2.1 当前状态

当前 Duitok 更像：

> 一个带 Agent 的 AI 生成工作台。

### 2.2 目标状态

目标升级为：

> 一个由 Agent 驱动的 TikTok Shop 内容运营系统。

用户不需要先理解 Image、UGC、Auto、Original、Clone、Storytelling 的区别。用户应该先告诉 Agent：

- 我卖什么产品？
- 我要今天发什么？
- 我要做 7 天内容？
- 我要模仿某个视频？
- 我要生成产品图还是视频？

然后 Agent 把用户带到正确工作流。

## 3. 核心目标

### 3.1 用户目标

- 新用户进来后 60 秒内知道第一步该做什么。
- 用户可以用自然语言启动工作，而不是先研究 tab。
- 用户可以让 Agent 创建 project、填 prompt、生成素材、加入 schedule。
- 用户能清楚看到 Agent 正在做什么、需要确认什么、已经完成什么。
- Studio 页面更紧凑，首屏能看到核心操作，不再像 landing page。

### 3.2 业务目标

- 提高注册后首次生成率。
- 提高 Agent 使用率，让 Agent 成为付费理由。
- 提高每个 project 的生成次数和复用次数。
- 降低用户因“不知道怎么用”而流失的概率。
- 让 RM69 membership 看起来像一个内容运营系统，而不是单次生成工具。

### 3.3 产品目标

- Agent 成为 Studio 默认主入口。
- 6 个功能 tab 从“主入口”降级为“专业模式 / 手动模式”。
- 建立统一的 Studio density token。
- 修复并防止 tab 文案被截断、卡片过大、按钮过大、输入区过高等问题。

## 4. 不做范围

- 本期不重写所有生成模型逻辑。
- 本期不新增新 provider。
- 本期不重新设计官网首页。
- 本期不做完整 First Generation Wizard，但 Agent 主入口需要为 Wizard 留接口。
- 本期不删除 1-6 功能 tab，只调整它们的层级和密度。
- 本期不承诺 Agent 自动执行高风险动作；扣 credit、发布、删除仍需要确认。

## 5. 核心策略

### 5.1 Agent First，不是 Tab First

Studio 首页默认展示 Agent Operating Desk。

用户看到的第一入口是：

```text
Ask Duitok Agent what to create today
```

而不是先看到 6 个大 tab。

6 个 tab 保留，但作为：

- Manual Studio
- Advanced tools
- 当前 project 的具体编辑区

### 5.2 Agent 输出必须可执行

Agent 不只回答文字。每次关键回复都应该尽量给出 action cards：

- Create Project
- Fill Image Prompt
- Fill Video Prompt
- Generate Asset
- Create 7-Day Plan
- Add to Schedule
- Save as Template

用户点击后，系统执行或进入确认态。

### 5.3 密度统一先于视觉装饰

Studio 不是 marketing page。内部页面不使用过大的 hero 标题、过大的卡片、过大的按钮。

所有 Studio 页面按同一套 density token 执行：

- 页面标题
- 卡片 padding
- section gap
- tab 高度
- input/select 高度
- button 高度
- upload dropzone 高度
- sidebar item 高度

## 6. Agent 主入口需求

### 6.1 Studio 默认首页

需求：

- 登录后默认进入 Agent Operating Desk，而不是直接进入某个 project tab。
- 如果用户从具体 project 进入，顶部仍显示当前 project context。
- 左侧 sidebar 保留 Projects，但视觉权重降低。
- Agent 输入框必须在首屏明显可见。

推荐首屏结构：

```text
------------------------------------------------------------
| Header: Duitok Agent                        Credits / SOP |
------------------------------------------------------------
| Agent Command Bar                                         |
| "What should I create for this product today?"             |
------------------------------------------------------------
| Quick Starts                  | Current Workspace          |
| - Create product video        | Project: Serum Soft Sell   |
| - Make 7-day plan             | Product: ...               |
| - Clone a viral prompt        | Last result: ...           |
| - Generate image              | Credits: ...               |
------------------------------------------------------------
| Agent Thread / Task Timeline                               |
------------------------------------------------------------
```

验收：

- 新用户进入 Studio 后不需要先理解 tab。
- 首屏能看到 Agent 输入框、3-5 个 quick starts、当前 credits。
- 1440px desktop 下不需要滚动即可发起第一个任务。

### 6.2 Agent Command Bar

需求：

- 输入框 placeholder 根据当前语言显示。
- 支持用户直接输入：
  - `我的产品是 serum，今天做什么内容？`
  - `帮我做 7 天 TikTok 内容计划`
  - `根据这个产品图生成视频 prompt`
  - `帮我做 soft sell BM 版本`
  - `把这个结果加入明天 8pm schedule`
- 输入区旁显示一个清楚的 send button。
- 不把 history、delete、new chat 放在主视觉中心。

验收：

- 空状态下输入框不会被大图或大卡片挤到屏幕下方。
- Mobile 下输入框固定在可操作区域，不被 WhatsApp 浮窗遮挡。

### 6.3 Quick Starts

Quick Starts 是 Agent 主入口的第一层转化按钮。

默认提供：

1. `Create today's product video`
2. `Make 7-day content plan`
3. `Generate product image`
4. `Clone a viral style`
5. `Write BM soft-sell script`

点击后：

- 自动填入 Agent 输入框，或直接发送。
- Agent 根据当前 project context 继续问缺失信息。

验收：

- Quick Starts 不超过 5 个。
- 每个 quick start 都对应真实 action path。
- 不使用解释型长文案。

### 6.4 Project Context Panel

Agent 必须知道用户当前在哪个 project。

Panel 显示：

- Project name
- Product name / product link
- Target language
- Last generated result
- Current content goal
- Credits balance

如果缺失信息，显示短提示：

- `Add product name`
- `Upload product photo`
- `Choose target language`

验收：

- Agent 页面能看出当前服务哪个 project。
- 缺失信息可以一键补充，不需要用户去找表单字段。

### 6.5 Agent Action Cards

Agent 回复里出现可执行卡片，而不是只有文字。

Action card 类型：

| Action | 功能 |
| --- | --- |
| `create_project` | 创建新 project |
| `update_project` | 写入产品名、语言、目标、prompt |
| `generate_image` | 进入图片生成确认 |
| `generate_video` | 进入视频生成确认 |
| `create_plan` | 生成 7 天内容计划 |
| `add_schedule` | 加入 schedule |
| `save_template` | 保存为模板 |

高风险动作必须确认：

- 扣 credits 的生成动作。
- TikTok 发布动作。
- 删除 project/result。
- 修改已排期内容。

验收：

- Agent 每次建议下一步时至少给出 1 个可点击 action。
- 生成动作显示预计 credits。
- 发布动作显示目标账号、时间、privacy level。

### 6.6 Agent 状态反馈

状态必须用户化：

| 状态 | 中文 |
| --- | --- |
| idle | 待命中 |
| thinking | 正在理解你的需求 |
| inspecting | 正在检查项目内容 |
| drafting | 正在生成方案 |
| waiting_confirmation | 需要你确认 |
| executing | 正在执行 |
| completed | 已完成 |
| failed | 需要调整 |

验收：

- 不显示 provider、internal route、tool schema。
- 不出现 `thinking and calling tools` 这类内部表达。
- 状态文案跟随当前语言。

## 7. 1-6 功能 tab 的新角色

### 7.1 Tab 从入口变成手动工具

Project 页面保留 1-6：

1. Image
2. UGC
3. Auto Content
4. Original Video
5. Clone Prompt
6. Storytelling

但页面文案和布局要表达：

- Agent 推荐路径在上方。
- Tabs 是手动编辑和专业调整区。

推荐结构：

```text
Project Header
Agent Recommendation Strip
Manual Tools Tabs 1-6
Selected Tool Panel
Results
```

验收：

- Project 页面不再像用户必须自己选择工具。
- Agent 可以把用户带到某个 tab 并预填字段。

### 7.2 Tab 文案不可被截断

需求：

- Desktop 下 1-6 tab 全文显示。
- 不使用 `Auto Cont...`、`Original V...`、`Clone Pro...`。
- 最小列宽、字号、gap、padding 用 density token 控制。

验收：

- English / 中文 / BM 三语言都不截断。
- 1366px desktop 下 6 个 tab 全部可读。
- Mobile 下可横向滚动或两行布局，但不挤压文字。

## 8. Studio Density System

### 8.1 全局 token

建议新增或统一以下 CSS variables：

```css
:root {
  --studio-sidebar-width: 300px;
  --studio-page-padding-x: 36px;
  --studio-page-padding-y: 28px;
  --studio-section-gap: 22px;
  --studio-card-radius: 18px;
  --studio-card-padding: 24px;
  --studio-card-padding-compact: 18px;
  --studio-title-size: 40px;
  --studio-section-title-size: 24px;
  --studio-body-size: 15px;
  --studio-button-height: 46px;
  --studio-input-height: 50px;
  --studio-tab-height: 52px;
  --studio-upload-height: 180px;
}
```

Mobile 建议：

```css
@media (max-width: 760px) {
  :root {
    --studio-page-padding-x: 16px;
    --studio-page-padding-y: 16px;
    --studio-card-padding: 18px;
    --studio-title-size: 30px;
    --studio-tab-height: 48px;
    --studio-upload-height: 150px;
  }
}
```

验收：

- 后续页面尺寸优先使用 token。
- 不再每个页面单独写一套巨大 padding / font-size。

### 8.2 页面标题

规则：

- Studio 页面 H1 desktop 控制在 36-44px。
- Project name 不超过 48px。
- Section title 控制在 22-28px。
- Form label 控制在 12-14px。

禁止：

- 内部工作台使用首页 hero 级字号。
- 普通卡片标题超过 32px。

### 8.3 卡片与 section

规则：

- 主卡片 padding 22-28px。
- 紧凑卡片 padding 16-20px。
- card radius 14-20px。
- section gap 18-26px。
- 不做 card inside card，除非是 repeated item 或 modal。

验收：

- Project 首屏能看到第一个工具 panel 和下一段内容开头。
- Billing / Usage / Library 页面列表密度统一。

### 8.4 表单控件

规则：

- Input / Select height 46-54px。
- Button height 42-50px。
- Textarea 默认 96-132px。
- Upload dropzone 默认 150-220px。
- 只有真正需要视觉检查的上传预览才允许更高。

验收：

- 用户不需要滚动很久才能完成一个生成表单。
- 文案不被按钮高度或 icon 挤掉。

### 8.5 Sidebar

规则：

- Desktop sidebar width 280-320px。
- Nav item height 46-54px。
- Project item height 52-60px。
- Logo / mascot 不超过 56px 高。
- Language switch 不超过 54px 高。

验收：

- 1440px 下 project list 至少显示 4 个 project。
- Account / Billing / Auto Post 不需要深度滚动才能找到。

### 8.6 WhatsApp Support

规则：

- Studio 内 WhatsApp support 不遮挡 Agent input、生成按钮、schedule 按钮。
- Desktop 可缩小为 compact floating button。
- Agent 页面可降级为 sidebar/action link，不长期覆盖右下角。

验收：

- Mobile 下输入区和 WhatsApp 不重叠。
- 用户能点击主 CTA，不被客服入口遮挡。

## 9. 信息架构调整

### 9.1 推荐导航结构

Sidebar 主导航：

1. Agent
2. Projects
3. Library
4. Schedule / Auto Post
5. SOP
6. Billing
7. Account / Admin

Project list 放在 Projects 区域内，不抢主入口。

### 9.2 Agent 与 Project 的关系

Agent 不替代 Project，而是 Project 的操作层。

```text
Agent asks / decides / fills / confirms
Project stores / edits / generates / tracks
Library manages assets
Schedule publishes or prepares posting
```

## 10. 开发阶段

### Phase 1：Agent 主入口骨架

范围：

- Studio 默认进入 Agent。
- Agent Operating Desk 页面布局。
- Command Bar。
- Quick Starts。
- Project Context Panel。
- 状态文案统一。

验收：

- 用户进入 Studio 首屏即可向 Agent 发任务。
- Agent 页面不再像单独 chat card。
- Mobile / desktop 视觉都可用。

### Phase 2：Agent Action Cards

范围：

- Agent 回复支持 action cards。
- 支持 create project、update project、fill prompt、create plan。
- generate image/video 进入确认态。
- add schedule 进入确认态。

验收：

- Agent 至少能把一个自然语言需求转成 project field update。
- 扣 credit 前必须确认。
- action 成功后有 toast 和 timeline 记录。

### Phase 3：Project 页面 Agent 推荐条

范围：

- Project 页面顶部新增 Agent Recommendation Strip。
- Agent 可把用户带到对应 tab。
- 1-6 tab 作为 Manual Tools。
- Tabs 全语言不截断。

验收：

- Project 页面首屏信息更清楚。
- 用户知道可以让 Agent 帮他选工具。

### Phase 4：全局 Density Token 落地

范围：

- Sidebar。
- Project。
- Agent。
- Billing。
- Library。
- Auto Post。
- Admin 基础页。

验收：

- 全站核心页面使用同一套 spacing / control token。
- 不再出现大面积无效留白。
- 1366px、1440px、1920px、mobile 均完成截图 QA。

## 11. 成功指标

### 11.1 行为指标

- 新用户首次进入 Studio 后，Agent 输入或 quick start 点击率。
- 注册后 24 小时内首次生成率。
- Agent 触发的 project update 次数。
- Agent 触发的 generate 次数。
- Agent action card 点击率。
- 从 result 到 schedule/library 的转化率。

### 11.2 体验指标

- Project tab 文案截断次数为 0。
- 主要 Studio 页面首屏核心操作可见。
- Mobile 下无主要 CTA 被 WhatsApp 或 floating UI 遮挡。
- 用户不需要滚动超过一屏才能开始生成。

### 11.3 商业指标

- RM69 注册后留存提升。
- Credits 消耗频次提升。
- 用户每 project 生成资产数量提升。
- 支持咨询里“不会用 / 不知道点哪里”的问题下降。

## 12. 风险与处理

### 12.1 Agent 变主入口后用户找不到手动工具

处理：

- 保留 Manual Tools tabs。
- Quick Starts 旁提供 `Open manual tools`。
- Project 页面保留清晰 tabs。

### 12.2 Agent 执行动作过多导致用户不信任

处理：

- 所有扣 credit、发布、删除动作都确认。
- Action card 显示影响范围。
- 提供 undo 或 edit before run。

### 12.3 全局压缩导致品牌感变弱

处理：

- 保留深紫、粉色、金色按钮、mascot。
- 压缩尺寸，不取消品牌。
- 让品牌出现在状态、icon、微交互里，而不是靠大卡片撑场。

### 12.4 多语言导致 tab 或按钮再次溢出

处理：

- 所有 tabs/buttons 做 EN / 中文 / BM 截图 QA。
- Desktop 全文显示。
- Mobile 使用横向滚动或两行，不使用省略号作为默认方案。

## 13. 验收清单

- [ ] Studio 默认主入口为 Agent Operating Desk。
- [ ] Agent 首屏有 command bar、quick starts、project context。
- [ ] Agent 回复能显示至少一种 action card。
- [ ] 生成类 action 显示预计 credits 并要求确认。
- [ ] Project 1-6 tabs 全语言不截断。
- [ ] Studio 全局 token 已定义并被核心页面使用。
- [ ] Sidebar、Project、Agent、Billing、Library 完成密度统一。
- [ ] WhatsApp support 不遮挡输入框或主 CTA。
- [ ] Desktop 1366 / 1440 / 1920 截图 QA 通过。
- [ ] Mobile 截图 QA 通过。

## 14. 最小可执行版本

如果只能先做一版，建议只做以下 5 件事：

1. Studio 默认打开 Agent。
2. Agent 页面改成 Operating Desk：command bar + quick starts + project context。
3. Project 页面顶部加 Agent Recommendation Strip。
4. 定义并套用 Studio density token 到 sidebar、tabs、cards、inputs、buttons。
5. 做 EN / 中文 / BM 的 Project tabs 和 Agent 页面截图 QA。

这 5 件事完成后，Duitok 的产品心智会从“很多 AI 功能按钮”明显转向“AI content operator 工作台”。
