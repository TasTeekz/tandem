from pydantic import BaseModel


def ilike_pattern(q: str) -> str:
    """Substring pattern for ILIKE, with backslash as the escape character."""
    escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def changes(model: BaseModel, nullable: frozenset[str] = frozenset()) -> dict:
    """PATCH fields actually sent; explicit null is dropped unless the column is nullable."""
    data = model.model_dump(exclude_unset=True)
    return {k: v for k, v in data.items() if v is not None or k in nullable}
