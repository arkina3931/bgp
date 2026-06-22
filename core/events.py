from state_store import get_store


def channel_for_game(game_id: str) -> str:
    return f"game:{game_id}"


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
