# Frontend Refactor — 桌游助手移动端重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the entire Board Game Portal frontend for mobile-first UX: unify to vanilla JS, add bottom tab bar navigation, create shared components, and standardize all 9 game pages.

**Architecture:** Server-rendered Jinja2 templates with vanilla JS enhancement. Shared CSS design system (`common.css`), shared JS utilities (`common.js`), and Web Components (`components.js`). Bottom tab bar on main pages, top nav with back button on game pages. Backend unchanged.

**Tech Stack:** HTML5, CSS3 (CSS Variables, prefers-color-scheme), Vanilla JS (Custom Elements v1, fetch, Promise), Phosphor Icons CDN, Socket.IO CDN (3 games), ECharts CDN (1 game)

---

## File Map

```
static/
├── common.css          # Design system (CREATE - replaces current)
├── common.js           # Shared utilities (CREATE)
├── components.js       # Custom elements (CREATE)
└── sw.js               # PWA service worker (CREATE)

templates/
├── base.html           # Base template with tab bar (REWRITE)
├── index.html          # Homepage (REWRITE)
└── gamelist.html       # Game list (REWRITE)

Avalon/index.html       # Complex game (REWRITE: Vue→vanilla JS)
cabo/index.html         # Medium game (REWRITE: Vue→vanilla JS)
lasvegas/index.html     # Medium game (REWRITE: Alpine→vanilla JS)
LoveLetters/index.html  # Complex game (REWRITE: Vue→vanilla JS)
flip7/index.html        # Medium game (REWRITE: Vue→vanilla JS)
ModernArt/index.html    # Medium game (REWRITE: vanilla JS, UI refresh)
splendor/index.html     # Simple game (REWRITE: use components)
explodingkittens/index.html  # Simple game (REWRITE: use components)
thegang/index.html      # Simple game (REWRITE: use components)
```

---

### Task 1: Rewrite common.css — Design System Foundation

**Files:**
- Rewrite: `static/common.css`

This is the single source of truth for all styling. All pages inherit from this file.

- [ ] **Step 1: Write the new common.css**

Write the complete design system CSS:

