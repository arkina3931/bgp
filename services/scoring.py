def winners_from_scores(
    players: list[dict],
    score_key: str,
    lower_is_better: bool = False,
) -> set[str]:
    if not players:
        return set()
    values = [p[score_key] for p in players]
    winning_value = min(values) if lower_is_better else max(values)
    return {p["name"] for p in players if p[score_key] == winning_value}
