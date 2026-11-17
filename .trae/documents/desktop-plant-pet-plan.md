# 一隅小园 · 桌宠植物 × 料理小游戏 实施计划

## 1. 项目概述

做一个纯前端的「网页桌宠」：以**紧凑桌面挂件**（非全屏）的形式养一株水彩风植物，通过喝水、专注陪伴、动一动三种照顾行为推进 10 个生长阶段；成熟收获的果实进入仓库，任选 1–3 种果实，经过烹饪动画生成饮品 / 甜品（含创意黑暗料理），成品可生成水彩分享图并保存或系统分享。所有进度、冷却、专注计时、仓库与挂件内植株位置均本地持久化。

- 交付物：可直接用静态服务器打开的网页（无后端、无构建依赖）。
- 运行方式：`python3 -m http.server 4173`（或任意静态服务器）后访问 `index.html`。
- 页面标题：**一隅小园**；副标题：把一点点照顾，种成可以吃的甜。

## 2. 当前状态分析

- `/workspace` 为空 Git 仓库，仅有占位文件 `main`，无任何既有代码、样式或素材，需从零搭建。
- Node v24.1.0、npm 11.4.2、Python 3.14.8 可用；本地无 Chromium/Playwright。
- 图片生成接口已验证可用：`https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=...&image_size=square`，跟随 302 后返回 `image/jpeg`（约 170KB/张）。返回 JPEG 无透明通道，因此统一采用「白底水彩图 + `mix-blend-mode: multiply` 叠加到奶油纸面」的合成方案。
- 验证阶段用 `browser_use` 子代理打开本地页面，配合临时 harness 页面注入 localStorage 状态（验证完成后删除）。

## 3. 体验流程

1. **桌面挂件**：页面只呈现一个约 400×560 的圆角挂件卡片（非全屏铺满），挂在页面右下角；内部是奶油纸面小场景。
2. **种植**：选择种子（5 种，卡片含水彩果实图、名字、风味描述）→ 选择花盆（3 款）；每次重新种植都可重新选盆。
3. **挂件内场景**：植物（盆 + 植株分层合成）出现在挂件里；可拖动并记住位置；植株自然风吹摇摆。
4. **点击植物**：打开照顾面板，显示当前阶段与三个照顾功能（不显示进度条与百分比）。
   - 喝水：+3%，冷却 10 分钟；播放浇水动画。
   - 专注陪伴：25 分钟番茄钟，完成 +5%；有暖光与花瓣动画，可放弃（无奖励）。
   - 动一动：松土 +3%，冷却 30 分钟；播放土壤飞溅与植株轻弹动画。
5. **生长**：每跨过 10% 切换一个阶段（共 10 阶），植株图 900ms 交叉淡化 + 光点 + 阶段提示；不展示进度条，进度超过 85% 时在挂件/面板显示一句「快结果了，加油坚持」；进度 100% 可收获。
6. **收获**：果实飞入仓库计数器，植物清空，弹出重新种植流程（重新选种 + 重新选盆）。
7. **仓库与料理**：仓库展示 5 种果实存量；任选 1–3 种（每种消耗 1 个）→ 5.5 秒烹饪动画（备料 → 搅拌/入炉 → 蒸汽 → 揭晓）→ 成品卡片（水彩插画 + 名称 + 类型 + 文案 + 配料）。
8. **分享成品**：成品卡片提供「生成分享图」→ 预览 1080×1350 水彩分享卡 → 保存图片 / 调用系统分享（不支持的浏览器回退为下载图片 + 复制文案）。

## 4. 视觉方案

