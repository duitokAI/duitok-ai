# Duitok First Generation Wizard PRD

最后更新：2026-05-29

## 1. 背景

Duitok AI 当前已经有完整 Studio：Project、Image、UGC、Auto Content、Original Video、Clone Prompt、Storytelling、Agent、Billing、Library、Auto Post 和 credits。

Duitok 的主要用户不是成熟运营团队，而是大量想用 AI 赚钱的新手。他们可能刚开始做 TikTok Shop、affiliate、短视频带货、AI 内容变现，甚至还没有清楚的产品和内容策略。

这类用户第一次进入 Studio 时，最容易卡在三个问题：

- 不知道 Duitok 每个功能能帮他赚什么钱。
- 不知道自己应该先用哪个功能。
- 不知道 prompt 怎么写，也不知道第一次应该生成什么。

如果新用户一进来就看到完整 Studio，会感觉这是一个复杂工具；如果第一分钟没有理解 Duitok 能帮他做什么、或者没有完成一个简单结果，用户很容易流失。

First Generation Wizard 的目标是：

> 不让新用户研究 Studio，而是先用最简单的话介绍 Duitok 的赚钱功能，并带他选择一个功能完成第一次使用。

Wizard 是 Duitok 的首次成功路径。它不是复杂问卷，也不是运营教学课，而是一个功能介绍 + 轻量选择流程：告诉用户 Duitok 可以帮他做什么，然后让他选择一个最想先尝试的功能。

## 2. 产品定位

### 2.1 Wizard 的角色

Wizard 是新用户进入 Duitok 后的第一条高速路。

```text
Register / Login
-> First Generation Wizard
-> First successful result
-> Agent Operating Desk
-> Project / Library / Schedule
```

### 2.2 Wizard 与 Agent 的关系

Wizard 负责：

- 用新手听得懂的话介绍 Duitok 核心功能。
- 降低选择成本。
- 帮用户选择第一个想尝试的赚钱动作。
- 必要时建立第一个 project。
- 让用户看到 Duitok 能马上帮他产出内容。

Agent 负责：

- 第一次使用之后继续帮用户想内容。
- 做 7 天计划、复刻、排期、生成变体。
- 变成用户每天打开的 AI 赚钱助手。

简单说：

> Wizard 解决第一次理解和第一次成功，Agent 解决每天继续用。

## 3. 核心目标

### 3.1 用户目标

- 第一次进 Studio 就知道 Duitok 能帮他做哪些赚钱动作。
- 用户不需要理解 6 个 tab，也能选到适合自己的功能。
- 用户只要回答几个简单问题，就能开始第一次使用。
- 用户生成前清楚知道会扣多少 credits。
- 用户生成失败时知道是否扣费，以及下一步怎么重试。
- 用户生成成功后知道下一步可以下载、保存、继续让 Agent 帮忙。

### 3.2 业务目标

- 提高注册后首次生成率。
- 缩短从注册到第一次 value moment 的时间。
- 提高用户对 RM69 membership + credits 的理解。
- 降低“不知道怎么用”的客服压力。
- 提高后续进入 Agent / Project / Library 的转化。

### 3.3 产品目标

- 新用户首次进入 Studio 默认看到 Wizard。
- Wizard 先介绍功能，再让用户选择想尝试的方向。
- Wizard 完成后可自动创建 project。
- Wizard 自动填好对应工具的 prompt / fields。
- Wizard 可以直接触发第一次生成，或把用户带到对应功能页。
- Wizard 成功后引导用户进入 Agent Operating Desk。

## 4. 触发规则

### 4.1 显示 Wizard 的用户

满足任一条件时显示 Wizard：

- 用户第一次登录 Studio。
- 用户没有任何 project。
- 用户有 project 但没有任何 generated result。
- 用户注册后还没有完成 first generation。

### 4.2 不显示 Wizard 的用户

以下用户默认进入 Agent Operating Desk：

- 已经有至少一个 generated result。
- 手动选择 `Skip setup` 的用户。
- 从特定 project link 进入的老用户。
- Admin 用户。

### 4.3 重新打开 Wizard

用户可以在 Agent 或 Project 页面点击：

- `Explore Duitok features`
- `Start guided generation`
- `Try another AI tool`

重新进入 Wizard。

## 5. Wizard 最小流程

Wizard 最小版只做 4 步。重点不是问很多用户资料，而是让新手快速理解功能。

### Step 1：功能介绍

标题：

```text
What do you want AI to help you make money with?
```

展示 6 个功能卡片，用新手语言介绍，不使用内部 tab 名作为主文案：

