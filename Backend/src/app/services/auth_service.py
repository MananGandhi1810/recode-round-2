import asyncpg

from app.core.security import create_access_token, normalize_email
from app.schemas.auth import AuthUser
from app.services.email_service import send_otp_email
from app.services.otp_service import (
    clear_stored_otp,
    create_and_store_otp,
    verify_stored_otp,
)


async def request_otp(email: str) -> None:
    otp = create_and_store_otp(email)
    send_otp_email(normalize_email(email), otp)


async def verify_otp(
    conn: asyncpg.Connection, email: str, otp: str, full_name: str | None = None
) -> tuple[str, AuthUser]:
    normalized_email = normalize_email(email)
    if not verify_stored_otp(normalized_email, otp):
        raise ValueError("Invalid or expired OTP")

    row = await conn.fetchrow(
        "SELECT id, email, full_name FROM users WHERE email = $1", normalized_email
    )

    if row is None:
        row = await conn.fetchrow(
            "INSERT INTO users (email, full_name) VALUES ($1, $2) RETURNING id, email, full_name",
            normalized_email,
            full_name,
        )
    elif full_name and not row["full_name"]:
        row = await conn.fetchrow(
            "UPDATE users SET full_name = $1 WHERE id = $2 RETURNING id, email, full_name",
            full_name,
            row["id"],
        )

    clear_stored_otp(normalized_email)
    token = create_access_token(str(row["id"]))
    return token, AuthUser(
        id=str(row["id"]), email=row["email"], full_name=row["full_name"]
    )
