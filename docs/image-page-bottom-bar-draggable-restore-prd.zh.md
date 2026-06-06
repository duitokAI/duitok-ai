# Image Page 底部 Bar 可拖动状态恢复 PRD

## 1. 背景

Image Page 近期为了处理背景、结果墙、顶部 tabs、底部 composer、Audio/Clone Prompt 页面复用样式，做过多轮布局调整。现在用户反馈最核心的问题是：Image Page 底部 bar 没有回到之前的工作方式，表现为 bar 像被固定在底部，无法像以前一样随页面状态拖动/展开，且和缩放、sidebar 断层问题同时出现。

从当前线上检查结果看，底部 `.image-generate-console` 的 CSS 计算值不一定是 `fixed` 或 `sticky`，但用户感知仍然是“被固定住、拖不动”。这说明问题不能只按 `position` 单点判断，而要按完整交互链路排查：

- bar 在文档流里的位置是否正确。
- 结果墙缩放后，bar 是否仍参与同一个滚动/缩放上下文。
- compact 状态是否还能通过鼠标 hover、拖动、点击、焦点进入展开。
- 页面滚动容器是否被错误转移到 `html/body`、`.workspace` 或 `.image-higgsfield-mode` 之外。
- sidebar 是否因为主内容高度/滚动方式变化出现视觉断层。

本 PRD 目标是把 Image Page 底部 bar 恢复到之前的稳定工作逻辑：不是固定在 viewport 底部，而是作为 Image Page 内容的一部分，可以随页面滚动、可被用户拖动/唤起、不会破坏缩放和 sidebar 连续背景。

## 2. 问题定义

### 2.1 用户可见问题

当前用户感受到的问题有三类：

1. 底部 bar 不能像之前一样拖动/唤起。
2. Image Page 的缩放功能异常，缩放后结果墙和 bar 的空间关系不对。
3. sidebar 出现断层，说明主页面滚动/高度/背景层级被改坏。

这三个问题高度相关，不能拆成三个彼此无关的小 CSS 补丁处理。

### 2.2 需要恢复的旧行为

旧行为应定义为：

- Image Page 有结果墙时，底部 bar 作为结果墙后的 composer 区块存在于页面内容流中。
- 用户滚动结果墙时，bar 不应一直钉在 viewport 底部。
- 用户滚动到 bar 附近时，可以对 bar 进行拖动、hover、点击或聚焦，bar 能从 compact 状态展开。
- 用户缩放结果墙时，bar 不应脱离结果墙布局，也不应遮挡或锁死缩放控制。
- sidebar 背景应从顶部到底部连续，不因为 Image Page 内容高度变化露出断层。

### 2.3 非目标

本 PRD 不处理以下内容：

- 不重新设计 Image Page 的视觉风格。
- 不调整模型、比例、质量、数量等参数样式。
- 不调整生成 API、扣费、失败重试逻辑。
- 不引入新框架或新的拖拽库。
- 不修改 Audio、Video、Clone Prompt 的业务能力，除非它们共用的布局规则直接污染 Image Page。

## 3. 根因假设

### 3.1 “看起来不是 fixed，但行为像 fixed”

当前线上 computed style 可能显示 `.image-generate-console` 是 `position: relative`，但如果父级 grid、scroll container、height、overflow 或 `align-content` 被改动，bar 仍可能在视觉上像贴底固定。

典型风险：

- `.image-higgsfield-mode` 被设置成固定高度或错误的 grid rows。
- `html/body` 成为实际滚动容器，而 Image Page 自身不滚动。
- composer 被放进最后一行 grid，但中间结果墙高度被撑到 viewport 剩余空间，导致它始终靠近底部。
- compact 状态高度太小，用户以为拖不动或唤不起。

### 3.2 缩放上下文被破坏

Image Page 结果墙应该有自己的 zoom state 和 zoom control。若近期为了修复顶部/底部定位加入了 `overflow: hidden`、`height: 100vh`、`min-height: 100dvh`、`position: sticky`、`grid-template-rows` 等强约束，可能导致：

- zoom control 的位置被锁死。
- 结果墙缩放后内容高度没有重新参与页面流计算。
- composer 位置没有跟随缩放后的 wall 高度。
- 鼠标拖动或滚轮事件被错误容器拦截。

### 3.3 事件绑定只覆盖 hover，不覆盖真实拖动入口

