import resend

from app.core.config import settings
from app.core.email_templates import get_otp_template


def send_otp_email(email: str, otp: str) -> None:
    print(f"OTP for {email}: {otp}", flush=True)
    if not settings.resend_api_key:
        # Fallback or dev mode logging is already done above
        return
    if not settings.resend_sender_email or not settings.resend_sender_name:
        raise RuntimeError("RESEND_SENDER_EMAIL and RESEND_SENDER_NAME are required")

    resend.api_key = settings.resend_api_key
    html_content = get_otp_template(otp)
    resend.Emails.send(
        {
            "from": f"{settings.resend_sender_name} <{settings.resend_sender_email}>",
            "to": [email],
            "subject": "Your verification code",
            "html": html_content,
        }
    )
