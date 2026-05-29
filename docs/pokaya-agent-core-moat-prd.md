# Duitok Agent 核心卖点与护城河 PRD

最后更新：2026-05-29

## 1. 背景

Duitok AI 当前已经不只是一个“AI 生成工具”。平台已经具备：

- Studio 工作区。
- 项目管理。
- 图片 / 视频 / 内容计划 / 排期。
- TikTok Direct Post 基础能力。
- Duitok Agent。
- `deepseek-v4-pro` 推理。
- `web_search` 联网搜索。
- `trend_research` 趋势研究。
- 项目记忆。
- 用户反馈学习闭环。

现在最大的机会不是继续堆更多生成按钮，而是把 Duitok Agent 培养成产品的核心卖点：

**用户不是来买一个 AI 工具，而是来请一个懂 TikTok Shop Malaysia 的内容运营 Agent。**

这份 PRD 目标是定义：

- Duitok Agent 应该成为怎样的核心功能。
- 它与普通 AI 工具的差异化是什么。
- 它如何形成数据飞轮和护城河。
- 接下来应该优化哪些模块。
- 如何包装成用户愿意付费、愿意每天打开的卖点。

## 2. 核心定位

### 2.1 当前定位

当前 Duitok Agent 是：

> 可搜索、可执行、可记忆、可学习的 TikTok Shop 内容运营 Agent。

### 2.2 目标定位

目标是升级为：

> Duitok Agent 是一个专为 Malaysia TikTok Shop seller 训练的 AI 内容运营合伙人。它会研究趋势、判断产品适配、生成内容策略、创建素材、安排发布，并根据用户行为越用越懂这个卖家。

### 2.3 一句话卖点

建议官网/销售页主打：

> 不只是生成视频，而是你一提问，就有一个 AI Agent 帮你查趋势、想内容、排计划、生成素材。

或更短：

> Your TikTok Shop content operator, powered by AI.

中文版本：

> 不是一个 AI 工具，是你的 TikTok Shop 内容运营 Agent。

BM 版本：

> Bukan sekadar AI tool. Ini AI operator untuk content TikTok Shop anda.

## 3. 为什么这是核心护城河

普通 AI 工具的能力：

- 写文案。
- 生成图。
- 生成视频。
- 回答问题。

Duitok Agent 的差异化应是：

- 懂 TikTok Shop 场景。
- 懂 Malaysia seller 的实际执行难度。
- 知道用户当前 project。
- 会研究趋势并转成可卖内容。
- 会把内容放进排期。
- 会记住用户偏好。
- 会根据用户采用行为变聪明。
- 能沉淀成模板和 SOP。

真正的护城河不是模型，而是：

```text
用户行为数据
-> Agent 偏好记忆
-> 高采用率内容模板
-> Duitok 官方 SOP
-> 更好的推荐
-> 更高采用率
-> 更多用户行为数据
```

这叫 Duitok 内容运营飞轮。

## 4. 产品目标

### 4.1 用户目标

- 新手不需要懂 TikTok 内容策略，也能在提问后知道下一条该拍什么。
- 用户不需要从零写 prompt，Agent 会根据产品和趋势给方向。
- 用户需要帮助时，Agent 能根据当前问题和项目状态给出可执行下一步。
- 用户能把一次想法变成完整内容流：趋势研究 -> 内容计划 -> 视频 prompt -> 生成 -> 排期。
- Agent 越用越懂用户，不再每次都重新解释产品、语气、风格和目标人群。

### 4.2 商业目标

- 提高用户日活和周活。
- 提高生成次数和 credit 消耗。
- 提高 RM69 订阅留存。
- 提高用户感知价值，让 Duitok 不容易被普通 AI 工具替代。
- 形成高质量内容模板库，降低后续获客和教学成本。

### 4.3 产品目标

- Agent 成为 Studio 的第一入口，而不是附属聊天窗。
- Agent 输出从“回答”升级成“可执行工作流”。
- Agent 能解释为什么推荐这个方向。
- Agent 能根据反馈持续优化。
- Agent 能形成可复用的模板和 SOP。

## 5. 目标用户

### 5.1 TikTok Shop 新手 seller

痛点：

- 不知道卖什么内容。
- 不知道怎么拍。
- 不懂 hook。
- 不会稳定日更。

Agent 价值：

- 在用户提问后给明确任务。
- 给趋势方向。
- 给可拍脚本。
- 给低成本拍摄方案。

### 5.2 小团队运营者

痛点：

- 多产品、多账号，内容容易乱。
- 需要批量计划和排期。
- 需要快速测试多个方向。

Agent 价值：

- 项目级记忆。
- 批量内容计划。
- 生成和排期联动。
- 内容方向复用。

### 5.3 培训/社群型客户

痛点：

- 学员不会执行。
- 老师要反复回答类似问题。
- SOP 很难落地。

