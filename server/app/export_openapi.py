"""Writes server/openapi.json. Usage: python -m app.export_openapi"""

import json
import os
from pathlib import Path

# The schema does not need a live database or real secrets.
os.environ.setdefault("POSTGRES_URL", "postgresql+asyncpg://user:pass@localhost/tandem")
os.environ.setdefault("JWT_SECRET", "openapi-export")

from app.main import create_app  # noqa: E402


def main() -> None:
    path = Path(__file__).resolve().parents[1] / "openapi.json"
    schema = create_app().openapi()
    path.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {path}")


if __name__ == "__main__":
    main()
