# Frontend Refactor Design — 桌游助手移动端重构

**Date**: 2026-06-16
**Status**: Approved
**Scope**: 全部前端页面（1 个基础模板 + 2 个公共页面 + 9 个游戏页面）

---

## 1. 目标与约束

### 目标
- 统一设计语言，优化移动端 UI/UX
- 统一 JS 框架为原生 JS，移除 Vue/Alpine/Axios/polyfill.io
- 消除重复代码（排行榜渲染、玩家管理等）
- 引入底部 Tab Bar 导航

### 约束
- 后端（FastAPI + Jinja2）不变，模板引擎继续使用
- 每个游戏页面保持独立 URL 路由
- Socket.IO 和 ECharts 保留（阿瓦隆/情书/拉斯维加斯需要）
- Phosphor Icons CDN 保留（已在 base.html 中加载）

---

## 2. 文件变更清单

### 2.1 新建文件

| 文件 | 用途 |
|------|------|
| `static/common.js` | 共享工具函数（Toast、Confirm、API helper、排行榜渲染、HTML转义） |
| `static/components.js` | 自定义元素（`<game-card>`、`<player-list>`、`<leaderboard-section>`） |
| `static/sw.js` | 简易 PWA Service Worker（缓存静态资源） |

### 2.2 重写文件

| 文件 | 变更说明 |
|------|----------|
| `static/common.css` | 模块化重组，保持 Apple HIG 风格，优化移动端，新增底部 Tab Bar 样式 |
| `templates/base.html` | 新增底部 Tab Bar，简化导航结构，提取 Toast/Confirm 到 common.js |
| `templates/index.html` | 全新首页设计：快速开局卡片 + 2列游戏网格 + 成就榜预览 |
| `templates/gamelist.html` | 规则数据外置到 JS 数据结构，横向 Chip 过滤器，底部 Sheet 规则弹窗 |

### 2.3 重写游戏页面

所有游戏页面统一为原生 JS，使用共享组件：

| 文件 | 当前框架 | 重写后 |
|------|----------|--------|
| `Avalon/index.html` | Vue 3 + Axios + ECharts | 原生 JS + ECharts |
| `cabo/index.html` | Vue 3 + Axios | 原生 JS |
| `lasvegas/index.html` | Alpine.js + Socket.IO | 原生 JS + Socket.IO |
| `LoveLetters/index.html` | Vue 3 + Socket.IO | 原生 JS + Socket.IO |
| `flip7/index.html` | Vue 3 + Axios | 原生 JS |
| `ModernArt/index.html` | 原生 JS + fetch | 原生 JS（重构 UI） |
| `splendor/index.html` | 原生 JS + fetch | 原生 JS（使用 `<player-list>` 组件） |
| `explodingkittens/index.html` | 原生 JS + fetch | 原生 JS（使用 `<player-list>` 组件） |
| `thegang/index.html` | 原生 JS + fetch | 原生 JS（使用 `<player-list>` 组件） |

---

## 3. 设计系统（common.css）

### 3.1 CSS 架构
```
common.css (~600行)
├── 1. Design Tokens (CSS Variables)
│   ├── Colors (light + dark via prefers-color-scheme)
│   ├── Typography (system font stack)
│   ├── Spacing (4px grid: 4,8,16,24,40,60)
│   ├── Shadows (sm, md, lg)
│   └── Radii (8,12,16,20,24,999px)
├── 2. Reset & Base
├── 3. Typography (h1-h6, p, a)
├── 4. Layout (.container, .page)
├── 5. Navigation (.top-nav, .tab-bar)
├── 6. Components
│   ├── Buttons (.btn, .btn-primary, .btn-secondary, .btn-danger, .btn-block)
│   ├── Cards (.card, .game-card)
│   ├── Inputs (.input)
│   ├── Lists (.list, .list-item, .rank-badge)
│   ├── Tags (.tag, .tag-blue, ...)
│   ├── Modals (.modal, .modal-content, .sheet)
│   └── Chips (.chip, .filter-chip)
├── 7. Utilities (text, spacing, flex, display)
├── 8. Animations (fade, slide-up, scale)
└── 9. Dark Mode Overrides
```

