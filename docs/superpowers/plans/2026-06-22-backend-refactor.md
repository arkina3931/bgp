# Backend Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the backend into compatible layered architecture, codify frontend/backend standards, and rewrite README without changing existing frontend API contracts.

**Architecture:** Keep all existing routers and URLs as the compatibility shell. Add focused `core/`, `db/`, `services/`, and `api/` packages, then migrate internals behind compatibility facades. Existing frontend calls and response shapes remain unchanged.

**Tech Stack:** FastAPI, Starlette/Jinja2, python-socketio, aiosqlite, SQLite, vanilla JS frontend assets already in `static/`.

## Global Constraints

- Preserve all existing public API paths, request bodies, response shapes, and Socket.IO event names.
- Keep SQLite and `games.db`; do not introduce an ORM or new database service.
- Keep `database.py` import-compatible until all existing modules can call new packages safely.
- Route handlers stay thin: request parsing, service call, event publish, response return.
- Game engines remain framework-independent and must not import FastAPI, Socket.IO, or database modules.
- Template rendering must use explicit `TemplateResponse(request=request, name="index.html", context={"request": request})` or a shared helper.
- Do not redesign frontend UI or change frontend routes in this phase.
- README must be rewritten in readable Chinese and include backend/frontend standards.

---

## File Map

```text
core/
  __init__.py
  config.py
  templates.py
  events.py
  responses.py

db/
  __init__.py
  connection.py
  schema.py
  leaderboard.py
  repositories.py

services/
  __init__.py
  simple_game.py
  scoring.py
  state.py

api/
  __init__.py
  v2.py

scripts/
  smoke_check.py

Modified compatibility files:
  main.py
  database.py
  sio_server.py
  splendor/app.py
  explodingkittens/app.py
  thegang/app.py
  cabo/app.py
  flip7/app.py
  lasvegas/app.py
  ModernArt/app.py
  LoveLetters/fastapi_app.py
  Avalon/main.py
  README.md
```

---

### Task 1: Add Backend Core Helpers And Smoke Check Harness

**Files:**
- Create: `core/__init__.py`
- Create: `core/config.py`
- Create: `core/templates.py`
- Create: `core/events.py`
- Create: `core/responses.py`
- Create: `scripts/smoke_check.py`
- Modify: `main.py`

**Interfaces:**
- Produces: `core.config.ROOT_DIR`, `core.config.DB_NAME`, `core.config.TEMPLATE_DIR`, `core.config.STATIC_DIR`
- Produces: `core.templates.render_template(templates, request, name, context=None) -> TemplateResponse`
- Produces: `core.events.publish_game_event(channel: str, event: str, payload: dict | None = None, namespace: str = "/") -> None`
- Produces: `scripts/smoke_check.py` CLI for page/API compatibility checks.

- [ ] **Step 1: Create `core/config.py`**

```python
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DB_NAME = str(ROOT_DIR / "games.db")
TEMPLATE_DIR = str(ROOT_DIR / "templates")
STATIC_DIR = str(ROOT_DIR / "static")
AVALON_ASSETS_DIR = str(ROOT_DIR / "Avalon" / "assets")
```

- [ ] **Step 2: Create `core/templates.py`**

```python
from typing import Any

from fastapi import Request
from fastapi.templating import Jinja2Templates
from starlette.templating import _TemplateResponse


def render_template(
    templates: Jinja2Templates,
    request: Request,
    name: str,
    context: dict[str, Any] | None = None,
) -> _TemplateResponse:
    merged = {"request": request}
    if context:
        merged.update(context)
    return templates.TemplateResponse(request=request, name=name, context=merged)
```

- [ ] **Step 3: Create `core/events.py`**

```python
from state_store import get_store


async def publish_game_event(
    channel: str,
    event: str,
    payload: dict | None = None,
    namespace: str = "/",
) -> None:
    event_data = dict(payload or {})
    event_data.setdefault("event", event)
    event_data.setdefault("namespace", namespace)
    await get_store().publish(channel, event_data)
```

- [ ] **Step 4: Create `core/responses.py`**

```python
def ok(**fields):
    return {"status": "ok", **fields}


def error(message: str, **fields):
    return {"status": "error", "msg": message, **fields}
```

- [ ] **Step 5: Add empty package marker**

Create `core/__init__.py` as an empty file.

