# Pokaya Agent Assistant 消息布局回归修复 PRD

## 1. 背景

Pokaya Agent 聊天区的 assistant 消息布局已经多次修复，但线上仍反复出现同类问题：

- 机器人头像只露出一部分，像被上方容器裁掉。
- assistant 回复文字顶部被遮挡或切掉，只能看到下半截。
- 头像下面残留一块粉色/白色背景块，像旧卡片背景没有清干净。
- 消息内容和头像没有稳定对齐，长回复时更容易暴露问题。

这说明问题不是单个 `margin`、`padding` 或 `overflow` 没调好，而是 Agent 消息行缺少一个稳定的布局契约。当前 CSS 里存在多段 late override、多个 `!important`、旧卡片样式和新“无卡片消息流”样式混在一起，导致每次修一个点，另一个覆盖层又把布局打回去。

本 PRD 目标是把这个问题从“继续补丁式 CSS 修修补补”升级为“建立可验收、可回归测试、可长期维护的 Agent 消息布局系统”。

## 2. 问题定义

### 2.1 截图现象

截图中第一条 assistant 消息出现明显视觉破损：

1. 头像顶部被裁切，图标没有完整显示在消息行内。
2. 回复第一行文字被上方遮住，只看到局部文字。
3. 头像和正文不在同一个稳定基线里。
4. assistant 消息行看起来像被父级 `overflow`、旧背景、负位移或 sticky 区域切割。

### 2.2 用户感受

用户看到的是：

- “这个问题修了很多次还是没好。”
- “Agent 页面不稳定，像上线前没检查。”
- “我不知道现在到底是代码没修，还是云部署没生效。”

这会直接削弱 Pokaya Agent 的可信度。Agent 是产品主入口之一，首屏聊天消息破版属于 P0 级视觉问题。

## 3. 根因假设

需要在执行阶段逐项验证，但当前最可能的根因是以下组合：

### 3.1 CSS 覆盖链过长

`src/styles.css` 中 Agent 相关样式分散在多个位置，且大量使用：

- `.studio-shell .agent-chat-shell.agent-page-panel ...`
- `.studio-shell .agent-page-panel ...`
- 多段重复 selector
- 大量 `!important`

结果是开发者以为改到了最终样式，但后面的 override 可能又覆盖一次。

### 3.2 旧卡片模型和新消息流模型混用

早期 `.agent-thread article` 是卡片：

- 有 border
- 有 background
- 有 box-shadow
- 有 padding
- 有 max-width

后期 assistant 回复想改成“头像 + 透明正文”的消息流，但没有彻底移除外层旧卡片模型。于是出现：

- 外层 article 背景残留
- 内层 `.agent-message` 透明
- 头像阴影和旧背景叠在一起
- 某些父级 overflow 裁切阴影或头像

### 3.3 缺少固定测试用例

现在修复主要靠人工看当前账号里的某一条消息。但 Agent 消息内容、语言、历史状态、运行状态会变化，导致每次看到的 DOM 不完全一致。

必须建立固定 fixture，包含：

- 中文长欢迎语
- 多段文字
- 列表
- tool/run card
- feedback buttons
- pending/running 状态
- 桌面和移动端视口

没有 fixture，就无法判断“这次真的修好了”。

### 3.4 缺少线上部署验证口径

本地修复、构建通过、推送成功，不等于云端视觉已经生效。还需要确认：

- 云部署是否已完成
- 当前浏览器是否拿到最新 CSS bundle
- 是否存在缓存旧 CSS
- 线上和本地账号消息状态是否一致

否则用户会继续看到旧问题，开发者以为已经修好。

## 4. 目标

### 4.1 产品目标

让 Agent assistant 消息在所有常见状态下稳定显示：

- 头像完整可见。
- 回复文字不被裁切。
- 头像与正文顶部自然对齐。
- 不出现旧背景块、白块、粉块、阴影残留。
- 长回复、多段回复、中文回复、英文回复都稳定。

### 4.2 工程目标

建立一个可维护的 Agent 消息布局系统：

- 一个明确的 CSS source of truth。
- 删除重复和冲突 override。
- 给 assistant/user/thinking/run card 分清布局职责。
- 增加视觉回归测试，防止以后再次被改坏。
- 增加云端验收步骤，避免“本地好了、线上没好”的误判。

## 5. 非目标

本期不做：

- 不重写 Agent 后端。
- 不改变 Agent 工具调用逻辑。
- 不优化 Agent 回复文案。
- 不重新设计整个 Studio。
- 不改侧边栏、计费、Image Studio 等无关页面。

## 6. 设计原则

