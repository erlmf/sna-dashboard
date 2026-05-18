from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.db_models import Community, UserNode

router = APIRouter()


@router.get("/")
async def get_communities(
    limit: int = Query(50, le=200),
    sort_by: str = Query("size"),
    db: AsyncSession = Depends(get_db),
):
    """List all detected communities."""
    sort_col = {
        "size": Community.size,
        "avg_interaction": Community.avg_total_interaction,
        "avg_influence": Community.avg_influence_score,
    }.get(sort_by, Community.size)

    result = await db.execute(
        select(Community).order_by(sort_col.desc()).limit(limit)
    )
    communities = result.scalars().all()

    return [
        {
            "community_id": c.community_id,
            "size": c.size,
            "top_influencer": c.top_influencer,
            "top_influence_score": c.top_influence_score,
            "avg_influence_score": c.avg_influence_score,
            "avg_total_interaction": c.avg_total_interaction,
            "dominant_sentiment": c.dominant_sentiment,
            "dominant_keyword": c.dominant_keyword,
            "total_posts": c.total_posts,
        }
        for c in communities
    ]


@router.get("/{community_id}/members")
async def get_community_members(
    community_id: int,
    limit: int = Query(50),
    db: AsyncSession = Depends(get_db),
):
    """Get members of a specific community, ranked by influence."""
    result = await db.execute(
        select(UserNode)
        .where(UserNode.community_id == community_id)
        .order_by(UserNode.influence_score.desc())
        .limit(limit)
    )
    members = result.scalars().all()
    return [
        {
            "username": m.username,
            "influence_score": m.influence_score,
            "tier_label": m.tier_label,
            "in_degree": m.in_degree,
            "total_interaction": m.total_interaction,
        }
        for m in members
    ]