- 设计变量：纸面 `#FBF6EC`、墨色 `#5B564C`、鼠尾草绿 `#93A98D` / `#6F8A6B`、蜜桃 `#F0B7A0`、玫瑰 `#E8A3A9`、奶油黄 `#F3D9A4`、细线 `rgba(91,86,76,.12)`。
- 字体：不依赖外网字体；标题 `"Noto Serif SC","Songti SC","STSong",serif`，正文 `"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`。
- 纸感：内联 SVG `feTurbulence` 噪点数据 URI 叠加，低透明度 + `multiply`。
- 挂件形态：页面不铺满，仅一张约 `400×560` 的圆角挂件卡（奶油纸底、细描边、柔和投影），固定在视口右下角；卡片内部才是种植小场景（顶部小标题 + 仓库入口，中部植株区，底部照顾提示）。
- 合成：所有 AI 素材为暖白底水彩图，使用 `mix-blend-mode: multiply` 融入纸面；植株层 `z-index:1`，花盆层 `z-index:2` 盖住植株根部，形成「种在盆里」的效果；盆底加 CSS 椭圆软阴影。
- 植株尺寸随阶段轻微递增（`--plant-scale` 0.62 → 1.06），强化生长感。
- 动效原则：缓入缓出、低幅度、慢节奏；支持 `prefers-reduced-motion`。

## 5. 素材方案（共 58 张 AI 水彩图）

### 5.1 植物阶段（33 张，相似阶段共用）

10 个阶段映射：`stageIndex = min(9, floor(progress / 10))`，`100%` 时显示第 10 阶且可收获。

| 进度 | 阶段名 | 草莓 | 苹果 / 芭乐 / 柠檬 | 蓝莓 |
|---|---|---|---|---|
| 0–9% | 种子入土 | `shared/seed` | `shared/seed` | `shared/seed` |
| 10–19% | 破土发芽 | `shared/sprout` | `shared/sprout` | `shared/sprout` |
| 20–29% | 幼苗初展 | `shared/seedling-herb` | `shared/seedling-woody` | `shared/seedling-woody` |
| 30–39% | 稚株成形 | `shared/young-strawberry` | `shared/young-tree` | `shared/young-blueberry` |
| 40–49% | 抽枝展叶 | `strawberry/stage-05` | `shared/tree-branch` | `blueberry/stage-05` |
| 50–59% | 花苞初现 | `strawberry/stage-06` | `shared/tree-buds` | `blueberry/stage-06` |
| 60–69% | 花开正好 | `strawberry/stage-07` | 各自 `stage-07` | `blueberry/stage-07` |
| 70–79% | 青果初结 | `strawberry/stage-08` | 各自 `stage-08` | `blueberry/stage-08` |
| 80–89% | 果实转色 | `strawberry/stage-09` | 各自 `stage-09` | `blueberry/stage-09` |
| 90–100% | 成熟待收 | `strawberry/stage-10` | 各自 `stage-10` | `blueberry/stage-10` |

计数：共用 7 张（seed、sprout、seedling-herb、seedling-woody、young-strawberry、young-blueberry、young-tree）+ 果树共用 2 张（tree-branch、tree-buds）+ 草莓 6 张 + 蓝莓 6 张 + 苹果/芭乐/柠檬各 4 张后期 = **33 张**。

### 5.2 花盆（3 张）

`pots/pot-cream`（奶油白陶）、`pots/pot-terracotta`（赤陶）、`pots/pot-celadon`（青釉）。均为正视、内含松软土壤、无植物、白底。每次种植时三选一。

### 5.3 果实图标（5 张）

`fruits/strawberry.jpg`、`apple.jpg`、`guava.jpg`、`lemon.jpg`、`blueberry.jpg`，用于选种卡与仓库。

### 5.4 料理（17 张）

| 类型 | 配料 | 名称 | 标签 |
|---|---|---|---|
| 单果 | 草莓 | 草莓牛乳大福 | 甜品·治愈 |
| 单果 | 苹果 | 焦糖苹果肉桂烤盅 | 烘焙·治愈 |
| 单果 | 芭乐 | 芭乐青梅气泡饮 | 饮品·清爽 |
| 单果 | 柠檬 | 柠檬蜂蜜雪葩 | 冰品·清爽 |
| 单果 | 蓝莓 | 蓝莓乳酪云朵杯 | 甜品·治愈 |
| 双果 | 草莓+苹果 | 草莓苹果玫瑰可丽饼 | 甜品·治愈 |
| 双果 | 草莓+蓝莓 | 莓果双色奶冻 | 甜品·治愈 |
| 双果 | 草莓+柠檬 | 草莓柠檬气泡水 | 饮品·清爽 |
| 双果 | 苹果+柠檬 | 苹果柠檬蜂蜜热茶 | 饮品·温暖 |
| 双果 | 苹果+蓝莓 | 蓝莓苹果酥派 | 烘焙·治愈 |
| 双果 | 芭乐+柠檬 | 芭乐柠檬冻饮 | 饮品·清爽 |
| 双果 | 草莓+芭乐 | 芭乐草莓冰沙 | 冰品·清爽 |
| 三果 | 草莓+苹果+蓝莓 | 三莓森林苹果酥 | 烘焙·治愈 |
| 三果 | 芭乐+柠檬+苹果 | 芭乐柠檬暖果茶 | 饮品·温暖 |
| 三果 | 草莓+蓝莓+柠檬 | 暗夜莓果实验室特调 | 黑暗料理 |
| 兜底 | 任意未收录双果 | `{A}·{B} 月光实验特调` | 创意·黑暗 |
| 兜底 | 任意未收录三果 | `{A}·{B}·{C} 暗夜果园烤盅` | 黑暗料理 |

