# Pokaya Agent 与 Studio 下一轮性能优化 PRD

## 1. 背景

Pokaya 已经完成多轮性能止血：

- Sidebar 点击和切页体感优化。
- 图片墙首屏加载压力降低。
- 图片墙缩略图代理接入。
- 图片墙批量渲染和视频 poster-first。
- Agent 聊天页底部输入栏稳定锁定，避免发送消息时 chatbar 被消息流顶上去。

当前剩余问题已经从“明显资源过重”进入“交互链路太粗”的阶段。也就是说，页面不是只有某一张图太大，而是很多用户动作仍然会触发过大范围的 DOM 重建、样式重算和事件绑定。

下一轮优化目标：让 Agent 发消息、Studio 图片墙滚动、页面切换三个高频场景更轻、更稳、更可观测。

## 2. 问题定义

### 2.1 Agent 发送消息仍可能有顿挫

现状风险：

- 用户输入、发送、Agent 思考、Agent 回复追加，仍可能触发较大范围 `render()`。
- 消息区虽然已经和输入栏布局隔离，但消息卡片、thinking card、工具卡片的高度变化仍可能造成线程内部跳动。
- Agent 回复流式更新时，如果每个 token 或每小段文本都导致整页重建，主线程压力会明显上升。

用户体感：

- 按 Enter 后页面迟疑。
- 自己的消息出现不够即时。
- Agent 正在思考时页面局部闪动。
- 长对话越用越沉。

### 2.2 图片墙仍未真正虚拟化

现状风险：

- 当前图片墙已经限制默认渲染数量，并使用缩略图，但可见结果继续增加后，DOM 节点仍会越来越多。
- hover 按钮、footer、菜单、预览触发器等交互层仍可能随卡片一起创建。
- 大量卡片同时存在时，滚动、hover、filter、resize 仍会触发较多样式计算和布局计算。

用户体感：

- 结果越多，滚动越沉。
- 图片墙加载更多后，页面变重。
- 切回 Studio 时有明显等待。

### 2.3 缺少线上性能观测

现状风险：

- 当前主要靠肉眼、截图和临时 Chrome 检查判断卡顿。
- 没有持续记录 CLS、INP、Long Task、Agent 发送链路耗时。
- 后续每次 UI 改动都可能重新引入闪缩或输入栏跳动。

用户体感：

- 问题复现依赖用户截图。
- 很难区分是网络慢、图片解码慢、JS 长任务，还是布局跳动。

## 3. 产品目标

### 3.1 Agent 目标

- 用户按 Enter 后，自己的消息在 100ms 内进入消息流。
- 输入栏不被消息流、thinking card、附件 tray、状态卡顶动。
- Agent 回复更新只影响消息区，不触发 sidebar、workspace 外壳、非相关页面重建。
- 长对话 50 条消息以内，输入和滚动仍保持顺滑。

### 3.2 Studio 图片墙目标

- 图片墙结果数量增长时，DOM 节点数量保持可控。
- 视口外结果不参与真实渲染和图片解码。
- hover/action UI 不提前制造大量 DOM。
- 用户滚动、加载更多、切换结果时，不出现明显卡顿或闪缩。

### 3.3 观测目标

- 能在开发环境和线上 debug 环境看到核心性能指标。
- 能定位一次卡顿属于：JS 长任务、图片解码、布局跳动、网络等待、还是 Agent 请求等待。
- 能为 Agent chatbar 稳定性建立回归检查。

## 4. 非目标

- 本期不重写整个前端框架。
- 本期不重做视觉风格。
- 本期不改 AI 生成模型速度和第三方 API 速度。
- 本期不删除已有图片墙、Agent、Admin 功能。
- 本期不以牺牲清晰反馈为代价隐藏生成过程。

## 5. 核心方案

## 5.1 P0：Agent 消息局部渲染

### 需求说明

将 Agent 消息发送和回复更新从“整页 render”改为“消息区局部 patch”。

关键要求：

- 发送消息时，立即 append 用户消息到 `.agent-thread`。
- 清空 textarea 和附件状态时，只更新 `.agent-form` 内部必要状态。
- Agent thinking card 只在 `.agent-thread` 内插入、替换、移除。
- Agent assistant 回复更新时，只 patch 对应 message article 的内容。
- sidebar、project list、workspace shell 不因单条消息更新而重建。

