# Video 模型 Size / Aspect Ratio 前端完整展示 PRD

## 1. 背景

当前 Video Page 的 Aspect Ratio / Size 选项是写在前端 `videoModelOptions()` 的静态能力表里。Seedance 2.0 / Seedance 2.0 Fast 目前只显示 `9:16`、`16:9`、`1:1`，但 APIMart 官方文档显示 `doubao-seedance-2.0` 实际支持更多 `size`。

同类问题也存在于其它视频模型：有些前端显示了 provider 不可控的比例，有些 provider 支持的比例没有完整显示，有些后端没有把用户选择真正传给供应商。

本 PRD 的目标是：**按每个模型当前真实供应商能力，把所有可控 size / aspect ratio 都显示在前端；不可控的不要假装可选。**

## 2. 目标

1. Seedance 2.0 / Seedance 2.0 Fast 前端展示 APIMart 支持的 7 个 size。
2. 所有 Video 模型的前端 size 选项以当前实际供应商为准，而不是凭模型品牌猜测。
3. 后端 request body 必须和前端能力表一致，不能前端可选但后端不传，或后端 silently fallback。
4. 对于图生视频 / reference-driven 模式，如果供应商说明比例会由输入图或输入视频决定，前端要明确处理，不能误导用户。
5. 增加一份模型 size capability source of truth，避免后续每次改菜单都散落在多个函数里。

## 3. 非目标

1. 本 PRD 不改变生成价格、duration、quality、audio 规则。
2. 不新增供应商。
3. 不把图片模型支持的所有比例无脑套到视频模型。
4. 不对供应商文档未声明的比例做猜测性开放。
5. 不在 UI 上展示后端当前无法控制的 size 选项。

## 4. 当前代码问题

### 4.1 前端能力表写死

位置：

- `src/main.js`
- `videoModelOptions()`

当前 Seedance：

```js
aspectRatios: ["9:16", "16:9", "1:1"]
```

但 APIMart 文档支持：

```js
["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"]
```

### 4.2 后端复用了图片比例 helper

位置：

- `server.mjs`
- `apimartSeedanceBody()`

当前：

```js
const size = imageAspectRatioFromProject(project);
```

问题：

- `imageAspectRatioFromProject()` 使用图片模型的 supported ratio 列表。
- 当前图片 ratio 列表不包含 `adaptive`。
- 如果前端新增 `adaptive`，后端会 fallback，不会真正传给 APIMart。

### 4.3 部分模型前端显示了不可控比例

例如：

- `MiniMax Hailuo 2.3` 前端显示 `9:16`, `16:9`, `1:1`，但 APIMart Hailuo 2.3 请求参数没有 `size` / `aspect_ratio` 字段。
- `Kling V3 Motion Control` 前端显示 `9:16`, `16:9`，但当前后端 body 没有传 `aspect_ratio`，APIMart 产品页也更偏 reference image + reference video motion transfer，不应假装 ratio 是独立可控参数。

## 5. 供应商调研结果

> 调研日期：2026-06-06  
> 原则：优先使用当前代码实际 provider，其次使用供应商官方文档。第三方聚合页只用于补充，不作为最终可控能力依据。

### 5.1 Seedance 2.0 / Seedance 2.0 Fast

当前实际供应商：

- APIMart
- `model: doubao-seedance-2.0`
- Fast 别名在内部映射为 Seedance 2.0，但 APIMart 文档同页支持 `doubao-seedance-2.0-fast`

APIMart 官方 `size`：

| Size | 说明 |
| --- | --- |
| `16:9` | Landscape |
| `9:16` | Portrait |
| `1:1` | Square |
| `4:3` | Traditional ratio |
| `3:4` | Vertical traditional ratio |
| `21:9` | Ultra-wide |
| `adaptive` | 自动匹配输入图 / 输入视频 |

前端应显示：

```js
["9:16", "16:9", "1:1", "4:3", "3:4", "21:9", "adaptive"]
```

后端必须传：

```js
size
```

来源：

- APIMart Seedance 2.0 文档：`size` options 明确列出 7 个值。

### 5.2 Veo 3.1

当前实际供应商：

- CRUN
- `model: google/veo3-1-fast-t2v`

CRUN / Veo 3.1 文档显示 aspect ratio：

```js
["16:9", "9:16"]
```

当前前端已匹配。

后端当前：

```js
aspect_ratio: process.env.CRUN_VEO_3_1_ASPECT_RATIO || project.image?.aspectRatio || "9:16"
```

需要确认：

