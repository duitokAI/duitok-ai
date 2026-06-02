# Image Composer 底部白色残留修复 PRD

## 1. 背景

从最新截图看，Image 生成页底部 composer 已经完成多轮压缩和视觉调整，但 composer 下方仍然出现一条明显的白色区域。这个问题已经多次处理仍然复发，说明它不是单一按钮、单一 border 或单一 box-shadow 的问题，而是底部区域的背景层级、sticky 容器、页面滚动空间和 composer 外层区域没有统一收口。

当前截图中的白色问题表现为：

- composer 本体是淡紫/粉紫玻璃质感。
- composer 下方出现一条纯白或接近纯白的横向区域。
- 白色区域不是 composer 内部按钮造成的，而是在 composer 外部或父容器底部露出来。
- 白色区域会让页面看起来像“工具栏没有贴到底”或“底部背景断层”。

本 PRD 目标是把这类白色残留从根源上解决，不再通过临时加阴影、加高度、局部覆盖某个按钮来反复补丁。

## 2. 问题定义

### 2.1 用户可见问题

用户看到底部 composer 时，会明显感觉下方有一块不属于当前设计语言的白色区域。

这会造成三个体验问题：

- 页面完成度下降：像还没加载完、或者底部容器漏底。
- 视觉重心被拉低：用户注意力从输入栏转移到底部白带。
- 反复修改无效：如果只改 composer 的背景或按钮样式，白色区域仍可能存在。

### 2.2 非目标问题

本 PRD 不处理以下内容：

- 不重做整个 Image composer 交互。
- 不重新设计模型、比例、质量、数量控件。
- 不调整生成逻辑、扣费逻辑、上传逻辑。
- 不把页面改成新的布局系统。

本次只解决：composer 下方白色残留、底部背景断层、sticky 区域漏底。

## 3. 根因假设

白色残留大概率来自以下一种或多种叠加：

### 3.1 页面主背景和 composer 背景不一致

Image 页面主体可能使用淡紫背景，但某个外层容器、workspace、canvas-card、body 或 root 仍然是白色。当 composer 没有覆盖到底部时，白色父背景就露出来。

常见来源：

- `body`
- `#app`
- `.studio-shell`
- `.workspace`
- `.canvas-card`
- `.image-higgsfield-mode`
- `.image-generate-console` 的父级容器

### 3.2 sticky composer 只覆盖内容，不覆盖安全区

composer 当前可能是 `position: sticky; bottom: 0;`，但它本身的高度只到圆角卡片结束。下方如果还有 viewport 安全区、滚动 padding、父容器 padding-bottom，就会露出底色。

常见来源：

- `padding-bottom`
- `margin-bottom`
- `min-height`
- `bottom` 不是 0
- `env(safe-area-inset-bottom)` 没有统一处理
- sticky 元素只覆盖自身内容，没有底部背景延伸层

### 3.3 composer 的圆角导致底部背景露出

截图里 composer 是一个大圆角浮层。如果这个浮层不是贴底矩形，而是一个带圆角的卡片，那么圆角下方和阴影下方自然会露出父背景。

如果父背景是白色，就会形成明显白带。

### 3.4 box-shadow 或 backdrop-filter 造成“白雾”

底部区域也可能不是纯背景，而是由以下效果叠加出来：

- 白色 radial-gradient
- 透明玻璃背景叠在白底上
- 过大的浅色 box-shadow
- backdrop-filter 把下方白色父背景模糊出来

这种情况下，即使把 composer `background` 改成紫色，白色仍然会通过透明层和 blur 看起来存在。

### 3.5 多处 CSS final lock 互相覆盖

当前 CSS 已经有多段 “final lock / final reset / polish” 规则。白色问题反复出现，可能是因为后面的规则覆盖了前面的背景修复。

需要避免继续加零散补丁，而是建立一个专门的底部背景收口规则，放在所有 toolbar/composer polish 之后。

## 4. 修复目标

### 4.1 视觉目标

