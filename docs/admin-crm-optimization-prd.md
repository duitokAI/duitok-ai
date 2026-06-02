# Admin CRM 优化 PRD

## 1. 背景

当前 Admin CRM 页面更像数据堆叠页：顶部 6 个大 KPI 卡片占据大量首屏空间，下面继续堆 Users、API Calls、User Detail、Ledger、Model Costs、Guardrails、Generated Assets、Payments、Admin Audit。

这对真实后台运营不够友好。Admin 打开 CRM 的核心目的不是“看一排大数字”，而是快速回答：

- 今天有没有异常？
- 哪些用户需要处理？
- 钱有没有收对？
- 生成失败是不是集中在某个 provider / model？
- 哪些动作需要我马上点击处理？

## 2. 当前问题

### 2.1 首屏 KPI 太大，但信息密度低

截图里每张卡片高度接近 280px，只展示一个数字和两个标签。对于 Admin CRM，这种尺寸更像 marketing dashboard，不像运营后台。

问题：

- 6 张卡横向铺满，用户很难判断优先级。
- Revenue / Cost / Profit 都是 RM 0.00 时占据过多空间。
- Failed Calls 只有 1，但没有入口告诉 Admin 这个错误来自哪个用户、哪个 provider、哪个时间。

### 2.2 CRM 缺少“待处理队列”

后台最重要的是 action queue，而不是纯指标。

应优先显示：

- Failed generation 待排查
- 余额不足但活跃的用户
- 新注册未生成用户
- 支付异常 / pending payment
- 被 suspend 或需要审核的账号
- 最近高成本调用

### 2.3 用户列表不可筛选、不可排序

当前 Users 表格只是平铺 email、role、project count、credits、cost。

缺少：

- 搜索 email / user id
- 按状态筛选：active / suspended / admin / low credits
- 按最近活跃排序
- 按 revenue / cost / profit 排序
- 快速看到 last activity、last generation、signup date

### 2.4 “用户详情”不够像 CRM

选中用户后看到 Credits / Revenue / Profit / Projects / Jobs / Status，但缺少运营判断所需上下文。

应补充：

- 用户生命周期：新用户 / 已激活 / 付费 / 流失风险
- 最近 5 个行为
- 最近失败原因
- 已创建项目和最近生成结果
- 支付记录状态
- Agent 权限是否异常
- 可直接执行的动作：加 credits、暂停、查看项目、查看失败、导出用户数据

### 2.5 API Calls / Generated Assets / Model Costs 暴露方式偏技术

Admin 需要技术诊断，但不应该让诊断信息和 CRM 主流程混在一起。

建议：

- CRM 首屏只显示异常摘要。
- Provider / endpoint / taskId 放到 “Ops Diagnostics” 抽屉或 Tab。
- 默认隐藏 taskId / endpoint，点击 “Reveal diagnostics” 后显示，并记录 Admin Audit。

### 2.6 页面结构没有主次

当前页面结构是：

1. Header
2. KPI grid
3. Users + API Calls
4. User Detail + Ledger
5. Model Costs + Guardrails
6. Assets + Payments + Audit

更合理的结构应该是：

1. Health strip：今天是否正常
2. Action queue：需要处理什么
3. Users CRM：用户筛选和详情
4. Revenue / Credits：钱和余额
5. Ops Diagnostics：API / provider / failed calls
6. Audit：敏感操作记录

## 3. 产品目标

### 3.1 一句话目标

把 Admin CRM 从“数据展示面板”改成“运营处理台”：Admin 打开后 10 秒内知道哪里出问题，30 秒内能处理一个用户或一条异常。

### 3.2 成功标准

- 首屏可看到今日关键健康状态，不需要横向扫 6 张巨大卡。
- Failed Calls 可以直接点进去看到来源和处理建议。
- Users 支持搜索、筛选、排序。
- User Detail 能完整回答“这个用户值不值得管、哪里出问题、下一步做什么”。
- 技术诊断默认收起，避免污染 CRM 主界面。
- 所有敏感 Admin 操作都有确认和 audit log。

## 4. 信息架构

### 4.1 顶部 Header

保留：

- `Admin CRM`
- `Duitok Multi-User CRM`
- `Export CRM Data`

优化：

- Header 高度压缩。
- Export 放右上角，但不要抢主视觉。
- 增加时间范围筛选：Today / 7D / 30D / All。

### 4.2 Health Strip

替代当前巨大 KPI 卡片。

建议 6 个指标变成一行紧凑卡：

- Users
- Active Users
- Generations
- Revenue
- Cost
- Failed Calls

每个指标显示：

- 主数字
- 环比或状态色
- 点击后跳转到对应列表筛选

示例：

`Failed Calls: 1` 点击后自动打开 Ops Diagnostics，并筛选 `status=failed`。

### 4.3 Action Queue

新增首屏核心模块。

队列项：

- `1 failed API call needs review`
- `2 users have credits below 4`
- `1 payment pending cleanup`
- `0 high-cost jobs today`

每条卡片包含：

- 问题
- 影响范围
- 建议动作
- CTA：Review / Fix / Ignore

### 4.4 Users CRM

Users 模块成为页面主区域。

功能：

- 搜索：email / user id
- 筛选：status、role、credits、paid status、last active
- 排序：createdAt、lastActivity、credits、revenue、cost、profit
- 表格列：
  - User
  - Status
  - Credits
  - Projects
  - Generations
  - Revenue
  - Cost
  - Profit
  - Last Activity
  - Actions

