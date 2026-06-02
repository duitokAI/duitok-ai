# Pokaya AI 全量改名执行 PRD

Last updated: 2026-05-29

## 1. 背景

TikTok Developer 审核明确拒绝了包含 `Tik` / `Tok` 的 app name。原品牌 **Pokaya AI** 中包含 `tok`，后续继续使用会带来审核、合规和品牌风险。

新品牌已确定为：

- 产品名：**Pokaya AI**
- 主域名：**pokaya.ai**
- Mascot：固定 `P` 钱包样式
- 主市场：Malaysia TikTok Shop seller / affiliate seller
- 品牌寓意：`kaya` 接近 Malay 语境里的财富、变有钱，和钱包 mascot 一致

本 PRD 的目标是指导下一阶段把整个项目的用户可见品牌重点统一替换为 **Pokaya AI**，同时保留必要兼容，避免登录、支付、TikTok callback、旧用户数据和旧链接出问题。

## 2. 核心目标

### 2.1 必须达成

- 所有用户可见的品牌名从 `Pokaya AI` 改为 `Pokaya AI`。
- 所有用户可见的 `Pokaya Agent` 改为 `Pokaya Agent`。
- 所有用户可见的 `Pokaya Studio` 改为 `Pokaya Studio`。
- 浏览器标题、favicon、登录页、Studio sidebar、Dashboard、Agent、SOP、Billing、Auto Post extension 全部体现 Pokaya AI。
- 线上主入口切到 `pokaya.ai`。
- TikTok Developer app name 使用 `Pokaya AI`，不再出现 `Tik` / `Tok` 派生品牌名。
- 保持当前后台色调，不因为换 logo 重做 UI 颜色。

### 2.2 不能破坏

- 不能让现有用户登出或丢失项目数据。
- 不能破坏已生成素材、R2 媒体 URL、历史记录。
- 不能破坏 TikTok OAuth callback。
- 不能破坏 CHIP / 支付 callback。
- 不能破坏 Render 当前服务和数据库。
- 不能做盲目全局替换导致 `TikTok` 平台说明被误删。

## 3. 品牌锁定

### 3.1 新命名

| 场景 | 新名称 |
|---|---|
| 产品 | Pokaya AI |
| 官网 / App | Pokaya AI |
| Workspace | Pokaya Studio |
| Agent | Pokaya Agent |
| Auto Post | Pokaya Auto Post |
| SOP | Pokaya SOP |
| Admin | Pokaya Admin |
| Pro plan | Pokaya AI Pro |
| 媒体服务 | Pokaya media |

### 3.2 禁用公开命名

以下内容不应该继续出现在用户界面、审核页面、官网 metadata、extension UI 或支付展示中：

- Pokaya AI
- Pokaya
- Pokaya Agent
- Pokaya Studio
- Pokaya Auto Post
- `#pokaya`
- `admin@pokaya.ai`
- `pokaya.ai/ref/...`

### 3.3 TikTok 的使用边界

`TikTok` 仍然是产品支持的平台，可以保留在功能说明里。

允许：

- TikTok Shop content
- TikTok Shop seller
- Connect TikTok
- Auto Post to TikTok
- TikTok affiliate workspace

不允许：

- 把 TikTok / Tik / Tok 做成产品名一部分
- 视觉上暗示官方 TikTok 产品
- 使用 `Tok` 作为品牌后缀

## 4. 视觉资产

### 4.1 已定稿资产目录

正式资产目录：

- `public/brand/pokaya/final/`

桌面压缩包：

- `/Users/zixian/Desktop/pokaya-ai-final-brand-assets.zip`

### 4.2 固定 mascot

固定使用 `P` 钱包 mascot：

- 紫色钱包主体
- 珊瑚粉扣带
- `P` 轮廓
- wink 表情
- 卡片从钱包里露出
- 上升箭头代表增长 / 赚钱

后续可以变化姿势、裁切和场景，但不能重设计核心钱包造型。

### 4.3 颜色不能大改

必须沿用当前后台色调：

- 主紫：`#5d086c`
- 侧边栏深紫：`#17091b` / `#0d090f` / `#09070a`
- 主文字：`#2b0634`
- 粉色：`#ff4e78`
- 珊瑚：`#ff835e`
- Active 粉红：`#ff4f65`
- 页面背景：`#fff8fb`
- 卡片：`#ffffff`
- 二级卡片：`#fff0f6`
- Muted text：`#7a607f`

