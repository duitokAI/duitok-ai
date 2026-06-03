# Settings 小窗口整合 Billing / Top Up Credit / Usage PRD

## 1. 背景

当前 Pokaya AI 的账户相关功能分散在两个地方：

- Sidebar 左侧 Business 区域：`Billing`、`Top Up Credit`、`Usage`
- Sidebar 底部用户区域：`Settings`

用户打开 `Settings` 后已经进入账户设置小窗口，但账单、充值和用量仍然留在主 sidebar 页面入口里。这样会造成两个问题：

- 账户相关能力分散，用户需要在 sidebar 和 setting modal 之间来回切换。
- Sidebar 项目过多，Studio 主工作区的导航负担偏重。

本次目标是把 `Billing`、`Top Up Credit`、`Usage` 的展示和操作都搬进 `Settings` 小窗口内，让 Settings 成为统一的账户中心。

## 2. 目标

### 2.1 产品目标

- `Settings` 小窗口承担完整账户中心功能。
- 左侧 sidebar 不再展示 `Billing`、`Top Up Credit`、`Usage` 三个独立入口。
- 用户在 setting modal 内完成账户资料查看、账单查看、Credit 充值、用量记录查看。
- 保持当前浅白紫色 modal 视觉，不回到单独页面。

### 2.2 体验目标

- 打开 `Settings` 后，左侧保留整列导航。
- 设置窗口左侧导航包含：
  - `Account`
  - `Billing`
  - `Top Up Credit`
  - `Usage`
- 默认进入 `Account`。
- 点击左侧任一 tab，只切换 setting modal 右侧内容，不关闭弹窗，不跳转主页面。
- modal 内容区域可独立滚动，不影响 Studio 背景页面滚动。

## 3. 非目标

本 PRD 不处理：

- 重做付款系统或支付网关。
- 修改现有 Credit 价格、套餐、订阅逻辑。
- 修改后端账单、支付、usage ledger 数据结构。
- 新增新的充值套餐。
- 改动 Studio 图片 / 视频生成主流程。
- 改动 Admin CRM。

## 4. 当前功能迁移范围

### 4.1 Billing

需要搬进 setting modal 的内容：

- 当前 plan 展示。
- 当前 credit balance / renewal / expiry 等已有账单信息。
- plan benefit / billing summary。
- payment history 或 billing history。
- 现有 billing 页面上的按钮、状态、空态。

原则：

- 复用现有 `billingPage()` 的数据来源和业务逻辑。
- 不在迁移中改变任何账单计算。
- 只改变入口和容器。

### 4.2 Top Up Credit

需要搬进 setting modal 的内容：

- 当前 Credit 余额展示。
- Top up package 列表。
- 选择套餐。
- checkout / payment 触发按钮。
- loading、success、failed、disabled 状态。

原则：

- 复用现有 `topupPage()` 的功能和支付逻辑。
- modal 内的 top up 页面需要能完整显示套餐和按钮。
- 如果支付会打开外部 checkout，行为保持当前逻辑。

### 4.3 Usage

需要搬进 setting modal 的内容：

- Credit usage 列表。
- 每条 usage 的 action、credit 变化、时间、状态。
- 空态。
- 现有筛选或分页逻辑，如果当前已有，需要保留。

原则：

- 复用现有 `usagePage()` 的数据来源。
- 列表区域在 modal 内可滚动。
- 不改变 usage ledger 的计算和文案含义。

## 5. 信息架构

### 5.1 Sidebar 调整

从 sidebar 的 Business / Account 区域移除以下入口：

- `Billing`
- `Top Up Credit`
- `Usage`

保留：

- `Settings`
- 其他现有功能入口，例如 Dashboard、Studio、Admin CRM、Content Library 等。

`Settings` 成为账户相关功能的唯一入口。

### 5.2 Settings Modal 导航

Settings modal 左侧导航结构：

```text
Close Button

Account
Billing
Top Up Credit
Usage
```

默认选中：

```text
Account
```

点击行为：

- 点击 `Account`：右侧展示 account profile form。
- 点击 `Billing`：右侧展示 billing 内容。
- 点击 `Top Up Credit`：右侧展示 top up 内容。
- 点击 `Usage`：右侧展示 usage 内容。

不允许：

- 点击 tab 后关闭 modal。
- 点击 tab 后跳转到 sidebar 页面。
- 点击 tab 后刷新整个 app。

## 6. UI 需求

### 6.1 Modal 外层

- 保持当前小窗口模式。
- 背景必须覆盖 Studio 页面所有内容。
- modal z-index 必须高于顶部 tab、底部 composer、sidebar、图片墙 action bar。
- 背景可轻微半透明，但不可让底部按钮穿透点击。

### 6.2 色调

沿用当前浅白紫色方向：

