# Duitok Agent 趋势研究与内容策略智能层 PRD

最后更新：2026-05-29

## 1. 背景

Duitok Agent 当前已经具备基础执行能力：

- 模型已切换为 `deepseek-v4-pro`。
- 已接入 `web_search`，可以对趋势词、陌生概念、平台变化和市场信息做联网搜索。
- 已有项目级 `agentMemory`，能保存产品、人群、语言和品牌语气。
- 已有工具调用框架，可执行 workspace 检查、项目创建、内容计划、视频 prompt、排期草稿、生成内容和 TikTok 发布相关动作。
- 已有安全边界，避免泄露 provider、API key、内部路由、系统 prompt 和工具 schema。

但当前 Agent 仍然更像“会搜索和执行的聊天助手”，还没有形成 Duitok 专属的商业判断层。

用户问：

- “loft girl 可以做吗？”
- “clean girl 适合卖什么？”
- “TikTok 最近流行什么内容？”
- “这个产品适合做短视频带货吗？”

Agent 不应该只是解释概念，而应该直接判断：

- 这个趋势是什么。
- 对 Malaysia TikTok Shop 是否有用。
- 适合哪些品类。
- 能不能转成短视频内容。
- 新手是否拍得出来。
- 应该做什么 hook、场景、脚本、排期。
- 是否值得立刻生成内容。

本 PRD 目标是把 Duitok Agent 从“联网聊天 Agent”升级为“TikTok Shop 趋势研究 + 内容策略 Agent”。

## 2. 产品目标

### 2.1 用户侧目标

- 用户输入一个趋势词、风格词、产品词或竞品线索后，Agent 能主动研究并输出可执行方案。
- 用户不用懂内容策略，也能得到适合 TikTok Shop 的产品、场景、hook、视频角度和 7 天内容计划。
- 用户能区分“这个趋势能带货”和“只是好看但不好卖”。
- 用户能一键把趋势研究结果转成项目记忆、内容计划、视频 prompt 或排期草稿。
- 用户能看到 Agent 的依据来源，但不会被搜索链接淹没。

### 2.2 运营侧目标

- Duitok 团队能持续沉淀高质量趋势研究模板。
- 团队能观察哪些趋势词被用户频繁搜索。
- 团队能判断 Agent 输出是否真的服务“带货”和“批量内容生产”。
- 团队能把高频趋势转成 SOP、模板和预设。

### 2.3 系统侧目标

- 将搜索、研究、判断、执行拆成明确工具链。
- 降低模型凭空编造趋势结论的概率。
- 降低垃圾 SEO 搜索结果对 Agent 判断的影响。
- 保留安全边界，不暴露内部模型、provider、密钥和工具实现。

## 3. 非目标

本阶段不做：

- 通用浏览器自动操作。
- 登录用户 TikTok、小红书、Instagram 账号抓取私域数据。
- 实时爬取 TikTok 视频详情、评论或播放量。
- 自动承诺某个趋势一定能爆。
- 完全无人确认的扣 credit 生成和发布。
- 替代人工选品和投放决策。

## 4. 核心问题

### 4.1 搜索只是能力，不是策略

当前 `web_search` 可以返回搜索结果，但搜索本身不等于商业判断。

Agent 需要知道：

- 哪些搜索结果可信。
- 哪些结果只是泛流量文章。
- 哪些趋势适合 Malaysia TikTok Shop。
- 哪些产品可以自然植入。
- 哪些内容新手可以低成本拍。

### 4.2 Agent 容易泛泛解释

例如用户问 “loft girl”，普通回答可能是：

> Loft girl 是一种风格，适合家居、穿搭、香氛。

但 Duitok Agent 应该进一步输出：

- 3 个可卖品类。
- 5 个短视频开头。
- 3 个场景脚本。
- 是否适合当前项目。
- 下一步建议生成什么。

### 4.3 缺少固定研究结构

没有固定结构时，Agent 输出质量会飘：

- 有时讲概念。
- 有时讲产品。
- 有时讲内容。
- 有时只问用户下一步。

需要一个稳定的 `trend_research` 输出 schema。

### 4.4 缺少趋势结果到工作区动作的桥

