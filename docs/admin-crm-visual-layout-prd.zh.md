# Admin CRM 排版与色系优化 PRD

## 1. 背景

当前 Admin CRM 页面已经具备基本运营模块：顶部 KPI、Action Queue、Users CRM、User Detail、Ops Diagnostics 等。但从截图看，页面视觉仍偏“展示型 dashboard”，而不是高频使用的后台 CRM。

主要表现：

- 首屏顶部标题过大，占用大量纵向空间。
- 浅粉背景面积过重，信息区域和背景边界不够清晰。
- KPI 卡片、Action Queue 卡片、Users/Profile 卡片都使用近似白底大圆角，层级差异弱。
- 字体大量使用粗体大写和宽字距，扫描成本高。
- Users CRM 和 User Detail 首屏下半部分被截断，真实可操作内容露出不足。

本 PRD 只聚焦第一阶段视觉和排版优化，不改业务逻辑、不新增复杂 CRM 功能。

## 2. 目标

- 让 Admin CRM 从“漂亮的大面板”变成“紧凑、清晰、可连续操作的后台工作台”。
- 首屏在 1728x1117 视口下至少完整露出 Header、Health Strip、Action Queue、Users CRM 表头和 User Detail 头部。
- 降低粉色背景强度，建立更稳定的后台色系。
- 提高信息密度，同时保留 Pokaya 的紫橙品牌识别。
- 让危险、警告、正常状态颜色更有语义，而不是所有模块都偏粉紫。

## 3. 非目标

- 不重做 Admin CRM 信息架构。
- 不新增用户管理、支付清理、诊断抽屉等功能。
- 不引入新 UI 框架或组件库。
- 不修改 admin 数据接口和权限逻辑。
- 不改变非 Admin CRM 页面视觉。

## 4. 当前问题诊断

### 4.1 Header 过高

截图中 `Pokaya Multi-User CRM` 标题占据了过多首屏高度，副标题和右侧 `Ops Diagnostics` 按钮之间也有较大空白。

问题：

- Admin 用户打开页面不是为了看品牌标题，而是为了处理异常和用户。
- H1 字号接近 landing page，不符合后台密度。
- 右侧按钮悬在中部，和标题基线不对齐。

### 4.2 背景色过甜，运营感不足

当前页面背景是大面积浅粉紫渐变。它能延续品牌，但对后台页面来说过于柔软，导致：

- 白色卡片边界弱。
- 红色/粉色警告状态不突出。
- 页面整体偏单一色相，用户难以通过颜色判断状态。

### 4.3 KPI 卡片密度不足

顶部 6 个 KPI 卡片每张都占用较大面积，但只承载一个数字和两行标签。

问题：

- `Revenue RM 0.00` 和 `Cost RM 3.69` 视觉权重接近 `Failed 53`，但实际处理优先级不同。
- KPI 卡片之间间距偏大，压缩了后续操作区。
- 所有卡片都用同样白底，缺少状态语义。

### 4.4 Action Queue 像二级卡片墙

Action Queue 是后台最重要的模块，但当前视觉上只是另一个大白卡内部再放 4 个白卡。

问题：

- 嵌套卡片感强。
- `3 ITEMS` 和标题间距过大。
- 每个 action item 的 CTA 语义不明显，只像信息卡。

### 4.5 Users CRM 和 User Detail 首屏露出不足

截图中 Users CRM 和 User Detail 进入首屏底部，但表格正文被截断。Admin 需要滚动后才能开始处理用户。

问题：

- 上方 Header + KPI + Queue 总高度过大。
- Users CRM 卡片标题字号过大。
- Toolbar 控件高度和间距偏大。
- User Detail 的标题和 email 视觉层级重复。

### 4.6 字体层级过重

大量标题使用大写、粗体、宽字距：

- `ADMIN CRM`
- `ACTION QUEUE`
- `USERS CRM`
- `USER DETAIL`
- KPI label
- action item label

后台场景需要更快扫描，过多大写会让页面显得吵。

## 5. 设计原则

### 5.1 Admin 页面优先效率