```css
/* ============================================
   Board Game Portal — Design System (Mobile First)
   ============================================ */

/* ---- 1. Design Tokens ---- */
:root {
    /* Colors */
    --color-bg: #f5f5f7;
    --color-surface: #ffffff;
    --color-text: #1d1d1f;
    --color-text-secondary: #86868b;
    --color-border: rgba(0, 0, 0, 0.08);
    --color-blue: #0071e3;
    --color-blue-bg: rgba(0, 113, 227, 0.08);
    --color-green: #34c759;
    --color-green-bg: rgba(52, 199, 89, 0.08);
    --color-red: #ff3b30;
    --color-red-bg: rgba(255, 59, 48, 0.08);
    --color-orange: #ff9500;
    --color-orange-bg: rgba(255, 149, 0, 0.08);
    --color-purple: #af52de;
    --color-purple-bg: rgba(175, 82, 222, 0.08);
    --color-yellow: #ffcc00;
    --color-teal: #5ac8fa;

    /* Typography */
    --font-stack: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;

    /* Shadows */
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04);
    --shadow-md: 0 4px 14px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.08);

    /* Radii */
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 18px;
    --radius-xl: 24px;
    --radius-full: 999px;

    /* Spacing (4px grid) */
    --space-xs: 4px;
    --space-sm: 8px;
    --space-md: 16px;
    --space-lg: 24px;
    --space-xl: 40px;
    --space-2xl: 60px;

    /* Transitions */
    --ease-out: cubic-bezier(0.25, 1, 0.5, 1);
    --transition-fast: 0.15s var(--ease-out);
    --transition-normal: 0.3s var(--ease-out);

    /* Safe areas */
    --safe-bottom: env(safe-area-inset-bottom, 0px);
    --safe-top: env(safe-area-inset-top, 0px);
}

/* ---- 2. Reset & Base ---- */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    scroll-behavior: smooth;
}

body {
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-stack);
    font-size: 16px;
    line-height: 1.5;
    min-height: 100vh;
    padding-bottom: calc(64px + var(--safe-bottom));
    padding-top: calc(56px + var(--safe-top));
}

body.no-tab-bar {
    padding-bottom: var(--safe-bottom);
}

/* ---- 3. Typography ---- */
h1 { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.03em; }
h2 { font-size: 1.35rem; font-weight: 700; letter-spacing: -0.02em; }
h3 { font-size: 1.15rem; font-weight: 600; letter-spacing: -0.01em; }
p { color: var(--color-text-secondary); line-height: 1.6; }
a { color: var(--color-blue); text-decoration: none; }

/* ---- 4. Layout ---- */
.container { width: 100%; max-width: 680px; margin: 0 auto; padding: 0 var(--space-md); }
.page-section { padding: var(--space-lg) 0; }

/* ---- 5. Navigation ---- */
/* Top Nav */
.top-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    background: rgba(245, 245, 247, 0.82);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-bottom: 1px solid var(--color-border);
    padding-top: var(--safe-top);
}
.top-nav-inner {
    display: flex; align-items: center; justify-content: center;
    height: 56px; padding: 0 var(--space-md); position: relative;
    max-width: 680px; margin: 0 auto;
}
.top-nav-title { font-size: 1.05rem; font-weight: 700; letter-spacing: -0.02em; }
.top-nav-left { position: absolute; left: var(--space-md); display: flex; align-items: center; gap: 4px; }
.top-nav-right { position: absolute; right: var(--space-md); }
.top-nav-back {
    display: inline-flex; align-items: center; gap: 4px; color: var(--color-blue);
    font-size: 0.95rem; font-weight: 500; text-decoration: none; min-height: 44px;
}

/* Bottom Tab Bar */
.tab-bar {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000;
    background: rgba(245, 245, 247, 0.88);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-top: 1px solid var(--color-border);
    padding-bottom: var(--safe-bottom);
    display: flex;
}
.tab-bar-item {
    flex: 1; display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 8px 0; min-height: 56px;
    color: var(--color-text-secondary); text-decoration: none;
    transition: color var(--transition-fast); gap: 2px;
    -webkit-tap-highlight-color: transparent;
}
.tab-bar-item .tab-icon { font-size: 1.4rem; line-height: 1; }
.tab-bar-item .tab-label { font-size: 0.65rem; font-weight: 600; }
.tab-bar-item.active { color: var(--color-blue); }

/* ---- 6. Components ---- */
/* Buttons */
.btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    font-family: var(--font-stack); font-size: 0.9rem; font-weight: 600;
    border: none; border-radius: var(--radius-full); padding: 12px 24px;
    cursor: pointer; transition: all var(--transition-fast);
    -webkit-tap-highlight-color: transparent; min-height: 44px;
    text-decoration: none; line-height: 1.2; outline: none;
}
.btn:active { transform: scale(0.96); }
.btn-primary { background: var(--color-blue); color: #fff; }
.btn-secondary { background: rgba(0, 0, 0, 0.06); color: var(--color-text); }
.btn-danger { background: var(--color-red); color: #fff; }
.btn-outline { background: transparent; border: 1.5px solid rgba(0, 0, 0, 0.15); color: var(--color-blue); }
.btn-block { width: 100%; }
.btn-sm { font-size: 0.82rem; padding: 8px 18px; min-height: 36px; }
.btn-lg { font-size: 1rem; padding: 14px 28px; }

/* Cards */
.card {
    background: var(--color-surface); border-radius: var(--radius-lg);
    padding: var(--space-lg); margin-bottom: var(--space-md);
    box-shadow: var(--shadow-sm);
}

/* Game Cards (grid items) */
.game-card-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}
@media (min-width: 500px) {
    .game-card-grid { grid-template-columns: 1fr 1fr 1fr; }
}
.game-card-item {
    background: var(--color-surface); border-radius: 16px; padding: 16px;
    box-shadow: var(--shadow-sm); text-decoration: none; color: inherit;
    display: flex; flex-direction: column; gap: 8px; transition: transform var(--transition-fast);
    -webkit-tap-highlight-color: transparent;
}
.game-card-item:active { transform: scale(0.97); }
.game-card-item.disabled { opacity: 0.45; pointer-events: none; }
.game-card-item .gc-icon {
    width: 44px; height: 44px; border-radius: 12px; display: flex;
    align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0;
}
.game-card-item .gc-name { font-weight: 700; font-size: 0.92rem; line-height: 1.2; }
.game-card-item .gc-desc { font-size: 0.72rem; color: var(--color-text-secondary); }
.game-card-item .gc-meta { font-size: 0.7rem; color: var(--color-text-secondary); font-weight: 500; }

/* Game Detail Cards (list page) */
.game-detail-card {
    background: var(--color-surface); border-radius: var(--radius-lg); padding: 20px;
    margin-bottom: 12px; box-shadow: var(--shadow-sm);
}
.game-detail-card .gd-header { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
.game-detail-card .gd-icon {
    width: 52px; height: 52px; border-radius: 14px; display: flex;
    align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;
}
.game-detail-card .gd-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
.game-detail-card .gd-stat { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--color-text-secondary); }
.game-detail-card .gd-desc { font-size: 0.85rem; color: #48484a; line-height: 1.6; margin-bottom: 10px; }
.game-detail-card .gd-tags { display: flex; flex-wrap: wrap; gap: 6px; }

/* Inputs */
.input {
    width: 100%; font-family: var(--font-stack); font-size: 1rem;
    padding: 12px 16px; border: 1.5px solid rgba(0, 0, 0, 0.12);
    border-radius: var(--radius-md); background: var(--color-surface);
    color: var(--color-text); outline: none; -webkit-appearance: none;
    transition: border-color var(--transition-fast);
}
.input:focus { border-color: var(--color-blue); }

/* Lists */
.list {
    background: var(--color-surface); border-radius: var(--radius-lg);
    overflow: hidden; box-shadow: var(--shadow-sm);
}
.list-item {
    display: flex; align-items: center; padding: 14px var(--space-lg);
    border-bottom: 0.5px solid rgba(0, 0, 0, 0.05);
    gap: var(--space-md);
}
.list-item:last-child { border-bottom: none; }
.list-item-content { flex: 1; min-width: 0; }
.list-item-title { font-size: 1rem; font-weight: 600; }
.list-item-subtitle { font-size: 0.8rem; color: var(--color-text-secondary); margin-top: 2px; }

/* Rank Badges */
.rank-badge {
    width: 32px; height: 32px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; font-size: 0.85rem;
    font-weight: 700; color: #fff; flex-shrink: 0;
}
.rank-1 { background: var(--color-orange); }
.rank-2 { background: #a0aec0; }
.rank-3 { background: #cd7f32; }
.rank-other { background: rgba(0, 0, 0, 0.12); color: var(--color-text-secondary); }

/* Tags */
.tag {
    display: inline-flex; padding: 4px 10px; border-radius: 6px;
    background: rgba(0, 0, 0, 0.04); font-size: 0.75rem; font-weight: 600;
    color: var(--color-text-secondary);
}
.tag-mech { background: var(--color-blue-bg); color: var(--color-blue); }

/* Filter Chips */
.filter-scroll {
    display: flex; gap: 8px; overflow-x: auto; padding: 4px 0 12px;
    scrollbar-width: none; -ms-overflow-style: none;
    -webkit-overflow-scrolling: touch;
}
.filter-scroll::-webkit-scrollbar { display: none; }
.filter-chip {
    flex-shrink: 0; padding: 8px 18px; border-radius: var(--radius-full);
    background: rgba(0, 0, 0, 0.06); border: none; font-size: 0.85rem;
    font-weight: 600; cursor: pointer; font-family: var(--font-stack);
    min-height: 38px; transition: all var(--transition-fast);
    -webkit-tap-highlight-color: transparent; color: var(--color-text);
}
.filter-chip.active { background: var(--color-blue); color: #fff; }

/* Modal */
.modal-overlay {
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    z-index: 10000; display: flex; align-items: center; justify-content: center;
    padding: var(--space-lg); opacity: 0; pointer-events: none;
    transition: opacity var(--transition-normal);
}
.modal-overlay.show { opacity: 1; pointer-events: auto; }
.modal-content {
    background: var(--color-surface); border-radius: var(--radius-xl);
    width: 100%; max-width: 400px; max-height: 80vh;
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: var(--shadow-lg); transform: scale(0.95);
    transition: transform var(--transition-normal);
}
.modal-overlay.show .modal-content { transform: scale(1); }
.modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: var(--space-lg); border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    flex-shrink: 0;
}
.modal-title { font-size: 1.15rem; font-weight: 700; }
.modal-close {
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: rgba(0, 0, 0, 0.06); cursor: pointer; display: flex;
    align-items: center; justify-content: center; font-size: 1rem;
    color: var(--color-text-secondary);
}
.modal-body { padding: var(--space-lg); overflow-y: auto; flex: 1; }
.modal-footer { padding: var(--space-md) var(--space-lg); display: flex; gap: 12px; flex-shrink: 0; }

/* Bottom Sheet */
.sheet-overlay {
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    z-index: 10000; display: flex; align-items: flex-end; justify-content: center;
    opacity: 0; pointer-events: none; transition: opacity var(--transition-normal);
}
.sheet-overlay.show { opacity: 1; pointer-events: auto; }
.sheet-content {
    background: var(--color-surface); border-radius: 22px 22px 0 0;
    width: 100%; max-width: 500px; max-height: 85vh;
    display: flex; flex-direction: column; overflow: hidden;
    transform: translateY(100%); transition: transform 0.35s var(--ease-out);
    padding-bottom: var(--safe-bottom);
}
.sheet-overlay.show .sheet-content { transform: translateY(0); }
.sheet-handle {
    width: 36px; height: 5px; border-radius: 3px; background: rgba(0, 0, 0, 0.15);
    margin: 12px auto;
}

/* Toast */
.toast {
    position: fixed; top: calc(20px + var(--safe-top)); left: 50%; transform: translateX(-50%);
    padding: 12px 24px; border-radius: 30px; z-index: 20000;
    font-size: 0.9rem; font-weight: 600; color: var(--color-text);
    background: var(--color-surface); box-shadow: var(--shadow-lg);
    opacity: 0; pointer-events: none; transition: all 0.3s var(--ease-out);
    text-align: center; white-space: nowrap;
}
.toast.show { opacity: 1; }
.toast-success { background: var(--color-green); color: #fff; }
.toast-error { background: var(--color-red); color: #fff; }

/* Hero */
.hero { text-align: center; padding: var(--space-lg) 0; }
.hero-emoji { font-size: 3rem; display: block; margin-bottom: var(--space-sm); }
.hero h1 { margin-bottom: 4px; }
.hero p { font-size: 1rem; }

/* Quick Action Card */
.quick-action {
    background: linear-gradient(135deg, #0071e3, #5ac8fa);
    border-radius: 20px; padding: 24px 20px; color: #fff; margin-bottom: 20px;
}
.quick-action-label { font-size: 0.8rem; opacity: 0.8; font-weight: 600; margin-bottom: 4px; }
.quick-action-title { font-size: 1.2rem; font-weight: 800; margin-bottom: 4px; }
.quick-action-desc { font-size: 0.85rem; opacity: 0.85; margin-bottom: 14px; }

/* Empty State */
.empty-state { text-align: center; padding: var(--space-2xl) var(--space-md); color: var(--color-text-secondary); }
.empty-state-icon { font-size: 2.5rem; display: block; margin-bottom: var(--space-sm); }

/* Section title */
.section-title { font-size: 1.1rem; font-weight: 700; margin: var(--space-lg) 0 var(--space-sm); }

/* Chips (player badges) */
.chip {
    display: inline-flex; padding: 8px 16px; border-radius: var(--radius-full);
    font-size: 0.85rem; font-weight: 600; background: rgba(0, 0, 0, 0.04);
    color: var(--color-text);
}
.chip.me { background: var(--color-blue-bg); color: var(--color-blue); }

/* Alerts */
.alert {
    padding: 12px var(--space-md); border-radius: var(--radius-md);
    font-size: 0.85rem; font-weight: 500; text-align: center;
}
.alert-info { background: var(--color-blue-bg); color: var(--color-blue); }
.alert-success { background: var(--color-green-bg); color: var(--color-green); }
.alert-danger { background: var(--color-red-bg); color: var(--color-red); }

/* ---- 7. Utilities ---- */
.text-center { text-align: center; }
.text-muted { color: var(--color-text-secondary) !important; }
.text-blue { color: var(--color-blue) !important; }
.text-red { color: var(--color-red) !important; }
.text-green { color: var(--color-green) !important; }
.text-orange { color: var(--color-orange) !important; }
.text-purple { color: var(--color-purple) !important; }

.bg-blue { background: var(--color-blue-bg) !important; }
.bg-green { background: var(--color-green-bg) !important; }
.bg-red { background: var(--color-red-bg) !important; }
.bg-orange { background: var(--color-orange-bg) !important; }
.bg-purple { background: var(--color-purple-bg) !important; }

.mt-sm { margin-top: var(--space-sm); }
.mt-md { margin-top: var(--space-md); }
.mt-lg { margin-top: var(--space-lg); }
.mb-sm { margin-bottom: var(--space-sm); }
.mb-md { margin-bottom: var(--space-md); }
.mb-lg { margin-bottom: var(--space-lg); }

.d-flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-sm { gap: var(--space-sm); }
.gap-md { gap: var(--space-md); }
.flex-1 { flex: 1; }
.w-full { width: 100%; }
.hidden { display: none !important; }
.opacity-50 { opacity: 0.5; }

/* ---- 8. Animations ---- */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
.anim-fade-in { animation: fadeIn 0.4s var(--ease-out); }

/* ---- 9. Dark Mode ---- */
@media (prefers-color-scheme: dark) {
    :root {
        --color-bg: #000000;
        --color-surface: #1c1c1e;
        --color-text: #f5f5f7;
        --color-text-secondary: #98989d;
        --color-border: rgba(255, 255, 255, 0.08);
        --color-blue-bg: rgba(10, 132, 255, 0.15);
        --color-green-bg: rgba(48, 209, 88, 0.15);
        --color-red-bg: rgba(255, 69, 58, 0.15);
        --color-orange-bg: rgba(255, 159, 10, 0.15);
        --color-purple-bg: rgba(191, 90, 242, 0.15);
        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
        --shadow-md: 0 4px 14px rgba(0, 0, 0, 0.4);
        --shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.5);
    }
    .top-nav { background: rgba(0, 0, 0, 0.82); }
    .tab-bar { background: rgba(0, 0, 0, 0.88); }
    .btn-secondary { background: rgba(255, 255, 255, 0.1); }
    .filter-chip { background: rgba(255, 255, 255, 0.08); }
    .tag { background: rgba(255, 255, 255, 0.06); }
    .chip { background: rgba(255, 255, 255, 0.06); }
    .game-detail-card .gd-desc { color: #b0b0b5; }
    .quick-action { background: linear-gradient(135deg, #0a84ff, #5ac8fa); }
}
```

