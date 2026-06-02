# Pokaya Agent 3D 建模 PRD

## 1. 目标

为 Pokaya Agent 制作一个可在网页实时运行的正式 3D mascot。当前前端 prototype 只作为工程兜底，不作为最终视觉。正式版本必须交付真实 GLB 模型、可播放动画、Blender 源文件和贴图源文件。

成功标准不是“页面里有 3D”，而是用户看到后相信：Pokaya Agent 是一个正在帮他做 TikTok Shop 内容的数字员工。

## 2. 视觉方向

关键词：

- Cute AI operator
- Malaysian TikTok seller assistant
- Compact robot mascot
- Smart, hardworking, friendly
- Pokaya 紫 + 粉色高光 + 少量珊瑚橙/黄色
- 软塑料玩具质感，但不能幼稚廉价

禁止方向：

- 不要写实人类
- 不要重机甲
- 不要抄腾讯 MARVIS 的具体造型
- 不要只做一张贴图立牌
- 不要复杂毛发或真实皮肤

## 3. 角色设定

角色名称：Pokaya Agent Mascot

基础造型：

- 小型圆角方形身体
- 正面是屏幕脸或 Pokaya mascot face
- 两只短手，两只短脚
- 头顶有 AI 信号灯或小天线
- 身上可有小型 `AI` 标识或 Pokaya 图形元素
- 眼睛/屏幕允许轻微 emissive glow

角色感觉：

- 工作时认真
- 待命时可爱
- 完成任务时有成就感
- 不是 chatbot avatar，而是“会走去工位做事”的 agent

## 4. 场景与工位

整体是一个迷你 3D 工作空间，不是完整办公室。

需要分区：

- Idle 区：小床、跑步机、小地毯
- Image Station：画板、色卡、商品盒、图片预览屏
- Video Station：剪辑屏幕、timeline、竖屏 preview、小摄像机
- Copy Station：键盘、文档屏、hook/caption 卡片
- Schedule Station：日历墙、queue board、post plan 卡片
- Command Station：中央控制台、多屏幕、task map

用户必须一眼分辨当前在哪个工位。

## 5. 必交付文件

放入前端的生产文件：

- `public/models/agent/pokaya-agent.glb`

源文件交付：

- `source.blend`
- `textures/`
- 角色三视图渲染图
- 动画预览录屏

前端已接入的 manifest：

- `public/models/agent/manifest.json`

## 6. GLB 技术规格

格式：

- `.glb`
- glTF 2.0
- Three.js `GLTFLoader` 可直接加载

预算：

- 主角色：5k-15k triangles
- 可见场景/工位：20k-40k triangles
- 主 GLB：3MB-8MB
- 贴图：1024 或 2048，PNG/WebP
- 材质数量尽量少
- 用 PBR，但避免过度复杂

模型要求：

- 原点清晰
- 比例统一
- 坐标轴正确
- mesh 命名清楚
- 需要 cast shadow / receive shadow 表现
- 移动端不能卡顿

## 7. 动画列表

MVP 必须有：

- `idle_stand`
- `idle_sleep`
- `idle_run`
- `walk`
- `work_typing`
- `work_image`
- `work_video`
- `thinking`
- `success`

第二阶段可加：

- `error_confused`
- `review_present`
- `drag_asset`
- `wave`
- `low_energy`

动画质量要求：

- 循环自然
- 不抽搐
- 不穿模
- 走路要有脚步节奏
- 工作动作要明显，不只是身体上下浮动

## 8. 前端状态映射

当前前端会优先加载：

```text
/models/agent/pokaya-agent.glb
```

状态映射：

- `idle` -> `idle_stand` / `idle_sleep` / `idle_run`
- `image` -> `work_image`
- `video` -> `work_video`
- `copy` -> `work_typing`
- `schedule` -> `work_typing`
- `command` -> `thinking`
- `done` -> `success`
- `error` -> `error_confused`

如果 GLB 不存在，前端显示 prototype fallback，避免页面坏掉。

## 9. 页面验收标准

桌面端：

- `/studio/agent` 加载后 2 秒内看到 3D 画面
- GLB 存在时显示正式模型，不显示 prototype
- idle/image/video/copy/schedule/command 至少能区分 4 个状态
- 动画循环自然

移动端：

- 角色不能被裁掉
- 状态标签和 CTA 不能重叠
- 画面高度不超过首屏太多
- 30fps 以上为可接受

品牌感：

- 一眼看出是 Pokaya
- 颜色符合 Pokaya 紫/粉主视觉
- 不能像通用免费模型

## 10. 当前工程状态

已完成：

- Three.js 场景容器
- GLB production loader
- Animation mixer
- 状态到动画名映射
- prototype fallback
- desktop/mobile responsive card
- 模型目录和 manifest

未完成：

- 正式 Blender 建模
- 正式 rig
- 正式动画
- 正式 GLB 交付

## 11. 100% Confidence 定义

这个项目的 100% confidence 必须同时满足：

- 前端加载真实 GLB 成功
- 所有 MVP 动画可播放
- desktop/mobile 截图通过
- 角色识别度通过
- 文件大小预算通过
- 任务状态切换通过
- 没有 GLB 时 fallback 不报错

在没有正式 `pokaya-agent.glb` 之前，只能达到工程接入 100%，不能达到最终视觉 100%。
