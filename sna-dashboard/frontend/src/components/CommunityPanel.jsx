import { useApi } from '../hooks/useApi.js'
import { api } from '../lib/api.js'
import { Card, Badge, Stat, LoadingBlock, ErrorBlock, fmt } from './ui.jsx'

const PALETTE = [
  '#7c6af7','#22d3ee','#4ade80','#fbbf24','#f87171',
  '#a78bfa','#34d399','#fb923c','#60a5fa','#e879f9',
]

const SENTIMENT_COLOR = {
  positive: 'green',
  negative: 'red',
  neutral:  'muted',
}

export function CommunityPanel({ onSelectCommunity, graphType = 'combined' }) {
  const { data, loading, error } = useApi(() => api.communities({ graphType, minSize: 2 }), [graphType])

  if (loading) return <LoadingBlock label="Loading communities..." />
  if (error)   return <ErrorBlock message={error} />

  const communities = data?.data ?? []

  return (
    <div className="h-full overflow-y-auto px-5 py-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-display font-bold text-text uppercase tracking-wider">
          {communities.length} Communities
        </h2>
      </div>

      {communities.map(c => {
        const color = PALETTE[(c.community_id ?? 0) % PALETTE.length]
        let topKws = []
        try { topKws = JSON.parse(c.top_keywords ?? '[]') } catch {}

        return (
          <div
            key={c.community_id}
            onClick={() => onSelectCommunity?.(c.community_id)}
            className="rounded-xl border border-border bg-panel hover:border-accent/50 cursor-pointer transition-all p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
                />
                <span className="font-display font-bold text-sm text-text">
                  Community #{c.community_id}
                </span>
              </div>
              <span className="font-mono text-xs text-dim bg-muted px-2 py-0.5 rounded-full">
                {fmt(c.size)} users
              </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <Stat label="T1 nodes"   value={c.tier1_count ?? 0} />
              <Stat label="T2 nodes"   value={c.tier2_count ?? 0} />
              <Stat label="Cmts recv"  value={fmt(c.avg_comments_recv)} sub="avg" />
            </div>

            {/* Top influencer + broker */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-dim">Top influencer</span>
                <span className="font-mono text-accent">@{c.top_influencer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Top broker</span>
                <span className="font-mono text-amber">@{c.top_broker}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim">Sentiment</span>
                <Badge color={SENTIMENT_COLOR[c.dominant_sentiment] ?? 'muted'}>
                  {c.dominant_sentiment ?? '—'}
                </Badge>
              </div>
            </div>

            {/* Keywords */}
            {topKws.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {topKws.map(kw => (
                  <Badge key={kw} color="cyan">{kw}</Badge>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
