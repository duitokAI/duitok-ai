# Pokaya Agent 3D 吉祥物工作空间最终版 PRD

## 1. 背景

当前 Pokaya Agent 更像一个聊天面板：用户输入任务，Agent 返回文字，或者在后台调用工具。

这个交互能用，但缺少一个关键感受：

**用户没有看到“Pokaya Agent 正在替我干活”。**

腾讯 Marvis 给了一个很好的参考方向。它不是只做聊天框，而是把 Agent 包装成“数字打工人”，通过虚拟办公室、角色状态、工位切换，让用户感到 AI 真的在执行任务。

Pokaya 不应该复制 Marvis 的角色、办公室、黑色小马、小牛马设定，也不能复制腾讯视觉资产。

Pokaya 应该借鉴的是它背后的产品机制：

**用 3D mascot + 任务工位，把 Agent 的工作过程可视化。**

## 2. Marvis 调研结论

调研时间：2026-05-28。

参考资料：

- 腾讯 Marvis 官网：https://marvis.qq.com/
- 36Kr Europe Marvis 评测：https://eu.36kr.com/en/p/3821521992491012
- AI工具集 Marvis：https://ai-bot.cn/sites/77977.html
- AIGC工具导航 Marvis：https://www.aigc.cn/marvis
- GamerSky / 快科技报道：https://www.gamersky.com/news/202605/2143437.shtml

### 2.1 Marvis 是什么

Marvis 是腾讯应用宝团队推出的操作系统级个人 AI 助手。

它不是普通聊天机器人，而是能操作系统、理解本地文件、跨端控制、执行任务的 Agent 产品。

官网强调的能力包括：

- 本地大模型隐私模式，文件 0 上传。
- 手机远程操控电脑。
- 文件和图片智能搜索。
- 一句话修改电脑设置。
- 文档、表格、合同等文件理解和生成。
- 办公、游戏、追星、情报监控、生活管理等场景。

### 2.2 Marvis 的 Agent 架构

多篇资料提到 Marvis 是：

- 1 个主管 Agent。
- 5 个专家 Agent。

专家 Agent 分工大致包括：

- 文件管理。
- 系统运维。
- 应用操作。
- 网页交互。
- 信息搜索。

主管 Agent 负责理解需求、拆解任务、分发给专家 Agent。

### 2.3 Marvis 的视觉机制

最值得 Pokaya 学习的是 Marvis 的“可视化办公室”。

资料描述中，Marvis 有 6 个数字员工，形象是带角、戴围脖的黑色小马。应用里有一个虚拟办公室，可以看到不同 Agent 的状态。

空闲时：

- 有的会在工位打盹。
- 有的会去健身。
- 有的会拿咖啡走来走去。

工作时：

- Agent 会回到工位。
- 工位和状态会表现当前任务。
- 用户不只是看到 loading，而是看到“有人在工作”。

### 2.4 对 Pokaya 的启发

Pokaya 不需要做操作系统级助手，也不需要做 6 个 Agent。

Pokaya 需要借鉴的是：

- Agent 不是聊天框，而是一个“会工作的角色”。
- 空闲状态要有人格记忆点。
- 工作状态要和任务类型绑定。
- 任务执行过程要可视化，降低黑盒感。
- 视觉角色必须服务产品信任，而不是纯装饰。

## 3. 产品目标

把 Pokaya Agent 页面升级成一个 3D 动态工作空间。

用户看到这个页面时，要产生以下感受：

- “Pokaya Agent 住在我的工作台里。”
- “我给它任务后，它真的跑去对应工位工作。”
- “我能看出它现在是在做图片、视频、文案、排程，还是总控任务。”
- “这不是普通 chatbot，这是 TikTok Shop seller 的内容运营助理。”

一句话目标：

**用户丢一个产品任务，Pokaya mascot 就从休息区走到对应 3D 工位开始干活。**

## 4. 非目标

第一版不做以下内容：

- 不复制 Marvis 的小马、小牛马、黑色角色、围脖、办公室布局。
- 不做 6 个 Agent 团队。
- 不做完整 3D 游戏房间。
- 不让用户手动旋转 3D 场景。
- 不让 3D 加载影响 Agent 使用。
- 不替换现有聊天、快捷任务、工具调用、结果保存。

