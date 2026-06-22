from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DB_NAME = str(ROOT_DIR / "games.db")
TEMPLATE_DIR = str(ROOT_DIR / "templates")
STATIC_DIR = str(ROOT_DIR / "static")
AVALON_ASSETS_DIR = str(ROOT_DIR / "Avalon" / "assets")