- 若 env 强制配置存在，会覆盖用户选择。
- 产品上如果允许用户选择，就不应该让 env 默认覆盖用户选择；env 只能作为 fallback 或运维强制模式。

### 5.3 Sora 2

当前实际供应商：

- Wuyin / 速创API
- `WUYIN_SORA_ASPECT_RATIO`
- 路径：`/api/async/video_sora2`

速创API 文档显示：

```js
["9:16", "16:9"]
```

当前前端已匹配。

当前后端问题：

```js
aspectRatio: process.env.WUYIN_SORA_ASPECT_RATIO || process.env.WUYIN_VIDEO_RATIO || "9:16"
```

它没有优先使用用户选择的 `project.image.aspectRatio` 或 `project.ugc.aspectRatio`。执行时需要修复为：

```js
aspectRatio: selectedVideoAspectRatio(project, "Sora 2")
```

### 5.4 Gemini Omni

当前实际供应商：

- Wuyin / 速创API
- 路径：`/api/async/video_google_omni`

速创API 文档参数：

- `size`
- 格式为 `widthxheight`
- 推荐值：
  - `1280x720` 横屏 720p
  - `720x1280` 竖屏 720p
- 后续高清模型推荐：
  - `1920x1080`
  - `1080x1920`

当前前端只显示：

```js
["9:16"]
```

当前后端固定：

```js
size: process.env.WUYIN_OMNI_SIZE || "720x1280"
```

建议前端显示：

```js
["16:9", "9:16"]
```

后端映射：

```js
"16:9" -> "1280x720"
"9:16" -> "720x1280"
```

暂不显示 1080p 对应尺寸，除非同时把 quality/resolution 切换到高清模型并验证供应商当前账号支持。

### 5.5 Grok Imagine Video

当前实际供应商：

- APIMart
- `model: grok-imagine-1.0-video-apimart`

APIMart 官方 `size`：

```js
["16:9", "9:16", "1:1", "3:2", "2:3"]
```

当前前端和后端已匹配。

注意：

- APIMart 文档说明上传 reference image 后，aspect ratio 会自动匹配 reference image。
- 图生视频模式下可继续显示 ratio，但需要在 UI tooltip / helper 中说明可能被 reference image 覆盖。

### 5.6 Wan 2.7

当前实际供应商：

- APIMart
- `model: wan2.7`

APIMart 官方 `size`：

```js
["16:9", "9:16", "1:1", "4:3", "3:4"]
```

当前前端和后端已匹配。

注意：

- APIMart 文档说明 `size` 仅文生视频模式生效。
- 图生模式下会忽略 `size`，由输入图片决定比例。
- UI 需要区分 Text-to-Video 与 Image-to-Video：
  - T2V：显示 5 个 size
  - I2V：可显示当前 reference-driven 提示，或禁用 size menu 并显示 “Matched to input image”

### 5.7 Kling V3 Omni

当前实际供应商：

- APIMart
- `model: kling-v3-omni`

APIMart 官方 `aspect_ratio`：

```js
["16:9", "9:16", "1:1"]
```

当前前端和后端已匹配。

注意：

- 图生视频模式下 `aspect_ratio` 可能被实际输入图片比例覆盖。
- UI 应加入 reference override 说明。

### 5.8 Kling V3 Motion Control

当前实际供应商：

- APIMart
- `model: kling-v3-motion-control`

当前后端字段：

```js
image_url
video_url
character_orientation
mode
keep_original_sound
watermark_info
```

当前后端没有 `aspect_ratio`。

APIMart 产品页重点是 reference image + reference video motion transfer，没有在当前可见参数里明确可控 aspect ratio。执行策略：

- 不应展示普通 ratio menu。
- 前端可以显示只读提示：`Reference-driven`
- 如果后续找到 motion-control 专门文档明确支持 `aspect_ratio`，再加入能力表。

当前前端显示：

```js
["9:16", "16:9"]
```

建议改为：

```js
aspectRatios: []
aspectRatioMode: "reference"
```

或显示 disabled pill：

```txt
Reference
```

### 5.9 MiniMax Hailuo 2.3

当前实际供应商：

- APIMart
- `model: MiniMax-Hailuo-2.3`

APIMart 官方请求参数：

- `prompt`
- `duration`
- `resolution`
- `first_frame_image`
- `prompt_optimizer`
- `fast_pretreatment`
- `watermark`

当前文档没有 `size` / `aspect_ratio` 参数。

当前前端显示：

```js
["9:16", "16:9", "1:1"]
```

建议改为：

```js
aspectRatios: []
aspectRatioMode: "prompt_or_first_frame"
```

前端显示只读提示：

```txt
By prompt / first frame
```