匹配规则：配料 id 排序后拼接 key 命中上表；未命中按数量走兜底（2 果 → 特调图，3 果 → 烤盅图），名称由实际配料动态拼接。所有 25 种组合均可出餐。

### 5.5 生成规范

通用前缀（英文，提升模型稳定性）：
`gentle watercolor hand-painted illustration, healing cozy style, delicate soft ink outlines, subtle watercolor paper texture, warm natural light, muted sage green and peach palette, front view, fixed camera, plain warm white background (#FDFBF7), centered composition, generous empty space above, no text, no watermark, no border`

- 植株：追加 `single plant growing from a small mound of soil at the bottom center, no pot, full plant visible, same framing across the growth series`，逐阶段描述：种子 → 双叶芽 → 幼苗（草本/木本）→ 幼株（草莓莲座/蓝莓灌木/小树）→ 枝叶 → 花苞 → 花（草莓白花、苹果粉白花、芭乐白绒花、柠檬白紫花、蓝莓铃形花）→ 青果 → 转色 → 成熟果。
- 花盆：`empty [cream ceramic / terracotta / celadon glazed] plant pot with soft soil inside, no plant, pot occupies 65% of frame height`。
- 果实：`a small still-life cluster of [fruit] with one leaf`。
- 料理：`cozy cafe food illustration of [dish], served on ceramic plate or glass, steam / condensation details`。
- 尺寸统一 `image_size=square`；脚本保存为 `.jpg`。

### 5.6 生成脚本

`scripts/generate-assets.mjs`：
- 内置 60 条 `{ id, path, prompt }` 清单；
- 3 并发、单张 90s 超时、失败重试 3 次、已存在则跳过（`--force` 可覆盖）；
- 支持 `--filter=strawberry` 先出样张；
- 下载响应二进制写入 `assets/...`，输出 `assets/manifest.json`（数量 / 字节数 / 失败项）。
- 先只生成 6–8 张样张（种子、幼苗、开花、成熟、花盆、料理各一），用 Read 查看风格，通过后再批量生成全部。

## 6. 文件结构

```
/workspace
├── index.html
├── package.json                 # 仅声明 "type": "module" 与 start 脚本，无依赖
├── css/style.css
├── js/
│   ├── data.js                  # PLANTS / POTS / STAGES / RECIPES / FALLBACKS / 文案
│   ├── logic.js                 # 纯函数：阶段、成长、菜谱匹配、库存校验（可 Node 测试）
│   ├── state.js                 # localStorage 读写、冷却/专注时间戳、状态变更
│   ├── share.js                 # Canvas 分享图绘制、下载、Web Share 调用
│   └── app.js                   # 渲染、拖拽、面板、动画编排、计时器
├── scripts/generate-assets.mjs  # 素材生成（开发期工具，不参与运行）
└── assets/
    ├── plants/{shared,strawberry,apple,guava,lemon,blueberry}/*.jpg
    ├── pots/*.jpg
    ├── fruits/*.jpg
    ├── dishes/*.jpg
    └── manifest.json
```

## 7. 数据与状态模型