- composer 下方不再出现纯白横带。
- 底部区域和页面主背景连续。
- composer 可以保持圆角和玻璃质感，但圆角外露出的背景必须是同一套淡紫背景。
- 在桌面、移动端、不同页面高度下，底部都不能露白。

### 4.2 技术目标

- 不依赖“把 composer 高度继续加大”来遮挡问题。
- 不依赖单个按钮或单个控件的背景覆盖。
- 明确底部背景所有权：谁负责铺满 viewport 底部，谁负责浮层视觉。
- 修复规则必须放在最后的 composer visual lock 区域，防止被后续规则覆盖。

### 4.3 验收目标

在以下状态中，composer 下方都不应出现白色残留：

- 初始空画布。
- 已生成结果墙。
- composer 展开状态。
- composer compact 状态。
- 打开 quality 下拉。
- 打开 aspect ratio 下拉。
- 桌面宽屏。
- 1365 x 768 普通桌面。
- 移动端 390 x 844。

## 5. 解决方案

### 5.1 建立页面底部背景基底

为 Image Studio 页面的最外层工作区建立统一背景，而不是只给 composer 本身上色。

建议覆盖对象：

```css
.studio-shell .workspace:has(.image-higgsfield-mode),
.studio-shell .canvas-card:has(.image-higgsfield-mode),
.studio-shell .image-higgsfield-mode
```

要求：

- 背景必须不是白色。
- 使用和当前页面一致的淡紫背景。
- 背景需要覆盖整个可视区域和滚动区域底部。

推荐方向：

```css
background:
  linear-gradient(180deg, #f8eefb 0%, #f3e6f7 100%);
```

### 5.2 给 composer 增加底部延伸背景层

composer 可以继续是圆角浮层，但它后面需要有一个底部背景延伸层，负责覆盖圆角下方和 viewport 底部。

建议使用 `::after` 或独立 wrapper。

推荐优先用 pseudo-element：

```css
.studio-shell .image-higgsfield-mode > .image-generate-console::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(-1 * max(28px, env(safe-area-inset-bottom)));
  height: max(28px, env(safe-area-inset-bottom));
  background: #f3e6f7;
  pointer-events: none;
  z-index: -1;
}
```

注意：

- composer 本身需要 `position: sticky` 或 `relative` 与 pseudo-element 配合。
- 如果当前 `overflow: hidden` 会裁掉 pseudo-element，需要改为 `overflow: visible`，或把延伸层放到父级。
- `z-index` 要确保延伸层在 composer 后面，但在白色父背景上面。

### 5.3 去掉底部白色来源

排查并修正这些规则：

```css
body,
#app,
.studio-shell,
.workspace,
.canvas-card,
.image-higgsfield-mode
```

任何在 Image Studio 页面可见区域内的白色背景，都必须满足其中之一：

- 是明确内容卡片背景。
- 不会露在 composer 下方。
- 被 Image 页面专属背景覆盖。

不能让这些容器在 bottom viewport 区域裸露白色。

### 5.4 收敛 composer 阴影和玻璃透明度

如果白色来自透明玻璃叠加，需要降低透明度风险。

建议：

- composer 主背景透明度不要低于 `0.88`。
- 底部阴影不要使用偏白阴影。
- 避免 `rgba(255,255,255,0.9)` 作为大面积 radial-gradient。
- `backdrop-filter` 保留，但不要依赖 blur 来生成背景。

建议 composer 背景：

```css
background:
  radial-gradient(circle at 86% 50%, rgba(255, 112, 152, 0.16), transparent 34%),
  linear-gradient(135deg, rgba(255, 252, 255, 0.94), rgba(246, 232, 250, 0.96));
```

### 5.5 建立最终覆盖区

在 `src/styles.css` 末尾或现有 composer final lock 后新增一个明确区块：

```css
/* Image composer bottom background lock: prevent white band leakage. */
```

这个区块只处理：

- Image 页面背景。
- composer 底部延伸。
- safe area。
- overflow / z-index。

