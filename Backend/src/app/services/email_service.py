import resend

from app.core.config import settings


def send_otp_email(email: str, otp: str) -> None:
    if not settings.resend_api_key:
        raise RuntimeError("RESEND_API_KEY is required")
    if not settings.resend_sender_email or not settings.resend_sender_name:
        raise RuntimeError("RESEND_SENDER_EMAIL and RESEND_SENDER_NAME are required")

    resend.api_key = settings.resend_api_key
    resend.Emails.send(
        {
            "from": f"{settings.resend_sender_name} <{settings.resend_sender_email}>",
            "to": [email],
            "subject": "Your verification code",
            "html": f"<p>Your OTP code is <strong>{otp}</strong>. It expires in 10 minutes.</p>",
        }
    )