### 3.2 关键设计决策
- 不引入 CSS 框架（Tailwind/Bootstrap），保持零依赖
- 颜色系统沿用 Apple HIG token 命名
- 暗黑模式通过 `prefers-color-scheme` 自动切换（无手动 toggle，保持简单）
- 所有可点击元素最小 44x44px 触控区域
- 底部 Tab Bar 适配 safe-area-inset-bottom

---

## 4. 导航架构

### 4.1 双层导航

```
┌──────────────────────────────┐
│  Top Nav Bar (44px sticky)   │  ← 标题居中 + 左侧动作 + 右侧动作
├──────────────────────────────┤
│                              │
│  Content Area (scrollable)   │
│                              │
├──────────────────────────────┤
│  Bottom Tab Bar (fixed)      │  ← 仅在主页层级显示
│  🏠首页  🎮游戏  🏆排行     │
└──────────────────────────────┘
```

### 4.2 导航规则
- **主页面（首页/游戏列表/排行榜）**：显示底部 Tab Bar，顶部导航显示标题
- **游戏内页面**：隐藏底部 Tab Bar，顶部显示「← 返回」+ 游戏标题 + 操作按钮
- Tab 切换无页面刷新（如果是 SPA），当前架构为独立页面，Tab 点击跳转 URL

### 4.3 Tab 路由映射
| Tab | 图标 | URL | 内容 |
|-----|------|-----|------|
| 首页 | 🏠 | `/` | 快速开局 + 游戏网格 + 成就榜预览 |
| 游戏 | 🎮 | `/gamelist` | 人数过滤 + 游戏详情卡片 + 规则弹窗 |
| 排行 | 🏆 | `/#leaderboard` | 跳转首页锚点，展开完整全局成就榜（原首页底部仅显示前3名预览） |

---

## 5. 共享 JS 模块

### 5.1 common.js API

```javascript
// API 请求
window.api = async (url, { method = 'GET', body } = {}) => { ... }

// Toast 通知（取代 base.html 内联代码）
window.showToast = (message, type = 'info') => { ... }
// type: 'info' | 'success' | 'error'

// 确认对话框（取代 base.html 内联代码）
window.showConfirm = (message, confirmText = '确认', cancelText = '取消') => { ... }
// Returns: Promise<boolean>

// 排行榜渲染（消除9份重复代码）
window.renderLeaderboard = (container, data, opts = {}) => { ... }
// opts: { emptyIcon, emptyText, showAvgScore, avgScoreLabel, showWinLoss }

// HTML 安全转义
window.escHtml = (str) => { ... }
```

### 5.2 components.js 自定义元素

```javascript
// <game-card> — 游戏入口卡片
// 属性: name, en-name, icon-emoji, color, href, min-players, max-players,
//        rec-players, duration, age, difficulty, rating, desc, disabled
// 用于: 首页游戏网格、游戏列表页
class GameCard extends HTMLElement { ... }

// <player-list> — 玩家管理组件
// 属性: api-base, mode ("simple" | "winner-select" | "coop")
// 用于: Splendor, Exploding Kittens, The Gang, Flip7, ModernArt
class PlayerList extends HTMLElement { ... }

// <leaderboard-section> — 排行榜区域
// 属性: api-url, empty-icon, empty-text
// 用于: 所有游戏页面的历史排行榜
class LeaderboardSection extends HTMLElement { ... }
```

### 5.3 页面加载方式

```html
<!-- base.html 中统一加载 -->
<link href="/static/common.css" rel="stylesheet">
<script src="/static/common.js"></script>

<!-- 需要组件的页面额外加载 -->
<script src="/static/components.js"></script>

<!-- 需要图表的页面加载 ECharts -->
<script src="https://unpkg.com/echarts@5.5.0/dist/echarts.min.js"></script>

<!-- 需要实时同步的页面加载 Socket.IO -->
<script src="https://cdn.socket.io/4.7.4/socket.io.min.js"></script>
```

---

## 6. 页面规格

### 6.1 首页（index.html）

**布局**（从上到下）：
1. Top Nav：「🎲 桌游助手」
2. Hero 卡片：渐变蓝色背景，"随机初始玩家"工具（内联交互，不弹窗）
3. Section：「🎮 游戏」+ 2 列游戏网格（使用 `<game-card>` 组件）
4. 「查看全部 9 款游戏 →」链接
5. 「🏆 全局成就榜」：前 3 名预览（使用 `renderLeaderboard()`）
6. Bottom Tab Bar

