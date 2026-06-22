from dataclasses import dataclass

import database
from services.state import delete_state, get_json_state, set_json_state


@dataclass(frozen=True)
class SimpleGameService:
    state_key: str
    game_name: str

    async def players(self) -> list[str]:
        return list(await get_json_state(self.state_key, []))

    async def status(self) -> dict:
        return {"players": await self.players()}

    async def add_player(self, name: str) -> dict:
        cleaned_name = name.strip()
        if not cleaned_name:
            return {"status": "error", "msg": "玩家名不能为空"}
        players = await self.players()
        if cleaned_name in players:
            return {"status": "error", "msg": "玩家已存在"}
        players.append(cleaned_name)
        await set_json_state(self.state_key, players)
        return {"status": "ok"}

    async def remove_player(self, name: str) -> dict:
        players = await self.players()
        if name not in players:
            return {"status": "error", "msg": "玩家不存在"}
        players.remove(name)
        await set_json_state(self.state_key, players)
        return {"status": "ok"}

    async def reset(self) -> dict:
        await delete_state(self.state_key)
        return {"status": "ok"}

    async def record_winner(self, winner: str) -> dict:
        players = await self.players()
        if len(players) < 2:
            return {"status": "error", "msg": "至少需要 2 名玩家"}
        if winner not in players:
            return {"status": "error", "msg": "胜者必须在玩家列表中"}
        for player in players:
            await database.record_result(self.game_name, player, player == winner)
        await self.reset()
        return {"status": "ok", "players": players, "winner": winner}

    async def record_coop(self, is_win: bool) -> dict:
        players = await self.players()
        if len(players) < 2:
            return {"status": "error", "msg": "至少需要 2 名玩家"}
        for player in players:
            await database.record_result(self.game_name, player, is_win)
        await self.reset()
        return {"status": "ok", "players": players, "is_win": is_win}