- [ ] **Step 2: Verify CSS file exists and is valid**

Run: `wc -l static/common.css`
Expected: ~350 lines

- [ ] **Step 3: Commit**

```bash
git add static/common.css
git commit -m "refactor: rewrite common.css with modular mobile-first design system"
```

---

### Task 2: Create common.js — Shared Utilities

**Files:**
- Create: `static/common.js`

All pages load this file via base.html. It provides toast notifications, confirm dialogs, a fetch wrapper, HTML escaping, and a shared leaderboard renderer.

- [ ] **Step 1: Write common.js**

```javascript
/**
 * Board Game Portal — Shared Utilities
 * Loaded by base.html, available on all pages.
 */

// ---- HTML Escape ----
window.escHtml = function (str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
};

// ---- API Helper ----
window.api = async function (url, opts) {
    opts = opts || {};
    var method = opts.method || 'GET';
    var init = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (opts.body) init.body = JSON.stringify(opts.body);
    var res = await fetch(url, init);
    if (!res.ok) {
        var err = await res.json().catch(function () { return { detail: 'Request failed' }; });
        throw new Error(err.detail || 'Request failed');
    }
    return res.json();
};

// ---- Toast Notification ----
window.showToast = function (message, type) {
    type = type || 'info';
    // Remove existing toast
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'toast' + (type !== 'info' ? ' toast-' + type : '');
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(function () {
        toast.classList.remove('show');
        setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
};

// ---- Confirm Dialog ----
window.showConfirm = function (message, confirmText, cancelText) {
    confirmText = confirmText || '确认';
    cancelText = cancelText || '取消';
    return new Promise(function (resolve) {
        var overlay = document.createElement('div');
        overlay.style.cssText =
            'position:fixed;inset:0;background:rgba(0,0,0,0.4);backdrop-filter:blur(8px);' +
            '-webkit-backdrop-filter:blur(8px);z-index:10000;display:flex;align-items:center;' +
            'justify-content:center;opacity:0;transition:opacity 0.3s ease-out;';

        var modal = document.createElement('div');
        modal.style.cssText =
            'background:var(--color-surface,#fff);border-radius:22px;width:290px;text-align:center;' +
            'overflow:hidden;transform:scale(0.95);transition:transform 0.3s ease-out;' +
            'box-shadow:var(--shadow-lg,0 12px 40px rgba(0,0,0,0.08));';

        var msg = document.createElement('div');
        msg.style.cssText = 'padding:28px 20px 20px;font-size:1.05rem;font-weight:600;color:var(--color-text,#1d1d1f);';
        msg.textContent = message;

        var btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;border-top:1px solid rgba(0,0,0,0.08);';

        var btnCancel = document.createElement('button');
        btnCancel.textContent = cancelText;
        btnCancel.style.cssText =
            'flex:1;padding:14px 0;background:transparent;border:none;border-right:1px solid rgba(0,0,0,0.08);' +
            'font-size:1rem;color:var(--color-text-secondary,#86868b);font-family:var(--font-stack);' +
            'font-weight:500;cursor:pointer;';
        btnCancel.addEventListener('click', function () { cleanup(false); });

        var btnConfirm = document.createElement('button');
        btnConfirm.textContent = confirmText;
        btnConfirm.style.cssText =
            'flex:1;padding:14px 0;background:transparent;border:none;font-size:1rem;' +
            'color:var(--color-blue,#0071e3);font-family:var(--font-stack);font-weight:700;cursor:pointer;';
        btnConfirm.addEventListener('click', function () { cleanup(true); });

        btnRow.appendChild(btnCancel);
        btnRow.appendChild(btnConfirm);
        modal.appendChild(msg);
        modal.appendChild(btnRow);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(function () {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        });

        function cleanup(result) {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            setTimeout(function () { overlay.remove(); }, 300);
            resolve(result);
        }
    });
};

// ---- Shared Leaderboard Renderer ----
window.renderLeaderboard = function (container, data, opts) {
    opts = opts || {};
    var emptyIcon = opts.emptyIcon || '👻';
    var emptyText = opts.emptyText || '还没人玩过呢，快去开一局！';
    var showAvgScore = opts.showAvgScore || false;
    var avgScoreLabel = opts.avgScoreLabel || '均分';
    var showWinLoss = opts.showWinLoss || false;
    var showTotal = opts.showTotal !== false;

    if (!data || data.length === 0) {
        container.innerHTML =
            '<div class="empty-state">' +
            '<span class="empty-state-icon">' + emptyIcon + '</span>' +
            '<p>' + emptyText + '</p>' +
            '</div>';
        return;
    }

    var html = '';
    data.forEach(function (p, idx) {
        var rank = idx + 1;
        var rankClass = rank === 1 ? 'rank-1' : (rank === 2 ? 'rank-2' : (rank === 3 ? 'rank-3' : 'rank-other'));
        var rankIcon = rank === 1 ? '👑' : rank;
        var masteryBadge = p.mastery === 'expert'
            ? '<span style="font-size:0.7rem;color:var(--color-orange,#ff9500);font-weight:700;">👑专精</span>'
            : p.mastery === 'rookie'
            ? '<span style="font-size:0.7rem;color:var(--color-blue,#0071e3);font-weight:600;">🔰新手</span>'
            : '<span style="font-size:0.7rem;color:var(--color-text-secondary,#86868b);font-weight:600;">⏳定级中</span>';

        var totalGames = p.total_games || p.total || 0;
        var wins = p.wins || 0;
        var winRate = p.win_rate || 0;
        var smoothedRate = p.smoothed_rate || 0;

        html += '<div class="list-item"' + (p.mastery === 'provisional' ? ' style="opacity:0.65"' : '') + '>' +
            '<div class="rank-badge ' + rankClass + '">' + rankIcon + '</div>' +
            '<div class="list-item-content">' +
            '<div class="list-item-title">' + escHtml(p.name) + ' ' + masteryBadge + '</div>' +
            '<div class="list-item-subtitle">' + totalGames + '局 · 胜' + wins + '场 · 战力' + winRate + '% · 胜率' + smoothedRate + '%</div>' +
            '</div>' +
            '<div style="text-align:right;display:flex;align-items:center;gap:16px;">';

        if (showAvgScore && p.avg_score !== undefined) {
            html += '<div style="text-align:right;">' +
                '<div style="font-size:0.7rem;color:var(--color-text-secondary,#86868b);margin-bottom:2px;">' + avgScoreLabel + '</div>' +
                '<div style="font-size:1.2rem;font-weight:800;color:var(--color-blue,#0071e3);">' + p.avg_score + '</div>' +
                '</div>';
        }

        if (showWinLoss) {
            html += '<div style="text-align:right;width:40px;">' +
                '<div style="font-size:0.7rem;color:var(--color-text-secondary,#86868b);margin-bottom:2px;">胜负</div>' +
                '<div style="font-size:1.1rem;font-weight:700;color:var(--color-text-secondary,#86868b);">' + wins + '-' + (totalGames - wins) + '</div>' +
                '</div>';
        }

        html += '</div></div>';
    });

    container.innerHTML = '<div class="list">' + html + '</div>';
};
```

- [ ] **Step 2: Verify file exists**

Run: `wc -l static/common.js`
Expected: ~150 lines

- [ ] **Step 3: Commit**

```bash
git add static/common.js
git commit -m "feat: add shared JS utilities (toast, confirm, api, leaderboard)"
```

---

### Task 3: Create components.js — Custom Elements

**Files:**
- Create: `static/components.js`

Three custom elements using the Custom Elements v1 API. All use Light DOM to inherit global styles from common.css.

- [ ] **Step 1: Write components.js**

