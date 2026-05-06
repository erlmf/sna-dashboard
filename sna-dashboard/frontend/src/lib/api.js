const BASE = '/api'

async function get(path, params = {}) {
  const url = new URL(BASE + path, window.location.origin)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v)
  })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  metadata: (graphType = 'combined') =>
    get('/metadata', { graph_type: graphType }),

  health: () => get('/health'),

  graphTypes: () => get('/graph-types'),

  graph: (filters = {}) =>
    get('/graph', {
      graph_type:    filters.graphType    ?? 'combined',
      tier:          filters.tier,
      keyword:       filters.keyword,
      community_id:  filters.communityId,
      limit_edges:   filters.limitEdges   ?? 1500,
      min_weight:    filters.minWeight    ?? 0,
      hide_isolated: filters.hideIsolated ?? false,
    }),

  influencers: (params = {}) =>
    get('/influencers', {
      graph_type:   params.graphType  ?? 'combined',
      tier:         params.tier,
      keyword:      params.keyword,
      community_id: params.communityId,
      sort_by:      params.sortBy     ?? 'influence_score',
      limit:        params.limit      ?? 100,
      offset:       params.offset     ?? 0,
    }),

  communities: (params = {}) =>
    get('/communities', {
      graph_type: params.graphType ?? 'combined',
      min_size:   params.minSize   ?? 1,
      sort_by:    params.sortBy    ?? 'size',
    }),

  node: (username, graphType = 'combined') =>
    get(`/node/${encodeURIComponent(username)}`, { graph_type: graphType }),

  tierDistribution: (graphType = 'combined') =>
    get('/stats/tier-distribution', { graph_type: graphType }),

  topKeywords: (limit = 20, graphType = 'combined') =>
    get('/stats/top-keywords', { limit, graph_type: graphType }),
}
