# Pokaya 全站交互闪缩治理 PRD

## 1. 背景

Pokaya Studio 经过多轮 UI 优化后，核心页面已经具备完整功能，但用户在实际使用中仍多次遇到“点一下按钮，画面闪一下、缩一下、跳一下”的问题。这个问题不是单个按钮样式错误，而是全站交互稳定性缺少统一约束。

典型场景包括：

- Image 页面生成中切换模型，底部 bar 或图片墙出现闪缩。
- Audio 页面切换 tab、点击底部控制条时，画面短暂卡住或控件不可点。
- Content Library 图片刷新时，占位卡和真实图片替换导致布局跳动。
- 顶部 tab、sidebar、模型菜单、比例菜单、生成按钮、保存按钮等高频控件，在 hover、open、loading、disabled、selected 状态之间切换时尺寸不一致。
- 生成中、失败、取消、重试等状态卡出现时，页面重新计算过大范围布局。

本 PRD 的目标是建立一套全站“交互不闪缩”产品与工程标准，后续所有 Studio 页面、按钮、菜单、卡片、composer、media wall 都必须遵守。

## 2. 问题定义

### 2.1 什么是“闪缩”

本 PRD 中的“闪缩”包括以下任一现象：

- 点击按钮后，页面主体向上、向下、向左、向右位移。
- 底部 composer / bar 高度突然变高或变矮。
- 卡片、图片墙、sidebar、顶部 tab 在状态切换时抖动。
- 菜单打开时挤压周围内容，而不是浮层覆盖。
- loading / failed / result 替换时，卡片比例或高度突变。
- 文字、图标、按钮在点击后短暂重排或换行。
- 整页 render 导致局部白闪、暗闪、背景闪现。
- 生成中页面因为状态更新反复触发布局动画。

### 2.2 根因分类

当前闪缩主要来自 6 类问题：

1. 状态切换时尺寸不稳定  
   同一个组件的 idle、hover、open、loading、disabled、selected 状态使用了不同 height、padding、border、gap 或 font-weight。

2. 浮层参与文档流  
   菜单、popover、dropdown 打开后撑开父容器，导致整个 bar 或 wall relayout。

3. 生成状态触发全量 render  
   单个 job 的 pending / failed / completed 变化引发整页 DOM 重建，造成可见区域短暂跳动。

4. 媒体资源无稳定占位  
   图片、视频、音频预览加载前没有固定 aspect-ratio，占位和真实结果尺寸不一致。

5. CSS transition 范围过大  
   对 `all`、width、height、top、left、grid-template、box-shadow、filter 等属性做过度动画，点击时触发布局和重绘。

6. 滚动容器和 sticky/fixed 元素边界不清  
   页面、workspace、media wall、composer 同时抢 scroll 或定位上下文，导致切页和点击时视口重新锚定。

## 3. 产品目标

### 3.1 全站体验目标

- 用户点击任何按钮、tab、菜单、切换控件时，页面主体不出现可感知闪缩。
- 生成中状态下，用户仍可切换模型、比例、分辨率、菜单，不造成 media wall 或 composer 跳动。
- 图片、视频、音频、文本结果从 pending 到 completed 的替换过程保持卡片尺寸稳定。
- 页面切换时，顶部 tab、sidebar、底部 bar 的位置和尺寸保持连续。
- Content Library、Image、Video、Audio、Original Video、Clone Prompt、Storytelling 页面遵守同一套布局稳定规则。

### 3.2 指标目标

- 关键交互 CLS 单次增量：`<= 0.01`
- 页面整体 CLS：`<= 0.05`
- 高频按钮点击后 300ms 内，主要容器位移：`<= 2px`
- 底部 composer / bar 点击前后高度差：`<= 1px`
- 菜单打开/关闭时，media wall 首屏卡片位置差：`<= 2px`
- 生成状态更新不触发超过 `100ms` 的 long task。

