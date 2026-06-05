# Video Page 套用 Image Page 逻辑最新版 PRD

Last updated: 2026-06-05

## 1. 背景

当前 Pokaya Studio 的 Image Page 已经形成了比较清晰的工作台逻辑：顶部工具 tab、主区域结果墙、底部固定 composer、生成参数一排、pending / failed / completed 卡片统一展示、内容可以持续滚动。用户希望 Video Page 不再作为一套独立旧页面维护，而是套用 Image Page 的交互逻辑和视觉结构。

之前 Video Page 已经套用过一部分 Image Page 逻辑，但中途又被改散了，导致 Video Page 与 Image Page 在以下方面不一致：

- 底部 composer 的布局、密度、状态不一致。
- 结果墙与底部输入区的安全距离不一致。
- pending / failed / completed 卡片状态不完全对齐。
- 模型、比例、质量、时长、数量等参数切换时容易出现闪缩或重排。
- Video Page 与 Image Page 的操作心智不统一，用户切换页面后像进入另一个产品。

本 PRD 定义最新版 Video Page 目标：**Video Page 应复用 Image Page 的页面逻辑，只保留视频独有参数和视频生成能力。**

## 2. 产品目标

1. Video Page 与 Image Page 使用同一套 Studio 工作台心智。
2. Video Page 结果墙、pending、failed、completed、preview、download、retry、edit 的行为与 Image Page 对齐。
3. Video Composer 继承 Image Composer 的底部固定结构、浅白紫视觉、响应式规则和稳定尺寸策略。
4. Video Page 保留视频专属参数：模型、比例、质量、时长、数量、声音、参考素材。
5. 用户切换 Image / Video 时，不需要重新学习页面。
6. 修复“之前套了一点又改了”造成的 UI 断层，让 Video Page 回到统一架构。

## 3. 非目标

- 不重写后端视频生成接口。
- 不新增未接入的视频 provider。
- 不改变 credit 计费公式，除非现有 UI 显示错误。
- 不重做 Image Page。
- 不引入新前端框架、UI kit 或动画库。
- 不把 Video Page 做成营销页或单独 landing page。

## 4. 总体原则

Video Page 应遵循一句话：

> Image Page 怎么生成图片，Video Page 就怎么生成视频。

具体含义：

- Image Page 有结果墙，Video Page 也有结果墙。
- Image Page 有底部 composer，Video Page 也用同样底部 composer 结构。
- Image Page 的 pending card、failed card、completed card 怎么排列，Video Page 保持一致。
- Image Page 的无限滚动、缩放、点击预览、下载、retry、edit 逻辑，Video Page 尽量复用。
- Video Page 只在控件内容上不同，不在交互模型上另起一套。

## 5. 页面信息架构

Video Page 分为三层：

1. 顶部 Studio Tabs
2. 中间 Video Result Wall
3. 底部 Video Composer

### 5.1 顶部 Studio Tabs

保持现有 Studio 顶部 tab 结构：

- Image
- Video
- Product Scanner
- Original Video
- Clone Prompt
- Storytelling

要求：

- Video tab 选中态与 Image tab 选中态一致。
- tab 切换不触发结果墙闪缩。
- tab 高度固定，不因为 Video Page 内容变化而改变。

### 5.2 Video Result Wall

Video Page 的主区域使用与 Image Page 一致的 result wall。

展示对象：

- pending video jobs
- failed video jobs
- completed video results

不展示对象：

- 没有 `videoUrl` 的中间 result 记录。
- prompt enhance / provider submitted 中间状态的空白 result。
- 没有可预览媒体的脏数据。

如果后端返回中间状态，前端应把它显示成 pending job，而不是 completed card。

### 5.3 Bottom Video Composer

Video Composer 固定在内容区域底部，复用 Image Composer 的视觉语言：

- 浅白紫背景。
- 圆角大面板。
- 左侧 reference 入口。
- 中间 prompt 输入。
- 下方或同层参数控件。
- 右侧 Generate CTA。

