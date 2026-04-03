from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, normalize_email
from app.models.user import User
from app.schemas.auth import AuthUser
from app.services.email_service import send_otp_email
from app.services.otp_service import clear_stored_otp, create_and_store_otp, verify_stored_otp


async def request_otp(email: str) -> None:
    otp = create_and_store_otp(email)
    send_otp_email(normalize_email(email), otp)


async def verify_otp(session: AsyncSession, email: str, otp: str, full_name: str | None = None) -> tuple[str, AuthUser]:
    normalized_email = normalize_email(email)
    if not verify_stored_otp(normalized_email, otp):
        raise ValueError("Invalid or expired OTP")

    result = await session.execute(select(User).where(User.email == normalized_email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(email=normalized_email, full_name=full_name)
        session.add(user)
    elif full_name and not user.full_name:
        user.full_name = full_name

    await session.commit()
    await session.refresh(user)
    clear_stored_otp(normalized_email)
    token = create_access_token(str(user.id))
    return token, AuthUser(id=str(user.id), email=user.email, full_name=user.full_name)