1. **布局先于装饰**：先保证头像、正文、卡片边界稳定，再谈阴影和质感。
2. **一个组件一个职责**：`article.assistant` 负责行布局，头像负责头像视觉，正文负责文本排版，不互相承担背景和间距。
3. **少用 late override**：不要继续在 CSS 文件末尾加无限 `!important` 补丁。
4. **测试先固定场景**：必须用固定 fixture 验证，而不是靠当前聊天历史碰运气。
5. **线上才算完成**：云部署截图通过才算真正完成。

## 7. 需求范围

### 7.1 Assistant 消息行布局契约

`article.assistant` 必须是稳定的两列 grid：

```css
grid-template-columns: 42px minmax(0, 1fr);
column-gap: 16px;
align-items: start;
```

要求：

- `article.assistant` 不保留旧卡片背景。
- `article.assistant` 不保留旧 border。
- `article.assistant` 不保留旧 box-shadow。
- `article.assistant` 不使用会裁切头像的 `overflow: hidden`。
- `article.assistant` 不使用负 margin 或 transform 修位置。

验收：

- 头像完整显示在第一列。
- 正文永远从第二列开始。
- 正文不会滑到头像下面。

### 7.2 头像布局契约

`.agent-avatar-badge` 必须有固定尺寸：

```css
width: 42px;
height: 42px;
min-width: 42px;
min-height: 42px;
box-sizing: border-box;
overflow: hidden;
display: grid;
place-items: center;
```

要求：

- 头像不能被父级裁切。
- 头像内部 icon 居中。
- 阴影不影响行高判断。
- 不依赖 `position: absolute`。
- 不依赖 `transform` 修正位置。

验收：

- icon 在头像方块中心。
- 头像顶部和左侧没有被切。
- 头像下方不出现旧背景残块。

### 7.3 正文布局契约

`.agent-message` 必须只负责文本内容：

- 不承担整行背景。
- 不承担头像间距。
- 不使用会导致裁切的固定高度。
- 中文、英文、粗体、列表都不能被裁掉。

建议：

```css
line-height: 1.55;
font-size: 15px;
padding-top: 1px;
min-width: 0;
overflow: visible;
```

验收：

- 第一行中文不会被上方裁切。
- 多段文本不会重叠。
- 长词、英文模型名、中文项目名都不会撑破布局。

### 7.4 父容器裁切检查

必须检查以下父级是否裁切消息：

- `.agent-thread`
- `.agent-chat-shell.agent-page-panel`
- `.agent-page-panel`
- `.agent-page`
- `.workspace`

原则：

- 只有滚动容器 `.agent-thread` 可以 `overflow-y: auto`。
- 消息行自身不能因为 `contain` 或 `overflow` 裁切内容。
- 若使用 `contain: layout paint style`，必须确认不会裁掉头像阴影和文字顶部。

验收：

- 滚动正常。
- 第一条消息贴近顶部时不被裁切。
- 最后一条消息靠近输入框时不被覆盖。

## 8. 工程实施方案

### Phase 1：CSS 审计与去重

任务：

1. 搜索所有 Agent 消息相关 selector。
2. 列出重复定义：
   - `article.assistant`
   - `.agent-avatar-badge`
   - `.agent-message`
   - `.agent-run-card`
   - `.agent-feedback-row`
3. 确认最终生效顺序。
4. 删除或合并冲突规则。

交付：

- CSS 中只保留一组“Agent assistant message layout lock”。
- 不再出现多段互相覆盖的 assistant grid 定义。

### Phase 2：建立固定测试 fixture

新增一个仅开发/测试使用的 Agent UI fixture。

可选方案：

1. URL query：`/studio?agentFixture=assistant-layout`
2. localStorage fixture：开发脚本注入固定 `pokaya-agent-messages`
3. 独立测试页面：`/dev/agent-message-fixture`

推荐方案：

使用 URL query。原因：

- 不污染用户真实聊天记录。
- Playwright 容易打开。
- 云端也可以临时验证。

fixture 内容：

```js
[
  {
    role: "assistant",
    content: "你好！我是 Pokaya Agent，你在 Pokaya AI Studio 里的智能助手。\\n\\n我可以帮你做这些事情：研究趋势、创建内容方案、生成产品图和视频、制作周内容计划。\\n\\n目前你的工作区里有几个内容方向，像是 Bleu de Chanel 洁面啫喱、雪花秀等。"
  }
]
```

验收：

- 打开 fixture 后稳定出现和截图类似的长中文 assistant 消息。
- 不需要真实登录、不需要真的调用 Agent 后端。

### Phase 3：视觉回归测试

新增 Playwright 视觉测试。

测试视口：

- Desktop：1440 x 900
- Laptop：1280 x 800
- Mobile：390 x 844

测试场景：

