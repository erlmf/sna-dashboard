import { useRef, useEffect, useCallback, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Spinner } from './ui.jsx'

const PALETTE = [
  '#7c6af7','#22d3ee','#4ade80','#fbbf24','#f87171',
  '#a78bfa','#34d399','#fb923c','#60a5fa','#e879f9',
  '#facc15','#2dd4bf','#f472b6','#818cf8','#86efac',
]

const TIER_SIZE = { 1: 38, 2: 28, 3: 20, 4: 14, 5: 10 }

const EDGE_TYPE_COLOR = {
  'comment':         '#7c6af7',
  'comment+mention': '#22d3ee',
  'mention':         '#4ade80',
}

function communityColor(commId) {
  return PALETTE[(commId ?? 0) % PALETTE.length]
}

function EdgeTooltip({ edge, pos }) {
  if (!edge) return null
  const src    = typeof edge.source === 'object' ? edge.source.username : edge.source
  const tgt    = typeof edge.target === 'object' ? edge.target.username : edge.target
  const type   = edge.edge_type ?? edge.type ?? 'comment'
  const weight = edge.weight ?? 1
  const color  = EDGE_TYPE_COLOR[type] ?? '#7c6af7'

  return (
    <div className="absolute z-30 pointer-events-none" style={{ left: pos.x + 12, top: pos.y - 8 }}>
      <div className="rounded-xl border border-border bg-panel/95 backdrop-blur-md shadow-2xl p-3 min-w-48">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
          <span className="text-xs font-mono font-semibold" style={{ color }}>{type}</span>
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
          {src} commented on {tgt}'s post
        </p>
      </div>
    </div>
  )
}

