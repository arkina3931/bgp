def ok(**fields):
    return {"status": "ok", **fields}


def error(message: str, **fields):
    return {"status": "error", "msg": message, **fields}
