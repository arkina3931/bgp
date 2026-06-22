# Board Game Portal（桌游助手）

Board Game Portal 是一个移动端优先的桌游助手，用 FastAPI、Jinja2、Socket.IO、SQLite 和原生 JavaScript 构建。项目把多个桌游的计分、状态管理、排行榜和实时更新集中在一个轻量门户中，前端保持低依赖，后端保留兼容路由并逐步拆分为清晰的核心层、数据层和服务层。

## 支持的游戏

- Avalon
- Cabo
- Las Vegas
- Love Letters
- Flip 7
- Modern Art
- Splendor
- Exploding Kittens
- The Gang

## 本地启动

```bash
uv sync
uv run uvicorn main:final_app --host 127.0.0.1 --port 8000
```

## 生产启动

```bash
uv run uvicorn main:final_app --host 0.0.0.0 --port 8000
```

## 后端架构

- `main.py`：主 FastAPI 应用，负责生命周期、静态资源、首页、游戏路由注册和 Socket.IO ASGI 包装。
- `core/`：通用基础能力，包括配置、模板渲染、事件发布和响应工具。
- `db/`：SQLite 连接、schema 初始化、排行榜算法和仓储函数。
- `services/`：跨游戏复用的业务服务，例如简单游戏玩家状态与记录逻辑。
- 各游戏目录：游戏自己的 `app.py` 接入层、`engine.py` 引擎层和入口页面。
- `database.py`：兼容门面。旧代码仍可导入它，新代码优先使用 `db/` 或服务层。

## 前端架构

- `templates/base.html`：全站基础模板，提供公共页面骨架。
- `static/common.css`：全站样式变量、移动端布局、按钮、列表和卡片等基础 UI。
- `static/common.js`：全站通用 JS 工具。
- `static/components.js`：复用 Web Components，例如游戏卡片和排行榜组件。

## 后端代码规范

- Route handler 保持薄层：只做请求解析、调用 service/engine、发布事件、返回响应。
- 游戏引擎不得导入 FastAPI、Socket.IO 或数据库模块。
- 数据库访问走 `db/` 或 `database.py` 兼容门面，不在路由里直接写 SQL。
- 模板渲染必须使用显式参数或 `core.templates.render_template()`：

```python
templates.TemplateResponse(
    request=request,
    name="index.html",
    context={"request": request},
)
```

- 实时事件通过 `core.events.publish_game_event()` 发布，由 `sio_server.py` 统一广播。
- 现有 API 路由、请求体、响应字段和 Socket.IO 事件名必须保持兼容。

## 前端代码规范

- 不要在没有独立方案的情况下新增 Vue、Alpine、Axios、polyfill.io 或 MathJax。
- 优先复用 `common.css`、`common.js` 和 `components.js`，避免每个页面重复定义基础按钮、卡片、列表样式。
- 使用 `innerHTML` 渲染用户输入前必须先通过 `escHtml()` 转义。
- 移动端可点击区域至少 44px，表单、按钮和底部导航都按触屏优先设计。
- 前端 API 前缀保持清晰，例如 `const API_BASE = '/yourgame/api'`。

## 新游戏接入检查清单

1. 新增游戏包，包含 `app.py`、`engine.py`、`index.html` 和 `__init__.py`。
2. 在 `app.py` 导出 `router = APIRouter(prefix="/yourgame", tags=["YourGame"])`。
3. 在 `main.py` 的 `APPS_CONFIG` 注册模块路径。
4. 需要持久化时，在 `db/schema.py` 和 `db/repositories.py` 添加表结构与仓储函数，并通过 `database.py` 暴露兼容入口。
5. 需要实时更新时，通过 `core.events.publish_game_event()` 发布事件，并确保 `sio_server.py` 订阅对应频道。
6. 前端使用 `const API_BASE = '/yourgame/api'`，页面路由与 API 前缀保持一致。
7. 运行 Python 编译检查和 smoke check，确认旧页面与新增页面都返回 200。

## Troubleshooting

### 首页 500：unhashable type: 'dict'

如果日志中出现：

```text
TypeError: cannot use 'tuple' as a dict key (unhashable type: 'dict')
```

通常是新版 FastAPI/Starlette 下仍使用旧的 Jinja2 写法：

```python
templates.TemplateResponse("index.html", {"request": request})
```

新版应使用显式关键字参数：

```python
templates.TemplateResponse(
    request=request,
    name="index.html",
    context={"request": request},
)
```

项目里推荐直接使用 `core.templates.render_template()`。

### 访问没有页面

生产 ASGI 入口是 `main:final_app`，不是 `main:app`。正确启动：

```bash
uv run uvicorn main:final_app --host 0.0.0.0 --port 8000
```

`main:final_app` 会把 FastAPI app 包装进 Socket.IO ASGI 应用，否则实时通信路径可能不完整。

## 兼容 API

- 旧入口：`/`、`/gamelist`、`/<game>/`、`/<game>/api/*` 继续保留。
- 旧排行榜：`/api/leaderboard` 继续返回 Avalon 排行榜。
- 新增非破坏性接口：
  - `GET /api/v2/health`
  - `GET /api/v2/games`

## Smoke Check

启动服务后可以运行：

```bash
python scripts/smoke_check.py --base-url http://127.0.0.1:8000
```

脚本会检查首页、游戏页和关键 API 是否返回 200。
