from pydantic import BaseModel

from app.features.auth.schemas import PublicUserOut
from app.features.groups.schemas import GroupOut
from app.features.materials.schemas import MaterialOut


class SearchOut(BaseModel):
    groups: list[GroupOut]
    materials: list[MaterialOut]
    users: list[PublicUserOut]