当前 Image composer compact 逻辑主要依赖：

- `mouseenter`
- `mousemove`
- `pointerenter`
- `pointermove`
- `focusin`
- `scroll`

如果旧版本允许通过拖动 bar 区域唤起或调整，现在只靠 hover 就会不够。尤其在 compact 状态很窄时，用户可能需要从底部 bar 边缘拖动，当前代码没有明确的 pointer down / drag start 恢复逻辑。

### 3.4 页面级 CSS 规则污染多个 Studio 页面

近期 Image、Video、Audio、Clone Prompt 都使用类似的 Studio shell 和 top tabs。若某些规则使用了过宽选择器，例如：

```css
.studio-shell .workspace:has(.step-tabs)
.studio-shell .canvas-card
.studio-shell .studio-workbench-card
html:has(.studio-shell ...)
body:has(.studio-shell ...)
```

就可能同时造成：

- Image Page 整体往下跌。
- sidebar 背景断层。
- bottom bar 变成视觉贴底。
- Audio/Clone Prompt 页面继承不该继承的滚动规则。

## 4. 产品目标

### 4.1 核心目标

恢复 Image Page 底部 bar 的旧工作逻辑：

- bar 不固定在 viewport。
- bar 参与 Image Page 内容流。
- bar 可被用户拖动/唤起/展开。
- 缩放功能正常。
- sidebar 不出现断层。

### 4.2 用户体验目标

- 用户可以像之前一样操作底部 bar，不需要学习新的交互。
- 结果墙滚动、缩放、bar 展开三个动作互不打架。
- 页面顶部 tabs、sidebar、结果墙、bottom bar 的视觉层级稳定。
- 空状态和有结果状态都自然，不出现“强行贴底”的感觉。

### 4.3 技术目标

- 找出导致回归的具体 CSS/JS 改动点，而不是继续叠加补丁。
- Image Page 的滚动容器必须明确。
- Image composer 的 compact/expanded 状态必须有明确触发条件。
- 缩放控制和 composer 不能共享会互相污染的定位规则。
- 所有修复必须 scoped 到 Image Page 或明确的 Studio 共用规则。

## 5. 交互规格

### 5.1 空状态

空状态时，Image Page 可以把 bar 放在首屏下方偏底的位置，但它仍然应是页面内容流的一部分。

要求：

- 页面没有结果时，bar 可以视觉靠近底部。
- 不允许使用 viewport fixed 的方式硬贴底。
- 切到其他 page 后不影响 sidebar 高度。
- 输入 prompt、打开参数菜单、点击按钮时，bar 不应跳动。

### 5.2 有结果状态

有结果时，结果墙是主内容，bar 应位于结果墙内容之后。

要求：

- 用户滚动结果墙时，bar 不一直悬浮在当前 viewport 底部。
- 用户滚动到底部或接近底部时能看到 bar。
- bar 展开后不覆盖已有结果卡片的主要操作区域。
- compact bar 不应被页面底部裁切。

### 5.3 可拖动/唤起行为

需要恢复的“可拖动”可拆成两个层级。

第一层：唤起展开。

- 鼠标 hover 到 compact bar 上，bar 展开。
- 鼠标点击 compact bar，bar 展开。
- 鼠标 pointer down 在 bar 上，bar 展开并保持一段时间。
- 输入框 focus 后，bar 展开。
- 打开模型/比例/质量菜单时，bar 保持展开。

第二层：拖动兼容。

- 如果旧版本支持拖动 bar 或拖动边缘来操作，当前版本需要恢复同等行为。
- pointer down 后不能因为 scroll sync 立即把 bar 压回 compact。
- 拖动过程中不得触发页面错误滚动锁。
- 拖动结束后，根据用户是否继续操作决定保持展开或回到 compact。

### 5.4 缩放兼容

Image wall 缩放时：

- zoom slider 可以正常拖动。
- zoom 后结果墙高度重新计算。
- bar 位置跟随结果墙内容，不钉在 viewport。
- 缩放不会让 sidebar 出现断层。
- 缩放不会让 top tabs 和结果墙之间出现异常空隙。

## 6. 技术方案

### 6.1 先做回归审计

执行前必须对以下文件做 diff 审计：

- `src/styles.css`
- `src/main.js`

重点搜索：

