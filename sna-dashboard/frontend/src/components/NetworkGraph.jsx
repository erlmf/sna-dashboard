import { useRef, useEffect, useCallback, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Spinner } from './ui.jsx'

// Community color palette
const PALETTE = [
  '#7c6af7','#22d3ee','#4ade80','#fbbf24','#f87171',
  '#a78bfa','#0f7952','#fb923c','#60a5fa','#e879f9',
  '#facc15','#2dd4bf','#f472b6','#818cf8','#86efac',
]

// Base size per tier — dinaikkan agar lebih jelas
const TIER_SIZE = { 1: 32, 2: 22, 3: 15, 4: 10, 5: 7 }

// Hitung ukuran node berdasarkan tier + centrality score + degree
function calcNodeSize(node) {
  const base = TIER_SIZE[node.tier] ?? 7

  // Bonus dari centrality score (0–1 range, log-scaled)
  const score      = node.combined_score ?? node.score ?? 0
  const scoreBonus = Math.log1p(score * 100) * 1.5

  // Bonus dari total degree (banyaknya koneksi / node tetangga)
  const degree      = (node.in_degree ?? 0) + (node.out_degree ?? 0)
  const degreeBonus = Math.log1p(degree) * 1.2

  return base + scoreBonus + degreeBonus
}

const EDGE_TYPE_COLOR = {
    'comment':          '#7c6af7',
    'comment+mention':  '#22d3ee',
    'mention':          '#4ade80'
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

  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{ left: pos.x + 12, top: pos.y - 8 }}
    >
      <div className="rounded-xl border border-border bg-panel/95 backdrop-blur-md shadow-2xl p-3 min-w-48">

        {/* Source → Target */}
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

        {/* Weight */}
        <div className="mt-2.5 pt-2.5 border-t border-border flex items-center justify-between">
          <span className="text-xs text-dim font-mono">weight</span>
          <span className="text-xs font-mono font-bold text-text bg-muted px-2 py-0.5 rounded">
            {Number(weight).toFixed(2)}
          </span>
        </div>

        {/* Hint */}
        <p className="text-[10px] text-dim font-mono mt-1.5 opacity-60">
          {src} commented on {tgt}'s post
        </p>
      </div>
    </div>
  )
}