Admin CRM 是操作台，不是营销页。

设计应优先：

- 紧凑
- 可扫描
- 状态清楚
- 表格优先
- 操作路径短

### 5.2 色彩服务状态

品牌色保留在页面边界和主按钮，不应覆盖所有信息层级。

建议：

- 主背景：低饱和冷紫灰，而不是大面积粉。
- 主文字：深 plum。
- 主操作：深 plum + coral focus。
- 正常：绿色。
- 警告：琥珀。
- 危险：红/rose。
- 中性数据：紫灰。

### 5.3 卡片层级减少

避免“白卡里套白卡”的漂浮感。

建议：

- 页面 section 使用轻底色容器。
- 重复 item 使用细边框或 row，而不是每个都做大卡。
- 表格和列表优先使用行密度。

## 6. 视觉方向

### 6.1 推荐色系

保持 Pokaya Purple-Orange Mix，但降低粉色背景占比。

CSS token 建议：

```css
.studio-shell {
  --admin-bg: #f7f3f8;
  --admin-bg-tint: #fbf7fb;
  --admin-surface: rgba(255, 255, 255, 0.94);
  --admin-surface-muted: rgba(247, 243, 248, 0.88);
  --admin-border: rgba(50, 16, 58, 0.12);
  --admin-border-strong: rgba(50, 16, 58, 0.2);
  --admin-text: #210024;
  --admin-muted: rgba(50, 16, 58, 0.58);
  --admin-primary: #32103a;
  --admin-accent: #ff6738;
  --admin-danger: #c12b62;
  --admin-warning: #b7791f;
  --admin-success: #2f8f5b;
}
```

### 6.2 页面背景

当前大面积浅粉渐变改为更安静的后台底：

- 基础色：`#f7f3f8`
- 顶部可以保留非常轻的 rose tint，但透明度降低。
- 不使用强烈渐变光斑。
- Admin CRM 页面背景只作用在 admin 页，不影响 Studio 其它页面。

### 6.3 Header

Header 改成 compact admin header。

建议：

- `Admin CRM` eyebrow 保留，但字号降到 13-14px。
- H1 从当前超大字号降到 `clamp(38px, 3.6vw, 56px)` 或更紧。
- 副标题最大宽度控制在 720px。
- `Ops Diagnostics` 按钮上移，与 H1/副标题区域垂直居中。
- Header bottom margin 从当前视觉上的大间距压到 20-24px。

### 6.4 Health Strip

6 个 KPI 改成 compact metric tiles。

尺寸建议：

- 高度：72-88px。
- 圆角：10-12px。
- padding：12-14px。
- 数字字号：28-34px。
- label 使用小写或 Title Case，不再全大写宽字距。

状态语义：

- Users / Active：中性紫。
- Generations：品牌紫。
- Revenue：绿色或深紫。
- Cost：琥珀。
- Failed：rose/red，并让边框更明显。

### 6.5 Action Queue

Action Queue 要更像任务队列。

建议：

- 外层容器减少 padding，从 16px 调为 14px。
- 标题字号降到 28-34px。
- `3 ITEMS` 改成 pill 或右侧小 badge。
- 内部 4 项从大卡改成 compact action rows 或小 tiles。
- 每项增加右侧 affordance：箭头、Review、Open 等轻按钮。

视觉规则：

- danger item 左边加 3px rose 状态条。
- warning item 左边加 3px amber 状态条。
- ok item 左边加 3px green 状态条。

### 6.6 Users CRM

Users CRM 是主工作区，应比 User Detail 更宽、更像表格。

建议：

- 保持现有两栏布局，但左侧比例提高到 1.6fr，右侧 0.7fr。
- Users CRM 标题字号从大标题降到 30-36px。
- Toolbar 控件高度 40-44px。
- Search 输入宽度不要被截断，placeholder 不应裁切。
- 表格 header 行固定高度 34-38px。
- 用户 row 高度 54-62px。
- 数字列右对齐，状态列居中。

### 6.7 User Detail

User Detail 当前标题太大，占了内容空间。

建议：

