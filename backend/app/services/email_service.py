from typing import List, Any
from pydantic import EmailStr
from app.core.config import settings

class EmailService:
    def __init__(self):
        self.enabled = bool(settings.SMTP_HOST)

    async def send_email(
        self,
        email_to: List[EmailStr],
        subject: str,
        html_content: str,
    ) -> None:
        if not self.enabled:
            print(f"--- EMAIL STUB ---")
            print(f"To: {email_to}")
            print(f"Subject: {subject}")
            print(f"Content: {html_content[:50]}...")
            print(f"------------------")
            return

        # Real implementation would use fastapi-mail or aiosmtplib here
        # message = MessageSchema(...)
        # fm = FastMail(conf)
        # await fm.send_message(message)
        pass

email_service = EmailService()
