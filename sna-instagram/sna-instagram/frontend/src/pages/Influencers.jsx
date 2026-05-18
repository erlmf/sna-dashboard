import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { getInfluencers, getTierSummary } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { ChevronUp, ChevronDown } from 'lucide-react'

const TIER_BADGE = {
  1: 'badge-tier-1', 2: 'badge-tier-2', 3: 'badge-tier-3',
  4: 'badge-tier-4', 5: 'badge-tier-5'
}
const TIER_COLORS = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32', 4: '#87CEEB', 5: '#6B7280' }

function TierFilter({ value, onChange }) {
  const tiers = [
    { v: null, label: 'All Tiers' },
    { v: 1, label: '🥇 Mega' },
    { v: 2, label: '🥈 Macro' },
    { v: 3, label: '🥉 Mid' },
    { v: 4, label: 'Micro' },
    { v: 5, label: 'Regular' },
  ]
  return (
    <div className="flex gap-2 flex-wrap">
      {tiers.map(t => (
        <button
          key={t.v}
          onClick={() => onChange(t.v)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            value === t.v
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export default function Influencers() {
  const [tier, setTier]       = useState(null)
  const [sortBy, setSortBy]   = useState('influence_score')
  const [limit, setLimit]     = useState(50)

  const { data, loading } = useApi(
    () => getInfluencers({ tier, sort_by: sortBy, limit }),
    [tier, sortBy, limit]
  )
  const { data: tiers } = useApi(getTierSummary)

  const tierChartData = (tiers || []).map(t => ({
    name: t.tier_label.replace(' Influencer', ''),
    count: t.count,
    color: TIER_COLORS[t.tier]
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Influencer Ranking</h1>
        <p className="text-sm text-gray-400 mt-1">
          Ranked by composite influence score (PageRank + Betweenness + Degree + HITS)
        </p>
      </div>

      {/* Tier chart */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Tier Breakdown</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={tierChartData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} width={80} />
            <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {tierChartData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <TierFilter value={tier} onChange={setTier} />
        <div className="flex gap-2 items-center">
          <span className="text-xs text-gray-500">Sort by:</span>
          {['influence_score', 'pagerank', 'betweenness', 'total_interaction'].map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                sortBy === s ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4 w-12">#</th>
                <th className="text-left py-2 pr-4">Username</th>
                <th className="text-left py-2 pr-4">Tier</th>
                <th className="text-right py-2 pr-4">Influence Score</th>
                <th className="text-right py-2 pr-4">PageRank</th>
                <th className="text-right py-2 pr-4">Betweenness</th>
                <th className="text-right py-2 pr-4">In-Degree</th>
                <th className="text-right py-2 pr-4">Posts</th>
                <th className="text-right py-2">Interactions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.influencers || []).map(u => (
                <tr key={u.username} className="border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
                  <td className="py-2 pr-4 text-gray-600 font-mono text-xs">{u.rank}</td>
                  <td className="py-2 pr-4 font-medium text-gray-200">
                    <a
                      href={`https://instagram.com/${u.username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-indigo-400 transition-colors"
                    >
                      @{u.username}
                    </a>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TIER_BADGE[u.tier]}`}>
                      {u.tier_label}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-indigo-300">
                    {u.influence_score.toFixed(4)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-gray-400 text-xs">
                    {u.pagerank.toFixed(6)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-gray-400 text-xs">
                    {u.betweenness.toFixed(6)}
                  </td>
                  <td className="py-2 pr-4 text-right text-gray-300">{u.in_degree}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{u.post_count}</td>
                  <td className="py-2 text-right text-gray-300">
                    {u.total_interaction?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Load more */}
      <div className="flex justify-center">
        <button
          onClick={() => setLimit(l => l + 50)}
          className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
        >
          Load more
        </button>
      </div>
    </div>
  )
}