```javascript
/**
 * Board Game Portal — Web Components
 * Custom elements for reusable UI patterns.
 */

// ================================================================
// <game-card> — Game entry card used on homepage and game list
// ================================================================
class GameCard extends HTMLElement {
    connectedCallback() {
        var name = this.getAttribute('name') || '';
        var enName = this.getAttribute('en-name') || '';
        var icon = this.getAttribute('icon-emoji') || '';
        var color = this.getAttribute('color') || 'blue';
        var href = this.getAttribute('href') || '#';
        var disabled = this.hasAttribute('disabled');
        var minP = this.getAttribute('min-players') || '';
        var maxP = this.getAttribute('max-players') || '';
        var recP = this.getAttribute('rec-players') || '';
        var duration = this.getAttribute('duration') || '';
        var age = this.getAttribute('age') || '';
        var difficulty = this.getAttribute('difficulty') || '';
        var rating = this.getAttribute('rating') || '';
        var desc = this.getAttribute('desc') || '';
        var tags = this.getAttribute('tags') || '';
        var tagList = tags ? tags.split(',').map(function (t) { return t.trim(); }) : [];

        var playerText = recP ? '推荐 ' + recP + '人' : (minP + '-' + maxP + '人');

        var tagHtml = tagList.map(function (t) {
            return '<span class="tag tag-mech">' + escHtml(t) + '</span>';
        }).join('');

        var colorBg = 'bg-' + color;
        var colorText = 'text-' + color;

        if (disabled) {
            this.innerHTML =
                '<div class="game-card-item disabled">' +
                '<div class="gc-icon ' + colorBg + ' ' + colorText + '">' + icon + '</div>' +
                '<div class="gc-name">' + escHtml(name) + ' <span style="font-size:0.65rem;color:var(--color-text-secondary);font-weight:600;">维护中</span></div>' +
                '<div class="gc-desc">' + escHtml(desc) + '</div>' +
                '<div class="gc-meta">' + playerText + '</div>' +
                '</div>';
        } else {
            this.innerHTML =
                '<a href="' + href + '" class="game-card-item">' +
                '<div class="gc-icon ' + colorBg + ' ' + colorText + '">' + icon + '</div>' +
                '<div class="gc-name">' + escHtml(name) + '</div>' +
                '<div class="gc-desc">' + escHtml(desc) + '</div>' +
                '<div class="gc-meta">' + playerText + '</div>' +
                '</a>';
        }
    }
}
customElements.define('game-card', GameCard);

// ================================================================
// <player-list> — Player management (add/remove/select winner)
// ================================================================
class PlayerList extends HTMLElement {
    connectedCallback() {
        this._apiBase = this.getAttribute('api-base') || '';
        this._mode = this.getAttribute('mode') || 'simple'; // "simple" | "winner-select" | "coop"
        this._selectedWinner = null;
        this._players = [];
        this._render();
        this._fetchPlayers();
    }

    _render() {
        var self = this;
        this.innerHTML =
            '<div style="display:flex;gap:8px;margin-bottom:12px">' +
            '<input class="input js-pl-input" placeholder="输入玩家名" style="flex:1" onkeydown="if(event.key===\'Enter\')this.closest(\'player-list\').addPlayer()">' +
            '<button class="btn btn-primary js-pl-add">添加</button>' +
            '</div>' +
            '<div class="js-pl-list"></div>' +
            (this._mode !== 'simple'
                ? '<div class="js-pl-winner mt-md"></div>'
                : '');

        this.querySelector('.js-pl-add').addEventListener('click', function () { self.addPlayer(); });
    }

    async _fetchPlayers() {
        try {
            var res = await api(this._apiBase + '/status');
            this._players = res.players || [];
            this._updateList();
        } catch (e) { /* server not ready yet */ }
    }

    _updateList() {
        var listEl = this.querySelector('.js-pl-list');
        var self = this;
        if (this._players.length === 0) {
            listEl.innerHTML = '<p class="text-muted text-center" style="padding:12px 0">暂无玩家</p>';
        } else {
            listEl.innerHTML = this._players.map(function (name) {
                return '<div class="list-item" style="padding:8px 0">' +
                    '<div class="list-item-content"><div class="list-item-title">' + escHtml(name) + '</div></div>' +
                    '<button class="btn btn-sm btn-secondary" style="color:var(--color-red,#ff3b30)" data-name="' + escHtml(name) + '">移除</button>' +
                    '</div>';
            }).join('');
            // Bind remove buttons
            listEl.querySelectorAll('button').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var name = btn.getAttribute('data-name');
                    self.removePlayer(name);
                });
            });
        }
        if (this._mode !== 'simple') {
            this._updateWinnerSelect();
        }
    }

    _updateWinnerSelect() {
        var el = this.querySelector('.js-pl-winner');
        if (!el) return;
        var self = this;
        if (this._players.length === 0) {
            el.innerHTML = '<p class="text-muted text-center text-sm">请先添加玩家</p>';
            return;
        }
        if (this._mode === 'coop') {
            el.innerHTML =
                '<div style="display:flex;gap:8px">' +
                '<button class="btn btn-primary flex-1 js-pl-win">全员胜利 🎉</button>' +
                '<button class="btn btn-danger flex-1 js-pl-lose">全员失败 💀</button>' +
                '</div>';
            el.querySelector('.js-pl-win').addEventListener('click', function () {
                self.dispatchEvent(new CustomEvent('record', { detail: { isWin: true } }));
            });
            el.querySelector('.js-pl-lose').addEventListener('click', function () {
                self.dispatchEvent(new CustomEvent('record', { detail: { isWin: false } }));
            });
        } else {
            // winner-select mode
            el.innerHTML = '<p class="text-muted text-sm mb-sm">选择本局胜者</p>' +
                '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
                this._players.map(function (name) {
                    var active = self._selectedWinner === name;
                    return '<button class="btn ' + (active ? 'btn-primary' : 'btn-secondary') + ' btn-sm js-pl-select" data-name="' + escHtml(name) + '">' + escHtml(name) + '</button>';
                }).join('') +
                '</div>';
            el.querySelectorAll('.js-pl-select').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    self._selectedWinner = btn.getAttribute('data-name');
                    self._updateWinnerSelect();
                });
            });
        }
    }

    async addPlayer() {
        var input = this.querySelector('.js-pl-input');
        var name = (input.value || '').trim();
        if (!name) return;
        try {
            await api(this._apiBase + '/add_player', { method: 'POST', body: { name: name } });
            input.value = '';
            await this._fetchPlayers();
        } catch (e) {
            showToast(e.message || '添加失败', 'error');
        }
    }

    async removePlayer(name) {
        try {
            await api(this._apiBase + '/remove_player', { method: 'POST', body: { name: name } });
            if (this._selectedWinner === name) this._selectedWinner = null;
            await this._fetchPlayers();
        } catch (e) { /* ignore */ }
    }

    getSelectedWinner() {
        return this._selectedWinner;
    }

    refresh() {
        this._fetchPlayers();
    }
}
customElements.define('player-list', PlayerList);

// ================================================================
// <leaderboard-section> — Async leaderboard panel
// ================================================================
class LeaderboardSection extends HTMLElement {
    connectedCallback() {
        this._apiUrl = this.getAttribute('api-url') || '';
        this._emptyIcon = this.getAttribute('empty-icon') || '👻';
        this._emptyText = this.getAttribute('empty-text') || '还没人玩过呢，快去开一局！';
        this._showAvgScore = this.hasAttribute('show-avg-score');
        this._avgScoreLabel = this.getAttribute('avg-score-label') || '均分';
        this._showWinLoss = this.hasAttribute('show-win-loss');
        this._showTotal = !this.hasAttribute('no-total');

        this.innerHTML =
            '<div class="section-title">🏆 历史排行榜</div>' +
            '<div class="js-lb-container"><div class="empty-state"><span class="empty-state-icon">⏳</span><p>加载中...</p></div></div>';

        this._fetch();
    }

    async _fetch() {
        if (!this._apiUrl) return;
        try {
            var res = await api(this._apiUrl);
            var data = Array.isArray(res) ? res : (res.leaderboard || []);
            var container = this.querySelector('.js-lb-container');
            renderLeaderboard(container, data, {
                emptyIcon: this._emptyIcon,
                emptyText: this._emptyText,
                showAvgScore: this._showAvgScore,
                avgScoreLabel: this._avgScoreLabel,
                showWinLoss: this._showWinLoss,
                showTotal: this._showTotal
            });
        } catch (e) {
            this.querySelector('.js-lb-container').innerHTML =
                '<div class="empty-state"><span class="empty-state-icon">⚠️</span><p>加载排行榜失败</p></div>';
        }
    }

    refresh() {
        this._fetch();
    }
}
customElements.define('leaderboard-section', LeaderboardSection);
```

- [ ] **Step 2: Verify file exists**

Run: `wc -l static/components.js`
Expected: ~190 lines

- [ ] **Step 3: Commit**

```bash
git add static/components.js
git commit -m "feat: add custom elements (game-card, player-list, leaderboard-section)"
```