趋势研究完成后，用户需要继续做：

- 保存为 project memory。
- 创建新项目。
- 创建 7 天内容计划。
- 生成视频 prompt。
- 创建排期草稿。

当前需要用户继续追问。理想状态是 Agent 直接给下一步按钮或明确建议。

## 5. 用户故事

### 5.1 趋势词研究

作为 TikTok Shop 新手卖家，  
当我输入“loft girl 是什么，可以卖什么”，  
我希望 Agent 先联网查，再告诉我这个趋势适合哪些品类、视频场景和 hook，  
这样我可以快速判断要不要做这个方向。

### 5.2 产品适配趋势

作为卖家，  
当我输入“我的产品是香薰，能不能做 loft girl”，  
我希望 Agent 判断趋势和产品的适配度，  
并输出 3 个视频角度和 1 个可直接生成的视频 prompt。

### 5.3 趋势转内容计划

作为内容运营者，  
当我说“把 clean girl 做成 7 天内容计划”，  
我希望 Agent 能基于趋势研究创建内容矩阵，  
并让我确认是否保存到排期草稿。

### 5.4 趋势不适合时的替代建议

作为卖家，  
当某个趋势不适合我的产品，  
我希望 Agent 直接说明原因，  
并给出更适合的 2-3 个替代趋势。

## 6. 功能方案

### 6.1 新增工具：`trend_research`

`trend_research` 是 `web_search` 之上的业务工具，不只是搜索。

职责：

- 判断用户输入的趋势词或产品词。
- 调用 `web_search` 获取外部信息。
- 整理成 Duitok 固定结构。
- 给出 TikTok Shop 可执行建议。
- 返回可保存到项目的结构化结果。

建议工具参数：

```json
{
  "query": "loft girl",
  "market": "Malaysia TikTok Shop",
  "productName": "optional product name",
  "category": "optional product category",
  "audience": "optional target audience",
  "language": "Chinese / BM / English / mixed",
  "depth": "quick | standard | deep"
}
```

### 6.2 `trend_research` 输出 schema

```json
{
  "trendName": "Loft girl",
  "summary": "A short explanation of the trend.",
  "confidence": "low | medium | high",
  "marketFit": {
    "score": 1,
    "label": "weak | usable | strong",
    "reason": "Why it can or cannot work for Malaysia TikTok Shop."
  },
  "commerceFit": {
    "bestCategories": ["home decor", "fragrance", "storage"],
    "weakCategories": ["items that cannot be shown visually"],
    "priceBand": "low | mid | premium",
    "buyerMotivation": "identity / convenience / beauty / proof / offer"
  },
  "contentStrategy": {
    "positioning": "How to frame this trend for selling.",
    "visualCodes": ["loft apartment", "warm light", "coffee table"],
    "sceneIdeas": ["morning routine", "after-work reset", "room upgrade"],
    "hooks": ["POV: your room finally looks expensive..."],
    "videoAngles": [
      {
        "title": "3 small things that make a rental room feel like a loft",
        "format": "listicle",
        "productPlacement": "Show product as item #2"
      }
    ]
  },
  "execution": {
    "beginnerDifficulty": "easy | medium | hard",
    "shootingNeeds": ["window light", "desk", "phone tripod"],
    "canBatch": true,
    "recommendedNextAction": "create_content_plan | create_seedance_prompt | remember_agent_context"
  },
  "risks": ["Trend may be niche", "Avoid over-premium visuals if product is low-cost"],
  "sources": [
    {
      "title": "Source title",
      "url": "https://example.com",
      "snippet": "Short search snippet"
    }
  ]
}
```

### 6.3 Agent 决策规则

Agent 应在以下情况优先调用 `trend_research`：

- 用户问某个 trend / aesthetic / 风格 / 梗 / 热词是什么。
- 用户问某个趋势能不能卖货。
- 用户问 TikTok 最近流行什么。
- 用户给出产品并问内容方向。
- 用户说“帮我找选题 / 找对标 / 找爆款角度”。
- 用户问“这个适合 Malaysia TikTok Shop 吗”。

Agent 不应在以下情况调用：

