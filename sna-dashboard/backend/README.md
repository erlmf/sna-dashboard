# SNA Dashboard — Backend

## Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GRAPH_DATA_PATH` | `data/graph_data.json` | Path ke graph_data.json output dari notebook |

Contoh:
```bash
GRAPH_DATA_PATH=/path/to/graph_data.json uvicorn main:app --reload
```

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/metadata` | Network metadata (nodes, edges, modularity, dll) |
| GET | `/api/graph` | Nodes + edges untuk visualisasi (support filter) |
| GET | `/api/influencers` | Ranked influencer list dengan pagination |
| GET | `/api/communities` | Community profiles |
| GET | `/api/node/:username` | Detail satu node + edges |
| GET | `/api/stats/tier-distribution` | Distribusi tier untuk chart |
| GET | `/api/stats/top-keywords` | Top keywords untuk filter |
| GET | `/health` | Health check |

## Query Parameters `/api/graph`

- `tier` (int) — filter by tier 1-5
- `keyword` (str) — filter by active keyword
- `community_id` (int) — filter by community
- `limit_edges` (int, default 2000) — max edges returned
- `min_weight` (float, default 0) — minimum edge weight

## Dev Mode (tanpa graph_data.json)

Kalau `graph_data.json` tidak ditemukan, backend otomatis pakai mock data dengan 200 nodes dan 500 edges.