---

### Task 4: Rewrite base.html — Base Template with Tab Bar

**Files:**
- Rewrite: `templates/base.html`

The core template that all pages extend. Two modes: with tab bar (main pages) and without (game pages), controlled by `{% block show_tab_bar %}`.

- [ ] **Step 1: Write base.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>{% block title %}桌游助手{% endblock %}</title>
    <link href="/static/common.css" rel="stylesheet">
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <meta name="theme-color" content="#1d1d1f" media="(prefers-color-scheme: dark)">
    <meta name="theme-color" content="#f5f5f7" media="(prefers-color-scheme: light)">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="桌游助手">
    <script src="/static/common.js"></script>
    {% block extra_head %}{% endblock %}
</head>
<body class="{% block body_class %}{% endblock %}">
    <!-- Top Navigation -->
    <nav class="top-nav">
        <div class="top-nav-inner">
            <div class="top-nav-left">
                {% block nav_left %}{% endblock %}
            </div>
            <span class="top-nav-title">{% block nav_title %}🎲 桌游助手{% endblock %}</span>
            <div class="top-nav-right">
                {% block nav_right %}{% endblock %}
            </div>
        </div>
    </nav>

    <!-- Content -->
    {% block content %}{% endblock %}

    <!-- Bottom Tab Bar (main pages only) -->
    {% block show_tab_bar %}
    <nav class="tab-bar">
        <a href="/" class="tab-bar-item {% block tab_home_active %}{% endblock %}">
            <span class="tab-icon">🏠</span>
            <span class="tab-label">首页</span>
        </a>
        <a href="/gamelist" class="tab-bar-item {% block tab_games_active %}{% endblock %}">
            <span class="tab-icon">🎮</span>
            <span class="tab-label">游戏</span>
        </a>
        <a href="/#leaderboard" class="tab-bar-item">
            <span class="tab-icon">🏆</span>
            <span class="tab-label">排行</span>
        </a>
    </nav>
    {% endblock %}

    <!-- PWA Registration -->
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/sw.js').catch(function () {});
        }
    </script>
    {% block extra_body %}{% endblock %}
</body>
</html>
```

- [ ] **Step 2: Verify the template is valid**

Check that Jinja2 block syntax is correct with no missing `{% endblock %}` tags.

- [ ] **Step 3: Commit**

```bash
git add templates/base.html
git commit -m "refactor: rewrite base.html with bottom tab bar and simplified nav"
```

---

### Task 5: Rewrite index.html — Homepage

**Files:**
- Rewrite: `templates/index.html`

Homepage with quick-action hero, game card grid, and leaderboard preview. Uses `<game-card>` custom elements and shared leaderboard renderer.

- [ ] **Step 1: Write index.html**

```html
{% extends "base.html" %}

{% block title %}桌游助手{% endblock %}

{% block tab_home_active %}active{% endblock %}

{% block extra_head %}
<script src="/static/components.js"></script>
<style>
    .starter-result {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 14px; padding: 12px 16px; margin-top: 12px;
        display: flex; align-items: center; justify-content: space-between;
        font-weight: 700; font-size: 1rem;
    }
    .starter-control {
        display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 12px;
    }
    .starter-control button {
        width: 44px; height: 44px; border-radius: 50%; border: none;
        background: rgba(255, 255, 255, 0.25); color: #fff; font-size: 1.4rem;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .starter-num {
        font-size: 2.2rem; font-weight: 800; min-width: 40px; text-align: center;
    }
</style>
{% endblock %}

{% block nav_title %}🎲 桌游助手{% endblock %}

{% block content %}
<div class="container">
    <!-- Quick Action: Random Starter -->
    <div class="quick-action js-starter-widget">
        <div class="quick-action-label">快速开局</div>
        <div class="quick-action-title">🎲 随机初始玩家</div>
        <div class="quick-action-desc">选择玩家人数，一键摇出先手玩家</div>
        <div class="starter-control">
            <button class="js-starter-minus">−</button>
            <span class="starter-num js-starter-count">6</span>
            <button class="js-starter-plus">+</button>
        </div>
        <button class="btn" style="background:rgba(255,255,255,0.25);color:#fff;width:100%;" onclick="rollStarter()">
            摇一摇
        </button>
        <div class="starter-result js-starter-result" style="display:none"></div>
    </div>

    <!-- Game Grid -->
    <div class="section-title">🎮 游戏</div>
    <div class="game-card-grid">
        {% if 'avalon' in loaded_apps %}
        <game-card name="阿瓦隆" icon-emoji="🛡️" color="blue" href="/avalon/"
            min-players="5" max-players="12" rec-players="7-8" desc="阵营推理·身份隐藏"></game-card>
        {% else %}
        <game-card name="阿瓦隆" icon-emoji="🛡️" color="blue" disabled desc="阵营推理·身份隐藏"></game-card>
        {% endif %}

        {% if 'lasvegas' in loaded_apps %}
        <game-card name="拉斯维加斯" icon-emoji="🎲" color="green" href="/lasvegas/"
            min-players="2" max-players="6" rec-players="4-5" desc="欢乐掷骰·区域争夺"></game-card>
        {% else %}
        <game-card name="拉斯维加斯" icon-emoji="🎲" color="green" disabled desc="欢乐掷骰·区域争夺"></game-card>
        {% endif %}

        {% if 'loveletters' in loaded_apps %}
        <game-card name="情书" icon-emoji="💌" color="red" href="/loveletters/"
            min-players="2" max-players="8" rec-players="4-6" desc="极简卡牌·逻辑盲猜"></game-card>
        {% else %}
        <game-card name="情书" icon-emoji="💌" color="red" disabled desc="极简卡牌·逻辑盲猜"></game-card>
        {% endif %}

        {% if 'cabo' in loaded_apps %}
        <game-card name="卡波" icon-emoji="🪄" color="orange" href="/cabo/"
            min-players="2" max-players="4" rec-players="3-4" desc="记忆博弈·极限换牌"></game-card>
        {% else %}
        <game-card name="卡波" icon-emoji="🪄" color="orange" disabled desc="记忆博弈·极限换牌"></game-card>
        {% endif %}

        {% if 'flip7' in loaded_apps %}
        <game-card name="7连翻" icon-emoji="📚" color="purple" href="/flip7/"
            min-players="3" max-players="12" rec-players="5-6" desc="刺激翻牌·见好就收"></game-card>
        {% else %}
        <game-card name="7连翻" icon-emoji="📚" color="purple" disabled desc="刺激翻牌·见好就收"></game-card>
        {% endif %}

        {% if 'modernart' in loaded_apps %}
        <game-card name="现代艺术" icon-emoji="🎨" color="orange" href="/modernart/"
            min-players="3" max-players="5" rec-players="4-5" desc="艺术拍卖·价值炒作"></game-card>
        {% else %}
        <game-card name="现代艺术" icon-emoji="🎨" color="orange" disabled desc="艺术拍卖·价值炒作"></game-card>
        {% endif %}

        {% if 'splendor' in loaded_apps %}
        <game-card name="璀璨宝石" icon-emoji="💎" color="purple" href="/splendor/"
            min-players="2" max-players="4" rec-players="3" desc="宝石收集·引擎构筑"></game-card>
        {% else %}
        <game-card name="璀璨宝石" icon-emoji="💎" color="purple" disabled desc="宝石收集·引擎构筑"></game-card>
        {% endif %}

        {% if 'explodingkittens' in loaded_apps %}
        <game-card name="炸弹猫" icon-emoji="🐱" color="red" href="/explodingkittens/"
            min-players="2" max-players="5" rec-players="4-5" desc="心跳抽牌·欢乐互坑"></game-card>
        {% else %}
        <game-card name="炸弹猫" icon-emoji="🐱" color="red" disabled desc="心跳抽牌·欢乐互坑"></game-card>
        {% endif %}

        {% if 'thegang' in loaded_apps %}
        <game-card name="纸牌帮" icon-emoji="♠️" color="blue" href="/thegang/"
            min-players="3" max-players="6" rec-players="5" desc="合作扑克·默契考验"></game-card>
        {% else %}
        <game-card name="纸牌帮" icon-emoji="♠️" color="blue" disabled desc="合作扑克·默契考验"></game-card>
        {% endif %}
    </div>

    <div class="text-center mb-lg" style="margin-top:16px">
        <a href="/gamelist" style="color:var(--color-blue);font-weight:600;font-size:0.9rem;display:inline-flex;align-items:center;gap:4px">查看全部 9 款游戏 →</a>
    </div>

    <!-- Global Leaderboard Preview -->
    <div id="leaderboard" class="section-title">🏆 全局成就榜</div>
    {% if leaderboard %}
    <div class="js-global-lb">
        <div class="list">
            {% for player in leaderboard[:3] %}
            <div class="list-item">
                <div class="rank-badge {% if loop.index0 == 0 %}rank-1{% elif loop.index0 == 1 %}rank-2{% elif loop.index0 == 2 %}rank-3{% else %}rank-other{% endif %}">
                    {% if loop.index0 == 0 %}👑{% else %}{{ loop.index0 + 1 }}{% endif %}
                </div>
                <div class="list-item-content">
                    <div class="list-item-title">{{ player.name }}{% if player.pvp_data_strength < 0.4 %} <span style="font-size:0.7rem;color:var(--color-text-secondary);font-weight:600;">⏳定级中</span>{% endif %}</div>
                    <div class="list-item-subtitle">{{ player.total_games }}局 · 胜{{ player.total_wins }}场{% if player.pve_win_rate is not none %} · PvE{{ player.pve_win_rate }}%{% endif %}</div>
                </div>
                <div style="font-size:1.2rem;font-weight:800;color:var(--color-blue)">{{ player.weighted_win_rate }}%</div>
            </div>
            {% endfor %}
        </div>
    </div>
    <div class="text-center mt-md mb-lg" id="lb-expand-hint" style="display:{% if leaderboard|length > 3 %}block{% else %}none{% endif %}">
        <button class="btn btn-secondary btn-sm js-expand-lb">查看完整排行 ↓</button>
    </div>
    <div class="js-lb-full" style="display:none"></div>
    {% else %}
    <div class="empty-state"><span class="empty-state-icon">👻</span><p>还没人玩过呢，快去开一局！</p></div>
    {% endif %}

    <footer style="text-align:center;padding:var(--space-xl) 0;color:var(--color-text-secondary);font-size:0.75rem">
        <p>Board Game Portal © 2026</p>
    </footer>