本次迁移只换品牌名和资产，不重做后台色调。

## 5. 当前项目牵连面

### 5.1 HTML / 浏览器入口

文件：

- `index.html`

需要改：

- `<title>Pokaya AI</title>` -> `Pokaya AI`
- favicon 指向 `public/brand/pokaya/final/favicon.ico` 或对应 PNG
- 后续如有 metadata，也统一为 Pokaya AI

### 5.2 前端主应用

文件：

- `src/main.js`
- `src/styles.css`

需要改：

- 页面文案中的 `Pokaya AI` -> `Pokaya AI`
- `Pokaya Agent` -> `Pokaya Agent`
- `Pokaya Studio` -> `Pokaya Studio`
- Sidebar logo 使用 `public/brand/pokaya/final/pokaya-sidebar-logo-*`
- Login / Register logo 使用 Pokaya final logo
- App icon / tab icon 使用 final favicon
- Dashboard、Billing、SOP、Agent、Auto Post、Content Library、Admin CRM 的可见品牌统一
- 下载文件名 / export title 如可见，也改为 Pokaya

不能盲改：

- `TikTok` 平台词
- 旧 localStorage key
- 内部函数名，如果改名风险大且用户不可见

### 5.3 后端服务

文件：

- `server.mjs`

需要改：

- 服务健康检查里的 public name
- Agent system identity：`Pokaya Agent` -> `Pokaya Agent`
- 用户可见错误文案 / 成功文案
- 默认 hashtag：去掉 `#pokaya`，改为 `#pokaya` 或不放品牌 hashtag
- referral / public URL 默认值从 `pokaya.ai` 切到 `pokaya.ai`
- admin seed display 如有可见内容，改为 Pokaya
- provider redaction copy：`Pokaya AI generation service` -> `Pokaya AI generation service`

谨慎处理：

- 数据库表名不改
- 现有 state key 不改
- 已存历史记录不批量迁移，除非另开 migration

### 5.4 部署配置

文件：

- `render.yaml`
- `fly.toml`
- `railway.json`
- `vercel.json`
- `DEPLOY.md`

P0 需要改：

- `PUBLIC_APP_URL=https://pokaya.ai`
- `CORS_ORIGINS` 加入 `https://pokaya.ai` 和 `https://www.pokaya.ai`
- 部署文档改成 Pokaya AI
- admin email 建议准备 `admin@pokaya.ai`

P1 再改：

- Render service name `pokaya-ai` 是否改名
- disk name `pokaya-data` 是否改名
- Fly app name 是否继续保留

原则：服务名、disk 名不急着改，避免影响部署和数据。用户看不到的内部基础设施名字可以晚点迁移。

### 5.5 Public 旧素材

旧资源包括：

- `public/pokaya-logo-transparent.png`
- `public/pokaya-tab-icon-transparent.png`
- `public/pokaya-mascot-transparent.png`
- `public/pokaya-brand-*`
- `public/pokaya-agent-*`
- `public/pokaya-favicon*.svg`
- `public/favicon.ico`
- `public/apple-touch-icon.png`

需要做：

- 新页面引用全部切到 `public/brand/pokaya/final/`
- 根目录 favicon / apple-touch-icon 可以复制 final 版本覆盖
- 旧 Pokaya 素材先保留，不删除，等线上确认稳定后再清理

### 5.6 Auto Post Extension

目录：

- `public/pokaya-autopost-extension/`

需要改：

- manifest name：`Pokaya Auto Post`
- popup / content 文案：`Pokaya` -> `Pokaya`
- extension icon 改用 Pokaya app icon
- README 改成 Pokaya
- panel ID / CSS class 可以暂时保留 `pokaya-*`，因为用户不可见，避免一次性改太多

后续 P1：

- 文件夹改名为 `pokaya-autopost-extension`
- 旧路径保留 redirect 或下载兼容

### 5.7 Docs

大量历史 PRD 仍包含 Pokaya。处理策略：

- 当前执行相关文档改成 Pokaya
- 历史 PRD 不需要全部立即重写
- 但对外、给审核、给用户、给合作方看的文档必须改成 Pokaya

P0 文档：

- `DEPLOY.md`
- 当前 rebrand PRD
- TikTok review / app submission 文案
- privacy / terms 如存在

## 6. 执行优先级

### P0：必须先做

