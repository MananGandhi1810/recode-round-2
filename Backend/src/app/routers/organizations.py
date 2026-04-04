from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg

from app.core.database import get_db
from app.dependencies import get_current_user
from app.schemas.auth import AuthUser
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
    conn: asyncpg.Connection = Depends(get_db), user: AuthUser = Depends(get_current_user)
) -> list[OrganizationResponse]:
    rows = await conn.fetch("""
        SELECT o.id, o.name, o.slug, o.created_by_id
        FROM organizations o
        JOIN organization_members om ON o.id = om.organization_id
        WHERE om.user_id = $1::uuid
        ORDER BY o.name ASC
    """, user.id)
    
    return [
        OrganizationResponse(
            id=str(row["id"]),
            name=row["name"],
            slug=row["slug"],
            created_by_id=str(row["created_by_id"]),
        )
        for row in rows
    ]

@router.post("", response_model=OrganizationResponse)
async def create_org(
    payload: OrganizationCreate,
    conn: asyncpg.Connection = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> OrganizationResponse:
    return await create_organization(conn, user, payload.name)

@router.post("/{organization_id}/members")
async def add_org_member(
    organization_id: str,
    payload: OrganizationMemberCreate,
    conn: asyncpg.Connection = Depends(get_db),
    user: AuthUser = Depends(get_current_user),
) -> dict[str, str]:
    try:
        await require_owner(conn, organization_id, str(user.id))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)
        ) from exc

    return await add_member(conn, organization_id, payload.email, payload.role)
