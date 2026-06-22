// ============================================
// Board Game Portal — Custom Elements v1
// Light DOM — inherits global styles from common.css
// Depends on: common.js (escHtml, api, renderLeaderboard, showToast)
// ============================================

// --- <game-card> — Game entry card (grid mode) ---
class GameCard extends HTMLElement {
    constructor() { super(); }

    connectedCallback() {
        var name = this.getAttribute('name') || '';
        var iconEmoji = this.getAttribute('icon-emoji') || '';
        var iconClass = this.getAttribute('icon-class') || '';
        var color = this.getAttribute('color') || 'blue';
        var href = this.getAttribute('href') || '#';
        var disabled = this.hasAttribute('disabled');
        var minPlayers = this.getAttribute('min-players') || '';
        var maxPlayers = this.getAttribute('max-players') || '';
        var recPlayers = this.getAttribute('rec-players') || '';
        var desc = this.getAttribute('desc') || '';

        // Icon
        var iconHtml = '';
        if (iconClass) {
            iconHtml = '<div class="gc-icon bg-' + escHtml(color) + ' text-' + escHtml(color) + '">' +
                '<i class="ph-fill ' + escHtml(iconClass) + '" style="font-size:1.4rem;"></i></div>';
        } else if (iconEmoji) {
            iconHtml = '<div class="gc-icon bg-' + escHtml(color) + ' text-' + escHtml(color) + '">' +
                escHtml(iconEmoji) + '</div>';
        }

        // Name + optional maintenance badge
        var nameHtml = '<div class="gc-name">' + escHtml(name);
        if (disabled) nameHtml += ' <span class="status-badge">维护中</span>';
        nameHtml += '</div>';

        // Description
        var descHtml = desc ? '<div class="gc-desc">' + escHtml(desc) + '</div>' : '';

        // Player count
        var playerText = '';
        if (minPlayers && maxPlayers) {
            playerText = recPlayers
                ? '推荐 ' + escHtml(recPlayers) + '人'
                : escHtml(minPlayers) + '-' + escHtml(maxPlayers) + '人';
        }
        var metaHtml = playerText ? '<div class="gc-meta">' + playerText + '</div>' : '';

        if (disabled) {
            this.innerHTML = '<div class="game-card-item disabled">' +
                iconHtml + nameHtml + descHtml + metaHtml + '</div>';
        } else {
            this.innerHTML = '<a href="' + escHtml(href) + '" class="game-card-item">' +
                iconHtml + nameHtml + descHtml + metaHtml + '</a>';
        }
    }
}

// --- <player-list> — Player management (add/remove, winner/coop) ---
class PlayerList extends HTMLElement {
    constructor() {
        super();
        this._players = [];
        this._selectedWinner = '';
    }

    connectedCallback() {
        this._apiBase = this.getAttribute('api-base') || '';
        this._mode = this.getAttribute('mode') || 'simple';
        this._render();
        this._fetchPlayers();
    }

    _render() {
        var html = '<div class="list" style="margin-bottom:16px;">' +
            '<div class="list-item" style="padding:4px 16px;">' +
            '<input class="js-pl-input" placeholder="输入玩家姓名..." style="flex:1;border:none;padding:8px 0;background:transparent;font-size:1.05rem;color:var(--color-text);outline:none;" ' +
            'onkeydown="if(event.key===\'Enter\')this.closest(\'player-list\').addPlayer()">' +
            '<button class="btn btn-primary btn-sm" style="border-radius:50%;width:30px;height:30px;min-height:30px;padding:0;display:flex;align-items:center;justify-content:center;flex-shrink:0;" onclick="this.closest(\'player-list\').addPlayer()">' +
            '<i class="ph-bold ph-plus"></i>' +
            '</button>' +
            '</div>' +
            '</div>' +
            '<div class="list js-pl-list" style="margin-bottom:16px;"></div>';

        if (this._mode !== 'simple') {
            html += '<div class="js-pl-winner"></div>';
        }

        this.innerHTML = html;
    }

    async _fetchPlayers() {
        try {
            var data = await api(this._apiBase + '/status');
            this._players = data.players || [];
        } catch (e) {
            this._players = [];
        }
        this._updateList();
    }

