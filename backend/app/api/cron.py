from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_cron_api_key
from app.services.deadline_checker import check_deadlines

router = APIRouter(prefix="/api/cron", tags=["cron"])


@router.post("/check-deadlines")
async def run_check_deadlines(
    _api_key: str = Depends(get_cron_api_key),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await check_deadlines(db)
    return result