Video Composer 不应使用旧 Video dock 的深色、分裂式、浮动式布局。

## 6. Video Composer 结构

### 6.1 第一层：Prompt 输入区

内容：

- `+` reference button
- prompt textarea
- optional prompt enhance button
- Generate CTA 在宽屏右侧可见

Prompt placeholder：

```txt
Describe your video
```

要求：

- 默认高度与 Image Page composer 接近。
- 短 prompt 不撑高 composer。
- 长 prompt 按行数逐步增加高度。
- 最大显示 6 行。
- 超过 6 行后 textarea 内部滚动。
- prompt 文本不覆盖参数控件。

### 6.2 第二层：视频参数区

参数从左到右：

1. Model
2. Aspect Ratio
3. Quality
4. Duration
5. Count
6. Audio
7. Generate Video CTA

宽屏时尽量保持一行。中窄屏允许参数区横向滚动，但 Generate CTA 必须始终可见或进入清晰的第二行。

## 7. 视频参数定义

### 7.1 Model

默认模型：

- `Veo 3.1 Fast` 或当前后端默认视频模型，以现有系统真实默认值为准。

可选模型按当前系统已接入能力展示，例如：

- Veo 3.1 Fast
- Seedance
- Sora 2
- Gemini / Omni
- Grok Imagine

要求：

- 模型选项只展示当前可用模型。
- 模型切换不重排整个页面。
- 模型切换后自动校验支持的比例、质量、时长。
- 不支持的参数应自动降级到最近可用值，并给出轻提示。

### 7.2 Aspect Ratio

默认：

- `9:16`，如果当前 Video Page 后端默认是 `16:9`，需要明确统一。

推荐可选：

- `9:16`
- `16:9`
- `1:1`
- `4:3`
- `3:4`

要求：

- 与 Image Page 的 ratio 控件视觉一致。
- icon、数值、chevron 不重叠。
- 打开菜单时不被底部 composer 截断。

### 7.3 Quality

默认：

- `720p` 或当前模型默认质量。

可选：

- `480p`
- `720p`
- `1080p`

要求：

- 如果模型只支持 720p，不要让 1080p 可点击。
- 切换 quality 不改变 composer 高度。
- credit 估算同步更新。

### 7.4 Duration

默认：

- `8s` 或当前模型默认时长。

推荐可选：

- `5s`
- `8s`
- `12s`

模型差异：

- Veo 可能只支持固定时长。
- Sora 2 可能支持 8s / 12s。
- Seedance 可能支持更灵活秒数。

要求：

- Duration 控件按模型能力显示。
- 不支持时长 disabled 或隐藏。
- 切换时长更新 credit。

### 7.5 Count

默认：

- `1/4`

要求：

- 最小 1。
- 最大 4。
- 与 Image Page 的 count stepper 一致。
- 点击 `+/-` 不造成结果墙闪缩。
- 正在生成时 count 控件可 disabled。

### 7.6 Audio

默认：

- 根据模型能力决定。

状态：

- On
- Off

要求：

- 用 speaker / mute icon。
- 如果模型不支持 audio，隐藏或 disabled。
- Audio 状态写入生成 payload。

### 7.7 Prompt Enhance

Video Page 可以保留 Prompt Enhance，但行为必须和 Image Page 一致：

- 点击只是切换 enhance on/off。
- 不应立即创建空白 result。
- 用户点击 Generate 后，如果 enhance on，先进入 `Optimizing prompt` pending 状态。
- prompt enhance 阶段只显示 pending card，不显示 completed empty card。
- enhance 失败时显示 failed card，并展示 `No Charge`。

## 8. Reference 素材入口

Video Page 的 `+` 按钮支持：

- 上传图片作为首帧或参考图。
- 上传视频作为参考视频。
- 从 Attachments 选择 Avatar / Product / File。
- 从 Content Library 选择已有图片或视频。

要求：

