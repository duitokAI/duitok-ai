# Pokaya AI Codex 当前交接文档

重启提示词：

```text
We are continuing from docs/codex-handoffs/current-state.md. Read this handoff first, inspect the current repo state, verify what still applies, then continue without relying on old chat history.
```

## 项目位置

- 本地路径：`/Users/zixian/Documents/DuitTok AI`
- 当前分支：`main`
- 远端：`origin/main`
- 应用结构：Vite 前端 + Express 服务端，主服务文件是 `server.mjs`
- 部署：Render Web Service `pokaya-ai`
- 本地启动：`npm run dev`
- 构建验证：`npm run build`

## 必须遵守的项目规则

- 所有 PRD、产品需求文档、UX 优化方案、执行 PRD、设计/spec 文档默认用中文写。
- 执行过代码、UI、配置或文档改动后，必须 commit 并 push 到远端。
- 只提交当前任务相关文件，不要把无关改动混进 commit。
- 用户主要看云端部署结果，不只看本地预览。
- 不要 revert 用户或其他 agent 的改动，除非用户明确要求。

## 当前优化状态

- Codex 本地维护已执行成功。
- 旧 session 候选已归档到 0。
- Codex logs 已从约 386.7MB 降到约 14MB。
- 项目根目录的 QA 截图、录屏和构建产物已移到项目外归档：
  - `/Users/zixian/Documents/Codex/project-artifacts/pokaya-ai/2026-06-02-cleanup`
- 项目目录体积已从约 623MB 降到约 453MB。
- `output/`、`dist/`、`node_modules/` 都是本地/构建产物，不应提交。

## 当前工作区基线

开始任何新任务前先运行：

```bash
git status --short --branch
```

理想状态应是：

```text
## main...origin/main
```

如果出现未提交改动，先判断是否与当前任务有关。无关改动不要碰。

## 常用命令

```bash
npm run build
python3 /Users/zixian/.codex/skills/keep-codex-fast/scripts/keep_codex_fast.py
git status --short --branch
```

## UI 任务固定流程

1. 先读现有 DOM/CSS/组件结构，不要凭空改。
2. 明确这次只改哪个区域，避免牵连其他页面。
3. 改完后运行 `npm run build`。
4. 需要视觉判断时，用浏览器看 desktop 和 mobile。
5. 对照用户截图和参考图检查：对齐、间距、文字是否溢出、按钮是否可点、hover/收起状态是否自然。
6. 只 stage 当前任务相关文件。
7. commit 后 push 到 `origin/main`。

## 容易踩坑

- 长聊天会让 Codex 误判上下文，复杂任务应开新 chat 并先读本文件。
- 根目录不要堆 QA 截图、录屏、临时 preview 图。
- `dist/` 可随时通过 `npm run build` 再生成，不应依赖旧构建产物。
- `server.mjs` 很大，改后要特别注意 API、媒体代理、状态读写和内存风险。
- Render `starter` 内存有限，媒体代理、图片/视频 buffer、全量 JSON state 都可能造成内存尖峰。
- UI 任务不要只改 CSS 后直接结束，必须验证实际画面。

## 下次任务建议开场

```text
先读 docs/codex-handoffs/current-state.md 和 AGENTS.md，然后检查 git status。接下来只处理我这次提出的目标，不要碰无关文件。完成后 build、验证、commit、push，并告诉我 commit hash。
```