    _updateList() {
        var listEl = this.querySelector('.js-pl-list');
        if (!listEl) return;

        if (this._players.length === 0) {
            listEl.innerHTML = '<div class="list-item"><div class="list-item-content text-center text-muted" style="font-size:0.9rem;">暂无参与玩家</div></div>';
        } else {
            var self = this;
            listEl.innerHTML = this._players.map(function(name) {
                return '<div class="list-item">' +
                    '<div class="list-item-content">' +
                    '<div class="list-item-title">' + escHtml(name) + '</div>' +
                    '</div>' +
                    '<button class="btn btn-secondary btn-sm" style="padding:4px 12px;font-size:0.8rem;color:var(--color-red);background:rgba(255,59,48,0.1);font-weight:600;" ' +
                    'data-name="' + escHtml(name) + '">移除</button>' +
                    '</div>';
            }).join('');

            listEl.querySelectorAll('button').forEach(function(btn) {
                btn.addEventListener('click', function() {
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

        if (this._players.length === 0) {
            el.innerHTML = '';
            return;
        }

        if (this._mode === 'coop') {
            el.innerHTML = '<div style="display:flex;gap:12px;margin-top:16px;">' +
                '<button class="btn btn-primary" style="flex:1;box-shadow: 0 4px 12px rgba(52, 199, 89, 0.25);" ' +
                'onclick="this.closest(\'player-list\')._notifyRecord(true)">全员胜利 🎉</button>' +
                '<button class="btn btn-danger" style="flex:1;box-shadow: 0 4px 12px rgba(255, 59, 48, 0.25);" ' +
                'onclick="this.closest(\'player-list\')._notifyRecord(false)">全员失败 💀</button>' +
                '</div>';
        } else if (this._mode === 'winner-select') {
            var self = this;
            var html = '<div class="list-header">🏆 选择本局胜者</div>' +
                '<div class="list">';

            html += this._players.map(function(name) {
                var isSelected = self._selectedWinner === name;
                return '<div class="list-item js-winner-cell" style="cursor:pointer;" data-name="' + escHtml(name) + '">' +
                    '<div class="list-item-content">' +
                    '<div class="list-item-title" style="font-weight:' + (isSelected ? '700' : '500') + ';color:' + (isSelected ? 'var(--color-blue)' : 'var(--color-text)') + '">' + escHtml(name) + '</div>' +
                    '</div>' +
                    (isSelected ? '<div style="color:var(--color-blue);display:flex;align-items:center;"><i class="ph-bold ph-check" style="font-size:1.2rem;"></i></div>' : '') +
                    '</div>';
            }).join('');

            html += '</div>';
            el.innerHTML = html;

            el.querySelectorAll('.js-winner-cell').forEach(function(cell) {
                cell.addEventListener('click', function() {
                    var name = cell.getAttribute('data-name');
                    if (self._selectedWinner === name) {
                        self._selectedWinner = '';
                    } else {
                        self._selectedWinner = name;
                    }
                    self._updateWinnerSelect();
                });
            });
        }
    }

    /** Dispatch 'record' event for coop mode (win/lose buttons). */
    _notifyRecord(isWin) {
        this.dispatchEvent(new CustomEvent('record', {
            detail: { isWin: isWin },
            bubbles: true,
            composed: true
        }));
    }

    /** Add a player from the input field. */
    async addPlayer() {
        var input = this.querySelector('.js-pl-input');
        if (!input) return;
        var name = input.value.trim();
        if (!name) return;
        try {
            await api(this._apiBase + '/add_player', { method: 'POST', body: { name: name } });
            input.value = '';
            this._fetchPlayers();
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    /** Remove a player by name. */
    async removePlayer(name) {
        try {
            await api(this._apiBase + '/remove_player', { method: 'POST', body: { name: name } });
            if (this._selectedWinner === name) this._selectedWinner = '';
            this._fetchPlayers();
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    /** Returns the currently selected winner (winner-select mode). */
    getSelectedWinner() {
        return this._selectedWinner;
    }

    /** Public method to re-fetch players from the server. */
    refresh() {
        this._fetchPlayers();
    }
}

// --- <leaderboard-section> — Leaderboard panel ---
class LeaderboardSection extends HTMLElement {
    constructor() { super(); }

    connectedCallback() {
        this._renderAndLoad();
    }

    _renderAndLoad() {
        var apiUrl = this.getAttribute('api-url') || '';
        var emptyIcon = this.getAttribute('empty-icon') || '👻';
        var emptyText = this.getAttribute('empty-text') || '还没人玩过呢，快去开一局！';
        var showAvgScore = this.hasAttribute('show-avg-score');
        var avgScoreLabel = this.getAttribute('avg-score-label') || '均分';
        var showWinLoss = this.hasAttribute('show-win-loss');
        var showTotal = !this.hasAttribute('no-total');

        this.innerHTML =
            '<div class="section-title" style="margin-top:var(--space-xl);margin-bottom:var(--space-md);">🏆 历史排行榜</div>' +
            '<div class="js-lb-container" style="text-align:center;padding:var(--space-lg);color:var(--color-text-secondary);">⏳ 加载中...</div>';

        this._fetchAndRender(apiUrl, emptyIcon, emptyText, showAvgScore, avgScoreLabel, showWinLoss, showTotal);
    }

    async _fetchAndRender(apiUrl, emptyIcon, emptyText, showAvgScore, avgScoreLabel, showWinLoss, showTotal) {
        var container = this.querySelector('.js-lb-container');
        if (!container) return;

        try {
            var data = await api(apiUrl);
            var lb = data.leaderboard || data || [];
            renderLeaderboard(container, lb, {
                emptyIcon: emptyIcon,
                emptyText: emptyText,
                showAvgScore: showAvgScore,
                avgScoreLabel: avgScoreLabel,
                showWinLoss: showWinLoss,
                showTotal: showTotal
            });
        } catch (e) {
            container.innerHTML =
                '<div style="text-align:center;padding:var(--space-xl);color:var(--color-red);">⚠️ 加载排行榜失败</div>';
        }
    }

    /** Public method to re-fetch and re-render the leaderboard. */
    refresh() {
        this._renderAndLoad();
    }
}

// Register all custom elements
customElements.define('game-card', GameCard);
customElements.define('player-list', PlayerList);
customElements.define('leaderboard-section', LeaderboardSection);
