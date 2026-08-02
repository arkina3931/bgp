// ============================================
// Board Game Portal — Shared Utilities
// ============================================

// --- 1. HTML Escape (textContent-based, no regex) ---
window.escHtml = function(str) {
    if (!str && str !== 0) return '';
    var div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
};

// --- 2. Fetch Wrapper ---
window.api = async function(url, opts) {
    opts = opts || {};
    var method = opts.method || 'GET';
    var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});

    var init = { method: method, headers: headers };
    if (opts.body) {
        init.body = JSON.stringify(opts.body);
    }

    var res = await fetch(url, init);
    if (!res.ok) {
        var detail = 'HTTP ' + res.status;
        try {
            var errData = await res.json();
            if (errData.detail) detail = errData.detail;
        } catch (e) { /* use default status text */ }
        throw new Error(detail);
    }
    return res.json();
};

// --- 3. Toast Notification (iOS notification banner style) ---
window.showToast = function(message, type) {
    type = type || 'info';

    // Remove any existing toast
    var existing = document.querySelector('.apple-toast') || document.querySelector('.toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'apple-toast';
    if (type === 'success') toast.classList.add('apple-toast-success');
    if (type === 'error') toast.classList.add('apple-toast-error');
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger reflow so the transition fires
    void toast.offsetHeight;
    toast.classList.add('show');

    setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
    }, 2800);
};

// --- 4. Confirm Dialog (iOS UIAlertController style, returns Promise<boolean>) ---
window.showConfirm = function(message, confirmText, cancelText) {
    confirmText = confirmText || '确认';
    cancelText = cancelText || '取消';

    return new Promise(function(resolve) {
        // Overlay
        var overlay = document.createElement('div');
        overlay.style.cssText =
            'position:fixed;inset:0;background:rgba(0,0,0,0.4);' +
            'backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);' +
            'z-index:10000;display:flex;align-items:center;justify-content:center;' +
            'opacity:0;transition:opacity 0.25s cubic-bezier(0.25,1,0.5,1);';

        // Modal
        var modal = document.createElement('div');
        modal.style.cssText =
            'background:var(--color-surface,#fff);border-radius:14px;' +
            'box-shadow:0 8px 30px rgba(0,0,0,0.15);width:270px;' +
            'text-align:center;overflow:hidden;' +
            'transform:scale(1.08);opacity:0;transition:transform 0.25s cubic-bezier(0.25,1,0.5,1), opacity 0.25s cubic-bezier(0.25,1,0.5,1);';

        // Message
        var msg = document.createElement('div');
        msg.style.cssText =
            'padding:20px 16px 20px;font-size:1.05rem;font-weight:600;' +
            'color:var(--color-text,#1d1d1f);line-height:1.4;letter-spacing:-0.01em;';
        msg.textContent = message;

        // Button row
        var btnRow = document.createElement('div');
        btnRow.style.cssText =
            'display:flex;border-top:0.5px solid var(--color-border);';

        var btnCancel = document.createElement('button');
        btnCancel.textContent = cancelText;
        btnCancel.style.cssText =
            'flex:1;padding:12px 0;background:transparent;border:none;' +
            'border-right:0.5px solid var(--color-border);' +
            'font-size:1.05rem;color:var(--color-blue,#0071e3);' +
            'font-family:inherit;font-weight:400;cursor:pointer;' +
            '-webkit-tap-highlight-color:transparent;outline:none;';

        var btnConfirm = document.createElement('button');
        btnConfirm.textContent = confirmText;
        btnConfirm.style.cssText =
            'flex:1;padding:12px 0;background:transparent;border:none;' +
            'font-size:1.05rem;color:var(--color-blue,#0071e3);' +
            'font-family:inherit;font-weight:600;cursor:pointer;' +
            '-webkit-tap-highlight-color:transparent;outline:none;';

        function cleanup(result) {
            overlay.style.opacity = '0';
            modal.style.transform = 'scale(0.92)';
            modal.style.opacity = '0';
            setTimeout(function() { overlay.remove(); }, 250);
            resolve(result);
        }

        btnCancel.addEventListener('click', function() { cleanup(false); });
        btnConfirm.addEventListener('click', function() { cleanup(true); });

        btnRow.appendChild(btnCancel);
        btnRow.appendChild(btnConfirm);
        modal.appendChild(msg);
        modal.appendChild(btnRow);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        requestAnimationFrame(function() {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';
            modal.style.opacity = '1';
        });
    });
};