- [ ] **Step 6: Create `scripts/smoke_check.py`**

```python
import argparse
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

GET_PATHS = [
    "/",
    "/gamelist",
    "/avalon/",
    "/cabo/",
    "/lasvegas/",
    "/loveletters/",
    "/flip7/",
    "/modernart/",
    "/splendor/",
    "/explodingkittens/",
    "/thegang/",
    "/api/leaderboard",
    "/cabo/api/status",
    "/lasvegas/api/status",
    "/flip7/api/status",
    "/modernart/api/state",
    "/splendor/api/status",
    "/explodingkittens/api/status",
    "/thegang/api/status",
]


def request_json_or_text(base_url: str, path: str) -> tuple[int, str]:
    req = Request(base_url.rstrip("/") + path, headers={"Accept": "application/json,text/html"})
    with urlopen(req, timeout=8) as response:
        body = response.read(300).decode("utf-8", errors="replace")
        return response.status, body


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    args = parser.parse_args()
    failures = []
    for path in GET_PATHS:
        try:
            status, body = request_json_or_text(args.base_url, path)
            print(json.dumps({"path": path, "status": status, "sample": body[:80]}, ensure_ascii=False))
            if status != 200:
                failures.append((path, status))
        except (HTTPError, URLError, TimeoutError) as exc:
            print(json.dumps({"path": path, "error": str(exc)}, ensure_ascii=False))
            failures.append((path, "error"))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 7: Update `main.py` to consume `core.config` and `render_template`**

Replace top-level template/static path literals with config constants:

```python
from core.config import AVALON_ASSETS_DIR, STATIC_DIR, TEMPLATE_DIR
from core.templates import render_template
```

Use:

```python
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATE_DIR)
```

For top-level pages use:

```python
return render_template(
    templates,
    request,
    "index.html",
    {
        "leaderboard": leaderboard,
        "loaded_apps": loaded_apps,
        "game_weights": game_weights,
    },
)
```

and:

```python
return render_template(templates, request, "gamelist.html")
```

- [ ] **Step 8: Verify and commit**

Run:

```bash
python -m compileall core scripts main.py
```

Expected: all files compile.

Commit:

```bash
git add core scripts main.py
git commit -m "refactor: add backend core helpers and smoke check"
```

---

### Task 2: Split Database Connection And Schema Initialization

**Files:**
- Create: `db/__init__.py`
- Create: `db/connection.py`
- Create: `db/schema.py`
- Modify: `database.py`

**Interfaces:**
- Produces: `db.connection.get_db() -> AsyncIterator[aiosqlite.Connection]`
- Produces: `db.schema.init_schema() -> None`
- Preserves: `database.init_db()` public async function.

- [ ] **Step 1: Create `db/connection.py`**

```python
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
```

- [ ] **Step 2: Create `db/schema.py`**

Move the table creation statements currently inside `database.init_db()` into:

```python
from db.connection import get_db


