from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.settings import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


@router.put("", response_model=SettingsResponse)
async def update_settings(
    body: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    update_data = body.model_dump(exclude_unset=True)
    now = datetime.now(timezone.utc)

    # Track if interval changed so we can recalculate deadline
    new_interval = update_data.get("check_in_interval_days")
    interval_changed = (
        new_interval is not None
        and new_interval != current_user.check_in_interval_days
    )

    # Track is_active change
    new_is_active = update_data.get("is_active")
    reactivating = (
        new_is_active is True
        and not current_user.is_active
    )

    # Apply all field updates
    for field, value in update_data.items():
        setattr(current_user, field, value)

    # Recalculate next_deadline if interval changed and user has checked in before
    if interval_changed and current_user.last_check_in is not None:
        current_user.next_deadline = (
            current_user.last_check_in
            + timedelta(days=current_user.check_in_interval_days)
        )

    # If reactivating and deadline is in the past, reset it
    if reactivating and current_user.next_deadline is not None:
        deadline = current_user.next_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if deadline <= now:
            current_user.next_deadline = now + timedelta(
                days=current_user.check_in_interval_days
            )

    await db.flush()
    return current_user