## 4. 非目标

- 不重写整个前端框架。
- 不迁移到新的 UI kit、动画库、路由架构。
- 不重新设计品牌视觉。
- 不改变模型调用、扣费、生成队列和后端业务逻辑。
- 不为了“绝对不动”而取消必要反馈；按钮仍需有清楚的 pressed、loading、disabled 状态。

## 5. 适用范围

本 PRD 覆盖所有登录后 Studio / backend 工作台页面：

- Sidebar 与折叠状态。
- 顶部 Studio tabs。
- Image / Video / Audio / Original Video / Clone Prompt / Storytelling 页面。
- Content Library。
- Admin CRM。
- Affiliate / SOP / Auto Post TikTok 等业务页面。
- Settings、Billing、Top-up、modal、popover、dropdown。
- 图片墙、视频墙、结果卡、pending 卡、failed 卡。
- 所有生成 composer、底部 bar、模型选择器、比例选择器、语言选择器、按钮组。

## 6. 核心原则

### 6.1 状态不能改变组件外框

同一个组件在以下状态中必须保持外框尺寸一致：

- default
- hover
- focus
- active
- selected
- open
- loading
- disabled
- failed

允许变化：

- background
- color
- opacity
- transform: translateY 不超过 1px
- icon opacity
- inner indicator

不允许变化：

- height
- min-height
- width
- padding
- border-width
- gap
- grid-template-columns
- margin
- font-size
- line-height

### 6.2 菜单必须浮层化

所有 dropdown、popover、model menu、ratio menu、language menu 必须：

- 使用 absolute / fixed / portal 式定位。
- 不参与父容器高度计算。
- 不改变 composer、card、toolbar、sidebar 的尺寸。
- 打开时只提升 z-index，不撑开布局。
- 关闭时不触发父容器 transition。

### 6.3 生成中页面要锁布局

当存在生成中任务时：

- composer / bottom bar 进入稳定模式。
- 点击模型、比例、分辨率、增强、batch count 不允许改变 bar 外框尺寸。
- pending card、failed card、completed card 使用同一 aspect-ratio 容器。
- media wall 不因 job 状态变化重排首屏。

### 6.4 媒体必须先占位再加载

所有图片、视频、音频视觉卡片必须：

- 有固定 `aspect-ratio` 或稳定高度。
- pending、loading、failed、empty、loaded 状态共享相同外框。
- 图片使用缩略图、lazy loading、decoding async。
- 视频默认 poster-first，不自动加载完整视频。

### 6.5 动画只做合成层属性

推荐动画属性：

- opacity
- transform
- color / background-color

谨慎使用：

- box-shadow
- filter
- backdrop-filter

禁止用于高频点击状态：

- transition: all
- width / height
- top / left / right / bottom
- margin / padding
- grid-template
- font-size

## 7. 功能需求

### 7.1 P0：建立全站交互稳定 CSS 基线

新增或整理一组 Studio 级稳定规则：

- `.studio-shell` 下统一 box sizing。
- 所有 icon button 设置固定宽高。
- 所有 segmented control 设置固定高度。
- 所有 top tab 设置固定高度、固定 grid。
- 所有 composer / bottom bar 设置稳定 height、min-height、max-height。
- 所有 menu open 状态不改变父级尺寸。
- 所有 loading button 使用内部 spinner，不替换按钮文字造成宽度变化。

验收标准：

- Top tabs 点击切换时高度不变。
- Sidebar nav 点击后图标按钮不跳。
- 所有 primary / secondary button 进入 loading 后宽度不变。
- Dropdown 打开时父容器高度不变。

### 7.2 P0：按钮状态锁定规范

所有按钮组件必须遵守：

- `border-width` 在所有状态一致。
- 文案长度变化时，按钮有固定 min-width 或稳定内容区。
- loading spinner 以 absolute 或 inline reserved slot 呈现。
- disabled 不改变尺寸，只改变 opacity / color。
- selected 不增加外部 border，可用 inset shadow 或 outline offset。