`logic.js`（纯函数，无 DOM）：
- `stageIndex(progress)` → `0..9`；`stageTitle(i)`。
- `addGrowth(progress, delta)` → `min(100, progress + delta)`。
- `isHarvestReady(progress)` → `progress >= 100`。
- `recipeKey(ids)` → 排序后 `'apple+strawberry'`。
- `matchRecipe(ids)` → `{ dish, isFallback }`。
- `validateCook(inventory, selected)` → 校验 1–3 种、每种存量 ≥1。
- `formatCountdown(ms)` → `mm:ss`。

`state.js` 持久化 key：`yiyu-garden.v1`

```js
{
  version: 1,
  plant: { fruitId, potId, progress, pos: {x, y}, plantedAt } | null,
  cooldowns: { waterUntil: 0, soilUntil: 0 },
  focus: { startedAt, endsAt, claimed } | null,
  inventory: { strawberry: 0, apple: 0, guava: 0, lemon: 0, blueberry: 0 },
  stats: { harvested: 0, cooked: 0 },
  lastDish: null
}
```

- 所有时间使用绝对毫秒时间戳，刷新 / 关机后冷却与专注计时仍准确。
- `plant.potId` 在每次种植流程中重新选择并覆盖，不设全局固定花盆。
- 专注结束时若页面未开，下次加载检测 `endsAt <= now && !claimed` 自动补发 +5% 并提示。
- localStorage 不可用时退化为内存状态，页面仍可玩。

## 8. 页面与交互细节

### 8.1 桌面挂件（index.html + style.css）
- 页面不铺满：`body` 只提供浅色留白背景，主体是一张约 `400×560` 的圆角挂件卡，固定在视口右下角（小屏改为居中/左右留边，仍保持卡片形态）。
- 挂件内部：顶部标题「一隅小园」+ 仓库按钮（篮子图标 + 果实总数徽标）；中部奶油纸面种植区（左上柔和窗光、底部木桌板）；底部一行轮播小提示（如「今天也一起慢慢长大」）。
- 植株：`<img id="plantImg">` + `<img id="potImg">` + CSS 阴影 + 阶段名小标签（只显示「花开正好」这类阶段名，不显示百分比）。进度超过 85% 且未收获时，植株旁出现一句轻提示「快结果了，加油坚持」，柔和呼吸动效，收获后消失。
- 拖动：Pointer Events 实现，移动 > 6px 判为拖动，否则点击开面板；位置限制在挂件种植区内并按百分比持久化。
- 待机：植株 `transform-origin: 50% 96%` 摇摆动画；每 6–14 秒随机改变 `--sway-dur`（3.5–7s）并触发一次 2s 阵风；开花阶段随机飘落花瓣光点。

### 8.2 照顾面板
- 点击植株后，在挂件内部自下而上展开一张照顾卡（覆盖挂件下部约 60%，圆角上沿），不跳出挂件、不遮挡整页；含阶段名、三个功能卡、收获按钮（100% 时出现），**不显示进度条与任何百分比**。
- 喝水卡：浇水壶图标、冷却文案（实时 `mm:ss`）；点击播放 2.6s 浇水动画（壶倾斜 + 8 颗水珠抛物线 + 土面变深 + 植株轻晃），随后增加成长并写冷却。
- 专注陪伴卡：番茄钟图标、25:00 倒计时，卡内显示环形计时；挂件加暖色暗角；完成时播放光斑/花瓣动画并 +5%；可「放弃」且无奖励。专注期间收起面板不中断，挂件顶部显示悬浮计时胶囊。
- 动一动卡：小铲图标、冷却 30 分钟；播放 2.6s 松土动画（铲子 + 土粒飞溅 + 植株弹跳）。
- 进度 100% 时三个功能禁用，显示「收获果实」。
- 阶段切换：交叉淡化 900ms + 3 颗光点 + 挂件内 toast「花开正好」；不展示阶段序号与百分比。

### 8.3 收获与选种
- 收获动画：果实沿弧线飞向仓库按钮，徽标数字跳动；`inventory[fruitId] += 1`、`stats.harvested += 1`；植物清空。
- 种植流程（首次与每次收获后一致）：第一步从 5 张水彩果实卡中选种 → 第二步从 3 张花盆卡中选盆 → 确认后写入 plant 并回到挂件。每次重新种植都可重新选盆。
- 种植弹层同样限制在挂件内（或轻量覆盖层），不显示「关闭」，必须完成两步选择。

