# Content Library Higgfield 风格改版 PRD

Last updated: 2026-06-03

## 1. 背景

当前 Content Library 页面已经能展示生成资产，但视觉和信息架构还偏“普通结果列表”：

- 顶部只有 `Generated Assets` 标题和简单筛选。
- 资产卡片沿用生成结果卡，信息区占比大，浏览密度低。
- 文本结果和图片结果混在同一种卡片尺寸里，导致首屏效率低。
- 页面不像一个真正的素材管理库，用户不容易按日期、类型、项目或复用场景快速找素材。

用户希望 Content Library 做成类似 Higgfield 的资产库感觉：左侧分类清楚、主区域按日期分组、缩略图密集排列、顶部有搜索和视图控制。但 Pokaya 不使用 Higgfield 的深黑色调，而是保留 Pokaya 品牌的浅白紫、粉色行动点和工具工作台气质。

## 2. 目标

### 2.1 用户目标

用户进入 Content Library 后，可以快速完成：

1. 搜索某个生成素材。
2. 按类型筛选：All、Image、Video、Text、Visual Card。
3. 按日期浏览最近生成内容。
4. 一眼看出哪些素材可以继续使用、下载、编辑或加入发布流程。
5. 在大量素材中保持高密度浏览，不需要滚很久。

### 2.2 产品目标

- 把 Content Library 从“生成结果存放页”升级成“素材工作台”。
- 强化 Pokaya 的内容生产链路：生成 -> 收藏/分类 -> 复用 -> 编辑 -> 发布。
- 提升用户对生成资产价值的感知。
- 为后续 folder、favorite、product project、batch selection 做好结构预留。

## 3. 设计方向

### 3.1 参考 Higgfield 的部分

参考的是结构和密度，不是照抄颜色：

- 左侧资产分类栏。
- 主内容区按日期分组。
- 小尺寸缩略图资产墙。
- 顶部搜索。
- 右上角视图密度 / 缩放控制。
- 多选 checkbox 和批量操作预留。
- 资产类型计数。

### 3.2 Pokaya 化处理

Pokaya 版本必须使用浅白紫色调：

- 页面背景：`#fffafc` 到 `#f8f0ff` 的轻柔底色。
- 面板背景：半透明白 / 极浅粉紫。
- 文字主色：深紫 `#2a1033`。
- 选中态：粉色到 coral 的行动色，或浅粉底 + 深紫文字。
- 分割线：低透明紫色，不用 Higgfield 的深灰线。
- 不使用黑底资产库作为主视觉。

整体感觉应该是：Higgfield 的专业资产密度 + Pokaya 的轻盈白紫品牌。

## 4. 页面信息架构

页面分为三块：

1. 左侧 Library Panel
2. 顶部 Asset Command Bar
3. 主内容 Asset Timeline Wall

### 4.1 左侧 Library Panel

位置：在现有 Pokaya 主 sidebar 右侧，作为 Content Library 页面内部的二级侧栏。

内容：

- Search 输入框。
- All Assets，显示总数。
- Favorites，显示收藏数。
- Tools 分类：
  - Image
  - Video
  - Text
  - Visual Card
- Projects / Products 分类：
  - 当前 project 列表或 product/folder 列表。
  - 每项显示数量。
- 底部预留：
  - New folder
  - Manage tags

交互：

- 点击分类后刷新右侧资产。
- 选中项使用浅粉紫底、深紫文字、粉色左边线或小圆点。
- 数量 badge 使用轻量 pill，不要抢主视觉。

### 4.2 顶部 Asset Command Bar

位置：主内容区顶部，sticky。

内容：

- 当前视图标题：`All assets` / `Images` / `Videos` / 项目名。
- 搜索结果数量，例如 `128 assets`。
- 快捷筛选 chip：
  - All
  - Image
  - Video
  - Text
  - Saved references
  - Ready to post
- 排序：
  - Newest first
  - Oldest first
  - Model
  - Project
- 右侧视图控制：
  - Grid density slider
  - Grid / List toggle
  - Batch select toggle

设计要求：

- 高度控制在 `56-68px`。
- sticky 时不能遮挡日期标题。
- 搜索和筛选不能撑高页面。
- 移动端改为两行或横向滚动 chip。

### 4.3 主内容 Asset Timeline Wall

结构：

- 按日期分组，例如：
  - Today
  - June 1, 2026
  - May 31, 2026
  - May 26, 2026
- 每个日期标题左侧有 checkbox，支持选择该日期下所有资产。
- 日期标题下方是高密度缩略图网格。

网格规则：

- 图片和视频用真实比例缩略图，但卡片容器高度要稳定。
- 默认缩略图尺寸：
  - Desktop：`112-148px`
  - 宽屏：`132-168px`
  - Mobile：双列或三列。
- 缩略图圆角：`12-16px`。
- gap：`10-14px`。
- 文字信息默认隐藏，只在 hover 或选中时出现轻量 overlay。
- 文本结果不要使用大黑占位卡，应改成“文档缩略卡”：
  - 浅白卡片
  - 文档 icon
  - 前 2 行摘要
  - 类型标签 `Text`

## 5. Asset Card 规范

### 5.1 默认状态

每个 asset card 默认只展示最必要的信息：

- 缩略图 / 文本摘要。
- 左上角选择 checkbox，默认 hover 或 batch 模式显示。
- 右上角类型 icon：
  - Image
  - Video
  - Text
  - Visual Card
- 视频显示 play icon。
- 已收藏显示小 heart。

### 5.2 Hover 状态

Hover 时显示轻量 overlay：

