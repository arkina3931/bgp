import math
from typing import Dict, List, Optional, Set

import aiosqlite

from db.connection import get_db
from state_store import get_store

CACHE_TTL = 3600

class BoardGame:
    """
    桌游元数据模型，用于 V3.1 双轨制对数优势模型。
    """

    def __init__(
        self,
        name: str,
        rating: float,
        complexity: float,
        min_players: int,
        max_players: int,
        default_duration: int,
        recommended_players: Optional[Set[int]] = None,
        game_type: str = "ffa",  # "ffa" | "faction" | "coop"
    ):
        self.name = name
        self.rating = rating
        self.complexity = complexity
        self.min_players = min_players
        self.max_players = max_players
        self.default_duration = default_duration
        self.recommended_players = recommended_players or set()
        self.game_type = game_type

    @property
    def w_static(self) -> float:
        """
        V3.1 静态硬核权重 W_static (Softplus 平滑非负化)。

        W* = [0.2×((R-5)/5) + 0.8×(C/5)²] × log₂(1 + T/15)
        W_static = τ × ln(1 + exp(W*/τ))    (τ=0.1)
        """
        alpha, beta, t0, tau = 0.2, 0.8, 15, 0.1
        r_trans = (self.rating - 5) / 5.0
        c_trans = (self.complexity / 5.0) ** 2
        w_star = (alpha * r_trans + beta * c_trans) * math.log2(
            1 + self.default_duration / t0
        )
        # Softplus 平滑: 防止 overflow，当 w_star/tau 很大时直接返回 w_star
        ratio = w_star / tau
        if ratio > 20:
            return w_star
        return tau * math.log(1 + math.exp(ratio))

    @property
    def weight(self) -> float:
        """向后兼容别名，等价于 w_static。"""
        return self.w_static

    @property
    def base_win_rate(self) -> float:
        """
        静态基准胜率 b_g。
        - Faction (阵营对抗): 0.5
        - Coop (纯合作): 0.5
        - FFA (纯竞争): 推荐人数倒数的期望
        """
        if self.game_type in ("faction", "coop"):
            return 0.5
        if self.recommended_players:
            return sum(1.0 / n for n in self.recommended_players) / len(
                self.recommended_players
            )
        avg_p = (self.min_players + self.max_players) / 2.0
        return 1.0 / avg_p


# ---------------------------------------------------------------------------
# 游戏元数据注册表 —— 统一维护各游戏的 rating / complexity / 人数 / 时长
# key 格式: "表名" 或 "表名:game_name"（用于 game_results 表中区分不同游戏）
# ---------------------------------------------------------------------------

GAME_REGISTRY: Dict[str, BoardGame] = {
    "game_results:Splendor": BoardGame(
        name="璀璨宝石",
        rating=7.4,
        complexity=2.31,
        min_players=2,
        max_players=4,
        default_duration=30,
        recommended_players={3},
        game_type="ffa",
    ),
    "game_results:Avalon": BoardGame(
        name="阿瓦隆",
        rating=7.4,
        complexity=2.12,
        min_players=5,
        max_players=12,
        default_duration=30,
        recommended_players={7, 8},
        game_type="faction",
    ),
    "lasvegas_leaderboard": BoardGame(
        name="拉斯维加斯",
        rating=7.5,
        complexity=1.42,
        min_players=2,
        max_players=6,
        default_duration=52.5,
        recommended_players={4, 5},
        game_type="ffa",
    ),
    "game_results:LoveLetters": BoardGame(
        name="情书",
        rating=7.4,
        complexity=1.30,
        min_players=2,
        max_players=8,
        default_duration=25,
        recommended_players={4, 5, 6},
        game_type="ffa",
    ),
    "game_results:ExplodingKittens": BoardGame(
        name="炸弹猫",
        rating=6.1,
        complexity=1.08,
        min_players=2,
        max_players=5,
        default_duration=15,
        recommended_players={4, 5},
        game_type="ffa",
    ),
    "cabo_game_results": BoardGame(
        name="卡波",
        rating=7.3,
        complexity=1.23,
        min_players=2,
        max_players=4,
        default_duration=45,
        recommended_players={3, 4},
        game_type="ffa",
    ),
    "flip7_game_results": BoardGame(
        name="7连翻",
        rating=7.2,
        complexity=1.03,
        min_players=3,
        max_players=18,
        default_duration=20,
        recommended_players={5, 6},
        game_type="ffa",
    ),
    "modernart_game_results": BoardGame(
        name="现代艺术",
        rating=7.5,
        complexity=2.28,
        min_players=3,
        max_players=5,
        default_duration=45,
        recommended_players={4, 5},
        game_type="ffa",
    ),
    "game_results:TheGang": BoardGame(
        name="纸牌帮",
        rating=7.6,
        complexity=1.60,
        min_players=3,
        max_players=6,
        default_duration=20,
        recommended_players={5},
        game_type="coop",
    ),
}