</div>
{% endblock %}

{% block extra_body %}
<script>
    // ---- Random Starter Widget ----
    var starterCount = 6;
    var countEl = document.querySelector('.js-starter-count');
    var resultEl = document.querySelector('.js-starter-result');

    document.querySelector('.js-starter-minus').addEventListener('click', function () {
        if (starterCount > 2) { starterCount--; countEl.textContent = starterCount; }
    });
    document.querySelector('.js-starter-plus').addEventListener('click', function () {
        if (starterCount < 12) { starterCount++; countEl.textContent = starterCount; }
    });

    window.rollStarter = function () {
        var starter = Math.floor(Math.random() * starterCount) + 1;
        resultEl.style.display = 'flex';
        resultEl.innerHTML = '<span>🎯 本次先手玩家</span><strong>' + starter + '号玩家</strong>';
    };

    // ---- Expand Leaderboard ----
    var expandBtn = document.querySelector('.js-expand-lb');
    if (expandBtn) {
        expandBtn.addEventListener('click', async function () {
            var fullEl = document.querySelector('.js-lb-full');
            try {
                var data = await api('/api/leaderboard');
                renderLeaderboard(fullEl, data, { showTotal: false });
                fullEl.style.display = 'block';
                expandBtn.parentElement.style.display = 'none';
            } catch (e) { /* ignore */ }
        });
    }
</script>
{% endblock %}
```

- [ ] **Step 2: Verify homepage renders correctly**

Check Jinja2 `{% if %}` blocks are balanced and `<game-card>` attributes match component spec.

- [ ] **Step 3: Commit**

```bash
git add templates/index.html
git commit -m "refactor: redesign homepage with quick-action hero and game card grid"
```

---

### Task 6: Rewrite gamelist.html — Game List Page

**Files:**
- Rewrite: `templates/gamelist.html`

Game list with horizontal filter chips and detailed game cards. Rules data lives in a JS object, rules modal is a bottom sheet.

- [ ] **Step 1: Write gamelist.html**

Create the game list page (extract game rules data into JS, similar structure to current but cleaner):

```html
{% extends "base.html" %}

{% block title %}游戏列表 · 桌游助手{% endblock %}

{% block tab_games_active %}active{% endblock %}

{% block extra_head %}
<script src="/static/components.js"></script>
{% endblock %}

{% block nav_title %}🎮 游戏列表{% endblock %}

{% block content %}
<div class="container">
    <!-- Filter Chips -->
    <div class="filter-scroll" id="filterScroll">
        <button class="filter-chip active" data-players="0">全部</button>
        <button class="filter-chip" data-players="2">2人</button>
        <button class="filter-chip" data-players="3">3人</button>
        <button class="filter-chip" data-players="4">4人</button>
        <button class="filter-chip" data-players="5">5人</button>
        <button class="filter-chip" data-players="6">6人</button>
        <button class="filter-chip" data-players="7">7人</button>
        <button class="filter-chip" data-players="8">8人</button>
        <button class="filter-chip" data-players="9">9人+</button>
    </div>

    <!-- Game Detail Cards -->
    <div id="gameCards" class="mb-lg">
        <!-- Rendered by JS -->
    </div>

    <!-- Rules Sheet -->
    <div class="sheet-overlay" id="rulesOverlay" onclick="if(event.target===this)closeRules()">
        <div class="sheet-content">
            <div class="sheet-handle"></div>
            <div class="modal-header" style="padding:0 var(--space-lg) var(--space-md)">
                <h2 class="modal-title" id="rulesTitle">规则</h2>
                <button class="modal-close" onclick="closeRules()">✕</button>
            </div>
            <div style="display:flex;gap:8px;padding:0 var(--space-lg) 12px">
                <button class="filter-chip active js-tab-rule" onclick="switchRulesTab('rule')">📋 规则</button>
                <button class="filter-chip js-tab-guide" onclick="switchRulesTab('guide')">💡 攻略</button>
            </div>
            <div class="modal-body" id="rulesBody" style="padding-top:0">
                <!-- Dynamic content -->
            </div>
        </div>
    </div>
</div>
{% endblock %}

{% block extra_body %}
<script>
// ---- Game Data ----
var GAMES = [
    {
        id: 'splendor', name: '璀璨宝石', enName: 'Splendor', icon: '💎', color: 'purple',
        minP: 2, maxP: 4, recP: '3', duration: '30分钟', age: '10+', difficulty: '2.26/5', rating: '7.4',
        desc: '通过收集宝石购买发展卡，积累财富与声望。以"拿宝石—买卡片—滚雪球"为核心的引擎构筑。',
        tags: ['卡牌选取', '成套收集', '资源管理'],
        href: '/splendor/',
        rule: '<div class="rule-section"><h4>⚙️ 胜利条件</h4><p>通过购买发展卡、吸引贵族来获得声望分；当有玩家在自己回合结束时达到 <strong>15 分或以上</strong>，游戏进入结束流程。最终由<strong>声望分最高</strong>的玩家获胜。</p></div><div class="rule-section"><h4>🔄 回合流程</h4><p>每回合从以下行动中选 <strong>1 个</strong>执行：</p><ul><li><strong>拿筹码</strong>：拿 3 个不同颜色，或 2 个同色（该色需≥4个）</li><li><strong>保留牌</strong>：保留 1 张公开牌或盲抽 1 张，拿 1 个金筹码</li><li><strong>购买牌</strong>：支付筹码买公开牌或保留牌，获得永久折扣和声望</li></ul></div><div class="rule-section"><h4>⚠️ 常见易错</h4><ul><li>筹码上限 10 个</li><li>保留牌上限 3 张</li><li>拿 2 同色需该色至少 4 个</li><li>贵族在回合结束时自动检查</li></ul></div>',
        guide: '<div class="rule-section"><h4>💡 核心策略</h4><p>尽早建立宝石折扣引擎。1级卡和2级卡提供折扣，3级卡提供大量声望。</p><p>争夺贵族时注意对手的颜色积累。控制节奏，在对手即将到达15分时抢先一步。</p></div>'
    },
    {
        id: 'avalon', name: '阿瓦隆', enName: 'Avalon', icon: '🛡️', color: 'blue',
        minP: 5, maxP: 12, recP: '7-8', duration: '30分钟', age: '13+', difficulty: '2.06/5', rating: '7.4',
        desc: '好人阵营让任务成功，邪恶阵营潜伏破坏。梅林知道坏人是谁但必须隐藏身份。',
        tags: ['推理', '阵营', '身份隐藏', '投票'],
        href: '/avalon/',
        rule: '<div class="rule-section"><h4>⚙️ 胜利条件</h4><p>蓝方让3个任务成功且梅林未被刺杀 → 蓝方胜。红方让3个任务失败，或刺客成功刺杀梅林 → 红方胜。</p></div><div class="rule-section"><h4>🔄 回合流程</h4><p>队长组队 → 全员公投 → 执行任务 → 记录结果。5轮任务中先取3胜者进入结算。</p></div><div class="rule-section"><h4>⚠️ 常见易错</h4><ul><li>蓝方不能投失败票</li><li>蓝方3胜≠立刻赢（还要防刺杀）</li><li>7-10人第4轮需2失败才炸车</li></ul></div>',
        guide: '<div class="rule-section"><h4>💡 核心策略</h4><p><strong>梅林</strong>：要暗中引导团队但不可暴露身份。在投票中巧妙表达意见。</p><p><strong>刺客</strong>：观察谁在引导团队——那很可能是梅林。</p><p><strong>派西维尔</strong>：分辨梅林和莫甘娜是关键。观察两人的行为模式差异。</p></div>'
    },
    // ... (7 more games with the same structure)
];

