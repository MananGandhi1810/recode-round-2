from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import AuthResponse, AuthUser, OTPRequest, OTPVerify
from app.services.auth_service import request_otp, verify_otp

router = APIRouter()


@router.post("/request-otp")
async def request_sign_in_code(payload: OTPRequest) -> dict[str, str]:
    try:
        await request_otp(payload.email)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)
        ) from exc

    return {"message": "OTP sent"}


@router.post("/verify-otp", response_model=AuthResponse)
async def verify_sign_in_code(
    payload: OTPVerify,
    response: Response,
    session: AsyncSession = Depends(get_db),
) -> AuthResponse:
    try:
        token, user = await verify_otp(
            session, payload.email, payload.otp, payload.full_name
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc

    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.environment.lower() != "development",
        max_age=60 * 60,
        path="/",
    )
    return AuthResponse(access_token=token, user=user)


@router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie("access_token", path="/")
    return {"message": "Signed out"}


@router.get("/me", response_model=AuthUser)
async def me(current_user: User = Depends(get_current_user)) -> AuthUser:
    return AuthUser(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
    )