点击用户后右侧或下方打开 User Detail。

### 4.5 User Detail

User Detail 改成 CRM profile。

模块：

- Account summary：email、role、status、createdAt、lastActive
- Business summary：credits、revenue、cost、profit、projects、jobs
- Recent activity：最近项目、最近生成、最近失败、最近支付
- Actions：
  - Add credits
  - Deduct credits
  - Suspend / Unsuspend
  - View projects
  - View failed jobs
  - Export user

危险动作必须二次确认。

### 4.6 Revenue & Credits

Payment / Ledger 合并成财务区。

功能：

- Payment status filter
- Credit ledger timeline
- Manual credit adjustment reason 必填
- Cleanup payment 操作需要确认并写入 audit

### 4.7 Ops Diagnostics

把 API Calls、Generated Assets、Model Costs、Guardrails 放进单独 Tab 或折叠区。

默认展示摘要：

- Failed calls by model
- Cost by model
- Avg cost / generation
- Last failed error

点击 “Reveal diagnostics” 后显示：

- provider
- endpoint
- taskId
- raw error summary

要求：

- 仅 admin verified 可见
- reveal 行为写入 `adminAuditLogs`

### 4.8 Admin Audit

Audit 默认放页面底部或独立 Tab。

必须记录：

- admin unlock
- credit adjust
- suspend / unsuspend
- payment cleanup
- reveal diagnostics
- export CRM data

表格列：

- Time
- Admin
- Action
- Target
- Result

## 5. 视觉优化

### 5.1 整体风格

Admin CRM 应该更像操作后台，而不是品牌展示页。

建议：

- 减少大圆角卡片。
- 卡片 radius 控制在 8-12px。
- KPI 使用紧凑条，不用巨大卡。
- 表格密度提高。
- 粉色只用于警示或重点，不要全页泛粉。

### 5.2 首屏布局

桌面端建议：

```text
Header + Date Filter
Health Strip
Action Queue
Users Table | User Detail
Finance Tab / Ops Tab / Audit Tab
```

移动端：

```text
Header
Health Strip horizontal scroll
Action Queue
Users Search
User Cards
Tabs
```

### 5.3 状态颜色

- Healthy：绿色
- Warning：黄色
- Failed / Suspended：红色
- Neutral：灰紫
- Money：深色数字，不用过度装饰

## 6. 数据需求

当前已有：

- `admin.totals`
- `admin.users`
- `admin.generationJobs`
- `admin.apiCalls`
- `admin.payments`
- `admin.creditLedger`
- `admin.adminAuditLogs`
- `admin.modelCosts`

建议补充字段：

- user.createdAt
- user.lastActiveAt
- user.lastGenerationAt
- user.lastPaymentAt
- user.lifecycleStage
- user.failedJobsCount
- user.lowCreditRisk
- job.createdAt
- job.durationMs
- job.errorCategory
- payment.createdAt / updatedAt

## 7. 交互需求

### 7.1 点击 KPI 自动筛选

- 点击 Users -> Users 表
- 点击 Failed Calls -> Ops Diagnostics failed filter
- 点击 Revenue -> Payments
- 点击 Cost -> Model cost breakdown

### 7.2 Action Queue 一键处理

示例：

- Failed API call -> 打开失败详情
- Low credits user -> 打开用户详情并显示加 credits
- Pending payment -> 打开 cleanup modal

### 7.3 User Detail 不跳页

点击用户后在同页右侧打开 detail，不打断上下文。

### 7.4 危险操作确认

以下操作必须 modal 确认：

- Suspend user
- Delete / cleanup payment
- Deduct credits
- Export all CRM data
- Reveal provider diagnostics

## 8. 实施分期

### Phase 1：布局和信息层级

- 压缩 KPI 为 Health Strip。
- 新增 Action Queue。
- Users 表格增加搜索、筛选、排序。
- User Detail 改成 CRM profile。
- API Calls / Model Costs / Guardrails 默认收起。

### Phase 2：数据增强

- 补 lastActiveAt / createdAt / failedJobsCount。
- 增加 payment status、job errorCategory。
- 增加 cost by model / failed by model 聚合。

### Phase 3：运营动作闭环

- Action Queue 支持处理状态。
- Dangerous actions modal。
- Reveal diagnostics audit。
- Export 行为 audit。

## 9. 验收标准

- Admin 首屏在 1440px 宽度下不再出现 6 张巨大 KPI 卡。
- 首屏必须展示 Action Queue。
- Users 可以按 email 搜索。
- Users 可以按 credits / revenue / status 排序或筛选。
- Failed Calls 可点击定位到具体失败记录。
- User Detail 中可以看到该用户最近行为和财务摘要。
- Provider/taskId 默认不直接暴露在 CRM 主界面。
- 所有危险操作有确认弹窗。
- `npm run build` 无 CSS warning。

## 10. 不做范围

- 不重做登录/权限系统。
- 不新增复杂 BI 图表。
- 不展示普通用户不能看的 provider 细节。
- 不把 Admin CRM 做成公开 dashboard。

## 11. 推荐优先级

最高优先级：

1. KPI 压缩成 Health Strip。
2. 增加 Action Queue。
3. Users 搜索和筛选。
4. Failed Calls 点击可追踪。
5. 技术诊断默认收起。

这 5 项做完，Admin CRM 会从“看起来有数据”变成“真的能管运营”。
