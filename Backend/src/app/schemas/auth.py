from pydantic import BaseModel, EmailStr, Field


class OTPRequest(BaseModel):
    email: EmailStr
    full_name: str | None = Field(default=None, max_length=255)


class OTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    full_name: str | None = Field(default=None, max_length=255)


class AuthUser(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    user: AuthUser
