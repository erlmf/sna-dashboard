import { useApi } from '../hooks/useApi'
import { getWhitespace } from '../services/api'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

const SENT_COLOR = { positive: '#22c55e', negative: '#ef4444', neutral: '#6b7280' }

function InsightCard({ title, description, value, tag, color = 'amber' }) {
  const borderMap = { amber: 'border-amber-500/30', red: 'border-red-500/30', green: 'border-green-500/30' }
  const tagMap = { amber: 'bg-amber-500/20 text-amber-400', red: 'bg-red-500/20 text-red-400', green: 'bg-green-500/20 text-green-400' }
  return (
    <div className={`card border ${borderMap[color]}`}>
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-white text-sm">{title}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${tagMap[color]}`}>{tag}</span>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  )
}

const CustomScatterTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="font-bold text-white mb-1">{d.keyword}</p>
      <p className="text-gray-400">Posts: <span className="text-white">{d.total_posts}</span></p>
      <p className="text-gray-400">Unique users: <span className="text-white">{d.unique_users}</span></p>
      <p className="text-gray-400">Avg interaction: <span className="text-white">{d.avg_interaction?.toFixed(0)}</span></p>
      <p className="text-gray-400">Negative %: <span className="text-red-400">{d.pct_negative?.toFixed(1)}%</span></p>
    </div>
  )
}

export default function WhiteSpace() {
  const { data, loading } = useApi(getWhitespace)

  const kwData = (data?.keyword_analysis || []).map(k => ({
    ...k,
    avg_interaction: k.avg_interaction || 0,
    unique_users:    k.unique_users || 0,
    pct_negative:    k.pct_negative || 0,
    total_posts:     k.total_posts || 0,
  }))

  // Quadrant logic:
  //   X-axis: unique_users (supply) — low = white space
  //   Y-axis: avg_interaction  (demand) — high = opportunity
  const medX = kwData.length ? kwData.reduce((a, b) => a + b.unique_users, 0) / kwData.length : 0
  const medY = kwData.length ? kwData.reduce((a, b) => a + b.avg_interaction, 0) / kwData.length : 0

  // High demand, low supply = white space
  const whiteSpaceKws = kwData.filter(k => k.avg_interaction > medY && k.unique_users < medX)

  // High negative sentiment keywords = unmet need
  const negativeDominant = kwData.filter(k => k.pct_negative > 40).sort((a, b) => b.pct_negative - a.pct_negative)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">White Space Analysis</h1>
        <p className="text-sm text-gray-400 mt-1">
          Identify under-served topics with high audience demand
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
        </div>
      ) : kwData.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>No keyword data available.</p>
          <p className="text-xs mt-2">Run notebooks and ensure the dataset has a 'keyword' column.</p>
        </div>
      ) : (
        <>
          {/* Summary insight cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InsightCard
              title="White Space Keywords"
              description="High interaction but low creator supply — opportunity to enter"
              value={whiteSpaceKws.length}
              tag="opportunity"
              color="green"
            />
            <InsightCard
              title="High Negative Sentiment"
              description="Topics with >40% negative posts — unmet audience needs"
              value={negativeDominant.length}
              tag="unmet need"
              color="red"
            />
            <InsightCard
              title="Total Keywords Analyzed"
              description="Keywords tracked across the entire dataset"
              value={kwData.length}
              tag="coverage"
              color="amber"
            />
          </div>

          {/* Scatter: Supply vs Demand quadrant */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-300 mb-1">
              Supply vs Demand Quadrant
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              X = # unique creators (supply) · Y = avg interaction (demand) · 
              <span className="text-green-400 ml-1">Top-left = white space</span>
            </p>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  type="number" dataKey="unique_users" name="Unique Users"
                  label={{ value: 'Unique Creators (Supply)', fill: '#6b7280', fontSize: 11, position: 'insideBottom', offset: -4 }}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <YAxis
                  type="number" dataKey="avg_interaction" name="Avg Interaction"
                  label={{ value: 'Avg Interaction (Demand)', fill: '#6b7280', fontSize: 11, angle: -90, position: 'insideLeft' }}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <Tooltip content={<CustomScatterTooltip />} />
                <ReferenceLine x={medX} stroke="#6b7280" strokeDasharray="4 4" />
                <ReferenceLine y={medY} stroke="#6b7280" strokeDasharray="4 4" />
                <Scatter
                  data={kwData}
                  fill="#6366f1"
                  opacity={0.8}
                />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 mt-2">
              Dashed lines = median. Topics in top-left quadrant are white space opportunities.
            </p>
          </div>

          {/* White space keyword table */}
          {whiteSpaceKws.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">
                🎯 White Space Keywords — High Demand, Low Supply
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="text-left py-2 pr-4">Keyword</th>
                    <th className="text-right py-2 pr-4">Avg Interaction</th>
                    <th className="text-right py-2 pr-4">Unique Users</th>
                    <th className="text-right py-2 pr-4">Total Posts</th>
                    <th className="text-right py-2">Neg %</th>
                  </tr>
                </thead>
                <tbody>
                  {whiteSpaceKws
                    .sort((a, b) => b.avg_interaction - a.avg_interaction)
                    .map(k => (
                    <tr key={k.keyword} className="border-b border-gray-800/40 hover:bg-gray-800/30">
                      <td className="py-2 pr-4 font-medium text-green-400">{k.keyword}</td>
                      <td className="py-2 pr-4 text-right font-mono text-white">
                        {k.avg_interaction?.toFixed(0)}
                      </td>
                      <td className="py-2 pr-4 text-right text-gray-300">{k.unique_users}</td>
                      <td className="py-2 pr-4 text-right text-gray-300">{k.total_posts}</td>
                      <td className="py-2 text-right">
                        <span className={k.pct_negative > 40 ? 'text-red-400' : 'text-gray-400'}>
                          {k.pct_negative?.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Negative sentiment table */}
          {negativeDominant.length > 0 && (
            <div className="card border-red-900/30">
              <h2 className="text-sm font-semibold text-red-400 mb-3">
                ⚠️ High Negative Sentiment Keywords — Unmet Audience Needs
              </h2>
              <div className="space-y-2">
                {negativeDominant.map(k => (
                  <div key={k.keyword} className="flex items-center justify-between py-2 border-b border-gray-800/40">
                    <span className="text-sm text-gray-200">{k.keyword}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">{k.total_posts} posts</span>
                      <span className="text-red-400 font-medium">{k.pct_negative?.toFixed(1)}% negative</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