1. `AI Product Image`
   - 说明：生成产品图、广告图、海报图。
   - 适合：没有设计师、想快速做商品视觉的新手。

2. `AI Short Video`
   - 说明：生成 TikTok 商品短视频或视频 prompt。
   - 适合：想做短视频带货但不会拍的新手。

3. `UGC Script`
   - 说明：帮你写开头、口播、caption、hashtags。
   - 适合：想自己拍或给 creator brief 的新手。

4. `7-Day Content Plan`
   - 说明：帮你安排一周每天发什么。
   - 适合：不知道每天发什么的新手。

5. `Clone Viral Style`
   - 说明：把别人的爆款结构变成你的产品版本。
   - 适合：看到别人爆了，但不会拆解的新手。

6. `Ask Duitok Agent`
   - 说明：不知道选哪个，就让 Agent 帮你判断。
   - 适合：完全新手、还没想清楚产品或方向的人。

验收：

- 用户第一屏能看懂 Duitok 可以做什么。
- 每张功能卡片都用“能帮你做什么”表达，不使用技术名堆叠。
- 用户可以直接选择一个功能进入下一步。

### Step 2：选择你的起点

标题：

```text
What do you want to try first?
```

选项：

1. Product image
2. Short video / video prompt
3. UGC script
4. 7-day content plan
5. Clone viral style
6. Ask Agent to recommend

默认推荐：

- 对完全新手默认推荐 `Ask Agent to recommend`。
- 对已经有产品的新手推荐 `Product image` 或 `UGC script`，因为成本低、成功率高。
- 对已经上传产品图的新手推荐 `Short video / video prompt`。

每个选项显示短说明：

- Product image：`Make your product look sellable`
- Short video：`Create content for TikTok`
- UGC script：`Know what to say in your video`
- 7-day content plan：`Know what to post this week`
- Clone viral style：`Turn a viral idea into your version`
- Ask Agent：`Let Duitok choose for you`

验收：

- 选项不超过 6 个。
- 不暴露模型名作为第一选择。
- 用户无需理解 Image / UGC / Auto / Storytelling tab。

### Step 3：简单资料

标题：

```text
Tell Duitok a little bit about what you sell
```

字段：

- Product name，可选但推荐。
- Product photo，可选。
- Language：Bahasa Melayu / English / 中文。
- Style：Soft sell / Review / Problem-solution / Offer push。

默认值：

- Malaysia 用户默认 Bahasa Melayu。
- Style 默认 Soft sell。

提示：

- `Example: serum, lunchbox, wireless mic`
- `No product yet? You can still ask Agent for ideas.`

验收：

- Language 和 style 会写入 project。
- 用户没有产品名时也能选择 `Ask Agent` 继续。
- Product name / product photo 不作为强阻塞。

### Step 4：Review + Generate

标题：

```text
Ready to create your first asset
```

显示：

- Selected feature
- What this feature does
- Product name if provided
- Language
- Style
- Generated prompt preview
- Estimated credits
- Estimated time

主按钮：

```text
Generate first asset
```

次按钮：

```text
Edit prompt
```

行为：

- 点击主按钮前检查 credits。
- credits 足够：创建 project，保存 fields，触发生成。
- credits 不足：显示 top up 或 subscription 提示。
- 生成中显示 progress state。
- 生成成功后显示 result preview。

验收：

- 用户在点击 Generate 前知道预计扣费。
- 扣费动作有明确确认。
- 生成失败时显示是否扣费和重试建议。
- 如果用户选择的是功能介绍型路径，可以先进入对应功能页，不强制马上生成。

## 6. Wizard 功能路径映射

### 6.1 AI Product Image

映射：

- Project tab：Image。
- 默认模式：Product ad image / poster image。
- 如果用户上传产品图，作为 product reference。
- 默认语言：用户选择语言。
- 默认风格：用户选择 style。

推荐 prompt 结构：

```text
Create a clean product image for [product].
Make it suitable for TikTok Shop, ads, or social media.
Style: [style].
Language: [language] if text is needed.
Make the product look clear, trustworthy, and easy to sell.
```

### 6.2 AI Short Video

映射：

- Project tab：Original Video 或 UGC。
- 默认目标：TikTok-style vertical content。
- 默认比例：9:16。
- 默认输出可以是 video prompt 或真实 video generation，按 credits 和 provider readiness 决定。

推荐 prompt 结构：

```text
Create a TikTok-style short video idea for [product].
Style: [style].
Language: [language].
Show what to say, what to show, and how to make the product interesting.
Keep it simple for a beginner to understand or execute.
```

### 6.3 UGC script

映射：

- Project tab：UGC 或 Auto Content。
- 输出：hook、script、caption、hashtags。