## 5. 核心概念

### 5.1 Pokaya Mascot 3D 工作空间

页面 Hero 区右侧放一个 3D mini workspace。

这个空间里有 Pokaya mascot。

mascot 不是永远站着不动，而是有两类状态：

1. 生活状态。
2. 工作状态。

### 5.2 空闲时

当 Agent 没有任务时，mascot 处于生活状态。

可以是：

- 躺在床上。
- 坐在沙发上。
- 在小跑步机上跑步。
- 伸懒腰。
- 喝咖啡。

第一版建议默认：

**躺床休息。**

原因：

- 记忆点强。
- 和“接到任务就上班”形成反差。
- 比单纯站着更有生命感。

### 5.3 工作时

当用户调用 Agent 去做任务时，mascot 进入 mission mode。

它应该：

- 从休息区起身。
- 走到对应工位。
- 坐下或站到设备前。
- 工位屏幕和道具切换成对应任务类型。

第一版如果动画成本太高，可以先用镜头切换 / mascot 滑动 / 淡入淡出模拟“走过去”。

最终版目标是：

**3D mascot 真的会走路。**

## 6. 工位设计

最小可用版本需要 5 个工作模式。

### 6.1 Idle Room 空闲房间

触发条件：

- `state.agentBusy === false`

视觉：

- mascot 躺床或坐沙发。
- 旁边有小电脑、咖啡杯或手机。
- 氛围轻松，不紧张。
- 浮动小卡片显示暂无任务。

文案：

- 中文：`下班中` / `丢一个产品任务给我。`
- BM：`Rehat dulu` / `Bagi saya tugasan produk.`
- EN：`Off duty` / `Give me a product mission.`

### 6.2 Image Station 图片工位

触发条件：

用户任务涉及：

- 图片。
- 产品图。
- Avatar。
- 素材。
- Thumbnail。
- Product shot。
- Pokaya Image。

视觉：

- mascot 到图片制作工位。
- 屏幕显示图片画布。
- 桌面有色板、灯光、相机、产品卡片。
- 浮动卡片：`Product Shot`、`Avatar`、`Thumbnail`。

文案：

- 中文：`图片工位` / `正在制作产品视觉...`
- BM：`Stesen Image` / `Sedang bina visual produk...`
- EN：`Image Station` / `Building product visuals...`

### 6.3 Video Station 视频工位

触发条件：

用户任务涉及：

- 视频。
- 短视频。
- Pokaya Video。
- Seedance。
- Veo。
- Sora。
- Motion。
- Reel。
- Scene。

视觉：

- mascot 到视频剪辑工位。
- 屏幕显示时间线、playhead、分镜卡。
- 旁边有竖屏视频预览。
- 浮动卡片：`Scene`、`Motion`、`CTA`。

文案：

- 中文：`视频工位` / `正在剪场景和动作...`
- BM：`Stesen Video` / `Sedang susun scene dan motion...`
- EN：`Video Station` / `Cutting scenes and motion...`

### 6.4 Copy Station 文案工位

触发条件：

用户任务涉及：

- Hook。
- Script。
- Caption。
- Story。
- Clone。
- 文案。
- 脚本。
- 标题。
- UGC Script。

视觉：

- mascot 到写作工位。
- 屏幕显示多行文案和高亮 hook。
- 桌上有便签、文档、笔。
- 浮动卡片：`Hook`、`UGC Script`、`Caption`。

文案：

- 中文：`文案工位` / `正在写 hook 和 caption...`
- BM：`Stesen Copy` / `Sedang tulis hook dan caption...`
- EN：`Copy Station` / `Writing hooks and captions...`

### 6.5 Schedule Station 排程工位

触发条件：

用户任务涉及：

- Posting plan。
- Schedule。
- Calendar。
- Queue。
- 7 天内容计划。
- 发布。
- 排程。

视觉：

- mascot 到排程工位。
- 屏幕或看板显示日历格子。
- 有多个 content slots。
- 浮动卡片：`Day 1`、`Day 3`、`Post Queue`。

文案：

- 中文：`排程工位` / `正在安排发布计划...`
- BM：`Stesen Posting` / `Sedang susun posting plan...`
- EN：`Schedule Station` / `Arranging your posting plan...`

