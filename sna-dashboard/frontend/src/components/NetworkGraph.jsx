import { useRef, useEffect, useCallback, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Spinner } from './ui.jsx'

// Community color palette
const PALETTE = [
  '#7c6af7','#22d3ee','#4ade80','#fbbf24','#f87171',
  '#a78bfa','#0f7952','#fb923c','#60a5fa','#e879f9',
  '#facc15','#2dd4bf','#f472b6','#818cf8','#86efac',
]

// Base size per tier
const TIER_SIZE = { 1: 32, 2: 22, 3: 15, 4: 10, 5: 7 }

function calcNodeSize(node) {
  const base = TIER_SIZE[node.tier] ?? 7
  const score      = node.combined_score ?? node.score ?? 0
  const scoreBonus = Math.log1p(score * 100) * 1.5
  const degree      = (node.in_degree ?? 0) + (node.out_degree ?? 0)
  const degreeBonus = Math.log1p(degree) * 1.2
  return base + scoreBonus + degreeBonus
}

const EDGE_TYPE_COLOR = {
  'comment':         '#7c6af7',
  'comment+mention': '#22d3ee',
  'mention':         '#4ade80',
}

function resolveEdgeType(edge, graphType) {
  if (graphType === 'mention' || graphType === 'comment') return graphType
  return EDGE_TYPE_COLOR[edge.edge_type] ? edge.edge_type : 'comment'
}

function communityColor(commId) {
  return PALETTE[(commId ?? 0) % PALETTE.length]
}

