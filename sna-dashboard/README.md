# SNA Dashboard — Instagram Social Network Analysis

Full-stack web dashboard untuk visualisasi Social Network Analysis Instagram.

```
sna-dashboard/
├── backend/          FastAPI — REST API + data loader
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
└── frontend/         React + Vite + Tailwind
    ├── src/
    │   ├── App.jsx
    │   ├── lib/api.js
    │   ├── hooks/useApi.js
    │   └── components/
    │       ├── NetworkGraph.jsx     react-force-graph-2d
    │       ├── NodeDetailPanel.jsx  klik node → detail
    │       ├── InfluencerTable.jsx  ranked list + filter
    │       ├── CommunityPanel.jsx   community cards
    │       ├── StatsCharts.jsx      recharts
    │       ├── FilterBar.jsx
    │       └── ui.jsx               shared components
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

---

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt

# Arahkan ke graph_data.json dari notebook
GRAPH_DATA_PATH=/path/to/data/graph_data.json uvicorn main:app --reload --port 8000
```

Kalau `graph_data.json` belum ada, backend otomatis pakai **mock data** (200 nodes, 500 edges) supaya frontend tetap bisa jalan.

API docs tersedia di: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Buka: http://localhost:5173

---

## Koneksi ke graph_data.json

Output notebook kamu (`graph_data.json`) harus punya struktur:

```json
{
  "metadata": { "total_nodes": 0, "total_edges": 0, "modularity": 0, ... },
  "nodes": [
    {
      "id": "username",
      "username": "username",
      "influence_score": 0.0,
      "tier": 1,
      "tier_label": "Mega Influencer",
      "pagerank": 0.0,
      "betweenness": 0.0,
      "in_degree": 0,
      "out_degree": 0,
      "total_comments_recv": 0,
      "community_id": 0,
      "active_keywords": ["keyword1", "keyword2"]
    }
  ],
  "edges": [
    { "source": "user_a", "target": "user_b", "weight": 3.0, "edge_type": "comment" }
  ],
  "communities": [
    {
      "community_id": 0,
      "size": 50,
      "top_influencer": "username",
      "top_broker": "username",
      "dominant_keyword": "keyword",
      "dominant_sentiment": "positive",
      "tier1_count": 1,
      "tier2_count": 3,
      "top_keywords": "[\"kw1\", \"kw2\"]"
    }
  ]
}
```

---

## Features

| Feature | Description |
|---|---|
| **Network Graph** | react-force-graph-2d, node warna per community, size per tier |
| **Filter** | Filter graph by tier, keyword, community |
| **Node Detail** | Klik node → panel dengan semua centrality metrics, edges in/out, keywords |
| **Influencer Table** | Ranked list, sortable, filterable, paginated |
| **Community Cards** | Per-community stats: top influencer, broker, keywords, sentiment |
| **Stats Charts** | Tier distribution bar chart, top keywords horizontal bar (recharts) |
| **Mock Data** | Dev mode tanpa graph_data.json |

---

## Tech Stack

- **Backend**: FastAPI, Python
- **Frontend**: React 18, Vite, Tailwind CSS
- **Visualization**: react-force-graph-2d (wrapper D3)
- **Charts**: Recharts
- **Fonts**: Syne (display), DM Sans (body), JetBrains Mono (mono)

---

## Environment Variables (Backend)

| Variable | Default | Description |
|---|---|---|
| `GRAPH_DATA_PATH` | `../data/processed/graph_data.json` | Path ke output notebook |

---

## Build for Production

```bash
# Frontend
cd frontend
npm run build          # output: frontend/dist/

# Backend dengan static files
# Serve frontend/dist/ via nginx atau tambahkan StaticFiles di main.py
```
