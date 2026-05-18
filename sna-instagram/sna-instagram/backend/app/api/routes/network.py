from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import json

from app.core.database import get_db
from app.core.config import settings
from app.models.db_models import UserNode, NetworkEdge, NetworkMeta
from app.models.schemas import NetworkGraphSchema, NetworkMetaSchema

router = APIRouter()


@router.get("/meta", response_model=NetworkMetaSchema)
async def get_network_meta(db: AsyncSession = Depends(get_db)):
    """Overall network statistics."""
    result = await db.execute(
        select(NetworkMeta).where(NetworkMeta.is_latest == True).order_by(NetworkMeta.computed_at.desc()).limit(1)
    )
    meta = result.scalar_one_or_none()
    if not meta:
        return {"total_nodes": 0, "total_edges": 0, "density": 0, "modularity": 0, "n_communities": 0}
    return meta


@router.get("/graph")
async def get_graph(
    max_nodes: int = Query(300, description="Max nodes to return for visualization"),
    community_id: Optional[int] = Query(None, description="Filter by community"),
    min_tier: int = Query(1, ge=1, le=5, description="Minimum influencer tier (1=best)"),
    max_tier: int = Query(5, ge=1, le=5),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns node-link graph data for frontend visualization.
    Optimized: returns top nodes by influence score, and only their edges.
    """
    # Build node query
    query = select(UserNode).where(
        UserNode.tier.between(min_tier, max_tier)
    ).order_by(UserNode.influence_score.desc()).limit(max_nodes)

    if community_id is not None:
        query = query.where(UserNode.community_id == community_id)

    result = await db.execute(query)
    nodes = result.scalars().all()
    node_ids = {n.username for n in nodes}

    # Get edges between selected nodes only
    edge_result = await db.execute(
        select(NetworkEdge).where(
            NetworkEdge.source.in_(node_ids),
            NetworkEdge.target.in_(node_ids)
        )
    )
    edges = edge_result.scalars().all()

    return {
        "nodes": [
            {
                "id": n.username,
                "username": n.username,
                "influence_score": n.influence_score,
                "tier": n.tier,
                "tier_label": n.tier_label,
                "community_id": n.community_id,
                "pagerank": n.pagerank,
                "betweenness": n.betweenness,
                "degree": n.total_degree,
                "in_degree": n.in_degree,
                "out_degree": n.out_degree,
                "post_count": n.post_count,
                "total_interaction": n.total_interaction,
                "avg_interaction": n.avg_interaction,
            }
            for n in nodes
        ],
        "edges": [
            {
                "source": e.source,
                "target": e.target,
                "weight": e.weight,
                "edge_type": e.edge_type,
            }
            for e in edges
        ],
    }


@router.post("/reload")
async def reload_graph():
    """Reload graph data from JSON file (re-run after notebook update)."""
    from app.services.graph_loader import load_graph_to_db
    result = await load_graph_to_db()
    return {"status": "reloaded", **result}