// ---- Render Game Cards ----
function renderGameCards(filterPlayers) {
    filterPlayers = filterPlayers || 0;
    var container = document.getElementById('gameCards');
    var html = '';
    GAMES.forEach(function (g) {
        if (filterPlayers > 0 && (filterPlayers < g.minP || filterPlayers > g.maxP)) return;
        html +=
            '<div class="game-detail-card" data-min="' + g.minP + '" data-max="' + g.maxP + '">' +
            '<div class="gd-header">' +
            '<div class="gd-icon bg-' + g.color + ' text-' + g.color + '">' + g.icon + '</div>' +
            '<div class="flex-1">' +
            '<div style="font-weight:700;font-size:1.1rem">' + escHtml(g.name) +
            ' <span style="font-size:0.7rem;color:var(--color-text-secondary);font-weight:500">' + escHtml(g.enName) + '</span></div>' +
            '<div style="display:flex;align-items:center;gap:4px;margin-top:2px">' +
            '<span style="color:var(--color-yellow);font-size:0.85rem">' + starsHtml(g.rating) + '</span>' +
            '<span style="font-weight:700;font-size:0.85rem">' + g.rating + '</span>' +
            '</div></div>' +
            '<button class="btn btn-sm btn-secondary" onclick="openRules(\'' + g.id + '\', event)" style="flex-shrink:0">规则</button>' +
            '</div>' +
            '<div class="gd-stats">' +
            '<div class="gd-stat">👥 推荐 ' + g.recP + '人</div>' +
            '<div class="gd-stat">⏱ ' + g.duration + '</div>' +
            '<div class="gd-stat">🎂 年龄 ' + g.age + '</div>' +
            '<div class="gd-stat">📊 难度 ' + g.difficulty + '</div>' +
            '</div>' +
            '<p class="gd-desc">' + escHtml(g.desc) + '</p>' +
            '<div class="gd-tags">' +
            g.tags.map(function (t) { return '<span class="tag tag-mech">' + escHtml(t) + '</span>'; }).join('') +
            '</div>' +
            '<a href="' + g.href + '" class="btn btn-primary btn-block mt-md">进入游戏</a>' +
            '</div>';
    });
    if (html === '') {
        html = '<div class="empty-state"><span class="empty-state-icon">🔍</span><p>没有匹配该人数的游戏</p></div>';
    }
    container.innerHTML = html;
}

function starsHtml(rating) {
    var r = parseFloat(rating) || 0;
    var full = Math.floor(r);
    var half = (r - full) >= 0.3;
    var s = '';
    for (var i = 0; i < full; i++) s += '★';
    if (half) s += '½';
    return s;
}

// ---- Rules Sheet ----
var currentGameId = null;
var currentTab = 'rule';

window.openRules = function (id, event) {
    if (event) event.stopPropagation();
    currentGameId = id;
    var game = GAMES.find(function (g) { return g.id === id; });
    if (!game) return;
    document.getElementById('rulesTitle').textContent = '📖 ' + game.name;
    currentTab = 'rule';
    updateRulesContent();
    document.getElementById('rulesOverlay').classList.add('show');
    // Update tab buttons
    document.querySelector('.js-tab-rule').classList.add('active');
    document.querySelector('.js-tab-guide').classList.remove('active');
};

window.closeRules = function () {
    document.getElementById('rulesOverlay').classList.remove('show');
};

window.switchRulesTab = function (tab) {
    currentTab = tab;
    document.querySelector('.js-tab-rule').classList.toggle('active', tab === 'rule');
    document.querySelector('.js-tab-guide').classList.toggle('active', tab === 'guide');
    updateRulesContent();
};

function updateRulesContent() {
    var game = GAMES.find(function (g) { return g.id === currentGameId; });
    var content = currentTab === 'rule' ? (game.rule || '暂无规则') : (game.guide || '暂无攻略');
    document.getElementById('rulesBody').innerHTML = content;
}

// ---- Filter ----
document.getElementById('filterScroll').addEventListener('click', function (e) {
    if (!e.target.classList.contains('filter-chip')) return;
    var chips = this.querySelectorAll('.filter-chip');
    chips.forEach(function (c) { c.classList.remove('active'); });
    e.target.classList.add('active');
    var players = parseInt(e.target.getAttribute('data-players')) || 0;
    renderGameCards(players);
});

// ---- Init ----
renderGameCards(0);
</script>
{% endblock %}
```

Note: The full plan document contains 9 game entries but this task shows the pattern with 2 examples. The remaining 7 games (拉斯维加斯, 情书, 炸弹猫, 卡波, 7连翻, 现代艺术, 纸牌帮) follow the same data structure.

- [ ] **Step 2: Verify all 9 game data objects exist**

Count GAMES array entries: must be 9.

- [ ] **Step 3: Commit**

```bash
git add templates/gamelist.html
git commit -m "refactor: redesign game list with filter chips and rules sheet"
```

---

### Task 7-9: Simple Game Pages (splendor, explodingkittens, thegang)

These three games share an identical pattern (add players → select winner → submit → leaderboard). They all use `<player-list>` and `<leaderboard-section>` custom elements.

For each game (splendor, explodingkittens, thegang):

- [ ] **Step 1: Write the game HTML**

Example for `splendor/index.html`:

```html
{% extends "base.html" %}

{% block title %}璀璨宝石 · 桌游助手{% endblock %}

{% block body_class %}no-tab-bar{% endblock %}

{% block nav_left %}
<a href="/" class="top-nav-back">← 返回</a>
{% endblock %}

{% block nav_title %}💎 璀璨宝石{% endblock %}

{% block show_tab_bar %}{% endblock %}

{% block extra_head %}
<script src="/static/components.js"></script>
{% endblock %}

{% block content %}
<div class="container">
    <div class="hero">
        <span class="hero-emoji">💎</span>
        <h1>璀璨宝石</h1>
        <p>宝石收集 · 引擎构筑</p>
    </div>

    <player-list api-base="/splendor/api" mode="winner-select" id="playerListEl"></player-list>

    <button class="btn btn-primary btn-block mb-lg" id="submitBtn">
        <i class="ph-bold ph-trophy"></i> 提交记录
    </button>

    <leaderboard-section api-url="/splendor/api/leaderboard" empty-icon="💎" id="lbSection"></leaderboard-section>
</div>
{% endblock %}

{% block extra_body %}
<script>
var playerList = document.getElementById('playerListEl');
var lbSection = document.getElementById('lbSection');

document.getElementById('submitBtn').addEventListener('click', async function () {
    var winner = playerList.getSelectedWinner();
    if (!winner) { showToast('请先选择胜者', 'error'); return; }
    try {
        var res = await api('/splendor/api/record', { method: 'POST', body: { winner: winner } });
        showToast('已记录！胜者: ' + winner, 'success');
        playerList.refresh();
        lbSection.refresh();
    } catch (e) {
        showToast(e.message || '提交失败', 'error');
    }
});
</script>
{% endblock %}
```

For `explodingkittens/index.html`: Same pattern, change title/icon/API paths to `/explodingkittens/api`.
For `thegang/index.html`: Same pattern but mode="coop" and uses the coop record event:

```html
<player-list api-base="/thegang/api" mode="coop" id="playerListEl"></player-list>
```

With coop record handler:

```javascript
playerList.addEventListener('record', async function (e) {
    try {
        var res = await api('/thegang/api/record', { method: 'POST', body: { is_win: e.detail.isWin } });
        showToast(e.detail.isWin ? '已记录：全员胜利！🎉' : '已记录：全员失败 💀', e.detail.isWin ? 'success' : 'error');
        playerList.refresh();
        lbSection.refresh();
    } catch (err) {
        showToast(err.message || '提交失败', 'error');
    }
});
```

- [ ] **Step 2: Repeat for each of the 3 simple games**

- [ ] **Step 3: Commit each game separately**

```bash
git add splendor/index.html && git commit -m "refactor: rewrite Splendor page with shared components"
git add explodingkittens/index.html && git commit -m "refactor: rewrite Exploding Kittens page with shared components"
git add thegang/index.html && git commit -m "refactor: rewrite The Gang page with shared components"
```

---

### Task 10: Rewrite flip7/index.html

**Files:**
- Rewrite: `flip7/index.html`

Flip7 has custom scoring (card selection per player per round). Convert from Vue.js to vanilla JS while keeping the scoring UI.

- [ ] **Step 1: Write flip7/index.html**

The page structure:
```
{% extends "base.html" %}
...
Top nav: ← 返回 | 📚 7连翻 | 重置
Content:
  Hero (emoji + title)
  Add player form
  Players list with scores
  "记分" FAB button → scoring sheet
    - Per-player card selector (0-12 + action/special cards)
    - Bust toggle
    - Submit round
  Game over overlay
  Leaderboard section
