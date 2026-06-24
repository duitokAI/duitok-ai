# Content Model

## Extraction Prompt

When given an article, screenshot, source URL, or rough notes, extract:

- `entity`: company, product, person, market, or policy subject.
- `event`: what happened.
- `market_signal`: the most scannable figure or status.
- `why_now`: why this is timely.
- `implication`: what changes for creators, founders, investors, operators, or users.
- `source`: origin of the image or report.
- `topics`: 2-4 short tags.

## Copy Pattern

Use Chinese by default for user-facing copy in this project.

### Kicker

Format:

```text
AI 市场分析 · SOURCE REPORT
```

Examples:

- `AI 市场分析 · ENANYANG REPORT`
- `AI 产品观察 · OPENAI REPORT`
- `创作者经济 · MARKET NOTE`

### Headline

Keep it short and concrete:

- `Claude 母公司 估值近万亿`
- `AI 视频进入 成本战`
- `创作者工具 开始按结果定价`

Avoid:

- vague drama: `AI 圈又炸了`
- empty trend words: `未来已来`
- overlong summaries.

### Subhead

One sentence with event + implication:

```text
Anthropic 申请上市：AI 正从工具热，进入公开市场定价时刻。
```

### Market Signal

Use a large figure or compact phrase:

- `$1T`
- `IPO?`
- `30%`
- `价格战`
- `API 降价`

The note below explains the meaning:

```text
不是融资额，而是市场对 AI 公司的重新定价。
```

### Three Insights

Use exactly three. Each has a short title and one explanatory line.

Good structure:

1. from surface signal to deeper meaning
2. from market heat to capability/business model
3. from observer takeaway to user action

Example:

```text
01
从工具到资产
AI 公司开始被市场定价。

02
从热度到能力
会用 AI，正在变成基础竞争力。

03
从观望到学习
越早上手，越早建立工作流。
```

### Takeaway

Make the final line useful and memorable:

```text
现在学会用 AI 工具，不是追热点，是在给自己加分。
```

Avoid generic advice:

- `拥抱变化，抓住机会。`
- `未来属于有准备的人。`

## Fact Handling

- Browse or cite current sources for public-company, private valuation, IPO, pricing, leadership, regulation, or breaking-news claims.
- If using only user-provided text/screenshot, write `根据用户提供截图` in internal notes or final response when needed.
- Do not turn rumors into confirmed facts. Use `传出`, `据报道`, `市场预期`, or `准备` only when the source supports that wording.
