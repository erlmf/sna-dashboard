import { useCallback, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph'
import { useApi } from '../hooks/useApi'
import { getGraph } from '../services/api'
import { Search, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react'

// Color palette per community (cycles)
const COMMUNITY_COLORS = [
  '#E74C3C','#3498DB','#2ECC71','#F39C12','#9B59B6',
  '#1ABC9C','#E67E22','#34495E','#F1C40F','#16A085',
  '#8E44AD','#27AE60','#D35400','#2980B9','#C0392B',
]

const TIER_BORDER = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32', 4: '#87CEEB', 5: '#6B7280' }

function communityColor(communityId) {
  return COMMUNITY_COLORS[(communityId || 0) % COMMUNITY_COLORS.length]
}

function NodeDetail({ node, onClose }) {
  if (!node) return null
  return (
    <div className="absolute top-4 right-4 w-72 card z-20 shadow-2xl">
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-white">@{node.username}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium badge-tier-${node.tier}`}>
            {node.tier_label}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">×</button>
      </div>
      <div className="space-y-1.5 text-xs text-gray-400">
        {[
          ['Influence Score', node.influence_score?.toFixed(6)],
          ['PageRank',        node.pagerank?.toFixed(8)],
          ['Betweenness',     node.betweenness?.toFixed(8)],
          ['In-Degree',       node.in_degree],
          ['Out-Degree',      node.out_degree],
          ['Posts',           node.post_count?.toLocaleString()],
          ['Total Interaction', node.total_interaction?.toLocaleString()],
          ['Community',       `#${node.community_id}`],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-gray-500">{k}</span>
            <span className="text-gray-200 font-mono">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NetworkPage() {
  const [maxNodes, setMaxNodes] = useState(200)
  const [selectedNode, setSelectedNode] = useState(null)
  const [highlightNodes, setHighlightNodes] = useState(new Set())
  const [highlightLinks, setHighlightLinks] = useState(new Set())
  const fgRef = useRef()

  const { data, loading, refetch } = useApi(() => getGraph({ max_nodes: maxNodes }), [maxNodes])

  const handleNodeClick = useCallback(node => {
    setSelectedNode(node)
    // Highlight connected nodes
    const neighbors = new Set([node.id])
    const links = new Set()
    ;(data?.edges || []).forEach(e => {
      if (e.source === node.id || e.source?.id === node.id) {
        neighbors.add(e.target?.id || e.target)
        links.add(e)
      }
      if (e.target === node.id || e.target?.id === node.id) {
        neighbors.add(e.source?.id || e.source)
        links.add(e)
      }
    })
    setHighlightNodes(neighbors)
    setHighlightLinks(links)
  }, [data])

  const handleBackgroundClick = () => {
    setSelectedNode(null)
    setHighlightNodes(new Set())
    setHighlightLinks(new Set())
  }

  const graphData = {
    nodes: (data?.nodes || []).map(n => ({ ...n, id: n.username })),
    links: (data?.edges || []).map(e => ({ source: e.source, target: e.target, value: e.weight })),
  }

  return (
    <div className="relative h-screen bg-gray-950">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="card p-3 w-56 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Controls</p>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Max Nodes: {maxNodes}</label>
            <input
              type="range" min={50} max={500} step={50}
              value={maxNodes}
              onChange={e => setMaxNodes(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <button
            onClick={refetch}
            className="flex items-center gap-2 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors w-full"
          >
            <RefreshCw size={12} /> Refresh Graph
          </button>

          <button
            onClick={() => fgRef.current?.zoomToFit(400)}
            className="flex items-center gap-2 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors w-full"
          >
            <ZoomIn size={12} /> Fit to View
          </button>
        </div>

        {/* Legend */}
        <div className="card p-3 w-56">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Legend</p>
          <div className="space-y-1.5 text-xs">
            {[
              ['Mega Influencer',  '#FFD700', 'Tier 1 — Top 1%'],
              ['Macro Influencer', '#C0C0C0', 'Tier 2 — Top 5%'],
              ['Mid Influencer',   '#CD7F32', 'Tier 3 — Top 20%'],
            ].map(([label, color, sub]) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                <div>
                  <span className="text-gray-300">{label}</span>
                  <span className="text-gray-600 ml-1">{sub}</span>
                </div>
              </div>
            ))}
            <p className="text-gray-600 pt-1">Node size = influence score</p>
            <p className="text-gray-600">Node color = community</p>
          </div>
        </div>
      </div>

      {/* Node Detail Panel */}
      <NodeDetail node={selectedNode} onClose={handleBackgroundClick} />

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-30">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Building network graph...</p>
          </div>
        </div>
      )}

      {/* Graph */}
      {!loading && data && (
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          backgroundColor="#030712"
          nodeLabel={() => ''}
          nodeVal={n => 4 + (n.influence_score || 0) * 40}
          nodeColor={n => {
            const base = communityColor(n.community_id)
            if (highlightNodes.size === 0) return base
            return highlightNodes.has(n.id) ? base : '#1f2937'
          }}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const size = 4 + (node.influence_score || 0) * 40
            const isHighlighted = highlightNodes.size === 0 || highlightNodes.has(node.id)
            const color = communityColor(node.community_id)

            // Draw circle
            ctx.beginPath()
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
            ctx.fillStyle = isHighlighted ? color : '#1f2937'
            ctx.fill()

            // Tier 1 & 2: gold/silver border
            if (node.tier <= 2) {
              ctx.strokeStyle = TIER_BORDER[node.tier]
              ctx.lineWidth = 2
              ctx.stroke()
            }

            // Label for top tiers
            if (node.tier <= 2 && globalScale > 0.8) {
              ctx.font = `${Math.max(3, 10 / globalScale)}px Sans-Serif`
              ctx.fillStyle = 'rgba(255,255,255,0.9)'
              ctx.textAlign = 'center'
              ctx.fillText(`@${node.username}`, node.x, node.y + size + 4)
            }
          }}
          linkColor={link => {
            if (highlightLinks.size === 0) return 'rgba(99,102,241,0.15)'
            return highlightLinks.has(link) ? 'rgba(99,102,241,0.7)' : 'rgba(99,102,241,0.05)'
          }}
          linkWidth={link => highlightLinks.has(link) ? 2 : 0.5}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          cooldownTicks={100}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
        />
      )}

      {/* Stats bar */}
      {data && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-gray-900/90 backdrop-blur px-5 py-2 rounded-full border border-gray-800 text-xs text-gray-400">
          <span>Nodes: <span className="text-white font-medium">{graphData.nodes.length}</span></span>
          <span>Edges: <span className="text-white font-medium">{graphData.links.length}</span></span>
          <span className="text-gray-600">Click node for details</span>
        </div>
      )}
    </div>
  )
}
