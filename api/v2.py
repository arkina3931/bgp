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