# ---------------------------------------------------------------------------
# V3.1 辅助数学函数 (logit / sigmoid / clamp)
# ---------------------------------------------------------------------------
EPS = 1e-6

def _clamp(x: float) -> float:
    return max(EPS, min(1 - EPS, x))

def _logit(x: float) -> float:
    x = _clamp(x)
    return math.log(x / (1 - x))

def _sigmoid(x: float) -> float:
    if x > 20:
        return 1.0
    if x < -20:
        return 0.0
    return 1.0 / (1.0 + math.exp(-x))

clamp = _clamp
logit = _logit
sigmoid = _sigmoid

async def fetch_scored_leaderboard(
    table_name: str,
    score_column: str,
    score_key: str,
    order_clause: str,
    registry_key: str = "",
    extra_agg_select: str = "",
    extra_row_parser=None,
) -> List[Dict]:
    """
    Shared leaderboard query for games with (game_id, player_name, is_winner, score-like field).
    V3.1 P_ladder: logit-space interpolation with reliability lock.
    """
    # ── Cache-Aside ──
    cache_key = f"cache:leaderboard:{table_name}"
    store = get_store()
    cached = await store.get_json(cache_key)
    if cached is not None:
        return cached

    LAMBDA = 2.0
    K = 3  # 出勤常数
    K_PROVISIONAL = 3  # 定级阈值
    bg_obj = GAME_REGISTRY.get(registry_key)
    b_g = bg_obj.base_win_rate if bg_obj else 0.25

    async with get_db() as db:
        db.row_factory = aiosqlite.Row
        extra_sql = f", {extra_agg_select}" if extra_agg_select else ""
        query = f"""
            SELECT player_name,
                   COUNT(DISTINCT game_id) as total_games,
                   SUM(CASE WHEN is_winner THEN 1 ELSE 0 END) as wins,
                   ROUND(AVG({score_column}), 1) as avg_value
                   {extra_sql}
            FROM {table_name}
            GROUP BY player_name
            ORDER BY {order_clause}
        """
        cursor = await db.execute(query)
        rows = await cursor.fetchall()

        ranked = []   # n_g >= K_PROVISIONAL  (正式天梯)
        provisional = []  # n_g < K_PROVISIONAL (定级试玩区)

        for row in rows:
            n_g = row["total_games"]
            w_g = row["wins"]
            # 1. Bayesian smoothed win rate (表现胜率)
            hat_p_g = (w_g + LAMBDA * b_g) / (n_g + LAMBDA) if n_g > 0 else b_g
            smoothed_pct = round(hat_p_g * 100, 1)
            # 2. Reliability lock (出勤锁)
            w_N = n_g / (n_g + K) if n_g > 0 else 0.0
            # 3. P_ladder via logit interpolation
            logit_blend = (1 - w_N) * _logit(b_g) + w_N * _logit(hat_p_g)
            p_ladder = _sigmoid(logit_blend)
            ladder_pct = round(p_ladder * 100, 1)
            # 4. Three-tier mastery
            if n_g < K_PROVISIONAL:
                mastery = "provisional"
            elif n_g < K:
                mastery = "rookie"
            else:
                mastery = "expert"

            item = {
                "name": row["player_name"],
                "total_games": n_g,
                "wins": w_g,
                "win_rate": ladder_pct,         # P_ladder (排名主键)
                "smoothed_rate": smoothed_pct,  # hat_p_g  (表现胜率)
                "mastery": mastery,
                score_key: row["avg_value"],
            }
            if extra_row_parser:
                item.update(extra_row_parser(row))

            if mastery == "provisional":
                provisional.append(item)
            else:
                ranked.append(item)

        # Sort ranked by P_ladder desc, then provisional by P_ladder desc
        ranked.sort(key=lambda x: -x["win_rate"])
        provisional.sort(key=lambda x: -x["win_rate"])
        stats = ranked + provisional

        await store.set_json(cache_key, stats, expire=CACHE_TTL)
        return stats

__all__ = [
    "BoardGame",
    "GAME_REGISTRY",
    "fetch_scored_leaderboard",
    "clamp",
    "logit",
    "sigmoid",
]