- `.image-generate-console`
- `.image-higgsfield-mode`
- `.studio-wall-zoomable`
- `.studio-wall-zoom-control`
- `.studio-result-wall`
- `.workspace:has(.image-higgsfield-mode)`
- `.canvas-card:has(.image-higgsfield-mode)`
- `.project-step-topbar`
- `bindImageConsoleCompact`
- `studioWallZoomStyleAttr`

需要列出最近导致行为变化的改动类型：

- 新增或修改 `position: sticky/fixed/relative`
- 新增或修改 `bottom`
- 新增或修改 `height/min-height`
- 新增或修改 `overflow`
- 新增或修改 `grid-template-rows`
- 新增或修改 `align-content/align-self`
- 新增或修改 scroll target
- 新增或修改 pointer/hover/drag 事件

### 6.2 恢复明确的布局所有权

建议 Image Page 采用以下所有权：

```text
workspace / studio shell
  负责全页背景和 sidebar 连续性

image-higgsfield-mode
  负责 Image Page 内部 grid：topbar / result wall / composer

studio-result-wall
  负责结果墙内容和 zoom

image-generate-console
  负责 composer 自身展开、compact、参数菜单
```

关键原则：

- 不让 composer 负责撑起整页高度。
- 不让 result wall 负责控制 composer fixed/sticky。
- 不让 top tabs 的 sticky 规则影响 composer。
- 不让 `html/body` 的 page height 补丁决定 Image Page 内部布局。

### 6.3 修正滚动容器

Image Page 应明确实际滚动容器。

推荐目标：

- 页面滚动使用 document/window 或统一的 `.workspace`，二选一，不要多个容器同时 competing。
- `.image-higgsfield-mode` 不应同时出现 `overflow-y: auto` 但实际不滚动的状态。
- 如果 `.image-higgsfield-mode` 是 grid 内容容器，应该让其高度由内容自然撑开。

建议检查：

```js
window.scrollY
document.documentElement.scrollTop
document.body.scrollTop
document.querySelector(".workspace")?.scrollTop
document.querySelector(".image-higgsfield-mode")?.scrollTop
```

验收时只能有一个主要滚动源承担页面滚动。

### 6.4 恢复 composer 参与内容流

`.image-generate-console` 在 Image Page 有结果状态下应满足：

```css
position: relative;
bottom: auto;
grid-row: auto 或明确最后一行;
align-self: auto;
```

同时避免以下规则：

```css
position: fixed;
position: sticky;
bottom: 0;
inset-inline: ... 配合 fixed/sticky;
transform: translateY(...) 模拟贴底;
margin-top: auto 强行推到底;
align-self: end 强行贴底;
```

如果空状态需要靠底视觉，应只在 `.image-higgsfield-mode.is-empty` 中通过 grid 分配空间实现，不污染 `.has-results`。

### 6.5 补齐 pointer down / drag start 展开逻辑

在 `bindImageConsoleCompact()` 中增加或恢复明确的 pointer interaction：

```js
const expandForPointerDown = () => {
  hovering = true;
  imageConsoleExpandedUntilUserScroll = true;
  imageConsoleExpandLockUntil = Date.now() + 900;
  consoleEl.classList.add("is-hover-expanded");
  if (!state.generating && !consoleEl.classList.contains("is-generating")) {
    consoleEl.classList.remove("is-compact");
  }
};
```

绑定：

```js
consoleEl.addEventListener("pointerdown", expandForPointerDown);
consoleEl.addEventListener("mousedown", expandForPointerDown);
```

注意：

- 不能阻止输入框、菜单、按钮本身的点击。
- 不能对 touch 强行 hover，但 touch start 应能展开。
- pointer down 展开后不能被同一帧 scroll sync 立即 compact。

### 6.6 缩放控制独立化

zoom slider 需要独立于 composer 定位。

要求：

- `.studio-wall-zoom-control` 不应继承 composer 的 bottom/floating 规则。
- zoom slider 拖动时不触发 composer compact 状态重算。
- zoom 后结果墙布局更新，不影响 composer 展开状态。

如需监听 zoom 变化，应只刷新 wall layout，不重置 Image Page 滚动结构。

### 6.7 sidebar 断层修复

sidebar 背景应由 `.studio-shell` 或 sidebar 自身铺满，而不是依赖主内容高度。

要求：