export function NetworkGraph({ graphData, onNodeClick, selectedNode, filters }) {
  const fgRef        = useRef()
  const [dims, setDims] = useState({ w: 800, h: 600 })
  const containerRef = useRef()

  // Edge tooltip state
  const [edgeTooltip, setEdgeTooltip] = useState({ edge: null, pos: { x: 0, y: 0 } })
  const [hoveredEdge, setHoveredEdge] = useState(null)

  const edgeClickedRef = useRef(false)
  
  // Responsive sizing
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDims({ w: width, h: height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Setup force simulation — dijalankan setiap kali graphData berubah
  useEffect(() => {
    if (!fgRef.current || !graphData?.nodes?.length) return
    const fg = fgRef.current

    // Unpin semua node dulu supaya simulasi bisa jalan bebas
    graphData.nodes.forEach(node => {
      node.fx = undefined
      node.fy = undefined
    })

    // Repulsion jauh lebih kuat agar node menyebar
    fg.d3Force('charge')?.strength(-400)

    // Jarak link lebih panjang, disesuaikan dengan bobot edge
    fg.d3Force('link')?.distance(link => {
      const w = link.weight ?? 1
      return 100 + Math.log1p(w) * 15
    })

    // Collision radius agar node tidak tumpang tindih
    // d3-force tersedia via react-force-graph-2d dependency
    try {
      const d3 = window.d3 ?? null
      if (d3?.forceCollide) {
        fg.d3Force('collide', d3.forceCollide(node => calcNodeSize(node) + 6))
      }
    } catch (_) {
      // fallback: skip collision if d3 not globally available
    }

    // Lemahkan gravitasi pusat agar node lebih bebas menyebar
    fg.d3Force('center')?.strength(0.03)

    // Reheat simulation supaya perubahan force diterapkan
    fg.d3ReheatSimulation()
  }, [graphData])

  // Zoom to fit setelah simulasi cukup matang
  useEffect(() => {
    if (fgRef.current && graphData?.nodes?.length) {
      setTimeout(() => fgRef.current?.zoomToFit(600, 80), 1200)
    }
  }, [graphData])
useEffect(() => {
  if (!fgRef.current || !graphData?.nodes?.length) return

  const canvas = containerRef.current?.querySelector('canvas')
  if (!canvas) return

  const handleCanvasClick = (event) => {
    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const graphCoords = fgRef.current.screen2GraphCoords(mouseX, mouseY)

    // Node sudah punya x,y setelah simulasi karena dimutasi langsung
    const nodeMap = {}
    graphData.nodes.forEach(n => { nodeMap[n.id] = n })

    const links = graphData.edges ?? []
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
      edgeClickedRef.current = true
      setEdgeTooltip({ edge: closest, pos: { x: mouseX, y: mouseY } })
    }
  }

  canvas.addEventListener('click', handleCanvasClick)
  return () => canvas.removeEventListener('click', handleCanvasClick)
}, [graphData])

  const paintNode = useCallback((node, ctx, globalScale) => {
    const size       = calcNodeSize(node)
    const color      = communityColor(node.community_id)
    const isSelected = selectedNode?.username === node.username

    // Glow untuk node selected, tier 1-2, atau node dengan banyak koneksi
    const degree = (node.in_degree ?? 0) + (node.out_degree ?? 0)
    if (isSelected || node.tier <= 2 || degree >= 3) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, size + 6, 0, 2 * Math.PI)
      ctx.fillStyle = isSelected
        ? 'rgba(124,106,247,0.4)'
        : `${color}28`
      ctx.fill()
    }

    // Node circle
    ctx.beginPath()
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()

    // Inner highlight (efek 3D ringan)
    ctx.beginPath()
    ctx.arc(node.x - size * 0.25, node.y - size * 0.25, size * 0.35, 0, 2 * Math.PI)
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.fill()

    // Border untuk selected
    if (isSelected) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth   = 2 / globalScale
      ctx.stroke()
    }

    // Label: T1/T2 selalu tampil, T3 tampil jika zoom cukup, semua tampil saat zoom tinggi
    const showLabel = node.tier <= 2 || (node.tier === 3 && globalScale > 1.5) || globalScale > 3
    if (showLabel) {
      const label    = node.username
      const fontSize = Math.max(11 / globalScale, 3)
      ctx.font        = `bold ${fontSize}px JetBrains Mono`
      ctx.textAlign   = 'center'

      // Shadow/outline agar teks terbaca di atas node
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'
      ctx.lineWidth   = 3 / globalScale
      ctx.strokeText(label, node.x, node.y + size + fontSize + 2)

      ctx.fillStyle = '#e8e8f0'
      ctx.fillText(label, node.x, node.y + size + fontSize + 2)
    }
  }, [selectedNode])

  const handleLinkClick = useCallback((link, event) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setEdgeTooltip({
      edge: link,
      pos: { x: event.clientX - rect.left, y: event.clientY - rect.top },
    })
  }, [])

  const handleLinkHover = useCallback((link, event) => {
    setHoveredEdge(link)
    if (containerRef.current) {
      containerRef.current.style.cursor = link ? 'pointer' : 'grab'
    }

    if (link && event) {
        setEdgeTooltip({
          edge: link,
          pos: { x: event.clientX ,
            y: event.clientY},
        })
      } else {
        setEdgeTooltip({ edge: null, pos: { x: 0, y: 0 } })
      }
  }, [])

  const handleBackgroundClick = useCallback(() => {
    if (edgeClickedRef.current) {
      edgeClickedRef.current = false
      return
    }
    setEdgeTooltip({ edge: null, pos: { x: 0, y: 0 } })
  }, [])

  if (!graphData) {
    return (
      <div className="flex items-center justify-center h-full text-dim">
        <Spinner size={32} />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full graph-canvas overflow-hidden">

      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 rounded-lg border border-border bg-panel/90 p-3 backdrop-blur-sm">
        <span className="text-xs font-display font-semibold text-dim uppercase tracking-wider mb-1">Top 10 Communities</span>
        {PALETTE.slice(0, 10).map((color, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-xs font-mono text-dim">#{i}</span>
          </div>
        ))}
      </div>

      {/* Node + edge count */}
      <div className="absolute top-3 right-3 z-10 rounded-lg border border-border bg-panel/90 px-3 py-2 backdrop-blur-sm">
        <span className="text-xs font-mono text-dim">
          {graphData.nodes?.length ?? 0} nodes · {graphData.edges?.length ?? 0} edges
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

      <ForceGraph2D
        ref={fgRef}
        width={dims.w}
        height={dims.h}
        graphData={{
          nodes: graphData.nodes ?? [],
          links: (graphData.edges ?? []).map(e => ({
            ...e,
            source: e.source,
            target: e.target,
          })),
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
          const type      = link.edge_type ?? 'comment'
          const base      = EDGE_TYPE_COLOR[type] ?? '#7c6af7'
          if (isHovered) return base
          const op = Math.min(0.5, (link.weight ?? 1) / 10 + 0.3)
          return `rgba(124,106,247,${op})`
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
        // onLinkClick={handleLinkClick}
        onLinkHover={handleLinkHover}
        onBackgroundClick={handleBackgroundClick}
        backgroundColor="#0a0a0f"
        linkDirectionalArrowLength={10}
        linkDirectionalArrowRelPos={0.92}
        linkDirectionalArrowColor={link => {
          const type = link.edge_type ?? 'comment'
          return EDGE_TYPE_COLOR[type] ?? 'rgba(124,106,247,0.5)'
        }}
        // linkCanvasObjectMode={() => 'after'}
        // ── Force simulation parameters ────────────────────────────────────
        cooldownTicks={200}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.2}
        // ──────────────────────────────────────────────────────────────────
        // Pin semua node setelah simulasi berhenti → tidak gerak sendiri
        onEngineStop={() => {
          const nodes = graphData?.nodes ?? []
          nodes.forEach(node => {
            node.fx = node.x
            node.fy = node.y
          })
        }}
        // Saat mulai drag: lepas pin node ini + reheat simulasi
        // agar tetangga ikut merespons tarikan
        onNodeDragStart={node => {
          node.fx = undefined
          node.fy = undefined
          fgRef.current?.d3ReheatSimulation()
        }}
        // Selama drag: ikut kursor
        onNodeDrag={node => {
          node.fx = node.x
          node.fy = node.y
        }}
        // Setelah drag: pin node di posisi akhir
        onNodeDragEnd={node => {
          node.fx = node.x
          node.fy = node.y
        }}
        enableNodeDrag
        enableZoomInteraction
        enablePanInteraction
      />
    </div>
  )
}