### 6.6 Command Desk 总控工位

触发条件：

- 用户任务无法明确归类。
- Agent 正在做综合判断、创建项目、调用多个工具。

视觉：

- mascot 到中央控制台。
- 屏幕显示工具卡片、进度条、项目状态。
- 浮动卡片：`Project`、`Research`、`Next Action`。

文案：

- 中文：`总控工位` / `正在写、检查、调用工具...`
- BM：`Command Desk` / `Tulis, semak, dan panggil tools...`
- EN：`Command Desk` / `Writing, checking, and calling tools...`

## 7. 页面结构

### 7.1 桌面端

Agent 页面 Hero 区：

- 左侧：标题、说明、人工客服按钮。
- 右侧：3D mascot workspace canvas。

Hero 下方：

- Quick Actions。
- Chat Panel。

### 7.2 移动端

移动端顺序：

1. 标题。
2. 3D mascot workspace。
3. Quick Actions。
4. Chat Panel。

移动端不能横向溢出。

3D canvas 不允许挡住输入框。

## 8. 快捷任务

快捷任务要刻意映射到不同工位。

建议第一版：

- `Plan 7 days of TikTok content` -> Schedule Station
- `Generate product video idea` -> Video Station
- `Decode competitor hook` -> Copy Station
- `Create product image angle` -> Image Station

后续按 BM / 中文 / EN 本地化。

## 9. 模式识别逻辑

最小可用版本可以根据用户最近一条消息判断模式。

建议逻辑：

```js
function agentWorkMode(text = "") {
  const value = text.toLowerCase();
  if (/video|reel|motion|seedance|veo|sora|视频|短视频/.test(value)) return "video";
  if (/image|avatar|asset|photo|thumbnail|图片|头像|素材/.test(value)) return "image";
  if (/plan|schedule|calendar|posting|7 days|7天|排程|发布|计划/.test(value)) return "schedule";
  if (/hook|script|caption|copy|story|clone|文案|脚本|标题/.test(value)) return "copy";
  return "command";
}
```

第二阶段应从 `/api/agent` 返回的真实 tool action 判断，不只依赖文本关键词。

## 10. 3D 技术方案

### 10.1 技术栈

使用 Three.js。

原因：

- 当前项目是 Vite 前端，接 Three.js 成本低。
- 3D 场景可控，不需要引入大型游戏引擎。
- 后续可接 GLB 角色模型和动画。

### 10.2 文件规划

新增：

- `src/agent3d.js`

职责：

- 初始化 Three.js scene。
- 创建 camera、lights、renderer。
- 创建 3D 房间、工位、道具。
- 挂载 mascot。
- 根据 mode 更新场景。
- 清理 renderer、animation frame、resize listener。

修改：

- `src/main.js`
  - 在 Agent Hero 中添加：
    `<div class="agent-3d-stage" data-agent-3d-stage></div>`
  - 添加 `data-agent-mode="idle|image|video|copy|schedule|command"`。
  - 保留现有 chat、quick actions、support。

- `src/styles.css`
  - 定义 `.agent-3d-stage` 尺寸。
  - 定义 WebGL fallback。
  - 定义移动端比例。

依赖：

- 安装 `three`。

暂不引入：

- GSAP。
- React Three Fiber。
- 大型动画库。

## 11. 3D 渲染要求

必须满足：

- 使用 Orthographic Camera。
- 固定视角，不让用户旋转。
- 有明确 3D 深度，不是平面 CSS。
- renderer pixel ratio capped at 1.5。
- 画面在 Chromium 里不能 blank。
- 支持窗口 resize。
- rerender 后不能重复生成多个 canvas。

动效要求：

- Idle 有轻微呼吸 / 睡觉 / 跑步循环。
- Working 有屏幕扫描、任务卡浮动、mascot 操作动作。
- `prefers-reduced-motion` 时关闭大部分动画。

## 12. Mascot 资产方案

### 12.1 最小可用版本方案

最小可用版本可以先用现有：

- `/pokaya-mascot-transparent.png`

做法：

