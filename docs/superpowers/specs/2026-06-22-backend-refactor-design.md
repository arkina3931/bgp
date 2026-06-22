# Backend Refactor Design - Board Game Portal

Date: 2026-06-22
Status: Approved
Scope: Backend architecture refactor, frontend/backend coding standards, README rewrite

## 1. Goals And Constraints

### Goals
- Refactor the backend into clear layers while keeping the existing frontend working unchanged.
- Preserve all current public API paths, request bodies, and response shapes.
- Reduce duplicated route/service/database logic across games.
- Make future API v2 work possible without forcing a frontend migration now.
- Rewrite README in readable Chinese with startup, deployment, architecture, and coding standards.

### Non-Goals
- Do not redesign the frontend UI in this phase.
- Do not rename or remove existing URLs such as `/cabo/api/status` or `/api/leaderboard`.
- Do not migrate the database engine away from SQLite.
- Do not introduce a heavy framework or ORM.

## 2. Target Architecture

The project will use a compatibility shell around a cleaner backend core.
Existing game routers remain mounted at the same paths, but shared logic moves into reusable modules.

```text
core/
  config.py          # Paths, environment, DB name, app constants
  templates.py       # Safe TemplateResponse helper for new Starlette/FastAPI
  events.py          # Unified event publishing wrapper around state_store
  responses.py       # Lightweight response helpers; no legacy response shape changes

db/
  connection.py      # Async SQLite connection context
  schema.py          # Table creation and migrations-lite initialization
  repositories.py    # Persistence APIs for game results and specialized tables
  leaderboard.py     # BoardGame metadata and leaderboard/rating algorithms

services/
  simple_game.py     # Shared player/result flow for Splendor, Exploding Kittens, The Gang
  scoring.py         # Shared scoring/ranking helpers
  state.py           # Shared state access helpers around state_store

api/
  v2.py              # Future-facing API namespace; initially limited and non-breaking
```

`main.py` becomes thin: create the FastAPI app, initialize storage, mount static files, load routers, register the Socket.IO ASGI wrapper, and render top-level pages.

## 3. Compatibility Rules

All existing frontend contracts are frozen during this refactor:

- Existing route paths remain unchanged.
- Existing request body fields remain unchanged.
- Existing response fields and success/error conventions remain unchanged.
- Existing Socket.IO event names remain unchanged.
- Existing database files and tables remain readable without manual migration.

New internals may expose cleaner functions, but legacy routers must adapt those internals back into the same external shapes.

## 4. Backend Design Details

### Routing Layer
- Route modules only parse requests, call services, publish events when needed, and return responses.
- Route modules must use explicit `TemplateResponse(request=..., name=..., context=...)` or the shared template helper.
- Route modules must not contain scoring algorithms, SQL, or game rules.

### Engine Layer
- Game engines remain pure Python logic where possible.
- Engines must not import FastAPI, Socket.IO, or database modules.
- Engine methods return plain Python data or domain objects; route/service layers translate them to HTTP responses.

### Database Layer
- Move database connection and schema initialization out of the large `database.py` into `db/` modules.
- Keep `database.py` as a compatibility facade during the migration so existing imports continue to work.
- Leaderboard formulas and game metadata move to `db/leaderboard.py`.
- Table creation moves to `db/schema.py`.

### Services Layer
- Simple winner/coop games share a service for add/remove/reset/status/record flows.
- Specialized games keep their own service logic when rules differ substantially.
- Event publishing goes through `core.events.publish_game_event()` instead of direct `state_store.publish()` calls.

### API v2 Preparation
- Add an optional `/api/v2` router only for health/metadata endpoints in this phase.
- Do not migrate frontend calls to v2 yet.
- Do not duplicate every legacy endpoint under v2 until a separate API migration plan exists.

## 5. Documentation And Standards

Rewrite `README.md` in readable Chinese with:

- Project overview and supported games.
- Local development startup commands.
- Production deployment command using `main:final_app`.
- Backend architecture and responsibility boundaries.
- Frontend architecture after the vanilla JS refactor.
- Coding standards for routers, engines, database, state, realtime events, templates, and frontend JS/CSS.
- New game integration checklist.
- Troubleshooting section for the recent Jinja2/TemplateResponse issue.

Core standards to document:

- Backend route handlers stay thin.
- Database access happens through repository/service helpers.
- Engines stay framework-independent.
- Template rendering uses explicit arguments.
- Realtime updates go through the event gateway/state store path.
- Frontend uses `common.css`, `common.js`, and `components.js`.
- Do not add Vue, Alpine, Axios, polyfill.io, or MathJax without a separate decision.
- User-provided content rendered with `innerHTML` must be escaped with `escHtml()`.

## 6. Migration Strategy

Use incremental, compatible steps:

1. Add new backend packages and helpers.
2. Move database connection/schema/leaderboard logic behind compatibility facades.
3. Update existing routers to call services while keeping outputs identical.
4. Consolidate repeated simple game code.
5. Add minimal `/api/v2` metadata/health route.
6. Rewrite README and codify standards.
7. Run full compatibility checks.

Do not perform a big-bang route rewrite.
Each step should leave the app runnable.

## 7. Verification Plan

Minimum checks:

```bash
python -m compileall .
uv run uvicorn main:final_app --host 0.0.0.0 --port 8000
```

Verify pages return 200:

- `/`
- `/gamelist`
- `/avalon/`
- `/cabo/`
- `/lasvegas/`
- `/loveletters/`
- `/flip7/`
- `/modernart/`
- `/splendor/`
- `/explodingkittens/`
- `/thegang/`

Verify core API compatibility:

- `/api/leaderboard`
- each game's `/api/status` where it exists
- each game's `/api/leaderboard` where it exists
- representative write endpoints for add player, reset, record/submit round

Manual browser check:

- Homepage renders without 500.
- Bottom tab bar works.
- Game detail pages still load.
- At least one simple game can add/remove player and record a result.

## 8. Risks

- `database.py` is large and currently mixes schema, metadata, writes, and leaderboard algorithms. Keep a compatibility facade to reduce import churn.
- Some files contain mojibake comments from prior encoding issues. README should be rewritten cleanly, but code comments can be cleaned only where touched.
- Python/FastAPI/Starlette version behavior changed around `TemplateResponse`; explicit arguments are mandatory.
- The frontend has just been refactored, so API compatibility is more important than naming cleanliness in this phase.

## 9. Acceptance Criteria

- Existing frontend works without route or response changes.
- Backend has clear `core/`, `db/`, `services/`, and optional `api/` boundaries.
- Repeated simple game route logic is consolidated.
- README is readable Chinese and includes backend/frontend standards.
- No old positional `TemplateResponse("...", {...})` calls remain.
- Full verification plan passes or any skipped check is explicitly documented.