推荐 prompt 结构：

```text
Write a short UGC-style script for [product].
Language: [language].
Style: [style].
Include hook, short script, caption, and hashtags.
Make it beginner-friendly and easy to record.
```

### 6.4 7-day content plan

映射：

- Project tab：Auto Content 或 Storytelling。
- 输出：7 条内容方向，每条包含 hook、angle、format、caption。

推荐 prompt 结构：

```text
Create a 7-day simple content plan for [product].
Language: [language].
Style: [style].
Each day should include what to post, hook idea, content angle, and caption idea.
Keep the plan simple enough for a beginner to follow.
```

### 6.5 Clone Viral Style

映射：

- Project tab：Clone Prompt。
- 输入可以是用户粘贴的爆款文案、视频描述、链接或简单说明。
- 输出：可用于自己产品的结构、hook、caption、prompt。

推荐 prompt 结构：

```text
Analyze this viral content style and turn it into a version for [product].
Language: [language].
Keep the structure, but rewrite it safely and originally.
Make the final output easy for a beginner to use.
```

### 6.6 Ask Duitok Agent

映射：

- Page：Agent Operating Desk。
- Agent 根据用户是否有产品、是否有图片、是否知道平台，推荐一个功能。
- 如果用户完全没有方向，Agent 先介绍 Duitok 的 3 个最简单起点：
  - Product image
  - UGC script
  - 7-day content plan

验收：

- 不知道选什么的用户不会被卡住。
- Agent 的第一条回复必须解释推荐哪个功能和为什么。

## 7. 页面设计要求

### 7.1 视觉原则

- Wizard 是新手功能介绍 + 第一次使用路径，不是 landing page。
- 每一步只问当前必需的信息。
- 不显示过多说明文字。
- 不使用巨大 hero 标题。
- 不出现 6 个功能 tab。
- 保留 Duitok 品牌色，但整体紧凑。

### 7.2 Desktop 布局

推荐：

```text
-----------------------------------------------------
| Duitok logo                         Credits / Help |
-----------------------------------------------------
| Step indicator: 1 Explore -> 2 Choose -> 3 Details -> 4 Start
-----------------------------------------------------
| Main form                           Preview panel  |
|                                     - Selected tool |
|                                     - Prompt       |
|                                     - Credits      |
-----------------------------------------------------
| Back                         Continue / Generate   |
-----------------------------------------------------
```

### 7.3 Mobile 布局

推荐：

- 单列。
- Step indicator 简化成 `Step 1 of 4`。
- Preview panel 折叠到 form 下方。
- 主按钮固定在底部，但不遮挡内容。

### 7.4 尺寸规范

沿用 Studio density：

- Page title：30-40px desktop，26-30px mobile。
- Card padding：20-28px。
- Button height：44-50px。
- Input height：46-54px。
- Upload area：150-200px。
- Step gap：18-24px。

验收：

- 1366px desktop 下，一步内容不需要滚动太多。
- Mobile 下主按钮不被 WhatsApp support 遮挡。

## 8. 状态设计

### 8.1 空状态

如果用户没有 project：

```text
Let's see how Duitok can help you make money with AI.
```

### 8.2 生成中

显示：

- `Creating your first asset...`
- 当前步骤：Preparing prompt / Sending generation / Waiting for result。
- 不显示 provider 内部信息。

### 8.3 成功状态

显示：

- Result preview。
- 主按钮：`Continue with Agent`
- 次按钮：`Open project`
- 次按钮：`Download`

成功后动作：

- 标记 `firstGenerationCompleted = true`。
- 自动进入 Agent Operating Desk。
- Agent 首条消息基于本次结果给下一步建议。

### 8.4 失败状态

显示：

- 失败原因的用户化解释。
- 是否扣 credits。
- `Try again`
- `Edit prompt`
- `Ask Agent for help`

禁止：

- 暴露 provider error raw message。
- 暴露 endpoint、task id、internal route。

## 9. 数据要求

### 9.1 User state

需要记录：

- `firstGenerationCompleted`
- `wizardSkipped`
- `firstGenerationProjectId`
- `firstGenerationResultId`
- `firstGenerationCompletedAt`

### 9.2 Project fields

Wizard 需要写入：

- project name
- product name
- product link
- product photo attachment
- target language
- selling style
- selected first feature
- selected beginner goal
- generated prompt

### 9.3 Analytics events

建议记录：

- `wizard_started`
- `wizard_step_completed`
- `wizard_skipped`
- `wizard_generate_clicked`
- `wizard_generation_success`
- `wizard_generation_failed`
- `wizard_continue_agent_clicked`
- `wizard_open_project_clicked`

