"""Imports every ORM model so Base.metadata is complete (Alembic, tests)."""

from app.features.auth.models import User  # noqa: F401
from app.features.goals.models import Goal, GoalProgress  # noqa: F401
from app.features.groups.models import Group, Membership  # noqa: F401
from app.features.materials.models import Material  # noqa: F401
from app.features.messages.models import Message  # noqa: F401
from app.features.notifications.models import Notification  # noqa: F401
