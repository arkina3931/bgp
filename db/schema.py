import sqlite3

from db.connection import get_db


async def init_schema() -> None:
    async with get_db() as db:
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS game_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_name TEXT NOT NULL,
                player_name TEXT NOT NULL,
                is_winner BOOLEAN NOT NULL,
                score INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS cabo_game_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id TEXT NOT NULL,
                player_name TEXT NOT NULL,
                final_score INTEGER NOT NULL,
                is_winner BOOLEAN NOT NULL,
                round_count INTEGER NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS lasvegas_leaderboard (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player_name TEXT NOT NULL,
                game_amount INTEGER NOT NULL,
                bill_count INTEGER NOT NULL,
                is_winner BOOLEAN NOT NULL DEFAULT 0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS flip7_game_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id TEXT NOT NULL,
                player_name TEXT NOT NULL,
                final_score INTEGER NOT NULL,
                is_winner BOOLEAN NOT NULL,
                bust_count INTEGER NOT NULL DEFAULT 0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS modernart_game_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id TEXT NOT NULL,
                player_name TEXT NOT NULL,
                final_money INTEGER NOT NULL,
                is_winner BOOLEAN NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        try:
            await db.execute(
                "ALTER TABLE flip7_game_results ADD COLUMN bust_count INTEGER NOT NULL DEFAULT 0"
            )
        except sqlite3.OperationalError:
            pass

        try:
            await db.execute(
                "ALTER TABLE lasvegas_leaderboard ADD COLUMN is_winner BOOLEAN NOT NULL DEFAULT 0"
            )
        except sqlite3.OperationalError:
            pass

        await db.execute("CREATE INDEX IF NOT EXISTS idx_game_results_player ON game_results(player_name)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_game_results_ts ON game_results(timestamp DESC)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_game_results_game_player ON game_results(game_name, player_name)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_cabo_player ON cabo_game_results(player_name)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_cabo_ts ON cabo_game_results(timestamp DESC)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_lasvegas_player ON lasvegas_leaderboard(player_name)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_lasvegas_ts ON lasvegas_leaderboard(timestamp DESC)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_flip7_player ON flip7_game_results(player_name)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_flip7_ts ON flip7_game_results(timestamp DESC)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_modernart_player ON modernart_game_results(player_name)")
        await db.execute("CREATE INDEX IF NOT EXISTS idx_modernart_ts ON modernart_game_results(timestamp DESC)")

        await db.commit()