不要让用户以为能直接控制输出比例。

## 6. 目标前端能力表

| 模型 | 当前 provider | 前端应显示 size / ratio | 备注 |
| --- | --- | --- | --- |
| Seedance 2.0 | APIMart | `9:16`, `16:9`, `1:1`, `4:3`, `3:4`, `21:9`, `adaptive` | `adaptive` 需后端支持 |
| Seedance 2.0 Fast | APIMart | `9:16`, `16:9`, `1:1`, `4:3`, `3:4`, `21:9`, `adaptive` | 同上 |
| Veo 3.1 | CRUN | `16:9`, `9:16` | 当前已对 |
| Sora 2 | Wuyin | `9:16`, `16:9` | 后端需优先用户选择 |
| Gemini Omni | Wuyin | `16:9`, `9:16` | 映射为 `1280x720` / `720x1280` |
| Grok Imagine Video | APIMart | `16:9`, `9:16`, `1:1`, `3:2`, `2:3` | 当前已对 |
| Wan 2.7 | APIMart | `16:9`, `9:16`, `1:1`, `4:3`, `3:4` | T2V 生效；I2V 输入图决定 |
| Kling V3 Omni | APIMart | `16:9`, `9:16`, `1:1` | 当前已对；I2V 可能被图覆盖 |
| Kling V3 Motion Control | APIMart | 不显示普通 ratio menu | reference image/video 决定 |
| MiniMax Hailuo 2.3 | APIMart | 不显示普通 ratio menu | prompt / first frame 决定 |

## 7. 产品交互要求

### 7.1 Aspect ratio menu

当模型有多个可控 ratio：

- 正常显示 dropdown / slider-style menu。
- 选项数量超过 5 个时，菜单必须支持滚动。
- `adaptive` 用文案说明：自动匹配输入图 / 输入视频。

### 7.2 Reference-driven 模型

当模型没有可控 ratio：

- 不显示可点击 ratio menu。
- 显示只读 pill：
  - `Reference`
  - `Input matched`
  - 或 `By first frame`
- tooltip / helper：
  - `This model follows the reference image/video size.`

### 7.3 图生视频 override 提示

对于 APIMart 明确说明图生视频会覆盖 ratio 的模型：

- Grok Imagine Video
- Wan 2.7
- Kling V3 Omni

如果用户上传 reference image 或 first frame：

- ratio menu 可以禁用或保留但显示提示：
  - `May be overridden by reference image`
- result metadata 应保存最终选择和供应商可能覆盖的事实：
  - `requestedAspectRatio`
  - `effectiveAspectRatio`（如果可从结果推断）

## 8. 技术方案

### 8.1 抽出 Video Model Capability Source

新增或重构：

```js
const videoModelCapabilityMap = {
  "Seedance 2.0": {
    aspectRatios: ["9:16", "16:9", "1:1", "4:3", "3:4", "21:9", "adaptive"],
    aspectRatioField: "size",
    aspectRatioMode: "controllable"
  },
  "Seedance 2.0 Fast": {
    aspectRatios: ["9:16", "16:9", "1:1", "4:3", "3:4", "21:9", "adaptive"],
    aspectRatioField: "size",
    aspectRatioMode: "controllable"
  },
  "Gemini Omni": {
    aspectRatios: ["16:9", "9:16"],
    aspectRatioField: "size",
    aspectRatioMode: "mapped-size",
    sizeMap: {
      "16:9": "1280x720",
      "9:16": "720x1280"
    }
  },
  "Kling V3 Motion Control": {
    aspectRatios: [],
    aspectRatioMode: "reference"
  },
  "MiniMax Hailuo 2.3": {
    aspectRatios: [],
    aspectRatioMode: "prompt_or_first_frame"
  }
};
```

前端 `videoModelOptions()` 和后端 request body 都应引用同一份或同构的能力定义，避免前后端分叉。

### 8.2 后端新增 video ratio helper

不要继续让 Seedance 复用 `imageAspectRatioFromProject()`。

建议新增：

```js
function videoAspectRatioForProject(project, model) {
  const capability = videoCapabilitiesForModel(model);
  const requested = String(project?.image?.aspectRatio || project?.ugc?.aspectRatio || "").trim();
  const fallback = capability.aspectRatios?.[0] || "";
  return capability.aspectRatios.includes(requested) ? requested : fallback;
}
```

Seedance 需要允许 `adaptive`。

### 8.3 Provider body 修正

#### Seedance

```js
size: videoAspectRatioForProject(project, "Seedance 2.0")
```

#### Sora 2

```js
aspectRatio: videoAspectRatioForProject(project, "Sora 2")
```