### 8.4 仓库与料理
- 仓库弹层：5 种果实卡（插画 + 名称 + 存量），可多选 1–3 种；已选配料 chips；底部「开始烹饪」按钮，未满足条件置灰并提示。
- 烹饪 overlay（5.5s，不可跳过）：备料（选中果实飞入木碗）→ 搅拌/入炉（炉火微光、器皿晃动）→ 蒸汽与「叮」→ 揭晓。
- 成品卡：水彩料理图、名称、类型标签（饮品/甜品/烘焙/冰品/创意/黑暗料理）、一句风味文案、使用配料；底部按钮：「生成分享图」「收下」。
- 消耗：每种选中果实 -1；`stats.cooked += 1`。库存为空时显示空状态与「去种一株吧」。

### 8.5 分享图
- 入口：成品卡点击「生成分享图」→ 生成 1080×1350 竖版水彩卡并弹出预览（预览与生成结果一致）。
- 画面内容（Canvas 2D 绘制，`js/share.js`）：
  - 奶油纸底 + 程序化水彩晕染（径向渐变）与细噪点；
  - 顶部品牌行「一隅小园 · 今日小甜」+ 日期；
  - 中部拱形画框内放料理插画（本地同源图片，圆角裁剪 + 细描边）；
  - 画框下方：料理名（衬线大字）、类型标签、一句风味文案、配料果实小图标与名称；
  - 底部一行小字「在浏览器里种出来的甜 · 第 N 道料理」。
- 保存：`canvas.toBlob('image/jpeg', 0.92)` → Blob URL + `<a download="一隅小园-{料理名}.jpg">` 触发下载。
- 分享：优先 `navigator.canShare({ files })` + `navigator.share({ files, title, text })` 调用系统分享面板；不支持时回退为保存图片并复制文案（`navigator.clipboard.writeText`，失败则显示可手动复制的文本），toast 提示。
- 图标素材由 `assets/fruits/*.jpg` 同源绘制，Canvas 不被污染；分享图不写入 localStorage，不增加额外状态。
- 预览弹层提供「保存图片」「分享」「返回」，Esc 关闭；生成期间显示「正在装盘…」占位。

### 8.6 响应式与可访问性
- 主界面始终是一张挂件卡：桌面端固定右下角；≤720px 宽度 `min(92vw, 400px)`、高度不超过视口并保留页边距，仍保持圆角卡片形态，不铺满全屏。
- 照顾面板、种植流程、仓库都在挂件内展开；分享图预览为独立浮层，可滚动查看 1080×1350 卡片，不改变主界面尺寸。
- 所有按钮可键盘聚焦、Esc 关闭挂件内面板；动画遵循 `prefers-reduced-motion`。

## 9. 实施步骤

1. 搭建骨架：`index.html` 挂件卡结构（非全屏）、`css/style.css` 设计变量与 400×560 挂件布局、`package.json`。
2. 编写 `js/data.js`：5 植物 10 阶段素材路径、3 花盆、5 果实、17 道料理与兜底文案。
3. 编写 `js/logic.js` 与 `js/state.js`：成长、阶段、菜谱匹配、冷却/专注时间戳、localStorage 持久化。
4. 编写 `scripts/generate-assets.mjs`：先生成 8 张样张并人工确认风格，再批量生成 58 张，校验 manifest（数量、字节数、失败重试）。
5. 实现种植流程（选种 + 选盆，每次种植均可重选）、挂件内渲染、拖拽、风吹摇摆、阶段名标签与 >85% 提示。
6. 实现挂件内照顾面板与三种动作动画、阶段切换、专注计时悬浮胶囊、收获动画与重新种植。
7. 实现仓库、配料选择、烹饪动画、成品卡与库存扣减、全部 25 种组合兜底（仓库与烹饪贴在挂件内/挂件旁展开）。
8. 实现 `js/share.js` 与分享预览：Canvas 分享图、下载、Web Share 回退、文案复制。
9. 自测与打磨：逻辑测试、浏览器端到端走查、分享图导出校验、响应式截图、控制台零报错、刷新恢复。

## 10. 假设与决策

