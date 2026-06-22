from typing import Any

from state_store import get_store


async def get_json_state(key: str, default: Any):
    value = await get_store().get_json(key)
    return default if value is None else value


async def set_json_state(key: str, value: Any) -> None:
    await get_store().set_json(key, value)


async def delete_state(key: str) -> None:
    await get_store().delete(key)