- sidebar 使用 `min-height: 100dvh` 或等价稳定方式。
- 主内容滚动时 sidebar 背景连续。
- Image/Video/Audio/Clone Prompt 切换时，sidebar 不出现顶部或中部断层。
- 不用给每个 page 单独加大 padding 来遮断层。

## 7. 验收标准

### 7.1 Chrome 实测验收

必须使用 Chrome 插件检查线上或本地页面：

1. 打开 Image Page。
2. 确认有结果墙状态。
3. 滚动页面，观察底部 bar 是否随内容出现，而不是固定在 viewport。
4. 将鼠标移到 compact bar 上，bar 应展开。
5. 点击或 pointer down 到 bar 上，bar 应展开。
6. 拖动 zoom slider，结果墙缩放应正常。
7. 缩放后滚动到 bar，bar 仍能展开。
8. sidebar 从顶部到底部无断层。

### 7.2 CSS/DOM 验收

有结果状态下：

- `.image-generate-console` computed `position` 不能是 `fixed`。
- `.image-generate-console` computed `bottom` 应为 `auto` 或不参与 fixed/sticky 定位。
- `.image-higgsfield-mode.has-results` 不能用 `align-content: end` 或 `align-self: end` 把 composer 强推到 viewport 底部。
- 实际滚动容器必须明确，不能同时多个容器 scrollTop 变化。

### 7.3 交互验收

- hover compact bar：展开。
- click compact bar：展开。
- pointer down compact bar：展开。
- focus prompt input：展开。
- 打开参数菜单：保持展开。
- 滚动离开后：允许 compact。
- zoom slider 拖动：正常。
- zoom 后 bar：仍可展开。

### 7.4 页面切换验收

切换以下页面时不能复发：

- Image
- Video
- Audio
- Clone Prompt

重点看：

- 页面是否整体下跌。
- sidebar 是否断层。
- top tabs 是否遮住内容。
- 底部 bar 是否继承错误定位。

## 8. 执行顺序

### Phase 1：定位回归来源

- 对比最近 Image Page 相关 CSS/JS commit。
- 标记所有影响布局、滚动、composer compact 的改动。
- 用 Chrome 验证当前 computed style 和实际滚动容器。

产出：

- 明确哪几段规则导致“视觉固定”。
- 明确哪段逻辑导致“拖动/唤起失败”。

### Phase 2：恢复布局

- 删除或收窄导致 `.has-results` 状态贴底的规则。
- 恢复 composer 参与内容流。
- 清理污染 Image/Video/Audio/Clone Prompt 的宽泛选择器。

产出：

- bar 不再视觉贴底。
- sidebar 不再断层。

### Phase 3：恢复交互

- 补齐 pointer down / drag start 展开。
- 修复 scroll sync 把 bar 立刻压回 compact 的问题。
- 确保菜单打开、输入 focus、hover 都能保持展开。

产出：

- bar 可以像之前一样被用户唤起和操作。

### Phase 4：缩放回归测试

- 测试 zoom slider。
- 测试不同 zoom 值下的结果墙高度。
- 测试 zoom 后滚动到 bar 的交互。

产出：

- 缩放、滚动、bar 展开互不冲突。

## 9. 风险与防护

### 9.1 风险

- 只改 `position` 会误判问题，导致用户仍感觉固定。
- 只改 CSS 不改 pointer 逻辑，bar 仍可能无法拖动/唤起。
- 只改 Image Page，宽泛 Studio 规则可能继续污染 Video/Audio/Clone Prompt。
- 过度恢复旧规则可能让底部白边、页面背景断层再次出现。

### 9.2 防护

- 每次改动后用 Chrome 看 computed style 和实际截图。
- 每次改动后跑 `npm run build`。
- 只 stage 当前相关文件。
- 提交前检查 `git diff`，避免误改其他 PRD 或未跟踪文件。
- 推送后等待线上部署，再用 Chrome 复测线上。

## 10. 成功标准

本需求完成时，用户在 Image Page 应看到：

- 结果墙能正常缩放。
- 底部 bar 不再固定在 viewport 底部。
- 滚动到 bar 后可以像之前一样拖动/唤起/展开。
- sidebar 没有断层。
- Image、Video、Audio、Clone Prompt 页面整体不再往下跌。

一句话验收：

> Image Page 回到旧工作逻辑：墙能缩放，bar 能拖动，sidebar 不断层，底部不假固定。