- 标题改为一行：左侧 `User Detail`，右侧 email 或 status badge。
- email 主显示一次即可，不要标题和正文重复竞争。
- `ACTIVE` badge 缩小并固定尺寸。
- metrics 使用 2 列 compact mini stat。
- 最近活动、项目、失败原因用列表 row，不用大块空白。

## 7. 布局规格

### 7.1 Desktop 1728x1117

首屏目标：

- Header：不超过 180px。
- Health Strip：不超过 96px。
- Action Queue：不超过 260px。
- Users CRM / User Detail 顶部：必须完整露出，并至少看到表格 header。

### 7.2 1440x900

首屏目标：

- Header + Health Strip + Action Queue 总高度不超过 430px。
- Users CRM 至少露出 toolbar 和表头。
- 不出现横向滚动，除表格内部允许横向滚动。

### 7.3 1280x720

首屏目标：

- KPI 从 6 列改为 3x2 或横向可扫 compact grid。
- Action Queue 使用 2x2。
- Users / Detail 改为单列上下堆叠。

### 7.4 Mobile / Narrow

Admin CRM 不是主要移动工作流，但不能破版：

- Health Strip 单列或 2 列。
- Action Queue 单列。
- Users table 变为 horizontal scroll 或 stacked rows。
- User Detail 在 Users 下方。

## 8. CSS 实施建议

### 8.1 新增 admin scoped tokens

只在 `.studio-shell` 或 admin 页面容器下定义，不污染 landing/login。

建议选择：

```css
.studio-shell .admin-crm-head,
.studio-shell .admin-health-strip,
.studio-shell .admin-action-queue,
.studio-shell .admin-crm-layout {
  --admin-bg: #f7f3f8;
  --admin-surface: rgba(255, 255, 255, 0.94);
  --admin-border: rgba(50, 16, 58, 0.12);
}
```

### 8.2 减少 `!important`

当前文件底部已有 Admin CRM operator overrides，并大量使用 `!important`。执行时应尽量：

- 把新规则放在同一 admin override 区域。
- 只对历史冲突项使用 `!important`。
- 不新增重复 selector。

### 8.3 避免 DOM 大改

第一阶段优先 CSS：

- header 尺寸
- background
- card radius / padding
- grid gap
- typography
- table density

只有当 `Ops Diagnostics` 按钮或 User Detail 标题无法通过 CSS 对齐时，再少量调整 markup。

## 9. 执行优先级

### P0：首屏密度和色系

- Admin 背景降噪。
- Header 压缩。
- Health Strip 卡片高度和字号降低。
- Action Queue 高度降低。
- Users CRM / User Detail 首屏露出更多。

### P1：状态语义

- Failed / Warning / OK 使用明确状态色。
- Action Queue item 增加状态边。
- KPI 卡片按语义分色。
- Ops Diagnostics 按钮保留深 plum，但尺寸降低。

### P2：表格体验

- Users row 更紧凑。
- 表头 sticky 或更明显。
- 数字列对齐。
- User Detail metrics compact 化。

## 10. 验收标准

- 1728x1117 下，首屏完整看到 Header、Health Strip、Action Queue、Users CRM toolbar、Users table header、User Detail header。
- 1440x900 下，首屏至少看到 Users CRM toolbar 和表头。
- 页面不再呈现大面积甜粉背景；整体更像后台工作台。
- Failed / warning / ok 状态在 1 秒内能被视觉区分。
- Search placeholder 不裁切，select 文案不溢出。
- Users row、Action Queue item hover 不造成布局跳动。
- Mobile 390px 下不出现全页面横向溢出。
- 不影响 Studio 其它页面色系。

## 11. 建议执行顺序

1. 新增 scoped admin 色彩 tokens。
2. 压缩 Header 和 `Ops Diagnostics` 按钮。
3. 调整 Health Strip 尺寸、字号、状态色。
4. 调整 Action Queue 为更紧凑任务面板。
5. 调整 Users CRM / User Detail 卡片 padding、标题和 toolbar。
6. 跑 `npm run build`。
7. 用桌面和窄屏截图检查重叠、裁切、首屏露出。

