# 图片生成结果批量选择 PRD

## 1. 背景

当前 Image 生成结果卡片已经支持单张图片的右侧快捷操作，例如保存 Avatar、保存 Product、下载、删除。用户在一次生成多张图、或历史结果较多时，经常需要对多张图片做同一种操作：

- 批量下载多张图片。
- 批量删除不需要的图片。
- 批量保存到 Attachments，作为 Product / Avatar reference。
- 后续批量加入排期、批量复用到 Agent 或 Auto Post。

现有右侧悬浮操作栏适合单张图片，但不适合多选。用户需要逐张操作，成本高，也容易误删或漏选。

## 2. 目标

在图片生成结果卡片上增加轻量的多选入口：

当鼠标 hover 到图片上时，卡片左上角出现一个小选择框。用户点击后进入多选模式，可以连续选择多张图片，并在页面上方或底部出现批量操作栏。

目标是让“生成结果”从单张操作升级为素材管理体验。

## 3. 用户故事

### 3.1 批量下载

作为 TikTok Shop seller，我一次生成了 4 张产品图，希望快速选中其中 3 张，一次性下载，而不是逐张点下载。

### 3.2 批量删除

作为内容创作者，我生成了很多测试图，希望选中不满意的几张后一次删除，并在删除前看到确认弹窗。

### 3.3 批量保存为参考素材

作为运营用户，我生成了一组人物或产品图，希望选中其中几张保存到 Attachments，后续作为 Avatar / Product reference 使用。

## 4. 范围

### 4.1 本期必须实现

- 图片卡片 hover 时左上角显示选择框。
- 点击选择框后，该图片进入 selected 状态。
- 进入 selected 状态后，所有图片卡片左上角都持续显示选择框，不再只在 hover 时显示。
- 支持选择多张图片。
- 支持取消单张选择。
- 支持清空全部选择。
- 显示已选择数量。
- 出现批量操作栏。
- 批量下载。
- 批量删除，必须二次确认。

### 4.2 本期可选

- 批量保存到 Attachments。
- 批量保存为 Product reference。
- 批量保存为 Avatar reference。
- 全选当前页面可见结果。
- Shift 点击连续选择。

### 4.3 暂不实现

- 跨项目批量选择。
- 跨分页批量选择。
- 批量重新生成。
- 批量发布到 TikTok。
- 批量编辑 prompt。

## 5. 交互设计

### 5.1 默认状态

图片卡片默认不显示左上角选择框，避免画面过于拥挤。

当鼠标 hover 到图片卡片时：

- 左上角出现一个小方形选择框。
- 选择框尺寸建议为 28px × 28px。
- 位置建议为 top: 14px，left: 14px。
- 背景使用半透明深色或毛玻璃，保证在浅色/深色图片上都可见。
- 未选中时显示空框。
- hover 选择框时边框变亮。

### 5.2 选中状态

用户点击选择框后：

- 当前卡片进入 selected 状态。
- 左上角选择框显示 check icon。
- 图片卡片出现轻量选中描边，建议使用品牌紫色。
- 图片上增加非常轻的 overlay，不遮挡内容。
- 右侧单张操作栏仍可保留，但视觉层级要低于 selected 状态。

### 5.3 多选模式

只要至少选中 1 张图片，页面进入多选模式：

- 所有图片卡片左上角都显示选择框。
- 未选中的卡片也显示空选择框，方便继续选择。
- 页面显示批量操作栏。
- 用户点击已选图片的选择框，可以取消选择。
- 用户点击 “Clear” 或关闭按钮退出多选模式。

### 5.4 批量操作栏

建议位置：图片墙底部 sticky bar，或图片墙顶部固定操作条。

推荐文案：

```text
3 selected
[Download] [Save to Attachments] [Delete] [Clear]
```

按钮优先级：

- Download：主操作，白色/浅色按钮。
- Save to Attachments：次级操作，可本期后置。
- Delete：危险操作，粉红/红色。
- Clear：文本按钮或 icon。

### 5.5 批量删除确认

点击 Delete 后弹出确认弹窗：

```text
DELETE
删除 3 个生成结果？

只会删除当前项目里的生成结果。已经保存到 Attachments 的 Product / Avatar 会继续保留。

[取消] [删除]
```

确认后：

- 乐观更新 UI：立即从当前图片墙移除选中项。
- 如果接口失败，恢复项目数据或提示用户刷新。
- Toast：`已删除 3 个生成结果。`

### 5.6 批量下载

点击 Download 后：

- 如果选中 1 张：直接下载该图片。
- 如果选中多张：建议逐张触发下载，或打包为 zip。
- MVP 可以先逐张下载，后续再优化 zip。

Toast：

```text
正在下载 3 张图片。
```

## 6. 视觉规范

### 6.1 选择框