- 主背景：白色 / 极浅紫 / 淡粉紫。
- 文字：深紫黑。
- 次级文字：灰紫。
- 激活态：白底或浅紫底。
- CTA：沿用现有珊瑚红渐变按钮。

不使用：

- 深色 settings modal。
- 大面积黑灰底。
- 高饱和紫色整屏铺底。

### 6.3 左侧导航

左侧导航整列保留，不因为只剩一个 tab 而消失。

当加入 Billing / Top Up Credit / Usage 后：

- 左侧宽度固定，不随右侧内容变化。
- 每个 nav item 高度一致。
- icon 与文字居中对齐。
- active item 有清晰背景。
- hover item 有轻微反馈。
- 关闭按钮固定在左上方。

### 6.4 右侧内容区域

右侧分为：

- header
- scroll content

header 随当前 tab 改变：

| Tab | 标题 | 描述 |
| --- | --- | --- |
| Account | Account | Account info & contact |
| Billing | Billing | Plan, renewal, rates, and payment history |
| Top Up Credit | Top Up Credit | Add credits to keep creating |
| Usage | Usage | Credit usage from the backend ledger |

右侧内容区域：

- 可独立滚动。
- 滚动条只出现在内容区域。
- footer / bottom composer 不可盖住 modal 内容。
- 内容多时不可把 modal 撑出屏幕。

## 7. 响应式需求

### 7.1 Desktop

- modal 使用两列布局：
  - 左侧 nav：固定宽度，建议 240-280px。
  - 右侧内容：自适应剩余宽度。
- modal 最大高度不超过 viewport。
- 右侧内容 scroll。

### 7.2 Tablet / Mobile

当宽度不足时：

- modal 可以变成上下结构。
- 顶部保留 close button 与 tab nav。
- nav item 可以横向排列。
- 文字过长时可缩短或换行，但不可溢出。
- Top Up package card 和 Usage list 必须单列展示。

## 8. 交互需求

### 8.1 打开

用户点击 sidebar 底部 `Settings`：

1. 打开 setting modal。
2. 默认选中 `Account`。
3. 背景页面不可被点击。

### 8.2 切换 Tab

用户点击左侧 tab：

1. 更新 active tab 状态。
2. 更新右侧 header。
3. 更新右侧内容。
4. 不改变当前主页面 `state.page`。
5. 不关闭 modal。

### 8.3 关闭

以下行为关闭 modal：

- 点击 X。
- 点击背景遮罩。
- 按 Escape，如果当前项目已有 Escape 关闭 modal 逻辑。

关闭后：

- 回到原本 Studio 页面。
- 不跳转到 billing / topup / usage 页面。

### 8.4 表单与支付操作

Account：

- 保存账号信息行为保持当前。

Billing：

- 查看账单行为保持当前。

Top Up Credit：

- 选择套餐、发起 checkout 行为保持当前。
- loading 状态必须显示在 modal 内。
- checkout 成功或失败后的提示沿用当前 toast / notify 机制。

Usage：

- usage 数据刷新逻辑保持当前。
- 如果当前没有实时刷新，不在本次新增。

## 9. 状态管理需求

建议新增：

```js
state.settingsSection = "account";
```

支持值：

```js
"account" | "billing" | "topup" | "usage"
```

打开 settings modal 时：

- 如果没有明确指定 section，默认 `account`。

点击 nav 时：

- 只更新 `state.settingsSection`。
- 调用 `render()` 或局部 rerender。

不建议复用 `state.page` 来表示 settings 内部 tab，避免 modal 和主页面路由互相污染。

## 10. 技术实现建议

### 10.1 复用现有页面函数

当前已有页面函数应尽量复用：

- `settingsPage()`
- `billingPage()`
- `topupPage()`
- `usagePage()`

新增一个 mapping：

```js
const settingsSections = {
  account: {
    label: "Account",
    icon: "user-round",
    title: "Account",
    subtitle: t("accountSettingsSubtitle"),
    body: settingsPage()
  },
  billing: {
    label: t("billing"),
    icon: "credit-card",
    title: t("billing"),
    subtitle: t("accountBillingSubtitle"),
    body: billingPage()
  },
  topup: {
    label: t("topup"),
    icon: "wallet-cards",
    title: t("topup"),
    subtitle: t("accountTopupSubtitle"),
    body: topupPage()
  },
  usage: {
    label: t("usage"),
    icon: "activity",
    title: t("usage"),
    subtitle: t("accountUsageSubtitle"),
    body: usagePage()
  }
};
```

### 10.2 Settings Modal 改造

`settingsModal()` 负责：

- 渲染左侧 nav。
- 根据 `state.settingsSection` 渲染 active item。
- 渲染右侧 header。
- 渲染右侧 body。