- Reference picker 与 Image Page 的 picker 视觉一致。
- picker 不被底部 composer 遮挡。
- picker 内部滚动。
- 已选 reference 在 composer 中显示缩略图。
- 支持移除 reference。
- 参考素材数量按模型能力限制。

## 9. Result Wall 行为

### 9.1 Pending Card

Video pending card 复用 Image Page 的状态逻辑：

- Queued
- Optimizing prompt
- Generating video
- Saving result

Pending card 必须：

- 使用当前视频比例占位。
- 不出现空白浅紫 completed card。
- 不显示 `New` badge。
- 如果可取消，右上显示 cancel。
- 状态文字在竖屏/横屏都居中。

### 9.2 Failed Card

Failed card 与 Image Page 一致：

- 标题：`Failed`
- refund pill：`No Charge`
- 操作：`Retry` / `Edit`

要求：

- 竖屏卡片中 `No Charge` 居中。
- 不再显示 `Credits safe`。
- 不再显示二级 `No charge.`。
- Retry 使用原 job 参数重新生成。
- Edit 把 prompt 回填到 composer。

### 9.3 Completed Video Card

Completed card 必须：

- 显示视频 poster / video preview。
- 点击打开 lightbox。
- hover 展示 actions。
- 支持下载。
- 支持删除。
- 支持保存为 reference，如果当前视频可作为后续参考。

不允许：

- 没有视频 URL 的 result 显示成浅紫空白卡。
- 文本型中间记录显示成视频卡。

### 9.4 Infinite Scroll

Video Page 参考 Image Page：

- 不使用 `Load more hidden` 这种按钮式隐藏。
- 结果墙可以一直向下滚动。
- 接近底部自动加载旧结果。
- 加载旧结果时不改变已显示卡片顺序。

## 10. Layout 与响应式

### 10.1 桌面宽屏

- 结果墙占满 composer 以上空间。
- Video Composer 固定在底部。
- 参数尽量一行展示。
- Generate CTA 固定右侧。

### 10.2 中等宽度

- 参数控件可以压缩。
- Model 文案可以省略或截断。
- Count / Duration / Quality 不得重叠。
- Generate CTA 不被挤出可视区域。

### 10.3 窄屏

- Composer 可以变成两行或三行。
- Prompt 区优先保证可输入。
- 参数区可横向滚动。
- CTA 保持清晰可点。
- 不出现元素覆盖 sidebar 或底部边缘。

### 10.4 Sidebar 展开/收起

Video Page 必须和 Image Page 一样适配：

- sidebar 展开时 composer 不被压坏。
- sidebar 收起时 composer 不突然变成全屏宽。
- 内容 lane、结果墙、composer 三者宽度一致。

## 11. 状态机

Video Page 生成流程：

1. 用户输入 prompt。
2. 用户选择 reference / model / ratio / quality / duration / count / audio。
3. 用户点击 Generate Video。
4. 如果 Prompt Enhance off：直接创建 queued pending jobs。
5. 如果 Prompt Enhance on：创建 `Optimizing prompt` pending jobs。
6. provider submitted：状态变为 `Generating video`。
7. asset saved：pending card 替换为 completed video card。
8. failed：pending card 替换为 failed card，显示 `No Charge`。

关键规则：

- 中间 result 不进入 completed wall。
- completed wall 只展示有真实媒体的 result。
- 状态更新不导致整面墙闪缩。

## 12. 数据与过滤规则

前端在 Video Result Wall 渲染前必须过滤：

可显示：

- `type === video` 且有 `videoUrl`
- 有 poster / thumbnail / media URL 的视频 result
- failed / queued / processing generation jobs

不可显示：

- 没有 `videoUrl` 的 video result
- prompt enhance 中间 result
- provider task placeholder
- 空 body / 空 media 的 result
- 只用于内部追踪的 job record

如果后端暂时仍返回这些记录，前端先过滤，后续再由后端清理。

## 13. Credit 显示