不要混入按钮尺寸、文字大小、下拉菜单样式，避免后续维护时又把问题打散。

## 6. 实施步骤

### Step 1：定位白色来源

使用浏览器 DevTools 或 Playwright 检查截图区域最底部白色像素对应的元素。

必须记录：

- 白色区域坐标。
- 命中的 DOM 元素。
- computed `background-color`。
- computed `background-image`。
- 是否来自 pseudo-element。

如果点击不到具体元素，则检查父容器背景和 viewport 根背景。

### Step 2：添加页面背景锁

给 Image Studio 页面外层容器统一淡紫背景。

优先选择最接近 Image 页面根部的容器，而不是 `body` 全局。

### Step 3：添加 composer 底部延伸层

用 `::after` 或父级 background 覆盖 composer 下方区域。

要求：

- 覆盖普通桌面底部。
- 覆盖 mobile safe-area。
- 不挡点击。
- 不影响下拉菜单 z-index。

### Step 4：减少白色透明叠加

检查 composer 背景、阴影、radial-gradient。

如果白色来自玻璃层叠加，调整透明度和渐变色，不允许大面积白色雾化到底部。

### Step 5：视觉回归测试

在多个 viewport 截图，对底部 40px 做像素检查。

验收标准：

- 底部 40px 不应存在连续超过 80% 宽度的纯白或接近纯白区域。
- 接近白色定义：`R > 248 && G > 248 && B > 248`。
- 如果背景是淡紫，允许高亮，但不能是纯白横带。

## 7. 验收标准

### 7.1 视觉验收

- 截图中 composer 下方不再出现白色横带。
- 底部背景与主画布背景连续。
- composer 的圆角外侧露出的也是淡紫背景。
- 按钮、图标、文字不因修复发生位移。
- 下拉菜单仍可正常浮出，不被底部背景层遮挡。

### 7.2 技术验收

- `npm run build` 通过。
- Playwright 至少截图以下 viewport：
  - `1365 x 768`
  - `2048 x 1000`
  - `390 x 844`
- 检查 `.image-generate-console` 下方 40px 区域没有连续白带。
- DevTools computed style 能说明底部背景来自 Image 页面专属背景，而不是 `body` 或默认白底。

### 7.3 回归验收

以下功能不能受影响：

- Generate 按钮点击。
- Avatar / Product reference 按钮点击。
- Quality 下拉。
- Aspect ratio 下拉。
- Count stepper。
- Composer compact / expanded 状态切换。
- 结果墙滚动。

## 8. 风险和注意事项

### 8.1 不要只改 composer background

如果白色来自父容器，只改 composer 自己的背景会继续复发。

### 8.2 不要用更大的 box-shadow 遮挡

阴影只能弱化边界，不能解决背景断层。用阴影遮挡会在不同屏幕上继续露白。

### 8.3 不要把全站 body 改成紫色

全局修改可能影响登录页、首页、Admin、SOP 等页面。应该使用 Image Studio 页面限定选择器。

### 8.4 注意移动端 safe area

iPhone 底部安全区可能让白色更明显。修复必须包含：

```css
env(safe-area-inset-bottom)
```

### 8.5 注意 overflow

如果 composer 或父级设置了 `overflow: hidden`，pseudo-element 可能被裁掉。需要明确哪个层负责裁切，哪个层负责底部延伸。

## 9. 建议最终交付

本 PRD 执行后，应交付：

- 一组 CSS 修复，集中在一个 final lock 区块。
- 一张桌面验证截图。
- 一张移动端验证截图。
- Playwright 像素检查结果。
- commit 并 push 到远端，让用户从云端部署检查最终效果。

## 10. 成功标准

这个问题算真正解决，必须满足：

- 用户截图中的白色横带消失。
- 切换页面状态后不复发。
- 打开下拉菜单后不复发。
- 移动端不复发。
- 后续调整按钮、字体、quality menu 时，不需要再碰底部背景修复逻辑。

