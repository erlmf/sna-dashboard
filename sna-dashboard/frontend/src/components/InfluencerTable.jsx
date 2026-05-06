import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useApi } from '../hooks/useApi.js'
import { api } from '../lib/api.js'
import { TierBadge, Badge, Select, Input, LoadingBlock, ErrorBlock, fmt, fmtPct } from './ui.jsx'

const SORT_OPTIONS = [
  { value: 'influence_score',      label: 'Influence Score' },
  { value: 'pagerank',             label: 'PageRank' },
  { value: 'betweenness',          label: 'Betweenness' },
  { value: 'in_degree',            label: 'In-Degree' },
  { value: 'total_comments_recv',  label: 'Comments Received' },
  { value: 'total_interaction',    label: 'Total Interaction' },
]

const TIER_OPTIONS = [1, 2, 3, 4, 5].map(t => ({
  value: t,
  label: `Tier ${t}`,
}))

export function InfluencerTable({ onSelectNode, keywords, graphType = 'combined' }) {
  const [tier,    setTier]    = useState(null)
  const [keyword, setKeyword] = useState(null)
  const [sortBy,  setSortBy]  = useState('influence_score')
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(0)
  const LIMIT = 50

  const { data, loading, error } = useApi(
    () => api.influencers({ graphType, tier, keyword, sortBy, limit: LIMIT, offset: page * LIMIT }),
    [graphType, tier, keyword, sortBy, page]
  )

  const rows = (data?.data ?? []).filter(n =>
    !search || n.username.toLowerCase().includes(search.toLowerCase())
  )

  const kwOptions = (keywords ?? []).slice(0, 30).map(k => ({
    value: k.keyword, label: `${k.keyword} (${k.count})`,
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        <Input
          value={search}
          onChange={setSearch}
          placeholder="Search username..."
          className="w-44"
        />
        <Select value={tier}    onChange={v => { setTier(v ? Number(v) : null); setPage(0) }}    options={TIER_OPTIONS}  placeholder="All Tiers" />
        <Select value={keyword} onChange={v => { setKeyword(v); setPage(0) }} options={kwOptions} placeholder="All Keywords" />
        <Select value={sortBy}  onChange={setSortBy} options={SORT_OPTIONS} placeholder="Sort by" />
      </div>

      {loading && <LoadingBlock label="Loading influencers..." />}
      {error   && <ErrorBlock message={error} />}

      {!loading && !error && (
        <>
          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-panel border-b border-border">
                <tr>
                  {['#','Username','Tier','Influence','PageRank','Betweenness','In-deg','Comments In','Keywords'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-mono text-dim uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((node, i) => (
                  <tr
                    key={node.username}
                    onClick={() => onSelectNode?.(node)}
                    className="border-b border-border/50 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5 font-mono text-dim text-xs">{page * LIMIT + i + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-accent text-xs font-medium">@{node.username}</td>
                    <td className="px-3 py-2.5">
                      <TierBadge tier={node.tier} label={`T${node.tier}`} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs">{fmtPct(node.influence_score)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{fmtPct(node.pagerank)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{fmtPct(node.betweenness)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{fmt(node.in_degree)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{fmt(node.total_comments_recv)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {(node.active_keywords ?? []).slice(0, 2).map(kw => (
                          <Badge key={kw} color="cyan">{kw}</Badge>
                        ))}
                        {(node.active_keywords ?? []).length > 2 && (
                          <Badge color="muted">+{node.active_keywords.length - 2}</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rows.length === 0 && !loading && (
              <div className="py-12 text-center text-dim font-mono text-sm">
                No results match the current filters.
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <span className="text-xs font-mono text-dim">
              {data?.total ?? 0} total · page {page + 1}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded px-3 py-1 text-xs font-mono text-dim border border-border hover:border-accent hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * LIMIT >= (data?.total ?? 0)}
                className="rounded px-3 py-1 text-xs font-mono text-dim border border-border hover:border-accent hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
