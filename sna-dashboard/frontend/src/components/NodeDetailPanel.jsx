import { useEffect } from 'react'
import { X, ArrowUpRight, ArrowDownLeft, Users, Info } from 'lucide-react'
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
        <div className="relative z-20 flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Tier */}
          <TierBadge tier={data.node.tier} label={data.node.tier_label} />
          <span
            className="group relative inline-flex items-center ml-2"
          >
            <Info
              size={13}
              className="text-muted-foreground cursor-default shrink-0"
            />
            <span
              className="absolute top-full mt-2 left-1/4
                        -translate-x-[78%] -translate-y-2
                        z-[99999] w-52
                        rounded-lg border border-border bg-[#111318]
                        px-3 py-2 text-[11px] leading-relaxed text-popover-foreground
                        shadow-2xl
                        opacity-0 invisible
                        group-hover:opacity-100 group-hover:visible
                        transition-all duration-150"
            >
              {{
                1: 'Top-tier influential account in the network with significant reach and impact',
                2: 'Highly influential and well-connected account',
                3: 'Moderately influential account',
                4: 'Account with limited but noticeable network influence',
                5: 'Regular account with low overall network influence',
              }[data.node.tier]}
            </span>
          </span>
          
          {/* Influence */}
          <section>
            <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-3">Influence</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative overflow-visible">
                <Stat label="Score" value={fmtPct(data.node.influence_score)} />
                <span className="group absolute top-2 right-2 inline-flex items-center">
                  <Info size={12} className="text-muted-foreground cursor-default" />
                  <span className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 z-50 w-60 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-mono text-text leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    Overall influence level within the network. Range: 0–1, where higher values indicate stronger influence.
                  </span>
                </span>
              </div>

              <div className="relative overflow-visible">
                <Stat label="PageRank" value={fmtPct(data.node.pagerank)} />
                <span className="group absolute top-2 right-2 inline-flex items-center">
                  <Info size={12} className="text-muted-foreground cursor-default" />
                  <span className="pointer-events-none absolute bottom-5 right-0 z-50 w-44 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-mono text-text leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    Shows how influential an account is based on connections from other influential accounts. 
                  </span>
                </span>
              </div>

              <div className="relative overflow-visible">
                <Stat label="Betweenness" value={
                  data.node.betweenness === 0      ? '0.0000' :
                  data.node.betweenness < 0.000001 ? data.node.betweenness.toFixed(7) :
                  data.node.betweenness < 0.0001   ? data.node.betweenness.toFixed(6) :
                  fmtPct(data.node.betweenness)
                } />
                <span className="group absolute top-2 right-2 inline-flex items-center">
                  <Info size={12} className="text-muted-foreground cursor-default" />
                  <span className="pointer-events-none absolute bottom-5 left-0 z-50 w-44 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-mono text-text leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    Shows how important an account is in connecting different groups or communities. 
                  </span>
                </span>
              </div>
            </div>
          </section>

          {/* Degree */}
          <section>
            <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-3">Degree</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <Stat label="In" value={fmt(data.node.in_degree)} />
                <span className="group absolute top-0 left-5 inline-flex items-center">
                  <Info size={12} className="text-muted-foreground cursor-default" />
                  <span className="pointer-events-none absolute bottom-5 left-0 z-50 w-44 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-mono text-text leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    Number of interactions received by an account from other users
                  </span>
                </span>
              </div>
              <div className="relative">
                <Stat label="Out" value={fmt(data.node.out_degree)} />
                <span className="group absolute top-0 left-8 inline-flex items-center">
                  <Info size={12} className="text-muted-foreground cursor-default" />
                  <span className="pointer-events-none absolute bottom-5 left-0 z-50 w-44 rounded-lg border border-border bg-panel px-3 py-2 text-xs font-mono text-text leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    Number of interactions initiated by an account to other users
                  </span>
                </span>
              </div>
              <Stat label="Total" value={fmt(data.node.total_degree)} />
            </div>
          </section>
  
          {/* Content */}
          <section>
            <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-3">Content</h3>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Posts"        value={fmt(data.node.post_count)} />
              <Stat label="Interactions" value={fmt(data.node.total_interaction)} />
              <Stat label="Likes"   value={fmt(data.node.total_post_like)} />
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
                  {data.community.top_influencer === 'tied' ?
                    <span className="text-dim italic text-xs">score tied</span> :
                    <span className="font-mono text-accent text-xs">@{data.community.top_influencer}</span>
                  }
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