Video Composer CTA 显示：

```txt
Generate Video
{credit} Credit
```

要求：

- credit 随 model / quality / duration / count / audio 更新。
- 失败时 failed card 显示 `No Charge`。
- 不显示 “Credits safe / No charge.” 双层文案。
- 如果实际 provider 已扣费但用户不扣费，后台记录成本，前台仍显示 `No Charge`。

## 14. 与 Image Page 的复用建议

优先复用：

- result wall 结构
- pending card
- failed card
- completed card shell
- infinite scroll
- zoom control
- bulk selection 如果已有
- lightbox preview
- bottom composer 尺寸变量
- reference picker modal

允许 Video Page 自定义：

- model options
- duration options
- audio toggle
- video-specific provider payload
- video preview poster
- play button

不建议：

- 复制一整套新 CSS。
- 为 Video Page 单独写完全不同的 result wall。
- 使用旧 dock 与 Image composer 混合。

## 15. 验收场景

必须验证以下状态：

1. Video Page 空结果。
2. Video Page 有历史 completed videos。
3. 点击 Generate 后出现 pending card。
4. Prompt Enhance on 后出现 `Optimizing prompt`，不出现空白 `New` 卡片。
5. 生成失败显示 `Failed / No Charge / Retry / Edit`。
6. completed video 点击可打开 preview。
7. 切换 model 不闪缩。
8. 切换 ratio 不闪缩。
9. 切换 quality 不闪缩。
10. 切换 duration 不闪缩。
11. count `+/-` 不闪缩。
12. audio on/off 不改变布局高度。
13. 长 prompt 逐行增高，超过 6 行内部滚动。
14. reference picker 打开不被 composer 遮挡。
15. sidebar expanded 正常。
16. sidebar collapsed 正常。
17. 无限滚动加载旧视频，不打乱新结果顺序。
18. `npm run build` 通过。

## 16. 实施顺序

第一阶段：结构对齐

1. 确认 Video Page 当前 DOM 入口。
2. 把 Video Result Wall 调整为 Image Result Wall 同款结构。
3. 过滤无媒体中间 result。
4. 对齐 pending / failed / completed card。

第二阶段：Composer 对齐

1. 将 Video Composer 改成 Image Composer 同款底部结构。
2. 接入 model / ratio / quality / duration / count / audio。
3. 接入 reference picker。
4. 接入 Prompt Enhance 状态。

第三阶段：稳定性

1. 修复参数切换闪缩。
2. 修复 sidebar 展开/收起。
3. 修复长 prompt。
4. 修复 picker z-index 和底部安全区。
5. 修复结果墙最后一行被 composer 挡住。

第四阶段：验证

1. 桌面宽屏截图。
2. 窄屏截图。
3. Prompt Enhance on 生成截图。
4. Failed card 截图。
5. Completed video preview 截图。
6. Build 验证。

## 17. 风险点

1. 当前 Video Page 可能混有旧 dock 样式，容易与 Image Composer 样式互相覆盖。
2. 当前 `src/main.js` 有本地未提交改动，执行时必须只 stage 相关 hunks。
3. 如果后端继续返回无媒体中间 result，前端过滤必须保留。
4. Prompt Enhance 可能同时影响 Image / Video，需要避免修 Video 时破坏 Image。
5. Video model 能力差异较大，参数控件不能写死。
6. 结果墙排序必须保留 timeline 稳定性，不能让最新生成卡片被推下去。

## 18. 最终验收标准

Video Page 合格的判断：

> 用户从 Image Page 切到 Video Page，会感觉只是“生成媒体类型变成视频”，而不是进入一套新产品。

具体标准：

- 视觉一致。
- 布局一致。
- pending/failed/completed 一致。
- bottom composer 一致。
- 参数切换稳定。
- Prompt Enhance 不产生空白卡片。
- 结果墙可持续滚动。
- failed 明确显示 `No Charge`。
- build 通过并可部署。

