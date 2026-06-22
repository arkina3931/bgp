"""
splendor/app.py - 璀璨宝石接入层

路由注册、请求解析、调用引擎、返回结果。
不包含业务逻辑。
"""

import asyncio
import os

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel

import database
from services.simple_game import SimpleGameService

router = APIRouter(prefix="/splendor", tags=["Splendor"])
base_dir = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=[base_dir, "templates"])

# ---------------------------------------------------------------------------
# 状态 & 服务实例
# ---------------------------------------------------------------------------
global_lock = asyncio.Lock()

GAME_NAME = "Splendor"
service = SimpleGameService("game:splendor:players", GAME_NAME)

# ---------------------------------------------------------------------------
# 请求模型
# ---------------------------------------------------------------------------

class NameRequest(BaseModel):
    name: str

class RecordRequest(BaseModel):
    winner: str

# ---------------------------------------------------------------------------
# API 端点 — 接入层
# ---------------------------------------------------------------------------

@router.post("/api/add_player")
async def add_player(req: NameRequest):
    async with global_lock:
        return await service.add_player(req.name)

@router.post("/api/remove_player")
async def remove_player(req: NameRequest):
    async with global_lock:
        return await service.remove_player(req.name)

@router.post("/api/record")
async def record_game(req: RecordRequest):
    async with global_lock:
        return await service.record_winner(req.winner)

@router.post("/api/reset")
async def reset_game():
    async with global_lock:
        return await service.reset()

@router.get("/api/status")
async def get_status():
    return await service.status()

@router.get("/api/leaderboard")
async def get_leaderboard():
    return {"leaderboard": await database.get_simple_leaderboard(GAME_NAME)}

@router.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse(request=request, name="index.html", context={"request": request})
