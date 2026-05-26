from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.models.alert import Alert, AlertStatus, AlertType
from app.models.user import User
from app.services import auth_service
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


async def check_deadlines(db: AsyncSession) -> dict:
    email_service = EmailService(
        api_key=settings.BREVO_API_KEY,
        frontend_url=settings.FRONTEND_URL,
    )

    now = datetime.now(timezone.utc)
    warnings_sent = 0
    emergencies_sent = 0
    errors = 0

    stmt = (
        select(User)
        .where(User.is_active.is_(True))
        .where(User.next_deadline.is_not(None))
        .options(selectinload(User.contacts))
    )
    result = await db.execute(stmt)
    users = result.scalars().all()

    for user in users:
        deadline = user.next_deadline
        if deadline is None:
            continue

        # Ensure deadline is tz-aware for comparison
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)

        warning_threshold = deadline - timedelta(hours=user.warning_hours_before)

        if now >= deadline:
            # Emergency: deadline has passed
            active_contacts = [c for c in user.contacts if c.is_active]
            for contact in active_contacts:
                # Check if we already sent an emergency alert for this deadline + contact
                existing = await db.execute(
                    select(Alert).where(
                        Alert.user_id == user.id,
                        Alert.contact_id == contact.id,
                        Alert.alert_type == AlertType.emergency,
                        Alert.deadline_at == deadline,
                    )
                )
                if existing.scalar_one_or_none() is not None:
                    continue

                alert = Alert(
                    user_id=user.id,
                    contact_id=contact.id,
                    alert_type=AlertType.emergency,
                    status=AlertStatus.pending,
                    deadline_at=deadline,
                )
                db.add(alert)

                try:
                    success = await email_service.send_emergency_email(user, contact)
                    alert.status = AlertStatus.sent if success else AlertStatus.failed
                    alert.sent_at = datetime.now(timezone.utc) if success else None
                    if success:
                        emergencies_sent += 1
                    else:
                        errors += 1
                except Exception:
                    logger.exception(
                        "Error sending emergency email for user %s to contact %s",
                        user.id,
                        contact.id,
                    )
                    alert.status = AlertStatus.failed
                    errors += 1

        elif now >= warning_threshold:
            # Warning: within warning window
            existing = await db.execute(
                select(Alert).where(
                    Alert.user_id == user.id,
                    Alert.contact_id.is_(None),
                    Alert.alert_type == AlertType.warning,
                    Alert.deadline_at == deadline,
                )
            )
            if existing.scalar_one_or_none() is not None:
                continue

            alert = Alert(
                user_id=user.id,
                contact_id=None,
                alert_type=AlertType.warning,
                status=AlertStatus.pending,
                deadline_at=deadline,
            )
            db.add(alert)

            hours_remaining = max(1, int((deadline - now).total_seconds() / 3600))
            check_in_token = auth_service.create_check_in_token(str(user.id))

            try:
                success = await email_service.send_warning_email(
                    user,
                    hours_remaining,
                    check_in_token,
                )
                alert.status = AlertStatus.sent if success else AlertStatus.failed
                alert.sent_at = datetime.now(timezone.utc) if success else None
                if success:
                    warnings_sent += 1
                else:
                    errors += 1
            except Exception:
                logger.exception(
                    "Error sending warning email for user %s",
                    user.id,
                )
                alert.status = AlertStatus.failed
                errors += 1

    await db.flush()

    return {
        "warnings_sent": warnings_sent,
        "emergencies_sent": emergencies_sent,
        "errors": errors,
    }