- Asset name 或 prompt 摘要。
- Model，例如 `GPT IMAGE 2`。
- Project / Product 名称。
- 快捷操作：
  - Preview
  - Download
  - Copy prompt
  - Use as Product
  - Use as Avatar
  - Add to Auto Post

要求：

- Hover 不改变卡片外部尺寸。
- Overlay 使用半透明白紫或深紫透明层，文字必须可读。
- 操作按钮用 icon button + tooltip，不要把卡片撑高。

### 5.3 选中状态

选中后：

- 卡片边框变粉色。
- 左上 checkbox 常显。
- 顶部出现 batch action bar：
  - Download
  - Add to folder
  - Save references
  - Delete

### 5.4 Preview 状态

点击资产打开预览弹窗：

- 左侧大预览。
- 右侧 metadata panel：
  - Type
  - Model
  - Prompt
  - Cost
  - Created time
  - Project
  - Actions
- 不离开 Content Library。
- 关闭后保留原滚动位置。

## 6. 筛选与搜索

### 6.1 搜索

搜索范围：

- Prompt
- Asset name
- Project name
- Model
- Type
- Result id

体验要求：

- 输入 debounce。
- 搜索中不阻塞滚动。
- 空结果显示可操作提示，例如清除筛选。

### 6.2 筛选

第一期筛选：

- 类型：All / Image / Video / Text / Visual Card。
- 收藏：Favorites。
- 日期：All time / Today / Last 7 days / This month。
- 模型：GPT Image 2 / Seedream / Nano Banana / Video models。

后续预留：

- Product
- Campaign
- Folder
- Posted / Not posted
- Used as Avatar / Used as Product

## 7. 响应式要求

### 7.1 Desktop

- 主 sidebar 展开时，Content Library 内部二级侧栏仍然可见。
- 一行至少显示 6-10 个缩略图，取决于密度 slider。
- 资产墙不能出现横向页面溢出。

### 7.2 Tablet

- 内部二级侧栏可折叠。
- Command bar 的筛选 chip 横向滚动。
- 一行显示 4-6 个缩略图。

### 7.3 Mobile

- 内部二级侧栏变成顶部 filter drawer。
- 一行显示 2-3 个缩略图。
- 批量操作固定在底部，不遮挡内容。

## 8. 性能要求

Content Library 很容易积累大量素材，因此性能必须优先处理：

- 网格只加载缩略图，不加载原图。
- 视频默认只显示 poster，点击预览后才加载播放器。
- 图片使用 lazy loading。
- 超过 100 个素材时使用分批渲染或虚拟列表。
- 切换筛选不重绘整页 sidebar。
- 打开 preview 不丢失滚动位置。
- 密度 slider 调整只改变 CSS 变量，不重建全部 DOM。

## 9. 空状态与错误状态

### 9.1 空资产

文案：

> No assets yet
> Generate your first image or video in Studio.

按钮：

- Go to Studio
- Ask Pokaya Agent

### 9.2 搜索空结果

文案：

> No assets match this search.

操作：

- Clear search
- Clear filters

### 9.3 资产加载失败

卡片显示：

- Broken thumbnail icon。
- `Preview unavailable`。
- Retry 按钮。

失败卡片不能撑高网格。

## 10. 埋点

需要记录：

- Content Library open。
- Search query used。
- Filter selected。
- Asset preview opened。
- Asset downloaded。
- Prompt copied。
- Saved as Avatar。
- Saved as Product。
- Added to Auto Post。
- Batch action used。
- Density changed。

## 11. 不包含范围

第一期不做：

- 真正的云端 folder 权限系统。
- 多用户协作。
- AI 自动打标签。
- 复杂媒体编辑器。
- 拖拽排序。
- 大规模重构现有生成结果数据结构。

第一期重点是把页面变成“高密度、可搜索、可复用”的资产库。

## 12. 验收标准

### 12.1 视觉验收

- 页面整体是浅白紫，不是黑色 Higgfield。
- 首屏能看见标题、搜索/筛选、至少一组日期、多个缩略图。
- 文本结果不再是大黑占位卡。
- 卡片 hover 不跳动、不改变网格尺寸。
- 主 sidebar 和 Content Library 内部侧栏不互相挤压。

### 12.2 功能验收

- All / Image / Video / Text 筛选可用。
- 搜索 prompt 或 result id 能找到资产。
- 日期分组正确。
- 点击 asset 能打开 preview。
- 关闭 preview 后回到原滚动位置。
- 下载、复制 prompt、保存为 Avatar/Product 的入口可见。

### 12.3 响应式验收

- Desktop 一行至少显示 6 个素材缩略图。
- Tablet 不横向溢出。
- Mobile 可正常浏览、筛选、预览。
- sticky command bar 不遮挡日期标题。

### 12.4 性能验收

- 100 个资产以内滚动顺畅。
- 视频不会在列表中自动加载播放器。
- 图片墙使用缩略图。
- 切换筛选时没有明显白屏。

## 13. 建议执行顺序

1. 重构 Content Library 页面结构：内部侧栏 + command bar + timeline wall。
2. 改资产卡片为高密度缩略图卡。
3. 增加日期分组和基础筛选。
4. 增加 hover overlay 和 preview modal。
5. 做缩略图、lazy loading、视频 poster 性能优化。
6. 做 desktop/tablet/mobile 适配。
7. 最后补 batch select 和 density slider。

## 14. 第一版 MVP

为了快速上线，第一版只需要完成：

- 浅白紫 Higgfield-like 视觉结构。
- 左侧分类栏。
- 搜索框。
- All / Image / Video / Text 筛选。
- 日期分组。
- 高密度缩略图 grid。
- Hover overlay。
- Preview modal。

Batch actions、folder、advanced filter、density slider 可以第二期补。
