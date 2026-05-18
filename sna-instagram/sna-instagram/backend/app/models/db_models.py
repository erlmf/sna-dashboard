from sqlalchemy import Column, String, Float, Integer, DateTime, JSON, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime


class UserNode(Base):
    """Represents a user/node in the network."""
    __tablename__ = "user_nodes"

    username          = Column(String, primary_key=True, index=True)
    influence_score   = Column(Float, default=0.0)
    influence_percentile = Column(Float, default=0.0)
    tier              = Column(Integer, default=5)
    tier_label        = Column(String, default="Regular User")
    community_id      = Column(Integer, nullable=True)
    pagerank          = Column(Float, default=0.0)
    betweenness       = Column(Float, default=0.0)
    closeness         = Column(Float, default=0.0)
    eigenvector       = Column(Float, default=0.0)
    in_degree         = Column(Integer, default=0)
    out_degree        = Column(Integer, default=0)
    total_degree      = Column(Integer, default=0)
    post_count        = Column(Integer, default=0)
    total_interaction = Column(Float, default=0.0)
    avg_interaction   = Column(Float, default=0.0)
    updated_at        = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NetworkEdge(Base):
    """Represents a directed edge between two users."""
    __tablename__ = "network_edges"

    id        = Column(Integer, primary_key=True, autoincrement=True)
    source    = Column(String, ForeignKey("user_nodes.username"), index=True)
    target    = Column(String, ForeignKey("user_nodes.username"), index=True)
    weight    = Column(Float, default=1.0)
    edge_type = Column(String, default="co_keyword")


class Community(Base):
    """Detected community cluster."""
    __tablename__ = "communities"

    community_id          = Column(Integer, primary_key=True)
    size                  = Column(Integer, default=0)
    top_influencer        = Column(String, nullable=True)
    top_influence_score   = Column(Float, default=0.0)
    avg_influence_score   = Column(Float, default=0.0)
    avg_total_interaction = Column(Float, default=0.0)
    dominant_sentiment    = Column(String, nullable=True)
    dominant_keyword      = Column(String, nullable=True)
    total_posts           = Column(Integer, default=0)


class NetworkMeta(Base):
    """Overall network metadata/stats snapshot."""
    __tablename__ = "network_meta"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    total_nodes   = Column(Integer)
    total_edges   = Column(Integer)
    density       = Column(Float)
    modularity    = Column(Float)
    n_communities = Column(Integer)
    computed_at   = Column(DateTime, default=datetime.utcnow)
    is_latest     = Column(Boolean, default=True)