// --- 5. Leaderboard Renderer ---
window.renderLeaderboard = function(container, data, opts) {
    opts = opts || {};
    var emptyIcon   = opts.emptyIcon   || '👻';
    var emptyText   = opts.emptyText   || '还没人玩过呢';
    var showAvgScore = opts.showAvgScore || false;
    var avgScoreLabel = opts.avgScoreLabel || '均分';
    var showWinLoss  = opts.showWinLoss  || false;
    var showTotal    = opts.showTotal !== false;

    container.innerHTML = '';

    // Empty state
    if (!data || data.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'empty-state';
        var icon = document.createElement('span');
        icon.className = 'empty-state-icon';
        icon.textContent = emptyIcon;
        var text = document.createElement('p');
        text.textContent = emptyText;
        empty.appendChild(icon);
        empty.appendChild(text);
        container.appendChild(empty);
        return;
    }

    var list = document.createElement('div');
    list.className = 'list';

    // Total games subtitle
    if (showTotal) {
        var totalGames = 0;
        for (var i = 0; i < data.length; i++) {
            totalGames += (data[i].total_games || data[i].total || 0);
        }
        var header = document.createElement('div');
        header.className = 'list-header';
        header.textContent = '累计 ' + totalGames + ' 局';
        list.appendChild(header);
    }

    // Mastery badge definitions
    var masteryDefs = {
        expert:      { label: '👑专精',  color: 'var(--color-orange,#ff9500)',         bg: 'var(--color-orange-bg,rgba(255,149,0,0.08))' },
        rookie:      { label: '🔰新手',  color: 'var(--color-blue,#0071e3)',           bg: 'var(--color-blue-bg,rgba(0,113,227,0.08))' },
        provisional: { label: '⏳定级中', color: 'var(--color-text-secondary,#86868b)', bg: 'rgba(0,0,0,0.04)' }
    };

    for (var i = 0; i < data.length; i++) {
        var p = data[i];
        var rank = i + 1;

        var item = document.createElement('div');
        item.className = 'list-item';

        // Provisional players get reduced opacity
        if (p.mastery === 'provisional') {
            item.style.opacity = '0.65';
        }

        // Rank badge
        var badge = document.createElement('div');
        badge.className = 'rank-badge';
        if (rank === 1) {
            badge.classList.add('rank-1');
            badge.textContent = '👑';
        } else if (rank === 2) {
            badge.classList.add('rank-2');
            badge.textContent = '2';
        } else if (rank === 3) {
            badge.classList.add('rank-3');
            badge.textContent = '3';
        } else {
            badge.classList.add('rank-other');
            badge.textContent = rank;
        }

        // Content area
        var content = document.createElement('div');
        content.className = 'list-item-content';

        // Name + mastery badge
        var nameEl = document.createElement('div');
        nameEl.className = 'list-item-title';
        nameEl.textContent = p.name;

        var m = masteryDefs[p.mastery] || masteryDefs.provisional;
        var masteryBadge = document.createElement('span');
        masteryBadge.style.cssText =
            'display:inline-block;margin-left:8px;padding:2px 8px;' +
            'border-radius:6px;font-size:0.7rem;font-weight:600;' +
            'vertical-align:middle;' +
            'color:' + m.color + ';background:' + m.bg + ';';
        masteryBadge.textContent = m.label;
        nameEl.appendChild(masteryBadge);

        // Subtitle: X局 · 胜Y场 · 战力Z% · 胜率W%
        var total = p.total_games || p.total || 0;
        var wins = p.wins || 0;
        var smoothedRate = p.smoothed_rate != null ? Number(p.smoothed_rate).toFixed(1) : '--';
        var winRate = p.win_rate != null ? Number(p.win_rate).toFixed(1) : '--';

        var subtitle = document.createElement('div');
        subtitle.className = 'list-item-subtitle';
        subtitle.textContent =
            total + '局 · 胜' + wins + '场 · 战力' + smoothedRate + '% · 胜率' + winRate + '%';

        content.appendChild(nameEl);
        content.appendChild(subtitle);

        // Right-side trailing: avg score and/or win-loss (both may render)
        var trailing = document.createElement('div');
        trailing.className = 'list-item-trailing';
        if (showAvgScore && p.avg_score != null) {
            var avgLabel = document.createElement('span');
            avgLabel.style.cssText = 'font-size:0.72rem;color:var(--color-text-secondary,#86868b);display:block;';
            avgLabel.textContent = avgScoreLabel;
            trailing.appendChild(avgLabel);
            var avgValue = document.createElement('span');
            avgValue.textContent = Number(p.avg_score).toFixed(1);
            trailing.appendChild(avgValue);
        }
        if (showWinLoss) {
            var loss = total - wins;
            var wlLine = document.createElement('span');
            wlLine.style.cssText = 'font-size:0.72rem;color:var(--color-text-secondary,#86868b);display:block;';
            wlLine.textContent = wins + '/' + loss;
            trailing.appendChild(wlLine);
        }

        item.appendChild(badge);
        item.appendChild(content);
        if (showAvgScore || showWinLoss) {
            item.appendChild(trailing);
        }

        list.appendChild(item);
    }

    container.appendChild(list);
};