```

Key vanilla JS data model:
```javascript
var state = {
    players: [],
    roundCount: 0,
    gameStatus: 'active',
    showInput: false,
    selectedCards: {}, // { playerName: { cards: [], bust: false } }
    leaderboard: [],
    showGameOver: false,
    gameOverWinner: ''
};
```

Key API calls:
- `GET /flip7/api/status` → state sync
- `POST /flip7/api/add_player` → add player
- `POST /flip7/api/submit_round` → submit round scores
- `POST /flip7/api/reset` → reset game
- `GET /flip7/api/leaderboard` → history

- [ ] **Step 2: Commit**

```bash
git add flip7/index.html
git commit -m "refactor: rewrite Flip7 page from Vue to vanilla JS"
```

---

### Task 11: Rewrite ModernArt/index.html

**Files:**
- Rewrite: `ModernArt/index.html`

ModernArt has an auction system with rounds (4 rounds). Keep existing vanilla JS but refresh the UI to use new design system classes.

- [ ] **Step 1: Write ModernArt/index.html**

Key UI refresh: Replace inline styles with common.css classes. Keep the existing auction logic and API structure.

- [ ] **Step 2: Commit**

```bash
git add ModernArt/index.html
git commit -m "refactor: refresh Modern Art page UI with new design system"
```

---

### Task 12: Rewrite cabo/index.html

**Files:**
- Rewrite: `cabo/index.html`

Cabo has score tracking with Cabo caller, Kamikaze detection. Convert from Vue.js to vanilla JS.

- [ ] **Step 1: Write cabo/index.html**

Key vanilla JS data model:
```javascript
var state = {
    players: [],
    roundCount: 0,
    gameStatus: 'active',
    showInput: false,
    scores: {},       // { playerName: number }
    caboCaller: null,
    kamikazePlayer: null,
    leaderboard: [],
    showGameOver: false,
    gameOverWinner: ''
};
```

- [ ] **Step 2: Commit**

```bash
git add cabo/index.html
git commit -m "refactor: rewrite Cabo page from Vue to vanilla JS"
```

---

### Task 13: Rewrite lasvegas/index.html

**Files:**
- Rewrite: `lasvegas/index.html`

Las Vegas uses Alpine.js + Socket.IO. Convert to vanilla JS with the same bill management system and tile game logic.

- [ ] **Step 1: Write lasvegas/index.html**

Key components:
- Bill pool management (30/40/50/60/70/80/90/100)
- Player cards with expandable bill lists
- Tile system (setup field, field info)
- End game overlay
- Socket.IO for real-time sync
- Leaderboard section

Use the `api()` wrapper from common.js instead of raw fetch. Use Socket.IO directly.

- [ ] **Step 2: Commit**

```bash
git add lasvegas/index.html
git commit -m "refactor: rewrite Las Vegas page from Alpine.js to vanilla JS"
```

---

### Task 14: Rewrite LoveLetters/index.html

**Files:**
- Rewrite: `LoveLetters/index.html`

Love Letters has card game mechanics with Socket.IO real-time sync. Convert from Vue.js to vanilla JS.

Key features to preserve:
- Game dashboard (mode, score progress ring)
- Player list with join/start
- Card play UI
- Hand display
- Game state polling via Socket.IO
- Leaderboard

- [ ] **Step 1: Write LoveLetters/index.html**

Use vanilla JS with direct DOM manipulation. Main data model:
```javascript
var state = {
    status: 'lobby',    // lobby | playing | ended
    myName: '',
    players: [],
    hand: [],
    playedCards: [],
    gameState: {},      // from server
    leaderboard: []
};
```

- [ ] **Step 2: Commit**

```bash
git add LoveLetters/index.html
git commit -m "refactor: rewrite Love Letters page from Vue to vanilla JS"
```

---

### Task 15: Rewrite Avalon/index.html

**Files:**
- Rewrite: `Avalon/index.html`

Avalon is the most complex game — 2200+ lines of Vue.js with identity cards, vision panels, mission tracking, team voting, assassination, Lady of the Lake, Excalibur, Lancelot, and ECharts visualization.

**Architecture**: Use a vanilla JS state machine pattern. ECharts is loaded via CDN (only this page loads it).

- [ ] **Step 1: Write the vanilla JS state manager**

Key data model (centralized state object with manual DOM updates):

```javascript
var state = {
    step: 1,            // 1=join, 2=lobby, 3=playing
    status: 'empty',    // empty | joining | active | assassin | ended
    myName: '',
    myRole: '',
    playerCount: 5,
    lancelotEnabled: false,
    ladyOfLakeEnabled: true,
    excaliburEnabled: false,
    // ... all existing data properties from the Vue app
};
```

The polling loop fetches `/avalon/status/{name}` every second and calls `updateUI()` to patch the DOM.

- [ ] **Step 2: Write the UI sections**

Break into logical sections that show/hide based on `state.step` and `state.status`:
- Step 1: Join/Create (player count stepper, toggles, name input, leaderboard)
- Step 2: Lobby (waiting for players, player chips)
- Step 3: Game (identity card, vision panel, mission dots, propose team, vote overlay, mission overlay, lady of lake, excalibur, assassination)
- Ended: Victory screen with ECharts dashboard

- [ ] **Step 3: Write Avalon/index.html**

```html
{% extends "base.html" %}
{% block body_class %}no-tab-bar{% endblock %}
{% block nav_left %}<a href="/" class="top-nav-back">← 返回</a>{% endblock %}
{% block nav_title %}🛡️ 阿瓦隆{% endblock %}
{% block nav_right %}<button class="btn btn-sm btn-secondary" onclick="resetGame()">重置</button>{% endblock %}
{% block show_tab_bar %}{% endblock %}

{% block extra_head %}
<script src="https://unpkg.com/echarts@5.5.0/dist/echarts.min.js"></script>
<style>
/* Game-specific styles: role cards, overlays, mission dots, vision panels */
</style>
{% endblock %}

{% block content %}
<div id="app">
    <!-- Join/Create Screen -->
    <section id="screen-join" class="container">...</section>
    <!-- Lobby Screen -->
    <section id="screen-lobby" class="container hidden">...</section>
    <!-- Game Screen -->
    <section id="screen-game" class="container hidden">...</section>
    <!-- Ended Screen -->
    <section id="screen-ended" class="container hidden">...</section>
</div>
{% endblock %}

{% block extra_body %}
<script>
// State machine + polling + DOM update functions
// (full implementation ~800 lines)
</script>
{% endblock %}
```

- [ ] **Step 4: Verify all features work**

Test checklist:
- Create game with different player counts (5-12)
- Join game, see identity cards
- Team proposal and voting
- Mission execution
- Lady of the Lake inspection
- Lancelot swaps (10/12 player games)
- Excalibur (8+ player games)
- Assassination phase
- Game end + ECharts rendering
- Leaderboard display

- [ ] **Step 5: Commit**

```bash
git add Avalon/index.html
git commit -m "refactor: rewrite Avalon from Vue.js to vanilla JS"
```

---

### Task 16: Create PWA Service Worker

**Files:**
- Create: `static/sw.js`

Simple offline-first cache strategy for static assets.

- [ ] **Step 1: Write sw.js**

```javascript
var CACHE_NAME = 'bgp-v1';
var STATIC_ASSETS = [
    '/static/common.css',
    '/static/common.js',
    '/static/components.js',
    '/',
    '/gamelist'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(STATIC_ASSETS).catch(function () {});
        })
    );
});

self.addEventListener('fetch', function (event) {
    // Only handle GET requests for same-origin
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then(function (cached) {
            // Return cached response, then update cache in background
            var fetchPromise = fetch(event.request).then(function (response) {
                if (response.ok) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(function () {
                return cached;
            });
            return cached || fetchPromise;
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return k !== CACHE_NAME; })
                    .map(function (k) { return caches.delete(k); })
            );
        })
    );
});
```

- [ ] **Step 2: Commit**

```bash
git add static/sw.js
git commit -m "feat: add PWA service worker for offline caching"
```

---

## Final Verification

After all tasks complete, run the app and verify:

- [ ] **Start the server**: `python main.py` and open `http://localhost:8000`
- [ ] **Homepage**: Tab bar visible, game cards render, random starter works
- [ ] **Game list**: Filter chips filter games, rules sheet opens
- [ ] **Each game page**: No tab bar, back button works, game functionality intact
- [ ] **Dark mode**: Toggle OS dark mode, all pages render correctly
- [ ] **Leaderboard**: Data loads and renders on all game pages
- [ ] **Toast/Confirm**: Test error toast and confirm dialog on any page
- [ ] **Avalon**: Full game flow works (create → join → play → end)
- [ ] **Love Letters**: Socket.IO sync works
- [ ] **Las Vegas**: Socket.IO sync and tile system works
- [ ] **Console errors**: No JS errors in browser console
- [ ] **PWA**: Service worker registers without errors