Agent 价值：

- 把 SOP 变成可执行 Agent。
- 学员每天跟 Agent 做任务。
- 老师可沉淀模板。

## 6. 核心用户旅程

### 6.1 用户提问后启动

用户打开 Studio 时，Agent 不主动打扰。用户发问后，Agent 才启动：

> 用户：这个 loft girl 方向适合我的香薰吗？
> Agent：联网搜索 + 判断趋势 + 结合项目记忆，给出适配度、内容角度、下一步可执行按钮。

### 6.2 趋势到执行

```text
用户：clean girl 最近还能做吗？
Agent：搜索 + 趋势判断 + 品类建议
用户：我的产品是化妆镜
Agent：判断适配 + 生成 3 个视频角度
用户：做 7 天计划
Agent：创建内容计划 + 可选排期草稿
用户：生成第 1 条视频 prompt
Agent：写 prompt + 保存项目字段
用户：确认生成
Agent：扣 credit + 生成结果
```

### 6.3 越用越懂

用户多次选择：

- soft sell。
- routine。
- home decor。
- 中文 hooks。

下次 Agent 应该说：

> 按你之前常用的 soft sell routine，我建议这个产品不要硬卖，做“下班回家 30 秒 reset”方向。

## 7. 功能模块

### 7.1 Agent Brain：被动式运营入口

目标：

把 Agent 放到 Studio 的核心入口，但只在用户提问后回答和执行。

功能：

- 输入框为第一入口。
- 展示偏好记忆、学习状态、成功模板。
- 不做每日建议、不主动推送、不自动打扰。
- 当前 project 状态。
- 缺什么素材。
- 最近采用过的趋势。
- 用户点击或提问后，才继续上次方向。

推荐组件：

- `Agent Brain`
- `Preference Memory`
- `Saved Templates`
- `Learning Metrics`
- `Ask Agent input`

### 7.2 Trend Research Pro

现有 `trend_research` 升级方向：

- 搜索多源。
- 判断趋势强弱。
- 判断 TikTok Shop 适配度。
- 给适合品类。
- 给视频角度。
- 给 hooks。
- 给拍摄难度。
- 给下一步按钮。

新增能力：

- 对比两个趋势。
- 判断某产品适合哪个趋势。
- 生成 trend-to-product map。
- 低 confidence 时给替代趋势。

### 7.3 Content Operator Workflow

把 Agent 输出变成工作流：

```text
Research
-> Plan
-> Prompt
-> Generate
-> Schedule
-> Review
-> Learn
```

每一步都应有：

- 卡片。
- 下一步按钮。
- 可编辑字段。
- 风险提示。
- 是否扣 credit。

### 7.4 Preference Memory

当前已有基础反馈学习，下一步要产品化。

用户能看到：

- Agent 已学到的趋势偏好。
- 内容格式偏好。
- 语言偏好。
- 不喜欢的方向。
- 最近采用的模板。

操作：

- 编辑偏好。
- 清空偏好。
- 保存当前结果为偏好。
- 标记“不再推荐这种方向”。

### 7.5 Success Template Library

目标：

把用户采用过的好内容沉淀成可复用模板。

模板类型：

- Trend template。
- Hook template。
- Video prompt template。
- 7-day content plan template。
- Product category SOP。

模板来源：

- 用户保存。
- 高采用率内容。
- Duitok 官方推荐。
- Admin 标记。

### 7.6 Agent Score 与信任感

用户需要知道 Agent 为什么这样建议。

每个建议应包含：

- Fit score。
- Confidence。
- Why this works。
- What can go wrong。
- Next action。

不要暴露内部模型或工具细节。

## 8. 数据飞轮设计

### 8.1 信号采集

正向信号：

- 点击有用。
- 点击下一步。
- 保存为记忆。
- 保存为模板。
- 创建内容计划。
- 生成视频 prompt。
- 扣 credit 生成。
- 创建排期。
- 下载结果。

负向信号：

- 点击不准。
- undo。
- 删除结果。
- 不继续下一步。
- 反复改同一个方向。

### 8.2 学习层级

1. Project memory
   当前项目产品、人群、语气。

2. User preference memory
   用户长期偏好。

3. Template memory
   可复用成功结构。

4. Global anonymized intelligence
   全局高采用率趋势和内容类型。

### 8.3 Agent 使用规则

- 当前用户请求优先。
- Project memory 优先于 user memory。
- User memory 只做 soft guidance。
- Global templates 只在无个人偏好时推荐。
- 不跨用户暴露具体数据。

## 9. 商业化包装

### 9.1 免费/试用层

可展示：

- Agent 基础聊天。
- 1-2 次趋势研究。
- 基础内容建议。

限制：

- 不保存长期偏好。
- 不开放模板库。
- 不批量生成计划。

### 9.2 RM69 会员层

核心卖点：

