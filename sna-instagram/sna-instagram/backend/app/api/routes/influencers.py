from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.models.db_models import UserNode

router = APIRouter()


@router.get("/")
async def get_influencers(
    tier: Optional[int] = Query(None, ge=1, le=5),
    community_id: Optional[int] = Query(None),
    limit: int = Query(50, le=500),
    offset: int = Query(0),
    sort_by: str = Query("influence_score", description="influence_score|pagerank|betweenness|total_interaction"),
    db: AsyncSession = Depends(get_db),
):
    """Get ranked influencer list with optional filters."""
    sort_col = {
        "influence_score": UserNode.influence_score,
        "pagerank": UserNode.pagerank,
        "betweenness": UserNode.betweenness,
        "total_interaction": UserNode.total_interaction,
    }.get(sort_by, UserNode.influence_score)

    query = select(UserNode).order_by(sort_col.desc()).limit(limit).offset(offset)

    if tier is not None:
        query = query.where(UserNode.tier == tier)
    if community_id is not None:
        query = query.where(UserNode.community_id == community_id)

    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "total": len(users),
        "offset": offset,
        "influencers": [
            {
                "rank": offset + i + 1,
                "username": u.username,
                "influence_score": round(u.influence_score, 6),
                "tier": u.tier,
                "tier_label": u.tier_label,
                "community_id": u.community_id,
                "pagerank": round(u.pagerank, 8),
                "betweenness": round(u.betweenness, 8),
                "in_degree": u.in_degree,
                "post_count": u.post_count,
                "total_interaction": u.total_interaction,
                "avg_interaction": round(u.avg_interaction, 2),
            }
            for i, u in enumerate(users)
        ]
    }


@router.get("/tiers/summary")
async def get_tier_summary(db: AsyncSession = Depends(get_db)):
    """Count of users per influencer tier."""
    from sqlalchemy import func
    result = await db.execute(
        select(UserNode.tier, UserNode.tier_label, func.count().label("count"))
        .group_by(UserNode.tier, UserNode.tier_label)
        .order_by(UserNode.tier)
    )
    rows = result.all()
    return [{"tier": r.tier, "tier_label": r.tier_label, "count": r.count} for r in rows]


@router.get("/{username}")
async def get_influencer_detail(username: str, db: AsyncSession = Depends(get_db)):
    """Detailed profile of a single user."""
    result = await db.execute(select(UserNode).where(UserNode.username == username))
    user = result.scalar_one_or_none()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"User @{username} not found")

    return {
        "username": user.username,
        "influence_score": user.influence_score,
        "tier": user.tier,
        "tier_label": user.tier_label,
        "community_id": user.community_id,
        "centrality": {
            "pagerank": user.pagerank,
            "betweenness": user.betweenness,
            "closeness": user.closeness,
            "eigenvector": user.eigenvector,
            "in_degree": user.in_degree,
            "out_degree": user.out_degree,
            "total_degree": user.total_degree,
        },
        "engagement": {
            "post_count": user.post_count,
            "total_interaction": user.total_interaction,
            "avg_interaction": user.avg_interaction,
        }
    }
