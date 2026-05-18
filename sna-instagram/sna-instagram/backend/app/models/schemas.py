from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class NodeSchema(BaseModel):
    id: str
    username: str
    influence_score: float
    tier: int
    tier_label: str
    community_id: Optional[int]
    pagerank: float
    betweenness: float
    degree: int
    in_degree: int
    out_degree: int
    post_count: int
    total_interaction: float
    avg_interaction: float

    class Config:
        from_attributes = True


class EdgeSchema(BaseModel):
    source: str
    target: str
    weight: float
    edge_type: str


class NetworkGraphSchema(BaseModel):
    metadata: Dict[str, Any]
    nodes: List[NodeSchema]
    edges: List[EdgeSchema]


class CommunitySchema(BaseModel):
    community_id: int
    size: int
    top_influencer: Optional[str]
    top_influence_score: float
    avg_influence_score: float
    avg_total_interaction: float
    dominant_sentiment: Optional[str]
    dominant_keyword: Optional[str]
    total_posts: int

    class Config:
        from_attributes = True


class InfluencerSchema(BaseModel):
    username: str
    influence_score: float
    influence_percentile: float
    tier: int
    tier_label: str
    community_id: Optional[int]
    pagerank: float
    betweenness: float
    in_degree: int
    post_count: int
    total_interaction: float
    avg_interaction: float

    class Config:
        from_attributes = True


class NetworkMetaSchema(BaseModel):
    total_nodes: int
    total_edges: int
    density: float
    modularity: float
    n_communities: int
