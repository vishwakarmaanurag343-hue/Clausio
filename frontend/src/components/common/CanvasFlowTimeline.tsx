'use client'

import React, { useState, useRef, useEffect } from 'react'

export interface CanvasCardItem {
  id: string | number
  stepNumber: number | string
  badgeText?: string
  badgeColor?: 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'dark'
  title: string
  icon?: string
  description: string
  source?: string
  date?: string
  category?: string
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical'
  tags?: string[]
}

interface CanvasFlowProps {
  items: CanvasCardItem[]
  title?: string
  onCardClick?: (item: CanvasCardItem) => void
}

export default function CanvasFlowTimeline({ items, title, onCardClick }: CanvasFlowProps) {
  // Canvas Transformation State (Pan & Zoom)
  const [scale, setScale] = useState<number>(1)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 60, y: 60 })
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Expanded Card ID (In-Canvas Expansion)
  const [expandedCardId, setExpandedCardId] = useState<string | number | null>(null)

  // Card dragging & free movement state
  const [customOffsets, setCustomOffsets] = useState<Record<string | number, { x: number; y: number }>>({})
  const [draggingCardId, setDraggingCardId] = useState<string | number | null>(null)
  const [cardDragStart, setCardDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [hasMovedDuringClick, setHasMovedDuringClick] = useState<boolean>(false)

  const containerRef = useRef<HTMLDivElement>(null)

  const CARD_WIDTH = 350
  const DEFAULT_CARD_HEIGHT = 155
  const GAP_X = 140
  const GAP_Y = 110

  // Calculate default staggered layout coordinates
  const getDefaultPosition = (index: number) => {
    const col = index % 3
    const row = Math.floor(index / 3)
    const x = col * (CARD_WIDTH + GAP_X) + (row % 2 === 1 ? 80 : 0)
    const y = row * (DEFAULT_CARD_HEIGHT + GAP_Y) + (col * 30)
    return { x, y }
  }

  // Get current position (default + any user manual drag offset)
  const getCardPosition = (item: CanvasCardItem, index: number) => {
    const def = getDefaultPosition(index)
    const offset = customOffsets[item.id] || { x: 0, y: 0 }
    return {
      x: def.x + offset.x,
      y: def.y + offset.y
    }
  }

  // Wheel Zoom (Zoom around mouse or center, but allow internal card scrolling)
  const handleWheel = (e: React.WheelEvent) => {
    // If scrolling inside an expanded card content area, don't zoom canvas!
    if ((e.target as HTMLElement).closest('.card-scroll-area')) {
      e.stopPropagation()
      return
    }

    e.preventDefault()
    const zoomFactor = 1.08
    let newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor
    newScale = Math.min(Math.max(0.35, newScale), 2.5)
    setScale(newScale)
  }

  // Canvas Pan (Pointer Down on canvas background)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // If user clicked directly on a card or button, don't pan canvas
    if ((e.target as HTMLElement).closest('.flow-card') || (e.target as HTMLElement).closest('button')) {
      return
    }

    setIsPanning(true)
    setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    // 1. Moving an individual card freely across the canvas
    if (draggingCardId !== null) {
      setHasMovedDuringClick(true)
      const dx = (e.clientX - cardDragStart.x) / scale
      const dy = (e.clientY - cardDragStart.y) / scale
      
      setCustomOffsets(prev => {
        const current = prev[draggingCardId] || { x: 0, y: 0 }
        return {
          ...prev,
          [draggingCardId]: {
            x: current.x + dx,
            y: current.y + dy
          }
        }
      })
      setCardDragStart({ x: e.clientX, y: e.clientY })
      return
    }

    // 2. Panning the whole canvas
    if (isPanning) {
      setPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingCardId !== null) {
      setDraggingCardId(null)
    }
    if (isPanning) {
      setIsPanning(false)
      if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId)
      }
    }
  }

  // Zoom HUD controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.15, 2.5))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.15, 0.35))
  const handleResetZoom = () => {
    setScale(1)
    setPosition({ x: 60, y: 60 })
    setCustomOffsets({})
    setExpandedCardId(null)
  }

  // Badge / Pill Color scheme
  const getBadgeStyle = (badgeColor?: string) => {
    switch (badgeColor) {
      case 'green':
        return { pillBg: '#15803d', cardBg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a', text: '#14532d' }
      case 'red':
        return { pillBg: '#b91c1c', cardBg: '#fef2f2', border: '#fecaca', dot: '#dc2626', text: '#7f1d1d' }
      case 'amber':
        return { pillBg: '#b45309', cardBg: '#fffbeb', border: '#fde68a', dot: '#d97706', text: '#78350f' }
      case 'purple':
        return { pillBg: '#6d28d9', cardBg: '#f5f3ff', border: '#ddd6fe', dot: '#7c3aed', text: '#4c1d95' }
      case 'blue':
        return { pillBg: '#1d4ed8', cardBg: '#eff6ff', border: '#bfdbfe', dot: '#2563eb', text: '#1e3a8a' }
      default:
        return { pillBg: '#0f172a', cardBg: '#ffffff', border: '#e2e8f0', dot: '#475569', text: '#0f172a' }
    }
  }

  // Summary preview clean helper (strips markdown headers/bullets for neat 2-line preview)
  const getCleanSummary = (text: string) => {
    const clean = text
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/^[-\*\d\.]+\s+/gm, '')
      .trim()
    return clean.length > 130 ? clean.substring(0, 130) + '...' : clean
  }

  const allPositions = items.map((item, i) => getCardPosition(item, i))
  const maxX = Math.max(...allPositions.map(p => p.x), 800) + CARD_WIDTH + 500
  const maxY = Math.max(...allPositions.map(p => p.y), 600) + DEFAULT_CARD_HEIGHT + 500

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 580,
        background: '#f8fafc',
        backgroundImage: `
          radial-gradient(#cbd5e1 1.2px, transparent 1.2px)
        `,
        backgroundSize: '24px 24px',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : draggingCardId !== null ? 'grabbing' : 'grab',
        userSelect: 'none',
        borderRadius: 14,
        border: '1px solid #e2e8f0',
      }}
    >
      {/* ── TOP CONTROLS & HUD ── */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px) saturate(180%)',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          borderRadius: 10,
          padding: '4px 8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}
      >
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{
            border: 'none', background: 'transparent', width: 28, height: 28,
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#475569', fontSize: 15, fontWeight: 700
          }}
        >
          <i className="ti ti-minus" />
        </button>

        <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', minWidth: 44, textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={{
            border: 'none', background: 'transparent', width: 28, height: 28,
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#475569', fontSize: 15, fontWeight: 700
          }}
        >
          <i className="ti ti-plus" />
        </button>

        <div style={{ width: 1, height: 16, background: '#e2e8f0', margin: '0 2px' }} />

        <button
          onClick={handleResetZoom}
          title="Reset View & Card Layout"
          style={{
            border: 'none', background: '#f1f5f9', padding: '4px 10px',
            borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4,
            cursor: 'pointer', color: '#334155', fontSize: 11, fontWeight: 600
          }}
        >
          <i className="ti ti-arrows-maximize" /> Reset Canvas
        </button>
      </div>

      {/* ── CANVAS HELPER WATERMARK ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '5px 12px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 500,
          color: '#475569',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          pointerEvents: 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
        }}
      >
        <i className="ti ti-arrows-move" /> <strong>Free Drag:</strong> Move any card | <strong>Zoom:</strong> Mouse Wheel | <strong>Click Card:</strong> Expand / Collapse
      </div>

      {/* ── ZOOMABLE & PANNABLE WORLD ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: isPanning || draggingCardId !== null ? 'none' : 'transform 0.08s ease-out',
          width: maxX,
          height: maxY,
        }}
      >
        {/* ── DYNAMIC SVG CONNECTOR ARROWS (Connected between live positions) ── */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible'
          }}
        >
          <defs>
            <marker
              id="arrowhead-canvas"
              markerWidth="8"
              markerHeight="6"
              refX="6"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
            </marker>
          </defs>

          {items.map((item, idx) => {
            if (idx === items.length - 1) return null
            const currPos = getCardPosition(item, idx)
            const nextPos = getCardPosition(items[idx + 1], idx + 1)
            const isCurrExpanded = expandedCardId === item.id
            const currHeight = isCurrExpanded ? 320 : DEFAULT_CARD_HEIGHT

            const startX = currPos.x + CARD_WIDTH
            const startY = currPos.y + currHeight / 2

            const endX = nextPos.x
            const endY = nextPos.y + DEFAULT_CARD_HEIGHT / 2

            const deltaX = endX - startX
            const cp1X = startX + Math.max(deltaX * 0.5, 40)
            const cp1Y = startY
            const cp2X = endX - Math.max(deltaX * 0.5, 40)
            const cp2Y = endY

            const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`

            return (
              <g key={`path-${idx}`}>
                <path
                  d={pathD}
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  markerEnd="url(#arrowhead-canvas)"
                />
              </g>
            )
          })}
        </svg>

        {/* ── DRAGGABLE FLOW CARDS (EXPAND IN-PLACE ON THE CANVAS) ── */}
        {items.map((item, index) => {
          const pos = getCardPosition(item, index)
          const style = getBadgeStyle(item.badgeColor)
          const isBeingDragged = draggingCardId === item.id
          const isExpanded = expandedCardId === item.id

          return (
            <div
              key={item.id ?? index}
              className="flow-card"
              onPointerDown={(e) => {
                e.stopPropagation()
                setHasMovedDuringClick(false)
                setDraggingCardId(item.id)
                setCardDragStart({ x: e.clientX, y: e.clientY })
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (!hasMovedDuringClick) {
                  setExpandedCardId(isExpanded ? null : item.id)
                  if (onCardClick) onCardClick(item)
                }
              }}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: isExpanded ? 480 : CARD_WIDTH,
                height: isExpanded ? 'auto' : DEFAULT_CARD_HEIGHT,
                minHeight: DEFAULT_CARD_HEIGHT,
                maxHeight: isExpanded ? 500 : DEFAULT_CARD_HEIGHT,
                background: style.cardBg,
                border: `2px solid ${isExpanded ? '#2563eb' : isBeingDragged ? '#2563eb' : style.border}`,
                borderRadius: 18,
                padding: '16px 18px',
                display: 'flex',
                gap: 14,
                boxShadow: isExpanded
                  ? '0 20px 38px rgba(0,0,0,0.15), 0 8px 16px rgba(37,99,235,0.12)'
                  : isBeingDragged
                  ? '0 20px 32px rgba(37,99,235,0.25), 0 4px 12px rgba(0,0,0,0.1)'
                  : '0 4px 16px rgba(0,0,0,0.04)',
                cursor: isBeingDragged ? 'grabbing' : 'grab',
                zIndex: isExpanded ? 40 : isBeingDragged ? 30 : 10,
                transform: isBeingDragged ? 'scale(1.03)' : 'scale(1)',
                transition: isBeingDragged ? 'none' : 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.15s ease-out, border 0.15s',
              }}
            >
              {/* Vertical Side Pill (as in reference image) */}
              <div
                style={{
                  width: 32,
                  borderRadius: 16,
                  background: style.pillBg,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  padding: '12px 0',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.25)'
                }}
              >
                {item.badgeText || `Point ${item.stepNumber}`}
              </div>

              {/* Card Body */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Header: Step Number & Title */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    {item.icon && <span style={{ fontSize: 14 }}>{item.icon}</span>}
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                      {item.stepNumber}. {item.title}
                    </h4>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedCardId(isExpanded ? null : item.id)
                    }}
                    style={{
                      background: isExpanded ? '#2563eb' : '#ffffff',
                      color: isExpanded ? '#ffffff' : '#64748b',
                      border: `1px solid ${isExpanded ? '#2563eb' : '#cbd5e1'}`,
                      width: 24, height: 24, borderRadius: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, cursor: 'pointer'
                    }}
                    title={isExpanded ? 'Collapse' : 'Expand on Canvas'}
                  >
                    <i className={`ti ${isExpanded ? 'ti-chevron-up' : 'ti-arrows-diagonal'}`} />
                  </button>
                </div>

                {/* Date & Category Tag */}
                {(item.date || item.category) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                    {item.date && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: style.text, background: '#ffffff', border: `1px solid ${style.border}`, padding: '2px 6px', borderRadius: 6 }}>
                        📅 {item.date}
                      </span>
                    )}
                    {item.category && (
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', background: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: 6 }}>
                        {item.category}
                      </span>
                    )}
                  </div>
                )}

                {/* Collapsed State: 2-3 Line Clean Summary */}
                {!isExpanded && (
                  <p style={{
                    margin: 0,
                    fontSize: 12,
                    color: '#334155',
                    lineHeight: 1.5,
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {getCleanSummary(item.description)}
                  </p>
                )}

                {/* Expanded State: Full Uncut Details Directly In-Canvas */}
                {isExpanded && (
                  <div
                    className="card-scroll-area"
                    onWheel={(e) => {
                      e.stopPropagation()
                    }}
                    style={{
                      marginTop: 6,
                      fontSize: 12.5,
                      color: '#1e293b',
                      lineHeight: 1.65,
                      maxHeight: 280,
                      overflowY: 'auto',
                      paddingRight: 6,
                      userSelect: 'text',
                      cursor: 'default'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: item.description
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                        .replace(/^[-\*]\s+(.+)$/gm, '<li style="margin-bottom:6px;">$1</li>')
                        .replace(/\n\n/g, '<br /><br />')
                    }}
                  />
                )}

                {/* Bottom Source & Action Footer */}
                <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: '#64748b' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                    {item.source || 'Evidence Intelligence'}
                  </span>
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>
                    {isExpanded ? 'Click to collapse ▴' : 'Click to expand ▾'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
