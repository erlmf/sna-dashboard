import { useApi } from '../hooks/useApi'
import { getOverview, getTierSummary } from '../services/api'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { Users, Network, Globe, TrendingUp } from 'lucide-react'

const TIER_COLORS = {
  1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32', 4: '#87CEEB', 5: '#6B7280'
}

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colorMap = {
    indigo: 'text-indigo-400', green: 'text-green-400',
    amber: 'text-amber-400', sky: 'text-sky-400'
  }
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-gray-800 ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="flex items-center justify-center h-40 text-gray-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
    </div>
  )
}

export default function Dashboard() {
  const { data: overview, loading: loadOv } = useApi(getOverview)
  const { data: tiers,    loading: loadTr } = useApi(getTierSummary)

  const net = overview?.network || {}
  const tierData = (tiers || []).map(t => ({
    name: t.tier_label.replace(' Influencer', '').replace('Regular', 'Regular'),
    count: t.count,
    color: TIER_COLORS[t.tier] || '#6B7280'
  }))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Network Overview</h1>
        <p className="text-sm text-gray-400 mt-1">Instagram Social Network Analysis Dashboard</p>
      </div>

      {/* Stat Cards */}
      {loadOv ? <Loading /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}    label="Total Nodes"   value={net.total_nodes?.toLocaleString() || '—'} sub="unique users" color="indigo" />
          <StatCard icon={Network}  label="Total Edges"   value={net.total_edges?.toLocaleString() || '—'} sub="interactions" color="sky" />
          <StatCard icon={Globe}    label="Communities"   value={net.n_communities || '—'} sub="clusters detected" color="green" />
          <StatCard icon={TrendingUp} label="Modularity" value={net.modularity?.toFixed(4) || '—'} sub="> 0.3 is good" color="amber" />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Tier distribution pie */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Influencer Tier Distribution</h2>
          {loadTr ? <Loading /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={tierData} cx="50%" cy="50%" outerRadius={90}
                  dataKey="count" nameKey="name" label={({ name, count }) => `${name}: ${count}`}
                  labelLine={false}
                >
                  {tierData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tier bar chart */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Users per Tier</h2>
          {loadTr ? <Loading /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tierData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8 }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {tierData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top communities table */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-4">Top Communities</h2>
        {loadOv ? <Loading /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 pr-4">Community</th>
                  <th className="text-left py-2 pr-4">Size</th>
                  <th className="text-left py-2 pr-4">Top Influencer</th>
                  <th className="text-left py-2 pr-4">Keyword</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.top_communities || []).map(c => (
                  <tr key={c.community_id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 pr-4 text-indigo-400 font-mono">#{c.community_id}</td>
                    <td className="py-2 pr-4">{c.size}</td>
                    <td className="py-2 pr-4 text-gray-300">@{c.top_influencer || '—'}</td>
                    <td className="py-2 pr-4 text-gray-500">{c.dominant_keyword || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