### 技术建议

- 建立 `renderAgentThread()`，只负责消息列表。
- 建立 `renderAgentForm()`，只负责输入栏、按钮、附件 tray。
- 保留当前全量 `render()` 作为路由切换和初始化入口。
- 对 Agent 流式文本更新做节流，例如 80-120ms 合并一次 DOM patch。
- 消息 article 使用稳定 key：`data-agent-message-id` 或 index fallback。

### 验收标准

- 发送一条消息时，`.sidebar` DOM 节点不被替换。
- 发送一条消息时，`.agent-form` 的 `getBoundingClientRect().top` 位移不超过 2px。
- 连续发送 5 条消息，输入框无明显卡字。
- 长对话下，Agent 回复追加不造成整页白闪。

## 5.2 P0：Agent thinking / tool card 稳定高度

### 需求说明

Agent 思考中、生成中、工具调用、确认卡片必须有稳定布局，避免内容逐步出现时把消息流反复撑开。

关键要求：

- thinking card 设置稳定 `min-height`。
- tool card 的 header、status、preview 区域设置固定或最小尺寸。
- 图片/视频生成 preview 在结果未返回前使用稳定 aspect-ratio 占位。
- 完成态状态卡压缩，减少大块状态 UI 对聊天流的挤压。

### 验收标准

- Agent 从 idle 到 thinking，输入栏不跳。
- thinking card 文案变化时，卡片高度不反复大幅变化。
- 生成图片结果出现时，结果卡已有稳定占位，不把上下消息明显推开。

## 5.3 P1：图片墙滚动虚拟列表

### 需求说明

将 Studio 图片墙从“批量追加 DOM”升级为“视口虚拟渲染”。

关键要求：

- 只渲染视口内和上下 buffer 范围内的卡片。
- 视口外卡片保留占位高度，不保留完整 DOM。
- 滚动时根据 scrollTop 计算可见范围。
- resize、zoom、filter、project 切换后重新计算布局。
- 虚拟列表必须保留当前 masonry / wall 视觉，不出现明显跳行。

### 技术建议

第一阶段可以采用保守虚拟化：

- 以结果卡稳定高度估算行高。
- 每次保留当前视口上下 2-3 屏 buffer。
- 对瀑布流难以精确虚拟化的部分，先按 column 分组计算每列可见卡片。
- 卡片进入可见区时再挂载 img/video poster。

### 验收标准

- 200 个结果时，实际 DOM 中 `.studio-wall-card` 不超过 80 个。
- 滚动到中间和底部时，不出现大面积空白。
- 快速滚动时，主线程 long task 明显减少。
- 图片墙加载更多后，页面不会持续变重。

## 5.4 P1：图片墙 hover/action 延迟挂载

### 需求说明

图片墙每张卡片上的 action buttons、footer 菜单、secondary controls 不需要首屏全部创建。

关键要求：

- 默认只渲染图片/视频预览、标题/必要 metadata。
- hover、focus、tap 或 keyboard focus 时才挂载操作按钮。
- 移动端首次 tap 显示操作层，第二次 tap 执行动作或打开详情。
- 操作层移出视口后释放。

### 验收标准

- 初始图片墙 DOM 节点数量下降。
- hover 单张卡片时只影响该卡片，不触发整墙 repaint。
- 移动端仍能正常下载、预览、编辑、删除。

## 5.5 P1：路由级代码拆包

### 需求说明

当前主入口承载过多页面逻辑。下一轮需要把高成本页面按路由拆开，降低首页和 Agent 首次进入压力。

优先拆分：

- Agent 页面逻辑。
- Admin CRM。
- Studio 图片墙 / 生成器。
- 3D Agent 资源。

### 技术建议

- 使用动态 import。
- 首屏只加载当前页面必需模块。
- 3D Agent 只在可见且用户未开启低性能模式时加载。
- 非当前页面的事件绑定和 DOM 查询不执行。

### 验收标准

- 首页初始 JS 体积下降。
- 进入 Agent 不加载图片墙重逻辑。
- 进入图片墙不初始化 Agent 3D。

## 5.6 P2：性能可观测与回归测试

### 需求说明

加入轻量性能监控，避免之后继续靠截图猜原因。

关键指标：

