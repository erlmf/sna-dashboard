import { clsx } from 'clsx'
import { Select } from './ui.jsx'

const TIER_OPTIONS = [1, 2, 3, 4, 5].map(t => ({ value: t, label: `Tier ${t}` }))

const GRAPH_TYPE_OPTIONS = [
  { value: 'combined', label: 'Combined Centrality' },
  { value: 'comment',  label: 'Comment Centrality'  },
  { value: 'mention',  label: 'Mention Centrality'  },
]

export function FilterBar({ filters, onChange, communities }) {
  const update = (key, val) => onChange({ ...filters, [key]: val })

  const commOptions = (communities ?? []).slice(0, 20).map(c => ({
    value: c.community_id, label: `Community #${c.community_id} (${c.size})`,
  }))

  const active = [filters.tier, filters.communityId].filter(Boolean).length

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border bg-panel">

      {/* Graph Type — paling kiri, paling penting */}
      <div className="flex items-center gap-2 pr-3 border-r border-border">
        <span className="text-xs font-mono text-dim">NETWORK</span>
        <div className="flex items-center gap-1">
          {GRAPH_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update('graphType', opt.value)}
              className={clsx(
                'rounded-lg px-3 py-1.5 text-xs font-mono transition-all border',
                (filters.graphType ?? 'comment') === opt.value
                  ? 'border-accent bg-accent/20 text-accent font-semibold'
                  : 'border-border text-dim hover:text-text hover:border-accent/40'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <span className="text-xs font-mono text-dim">FILTER</span>

      <Select
        value={filters.tier}
        onChange={v => update('tier', v ? Number(v) : null)}
        options={TIER_OPTIONS}
        placeholder="All Tiers"
      />

      <Select
        value={filters.communityId}
        onChange={v => update('communityId', v !== null && v !== '' ? Number(v) : null)}
        options={commOptions}
        placeholder="All Communities"
      />

      {/* Hide Isolated toggle */}
      <button
        onClick={() => update('hideIsolated', !filters.hideIsolated)}
        className={clsx(
          'rounded-lg border px-3 py-1.5 text-xs font-mono transition-colors',
          filters.hideIsolated
            ? 'border-accent bg-accent/20 text-accent'
            : 'border-border text-dim hover:text-text hover:border-accent/50'
        )}
      >
        {filters.hideIsolated ? '● Hide Isolated' : '○ Hide Isolated'}
      </button>

      {/* Clear filters — preserve graphType dan hideIsolated */}
      {active > 0 && (
        <button
          onClick={() => onChange({
            graphType:    filters.graphType,
            hideIsolated: filters.hideIsolated,
            tier:         null,
            communityId:  null,
          })}
          className="text-xs font-mono text-red hover:text-red/80 transition-colors"
        >
          ✕ Clear ({active})
        </button>
      )}
    </div>
  )
}
