from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.organization import Organization, OrganizationMember
from app.models.user import User
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationMemberCreate,
    OrganizationResponse,
)
from app.services.organization_service import (
    add_member,
    create_organization,
    require_owner,
)

router = APIRouter()


@router.get("", response_model=list[OrganizationResponse])
async def list_organizations(
    session: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)
) -> list[OrganizationResponse]:
    result = await session.execute(
        select(Organization)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(OrganizationMember.user_id == user.id)
        .order_by(Organization.name.asc())
    )
    organizations = result.scalars().all()
    return [
        OrganizationResponse(
            id=str(organization.id),
            name=organization.name,
            slug=organization.slug,
            created_by_id=str(organization.created_by_id),
        )
        for organization in organizations
    ]


@router.post("", response_model=OrganizationResponse)
async def create_org(
    payload: OrganizationCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OrganizationResponse:
    organization = await create_organization(session, user, payload.name)
    return OrganizationResponse(
        id=str(organization.id),
        name=organization.name,
        slug=organization.slug,
        created_by_id=str(organization.created_by_id),
    )


@router.post("/{organization_id}/members")
async def add_org_member(
    organization_id: str,
    payload: OrganizationMemberCreate,
    session: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, str]:
    try:
        organization = await require_owner(session, organization_id, str(user.id))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)
        ) from exc

    user_result = await session.execute(
        select(User).where(User.email == payload.email.strip().lower())
    )
    target_user = user_result.scalar_one_or_none()
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    member = await add_member(session, organization, target_user, payload.role)
    return {"id": str(member.id), "role": member.role}
