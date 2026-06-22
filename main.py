import uvicorn
import importlib
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from contextlib import asynccontextmanager
import socketio

from api.v2 import router as api_v2_router
import database
from core.config import AVALON_ASSETS_DIR, STATIC_DIR, TEMPLATE_DIR
from core.templates import render_template
from sio_server import sio, gateway
from state_store import close_store

APPS_CONFIG = {
    "avalon": "Avalon.main",
    "cabo": "cabo.app",
    "lasvegas": "lasvegas.app",
    "loveletters": "LoveLetters.fastapi_app",
    "flip7": "flip7.app",
    "modernart": "ModernArt.app",
    "splendor": "splendor.app",
    "explodingkittens": "explodingkittens.app",
    "thegang": "thegang.app",
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    # 初始化推送网关（订阅 state_store 事件频道）
    gateway.init()
    yield
    # 关闭状态存储连接
    await close_store()

app = FastAPI(title="Board Game Portal", lifespan=lifespan)
app.include_router(api_v2_router)

from fastapi import Response

# 放在 app = FastAPI() 之后
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    # 204 No Content 告诉浏览器：通讯成功，但我没有图标给你
    return Response(status_code=204)

# Mount Static Files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

loaded_apps = []

for mount_path, module_name in APPS_CONFIG.items():
    try:
        mod = importlib.import_module(module_name)
        sub_router = getattr(mod, "router")
        app.include_router(sub_router)
        if mount_path == "avalon":
            app.mount(
                "/avalon/assets",
                StaticFiles(directory=AVALON_ASSETS_DIR),
                name="avalon-assets",
            )
        loaded_apps.append(mount_path)
    except Exception as e:
        print(f"Error importing {mount_path}: {e}")

# Templates for Landing Page
templates = Jinja2Templates(directory=TEMPLATE_DIR)

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    leaderboard = await database.get_global_leaderboard()
    
    gw_seen = set()
    game_weights = []
    for game in database.GAME_REGISTRY.values():
        if game.name not in gw_seen:
            gw_seen.add(game.name)
            game_weights.append({"name": game.name, "weight": round(game.weight, 2)})
    game_weights.sort(key=lambda x: x["weight"], reverse=True)
    
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

@app.get("/gamelist", response_class=HTMLResponse)
async def gamelist(request: Request):
    return render_template(templates, request, "gamelist.html")

@app.get("/api/leaderboard")
async def get_leaderboard_api():
    return await database.get_leaderboard()

# Wrap the main FastAPI app with socketio ASGIApp
final_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path='/socket.io')

if __name__ == "__main__":
    uvicorn.run("main:final_app", host="127.0.0.1", port=8000, reload=True)