1. assistant 首条长中文欢迎语。
2. assistant 回复 + feedback buttons。
3. assistant 回复 + run card。
4. user 消息和 assistant 消息混排。
5. 贴近顶部滚动位置。

自动断言：

- `.agent-avatar-badge` 高度等于 42px。
- `.agent-avatar-badge` 顶部不小于 `article.assistant` 顶部。
- `.agent-message` 的 `x` 坐标大于 avatar 右边界。
- `.agent-message` 的 `y` 坐标不小于 `article.assistant` 顶部。
- `article.assistant` computed background 为透明。
- `article.assistant` computed border 为 none/0。

视觉截图断言：

- 对 fixture 区域截图。
- 如果头像被裁切、文字顶部缺失、背景块残留，测试失败。

### Phase 4：线上验收流程

每次修复后必须执行：

1. `npm run build`
2. push 到远端
3. 等待云部署完成
4. 打开线上 fixture URL
5. 截图 desktop + mobile
6. 对比 PRD 验收标准

完成标准：

- 不能只说“已 push”。
- 必须报告线上 commit hash。
- 必须说明云端 fixture 截图是否通过。

## 9. 验收标准

### P0 验收

- 头像完整显示，没有任何裁切。
- 第一行文字完整显示，没有被上方遮挡。
- 头像下方不出现粉色/白色残块。
- assistant 外层不再出现旧卡片背景。
- 长中文消息不会和头像重叠。

### P1 验收

- feedback buttons 位于正文下方第二列，不跑到头像下面。
- run card 位于正文下方第二列，不撑破整行。
- 移动端头像和正文仍然两列显示，必要时 column gap 缩小。
- 输入框不会盖住最后一条消息。

### P2 验收

- CSS 中 Agent assistant message layout 相关规则集中，后续开发者容易找到。
- 新增 fixture 可以被后续截图测试复用。
- 线上和本地验证步骤写入 handoff 或测试说明。

## 10. 回归测试用例

### Case 1：中文长欢迎语

输入：

```text
你好！我是 Pokaya Agent，你在 Pokaya AI Studio 里的智能助手。

我可以帮你做这些事情：研究趋势、创建内容方案、生成产品图和视频、制作周内容计划。

目前你的工作区里有几个内容方向，像是 Bleu de Chanel 洁面啫喱、雪花秀等。
```

预期：

- 头像完整。
- 第一行完整。
- “Bleu de Chanel” 不造成横向溢出。

### Case 2：多段 + 列表

预期：

- 列表缩进在正文列内。
- bullet 不跑到头像列。

### Case 3：带 feedback buttons

预期：

- `有用 / 不准` 位于正文列。
- 按钮不贴头像。

### Case 4：带 run card

预期：

- run card 位于正文列。
- completed 状态不恢复旧大卡片背景。

### Case 5：移动端

预期：

- 头像仍完整。
- 正文不被挤成一字一行。
- 消息行不会横向滚动。

## 11. 风险与防护

### 风险 1：删除旧 CSS 影响其他 Agent 状态

防护：

- 用 fixture 覆盖 assistant、thinking、run card、feedback。
- 不改 user 消息样式，除非测试发现被影响。

### 风险 2：线上缓存导致用户仍看到旧 CSS

防护：

- 确认 Vite build 产物 hash 已变化。
- 线上部署后 hard reload 验证。
- 如果仍旧，检查 CDN/浏览器缓存。

### 风险 3：fixture 泄露到普通用户

防护：

- fixture 只在 `NODE_ENV !== "production"` 生效，或只允许 admin/dev query。
- 如果需要线上验证，用受控 query 且不展示敏感数据。

## 12. 推荐文件改动

预计涉及：

- `src/styles.css`
  - 合并 Agent assistant 相关 CSS。
  - 删除重复/冲突 override。

- `src/main.js`
  - 增加 Agent layout fixture 入口，或增加测试环境消息注入逻辑。

- `scripts/`
  - 可新增视觉检查脚本，例如 `scripts/check-agent-message-layout.mjs`。

- `docs/`
  - 保留本 PRD 作为后续执行依据。

## 13. 执行优先级

1. 先做 CSS 审计与去重。
2. 再加固定 fixture。
3. 再做截图测试。
4. 最后做云端验收。

不要再直接追加一段新的末尾 CSS 补丁作为唯一修复方式。这个问题已经证明补丁式修复不够稳定。

## 14. 成功标准

本任务完成后，应满足：

- 用户截图里的破版在 fixture 和真实 Agent 页面都不再出现。
- 后续任何 Agent UI 改动如果破坏头像/正文布局，测试会失败。
- 开发者能清楚知道 assistant 消息布局由哪一段 CSS 控制。
- 云端部署验证明确，不再出现“本地修了但线上还是坏”的沟通断点。