#### Gemini Omni

```js
const ratio = videoAspectRatioForProject(project, "Gemini Omni");
size: ratio === "16:9" ? "1280x720" : "720x1280"
```

#### Kling Motion Control / Hailuo

- 不传 ratio。
- 前端不展示可控 ratio。

### 8.4 保存 requested/effective ratio

Generation job snapshot 应保存：

```js
requestedAspectRatio
aspectRatioMode
providerSizeValue
```

如果结果可以通过视频 metadata 或 thumbnail 推断，则补：

```js
effectiveAspectRatio
```

## 9. 文件范围

预计修改：

- `src/main.js`
  - `videoModelOptions()`
  - `normalizedVideoSettingForModel()`
  - `videoOptionMenu()` / ratio menu rendering
  - model switch 时的 ratio fallback
- `server.mjs`
  - video capability helper
  - `apimartSeedanceBody()`
  - `wuyinImageBody()` 中 Sora / Gemini Omni
  - APIMart Grok/Wan/Kling helper 的 allowed list 统一引用能力表
- `.env.example`
  - 更新 Gemini Omni size 示例
  - 标注 `APIMART_SEEDANCE_SIZE` 如需 env fallback
- `docs/video-page-aspect-ratio-image-parity-prd.zh.md`
  - 更新旧表格，避免继续写 Seedance 只有 3 个 ratio

## 10. 验收标准

### 10.1 Seedance

1. Video Page 选择 Seedance 2.0 / Fast。
2. Aspect ratio menu 显示 7 个：
   - `9:16`
   - `16:9`
   - `1:1`
   - `4:3`
   - `3:4`
   - `21:9`
   - `adaptive`
3. 选择 `21:9` 后生成，后端 APIMart body 中 `size` 为 `21:9`。
4. 选择 `adaptive` 后生成，后端 APIMart body 中 `size` 为 `adaptive`。

### 10.2 Gemini Omni

1. Gemini Omni 显示 `16:9`, `9:16`。
2. 选择 `16:9`，后端 `size` 为 `1280x720`。
3. 选择 `9:16`，后端 `size` 为 `720x1280`。

### 10.3 Sora 2

1. Sora 2 显示 `9:16`, `16:9`。
2. 用户选择 `16:9` 后，后端不能被 env 默认 `9:16` 覆盖。

### 10.4 Reference-driven

1. Kling V3 Motion Control 不显示普通 ratio dropdown。
2. MiniMax Hailuo 2.3 不显示普通 ratio dropdown。
3. UI 显示只读说明，不误导用户。

### 10.5 回归

1. 切换模型时，如果当前 ratio 不被新模型支持，自动 fallback 到新模型第一个可控 ratio。
2. 如果新模型没有可控 ratio，ratio pill 变成只读。
3. Bottom bar 不跳动、不溢出。
4. 移动端菜单可滚动，`adaptive` 不被截断。
5. `npm run build` 通过。

## 11. 风险

1. `adaptive` 对纯文生视频可能不如显式 ratio 稳定，应在 UI 说明它主要适合 reference 输入。
2. Wan / Grok / Kling 的图生视频 ratio 可能被输入图覆盖；用户选择不一定等于最终输出。
3. Gemini Omni 目前 Wuyin 文档只推荐 720p 横竖两个 size；不要提前开放 1080p 对应 size，除非验证账号和后端质量参数都支持。
4. 如果 env 配置被用作强制运营开关，需要明确命名为 `FORCE_*`，不要和 fallback 混在一起。

## 12. 资料来源

1. APIMart `doubao-seedance-2.0` 文档：`size` 支持 `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9`, `adaptive`。
2. CRUN Veo 3.1 文档：Veo 3.1 aspect ratio 支持 `16:9`, `9:16`。
3. 速创API / Wuyin `sora2` 文档：输出视频比例支持 `9:16`, `16:9`。
4. 速创API / Wuyin `google_omni` 文档：`size` 使用 `widthxheight`，推荐 `1280x720`, `720x1280`。
5. APIMart Grok Imagine Video 文档：`size` 支持 `16:9`, `9:16`, `1:1`, `3:2`, `2:3`。
6. APIMart Wan2.7 文档：文生模式 `size` 支持 `16:9`, `9:16`, `1:1`, `4:3`, `3:4`，图生模式由输入图片决定。
7. APIMart Kling v3 Omni 文档：`aspect_ratio` 支持 `16:9`, `9:16`, `1:1`。
8. APIMart MiniMax Hailuo 2.3 文档：当前请求参数未声明 `size` / `aspect_ratio`。

