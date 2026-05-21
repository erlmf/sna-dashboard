# Social Network Analysis (SNA) Dashboard

A data pipeline and interactive dashboard for analyzing Instagram social networks. The project identifies key influencers, detects communities, and visualizes engagement patterns using graph-based centrality metrics.

---

## Project Overview

This project constructs a multi-layer directed social graph from Instagram interaction data (comments and mentions) to surface influential accounts, map community structures, and uncover engagement dynamics. The analysis combines graph theory, centrality computation, and Louvain community detection to rank users by influence tier and expose network topology through an interactive dashboard.

**Core capabilities:**
- **Influencer Analysis** — Tier-based ranking using a composite influence score derived from PageRank, betweenness, and in-degree centrality.
- **Community Detection** — Louvain algorithm partitions the network into topically coherent communities with modularity scoring.
- **Network Visualization** — Interactive graph explorer with filtering by tier, community, sentiment, and edge type.

---

## Installation & Setup

### Dependencies

```bash
pip install networkx python-louvain pyvis pandas numpy matplotlib seaborn scipy
```

| Package | Purpose |
|---|---|
| `networkx` | Graph construction and centrality computation |
| `python-louvain` | Louvain community detection |
| `pyvis` | Interactive network visualization |
| `pandas` / `numpy` | Data wrangling and aggregation |
| `matplotlib` / `seaborn` | Static plots and EDA |
| `scipy` | Z-score normalization for centrality metrics |

### Running the Pipeline

**1. Run the analysis notebook:**
```bash
jupyter notebook 02_SNA_Analysis_Influencer.ipynb
```
Executes the full pipeline and exports `graph_data_combined.json`, `graph_data_comment.json`, and `graph_data_mention.json` to the output directory.

**2. Launch the dashboard:**
```bash
npx serve ./dashboard
# or
python -m http.server 8080
```

**3. Load the exported JSON** into the dashboard via the file selector or place it in the expected `/data` path.

---

## Dataset Requirements

### Required Columns

| Column | Description |
|---|---|
| `username` | Account identifier (string) |
| `post_id` | Unique post identifier |
| `is_comment` | Boolean — `True` for comments, `False` for posts |
| `content` | Post or comment text (used for mention extraction) |
| `total_like` | Like count per row |
| `total_interaction` | Total engagement count per row |
| `keyword` | Topic/keyword tag associated with the content |
| `sentiment_label` | Sentiment class: `Positive`, `Negative`, or `Neutral` |
| `date` | Timestamp of the post or comment |

### Preprocessing Requirements

- **Mention extraction** is performed from the `content` column via regex. Email-domain false positives (e.g., handles ending in `.com`, `.id`) are filtered automatically.
- **Duplicate rows** (same `username` + `post_id` + mention target) must be deduplicated before edge construction.
- **Self-loops** (user commenting on or mentioning their own account) are removed during edge construction.
- Usernames should be **lowercased and stripped** of whitespace before processing.

---

## Pipeline Overview

```
Raw Dataset
    │
    ▼
[1] Data Preparation
    Validate columns, extract mentions from content,
    normalize usernames, parse dates.
    │
    ▼
[2] Edge Construction
    Build two edge layers:
    • PRIMARY  → comment-on-post (commenter → post_owner)
    • LAYER 2  → mention (mentioner → mentioned)
    │
    ▼
[3] Edge Weighting
    Aggregate interactions per source–target pair.
    Normalize each signal, then compute:
    weight = 0.4 × comment_count_norm
           + 0.2 × total_like_norm
           + 0.4 × total_interaction_norm
    │
    ▼
[4] Graph Development
    Construct three directed NetworkX graphs:
    comment-only, mention-only, and combined.
    │
    ▼
[5] Centrality Analysis
    Compute per node: In-degree, Out-degree, PageRank (α=0.85),
    Betweenness (normalized). Z-score and percentile rank also computed
    for each metric.
    │
    ▼
[6] Community Detection
    Apply Louvain on the undirected combined graph (resolution=0.3).
    Score modularity, label communities by dominant keyword.
    │
    ▼
[7] Dashboard Visualization
    Export graph_data_*.json → load into interactive
    dashboard for filtering, exploration, and influencer ranking.
```

---

## Adjustable Parameters

| Parameter | Default | Effect of Increasing | Effect of Decreasing |
|---|---|---|---|
| **Louvain resolution** | `0.3` | More, smaller communities | Fewer, larger communities |
| **PageRank alpha** (damping factor) | `0.85` | Amplifies hub concentration; top nodes rank higher | Distributes rank more evenly across all nodes |
| **Influence score — PageRank weight** | `0.4` | Virality-driven accounts score higher | Reduces PageRank dominance in final tier |
| **Influence score — Betweenness weight** | `0.3` | Bridge/connector accounts promoted | Reduces bridge-node advantage |
| **Influence score — In-degree weight** | `0.3` | Broadly mentioned accounts rank higher | Reduces raw popularity signal |
| **Edge weight — comment_count coeff** | `0.4` | Comment volume drives edge strength more | Likes/interactions become relatively more important |
| **Edge weight — total_like coeff** | `0.2` | Passive engagement (likes) weighted more | Like signal de-emphasized |
| **Edge weight — total_interaction coeff** | `0.4` | Active engagement dominates edge strength | Comment count becomes relatively more important |
| **Min edge count filter** (`MIN_EDGE_COUNT`) | `1` | Removes weak/infrequent edges; sparser, cleaner graph | Retains all edges including one-off interactions |

> **Influence score weights must sum to 1.0.** Adjust proportionally when changing any individual weight.

### Tier Assignment (based on influence score percentile)

| Tier | Label | Percentile Threshold |
|---|---|---|
| 1 | Mega Influencer | ≥ 99th |
| 2 | Macro Influencer | ≥ 95th |
| 3 | Mid Influencer | ≥ 80th |
| 4 | Micro Influencer | ≥ 50th |
| 5 | Regular User | < 50th |

---

## Dashboard Usage

### Filtering
Use the filter panel to narrow the graph by:
- **Tier** — Show only Tier 1 (Mega Influencer) through Tier 5 (Regular User).
- **Community** — Isolate one or more detected Louvain communities.
- **Edge type** — Display `comment`, `mention`, or `comment+mention` edges.
- **Sentiment** — Filter nodes by dominant sentiment label (`Positive`, `Negative`, `Neutral`).
- **Min influence score** — Hide low-scoring nodes to reduce visual clutter.

### Graph Interaction
- **Click a node** to open the detail panel: influence score, tier, centrality metrics, dominant keyword, and activity stats.
- **Hover an edge** to see weight, edge count, and edge type.
- **Zoom / pan** to navigate dense clusters. **Drag nodes** to rearrange layout manually.

### Community Exploration
- Communities are color-coded. Select a community from the sidebar to highlight its members and display aggregate stats (size, modularity, dominant keyword, tier distribution).
- The **whitespace analysis** panel surfaces communities with few or no high-tier accounts — potential untapped engagement zones.

### Influencer Analysis
- The **Influencer Leaderboard** ranks accounts by influence score with tier badges.
- Each influencer card shows: PageRank, betweenness, in-degree, total interactions, dominant sentiment, and active keywords.
- Use the **graph type selector** (combined / comment / mention) to compare how influence rank shifts across interaction layers.