### 10.3 Event Handling

保留并完善：

```js
data-settings-section="billing"
```

点击后：

```js
state.settingsSection = section;
render();
```

### 10.4 Sidebar 清理

Sidebar 中移除：

- billing nav item
- topup nav item
- usage nav item

如果代码里还有 `state.page === "billing" | "topup" | "usage"` 的页面渲染能力，可以第一阶段保留作为内部 fallback，但不再从 sidebar 暴露。

## 11. 文案需求

英文 UI 文案建议：

- Account
- Billing
- Top Up Credit
- Usage
- Current Plan
- Credit Balance
- Payment History
- Usage Activity

中文翻译保持现有 i18n：

- Account：账户
- Billing：账单
- Top Up Credit：充值 Credit
- Usage：用量

如果现有产品主要显示英文，Settings modal 内也可以保持英文，但 i18n key 需要完整保留。

## 12. 验收标准

### 12.1 功能验收

- [ ] 点击 `Settings` 打开 setting modal。
- [ ] modal 左侧显示完整导航列。
- [ ] 左侧导航包含 `Account / Billing / Top Up Credit / Usage`。
- [ ] 默认选中 `Account`。
- [ ] 点击 `Billing` 后，右侧显示原 Billing 页面内容。
- [ ] 点击 `Top Up Credit` 后，右侧显示原充值页面内容。
- [ ] 点击 `Usage` 后，右侧显示原用量页面内容。
- [ ] `Billing / Top Up Credit / Usage` 不再显示在主 sidebar。
- [ ] Top Up Credit 的支付按钮仍能触发现有流程。
- [ ] Usage list 数据与原页面一致。

### 12.2 UI 验收

- [ ] modal 覆盖所有 Studio 内容。
- [ ] 背景不可点击。
- [ ] 底部 composer 不会盖住 modal。
- [ ] modal 内部内容可滚动。
- [ ] 左侧 nav 不会因为右侧内容变化而抖动。
- [ ] desktop 下两列布局稳定。
- [ ] mobile 下无文字溢出、按钮重叠。

### 12.3 回归验收

- [ ] Account 保存功能正常。
- [ ] Billing 原有数据正常展示。
- [ ] Top Up 原有套餐和 checkout 正常。
- [ ] Usage 原有记录正常。
- [ ] 关闭 modal 后仍停留在原 Studio 页面。
- [ ] 刷新页面后不会错误进入隐藏的 billing/topup/usage 页面。

## 13. 实施顺序

### Phase 1：结构迁移

1. 新增 `state.settingsSection`。
2. 改造 `settingsModal()` 为多 section modal。
3. 左侧 nav 加入 `Account / Billing / Top Up Credit / Usage`。
4. 右侧复用现有页面函数。

### Phase 2：Sidebar 清理

1. 移除 sidebar 中 `Billing / Top Up Credit / Usage` 三个入口。
2. 确保 Settings 是账户相关功能唯一入口。
3. 检查 mobile sidebar 是否同步移除。

### Phase 3：视觉适配

1. 调整 billing/topup/usage 在 modal 内的 padding、card 宽度和 scroll。
2. 修复过宽表格或 package card。
3. 保持浅白紫色 theme。

### Phase 4：测试与回归

1. 跑 production build。
2. 本地打开 Studio 验证 modal 切换。
3. 验证 top up 操作入口。
4. 验证 usage list。
5. 推送部署后在云端复查。

## 14. 风险与处理

### 14.1 Top Up 支付流程依赖页面状态

风险：

- 当前 top up checkout 可能依赖 `state.page === "topup"`。

处理：

- 把支付逻辑从 page 状态中解耦。
- 让 checkout action 只依赖按钮 data-action 和选中的 package。

### 14.2 Billing / Usage 内容在 modal 内过高

风险：

- 账单记录或 usage list 很长，可能撑破 modal。

处理：

- 右侧内容区必须 `overflow-y: auto`。
- 表格或列表使用 modal 内 compact layout。

### 14.3 隐藏旧页面后旧链接失效

风险：

- 如果用户通过旧 URL 或历史状态进入 `billing/topup/usage`，可能看到空页面。

处理：

- 第一阶段保留内部页面渲染 fallback。
- 如果 `state.page` 是这三项，可自动打开 settings modal 并切换到对应 section。

## 15. 最终交付

最终用户体验：

用户点击 sidebar 底部 `Settings`，打开浅白紫色 setting 小窗口。左侧是一整列设置导航，包含 `Account`、`Billing`、`Top Up Credit`、`Usage`。用户可以在弹窗内完成账户资料、账单、充值、用量查看。主 sidebar 不再显示 `Billing / Top Up Credit / Usage`，Studio 导航更干净，账户能力集中在一个地方。