**交互**：
- Hero 卡片：点击展开人数选择 → 显示结果
- 游戏卡片：点击跳转游戏页面
- 排行榜：点击跳转完整排行

### 6.2 游戏列表（gamelist.html）

**布局**：
1. Top Nav：「🎮 游戏列表」
2. 横向滚动 Chip 过滤器：全部 / 2人 / 3人 / ... / 8人+
3. 游戏卡片列表（使用 `<game-card>` 组件），每卡片含"规则"按钮
4. 规则弹窗（底部 Sheet）：规则/攻略 Tab 切换
5. Bottom Tab Bar

**游戏数据**：JavaScript 数据结构，从 `database.py` 的 `GAME_REGISTRY` 导出为 JSON，或在前端静态定义。

**规则数据**：每个游戏的规则/攻略文本存储在 JS 对象中，不在 HTML 中硬编码。

### 6.3 游戏页面通用模式

**简单计分游戏**（Splendor, Exploding Kittens, The Gang）：
```
├── Hero (emoji + 标题)
├── <player-list> 组件（添加/移除/选胜者）
├── 提交按钮
└── <leaderboard-section> 组件
```

**中型计分游戏**（Cabo, Flip7, ModernArt, Las Vegas）：
```
├── Hero (SVG header)
├── 自定义游戏内容（计分表单、卡牌选择等）
├── 游戏状态 / 当前排行
└── <leaderboard-section> 组件
```

**复杂交互游戏**（Avalon, Love Letters）：
```
├── Hero (SVG header)
├── 自定义游戏 UI（身份、投票、任务等）
├── 覆盖层（投票、查验、刺杀）
├── 结束画面（胜利动画、揭晓、图表）
└── 游戏内排行榜
```

### 6.4 排行榜 Tab（/gamelist#leaderboard 锚点 或独立区域）

内容与当前首页底部排行榜相同，但作为独立 Tab 显示完整数据（不限于前3名）。

---

## 7. 依赖变更

### 7.1 移除
- `polyfill.io`（安全风险）
- `Vue 3 CDN`（Avalon, Cabo, LoveLetters, Flip7）
- `Alpine.js 3 CDN`（Las Vegas）
- `Axios CDN`（所有使用 Vue 的页面）
- `MathJax CDN`（首页胜率公式 → 纯文本展示）

### 7.2 保留
- `Phosphor Icons CDN`（页面图标）
- `Socket.IO CDN`（Avalon, LoveLetters, Las Vegas 实时同步）
- `ECharts CDN`（Avalon 对局记录图表）

### 7.3 新增
- `static/common.js`
- `static/components.js`
- `static/sw.js`

---

## 8. PWA 增强

当前已有 PWA meta 标签（apple-mobile-web-app-capable, theme-color），新增：
- `static/sw.js` — 简易 Service Worker，缓存 CSS/JS/图标
- 注册脚本在 base.html 中
- 不依赖 Workbox，手写 30 行 SW

---

## 9. 实现风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| Avalon Vue → 原生 JS 转换复杂度高 | 保持组件边界清晰，先提取共享模块再逐功能替换 |
| 游戏页面同时改动可能引入 bug | 每个游戏独立路由，互不影响；逐个验证 |
| CSS 全局改动可能影响现有页面 | 保留 CSS 变量命名，渐进替换 |
| 删除 polyfill.io 可能影响旧浏览器 | 目标用户为移动端现代浏览器，iOS Safari/Chrome 均支持 ES6 |

---

## 10. 验证标准

- [ ] 所有页面在 iPhone SE (375px) 到 iPhone 15 Pro Max (430px) 宽度下正常显示
- [ ] 暗黑模式切换无样式异常
- [ ] 所有可点击元素 ≥ 44x44px
- [ ] Toast/Confirm 在所有页面正常工作
- [ ] 排行榜数据正确渲染
- [ ] Socket.IO 实时同步正常（Avalon/LoveLetters/LasVegas）
- [ ] ECharts 图表正常渲染（Avalon）
- [ ] 底部 Tab Bar 导航正常
- [ ] 游戏内页面返回按钮正常
- [ ] PWA SW 缓存正常工作