async def init_schema() -> None:
    async with get_db() as db:
        await db.execute("""
        CREATE TABLE IF NOT EXISTS game_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_name TEXT NOT NULL,
            player_name TEXT NOT NULL,
            is_winner BOOLEAN NOT NULL,
            score INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        # Include the existing CREATE TABLE statements for:
        # cabo_game_results, lasvegas_leaderboard, flip7_game_results,
        # modernart_game_results, and any existing indexes from database.py.
        await db.commit()
```

The implementation must copy all existing schema statements from `database.py` exactly, including table names and columns.

- [ ] **Step 3: Add package marker**

Create `db/__init__.py` as an empty file.

- [ ] **Step 4: Update `database.py` compatibility functions**

Replace `_get_db()` body with a wrapper:

```python
from db.connection import get_db as _new_get_db
from db.schema import init_schema


def _get_db():
    return _new_get_db()


async def init_db():
    await init_schema()
```

Keep all other exported functions unchanged in this task.

- [ ] **Step 5: Verify and commit**

Run:

```bash
python -m compileall db database.py
```

Expected: compile succeeds.

Commit:

```bash
git add db database.py
git commit -m "refactor: split database connection and schema setup"
```

---

### Task 3: Move Leaderboard Metadata And Scoring Algorithms

**Files:**
- Create: `db/leaderboard.py`
- Modify: `database.py`

**Interfaces:**
- Produces: `db.leaderboard.BoardGame`
- Produces: `db.leaderboard.GAME_REGISTRY`
- Produces: `db.leaderboard.fetch_scored_leaderboard(table_name, game_meta, player_expr, wins_expr, total_expr, extra_select="", extra_group_by="")`
- Preserves: `database.GAME_REGISTRY`, `database.BoardGame`, and leaderboard function outputs.

- [ ] **Step 1: Create `db/leaderboard.py` with metadata and math helpers**

Move the exact implementation from `database.py` into `db/leaderboard.py` using these source ranges from the current file:

- `database.py:29-96` -> `BoardGame`
- `database.py:102-190` -> `GAME_REGISTRY`
- `database.py:200-215` -> `EPS`, `_clamp`, `_logit`, `_sigmoid`

Rename the helper exports in the new module:

```python
clamp = _clamp
logit = _logit
sigmoid = _sigmoid
```

Expose:

```python
__all__ = [
    "BoardGame",
    "GAME_REGISTRY",
    "fetch_scored_leaderboard",
    "clamp",
    "logit",
    "sigmoid",
]
```

Do not change formulas, constants, registry keys, Chinese game names, or mastery thresholds in this task.

- [ ] **Step 2: Move `_fetch_scored_leaderboard`**

Rename `_fetch_scored_leaderboard` to public `fetch_scored_leaderboard` in `db/leaderboard.py`.

Move `database.py:368-457` into `db/leaderboard.py` and rename only the function definition from `_fetch_scored_leaderboard` to `fetch_scored_leaderboard`.

Required signature after rename:

```python
async def fetch_scored_leaderboard(
    table_name: str,
    game_meta: BoardGame,
    player_expr: str,
    wins_expr: str,
    total_expr: str,
    extra_select: str = "",
    extra_group_by: str = "",
) -> list[dict]:
```

The SQL body and output fields must match the current `_fetch_scored_leaderboard` behavior exactly.

- [ ] **Step 3: Update `database.py` facade imports**

At the top of `database.py`, import:

```python
from db.leaderboard import BoardGame, GAME_REGISTRY, fetch_scored_leaderboard
```

Update internal calls from the old private scorer name `_fetch_scored_leaderboard` to the new public scorer name `fetch_scored_leaderboard`.

- [ ] **Step 4: Verify and commit**

Run:

```bash
python -m compileall db database.py
```

Expected: compile succeeds.

Commit:

```bash
git add db/leaderboard.py database.py
git commit -m "refactor: move leaderboard metadata and scoring"
```

---

### Task 4: Move Database Repository Functions Behind Facade

**Files:**
- Create: `db/repositories.py`
- Modify: `database.py`

**Interfaces:**
- Produces repository functions matching the existing public names in `database.py`.
- Preserves all current imports from `database.py` by re-exporting wrapper functions.

- [ ] **Step 1: Create `db/repositories.py`**

Move the exact persistence implementations from `database.py` into `db/repositories.py` using these source ranges from the current file:

- `database.py:328-343` -> `record_result`
- `database.py:345-366` -> `record_cabo_game`
- `database.py:459-470` -> `get_cabo_leaderboard`
- `database.py:472-538` -> `get_leaderboard`
- `database.py:540-690` -> `get_global_leaderboard`
- `database.py:692-707` -> `record_lasvegas_game`
- `database.py:709-786` -> `get_lasvegas_leaderboard`
- `database.py:788-809` -> `record_flip7_game`
- `database.py:811-824` -> `get_flip7_leaderboard`
- `database.py:826-844` -> `record_modernart_game`
- `database.py:846-857` -> `get_modernart_leaderboard`
- `database.py:859-end` -> `get_simple_leaderboard`

In the moved code, replace `_get_db()` with `get_db()` from `db.connection` and replace calls to `_fetch_scored_leaderboard` with calls to `fetch_scored_leaderboard` from `db.leaderboard`.

Do not change SQL, output field names, sorting, cache keys, or ranking formulas in this task.

- [ ] **Step 2: Turn `database.py` into compatibility facade**

Keep `database.py` exporting all existing names:

```python
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
```

- [ ] **Step 3: Verify exported API surface**

Run:

```bash
python - <<'PY'
import database
required = [
    'BoardGame', 'GAME_REGISTRY', 'init_db', 'record_result',
    'record_cabo_game', 'get_cabo_leaderboard', 'get_leaderboard',
    'get_global_leaderboard', 'record_lasvegas_game', 'get_lasvegas_leaderboard',
    'record_flip7_game', 'get_flip7_leaderboard', 'record_modernart_game',
    'get_modernart_leaderboard', 'get_simple_leaderboard'
]
missing = [name for name in required if not hasattr(database, name)]
assert not missing, missing
print('database facade ok')
PY
```

Expected: `database facade ok`.

- [ ] **Step 4: Commit**

```bash
git add db/repositories.py database.py
git commit -m "refactor: move persistence functions behind database facade"
```

---

### Task 5: Add Shared Services For State And Simple Games

**Files:**
- Create: `services/__init__.py`
- Create: `services/state.py`
- Create: `services/scoring.py`
- Create: `services/simple_game.py`
- Modify: `splendor/app.py`
- Modify: `explodingkittens/app.py`
- Modify: `thegang/app.py`

**Interfaces:**
- Produces: `services.state.get_json_state(key, default)`
- Produces: `services.state.set_json_state(key, value)`
- Produces: `services.simple_game.SimpleGameService`
- Keeps simple game routes and response shapes unchanged.

- [ ] **Step 1: Create service package marker**

Create `services/__init__.py` as an empty file.

- [ ] **Step 2: Create `services/state.py`**

```python
from typing import Any

from state_store import get_store


async def get_json_state(key: str, default: Any):
    value = await get_store().get_json(key)
    return default if value is None else value


async def set_json_state(key: str, value: Any) -> None:
    await get_store().set_json(key, value)


async def delete_state(key: str) -> None:
    await get_store().delete(key)
```

- [ ] **Step 3: Create `services/scoring.py`**

```python
def winners_from_scores(players: list[dict], score_key: str, lower_is_better: bool = False) -> set[str]:
    if not players:
        return set()
    values = [p[score_key] for p in players]
    winning_value = min(values) if lower_is_better else max(values)
    return {p["name"] for p in players if p[score_key] == winning_value}
```

- [ ] **Step 4: Create `services/simple_game.py`**

```python
from dataclasses import dataclass

import database
from services.state import get_json_state, set_json_state, delete_state


@dataclass(frozen=True)
class SimpleGameService:
    state_key: str
    game_name: str

    async def players(self) -> list[str]:
        return await get_json_state(self.state_key, [])

    async def status(self) -> dict:
        return {"players": await self.players()}

    async def add_player(self, name: str) -> dict:
        players = await self.players()
        if name in players:
            return {"status": "error", "msg": "玩家已存在"}
        players.append(name)
        await set_json_state(self.state_key, players)
        return {"status": "ok", "players": players}

    async def remove_player(self, name: str) -> dict:
        players = [p for p in await self.players() if p != name]
        await set_json_state(self.state_key, players)
        return {"status": "ok", "players": players}

    async def reset(self) -> dict:
        await delete_state(self.state_key)
        return {"status": "ok"}

    async def record_winner(self, winner: str) -> dict:
        players = await self.players()
        if winner not in players:
            return {"status": "error", "msg": "胜者不在玩家列表中"}
        for player in players:
            await database.record_result(self.game_name, player, player == winner)
        return {"status": "ok"}

    async def record_coop(self, is_win: bool) -> dict:
        players = await self.players()
        for player in players:
            await database.record_result(self.game_name, player, is_win)
        return {"status": "ok"}
```

- [ ] **Step 5: Refactor `splendor/app.py` and `explodingkittens/app.py`**

For each file, create a module-level service:

```python
service = SimpleGameService("game:splendor:players", "Splendor")
```

or:

```python
service = SimpleGameService("game:explodingkittens:players", "ExplodingKittens")
```

Route handlers return the corresponding service method result. Keep request model class names and endpoints unchanged.

- [ ] **Step 6: Refactor `thegang/app.py`**

Use:

```python
service = SimpleGameService("game:thegang:players", "TheGang")
```

`record_game(req: RecordRequest)` must call `await service.record_coop(req.is_win)` and preserve the old response shape.

- [ ] **Step 7: Verify and commit**

Run:

```bash
python -m compileall services splendor/app.py explodingkittens/app.py thegang/app.py
```

Expected: compile succeeds.

Commit:

```bash
git add services splendor/app.py explodingkittens/app.py thegang/app.py
git commit -m "refactor: share simple game service logic"
```

---

### Task 6: Route Events Through Core Event Gateway Wrapper

**Files:**
- Modify: `core/events.py`
- Modify: `sio_server.py`
- Modify: `lasvegas/app.py`
- Modify: `LoveLetters/fastapi_app.py` if it publishes state events directly
- Modify: any other route module using `state_store.publish` directly

**Interfaces:**
- Produces: `core.events.channel_for_game(game_id: str) -> str`
- Keeps Socket.IO event name `state_update` unchanged.

- [ ] **Step 1: Extend `core/events.py`**

```python
def channel_for_game(game_id: str) -> str:
    return f"game:{game_id}"
```

Keep `publish_game_event()` from Task 1.

- [ ] **Step 2: Replace direct publish calls**

Search:

```bash
python - <<'PY'
from pathlib import Path
for path in Path('.').rglob('*.py'):
    if any(part in {'.git', '__pycache__'} for part in path.parts):
        continue
    text = path.read_text(encoding='utf-8', errors='ignore')
    if '.publish(' in text or 'state_store.publish' in text:
        print(path)
PY
```

For each route module, import:

```python
from core.events import channel_for_game, publish_game_event
```

Then replace direct state-store publishing with:

```python
await publish_game_event(channel_for_game("lasvegas"), event)
```

When the old payload included extra keys, pass them as `payload={"game": "lasvegas"}` or the exact existing payload fields from the old call.

- [ ] **Step 3: Verify `sio_server.py` channel list still covers existing realtime games**

Keep existing `GAME_CHANNELS` values. Add missing channels only if a game already publishes them.

- [ ] **Step 4: Verify and commit**

Run:

```bash
python -m compileall core sio_server.py lasvegas/app.py LoveLetters/fastapi_app.py
```

Expected: compile succeeds.

Commit:

```bash
git add core/events.py sio_server.py lasvegas/app.py LoveLetters/fastapi_app.py
git commit -m "refactor: route realtime events through core wrapper"
```

---

### Task 7: Add Minimal API v2 Metadata Router

**Files:**
- Create: `api/__init__.py`
- Create: `api/v2.py`
- Modify: `main.py`

**Interfaces:**
- Produces: `api.v2.router`
- Adds non-breaking routes under `/api/v2`.

- [ ] **Step 1: Create `api/v2.py`**

```python
from fastapi import APIRouter

import database

router = APIRouter(prefix="/api/v2", tags=["API v2"])


@router.get("/health")
async def health():
    return {"status": "ok", "version": 2}


@router.get("/games")
async def games():
    seen = set()
    items = []
    for game in database.GAME_REGISTRY.values():
        if game.name in seen:
            continue
        seen.add(game.name)
        items.append(
            {
                "name": game.name,
                "rating": game.rating,
                "complexity": game.complexity,
                "min_players": game.min_players,
                "max_players": game.max_players,
                "default_duration": game.default_duration,
                "game_type": game.game_type,
            }
        )
    return {"games": items}
```

- [ ] **Step 2: Create package marker**

Create `api/__init__.py` as an empty file.

- [ ] **Step 3: Register router in `main.py`**

Add:

```python
from api.v2 import router as api_v2_router
```

After app creation, include:

```python
app.include_router(api_v2_router)
```

- [ ] **Step 4: Verify and commit**

Run:

```bash
python -m compileall api main.py
```

Expected: compile succeeds.

Commit:

```bash
git add api main.py
git commit -m "feat: add minimal api v2 metadata routes"
```

---

### Task 8: Rewrite README With Standards And Operations Guide

**Files:**
- Rewrite: `README.md`

**Interfaces:**
- Produces readable UTF-8 Simplified Chinese project documentation.
- Documents backend/frontend standards from the approved spec.

- [ ] **Step 1: Replace README with clean UTF-8 Simplified Chinese content**

Rewrite `README.md` from scratch. Do not reuse the current mojibake content.

The README must contain these sections in this order, written in readable Simplified Chinese:

1. Project title: `Board Game Portal` plus the Simplified Chinese display name for "board game assistant" in parentheses.
2. One-paragraph overview: mobile-first board-game assistant built with FastAPI, Jinja2, Socket.IO, SQLite, and vanilla JS.
3. Supported games list: Avalon, Cabo, Las Vegas, Love Letters, Flip 7, Modern Art, Splendor, Exploding Kittens, The Gang.
4. Local startup commands:

```bash
uv sync
uv run uvicorn main:final_app --host 127.0.0.1 --port 8000
```

5. Production startup command:

```bash
uv run uvicorn main:final_app --host 0.0.0.0 --port 8000
```

6. Backend architecture: `main.py`, `core/`, `db/`, `services/`, game route modules.
7. Frontend architecture: `templates/base.html`, `static/common.css`, `static/common.js`, `static/components.js`.
8. Backend coding standards:
   - Route handlers stay thin.
   - Engines do not import FastAPI, Socket.IO, or database modules.
   - Database access goes through `db/` or the `database.py` compatibility facade.
   - Template rendering uses explicit `TemplateResponse` arguments.
   - Realtime events go through `core.events.publish_game_event()`.
   - Existing API routes and response shapes stay compatible.
9. Frontend coding standards:
   - Do not add Vue, Alpine, Axios, polyfill.io, or MathJax without a separate plan.
   - Reuse `common.css`, `common.js`, and `components.js`.
   - Escape user input with `escHtml()` before `innerHTML` rendering.
   - Keep mobile tap targets at least 44px.
10. New game integration checklist:
    - Add game package with `app.py`, `engine.py`, `index.html`, `__init__.py`.
    - Export `router = APIRouter(prefix="/yourgame", tags=["YourGame"])`.
    - Register the module in `main.py` `APPS_CONFIG`.
    - Add schema/repository functions when persistence is needed.
    - Publish realtime events through `core.events.publish_game_event()` when needed.
    - Use `const API_BASE = '/yourgame/api'` in frontend code.
    - Run compile and smoke checks.
11. Troubleshooting:
    - Explain `TypeError: cannot use 'tuple' as a dict key (unhashable type: 'dict')` as old positional `TemplateResponse("index.html", {"request": request})` usage under new Starlette/FastAPI.
    - Show the correct snippet:

```python
templates.TemplateResponse(
    request=request,
    name="index.html",
    context={"request": request},
)
```

    - Explain that the production ASGI entrypoint is `main:final_app`, not `main:app`.

- [ ] **Step 2: Verify README renders as UTF-8 text**

Run:

```bash
python - <<'PY'
from pathlib import Path
text = Path('README.md').read_text(encoding='utf-8')
assert any('\\u4e00' <= ch <= '\\u9fff' for ch in text)
assert 'unhashable type' in text
assert 'main:final_app' in text
print('README ok')
PY
```

Expected: `README ok`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: rewrite readme with architecture and coding standards"
```

---
### Task 9: Full Compatibility Verification And Cleanup

**Files:**
- Modify only files required by verification failures.

**Interfaces:**
- Produces verified compatibility report in final response.

- [ ] **Step 1: Run compile check**

```bash
python -m compileall .
```

Expected: no syntax errors in project Python files.

- [ ] **Step 2: Start app locally**

```bash
uv run uvicorn main:final_app --host 127.0.0.1 --port 8000
```

Expected: server starts and logs application startup complete.

- [ ] **Step 3: Run smoke check from another terminal**

```bash
python scripts/smoke_check.py --base-url http://127.0.0.1:8000
```

Expected: every listed path returns status 200.

- [ ] **Step 4: Check old TemplateResponse style is gone**

```bash
python - <<'PY'
from pathlib import Path
bad = []
for path in Path('.').rglob('*.py'):
    if any(part in {'.git', '__pycache__', '.venv'} for part in path.parts):
        continue
    text = path.read_text(encoding='utf-8', errors='ignore')
    if 'TemplateResponse("' in text:
        bad.append(str(path))
assert not bad, bad
print('TemplateResponse signatures ok')
PY
```

Expected: `TemplateResponse signatures ok`.

- [ ] **Step 5: Inspect git diff for accidental frontend API changes**

Run:

```bash
git diff --stat HEAD~8..HEAD
```

Expected: backend/docs-focused diff. No broad template or frontend JS changes except necessary smoke compatibility fixes.

- [ ] **Step 6: Commit final cleanup if needed**

If verification required small fixes:

```bash
git add <changed-files>
git commit -m "fix: complete backend compatibility verification"
```

If no fixes were needed, do not create an empty commit.
```
