from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from jose import JWTError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.check_in import CheckIn
from app.models.user import User
from app.schemas.check_in import (
    CheckInHistoryResponse,
    CheckInResponse,
    CheckInStatusResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/api/check-in", tags=["check-in"])


def _perform_check_in(user: User) -> tuple[datetime, datetime]:
    """Set check-in timestamps on user. Returns (now, next_deadline)."""
    now = datetime.now(timezone.utc)
    next_deadline = now + timedelta(days=user.check_in_interval_days)
    user.last_check_in = now
    user.next_deadline = next_deadline
    return now, next_deadline


@router.post("", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED)
async def check_in(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckIn:
    now, _ = _perform_check_in(current_user)

    record = CheckIn(
        user_id=current_user.id,
        checked_in_at=now,
    )
    db.add(record)
    await db.flush()

    return record


@router.post("/quick")
async def quick_check_in(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired check-in token",
    )

    try:
        payload = auth_service.decode_token(token)
        user_id: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")
        if user_id is None or token_type != "check_in":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception

    now, next_deadline = _perform_check_in(user)

    record = CheckIn(
        user_id=user.id,
        checked_in_at=now,
    )
    db.add(record)
    await db.flush()

    return {
        "message": "Check-in successful",
        "next_deadline": next_deadline.isoformat(),
    }


@router.get("/status", response_model=CheckInStatusResponse)
async def check_in_status(
    current_user: User = Depends(get_current_user),
) -> CheckInStatusResponse:
    now = datetime.now(timezone.utc)

    if current_user.next_deadline is None:
        return CheckInStatusResponse(
            last_check_in=current_user.last_check_in,
            next_deadline=None,
            time_remaining_seconds=None,
            status="not_started",
        )

    if not current_user.is_active:
        return CheckInStatusResponse(
            last_check_in=current_user.last_check_in,
            next_deadline=current_user.next_deadline,
            time_remaining_seconds=None,
            status="inactive",
        )

    deadline = current_user.next_deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    remaining = (deadline - now).total_seconds()

    if remaining <= 0:
        return CheckInStatusResponse(
            last_check_in=current_user.last_check_in,
            next_deadline=current_user.next_deadline,
            time_remaining_seconds=0,
            status="overdue",
        )

    warning_threshold = timedelta(hours=current_user.warning_hours_before).total_seconds()
    if remaining <= warning_threshold:
        return CheckInStatusResponse(
            last_check_in=current_user.last_check_in,
            next_deadline=current_user.next_deadline,
            time_remaining_seconds=remaining,
            status="warning",
        )

    return CheckInStatusResponse(
        last_check_in=current_user.last_check_in,
        next_deadline=current_user.next_deadline,
        time_remaining_seconds=remaining,
        status="safe",
    )


@router.get("/history", response_model=CheckInHistoryResponse)
async def check_in_history(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckInHistoryResponse:
    # Count total
    count_stmt = (
        select(func.count())
        .select_from(CheckIn)
        .where(CheckIn.user_id == current_user.id)
    )
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Fetch page
    offset = (page - 1) * per_page
    items_stmt = (
        select(CheckIn)
        .where(CheckIn.user_id == current_user.id)
        .order_by(CheckIn.checked_in_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    items_result = await db.execute(items_stmt)
    items = list(items_result.scalars().all())

    return CheckInHistoryResponse(
        items=[CheckInResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        per_page=per_page,
    )
