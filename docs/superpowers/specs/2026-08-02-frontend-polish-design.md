# 游戏前端统一打磨设计（移动优先 · Apple HIG 对齐）

日期：2026-08-02
状态：已批准（用户确认方案 A 分级打磨；Avalon echarts 换纯 CSS 轻量统计；实测深度 = 布局 + 双标签页基本对局）

## 背景

`D:\Workspace\bgp` 是 FastAPI + Jinja2 + Socket.IO + 原生 JS 的多人桌游平台。最近一次提交（729757a）已完成移动优先 + Apple HIG 骨架重构：`templates/base.html`（viewport/top-nav/tab-bar/PWA）+ `static/common.css`（2772 行 iOS 设计令牌与组件）+ `common.js`（api/showToast/showConfirm/renderLeaderboard）+ `components.js`（game-card/player-list/leaderboard-section）。

但 9 个游戏页面对齐程度参差，存在三类问题：

1. **全站 bug**：LoveLetters/ModernArt/cabo/lasvegas 四页设了 `no-tab-bar` 却未清空 `show_tab_bar` block → 底部内容被固定 tab bar 遮住约 64px；viewport 用 `maximum-scale=1.0, user-scalable=no` 禁用缩放（违背 HIG 无障碍）；PWA 缺 manifest.json 与 apple-touch-icon（sw.js 有缓存但无法安装）。
2. **老旧页自研组件与共享系统重复/冲突**：
   - Avalon（1818 行）：自研 `.vote-overlay` 全屏遮罩、echarts 桌面图表（约 300KB）、自研排行榜渲染、未用共享组件
   - lasvegas（1353 行）：约 700 行内联 CSS、三套自研 modal（end/setup/info）、重定义 `.section-title`
   - flip7（1031 行）：自研 `.fab` 重复实现共享 `.apple-fab`、自研全屏 `.scoring-overlay`、重定义 `.section-title`
3. **小不一致**：LoveLetters 用旧式 `.apple-segment`（新标准 `.segmented-control`）+ 死代码 body padding。

explodingkittens/splendor/thegang 三页为纯共享组件声明式，完全达标，不修改。

## 设计决策

### 方案：分级打磨（用户已确认）

| 层 | 内容 |
|---|---|
| Phase 1 全站修复 | viewport 允许缩放；PWA 补 manifest + 图标；4 页补 `show_tab_bar` block 修遮挡；sw.js 缓存升级 |
| Phase 2 共享库增强 | `renderLeaderboard` 双指标独立渲染（Avalon 需均分 + 胜负同显），向后兼容 |
| Phase 3 轻量修补 | LoveLetters（segment 控件/死代码/block）、ModernArt、cabo（仅 block） |
| Phase 4 flip7 | FAB → `.apple-fab`；计分全屏 → 共享 sheet；结束弹窗 → 共享 modal；player-list → 共享 list；删冗余 CSS |
| Phase 5 lasvegas | 三套弹层统一为 1 modal + 1 sheet（保留全部 id 与函数签名）；CSS 瘦身 |
| Phase 6 Avalon | 6 个 overlay → 共享 modal + `avalon_overlay()` 统一显示控制；echarts → 纯 CSS 统计徽章；排行榜 → 共享 `renderLeaderboard`；删 80px padding |
| Phase 7 回归 | 390x844 视口逐页检查 + 双标签页基本对局 + smoke_check |

### 关键设计点

**Avalon**：
- tab bar **保留**（门户型页面，游戏结束后高频跳回首页/列表；删 80px 覆盖让共享 padding 生效即可）
- echarts → 纯 CSS 统计：任务结果序列（成功=蓝勾/失败=紫/关键失败=脉冲）+ 玩家投票矩阵（赞=绿勾/反=红叉/在车上=描边），用 `state.history` 现有数据，`#dashboard-chart` id 保留
- 排行榜 → `renderLeaderboard(el, state.lbData, {showAvgScore:true, showWinLoss:true, showTotal:false})`；**不引入 `<leaderboard-section>` 自定义元素**（renderUI 每秒重建 innerHTML 会触发每秒 refetch）
- 显示控制统一为 `avalon_overlay(id, show)`（classList.toggle），替换 9 处 `style.display` 切换；**所有 overlay 与子元素 id 保持不变**（JS L1523-1672 引用）

**lasvegas**：`showOverlay/hideOverlay(id)` 函数签名保持（bindEvents 引用），内部改 `.show` class 切换；结束确认 → modal，内容浏览（setup/info）→ sheet 抽屉。

**flip7**：JS 已用 `classList.add/remove('show')` 控制遮罩，天然兼容共享 overlay，零 JS 改动（仅 FAB 的 display 控制目标从 button 移 wrapper）。

### 测试策略

- 冒烟：`python main.py`（端口 8000）+ `python scripts/smoke_check.py --base-url http://127.0.0.1:8000`
- 浏览器实测（390x844 移动视口）：逐页布局无遮挡、暗黑模式（含 modal/sheet）、overlay 开合/点遮罩关闭、Console 零报错、触摸缩放
- 双标签页基本对局：Avalon（建房→加入→开始→组队→公投→任务→结束）、lasvegas（加人→布置→加钞→结束）、flip7（加人→记分→结束→新游戏），验证状态同步与 overlay 双开不冲突

### 风险与回退

- Avalon overlay 显示逻辑改动面最大 → `avalon_overlay()` 一次性替换 + 逐 overlay 走场景 + 独立 commit 可 revert
- lasvegas IIFE 作用域 → 只改函数体，签名不变
- flip7 FAB 控制目标变化 → 改后立即验证"无玩家时隐藏"
- renderLeaderboard 增强 → 默认参数不变，向后兼容
- 每 Phase 独立 commit，单页可独立回退
