import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  Cell,
} from 'recharts'
import { useApi } from '../hooks/useApi.js'
import { api } from '../lib/api.js'
import { LoadingBlock, ErrorBlock, Stat, fmt } from './ui.jsx'

const TIER_COLORS = {
  'Mega Influencer':  '#fbbf24',
  'Macro Influencer': '#7c6af7',
  'Mid Influencer':   '#22d3ee',
  'Micro Influencer': '#4ade80',
  'Regular User':     '#374151',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2 text-xs font-mono shadow-xl">
      <p className="text-text font-semibold">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  )
}

export function StatsCharts({ metadata, graphType = 'combined' }) {
  const { data: tierData, loading: t1, error: e1 } = useApi(() => api.tierDistribution(graphType), [graphType])
  const { data: kwData, loading: t2, error: e2 } = useApi(() => api.topKeywords(15, graphType), [graphType])

  return (
    <div className="h-full overflow-y-auto px-5 py-4 space-y-6">

      {/* Network Metadata */}
      {metadata && (
        <section>
          <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-3">Network Overview</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Nodes"       value={fmt(metadata.total_nodes)} />
            <Stat label="Edges"       value={fmt(metadata.total_edges)} />
            <Stat label="Density"     value={metadata.density?.toFixed(6)} />
            <Stat label="Modularity"  value={metadata.modularity?.toFixed(4)} sub="good > 0.3" />
            <Stat label="Communities" value={metadata.n_communities} />
            <Stat label="LCC ratio"   value={`${((metadata.lcc_ratio ?? 0) * 100).toFixed(1)}%`} />
          </div>

          {/* Edge type breakdown */}
          {metadata.edge_type_counts && (
            <div className="mt-3 rounded-lg border border-border bg-ink/50 p-3">
              <h4 className="text-xs font-mono text-dim mb-2">Edge Types</h4>
              <div className="space-y-1.5">
                {Object.entries(metadata.edge_type_counts).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-mono text-xs text-accent w-36">{type}</span>
                      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{
                            width: `${(count / metadata.total_edges) * 100}%`,
                            opacity: 0.8,
                          }}
                        />
                      </div>
                    </div>
                    <span className="font-mono text-xs text-dim w-12 text-right">{fmt(count)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tier Distribution Chart */}
      <section>
        <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-3">Influencer Tier Distribution</h3>
        {t1 && <LoadingBlock label="Loading..." />}
        {e1 && <ErrorBlock message={e1} />}
        {tierData && (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tierData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
              <XAxis
                dataKey="tier"
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {tierData.map(entry => (
                  <Cell
                    key={entry.tier}
                    fill={TIER_COLORS[entry.tier] ?? '#374151'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Top Keywords Chart */}
      <section>
        <h3 className="text-xs font-mono text-dim uppercase tracking-wider mb-3">Top Active Keywords</h3>
        {t2 && <LoadingBlock label="Loading..." />}
        {e2 && <ErrorBlock message={e2} />}
        {kwData && (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={kwData}
              layout="vertical"
              margin={{ top: 0, right: 8, bottom: 0, left: 8 }}
            >
              <XAxis
                type="number"
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="keyword"
                width={110}
                tick={{ fill: '#e8e8f0', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#22d3ee" opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>
    </div>
  )
}
