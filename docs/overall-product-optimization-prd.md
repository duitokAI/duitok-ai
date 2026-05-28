# Duitok AI Overall Product Optimization PRD

## 1. 背景

Duitok AI 目前已经具备一个可上线验证的完整骨架：高压成交首页、注册/登录、Studio 工作台、多模型媒体生成、Seedance 2.0 Atlas Cloud 路由、积分扣费、生成结果保存、TikTok 连接与发布队列、CHIP 支付接口雏形、Duitok Agent、管理员运营面板。

当前最大问题不是“功能不够多”，而是产品链路还没有被打磨成一个卖家可以自然付费、自然生成、自然复购的闭环。用户从首页被说服以后，进入 Studio 仍然会遇到几个断点：注册付费不够真实、首次生成路径偏复杂、结果管理和复用偏弱、TikTok auto-post 信任感不足、Agent 还没有成为主操作入口。

本 PRD 目标是把 Duitok AI 从“能展示、能生成”升级为“能转化、能留存、能扩张”。

## 2. 产品目标

### 2.1 业务目标

- 提升首页到注册的转化率。
- 提升注册后首次成功生成率。
- 提升生成后用户继续保存、下载、排程、复用的比例。
- 建立 RM69 订阅 + usage credits 的清晰付费闭环。
- 让 Seedance 2.0 成为可感知的高价值卖点，而不是隐藏在模型下拉框里的技术选项。

### 2.2 用户目标

目标用户是 Malaysia TikTok Shop seller、affiliate seller、小团队运营者。用户进入产品后应该能清楚回答：

- 我现在应该生成什么？
- 我要付多少钱？
- 每次生成扣多少 credit？
- 生成失败会不会扣钱？
- 生成好的视频/图片下一步怎么发？
- 我能不能把一个产品连续做 7 天内容？

## 3. 当前问题诊断

### 3.1 转化链路

1. 首页卖点已经更强，但注册后的 checkout 仍然像“说明页”。
   当前注册页文案写着 CHIP payment will be connected，容易削弱真实购买感。

2. RM69 订阅和 credits 的关系还不够直观。
   用户可能不知道 RM69 包含什么，生成视频又为什么扣 credit。

3. 免费 2 条 Video 的承诺还没有在系统里变成明确权益。
   首页说免费生成，但 Studio 和 billing 里没有明显的新用户免费额度解释。

### 3.2 首次使用

1. Studio 功能丰富，但第一步不够强引导。
   新用户看到 Image、UGC、Auto、Original、Clone、Story、Viral 多个入口，容易不知道先点哪里。

2. Seedance 2.0 已经接上 Atlas Cloud，但它只是模型选项之一。
   对用户来说，Seedance 应该是“爆款短视频生成入口”，不是技术名。

3. 上传 avatar/product、选择模式、写 prompt 之间缺少模板化向导。
   用户需要自己知道如何写 prompt，这会拖慢首次成功。

### 3.3 生成结果

1. 结果卡片已经有图片/视频预览和操作按钮，但按钮语义仍是占位感。
   例如 Copy prompt、Full prompt、Copy task ID、Export、Delete 需要真实可用，且文案要更贴近卖家工作流。

2. 结果没有形成“内容资产库”的概念。
   现在结果挂在 project 下，但用户更需要按产品、平台、模型、状态筛选。

3. 生成失败记录在后端有 ledger，但前端给用户的失败解释不够产品化。
   应该明确显示“不扣 credit”“失败原因”“下一步建议”。

### 3.4 Auto Post / TikTok

1. Auto-post 现在同时有 Chrome extension 和 Official API 两条路，信息密度高。
   用户需要先理解“辅助填表”和“官方直发”的差异。

2. TikTok Direct Post 缺少 readiness checklist。
   用户不知道自己是否已经连接 TikTok、是否有 public video URL、creator info 是否通过、privacy level 该怎么选。

3. 发布队列没有足够像日历/排程工具。
   目前是列表，更适合 MVP；下一版应让用户看到一周内容节奏。

### 3.5 Agent

1. Duitok Agent 已经能调用工具，但入口仍像聊天插件。
   它应该成为“帮我做下一步”的核心操作层。

2. Agent 的建议没有和 dashboard insight 强绑定。
   当前 dashboard 能算生产数据和建议，但 Agent 可以更主动地把建议变成一键动作。

3. Agent 权限管理已有雏形，但用户侧缺少可理解的授权提示。
   生成、改项目、排程、发布都应该有明确的确认态。