- 交付形态为网页版（用户已确认）；主界面是约 400×560 的右下角桌面挂件卡，不做全屏布局；Electron 壳不在本次范围。
- 素材采用 AI 水彩图 + 精简复用（用户已确认）；白底图用 multiply 融合，不追求像素级透明。
- 花盆共 3 款，每次种植（首次与每次收获后）都重新选择种子与花盆。
- 种植过程中不显示进度条与百分比，只显示阶段名；进度 >85% 时提示「快结果了，加油坚持」。
- 番茄钟固定 25 分钟；松土冷却定为 30 分钟（需求未指定）；喝水冷却 10 分钟（需求指定）。
- 每次照顾行为只加一次进度，进度上限 100；不设离线自然生长。
- 烹饪每种配料消耗 1 个；不要求同种多个。
- 一次只养一株。
- 分享图为浏览器端 Canvas 生成的 JPEG（1080×1350），无后端、不生成分享链接；系统分享依赖 `navigator.share` 支持情况，不支持时以「下载图片 + 复制文案」兜底。
- 不做音效、图鉴、成就等未要求功能。
- 所有素材本地化存放，运行时无需外网。

## 11. 验证方案

1. **逻辑测试**：临时 `/tmp/test-logic.mjs` 导入 `js/logic.js`，覆盖阶段边界（0/9/10/99/100）、成长封顶、菜谱 key 排序、已收录/兜底匹配、库存校验、倒计时格式；跑完删除。
2. **素材校验**：`node scripts/generate-assets.mjs` 后检查 58 个文件存在、JPEG 可读、manifest 无失败项；Read 抽查 8 张关键图（阶段连续性、花盆、成品）。
3. **浏览器走查**（`browser_use` + `python3 -m http.server 4173`）：
   - 首屏确认只有挂件卡（约 400×560、右下角），页面未铺满；选种/选盆两步流程可完成，植物出现。
   - 点击植物开面板：确认无进度条、无百分比；喝水 +3%、按钮进入冷却；专注开始/结束 +5%；松土动画正常。
   - 通过临时 harness 页注入 86% / 99% / 100% 与库存，确认 86% 出现「快结果了，加油坚持」、99% 仍可照顾、100% 出现收获；收获后重新种植必须重新选种 + 选盆（3 款）。
   - 仓库选择单果、双果、三果与未收录组合，确认插图、名称、消耗与兜底逻辑。
   - 生成分享图：检查 1080×1350 预览、文字无溢出、料理图完整；触发保存并确认下载文件可打开；在支持 Web Share 的环境验证分享调用，否则确认回退提示与文案复制。
   - 刷新页面验证进度、位置、花盆、冷却、仓库持久化；检查控制台无报错。
   - 390×844 与 1440×900 截图检查挂件尺寸、面板与触控布局。
4. 清理所有临时文件与测试 harness，仅保留交付文件。

## 12. 风险与对策

- **AI 各阶段画风/构图漂移**：固定前缀、固定构图描述、统一白底与尺寸；先出样张校准；必要时对差异大的单张重生成。
- **白底 multiply 在深色元素上发灰**：场景保持奶油浅底，素材避免大面积纯黑；盆/植株分层叠加，必要时给图片加轻微 `filter: saturate(.96)`。
- **58 张图生成慢或个别失败**：脚本 3 并发 + 重试 + 跳过已存在；失败项可单独 `--filter` 重跑，不阻塞页面开发。
- **计时持久化误差**：全部使用绝对时间戳；专注完成采用 `claimed` 标记防重复发奖。
- **分享图文字溢出 / 字体差异**：Canvas 手写换行与字号自适应，名称过长时降字号；使用系统衬线字体栈，导出后实际查看裁剪结果。
- **分享能力差异**：桌面浏览器多不支持文件分享，统一检测后回退下载 + 复制文案，避免按钮无响应。
- **挂件空间有限**：种植区高度按阶段缩放植株，面板覆盖下部时仍露出盆沿与阶段提示；小屏设置最大高度与内部滚动，避免溢出。
- **素材体积**：单张约 170KB，58 张共约 10MB；首屏只预载当前植物 10 张 + 花盆/果实，料理图按需加载。
