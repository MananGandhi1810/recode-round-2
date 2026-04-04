from fastapi import Cookie, Depends, HTTPException, Request, status
import asyncpg

from app.core.database import get_db
from app.core.security import decode_token
from app.schemas.auth import AuthUser


async def get_current_user(
    request: Request,
    conn: asyncpg.Connection = Depends(get_db),
    access_token: str | None = Cookie(default=None),
) -> AuthUser:
    token = (
        access_token
        or request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    )
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    try:
        payload = decode_token(token)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session"
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token"
        )

    row = await conn.fetchrow(
        "SELECT id, email, full_name FROM users WHERE id = $1::uuid", user_id
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return AuthUser(id=str(row["id"]), email=row["email"], full_name=row["full_name"])
