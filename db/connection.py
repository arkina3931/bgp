from contextlib import asynccontextmanager
from typing import AsyncIterator

import aiosqlite

from core.config import DB_NAME


@asynccontextmanager
async def get_db() -> AsyncIterator[aiosqlite.Connection]:
    async with aiosqlite.connect(DB_NAME) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA synchronous=NORMAL")
        await db.execute("PRAGMA cache_size=-8000")
        await db.execute("PRAGMA temp_store=MEMORY")
        yield db