// Edge Tooltip component
function EdgeTooltip({ edge, pos, onClose }) {
  if (!edge) return null

  const src    = typeof edge.source === 'object' ? edge.source.username : edge.source
  const tgt    = typeof edge.target === 'object' ? edge.target.username : edge.target
  const type   = edge.edge_type ?? edge.type ?? 'comment'
  const weight = edge.weight ?? 1
  const color  = EDGE_TYPE_COLOR[type] ?? '#7c6af7'

  const interactionLabel = {
    'comment':         `${src} commented on ${tgt}'s post`,
    'mention':         `${src} mentioned ${tgt}`,
    'comment+mention': `${src} commented & mentioned ${tgt}`,
  }[type] ?? `${src} → ${tgt}`

  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{ left: pos.x + 12, top: pos.y - 8 }}
    >
      <div className="rounded-xl border border-border bg-panel/95 backdrop-blur-md shadow-2xl p-3 min-w-48">
        <div className="mb-2">
          <span
            className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${color}22`, color }}
          >
            {type}
          </span>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-dim w-12">from</span>
            <span className="font-mono text-accent font-medium">@{src}</span>
          </div>
          <div className="flex items-center gap-1.5 pl-12">
            <div className="flex-1 border-t border-dashed border-border" />
            <span className="text-dim text-[10px]">→</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-dim w-12">to</span>
            <span className="font-mono text-amber font-medium">@{tgt}</span>
          </div>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-border flex items-center justify-between">
          <span className="text-xs text-dim font-mono">weight</span>
          <span className="text-xs font-mono font-bold text-text bg-muted px-2 py-0.5 rounded">
            {Number(weight).toFixed(2)}
          </span>
        </div>
        <p className="text-[10px] text-dim font-mono mt-1.5 opacity-60">
          {interactionLabel}
        </p>
      </div>
    </div>
  )
}

export function NetworkGraph({ graphData, onNodeClick, selectedNode, filters }) {
  const fgRef        = useRef()
  const [dims, setDims] = useState({ w: 800, h: 600 })
  const [dimsReady, setDimsReady] = useState(false)
  const containerRef = useRef()
  const hasInteractedRef = useRef(false)


  const [edgeTooltip, setEdgeTooltip] = useState({ edge: null, pos: { x: 0, y: 0 } })
  const [hoveredEdge, setHoveredEdge] = useState(null)
  const edgeClickedRef = useRef(0)

  const graphType = filters?.graphType ?? graphData?.metadata?.graph_name ?? ''

  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      if (width > 0) {
        setDims({ w: width, h: height > 0 ? height : 600 })
        setDimsReady(true)
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Setup force simulation
  useEffect(() => {
    if (!fgRef.current || !graphData?.nodes?.length) return
    const fg = fgRef.current

    graphData.nodes.forEach(node => {
      node.fx = undefined
      node.fy = undefined
    })

    fg.d3Force('charge')?.strength(-400)
    fg.d3Force('link')?.distance(link => {
      const w = link.weight ?? 1
      return 100 + Math.log1p(w) * 15
    })

    try {
      const d3 = window.d3 ?? null
      if (d3?.forceCollide) {
        fg.d3Force('collide', d3.forceCollide(node => calcNodeSize(node) + 6))
      }
    } catch (_) {}

    fg.d3Force('center')?.strength(0.03)
    fg.d3ReheatSimulation()
  }, [graphData])

  // FIX: zoom to fit setelah graph mount + dimsReady, dengan delay
  useEffect(() => {
    if (!fgRef.current || !graphData?.nodes?.length || !dimsReady) return
    hasInteractedRef.current = false
    const timer = setTimeout(() => {
      fgRef.current?.zoomToFit(600, 80)
    },250)
    return () => clearTimeout(timer)
  }, [graphData, dimsReady])

  // Tambah handler ini untuk zoom & pan
  const handleZoomPan = useCallback(() => {
    hasInteractedRef.current = true
  }, [])

  // Canvas click untuk detect edge click
  useEffect(() => {
    if (!fgRef.current || !graphData?.nodes?.length) return
    const canvas = containerRef.current?.querySelector('canvas')
    if (!canvas) return

    const handleCanvasClick = (event) => {
      const rect = canvas.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top
      const graphCoords = fgRef.current.screen2GraphCoords(mouseX, mouseY)

      const nodeMap = {}
      graphData.nodes.forEach(n => { nodeMap[n.id] = n })

      // FIX: optional chaining agar aman saat graphData null
      const links = (graphData?.edges ?? []).map(e => ({
        ...e,
        edge_type: resolveEdgeType(e, graphType),
      }))

      let closest = null
      let minDist = Infinity
      const THRESHOLD = 15

      for (const e of links) {
        const srcId = typeof e.source === 'object' ? e.source.id : e.source
        const tgtId = typeof e.target === 'object' ? e.target.id : e.target
        const src = nodeMap[srcId]
        const tgt = nodeMap[tgtId]
        if (!src || !tgt || src.x == null || tgt.x == null) continue

        const dx = tgt.x - src.x
        const dy = tgt.y - src.y
        const lenSq = dx * dx + dy * dy
        if (lenSq === 0) continue

        let t = ((graphCoords.x - src.x) * dx + (graphCoords.y - src.y) * dy) / lenSq
        t = Math.max(0, Math.min(1, t))

        const nearX = src.x + t * dx
        const nearY = src.y + t * dy
        const nearScreen = fgRef.current.graph2ScreenCoords(nearX, nearY)
        const dist = Math.hypot(mouseX - nearScreen.x, mouseY - nearScreen.y)

        if (dist < THRESHOLD && dist < minDist) {
          minDist = dist
          closest = e
        }
      }

      if (closest) {
        edgeClickedRef.current = Date.now()
        setEdgeTooltip({ edge: closest, pos: { x: mouseX, y: mouseY } })
      }
    }

    canvas.addEventListener('click', handleCanvasClick)
    return () => canvas.removeEventListener('click', handleCanvasClick)
  }, [graphData, graphType])

  const paintNode = useCallback((node, ctx, globalScale) => {
    const size       = calcNodeSize(node)
    const color      = communityColor(node.community_id)
    const isSelected = selectedNode?.username === node.username

    const degree = (node.in_degree ?? 0) + (node.out_degree ?? 0)
    if (isSelected || node.tier <= 2 || degree >= 3) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, size + 6, 0, 2 * Math.PI)
      ctx.fillStyle = isSelected ? 'rgba(124,106,247,0.4)' : `${color}28`
      ctx.fill()
    }

    ctx.beginPath()
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()

    ctx.beginPath()
    ctx.arc(node.x - size * 0.25, node.y - size * 0.25, size * 0.35, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fill()

    if (isSelected) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth   = 2 / globalScale
      ctx.stroke()
    }

    const showLabel = node.tier <= 3 || (node.tier === 3 && globalScale > 0.8) || globalScale > 1.5
    if (showLabel) {
      const label    = node.username
      const fontSize = Math.max(11 / globalScale, 3)
      ctx.font        = `bold ${fontSize}px JetBrains Mono`
      ctx.textAlign   = 'center'
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'
      ctx.lineWidth   = 3 / globalScale
      ctx.strokeText(label, node.x, node.y + size + fontSize + 2)
      ctx.fillStyle = '#e8e8f0'
      ctx.fillText(label, node.x, node.y + size + fontSize + 2)
    }
  }, [selectedNode])

  const handleLinkHover = useCallback((link, event) => {
    setHoveredEdge(link)
    if (containerRef.current) {
      containerRef.current.style.cursor = link ? 'pointer' : 'grab'
    }
    if (link && event) {
      setEdgeTooltip({ edge: link, pos: { x: event.clientX, y: event.clientY } })
    } else {
      setEdgeTooltip({ edge: null, pos: { x: 0, y: 0 } })
    }
  }, [])

  const handleBackgroundClick = useCallback(() => {
    const timeSinceEdgeClick = Date.now() - edgeClickedRef.current
    if (timeSinceEdgeClick < 500) return
      setEdgeTooltip({ edge: null, pos: { x: 0, y: 0 } })
  }, [])

  // FIX: optional chaining agar tidak crash saat graphData null
  const normalizedLinks = (graphData?.edges ?? []).map(e => ({
    ...e,
    source:    e.source,
    target:    e.target,
    edge_type: resolveEdgeType(e, graphType),
  }))

  return (
    <div ref={containerRef} className="relative w-full h-full graph-canvas overflow-hidden">

      {/* Spinner saat data belum ada */}
      {!graphData && (
        <div className="absolute inset-0 flex items-center justify-center text-dim">
          <Spinner size={32} />
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 rounded-lg border border-border bg-panel/90 p-3 backdrop-blur-sm">
        <span className="text-xs font-display font-semibold text-dim uppercase tracking-wider mb-1">Top 10 Communities</span>
        {PALETTE.slice(0, 10).map((color, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs font-mono text-dim">#{i}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-border space-y-1">
          <span className="text-xs font-display font-semibold text-dim uppercase tracking-wider">Edge Types</span>
          {Object.entries(EDGE_TYPE_COLOR).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-4 h-0.5 rounded" style={{ background: color }} />
              <span className="text-[10px] font-mono text-dim">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Node + edge count */}
      <div className="absolute top-3 right-3 z-10 rounded-lg border border-border bg-panel/90 px-3 py-2 backdrop-blur-sm">
        <span className="text-xs font-mono text-dim">
          {graphData?.nodes?.length ?? 0} nodes · {graphData?.edges?.length ?? 0} edges
        </span>
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-full border border-border bg-panel/80 px-3 py-1 backdrop-blur-sm">
        <span className="text-[10px] font-mono text-dim">
          click node for details · click edge for interaction info
        </span>
      </div>

      {/* Edge Tooltip */}
      <EdgeTooltip
        edge={edgeTooltip.edge}
        pos={edgeTooltip.pos}
        onClose={() => setEdgeTooltip({ edge: null, pos: { x: 0, y: 0 } })}
      />

      {/* Render ForceGraph hanya setelah dims diukur dan graphData ada */}
      {dimsReady && graphData && (
        <ForceGraph2D
          ref={fgRef}
          width={dims.w}
          height={dims.h}
          graphData={{
            nodes: graphData.nodes ?? [],
            links: normalizedLinks,
          }}
          nodeId="id"
          linkSource="source"
          linkTarget="target"
          linkWidth={link => {
            const isHovered = hoveredEdge === link
            const base = 1 + Math.log1p(link.weight ?? 1)
            return isHovered ? base * 2 : base
          }}
          linkColor={link => {
            const isHovered = hoveredEdge === link
            const base = EDGE_TYPE_COLOR[link.edge_type] ?? '#7c6af7'
            if (isHovered) return base
            const r = parseInt(base.slice(1, 3), 16)
            const g = parseInt(base.slice(3, 5), 16)
            const b = parseInt(base.slice(5, 7), 16)
            const op = Math.min(0.5, (link.weight ?? 1) / 10 + 0.3)
            return `rgba(${r},${g},${b},${op})`
          }}
          nodeCanvasObject={paintNode}
          nodeCanvasObjectMode={() => 'replace'}
          nodePointerAreaPaint={(node, color, ctx) => {
            const size = calcNodeSize(node)
            ctx.beginPath()
            ctx.arc(node.x, node.y, size + 6, 0, 2 * Math.PI)
            ctx.fillStyle = color
            ctx.fill()
          }}
          onNodeClick={node => {
            setEdgeTooltip({ edge: null, pos: { x: 0, y: 0 } })
            onNodeClick?.(node)
          }}
          onLinkHover={handleLinkHover}
          onBackgroundClick={handleBackgroundClick}
          backgroundColor="#0a0a0f"
          linkDirectionalArrowLength={link => {
            const isHovered = hoveredEdge === link
            return isHovered ? 14 : 10
          }}
          linkDirectionalArrowRelPos={0.82}
          linkDirectionalArrowColor={link => {
            return EDGE_TYPE_COLOR[link.edge_type] ?? 'rgba(124,106,247,0.5)'
          }}
          cooldownTicks={200}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.2}
          onEngineStop={() => {
            // Pin semua node di posisi akhir simulasi
            const nodes = graphData?.nodes ?? []
            nodes.forEach(node => {
              node.fx = node.x
              node.fy = node.y
            })
            // FIX: selalu zoom to fit saat engine stop, tanpa hasZoomedRef
            if (!hasInteractedRef.current) {
              fgRef.current?.zoomToFit(600, 80)
            }
          }}
          onNodeDragStart={node => {
            node.fx = undefined
            node.fy = undefined
            fgRef.current?.d3ReheatSimulation()
          }}
          onNodeDrag={node => {
            node.fx = node.x
            node.fy = node.y
          }}
          onNodeDragEnd={node => {
            node.fx = node.x
            node.fy = node.y
          }}
          onZoom={handleZoomPan}
          onPanStart={handleZoomPan}
          enableNodeDrag
          enableZoomInteraction
          enablePanInteraction
        />
      )}
    </div>
  )
}
