from dataclasses import dataclass

from fastapi import Query
from pydantic import BaseModel


class Page[T](BaseModel):
    items: list[T]
    total: int


@dataclass
class Pagination:
    limit: int = Query(20, ge=1, le=100)
    offset: int = Query(0, ge=0)
