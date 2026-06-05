# Audio Page 基础共享与音频专属视觉 PRD

日期：2026-06-06

## 1. 背景

Image / Video Page 已经开始把结果墙抽成更中性的 `studio-media-wall-surface`，用于承载图片和视频这类“视觉媒体墙”的共用布局。

Audio Page 也复用了 `studioResultWall()`，但它不适合完整套用 Image / Video 的视觉媒体墙。原因是 Audio 的结果不是可直接观看的图片/影片，而是需要通过波形、播放状态、时长、语音 preset、下载动作来表达的音频对象。

因此 Audio 更适合采用：

```text
基础共享 + 音频专属视觉
```

也就是共享结果墙的底层能力，但保留 Audio 自己的卡片视觉、波形表现、播放器交互和 composer 布局。

## 2. 目标

1. 明确 Audio Page 应该共享哪些 wall 基础能力。
2. 明确 Audio Page 不应该套用 Image / Video 的媒体墙视觉。
3. 给 Audio Page 增加一个中性但音频明确的 surface class，避免未来维护时误把它接到 `studio-media-wall-surface`。
4. 统一结果墙基础行为：排序、pending、failed、selection、zoom、lazy rendering、批量选择。
5. 保留 Audio 专属视觉：波形卡片、播放按钮、时长、voice preset、音频生成状态、音频 composer。

## 3. 非目标

1. 不把 Audio Page 改成 Image / Video 的瀑布流视觉。
2. 不重写 `studioResultWall()` 的整体架构。
3. 不改音频生成 provider、计费、队列或后端接口。
4. 不重新设计 Audio Page 的整体品牌风格。
5. 不在本阶段实现真实音频播放器、裁剪器或字幕同步。

## 4. 当前状态

### 4.1 已共享的部分

Audio Page 当前已经调用：

```js
studioResultWall(p, meta)
```

这意味着它已经能共享：

- pending / result 混排
- 按时间排序
- wall page size / progressive rendering
- zoom 变量
- 结果选择状态
- 通用 result action 入口

### 4.2 已专属的部分

Audio Page 当前已经有：

```js
studioAudioWallCard(item)
audioWallPreview(item)
audioWaveformBars()
audio-wall-stage
studio-audio-wall-card
studio-audio-wall-preview
```

这些是 Audio 专属视觉的基础，不应该被 Image / Video 的 `.studio-media-wall-surface` 覆盖。

### 4.3 当前风险

如果后续为了“统一 wall”把 Audio 也挂到 `studio-media-wall-surface`，会带来几个问题：

1. Audio 卡片可能被强制当成图片/视频卡片处理。
2. footer、waveform、play button 可能被视觉媒体墙规则隐藏或压扁。
3. pending 状态可能失去音频生成语义。
4. mobile 上 Audio composer 与 wall stage 可能再次出现高度挤压。

## 5. 产品原则

### 5.1 共享的是能力，不是视觉

Audio 与 Image / Video 应共享：

- wall 数据筛选
- pending / failed 状态结构
- 卡片选择
- 批量选择
- zoom 控制
- 无限加载
- action 派发机制

Audio 不共享：

- 图片/视频瀑布流填充方式
- `result-image` / `result-video` 的 object-fit 规则
- 隐藏 footer 的视觉媒体墙规则
- Image / Video hover action 的贴边浮层位置
- Image / Video empty state 背景

### 5.2 Audio 需要自己的 surface

新增 Audio 专属 wall surface class：

```html
studio-audio-wall-surface
```

推荐结构：

```html
<section class="audio-studio-page studio-audio-wall-surface studio-wall-zoomable">
  <section class="audio-stage-hero">...</section>
  <section class="audio-wall-stage">
    <div class="studio-wall-zoom-control">...</div>
    <section class="studio-result-wall">...</section>
  </section>
  <section class="audio-composer">...</section>
</section>
```

`studio-audio-wall-surface` 的职责是声明：

```text
这是共享 wall 行为下的 Audio 页面，不是视觉媒体墙页面。
```

## 6. 方案

### 6.1 DOM class 分层

Image / Video：

```html
studio-media-wall-surface
```

用于视觉媒体墙。

Audio：

```html
studio-audio-wall-surface
```

用于音频工作台的共享 wall 行为与专属视觉。

Audio 不应添加：

```html
studio-media-wall-surface
image-higgsfield-mode
video-page-studio
```

### 6.2 基础共享能力抽象

建议把跨 Image / Video / Audio 都适用的 wall 行为写成更基础的 selector 或 JS helper，命名为：

```text
studio-wall-surface-base
```

可选方案：

```html
<section class="audio-studio-page studio-wall-surface-base studio-audio-wall-surface studio-wall-zoomable">
```

基础 base 管：

- `.studio-result-wall` 的 reset
- `.studio-wall-grid` 的 min-width / overflow 安全
- `.studio-wall-card` 的 selection 状态
- `.studio-wall-select-toggle`
- `.studio-wall-new-badge`
- pending / failed 的基础可读状态
- zoom control 的基础定位

各媒体类型再各自扩展：

- `.studio-media-wall-surface` 管图片/视频瀑布流视觉。
- `.studio-audio-wall-surface` 管音频波形卡视觉。

### 6.3 Audio wall grid 保持专属布局

Audio wall 不使用图片/视频的 260px 视觉瀑布流列宽，而继续使用更适合音频信息的卡片宽度：

