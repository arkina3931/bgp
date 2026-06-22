from db.leaderboard import BoardGame, GAME_REGISTRY
from db.repositories import (
    get_cabo_leaderboard,
    get_flip7_leaderboard,
    get_global_leaderboard,
    get_lasvegas_leaderboard,
    get_leaderboard,
    get_modernart_leaderboard,
    get_simple_leaderboard,
    record_cabo_game,
    record_flip7_game,
    record_lasvegas_game,
    record_modernart_game,
    record_result,
)
from db.schema import init_schema


async def init_db():
    await init_schema()


__all__ = [
    "BoardGame",
    "GAME_REGISTRY",
    "init_db",
    "record_result",
    "record_cabo_game",
    "get_cabo_leaderboard",
    "get_leaderboard",
    "get_global_leaderboard",
    "record_lasvegas_game",
    "get_lasvegas_leaderboard",
    "record_flip7_game",
    "get_flip7_leaderboard",
    "record_modernart_game",
    "get_modernart_leaderboard",
    "get_simple_leaderboard",
]