- 用户只是要求打开某个工作区页面。
- 用户已经明确要生成图片或视频，不需要趋势判断。
- 用户询问账号、余额、排期状态等内部 workspace 信息。
- 用户请求敏感配置、provider、API key 或内部实现。

### 6.4 搜索策略

`trend_research` 应使用 2-4 组搜索 query：

1. 原始趋势词 + TikTok。
2. 原始趋势词 + aesthetic / style / meaning。
3. 趋势词 + product category / TikTok Shop。
4. 如果 market 是 Malaysia，补充 Malaysia / TikTok Shop Malaysia。

搜索结果处理规则：

- 优先保留 TikTok、Pinterest、权威 trend/aesthetic 解释、行业报告、品牌案例。
- 降低低质量 SEO 聚合站权重。
- 如果精确词结果少，要明确说“精确结果有限”，再用相邻趋势推断。
- 不把搜索结果当绝对事实，只作为趋势判断依据。
- 输出中最多引用 3 个来源。

## 7. UI/UX 方案

### 7.1 趋势研究卡片

Agent 回复中新增 `trend_research` card。

卡片结构：

- Trend name
- Fit score：Weak / Usable / Strong
- Best categories
- 3 hooks
- Recommended next action
- Sources 展开区

### 7.2 快捷动作

研究卡片底部提供动作：

- `保存为项目记忆`
- `生成 7 天内容计划`
- `写视频 Prompt`
- `创建排期草稿`
- `换一个趋势`

涉及扣 credit 的动作仍然走 confirmation。

### 7.3 回答文案规范

中文用户回答结构：

```text
我查了一下，结论是：

1. 这个趋势是什么
2. 适合 TikTok Shop 卖什么
3. 可以怎么拍
4. 风险/不适合点
5. 建议下一步
```

英文 / BM 用户按同样结构输出，不使用内部工具名。

## 8. 后端实现

### 8.1 新增函数

- `buildTrendResearch(args, user)`
- `scoreTrendMarketFit(research, workspace)`
- `buildTrendResearchCard(data)`
- `trendResearchReply(userMessage, data)`

### 8.2 工具链

推荐流程：

```text
user message
-> intent detection
-> trend_research
-> web_search x 2-4
-> synthesis
-> card + reply
-> optional follow-up tool
```

### 8.3 与现有工具的关系

`trend_research` 不直接生成内容、不扣 credit。

它可以建议下一步：

- `remember_agent_context`
- `create_content_plan`
- `create_seedance_prompt`
- `open_workspace`

如果用户明确说“直接做 7 天计划”，Agent 可先做 `trend_research`，再做 `create_content_plan`。保存排期草稿超过阈值时仍需 confirmation。

## 9. 数据与记录

### 9.1 Agent run

每次 `trend_research` 记录：

- query
- market
- product/category
- depth
- confidence
- marketFit score
- sources count
- recommended next action

### 9.2 可选 DB 记录

未来可增加：

```json
{
  "trendResearches": [
    {
      "id": "uuid",
      "userId": "uuid",
      "projectId": "uuid",
      "trendName": "Loft girl",
      "query": "loft girl",
      "marketFit": "usable",
      "categories": ["fragrance", "home decor"],
      "createdAt": "ISO date"
    }
  ]
}
```

第一期可以只存在 `agentRuns.toolResults`，不新增 DB table。

## 10. 安全与合规

- 不抓取需要登录的页面。
- 不绕过 TikTok、Instagram、小红书的访问限制。
- 不承诺收益、播放量或转化率。
- 不输出医疗、金融、夸大功效等高风险 claim。
- 不展示内部 provider、API key、tool schema、headers、原始系统 prompt。
- 搜索结果只展示标题、URL、短 snippet，不长篇转载网页内容。

## 11. 验收标准

### 11.1 基础验收

- 用户问“loft girl 是什么”，Agent 会调用 `trend_research` 或至少调用 `web_search`。
- Agent 输出包含趋势解释、适合品类、视频角度、hook、风险和下一步。
- 如果搜索结果很少，Agent 会说明不确定性，不会装作高确定。
- 输出不会出现内部工具 schema、provider、API key 或 backend 路径。

