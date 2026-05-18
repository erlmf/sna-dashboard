import { useState, useEffect } from 'react'
import { Network, Users, BarChart3, Globe } from 'lucide-react'
import { api } from './lib/api.js'
import { useApi } from './hooks/useApi.js'
import { NavTab, Spinner, ErrorBlock } from './components/ui.jsx'
import { NetworkGraph } from './components/NetworkGraph.jsx'
import { NodeDetailPanel } from './components/NodeDetailPanel.jsx'
import { InfluencerTable } from './components/InfluencerTable.jsx'
import { CommunityPanel } from './components/CommunityPanel.jsx'
import { StatsCharts } from './components/StatsCharts.jsx'
import { FilterBar } from './components/FilterBar.jsx'

const TABS = [
  { id: 'graph',       label: 'Network',     icon: Network   },
  { id: 'influencers', label: 'Influencers', icon: Users     },
  { id: 'communities', label: 'Communities', icon: Globe     },
  { id: 'stats',       label: 'Stats',       icon: BarChart3 },
]

export default function App() {
  const [tab,          setTab]          = useState('graph')
  const [selectedNode, setSelectedNode] = useState(null)
  const [filters,      setFilters]      = useState({
    graphType:    'combined',
    tier:         null,
    communityId:  null,
    hideIsolated: false,
  })
  const [graphData,    setGraphData]    = useState(null)
  const [graphLoading, setGraphLoading] = useState(false)
  const [graphError,   setGraphError]   = useState(null)

  const graphType = filters.graphType ?? 'combined'

  // Global data — re-fetch when graphType changes
  const { data: metadata } = useApi(() => api.metadata(graphType),    [graphType])
  const { data: kwData }   = useApi(() => api.topKeywords(30, graphType), [graphType])
  const { data: commData } = useApi(() => api.communities({ graphType }), [graphType])

  // Load graph when filters or tab change
  useEffect(() => {
    if (tab !== 'graph') return
    setGraphLoading(true)
    setGraphError(null)
    api.graph(filters)
      .then(setGraphData)
      .catch(e => setGraphError(e.message))
      .finally(() => setGraphLoading(false))
  }, [filters, tab])

  const handleNodeClick = (node) => setSelectedNode(node)

  const handleCommunitySelect = (commId) => {
    setFilters(f => ({ ...f, communityId: commId }))
    setTab('graph')
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-ink">

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-panel flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
            <Network size={14} className="text-accent" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sm text-text tracking-tight leading-none">
              SNA Dashboard
            </h1>
            <p className="text-xs text-dim font-mono leading-none mt-0.5">
              Instagram Network Analysis
            </p>
          </div>
        </div>

        {/* Metadata pills */}
        {metadata && (
          <div className="hidden sm:flex items-center gap-3">
            {[
              { label: 'Nodes',       val: metadata.total_nodes?.toLocaleString() },
              { label: 'Edges',       val: metadata.total_edges?.toLocaleString() },
              { label: 'Communities', val: metadata.n_communities },
              { label: 'Modularity',  val: metadata.modularity?.toFixed(3) },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center gap-1.5 rounded-lg border border-border bg-ink px-2.5 py-1">
                <span className="text-xs font-mono text-dim">{label}</span>
                <span className="text-xs font-mono font-semibold text-accent">{val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Nav tabs */}
        <nav className="flex items-center gap-1">
          {TABS.map(t => (
            <NavTab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)} icon={t.icon}>
              {t.label}
            </NavTab>
          ))}
        </nav>
      </header>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex">

        {/* GRAPH TAB */}
        {tab === 'graph' && (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-col flex-1 overflow-hidden">
              <FilterBar
                filters={filters}
                onChange={setFilters}
                communities={commData?.data}
              />
              <div className="flex-1 relative">
                {graphLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 bg-ink/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3 text-dim">
                      <Spinner size={32} />
                      <span className="text-sm font-mono">Building network...</span>
                    </div>
                  </div>
                )}
                {graphError && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 p-8">
                    <ErrorBlock message={graphError} />
                  </div>
                )}
                <NetworkGraph
                  graphData={graphData}
                  onNodeClick={handleNodeClick}
                  selectedNode={selectedNode}
                  filters={filters}
                />
              </div>
            </div>

            {selectedNode && (
              <div className="w-80 border-l border-border bg-panel flex-shrink-0 overflow-hidden">
                <NodeDetailPanel
                  username={selectedNode.username}
                  graphType={graphType}
                  onClose={() => setSelectedNode(null)}
                />
              </div>
            )}
          </div>
        )}

        {/* INFLUENCERS TAB */}
        {tab === 'influencers' && (
          <div className="flex flex-1 overflow-hidden">
            <InfluencerTable
              graphType={graphType}
              onSelectNode={node => {
                setSelectedNode(node)
                setTab('graph')
              }}
              keywords={kwData}
            />
          </div>
        )}

        {/* COMMUNITIES TAB */}
        {tab === 'communities' && (
          <div className="flex-1 overflow-hidden">
            <CommunityPanel
              graphType={graphType}
              onSelectCommunity={handleCommunitySelect}
            />
          </div>
        )}

        {/* STATS TAB */}
        {tab === 'stats' && (
          <div className="flex-1 overflow-hidden">
            <StatsCharts metadata={metadata} graphType={graphType} />
          </div>
        )}

      </main>
    </div>
  )
}
