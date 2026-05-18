from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import pandas as pd
import json
from pathlib import Path

from app.core.database import get_db
from app.core.config import settings
from app.models.db_models import UserNode, Community, NetworkMeta

router = APIRouter()


@router.get("/whitespace")
async def get_whitespace():
    """
    White Space Analysis: topics/keywords with high potential but low influencer coverage.
    Loaded from precomputed JSON output of notebook.
    """
    path = Path(settings.GRAPH_DATA_PATH)
    if not path.exists():
        return {"error": "Run notebooks first to generate graph_data.json"}

    with open(path) as f:
        data = json.load(f)

    whitespace = data.get("whitespace", {})
    return whitespace


@router.get("/overview")
async def get_overview(db: AsyncSession = Depends(get_db)):
    """Dashboard overview: network stats + tier distribution + top communities."""
    # Meta
    meta_result = await db.execute(
        select(NetworkMeta).where(NetworkMeta.is_latest == True)
        .order_by(NetworkMeta.computed_at.desc()).limit(1)
    )
    meta = meta_result.scalar_one_or_none()

    # Tier breakdown
    tier_result = await db.execute(
        select(UserNode.tier, UserNode.tier_label, func.count().label("count"))
        .group_by(UserNode.tier, UserNode.tier_label)
        .order_by(UserNode.tier)
    )
    tiers = [{"tier": r.tier, "tier_label": r.tier_label, "count": r.count}
             for r in tier_result.all()]

    # Top 5 communities
    comm_result = await db.execute(
        select(Community).order_by(Community.size.desc()).limit(5)
    )
    top_communities = [
        {"community_id": c.community_id, "size": c.size,
         "dominant_keyword": c.dominant_keyword,
         "top_influencer": c.top_influencer}
        for c in comm_result.scalars().all()
    ]

    return {
        "network": {
            "total_nodes": meta.total_nodes if meta else 0,
            "total_edges": meta.total_edges if meta else 0,
            "density": meta.density if meta else 0,
            "modularity": meta.modularity if meta else 0,
            "n_communities": meta.n_communities if meta else 0,
        },
        "tier_distribution": tiers,
        "top_communities": top_communities,
    }


@router.get("/sentiment-by-community")
async def sentiment_by_community(db: AsyncSession = Depends(get_db)):
    """Sentiment breakdown per community (from community profiles)."""
    result = await db.execute(
        select(Community).order_by(Community.size.desc())
    )
    communities = result.scalars().all()
    return [
        {
            "community_id": c.community_id,
            "dominant_sentiment": c.dominant_sentiment,
            "dominant_keyword": c.dominant_keyword,
            "size": c.size,
        }
        for c in communities
    ]
