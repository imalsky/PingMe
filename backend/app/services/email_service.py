from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import httpx

if TYPE_CHECKING:
    from app.models.contact import Contact
    from app.models.user import User

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


class EmailService:
    def __init__(self, api_key: str, frontend_url: str) -> None:
        self.api_key = api_key.strip()
        self.frontend_url = frontend_url

    async def send_email(
        self,
        to_email: str,
        to_name: str,
        subject: str,
        html_content: str,
    ) -> bool:
        if not self.api_key:
            logger.warning("BREVO_API_KEY not configured; skipping email to %s", to_email)
            return False

        payload = {
            "sender": {"name": "PingMe", "email": "isaacmalsky@gmail.com"},
            "to": [{"email": to_email, "name": to_name}],
            "subject": subject,
            "htmlContent": html_content,
        }
        headers = {
            "api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    BREVO_API_URL,
                    json=payload,
                    headers=headers,
                )
            if response.is_success:
                logger.info("Email sent successfully to %s", to_email)
                return True
            else:
                logger.error(
                    "Failed to send email to %s: %s %s",
                    to_email,
                    response.status_code,
                    response.text,
                )
                return False
        except httpx.HTTPError as exc:
            logger.error("HTTP error sending email to %s: %s", to_email, exc)
            return False

    async def send_warning_email(
        self,
        user: User,
        hours_remaining: int,
        check_in_token: str,
    ) -> bool:
        check_in_url = f"{self.frontend_url}/quick-check-in?token={check_in_token}"
        subject = f"PingMe: Check in required — {hours_remaining} hours remaining"
        html_content = f"""\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background-color:#3b82f6; padding:24px 32px;">
              <h1 style="margin:0; color:#ffffff; font-size:24px;">PingMe</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px; color:#1f2937; font-size:20px;">
                Time to check in, {user.name}
              </h2>
              <p style="margin:0 0 16px; color:#4b5563; font-size:16px; line-height:1.5;">
                Your check-in deadline is approaching. You have approximately
                <strong>{hours_remaining} hours</strong> remaining.
              </p>
              <p style="margin:0 0 24px; color:#4b5563; font-size:16px; line-height:1.5;">
                Click the button below to confirm you're doing well. If we don't hear
                from you before the deadline, your emergency contacts will be notified.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td align="center" style="background-color:#3b82f6; border-radius:6px;">
                    <a href="{check_in_url}"
                       style="display:inline-block; padding:16px 48px; color:#ffffff; text-decoration:none; font-size:18px; font-weight:bold;">
                      CHECK IN NOW
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0; color:#9ca3af; font-size:13px; line-height:1.4;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{check_in_url}" style="color:#3b82f6; word-break:break-all;">{check_in_url}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb;">
              <p style="margin:0; color:#9ca3af; font-size:12px;">
                You're receiving this because you have an active PingMe wellness check.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        return await self.send_email(user.email, user.name, subject, html_content)

    async def send_emergency_email(
        self,
        user: User,
        contact: Contact,
    ) -> bool:
        subject = f"Important: {user.name} needs a wellness check"

        alert_section = ""
        if user.alert_message:
            alert_section = f"""\
              <tr>
                <td style="padding:0 32px 24px;">
                  <div style="background-color:#fef3c7; border-left:4px solid #f59e0b; padding:16px; border-radius:4px;">
                    <p style="margin:0 0 4px; color:#92400e; font-size:13px; font-weight:bold;">
                      Message from {user.name}:
                    </p>
                    <p style="margin:0; color:#92400e; font-size:15px; line-height:1.5;">
                      {user.alert_message}
                    </p>
                  </div>
                </td>
              </tr>"""

        html_content = f"""\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background-color:#dc2626; padding:24px 32px;">
              <h1 style="margin:0; color:#ffffff; font-size:24px;">PingMe</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 16px;">
              <h2 style="margin:0 0 16px; color:#1f2937; font-size:20px;">
                Wellness check for {user.name}
              </h2>
              <p style="margin:0 0 16px; color:#4b5563; font-size:16px; line-height:1.5;">
                Hello {contact.name},
              </p>
              <p style="margin:0 0 16px; color:#4b5563; font-size:16px; line-height:1.5;">
                You are listed as an emergency contact for <strong>{user.name}</strong>
                on PingMe, a wellness check service. {user.name} has not checked in
                by their scheduled deadline.
              </p>
              <p style="margin:0 0 24px; color:#4b5563; font-size:16px; line-height:1.5;">
                We recommend reaching out to {user.name} to make sure everything is okay.
                This may simply mean they were busy or forgot, but a quick call or
                message would help put everyone at ease.
              </p>
            </td>
          </tr>
          {alert_section}
          <tr>
            <td style="padding:0 32px 32px;">
              <p style="margin:0; color:#6b7280; font-size:14px; line-height:1.5;">
                <strong>Contact information:</strong><br>
                Email: <a href="mailto:{user.email}" style="color:#3b82f6;">{user.email}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb;">
              <p style="margin:0; color:#9ca3af; font-size:12px;">
                You're receiving this because {user.name} listed you as an emergency
                contact on PingMe. If you believe this was sent in error, please
                disregard this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        return await self.send_email(contact.email, contact.name, subject, html_content)

    async def send_test_email(
        self,
        user: User,
        contact: Contact,
    ) -> bool:
        subject = f"PingMe: Test notification from {user.name}"
        html_content = f"""\
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background-color:#3b82f6; padding:24px 32px;">
              <h1 style="margin:0; color:#ffffff; font-size:24px;">PingMe</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 16px; color:#1f2937; font-size:20px;">
                This is a test notification
              </h2>
              <p style="margin:0 0 16px; color:#4b5563; font-size:16px; line-height:1.5;">
                Hello {contact.name},
              </p>
              <p style="margin:0 0 16px; color:#4b5563; font-size:16px; line-height:1.5;">
                <strong>{user.name}</strong> has added you as an emergency contact on
                PingMe, a wellness check service. This is a test email to confirm
                that notifications are working correctly.
              </p>
              <p style="margin:0 0 16px; color:#4b5563; font-size:16px; line-height:1.5;">
                If {user.name} ever misses a scheduled check-in, you will receive an
                email asking you to reach out and make sure they are okay.
              </p>
              <div style="background-color:#f0fdf4; border-left:4px solid #22c55e; padding:16px; border-radius:4px;">
                <p style="margin:0; color:#166534; font-size:14px;">
                  No action needed — this is just a test.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb; padding:16px 32px; border-top:1px solid #e5e7eb;">
              <p style="margin:0; color:#9ca3af; font-size:12px;">
                You're receiving this because {user.name} listed you as an emergency
                contact on PingMe. If you believe this was sent in error, please
                disregard this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

        return await self.send_email(contact.email, contact.name, subject, html_content)
