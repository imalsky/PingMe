from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SettingsUpdate(BaseModel):
    check_in_interval_days: Optional[int] = Field(default=None, ge=1, le=30)
    warning_hours_before: Optional[int] = Field(default=None, ge=1, le=72)
    alert_message: Optional[str] = None
    is_active: Optional[bool] = None


class SettingsResponse(BaseModel):
    check_in_interval_days: int
    warning_hours_before: int
    alert_message: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
