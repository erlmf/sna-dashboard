"""
graph_loader.py
Loads precomputed graph_data.json (from 02_SNA_Analysis.ipynb) into PostgreSQL.
Run this once after running the notebooks, or on each data refresh.

Usage:
    python -m app.services.graph_loader
"""
import json
import asyncio
import logging
from pathlib import Path
from sqlalchemy import delete

from app.core.database import AsyncSessionLocal, init_db
from app.core.config import settings
from app.models.db_models import UserNode, NetworkEdge, Community, NetworkMeta

logger = logging.getLogger(__name__)


async def load_graph_to_db(json_path: str = None) -> dict:
    """Load graph_data.json produced by the SNA notebook into PostgreSQL."""
    path = Path(json_path or settings.GRAPH_DATA_PATH)

    if not path.exists():
        raise FileNotFoundError(
            f"graph_data.json not found at {path}.\n"
            "Run notebooks/02_SNA_Analysis.ipynb first to generate it."
        )

    logger.info(f"Loading graph data from {path}...")
    with open(path) as f:
        data = json.load(f)

    metadata = data.get("metadata", {})
    nodes    = data.get("nodes", [])
    edges    = data.get("edges", [])
    communities = data.get("communities", [])

    async with AsyncSessionLocal() as session:
        # Clear existing data
        await session.execute(delete(NetworkEdge))
        await session.execute(delete(Community))
        await session.execute(delete(UserNode))
        await session.execute(delete(NetworkMeta))

        # Insert nodes
        for n in nodes:
            session.add(UserNode(
                username=n["id"],
                influence_score=n.get("influence_score", 0),
                influence_percentile=n.get("influence_percentile", 0),
                tier=n.get("tier", 5),
                tier_label=n.get("tier_label", "Regular User"),
                community_id=n.get("community_id"),
                pagerank=n.get("pagerank", 0),
                betweenness=n.get("betweenness", 0),
                in_degree=n.get("in_degree", 0),
                out_degree=n.get("out_degree", 0),
                total_degree=n.get("degree", 0),
                post_count=n.get("post_count", 0),
                total_interaction=n.get("total_interaction", 0),
                avg_interaction=n.get("avg_interaction", 0),
            ))

        # Insert edges (in chunks for performance)
        chunk_size = 1000
        for i in range(0, len(edges), chunk_size):
            chunk = edges[i:i + chunk_size]
            for e in chunk:
                session.add(NetworkEdge(
                    source=e["source"],
                    target=e["target"],
                    weight=e.get("weight", 1.0),
                    edge_type=e.get("edge_type", "unknown"),
                ))

        # Insert communities
        for c in communities:
            session.add(Community(
                community_id=c.get("community_id", 0),
                size=c.get("size", 0),
                top_influencer=c.get("top_influencer"),
                top_influence_score=c.get("top_influence_score", 0),
                avg_influence_score=c.get("avg_influence_score", 0),
                avg_total_interaction=c.get("avg_total_interaction", 0),
                dominant_sentiment=c.get("dominant_sentiment"),
                dominant_keyword=c.get("dominant_keyword"),
                total_posts=c.get("total_posts", 0),
            ))

        # Insert metadata snapshot
        session.add(NetworkMeta(
            total_nodes=metadata.get("total_nodes", 0),
            total_edges=metadata.get("total_edges", 0),
            density=metadata.get("density", 0),
            modularity=metadata.get("modularity", 0),
            n_communities=metadata.get("n_communities", 0),
            is_latest=True,
        ))

        await session.commit()

    summary = {
        "nodes_loaded": len(nodes),
        "edges_loaded": len(edges),
        "communities_loaded": len(communities),
        **metadata
    }
    logger.info(f"Graph loaded ✅: {summary}")
    return summary


if __name__ == "__main__":
    async def main():
        await init_db()
        result = await load_graph_to_db()
        print(result)

    asyncio.run(main())