- CLS。
- INP。
- Long Task > 50ms。
- Agent send click 到 user message paint 的耗时。
- Agent send click 到 assistant thinking paint 的耗时。
- 图片墙首批缩略图加载耗时。
- 图片墙当前真实 DOM card 数。

### 技术建议

- 开发环境默认 console 输出。
- 线上只在 admin/debug 模式输出。
- 可以先不接第三方监控，先写内部 `performance.mark()` / `PerformanceObserver`。

### 验收标准

- Admin/debug 下能看到最近 20 条性能事件。
- Agent 发送消息能输出 send-to-paint 时间。
- 图片墙能输出 card DOM count 和 visible count。
- 发生 layout shift 时能看到来源元素候选。

## 6. 优先级排序

| 优先级 | 模块 | 任务 | 影响 |
| --- | --- | --- | --- |
| P0 | Agent | 消息局部渲染 | 直接降低发送卡顿和整页闪动 |
| P0 | Agent | thinking/tool card 稳定高度 | 直接降低 chatbar 和消息流跳动 |
| P1 | Studio | 图片墙虚拟列表 | 解决结果多后越来越卡 |
| P1 | Studio | hover/action 延迟挂载 | 降低初始 DOM 和 repaint |
| P1 | 全站 | 路由级拆包 | 降低首屏 JS 成本 |
| P2 | 全站 | 性能指标与回归测试 | 防止问题反复出现 |

## 7. 分阶段执行计划

### Phase 1：Agent 发送稳定性

交付：

- `renderAgentThread()`。
- `renderAgentForm()`。
- Agent 发送 optimistic UI。
- thinking card 和 tool card 稳定高度。
- Agent chatbar 位移测试。

建议工期：1-2 天。

### Phase 2：图片墙虚拟化

交付：

- 可见范围计算。
- 卡片占位层。
- 视口 buffer 渲染。
- 快速滚动防空白处理。
- 图片墙 DOM 数量监控。

建议工期：2-4 天。

### Phase 3：交互层延迟挂载与拆包

交付：

- 图片墙 action layer 延迟挂载。
- Agent/Admin/Studio 模块动态 import。
- 3D Agent 按需加载和不可见暂停。

建议工期：2-5 天。

### Phase 4：性能观测

交付：

- `performance.mark()` 关键路径。
- Long Task / CLS observer。
- Admin/debug 性能面板。
- 关键交互回归检查脚本。

建议工期：1-2 天。

## 8. 风险与对策

| 风险 | 表现 | 对策 |
| --- | --- | --- |
| 局部渲染和全局 state 不一致 | Agent 消息重复或状态丢失 | 保留单一 state，局部 render 只读 state 输出 |
| 虚拟列表破坏瀑布流 | 快速滚动空白或跳位 | 先做 buffer 大一些的保守虚拟化 |
| hover 延迟挂载影响移动端操作 | 用户点不到按钮 | 移动端使用 tap-to-reveal |
| 拆包导致初始化顺序问题 | 页面进入后功能未绑定 | 每个模块提供明确 mount/unmount |
| 性能监控本身增加负担 | debug 代码拖慢页面 | 仅 debug/admin 开启详细记录 |

## 9. 验收清单

### Agent

- 发送消息后，自己的消息 100ms 内显示。
- 输入栏位置稳定，位移不超过 2px。
- thinking 状态出现和消失不导致整页跳动。
- 50 条消息以内输入不卡。
- Agent 回复更新不替换 sidebar DOM。

### 图片墙

- 200 个结果时真实卡片 DOM 不超过 80 个。
- 快速滚动无大面积空白。
- 缩略图仍走 thumb proxy，不回退到原图墙面加载。
- hover/action 不造成整墙 repaint。

### 全站

- 页面切换有即时点击反馈。
- CLS 保持 < 0.1。
- INP 目标 < 200ms，重页面不超过 300ms。
- Performance debug 能记录关键事件。

## 10. 推荐下一步

建议先执行 Phase 1：Agent 消息局部渲染 + thinking/tool card 稳定高度。

原因：

- 用户已经明确反馈 Agent 页面发消息会闪缩、chatbar 往上跳。
- 当前 CSS 已经锁住布局，但 JS 渲染链路还可以继续瘦身。
- Phase 1 范围可控，不需要先重构整个项目。
- 做完后能明显改善最刺眼的聊天体验问题。