- 放进 Three.js 作为 `THREE.Sprite` 或 textured plane。
- 让它在 3D 空间中移动、转向、上下浮动。
- 其他道具用 Three.js primitives 搭建。

这不是最终形态，但可以快速验证：

- 3D 工作空间是否有感觉。
- 工位切换是否有效。
- 用户是否喜欢“mascot 上班”的设定。

### 12.2 正式 3D Mascot 方案

最终应该制作真正 3D mascot。

格式：

- `public/pokaya-mascot-3d.glb`

需要骨骼和动画：

- `idle_sleep`
- `idle_run`
- `walk_to_station`
- `sit_typing`
- `image_work`
- `video_edit`
- `copy_write`
- `schedule_plan`
- `thinking`
- `celebrate`

这才是你说的“会走路的那种感觉”。

### 12.3 阶段建议

第一阶段：

- Three.js 3D 房间。
- 现有 mascot PNG 作为 billboard。
- 工位切换。

第二阶段：

- 制作 GLB mascot。
- 加走路、坐下、打字、跑步、睡觉动画。

第三阶段：

- 加更多工位细节。
- 如果产品需要，再加专家小 mascot。

## 13. Fallback

如果 WebGL 不可用：

- 显示静态 mascot card。
- 显示当前工位文案。
- 不影响 Agent 输入和输出。

如果 3D 资源加载慢：

- 先显示 skeleton / fallback。
- Chat 和 Quick Actions 仍然可用。

## 14. 验收标准

### 功能

- `/studio/agent` 可直接打开 Agent 页面。
- 页面包含 3D canvas。
- 空闲时显示 mascot 休息状态。
- 图片任务进入 Image Station。
- 视频任务进入 Video Station。
- 文案任务进入 Copy Station。
- 排程任务进入 Schedule Station。
- 未归类任务进入 Command Desk。
- 现有 Agent API 调用正常。
- Chat history 正常。
- Quick Actions 正常。
- Support button 正常。
- Language switch 正常。

### 视觉

- 3D canvas 不 blank。
- 桌面端 Hero 左右平衡。
- 移动端不横向溢出。
- 画面有明确 3D 空间感。
- Pokaya mascot 品牌识别清楚。
- 不像 Marvis 的小马/小牛马。

### 性能

- Agent 页面不因 3D 初始化卡住。
- 切换页面后 renderer 能清理。
- 页面 rerender 不重复叠 canvas。
- `npm run build` 通过。

### QA

必须截图检查：

- Desktop idle。
- Desktop Image Station。
- Desktop Video Station。
- Desktop Copy Station。
- Desktop Schedule Station。
- Mobile idle。

必须做 canvas pixel check：

- 确认 canvas 非空白。

## 15. 开放问题

需要你最终拍板：

- 最小可用版本是否接受 2D mascot billboard 放在 3D 场景里？
- 还是第一版就必须等真正 GLB mascot？
- Idle 默认是躺床，还是跑步？
- 工位是一个房间切换道具，还是多个小房间？
- mascot 到工位是瞬移/镜头切换，还是必须走路？

我的建议：

- 最小可用版本接受 billboard，但必须是 Three.js 3D 场景。
- 正式版再做 GLB mascot。
- Idle 默认躺床。
- 工位先做一个房间切换道具。
- 走路动画放到 GLB 阶段。

## 16. 推荐最终路线

### 阶段 1：3D 最小可用版本

目标：

快速上线 3D 工作空间。

内容：

- Three.js mini room。
- 当前 Pokaya mascot PNG 做 billboard。
- Idle Room。
- Image / Video / Copy / Schedule / Command 工位。
- 文案和状态切换。
- fallback。

### 阶段 2：真正的 3D mascot

目标：

实现“会走路、会坐下、会工作”的 mascot。

内容：

- 制作 `pokaya-mascot-3d.glb`。
- 加骨骼。
- 加 walk、sleep、run、typing、editing 等动画。
- 从 billboard 替换成 GLB model。

### 阶段 3：Agent 团队化

目标：

如果 Pokaya Agent 后续工具很多，再加入专家角色。

可能角色：

- Hook Writer。
- Video Editor。
- Image Maker。
- Posting Planner。
- Competitor Decoder。

但第一版不要做团队。

第一版只做一个 Pokaya mascot。
