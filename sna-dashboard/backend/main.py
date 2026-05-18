import json
import os
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SNA Instagram API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load 3 graph JSONs once at startup ───────────────────────────────────────
DATA_PATH = Path(__file__).parent / "data"

graph_data_all: dict = {}   # key: 'comment' | 'mention' | 'combined'
nodes_by_username: dict = {}
communities_by_id: dict = {}

@app.on_event("startup")
def load_data():
    global graph_data_all, nodes_by_username, communities_by_id

    for label in ['comment', 'mention', 'combined']:
        path = DATA_PATH / f"graph_data_{label}.json"
        if path.exists():
            with open(path, "r") as f:
                graph_data_all[label] = json.load(f)
            n = len(graph_data_all[label].get('nodes', []))
            e = len(graph_data_all[label].get('edges', []))
            print(f"✅ Loaded '{label}': {n} nodes, {e} edges")
        else:
            print(f"⚠️  graph_data_{label}.json tidak ditemukan")

    # Fallback jika tidak ada satupun file → mock
    if not graph_data_all:
        print("⚠️  Tidak ada graph_data_*.json — pakai mock data")
        mock = _mock_data()
        graph_data_all['comment']  = mock
        graph_data_all['mention']  = mock
        graph_data_all['combined'] = mock

    # Lookup index dari combined (atau yang tersedia)
    default = graph_data_all.get('combined') or next(iter(graph_data_all.values()))
    nodes_by_username = {n["username"]: n for n in default.get("nodes", [])}
    communities_by_id = {c["community_id"]: c for c in default.get("communities", [])}