```css
.studio-audio-wall-surface .studio-wall-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(var(--studio-wall-column, 360px), 100%), 1fr));
}
```

验收重点：

- 一行可以展示多个音频卡。
- 音频卡保持 16:9 或接近音频面板比例。
- waveform 不被裁掉。
- footer 保留，不被 media wall 隐藏。

### 6.4 Audio card 保持专属视觉

Audio 卡片继续由：

```js
studioAudioWallCard(item)
```

渲染。

必须保留：

- play action
- download action
- delete action
- waveform preview
- duration label
- audio prompt / title
- pending generating badge

不应复用 Image / Video 的：

- `result-image`
- `result-video`
- `result-video-shell`
- `object-fit: contain`
- `footer display: none`

### 6.5 pending / failed 状态

Audio pending 可以共享 `studioPendingWallCard()` 的状态来源，但视觉上需要音频化：

- pending 卡片仍显示 waveform 背景。
- loading 状态显示为 audio generating，而不是单纯图片/视频 spinner。
- failed 状态保留 Retry / Edit / No Charge，但布局必须适合 16:9 音频卡。

### 6.6 zoom 行为

Audio 应继续共享 `studioWallZoomStyleAttr()`。

但 Audio zoom 的默认列宽应和视觉媒体墙分开：

```text
Image / Video default column: 260px
Audio default column: 360px
```

如果当前全局只用一个 `--studio-wall-column`，建议后续拆成：

```css
--studio-media-wall-column
--studio-audio-wall-column
```

短期也可以通过 `.studio-audio-wall-surface` 里覆盖 `--studio-wall-column` 实现。

### 6.7 empty state 与 composer

Audio empty state 不应该和 Video 空态共用。

Audio empty state 的目标：

- 让用户理解这里是 Voiceover / Change Voice / Translate 的音频工作台。
- Composer 保持在 viewport 内，不和顶部 tabs 或 sidebar 冲突。
- 390px mobile viewport 下不出现横向滚动和高度裁切。

## 7. 验收标准

1. Audio Page 有明确的 `studio-audio-wall-surface` class。
2. Audio Page 不挂 `studio-media-wall-surface`。
3. Audio Page 继续复用 `studioResultWall()`。
4. Audio result card 继续走 `studioAudioWallCard()`。
5. Audio wall 的 footer、waveform、play/download/delete actions 都正常显示。
6. Audio pending card 不被 Image / Video 的 media wall CSS 覆盖。
7. Audio failed card 的 Retry / Edit / No Charge 不溢出。
8. Audio zoom control 可用，并且不会改变 Image / Video 的列宽语义。
9. Desktop 1440px 下 Audio hero、wall、composer 不重叠。
10. Mobile 390px 下 Audio composer 不横向溢出，不被底部裁掉。
11. `npm run build` 通过。

## 8. QA 清单

### 8.1 Desktop

1. Audio 空状态。
2. Audio 有 1 个音频结果。
3. Audio 有 3 个音频结果。
4. Audio 有 20+ 个音频结果。
5. Audio pending generation。
6. Audio failed generation。
7. Hover actions 是否稳定。
8. Zoom slider 从小到大是否稳定。

### 8.2 Mobile

1. 390px 宽度下 Audio 空状态。
2. 390px 宽度下 Audio 有结果状态。
3. Composer 是否可完整看到。
4. Mode dial / prompt well / preset / generate button 是否换行合理。
5. Audio card waveform 是否没有被压扁。

### 8.3 回归

1. Image Page 媒体墙不受 Audio class 影响。
2. Video Page 媒体墙不受 Audio class 影响。
3. Audio Page 不吃 Image / Video 的 `footer display: none` 规则。
4. Route switching：Image -> Audio -> Video 不闪白、不高度坍塌。

## 9. 执行顺序

1. 给 Audio Page 根节点增加 `studio-audio-wall-surface`。
2. 如有必要，增加 `studio-wall-surface-base`，承接所有媒体类型共享的基础 wall reset。
3. 保留 `.audio-wall-stage` 和 `.studio-audio-wall-card` 的专属 CSS。
4. 审计 `.studio-media-wall-surface` selector，确保它不会命中 Audio。
5. 补齐 Audio pending / failed 专属覆盖。
6. 检查 zoom column 默认值是否需要 Audio 单独覆盖。
7. 跑 `npm run build`。
8. 做 desktop / mobile 视觉 QA。
9. 提交并推送。

## 10. 风险

1. 当前 CSS 历史 override 较多，Audio 专属规则可能被后续全局 `.studio-wall-card` 覆盖。
2. `studioResultWall()` 是共享函数，修改结构时可能影响 Image / Video。
3. Audio Page 当前还有后端未完整接入的 workflow，pending/failed 可能需要 mock 或测试数据才能完整验证。
4. 如果把 `studio-wall-surface-base` 做得太大，可能再次变成“所有页面都被同一种视觉绑架”。

## 11. 推荐实现策略

建议分两步执行：

1. 第一阶段只加 `studio-audio-wall-surface`，并把 Audio 专属规则显式绑定到这个 class 上。
2. 第二阶段再抽 `studio-wall-surface-base`，只承接真正跨媒体类型的基础行为。

这样既能解决语义边界，又不会一次性重排 Audio / Image / Video 三个页面的 CSS ownership。