- Unlimited Agent guidance within fair use。
- Trend Research Pro。
- Agent remembers your product。
- 7-day content plan。
- Video prompt workflow。
- Scheduler drafts。

### 9.3 高阶层/未来

可包装：

- Advanced Agent Memory。
- Success Template Library。
- Team workflow。
- Multi-product batch planning。
- TikTok performance learning。

## 10. UI 改造方向

### 10.1 Agent 作为随问随答第一入口

Studio 内保留 Agent priority panel，但默认不输出每日建议：

```text
Ask Duitok Agent
用户输入问题后：
1. 理解用户意图
2. 联网/读取项目/调用工具
3. 输出可执行卡片
```

### 10.2 Agent Sidebar

显示：

- Agent status。
- 已学到的偏好。
- 当前 project context。
- 最近采用趋势。
- saved templates。

### 10.3 Workflow Cards

每个 Agent 输出都变成卡片：

- Trend card。
- Plan card。
- Prompt card。
- Generation card。
- Schedule card。
- Template card。

### 10.4 Feedback UX

轻量反馈：

- 有用。
- 不准。
- 保存为模板。
- 不再推荐。
- 用这个方向继续。

## 11. 后端 Roadmap

### Phase 1：Agent Core Loop

已完成或接近完成：

- `web_search`
- `trend_research`
- `agentFeedbackEvents`
- `agentPreferenceMemory`
- Agent prompt 注入偏好摘要
- 前端有用/不准

### Phase 2：Template Library

新增：

- `agentTemplates`
- `POST /api/agent/templates`
- `GET /api/agent/templates`
- `POST /api/agent/templates/:id/use`

模板来源：

- 用户保存。
- Agent 推荐。
- Admin 标记。

### Phase 3：Question-triggered Agent Brain

新增：

- Agent Brain panel。
- Preference Memory UI。
- Agent-assisted action metrics。
- 基于用户问题、偏好和项目状态推荐下一步。

### Phase 4：Performance Learning

未来接入：

- TikTok publish status。
- 手动输入表现。
- 播放量/点击/GMV。
- Content performance score。

## 12. 管理员能力

Admin 应看到：

- Top searched trends。
- Top adopted trends。
- Trend research -> content plan 转化。
- Content plan -> generation 转化。
- Agent positive/negative feedback。
- Undo rate。
- Saved templates。
- 用户偏好覆盖率。

Admin 可以：

- 标记官方推荐模板。
- 禁用低质量模板。
- 添加官方 SOP。
- 查看 Agent 失败原因。

## 13. 指标

### 13.1 北极星指标

**Agent-assisted content actions per active user per week**

定义：

每周每个活跃用户由 Agent 辅助完成的内容动作数量：

- trend research。
- content plan。
- prompt。
- generation。
- schedule draft。

### 13.2 核心指标

- Agent DAU / WAU。
- Agent message -> tool action rate。
- Tool card click-through rate。
- Trend research adoption rate。
- Content plan creation rate。
- Prompt generation rate。
- Credit generation conversion。
- Schedule draft conversion。
- Positive feedback rate。
- Undo rate。
- Template reuse rate。

### 13.3 商业指标

- RM69 trial -> paid。
- Paid retention。
- Credits consumed per paid user。
- Agent users vs non-Agent users retention。
- Agent-assisted generation revenue。

## 14. 风险

### 14.1 Agent 变复杂

风险：

用户不知道该点哪里。

缓解：

- 首页只保留一个清晰输入框。
- 每张卡只保留一个主 CTA。

### 14.2 推荐过度自信

风险：

Agent 把弱趋势说得太确定。

缓解：

- 必须显示 confidence。
- 低 confidence 给替代方向。
- 禁止承诺结果。

### 14.3 数据隐私

风险：

跨用户模板或偏好泄露。

缓解：

- 默认 user scope。
- global 模板必须匿名化。
- Admin 标记后才能进入官方库。

### 14.4 成本上涨

风险：

Pro 模型 + 搜索 +多工具导致成本升高。

缓解：

- 缓存 trend research。
- 高频趋势进入模板库。
- 简单任务不走 deep research。

## 15. 推荐优先级

P0：

- Saved Template Library。
- Preference Memory UI。
- Agent-assisted action metrics。
- Question-triggered Agent Brain。

P1：

- Admin Agent Analytics。
- Template reuse flow。
- Trend comparison。
- Product-to-trend matching。

P2：

- TikTok performance learning。
- Global anonymized recommendation engine。
- Team workflow。

## 16. 成功状态

当 Duitok Agent 成为核心功能时，用户打开平台的第一反应应该是：

> 我今天不用想内容，先问 Agent。

用户不再把 Duitok 当作“生成按钮集合”，而是当作：

> 我一问，就能推进 TikTok Shop 内容运营的 AI 合伙人。

这就是 Duitok Agent 的核心卖点和长期护城河。
