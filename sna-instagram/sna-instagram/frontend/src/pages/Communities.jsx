import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { getCommunities, getCommunityMembers } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell
} from 'recharts'

const SENT_COLOR = { positive: '#22c55e', negative: '#ef4444', neutral: '#6b7280' }
const COMM_COLORS = [
  '#E74C3C','#3498DB','#2ECC71','#F39C12','#9B59B6',
  '#1ABC9C','#E67E22','#34495E','#F1C40F','#16A085',
]

function SentimentBadge({ label }) {
  const l = (label || 'unknown').toLowerCase()
  const map = {
    positive: 'bg-green-500/20 text-green-400 border-green-500/30',
    negative: 'bg-red-500/20 text-red-400 border-red-500/30',
    neutral:  'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${map[l] || map.neutral}`}>
      {l}
    </span>
  )
}

function MembersDrawer({ communityId, onClose }) {
  const { data, loading } = useApi(
    () => getCommunityMembers(communityId, { limit: 20 }),
    [communityId]
  )
  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-800 z-30 flex flex-col shadow-2xl">
      <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
        <h3 className="font-semibold text-white">Community #{communityId} — Members</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-indigo-500" />
          </div>
        ) : (
          (data || []).map((m, i) => (
            <div key={m.username} className="flex items-center justify-between py-2 border-b border-gray-800/50">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-5">{i + 1}</span>
                <span className="text-sm text-gray-200">@{m.username}</span>
              </div>
              <span className="text-xs text-indigo-400 font-mono">
                {m.influence_score?.toFixed(4)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function Communities() {
  const [sortBy, setSortBy] = useState('size')
  const [drawerComm, setDrawerComm] = useState(null)

  const { data: communities, loading } = useApi(
    () => getCommunities({ sort_by: sortBy, limit: 50 }),
    [sortBy]
  )

  const chartData = (communities || [])
    .slice(0, 15)
    .map((c, i) => ({
      name: `#${c.community_id}`,
      size: c.size,
      color: COMM_COLORS[i % COMM_COLORS.length]
    }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Community Detection</h1>
        <p className="text-sm text-gray-400 mt-1">
          Clusters detected via Louvain algorithm — higher modularity = stronger communities
        </p>
      </div>

      {/* Community size chart */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Top 15 Communities by Size</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <Tooltip contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }} />
            <Bar dataKey="size" radius={[3, 3, 0, 0]}>
              {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sort */}
      <div className="flex gap-2 items-center">
        <span className="text-xs text-gray-500">Sort by:</span>
        {[
          ['size',            'Size'],
          ['avg_interaction', 'Avg Interaction'],
          ['avg_influence',   'Avg Influence'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setSortBy(v)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              sortBy === v ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Community cards grid */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(communities || []).map((c, i) => (
            <div
              key={c.community_id}
              className="card hover:border-gray-700 transition-colors cursor-pointer"
              onClick={() => setDrawerComm(c.community_id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: COMM_COLORS[i % COMM_COLORS.length] }}
                  >
                    Community #{c.community_id}
                  </span>
                  <p className="text-xl font-bold text-white mt-2">{c.size} <span className="text-sm text-gray-500 font-normal">members</span></p>
                </div>
                <SentimentBadge label={c.dominant_sentiment} />
              </div>

              <div className="space-y-1.5 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span className="text-gray-500">Top influencer</span>
                  <span className="text-gray-200">@{c.top_influencer || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Keyword</span>
                  <span className="text-gray-200">{c.dominant_keyword || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg interaction</span>
                  <span className="text-gray-200">{c.avg_total_interaction?.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total posts</span>
                  <span className="text-gray-200">{c.total_posts?.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs text-indigo-400 mt-3 hover:text-indigo-300">View members →</p>
            </div>
          ))}
        </div>
      )}

      {/* Members drawer */}
      {drawerComm !== null && (
        <MembersDrawer communityId={drawerComm} onClose={() => setDrawerComm(null)} />
      )}
    </div>
  )
}