- 尺寸：28px × 28px。
- 圆角：8px。
- 未选中背景：rgba(0, 0, 0, 0.36) + backdrop blur。
- 未选中边框：rgba(255, 255, 255, 0.56)。
- 选中背景：#6f1d82 或当前品牌紫色。
- 选中 icon：white check，建议使用 lucide `check`。

### 6.2 选中卡片

- 外描边：2px 品牌紫色。
- 内阴影：轻量，不要压暗图片主体。
- overlay：rgba(42, 6, 51, 0.08)。

### 6.3 批量操作栏

- 高度：56px - 64px。
- 圆角：18px - 24px。
- 背景：白色/浅粉毛玻璃，和当前 Image composer 风格一致。
- 阴影：轻，不要像 modal。
- 移动端：底部 sticky，占满宽度，按钮可横向滚动。

## 7. 状态设计

需要新增前端状态：

```js
selectedResultIds: []
```

派生状态：

```js
const isBulkSelecting = selectedResultIds.length > 0;
const selectedResults = results.filter(item => selectedResultIds.includes(item.id));
```

建议 action：

```js
toggleResultSelection(resultId)
clearResultSelection()
selectAllVisibleResults()
bulkDeleteSelectedResults()
bulkDownloadSelectedResults()
```

## 8. 行为规则

- 点击图片主体仍然打开 result detail / preview，不默认选中。
- 点击左上角选择框才切换选择。
- 已进入多选模式后，可以考虑点击图片主体也切换选择，但需要避免和打开详情冲突。MVP 建议仍然只点选择框。
- 删除后自动清空 selection。
- 切换 Project / Tab / Filter 时自动清空 selection。
- 生成新图片插入图片墙时，不自动选中新图片。
- 失败结果卡片不参与批量下载，但可以参与批量删除。
- 视频结果如果同一网格内展示，选择框可显示；批量下载需按媒体类型处理。

## 9. 空状态和边界

### 9.1 无可选结果

不显示批量选择入口。

### 9.2 选中项被删除或不存在

提交批量操作前重新过滤有效 ID。

### 9.3 下载失败

单张失败不阻断其它下载，最后 toast：

```text
已下载 2 张，1 张失败。
```

### 9.4 删除失败

Toast：

```text
删除失败，请稍后再试。
```

## 10. 埋点建议

```text
result_select_hover_visible
result_selected
result_unselected
bulk_selection_started
bulk_selection_cleared
bulk_download_clicked
bulk_delete_clicked
bulk_delete_confirmed
bulk_delete_failed
```

关键属性：

- selected_count
- media_type
- project_id
- source_tab
- action

## 11. 验收标准

### 11.1 Hover 入口

- 鼠标 hover 图片卡片时，左上角选择框出现。
- 鼠标离开且没有任何选中项时，选择框隐藏。
- 选择框不遮挡右侧单张操作栏。

### 11.2 多选模式

- 点击选择框后，该图片被选中。
- 选中后所有图片都显示选择框。
- 可以连续选择多张。
- 可以取消单张选择。
- 可以清空全部选择。

### 11.3 批量操作栏

- 选中 1 张或多张后显示批量操作栏。
- 操作栏显示准确数量。
- Clear 后操作栏消失。

### 11.4 批量下载

- 选中 1 张时可下载。
- 选中多张时可触发多张下载。
- 下载不影响当前 selection，除非用户主动 Clear。

### 11.5 批量删除

- 点击 Delete 必须出现确认弹窗。
- 确认后选中结果从当前图片墙移除。
- 删除后 selection 清空。
- 取消后不删除，selection 保留。

### 11.6 响应式

- 桌面端 hover 行为正常。
- 移动端没有 hover，选择框应在卡片长按或进入多选入口后显示。
- 移动端批量操作栏不遮挡底部 composer 的主要操作。

## 12. 实施建议

### Phase 1：选择框 + 多选状态

- 给 result card 增加 checkbox button。
- 实现 `selectedResultIds`。
- 添加 selected 样式。
- 进入多选模式后全卡片显示 checkbox。

### Phase 2：批量操作栏

- 实现 sticky bulk bar。
- 支持 Clear。
- 支持 Download。

### Phase 3：批量删除

- 实现删除确认弹窗。
- 复用单张删除逻辑。
- 批量删除后更新项目数据和 UI。

### Phase 4：扩展动作

- 批量 Save to Attachments。
- 批量 Save as Product / Avatar。
- Select all visible。

## 13. 开发注意事项

- 选择框必须是 button，不要只用 div，保证键盘和屏幕阅读器可操作。
- 使用 `aria-pressed` 或 `aria-checked` 表示选中状态。
- 删除按钮必须是危险色，并且必须二次确认。
- 不要让 checkbox 点击冒泡打开图片详情。
- 不要把 selected 状态写入后端，除非未来需要跨页面保留选择。
- 批量操作需要保护用户已有 Attachments，不要误删已经保存的 Product / Avatar reference。