验收标准：

- 点击 `Generate Media` 后按钮不变宽、不变高。
- 点击 `Retry`、`Edit`、`Save to Library` 后所在卡片不跳动。
- 模型切换按钮打开菜单时，bottom bar 不扩张。

### 7.3 P0：Composer / Bottom Bar 稳定合同

每个生成页面的底部 bar 必须有明确 layout contract：

- Image bar：固定 collapsed / expanded 两种高度，状态切换只在用户明确 hover 或 focus 且非 generating 时发生。
- Audio bar：外部模式 selector 与主 bar 分离，不互相包裹，不互相撑开。
- Video bar：与 Image bar 使用相同稳定尺寸系统。
- Original Video / Clone Prompt / Storytelling：复用同一 bar contract。

生成中状态下：

- 不允许 hover 自动扩展。
- 不允许菜单 open 改变 bar 高度。
- 不允许 prompt 文案变化改变整条 bar 高度，长文本在内部滚动。

验收标准：

- generating 时点击模型菜单，bar 高度差 `<= 1px`。
- generating 时切换比例、分辨率、数量，media wall 首屏不跳。
- prompt 超过多行时，只在 textarea 内滚动，不撑开整页。

### 7.4 P0：Media Wall 卡片稳定合同

所有 media wall 卡片必须：

- 使用稳定 `aspect-ratio`。
- pending / failed / completed / cancelled 状态同尺寸。
- action overlay 不参与卡片高度。
- footer 高度固定或最多两行截断。
- 图片加载完成只替换内部 media，不改变卡片外框。

验收标准：

- 图片从 pending 到 completed，卡片顶点位移 `<= 2px`。
- Failed 卡展示 Retry/Edit/No Charge 不改变原卡片尺寸。
- Content Library 图片刷新时，占位卡和真实图片尺寸一致。

### 7.5 P1：局部 render 与 DOM patch

高频交互不能默认调用整页 `render()`：

- 模型切换：只 patch 当前 composer 的模型文案、可选比例、credit。
- pending job 更新：只 patch 对应 job card。
- 生成结果完成：只插入/替换对应 card，不重建整个 wall。
- modal open：只挂载 modal，不重建 workspace。
- sidebar active：只切换 active class，不重建页面主体。

验收标准：

- 模型切换时 `.studio-result-wall` DOM 节点不被整体替换。
- Sidebar 点击 active 状态时，当前页面主体不重新 mount。
- 单个 job 状态更新时，只影响对应 `data-job-id` 或 `data-result-id` 节点。

### 7.6 P1：图片与资源加载稳定化

需要统一处理：

- Content Library 缩略图 lazy load。
- Image / Video result wall 使用 thumbnail URL。
- 大图预览只在 lightbox 或 detail view 加载。
- 所有图片标签设置 width / height 或 aspect-ratio。
- 加载失败显示同尺寸 fallback。

验收标准：

- Content Library 首屏加载不会出现白色大块闪动。
- 滚动图片墙时不因为图片解码造成明显卡顿。
- 图片失败时 fallback 不改变 grid 布局。

### 7.7 P1：页面切换稳定化

Tab 切换与 sidebar 切换必须：

- 保持 shell、sidebar、top tabs 不重建。
- 目标页面有稳定 min-height。
- 页面背景不先显示空白再显示内容。
- heavy page 可使用 skeleton，但 skeleton 必须与最终布局同尺寸。

验收标准：

- Image 切到 Audio，不出现整体缩放或顶部跳动。
- Audio 切回 Image，bottom bar 不先消失再出现。
- 页面切换时背景色、grid、hero 不白闪。

### 7.8 P2：自动化闪缩检测

新增开发态检测脚本：