### 3.6 Admin / Ops

1. 管理员面板已有模型成本、用户、生成、支付、失败记录，但还需要业务视角。
   运营者需要看到：谁注册了、谁生成了、谁失败了、谁欠费、哪个模型亏钱。

2. 成本与售价还没有形成风险提示。
   Seedance、Gemini Omni 等高成本模型需要毛利提醒和异常使用预警。

## 4. 优化范围

本 PRD 分三期执行。

## 5. Phase 1：转化与首次生成闭环

### 5.1 Checkout 真实化

目标：用户从首页点击后进入一个可以真实购买或清楚等待支付配置的页面。

需求：

- 注册页去掉“payment will be connected”这类内部说明。
- 明确展示：
  - RM69/month
  - 包含 Pro Studio access
  - 新用户 2 video free / starter credits
  - 额外 credit top-up 价格
  - 30-day money-back
- 如果 CHIP 配置完整，点击 Pay 直接创建 purchase 并跳转 CHIP。
- 如果 CHIP 未配置，按钮降级为“Reserve launch price”，保存 lead，并提示 WhatsApp 跟进。

验收：

- `/register` 不出现内部占位文案。
- CHIP keys 未配置时不会报错中断。
- 用户提交后后台能看到 lead/payment intent。

### 5.2 新用户 Onboarding Wizard

目标：让新用户 60 秒内完成第一次生成。

流程：

1. 选择目标：Product video / Avatar image / UGC script / 7-day content plan。
2. 粘贴 TikTok Shop link 或输入产品名。
3. 上传产品图，可选上传人物/avatar。
4. 默认推荐 Seedance 2.0 生成 4s vertical video。
5. 点击 Generate first asset。

要求：

- 新用户第一次进 Studio 默认打开 wizard。
- 已有 project/result 的用户进入 dashboard。
- 每一步只保留必要字段。
- Wizard 文案支持 BM / 中文 / EN。

验收：

- 新用户从注册到第一次生成不需要理解完整侧边栏。
- 生成按钮旁显示预计 credit 和预计时长。
- 失败时显示“不扣 credit”和重试建议。

### 5.3 Seedance 2.0 产品化

目标：把 Seedance 从模型名变成产品卖点。

需求：

- 在 Media Generator 顶部新增推荐卡：
  - `Best for TikTok Shop Video`
  - `Seedance 2.0`
  - `4s vertical product video`
  - `Uses Atlas Cloud`
- 模型下拉仍保留，但默认新项目选 Seedance 2.0。
- Prompt preset 新增 6 个视频模板：
  - Product demo
  - Problem solution
  - Before after
  - Founder style
  - UGC review
  - Offer push
- Duration 显示价格影响：4s / 8s / 12s 对应 credits。

验收：

- 用户不需要知道 Atlas Cloud，也能理解 Seedance 是视频生成。
- Health 显示 atlascloud 后，前端显示 Seedance ready badge。

## 6. Phase 2：结果资产库与排程

### 6.1 Result Actions 真实可用

目标：每个生成结果都有明确下一步。

按钮调整：

- Copy Prompt：复制生成 prompt。
- Rename：给结果改名。
- Download：下载图片/视频或文本。
- Add to Schedule：加入 TikTok queue。
- Delete：删除结果，二次确认。

要求：

- 视频结果优先展示 video preview。
- 图片结果优先展示 image preview。
- 文本结果展示 copy-friendly 文案块。
- 若 provider URL 失效，提示配置 R2 durable storage。

验收：

- 所有按钮都执行真实动作。
- 操作成功有 toast。
- 删除不会误删其它 project 数据。

### 6.2 Content Library

目标：让用户把 Duitok 当成素材资产库，而不是一次性生成器。

需求：

- 新增 Library 页面筛选：
  - Project
  - Type：image / video / script / schedule
  - Provider：apimart / grsai / wuyin / atlascloud
  - Status：ready / failed / scheduled / posted
- 支持搜索 title / prompt。
- 支持批量选择并加入 schedule。

验收：

- 用户能在一个页面找到所有生成结果。
- 结果与项目关系仍保留。
- Admin 能看到所有用户结果，普通用户只能看到自己的。

### 6.3 Weekly Posting Planner

目标：把生成结果变成一周发布计划。

需求：

- Auto Content 生成后直接创建 7-day queue。
- Queue 支持日历视图：
  - Monday to Sunday
  - morning / afternoon / night slot
  - Ready / Posted / Failed 状态