export function NetworkGraph({ graphData, onNodeClick, selectedNode, filters }) {
  const fgRef        = useRef()
  const containerRef = useRef()
  const [dims, setDims]               = useState({ w: 800, h: 600 })
  const [edgeTooltip, setEdgeTooltip] = useState({ edge: null, pos: { x: 0, y: 0 } })
  const [hoveredEdge, setHoveredEdge] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setDims({ w: width, h: height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!fgRef.current || !graphData?.nodes?.length) return
    fgRef.current.d3Force('center')?.strength(0.02)
    fgRef.current.d3Force('charge')?.strength(-250)
    fgRef.current.d3Force('link')?.distance(link => {
      const w = link.weight ?? 1
      return 60 + (1 / w) * 120
    })
    setTimeout(() => fgRef.current?.zoomToFit(400, 60), 300)
  }, [graphData])

  const paintNode = useCallback((node, ctx, globalScale) => {
    const size       = TIER_SIZE[node.tier] ?? 4
    const color      = communityColor(node.community_id)
    const isSelected = selectedNode?.username === node.username

    if (isSelected || node.tier <= 2) {
      ctx.beginPath()
      ctx.arc(node.x, node.y, size + 5, 0, 2 * Math.PI)
      ctx.fillStyle = isSelected ? 'rgba(124,106,247,0.35)' : `${color}30`
      ctx.fill()
    }

    ctx.beginPath()
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()

    if (isSelected) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth   = 1.5 / globalScale
      ctx.stroke()
    }

    const label = node.username

    let fontSize
    if (node.tier === 1)      fontSize = Math.max(11 / globalScale, 4)
    else if (node.tier === 2) fontSize = Math.max(9 / globalScale, 3.5)
    else if (node.tier === 3) fontSize = Math.max(7 / globalScale, 3)
    else                      fontSize = Math.max(6 / globalScale, 2.5)

    ctx.font      = `${fontSize}px JetBrains Mono`
    ctx.textAlign = 'center'

    const textWidth = ctx.measureText(label).width
    const padding   = fontSize * 0.3

    if (node.tier <= 3 || globalScale > 2) {
      ctx.fillStyle = 'rgba(10,10,15,0.65)'
      ctx.beginPath()
      ctx.roundRect?.(
        node.x - textWidth / 2 - padding,
        node.y + size + 1,
        textWidth + padding * 2,
        fontSize + padding,
        2
      )
      ctx.fill()
    }

    ctx.fillStyle = node.tier <= 2 ? '#e8e8f0' : `rgba(232,232,240,${Math.min(0.9, globalScale * 0.4 + 0.3)})`
    ctx.fillText(label, node.x, node.y + size + fontSize + 1)
  }, [selectedNode])

  // ── REMOVED: paintLink tidak diperlukan lagi ──

  const handleLinkClick = useCallback((link, event) => {
    console.log('fired!', link?.source, link?.target, event?.clientX, event?.clientY)
    // const rect = containerRef.current?.getBoundingClientRect()
    // if (!rect) return
    // const e = event?.nativeEvent ?? event
    setEdgeTooltip({
      edge: link,
      pos: { x: event?.clientX ?? 300, y: event?.clientY ?? 300 }
    })
  }, [])

  const handleLinkHover = useCallback((link) => {
    setHoveredEdge(link)
    if (containerRef.current) {
      containerRef.current.style.cursor = link ? 'pointer' : 'grab'
    }
  }, [])

  if (!graphData) {
    return (
      <div className="flex items-center justify-center h-full text-dim">
        <Spinner size={32} />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full h-full graph-canvas">

      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 rounded-lg border border-border bg-panel/90 p-3 backdrop-blur-sm">
        <span className="text-xs font-display font-semibold text-dim uppercase tracking-wider mb-1">Communities</span>
        {PALETTE.slice(0, 8).map((color, i) => (
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
          {graphData.nodes?.length ?? 0} nodes · {graphData.edges?.length ?? 0} edges
        </span>
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-full border border-border bg-panel/80 px-3 py-1 backdrop-blur-sm">
        <span className="text-[10px] font-mono text-dim">
          click node for details · click edge for interaction info
        </span>
      </div>

      <ForceGraph2D
        ref={fgRef}
        width={dims.w}
        height={dims.h}
        graphData={{
          nodes: graphData.nodes ?? [],
          links: (graphData.edges ?? []).map(e => ({ ...e })),
        }}
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => 'replace'}
        nodePointerAreaPaint={(node, color, ctx) => {
          const size = (TIER_SIZE[node.tier] ?? 4) 
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)
          ctx.fill()
        }}

        linkPointerAreaPaint={(link, color, ctx) => {
          const start = link.source
          const end   = link.target
          if (!start || !end || typeof start !== 'object') return
          ctx.strokeStyle = color
          ctx.lineWidth   = 10  // area klik 10px, lebih gede dari visual
          ctx.beginPath()
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          ctx.stroke()
        }}

        // ── CHANGED: ganti transparent + linkCanvasObject → pakai linkColor & linkWidth bawaan ──
        linkHoverPrecision={20}
        linkColor={link => {
          const isHovered = hoveredEdge === link
          const type      = link.edge_type ?? 'comment'
          const base      = EDGE_TYPE_COLOR[type] ?? '#7c6af7'
          if (isHovered) return base
          const op = Math.min(0.5, (link.weight ?? 1) / 10 + 0.3)
          return `rgba(124,106,247,${op})`
        }}
        linkWidth={link => {
          const isHovered = hoveredEdge === link
          const base = Math.max(4, 1 + Math.log1p(link.weight ?? 1))
          return isHovered ? base * 2 : base
        }}
        // ── REMOVED: linkCanvasObject & linkCanvasObjectMode ──

        onNodeClick={node => {
          setEdgeTooltip({ edge: null, pos: { x: 0, y: 0 } })
          onNodeClick?.(node)
        }}
        onLinkClick={handleLinkClick}
        onLinkHover={handleLinkHover}
        onBackgroundClick={() => setEdgeTooltip({ edge: null, pos: { x: 0, y: 0 } })}
        backgroundColor="#0a0a0f"
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={link => EDGE_TYPE_COLOR[link.edge_type ?? 'comment'] ?? 'rgba(124,106,247,0.5)'}
        cooldownTicks={120}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
        onEngineStop={() => {
          graphData?.nodes?.forEach(node => {
            node.fx = node.x
            node.fy = node.y
          })
          fgRef.current?.pauseAnimation() 
        }}
        onNodeDragEnd={node => {
          node.fx = node.x
          node.fy = node.y
        }}
        enableNodeDrag
        enableZoomInteraction
        enablePanInteraction
      />

      <EdgeTooltip edge={edgeTooltip.edge} pos={edgeTooltip.pos} />
    </div>
  )
}