import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// ── Network ──────────────────────────────────────────────────────────────────
export const getNetworkMeta  = () => api.get('/network/meta').then(r => r.data)
export const getGraph        = (params = {}) => api.get('/network/graph', { params }).then(r => r.data)
export const reloadGraph     = () => api.post('/network/reload').then(r => r.data)

// ── Influencers ───────────────────────────────────────────────────────────────
export const getInfluencers  = (params = {}) => api.get('/influencers/', { params }).then(r => r.data)
export const getTierSummary  = () => api.get('/influencers/tiers/summary').then(r => r.data)
export const getInfluencer   = (username) => api.get(`/influencers/${username}`).then(r => r.data)

// ── Communities ───────────────────────────────────────────────────────────────
export const getCommunities  = (params = {}) => api.get('/communities/', { params }).then(r => r.data)
export const getCommunityMembers = (id, params = {}) =>
  api.get(`/communities/${id}/members`, { params }).then(r => r.data)

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getOverview     = () => api.get('/analytics/overview').then(r => r.data)
export const getWhitespace   = () => api.get('/analytics/whitespace').then(r => r.data)
export const getSentimentByCommunity = () => api.get('/analytics/sentiment-by-community').then(r => r.data)
