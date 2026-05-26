from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict


class CheckInResponse(BaseModel):
    id: uuid.UUID
    checked_in_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CheckInStatusResponse(BaseModel):
    last_check_in: Optional[datetime] = None
    next_deadline: Optional[datetime] = None
    time_remaining_seconds: Optional[float] = None
    status: Literal["safe", "warning", "overdue", "inactive", "not_started"]


class CheckInHistoryResponse(BaseModel):
    items: list[CheckInResponse]
    total: int
    page: int
    per_page: int
