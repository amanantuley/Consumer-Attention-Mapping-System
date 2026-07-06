import json
import logging
import httpx
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("cams.notifications")

class NotificationDispatcher:
    @staticmethod
    async def send_slack_alert(webhook_url: str, message: str) -> bool:
        """
        Sends an alert message to a designated Slack channel.
        """
        try:
            payload = {"text": f"🚨 *CAMS Alert:* {message}"}
            async with httpx.AsyncClient() as client:
                response = await client.post(webhook_url, json=payload, timeout=5.0)
                if response.status_code == 200:
                    logger.info("Slack alert dispatched successfully.")
                    return True
                else:
                    logger.error(f"Slack webhook returned status code {response.status_code}: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Failed to dispatch Slack alert: {e}")
            return False

    @staticmethod
    def send_email(recipient: str, subject: str, body: str) -> bool:
        """
        Mocks sending an SMTP email to a user.
        In production, we configure a real transactional service (e.g. SendGrid, SES).
        """
        logger.info(f"Sending Email to {recipient} | Subject: {subject}")
        print(f"--- EMAIL DISPATCHED ---\nTo: {recipient}\nSubject: {subject}\nBody:\n{body}\n------------------------")
        return True

    @staticmethod
    def send_sms(phone_number: str, message: str) -> bool:
        """
        Mocks sending an SMS notification via Twilio.
        """
        logger.info(f"Sending SMS to {phone_number} | Msg: {message}")
        print(f"--- SMS DISPATCHED ---\nPhone: {phone_number}\nMessage: {message}\n----------------------")
        return True

    @classmethod
    def dispatch_alert(cls, alert_type: str, details: str, slack_webhook: Optional[str] = None):
        """
        Dispatches alerts across configured channels based on severity.
        """
        alert_msg = f"[{alert_type.upper()}] {details}"
        logger.warn(f"Alert raised: {alert_msg}")
        
        # 1. Print console and log alert
        print(f"📢 ALERT: {alert_msg}")
        
        # 2. If slack webhook is provided, execute it asynchronously (logged inline here)
        if slack_webhook:
            import asyncio
            try:
                # Run the coroutine in the background
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(cls.send_slack_alert(slack_webhook, alert_msg))
                else:
                    asyncio.run(cls.send_slack_alert(slack_webhook, alert_msg))
            except Exception:
                pass
                
        # 3. Simulate SMS notification for critical failures
        if "critical" in alert_type.lower():
            cls.send_sms("+15550192834", f"Critical CAMS failure: {details}")
