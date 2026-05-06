import { useEffect } from 'react'
import { X, ArrowUpRight, ArrowDownLeft, Users } from 'lucide-react'
import { useApi } from '../hooks/useApi.js'
import { api } from '../lib/api.js'
import { TierBadge, Badge, Stat, LoadingBlock, ErrorBlock, fmt, fmtPct } from './ui.jsx'

export function NodeDetailPanel({ username, graphType = 'combined', onClose }) {
  const { data, loading, error } = useApi(
    () => api.node(username, graphType),
    [username, graphType]
  )

  if (!username) return null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono text-dim uppercase tracking-wider">Node Detail</span>
          <h2 className="text-lg font-display font-bold text-text">@{username}</h2>
        </div>
        <button
          onClick={onClose}
          className="mt-1 rounded-lg p-1.5 text-dim hover:text-text hover:bg-muted transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {loading && <LoadingBlock label="Loading node..." />}
      {error   && <ErrorBlock message={error} />}

      {data && (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Tier */}
          <TierBadge tier={data.node.tier} label={data.node.tier_label} />

          {/* Influence */}
          <section>
            <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-3">Influence</h3>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Score"       value={fmtPct(data.node.influence_score)} />
              <Stat label="PageRank"    value={fmtPct(data.node.pagerank)} />
              <Stat label="Betweenness" value={fmtPct(data.node.betweenness)} />
              <Stat label="Authority"   value={fmtPct(data.node.authority_score)} />
            </div>
          </section>

          {/* Degree */}
          <section>
            <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-3">Degree</h3>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="In"    value={fmt(data.node.in_degree)} />
              <Stat label="Out"   value={fmt(data.node.out_degree)} />
              <Stat label="Total" value={fmt(data.node.total_degree)} />
            </div>
          </section>

          {/* Content */}
          <section>
            <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-3">Content</h3>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Posts"        value={fmt(data.node.post_count)} />
              <Stat label="Comments in"  value={fmt(data.node.total_comments_recv)} />
              <Stat label="Interactions" value={fmt(data.node.total_interaction)} />
              <Stat label="Post Likes"   value={fmt(data.node.total_post_like)} />
            </div>
          </section>

          {/* Community */}
          {data.community && Object.keys(data.community).length > 0 && (
            <section>
              <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-3">Community #{data.node.community_id}</h3>
              <div className="rounded-lg border border-border bg-ink/50 p-3 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-dim">Size</span>
                  <span className="font-mono text-text">{fmt(data.community.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dim">Top influencer</span>
                  <span className="font-mono text-accent text-xs">@{data.community.top_influencer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dim">Dominant topic</span>
                  <span className="font-mono text-cyan text-xs">{data.community.dominant_keyword}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dim">Sentiment</span>
                  <span className={`font-mono text-xs ${
                    data.community.dominant_sentiment === 'positive' ? 'text-green' :
                    data.community.dominant_sentiment === 'negative' ? 'text-red' : 'text-dim'
                  }`}>
                    {data.community.dominant_sentiment}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Keywords */}
          {data.node.active_keywords?.length > 0 && (
            <section>
              <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-2">Active Keywords</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.node.active_keywords.map(kw => (
                  <Badge key={kw} color="cyan">{kw}</Badge>
                ))}
              </div>
            </section>
          )}

          {/* Incoming edges */}
          {data.incoming_edges?.length > 0 && (
            <section>
              <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowDownLeft size={12} className="text-green" />
                Top Commenters ({data.incoming_edges.length})
              </h3>
              <div className="space-y-1">
                {data.incoming_edges.slice(0, 10).map(e => (
                  <div key={e.source} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
                    <span className="font-mono text-xs text-accent">@{e.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-dim font-mono">{e.edge_type}</span>
                      <span className="text-xs font-mono text-text bg-muted px-1.5 py-0.5 rounded">
                        w={e.weight?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Outgoing edges */}
          {data.outgoing_edges?.length > 0 && (
            <section>
              <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowUpRight size={12} className="text-amber" />
                Comments To ({data.outgoing_edges.length})
              </h3>
              <div className="space-y-1">
                {data.outgoing_edges.slice(0, 10).map(e => (
                  <div key={e.target} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
                    <span className="font-mono text-xs text-amber">@{e.target}</span>
                    <span className="text-xs font-mono text-text bg-muted px-1.5 py-0.5 rounded">
                      w={e.weight?.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