# ── Helper ────────────────────────────────────────────────────────────────────
def get_data(graph_type: str) -> dict:
    """Ambil graph data berdasarkan type, fallback ke combined."""
    return (
        graph_data_all.get(graph_type)
        or graph_data_all.get('combined')
        or next(iter(graph_data_all.values()), {})
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/metadata")
def get_metadata(
    graph_type: str = Query("combined", description="comment | mention | combined"),
):
    return get_data(graph_type).get("metadata", {})


@app.get("/api/graph")
def get_graph(
    graph_type:    str           = Query("combined", description="comment | mention | combined"),
    tier:          Optional[int] = Query(None,  description="Filter nodes by tier (1-5)"),
    keyword:       Optional[str] = Query(None,  description="Filter nodes by active keyword"),
    community_id:  Optional[int] = Query(None,  description="Filter by community"),
    limit_edges:   int           = Query(2000,  description="Max edges to return"),
    min_weight:    float         = Query(0.0,   description="Minimum edge weight"),
    hide_isolated: bool          = Query(False, description="Hide nodes without edges"),
):
    data  = get_data(graph_type)
    nodes = list(data.get("nodes", []))
    edges = list(data.get("edges", []))

    # Filter nodes
    if tier is not None:
        nodes = [n for n in nodes if n.get("tier") == tier]
    if keyword:
        kw_lower = keyword.lower()
        nodes = [
            n for n in nodes
            if any(kw_lower in k.lower() for k in n.get("active_keywords", []))
        ]
    if community_id is not None:
        nodes = [n for n in nodes if n.get("community_id") == community_id]

    # Keep only edges between filtered nodes
    node_ids = {n["id"] for n in nodes}
    edges = [
        e for e in edges
        if e["source"] in node_ids
        and e["target"] in node_ids
        and e.get("weight", 1) >= min_weight
    ]

    # Sort edges by weight desc, limit
    edges = sorted(edges, key=lambda e: e.get("weight", 0), reverse=True)[:limit_edges]

    if hide_isolated:
        connected_ids = set()
        for e in edges:
            connected_ids.add(e["source"])
            connected_ids.add(e["target"])
        nodes = [n for n in nodes if n["id"] in connected_ids]

    return {"nodes": nodes, "edges": edges}


@app.get("/api/influencers")
def get_influencers(
    graph_type:   str           = Query("combined", description="comment | mention | combined"),
    tier:         Optional[int] = Query(None),
    keyword:      Optional[str] = Query(None),
    community_id: Optional[int] = Query(None),
    sort_by:      str           = Query("influence_score"),
    limit:        int           = Query(100),
    offset:       int           = Query(0),
):
    data  = get_data(graph_type)
    nodes = list(data.get("nodes", []))

    if tier is not None:
        nodes = [n for n in nodes if n.get("tier") == tier]
    if keyword:
        kw_lower = keyword.lower()
        nodes = [
            n for n in nodes
            if any(kw_lower in k.lower() for k in n.get("active_keywords", []))
        ]
    if community_id is not None:
        nodes = [n for n in nodes if n.get("community_id") == community_id]

    nodes = sorted(nodes, key=lambda n: n.get(sort_by, 0) or 0, reverse=True)
    total = len(nodes)
    nodes = nodes[offset: offset + limit]

    return {"total": total, "offset": offset, "limit": limit, "data": nodes}


@app.get("/api/communities")
def get_communities(
    graph_type: str = Query("combined", description="comment | mention | combined"),
    min_size:   int = Query(1),
    sort_by:    str = Query("size"),
):
    data        = get_data(graph_type)
    communities = list(data.get("communities", []))
    communities = [c for c in communities if c.get("size", 0) >= min_size]
    communities = sorted(communities, key=lambda c: c.get(sort_by, 0) or 0, reverse=True)
    return {"total": len(communities), "data": communities}


@app.get("/api/node/{username}")
def get_node(
    username:   str,
    graph_type: str = Query("combined", description="comment | mention | combined"),
):
    data = get_data(graph_type)
    node = next((n for n in data.get("nodes", []) if n["username"] == username), None)

    if not node:
        raise HTTPException(status_code=404, detail=f"Node '{username}' not found")

    edges    = data.get("edges", [])
    incoming = sorted([e for e in edges if e["target"] == username],
                      key=lambda e: e.get("weight", 0), reverse=True)[:20]
    outgoing = sorted([e for e in edges if e["source"] == username],
                      key=lambda e: e.get("weight", 0), reverse=True)[:20]

    comm_id   = node.get("community_id")
    community = communities_by_id.get(comm_id, {}) if comm_id is not None else {}

    return {"node": node, "incoming_edges": incoming, "outgoing_edges": outgoing, "community": community}


@app.get("/api/stats/tier-distribution")
def get_tier_distribution(
    graph_type: str = Query("combined", description="comment | mention | combined"),
):
    data  = get_data(graph_type)
    nodes = data.get("nodes", [])
    tier_labels = {
        1: "Mega Influencer", 2: "Macro Influencer", 3: "Mid Influencer",
        4: "Micro Influencer", 5: "Regular User",
    }
    dist = {}
    for n in nodes:
        label = tier_labels.get(n.get("tier", 5), "Unknown")
        dist[label] = dist.get(label, 0) + 1
    return [
        {"tier": t, "tier_id": tid, "count": dist.get(t, 0)}
        for tid, t in tier_labels.items()
    ]


@app.get("/api/stats/top-keywords")
def get_top_keywords(
    graph_type: str = Query("combined", description="comment | mention | combined"),
    limit:      int = Query(20),
):
    from collections import Counter
    data    = get_data(graph_type)
    counter = Counter()
    for n in data.get("nodes", []):
        for kw in n.get("active_keywords", []):
            counter[kw] += 1
    return [{"keyword": kw, "count": cnt} for kw, cnt in counter.most_common(limit)]


@app.get("/api/graph-types")
def get_graph_types():
    return {
        "available": list(graph_data_all.keys()),
        "options": [
            {"value": "comment",  "label": "💬 Comment",  "description": "Engagement via komentar"},
            {"value": "mention",  "label": "📢 Mention",  "description": "Discourse via mention"},
            {"value": "combined", "label": "🔗 Combined", "description": "Overall influence"},
        ]
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "graph_types_loaded": list(graph_data_all.keys()),
        "nodes": {k: len(v.get("nodes", [])) for k, v in graph_data_all.items()},
        "edges": {k: len(v.get("edges", [])) for k, v in graph_data_all.items()},
    }


# ── Mock data ─────────────────────────────────────────────────────────────────
def _mock_data():
    import random
    random.seed(42)
    keywords   = ["TransisiEnergi", "EnergiTerbarukan", "SolarPanel", "PLN", "Pertamina",
                  "Listrik", "GreenEnergy", "Lingkungan", "Investasi", "Subsidi"]
    tier_labels = {1: "Mega Influencer", 2: "Macro Influencer", 3: "Mid Influencer",
                   4: "Micro Influencer", 5: "Regular User"}
    nodes = []
    for i in range(200):
        tier = 1 if i < 2 else (2 if i < 10 else (3 if i < 40 else (4 if i < 100 else 5)))
        nodes.append({
            "id": f"user_{i}", "username": f"user_{i}",
            "influence_score": round(random.uniform(0, 1) * (1 / tier), 6),
            "tier": tier, "tier_label": tier_labels[tier],
            "pagerank": round(random.uniform(0, 0.1), 8),
            "betweenness": round(random.uniform(0, 0.5), 8),
            "in_degree": random.randint(0, 50), "out_degree": random.randint(0, 30),
            "total_degree": random.randint(0, 80), "post_count": random.randint(0, 500),
            "total_comments_recv": random.randint(0, 2000),
            "total_interaction": random.randint(0, 100000),
            "avg_interaction": round(random.uniform(0, 5000), 2),
            "total_post_like": random.randint(0, 500000),
            "community_id": random.randint(0, 9),
            "active_keywords": random.sample(keywords, k=random.randint(1, 4)),
        })
    edges = []
    for _ in range(500):
        s, t = random.randint(0, 199), random.randint(0, 199)
        if s != t:
            edges.append({"source": f"user_{s}", "target": f"user_{t}",
                          "weight": round(random.uniform(1, 10), 2),
                          "edge_type": random.choice(["comment", "comment+mention"])})
    communities = []
    for c in range(10):
        comm_nodes = [n for n in nodes if n["community_id"] == c]
        communities.append({
            "community_id": c, "size": len(comm_nodes),
            "top_influencer": comm_nodes[0]["username"] if comm_nodes else "",
            "top_broker": comm_nodes[-1]["username"] if comm_nodes else "",
            "dominant_keyword": random.choice(keywords),
            "keyword_diversity": random.randint(3, 8),
            "top_keywords": json.dumps(random.sample(keywords, 3)),
            "tier1_count": random.randint(0, 2), "tier2_count": random.randint(0, 4),
            "total_posts": random.randint(10, 500),
            "avg_comments_recv": round(random.uniform(10, 200), 2),
            "dominant_sentiment": random.choice(["positive", "negative", "neutral"]),
        })
    return {
        "metadata": {
            "total_nodes": len(nodes), "total_edges": len(edges),
            "density": 0.025, "modularity": 0.42, "n_communities": 10,
            "lcc_ratio": 0.87, "edge_architecture": "comment-on-post (PRIMARY) + mention (LAYER 2)",
            "edge_type_counts": {"comment": 400, "comment+mention": 80, "mention": 20},
        },
        "nodes": nodes, "edges": edges, "communities": communities, "whitespace": {},
    }