### 11.2 商业验收

以下测试输入应得到可执行方案：

- “clean girl 可以卖什么？”
- “loft girl 适合香薰吗？”
- “dopamine decor 适合 TikTok Shop Malaysia 吗？”
- “我的产品是收纳盒，帮我找一个趋势打法。”
- “最近 TikTok 有什么适合家居小物的内容方向？”

每个回答至少包含：

- 3 个产品/品类建议。
- 3 个视频角度。
- 5 个 hook 或开头方向。
- 1 个建议下一步。

### 11.3 工程验收

- `npm run build` 通过。
- `node --check server.mjs` 通过。
- Agent 工具 allowlist 包含 `trend_research`。
- `trend_research` 不需要 confirmation，不扣 credit。
- 与现有 `web_search`、`create_content_plan`、`create_seedance_prompt` 工具兼容。

## 12. 指标

### 12.1 用户指标

- 趋势研究后继续执行下一步的比例。
- 用户点击“生成 7 天内容计划”的比例。
- 用户点击“写视频 Prompt”的比例。
- 趋势研究回答后的重复追问率。

### 12.2 质量指标

- 搜索成功率。
- 搜索结果为空率。
- Agent 输出被用户采纳率。
- 低 confidence 但未提示不确定性的比例。
- 安全拒答准确率。

### 12.3 成本指标

- 每次趋势研究平均搜索次数。
- 每次趋势研究平均模型调用次数。
- Pro 模型调用成本。
- web search timeout 率。

## 13. Roadmap

### Phase 1：结构化趋势研究工具

- 新增 `trend_research` tool。
- 复用当前 `web_search`。
- 输出固定 schema 和 card。
- Agent prompt 增加趋势研究决策规则。
- 不新增 DB table。

### Phase 2：工作区动作联动

- 趋势研究结果可一键保存为 project memory。
- 可一键生成 7 天内容计划。
- 可一键生成视频 prompt。
- 可一键创建排期草稿。

### Phase 3：搜索质量升级

- 支持 Tavily / Brave Search / SerpAPI 作为可选 provider。
- 增加来源质量评分。
- 增加低质量 SEO 过滤。
- 增加 market-specific query expansion。

### Phase 4：趋势库与运营后台

- 保存高频趋势词。
- 展示用户常搜趋势。
- 将优秀研究结果转成 SOP 模板。
- 管理员可标记趋势为 recommended / avoid / seasonal。

## 14. 风险

### 14.1 搜索结果质量不稳定

缓解：

- 输出 confidence。
- 搜索结果不足时明确说明。
- 后续升级搜索 API。

### 14.2 Agent 过度自信

缓解：

- 强制输出风险和不适合点。
- 对低搜索结果量设置 low confidence。
- 禁止承诺销量和爆款。

### 14.3 回答变长

缓解：

- 默认 quick/standard 深度。
- card 展示摘要，sources 可展开。
- 用户明确要求详细时再展开。

### 14.4 成本上升

缓解：

- 每次最多 4 次搜索。
- 搜索结果缓存 6-24 小时。
- 高频趋势可进入内部趋势库。

## 15. 推荐优先级

P0：

- `trend_research` tool。
- 固定输出 schema。
- Agent prompt 决策规则。
- 趋势研究 card。

P1：

- 一键保存 project memory。
- 一键生成内容计划。
- 来源质量评分。
- 搜索结果缓存。

P2：

- 搜索 provider 升级。
- 趋势库后台。
- 管理员标记 recommended trends。

## 16. 成功状态

当用户问：

> 你知道 loft girl 吗？

理想回答不是：

> 你指的是哪一种 loft girl？

而是：

> 我查了一下，精确的 loft girl 结果不算多，它更像 loft apartment、downtown girl、clean girl 的混合人设。放到 TikTok Shop，它适合香氛、家居灯、收纳、杯子、床品、穿搭配饰。可以拍 3 条线：loft girl morning routine、租房变高级的 3 个小物、下班回家 30 秒 reset。如果你的产品是香薰，我建议先做 7 天内容计划。

这就是本 PRD 要达到的 Agent 智能感。