1. `index.html` title / favicon 改 Pokaya。
2. Studio sidebar logo 和 wordmark 改 Pokaya。
3. 登录 / 注册页改 Pokaya。
4. Dashboard / Agent / SOP / Billing 用户可见文案改 Pokaya。
5. `server.mjs` 用户可见文案和 Agent identity 改 Pokaya。
6. Auto Post extension 用户可见 name / copy 改 Pokaya。
7. `PUBLIC_APP_URL` 和 CORS 准备 Pokaya 域名。
8. 根目录 favicon / apple-touch-icon 替换为 Pokaya final。
9. 本地 build。
10. 上云后检查线上 `pokaya.ai`。

### P1：稳定后做

1. GitHub repo rename：建议 `pokaya-ai`。
2. Render service display name rename。
3. Auto Post extension 文件夹 rename。
4. R2 media domain 改为 `media.pokaya.ai`。
5. `admin@pokaya.ai` 邮箱正式启用。
6. 旧 Pokaya public assets 清理。

### P2：以后再做

1. 数据库字段 / state key 深度 rename。
2. 历史生成记录品牌重写。
3. 旧 docs 全量归档或批量替换。
4. 品牌官网 SEO 页面矩阵。

## 7. 兼容策略

### 7.1 localStorage

不要第一轮改掉旧 key。建议：

- 旧 key 继续读
- 新 key 可以开始写
- 如必须迁移，做 fallback：先读 Pokaya key，读不到再读 Pokaya key

### 7.2 Domain

第一阶段：

- `pokaya.ai` 和 `pokaya.ai` 同时可用
- callback 同时支持两个域名

第二阶段：

- TikTok / payment callback 全部稳定后，再把 `pokaya.ai` redirect 到 `pokaya.ai`

### 7.3 Old Assets

旧图先不删：

- 防止代码遗漏引用导致 404
- 防止旧缓存页面破图
- 等线上 QA 通过后再清理

## 8. QA 清单

### 8.1 本地 QA

- `npm run build` 通过
- 首页 title 是 Pokaya AI
- favicon 是 P 钱包
- 登录页 logo 是 Pokaya
- Studio sidebar logo 是 Pokaya
- Dashboard 顶部不出现 Pokaya
- Agent 页面不出现 Pokaya Agent
- SOP 页面不出现 Pokaya
- Billing / top up 页面不出现 Pokaya
- Auto Post extension popup 不出现 Pokaya
- 控制台无资源 404

### 8.2 搜索 QA

执行关键词扫描：

- `Pokaya`
- `DuitTok`
- `pokaya`
- `pokaya`
- `#pokaya`

验收规则：

- 用户可见页面不得出现旧品牌
- 内部兼容 key / 历史 docs 可以暂时保留，但需要标注为 deferred

### 8.3 线上 QA

- `https://pokaya.ai` 可打开
- `https://www.pokaya.ai` 可打开或正确 redirect
- 登录正常
- 进入 Studio 正常
- 上传 / 生成 / Agent 基础流程正常
- TikTok connect callback 不报错
- 支付 callback 不报错
- 手机端 favicon / app icon 正常

## 9. 验收标准

本次改名完成的标准：

- 用户从登录到 Studio 到 Agent 的主路径只看到 **Pokaya AI**。
- TikTok Developer 审核页面看到的 app name 是 **Pokaya AI**。
- 浏览器 tab、favicon、sidebar、logo 都是 Pokaya 资产。
- 后台整体色调保持当前紫粉体系，没有重做视觉导致返工。
- `npm run build` 通过。
- 线上 `pokaya.ai` 可用。
- 旧 `pokaya.ai` 不会立刻断。

## 10. 推荐执行顺序

1. 替换根 favicon / apple touch icon。
2. 替换 `index.html` title 和 icon references。
3. 替换前端可见品牌名和 logo references。
4. 替换 server 用户可见文案和 Agent identity。
5. 替换 Auto Post extension 可见内容。
6. 更新部署文档和 env checklist。
7. `npm run build`。
8. 本地浏览器 QA。
9. commit / push。
10. 上云检查 `pokaya.ai`。

## 11. 风险提醒

- 不要全局把 `TikTok` 删除，平台功能还需要这个词。
- 不要第一轮改 database table / localStorage / R2 object path。
- 不要把后台色调换成新风格。
- 不要删除旧图片，先替换引用。
- 不要只改首页，Studio / Agent / extension 才是审核和用户长期看到的重点。