- 每条 schedule 可以绑定 result media URL。
- 每条 schedule 有 caption、hashtags、platform、privacy setting。

验收：

- 用户能看到“本周还有几个空档”。
- Ready 状态可以进入 TikTok publish checklist。

## 7. Phase 3：Agent 与运营自动化

### 7.1 Agent 变成主操作入口

目标：让用户用自然语言完成复杂工作流。

推荐快捷指令：

- `帮我为这个产品做 7 天 TikTok 内容`
- `把这个视频结果加入今晚 8 点发布`
- `用 Seedance 做一个更强 offer 版本`
- `分析这个 competitor URL，生成 5 个 hook`
- `看一下我今天还缺什么内容`

要求：

- Agent 回复里提供 action buttons。
- 高风险动作如 publish 必须二次确认。
- 生成前显示将扣多少 credit。
- Agent 工具失败时不能假装成功。

验收：

- Agent 能创建 project、更新字段、生成、排程。
- 用户能从 Agent 回复直接跳转到相关页面。

### 7.2 Admin Growth Dashboard

目标：让运营知道产品哪里赚钱、哪里卡住。

新增指标：

- New signups
- Activated users：注册后完成首次生成
- Generation success rate
- Failed jobs by provider
- Credits consumed
- Estimated provider cost
- Gross margin by model
- Top active users
- Users with 0 credits
- Users with failed first generation

验收：

- Admin 首页默认展示以上指标。
- 高失败 provider 显示红色提示。
- 高成本模型显示毛利预警。

## 8. 非功能需求

### 8.1 可靠性

- 所有 AI provider 调用必须有 timeout。
- 生成失败不能扣 credit。
- 失败 job 必须记录 provider、model、endpoint、error。
- 用户刷新页面后仍能看到 queued / completed / failed 状态。

### 8.2 安全与权限

- 普通用户只能访问自己的 projects、results、schedule、billing。
- Admin 操作用户 plan/credits 必须写入 usage 或 ledger。
- API key 只允许存在服务端环境变量。
- Agent 发布动作必须确认。

### 8.3 成本控制

- 每个模型配置 RM cost、provider cost、credit charge。
- 高成本视频模型需要 daily limit。
- 新用户免费额度不能无限刷。
- 管理员能暂停某个 provider 或模型。

### 8.4 本地化

- 首页、注册、wizard、生成错误、billing 关键文案支持 BM / 中文 / EN。
- Studio 深层功能可以先 EN，但面向用户的核心闭环必须三语。

## 9. 成功指标

### 9.1 转化指标

- Homepage CTA click rate
- Register form completion rate
- Checkout completion rate
- WhatsApp fallback click rate

### 9.2 激活指标

- First generation completion rate
- Time to first successful result
- First result download/add-to-schedule rate
- Failed first generation rate

### 9.3 留存指标

- Results per active user
- Projects per active user
- Weekly scheduled posts per active user
- Credit top-up rate

### 9.4 成本指标

- Cost per successful image
- Cost per successful video
- Gross margin per model
- Provider failure rate

## 10. 优先级

### P0：必须先做

- Checkout 文案真实化和 fallback lead。
- 新用户 onboarding wizard。
- Seedance 2.0 推荐入口和模板。
- Result actions 真实可用。
- 生成失败用户提示。

### P1：下一轮做

- Content Library。
- Weekly Posting Planner。
- Admin growth dashboard。
- Provider/model 毛利监控。

### P2：后续增强

- Agent action buttons。
- TikTok publish checklist。
- 批量生成 A/B variants。
- Affiliate tracking dashboard。
- WhatsApp follow-up automation。

## 11. 推荐执行顺序

1. 先做 checkout + onboarding，把“进来的人”接住。
2. 再做 Seedance 产品化，让刚接好的 Atlas Cloud 变成用户能感知的价值。
3. 再做 result actions，让生成结果能下载、排程、复用。
4. 再做 library 和 weekly planner，把一次生成变成持续工作流。
5. 最后增强 Agent 和 admin dashboard，把运营效率拉起来。

## 12. 一句话结论

Duitok AI 下一阶段不要继续堆新模型。最应该优化的是闭环：让 seller 从首页焦虑感进入注册，60 秒内生成第一条 Seedance 视频，然后一键保存、排程、复用，并让后台能看清每一次生成的成本和转化。