- 记录关键容器点击前后 bounding rect。
- 覆盖 top tabs、sidebar、model picker、ratio picker、generate、retry、edit、save。
- 计算位移、尺寸差、CLS。
- 超过阈值时输出具体 selector。

建议检测容器：

- `.studio-shell`
- `.studio-sidebar`
- `.studio-higgsfield-tabs`
- `.studio-result-wall`
- `.image-generate-console`
- `.video-generate-console`
- `.audio-workbench`
- `.asset-grid`
- `.modal-shell`

验收标准：

- 本地一条命令可跑核心交互闪缩检查。
- 每个失败项输出：点击目标、位移元素、dx、dy、height delta、width delta。
- CI 或部署前至少能跑桌面 viewport 的 smoke test。

## 8. 设计规范

### 8.1 尺寸 token

建议建立或复用以下 token：

- `--studio-top-tab-height`
- `--studio-sidebar-width`
- `--studio-icon-button-size`
- `--studio-control-height`
- `--studio-composer-height`
- `--studio-composer-expanded-height`
- `--studio-card-radius`
- `--studio-menu-z`
- `--studio-modal-z`

### 8.2 状态 class

统一状态命名：

- `.is-loading`
- `.is-generating`
- `.is-open`
- `.is-selected`
- `.is-disabled`
- `.is-pending`
- `.is-failed`
- `.is-completed`
- `.has-open-menu`
- `.has-long-prompt`
- `.is-layout-locked`

### 8.3 推荐组件结构

按钮：

```html
<button class="studio-button is-loading">
  <span class="studio-button-icon"></span>
  <span class="studio-button-label">Generate</span>
  <span class="studio-button-spinner" aria-hidden="true"></span>
</button>
```

菜单：

```html
<div class="studio-menu-anchor">
  <button class="studio-menu-trigger"></button>
  <div class="studio-menu-popover"></div>
</div>
```

卡片：

```html
<article class="studio-wall-card is-pending">
  <div class="studio-card-media"></div>
  <div class="studio-card-overlay"></div>
  <footer class="studio-card-footer"></footer>
</article>
```

## 9. 技术实施建议

### 9.1 第一阶段：止血

- 扫描全站 `transition: all`，替换为明确属性。
- 扫描按钮 hover / selected / loading 状态中的 height、padding、border 变化。
- 将所有 dropdown 改成不撑开父容器。
- 为 Image / Audio / Video bottom bar 增加 generating layout lock。
- 为 Content Library tile 增加稳定 aspect-ratio。

### 9.2 第二阶段：结构治理

- 抽出通用 button / menu / segmented control 稳定 class。
- 抽出 composer layout contract。
- 统一 result card 状态结构。
- 高频状态更新改为局部 patch。

### 9.3 第三阶段：自动化回归

- 增加 Playwright 闪缩 smoke test。
- 增加 CLS / long task dev overlay。
- 每次 UI PR 至少覆盖一个桌面 viewport 和一个窄屏 viewport。

## 10. 验收清单

### 10.1 Image 页面

- generating 时点击模型按钮不闪缩。
- generating 时切换比例不闪缩。
- generating 时点击数量 stepper 不闪缩。
- pending / failed / completed 卡片替换不跳。
- Generate Media loading 状态按钮尺寸不变。

### 10.2 Audio 页面

- 进入 Audio 页面不出现整体闪缩。
- 底部模式 selector 可点击，不被主 bar 覆盖。
- Voiceover / Change Voice / Translate 切换不改变整体 bar 高度。
- Generate Audio disabled / loading / enabled 状态尺寸一致。

### 10.3 Content Library

- 图片刷新时 tile 尺寸稳定。
- 空占位到真实图片不跳。
- 多图加载时不阻塞 sidebar 和 top tabs 点击。

### 10.4 全站导航

- Sidebar 点击页面切换，sidebar 自身不跳。
- Top tabs active 状态不改变 tab 高度。
- Modal 打开关闭不改变背景布局。
- Dropdown 打开关闭不改变父级 toolbar 尺寸。

