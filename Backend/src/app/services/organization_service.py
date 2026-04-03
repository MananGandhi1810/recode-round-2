import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization, OrganizationMember
from app.models.user import User


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "organization"


async def create_organization(
    session: AsyncSession, user: User, name: str
) -> Organization:
    base_slug = slugify(name)
    slug = base_slug
    suffix = 1

    while True:
        result = await session.execute(
            select(Organization).where(Organization.slug == slug)
        )
        if result.scalar_one_or_none() is None:
            break
        suffix += 1
        slug = f"{base_slug}-{suffix}"

    organization = Organization(name=name, slug=slug, created_by_id=user.id)
    session.add(organization)
    await session.flush()
    session.add(
        OrganizationMember(
            organization_id=organization.id, user_id=user.id, role="owner"
        )
    )
    await session.commit()
    await session.refresh(organization)
    return organization


async def require_owner(
    session: AsyncSession, organization_id: str, user_id: str
) -> Organization:
    result = await session.execute(
        select(Organization, OrganizationMember)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(
            Organization.id == organization_id, OrganizationMember.user_id == user_id
        )
    )
    row = result.first()
    if row is None:
        raise ValueError("Organization not found or access denied")

    organization, member = row
    if member.role != "owner":
        raise ValueError("Owner role required")
    return organization


async def add_member(
    session: AsyncSession, organization: Organization, user: User, role: str
) -> OrganizationMember:
    result = await session.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == organization.id,
            OrganizationMember.user_id == user.id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        member = OrganizationMember(
            organization_id=organization.id, user_id=user.id, role=role
        )
        session.add(member)
    else:
        member.role = role

    await session.commit()
    await session.refresh(member)
    return member
