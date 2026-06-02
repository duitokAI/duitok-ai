# Codex 聪明和快速工作流优化

## 目标

让 Codex 在 Pokaya AI 项目里更稳定、更快、更少误判。这里的“聪明”主要来自三个条件：

- 上下文干净：不要让旧聊天和无关文件污染判断。
- 任务边界清楚：每次只做一个明确目标。
- 验证闭环完整：改完必须检查，而不是只写代码。

## 推荐使用方式

### 1. 大任务开新 chat

以下情况建议直接开新 Codex chat：

- UI 连续改了很多轮仍然不满意。
- 当前 chat 已经超过一个功能周期。
- Codex 开始忘记你刚刚说的约束。
- 出现“改 A 坏 B”的循环。

新 chat 第一句建议：

```text
先读 docs/codex-handoffs/current-state.md 和 AGENTS.md，然后检查 git status。只处理我这次的新目标，不要继承旧 chat 的隐藏假设。
```

### 2. UI 任务标准指令

建议这样描述 UI 任务：

```text
只优化 [页面/组件名称] 的 [具体区域]。
参考图是 A，当前图是 B。
目标：...
不要改：...
完成后请本地验证 desktop/mobile，build，通过后 commit/push。
```

### 3. 代码任务标准指令

建议这样描述代码任务：

```text
只修 [具体 bug/接口/功能]。
先定位原因，再改最小范围。
不要重构无关模块。
完成后跑相关检查，commit/push，并报告 commit hash。
```

### 4. PRD 任务标准指令

PRD 默认中文。建议这样说：

```text
写一份中文 PRD，只做规划，不执行。
包含：问题、目标、用户路径、功能需求、状态/边界、验收标准、执行步骤。
```

如果要执行 PRD，再明确说“执行 PRD”。

## 本地维护策略

每周运行一次只读体检：

```bash
python3 /Users/zixian/.codex/skills/keep-codex-fast/scripts/keep_codex_fast.py
```

只在以下情况考虑手动 apply：

- 旧 session 候选明显增多。
- logs 超过 200MB。
- Codex 明显变慢或经常误判。
- 已经给重要旧 chat 做好 handoff。
- Codex app 已完全退出。

手动 apply 命令：

```bash
python3 /Users/zixian/.codex/skills/keep-codex-fast/scripts/keep_codex_fast.py --apply --archive-older-than-days 10 --worktree-older-than-days 7
```

## 项目目录维护策略

- QA 截图、录屏、Playwright 输出统一放 `output/`。
- 长期归档放到项目外：`/Users/zixian/Documents/Codex/project-artifacts/pokaya-ai/`。
- 不要把 `dist/`、`node_modules/`、`output/` 提交。
- 做完大 UI 任务后，可以把临时截图搬出 repo。

## 判断 Codex 是否“变笨”的信号

- 忘记 AGENTS.md 的 commit/push 规则。
- 没有先看代码就开始猜。
- 多次改错同一 UI 细节。
- 反复碰无关文件。
- build 没跑就说完成。
- 长回答但没有实际执行。

出现以上情况时，优先开新 chat，并让它先读 `docs/codex-handoffs/current-state.md`。