## 10. Credits 与扣费

### 10.1 展示规则

Step 4 必须显示：

- Estimated credits。
- 当前 credit balance。
- 失败是否扣费。
- 不足时如何 top up。

### 10.2 扣费规则

- 文本类：按 text/prompt action 计费。
- 图片类：按 image generation 计费。
- 视频类：按 video generation 计费。
- 生成失败按现有 ledger/refund 逻辑处理，并给用户解释。

验收：

- 用户不会误以为 RM69 是 unlimited generation。
- 用户不会在不知道扣费的情况下触发生成。

## 11. 与 Agent 的衔接

Wizard 成功后，Agent 不应该只说 congratulation。

Agent 应该继续用新手语言介绍下一步，而不是突然进入专业运营语气：

```text
Your first content is ready.
Next, Duitok can help you:
1. Make another version
2. Turn this into a 7-day posting plan
3. Create a product image or video for the same product
```

Action cards：

- `Make another version`
- `Create 7-day plan`
- `Try another function`
- `Open project`

验收：

- Wizard 成功后用户自然进入 Agent。
- Agent 继续承接，并继续介绍 Duitok 能帮他做什么。

## 12. 开发阶段

### Phase 1：Wizard UI + 本地流程

范围：

- 4 步页面。
- 表单状态。
- Prompt preview。
- Skip / Back / Continue。
- 功能卡片介绍。
- 成功后进入 Agent。

验收：

- 不接真实生成也能完整走完。
- UI desktop/mobile 可用。

### Phase 2：创建 Project + 保存 Fields

范围：

- Wizard 提交后创建 project。
- 写入 product、language、style、prompt。
- 上传 product photo。

验收：

- Wizard 生成的 project 能在 Project 页面打开。
- 对应 tab 字段已预填。

### Phase 3：接入真实生成

范围：

- 根据 selected first feature 调用对应 generate action。
- 显示 credits。
- 成功后 result preview。
- 失败处理。

验收：

- Product image / UGC script 至少先打通一个低风险路径。
- Short video 可以先输出 video prompt，再接真实 video generation。
- 真实 video generation 必须有明确 credits 确认。

### Phase 4：Agent 衔接

范围：

- 成功后进入 Agent Operating Desk。
- Agent 自动读 first project context。
- 显示下一步 action cards。

验收：

- 用户完成第一次生成后不会回到空白 Studio。

## 13. 成功指标

### 13.1 核心指标

- 注册后 Wizard start rate。
- Wizard completion rate。
- Wizard generate click rate。
- First generation success rate。
- Time to first generation。
- Wizard success -> Agent continue rate。

### 13.2 体验指标

- 新用户无需打开 6 个 tab 即可完成第一次生成。
- 用户在 Step 4 前理解扣费。
- Mobile 下没有主按钮遮挡。
- 失败状态能让用户继续重试或找 Agent。

### 13.3 商业指标

- 注册后 24 小时内首次使用率提升。
- 新用户 credits 消耗启动率提升。
- WhatsApp 里“不会用”的咨询减少。
- 第一次使用后 7 天留存提升。

## 14. 风险与处理

### 14.1 Wizard 太长导致用户跳出

处理：

- 最小版只做 4 步。
- 每步最多 1-3 个字段。
- Product link / photo 都可选。
- 第一屏只介绍功能，不讲复杂运营概念。

### 14.2 用户想直接进入 Studio

处理：

- 提供 `Skip setup`。
- Skip 后进入 Agent Operating Desk。
- Sidebar 仍可进入 Project。

### 14.3 生成失败破坏首次体验

处理：

- 先优先接入成功率更高、成本更低的 image/script。
- Video 生成显示预计时长和可能失败提示。
- 失败时强调是否扣费，并提供一键重试。

### 14.4 Credits 不足阻断体验

处理：

- 新用户应有 starter credits 或清楚 top up。
- 如果没有 credits，Step 4 转成 subscription/top-up CTA。
- 不要到最后才突然报错。

## 15. 最小可执行版本

如果只能先做 MVP，建议只做：

1. 新用户无 result 时进入 Wizard。
2. 4 步流程：Explore functions -> Choose first tool -> Simple details -> Start。
3. 第一屏介绍 6 个功能：Product Image、Short Video、UGC Script、7-Day Plan、Clone Viral Style、Ask Agent。
4. 先支持 Product image 或 UGC script 真实生成。
5. 自动创建 project 并保存 prompt。
6. 成功后进入 Agent，并继续介绍下一步可用功能。

这一版完成后，Duitok 的首次体验会从“自己研究复杂工具”变成“先看懂功能，再被带着完成第一次成功”。
