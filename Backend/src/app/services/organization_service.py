import re
import asyncpg
from fastapi import HTTPException, status
from app.schemas.auth import AuthUser
from app.schemas.organization import OrganizationResponse

def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "organization"

async def create_organization(
    conn: asyncpg.Connection, user: AuthUser, name: str
) -> OrganizationResponse:
    base_slug = slugify(name)
    slug = base_slug
    suffix = 1

    while True:
        row = await conn.fetchrow("SELECT id FROM organizations WHERE slug = $1", slug)
        if row is None:
            break
        slug = f"{base_slug}-{suffix}"
        suffix += 1

    async with conn.transaction():
        org_row = await conn.fetchrow(
            "INSERT INTO organizations (name, slug, created_by_id) VALUES ($1, $2, $3::uuid) RETURNING id, name, slug, created_by_id",
            name, slug, user.id
        )
        await conn.execute(
            "INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2::uuid, 'owner')",
            org_row["id"], user.id
        )

    return OrganizationResponse(
        id=str(org_row["id"]),
        name=org_row["name"],
        slug=org_row["slug"],
        created_by_id=str(org_row["created_by_id"])
    )

async def require_owner(
    conn: asyncpg.Connection, organization_id: str, user_id: str
):
    row = await conn.fetchrow("""
        SELECT o.id, om.role
        FROM organizations o
        JOIN organization_members om ON o.id = om.organization_id
        WHERE o.id = $1::uuid AND om.user_id = $2::uuid
    """, organization_id, user_id)

    if row is None:
        raise ValueError("Organization not found or access denied")

    if row["role"] != "owner":
        raise ValueError("Owner role required")
    return row["id"]

async def add_member(
    conn: asyncpg.Connection, organization_id: str, user_email: str, role: str
) -> dict:
    user_row = await conn.fetchrow("SELECT id FROM users WHERE email = $1", user_email.strip().lower())
    if not user_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    user_id = user_row["id"]
    
    member_row = await conn.fetchrow(
        "SELECT id FROM organization_members WHERE organization_id = $1::uuid AND user_id = $2",
        organization_id, user_id
    )
    
    if member_row is None:
        member_row = await conn.fetchrow(
            "INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1::uuid, $2, $3) RETURNING id, role",
            organization_id, user_id, role
        )
    else:
        member_row = await conn.fetchrow(
            "UPDATE organization_members SET role = $1 WHERE id = $2 RETURNING id, role",
            role, member_row["id"]
        )

    return {"id": str(member_row["id"]), "role": member_row["role"]}
