from pydantic import BaseModel, EmailStr, Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)


class OrganizationMemberCreate(BaseModel):
    email: EmailStr
    role: str = Field(pattern="^(owner|member)$")


class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    created_by_id: str