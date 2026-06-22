import argparse
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

GET_PATHS = [
    "/",
    "/gamelist",
    "/avalon/",
    "/cabo/",
    "/lasvegas/",
    "/loveletters/",
    "/flip7/",
    "/modernart/",
    "/splendor/",
    "/explodingkittens/",
    "/thegang/",
    "/api/leaderboard",
    "/cabo/api/status",
    "/lasvegas/api/status",
    "/flip7/api/status",
    "/modernart/api/state",
    "/splendor/api/status",
    "/explodingkittens/api/status",
    "/thegang/api/status",
]


def request_json_or_text(base_url: str, path: str) -> tuple[int, str]:
    req = Request(
        base_url.rstrip("/") + path,
        headers={"Accept": "application/json,text/html"},
    )
    with urlopen(req, timeout=8) as response:
        body = response.read(300).decode("utf-8", errors="replace")
        return response.status, body


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    args = parser.parse_args()
    failures = []
    for path in GET_PATHS:
        try:
            status, body = request_json_or_text(args.base_url, path)
            print(
                json.dumps(
                    {"path": path, "status": status, "sample": body[:80]},
                    ensure_ascii=False,
                )
            )
            if status != 200:
                failures.append((path, status))
        except (HTTPError, URLError, TimeoutError) as exc:
            print(json.dumps({"path": path, "error": str(exc)}, ensure_ascii=False))
            failures.append((path, "error"))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