## 11. 风险与注意事项

- 不要用 `overflow: hidden` 粗暴遮掉菜单，避免造成按钮不可点。
- 不要用过多 `!important` 堆叠全站规则，优先在 Studio scope 内建立稳定 class。
- 不要把所有元素都 `position: fixed`，否则会制造新的 z-index 和滚动问题。
- 不要隐藏 loading 反馈；稳定不等于无反馈。
- 动画必须轻，不要在 media wall 上使用大面积 blur/filter。
- 任何修复都要确认移动端不会出现文字裁切或控件重叠。

## 12. 建议执行顺序

1. 建立全站闪缩检测清单，列出所有高频按钮和菜单。
2. 先修 P0：button 状态、dropdown 浮层、composer generating lock、media card aspect-ratio。
3. 再修 P1：局部 render、Content Library 缩略图加载、页面切换 skeleton。
4. 最后补 P2：Playwright 自动化闪缩检测和性能观测。
5. 每修一个页面，都用同一套验收脚本检查 Image、Audio、Content Library、top tabs、sidebar。

## 13. 完成定义

当以下条件全部满足时，认为“全站闪缩治理”完成：

- 用户在核心页面连续点击 20 次高频按钮，不出现肉眼可见闪缩。
- Image generating 中切换模型、比例、数量，bottom bar 和 media wall 不跳。
- Audio 页面进入、切换模式、点击底部控制，控件可点击且页面不缩放。
- Content Library 刷新图片时，tile 只做内部内容替换，不改变 grid。
- Playwright 闪缩检测通过桌面和窄屏两个 viewport。
- `npm run build` 通过。
- 新增 UI 改动必须遵守本 PRD 的布局稳定规则。

## 14. P0 执行范围

P0 先执行稳定性止血，重点覆盖最容易被用户感知的点击闪缩场景：

- 新增 Studio scoped 交互稳定 CSS 基线，约束按钮、summary、菜单、卡片、composer、media wall 的点击/打开/disabled/selected 状态。
- Image 生成中状态补齐 hover、focus、数量 stepper、比例浮层、模型菜单的 layout lock，避免生成中误触发底部 bar 展开。
- Video 生成中状态补齐 `is-generating` class、菜单打开锁、模型切换锁，复用 Image 的稳定合同。
- Audio 底部 composer、模式 dial、preset menu、generate button 增加尺寸与浮层稳定规则，避免打开 preset 或切换模式时撑开 bar。
- Content Library tile / preview / media 元素增加固定比例和内部替换约束，减少图片刷新时 grid 跳动。

P0 暂不做以下内容：

- 不重构全站 render 架构。
- 不实现完整 media wall 虚拟列表。
- 不新增 Playwright 自动化闪缩检测脚本。
- 不改后端生成队列与模型业务逻辑。

## 15. P1/P2 追加执行范围

本次追加执行 P1/P2 中最直接影响用户反馈的部分：

- P1：Audio 底部模式切换从整页 `render()` 改成局部 DOM patch，只替换 prompt 区和 preset 区，避免 Voiceover / Change Voice / Translate 点击时整屏闪缩。
- P1：Audio 局部 patch 后重新绑定新插入控件，并刷新图标，保证按钮可点、样式不丢、交互不被旧 DOM 覆盖。
- P2：新增 `npm run check:interaction-flicker`，用真实浏览器覆盖 Image 模型菜单、Video 模型菜单、Audio preset 菜单、Audio 模式切换的尺寸漂移检测。
- P2：检测阈值默认控制在 1px 内，任何按钮点击导致 composer / main bar 位移或尺寸变化都会失败。

本次仍不做以下中大型改造：

- 不实现完整 media wall 虚拟列表。
- 不重构全站状态管理。
- 不改变后端生成队列、模型业务逻辑或计费逻辑。
