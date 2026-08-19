'use client'

import React, { useState, useRef } from 'react'

export interface SerpentineTimelineItem {
  id: string | number
  date: string
  year?: string | number
  title: string
  description?: string
  category?: string
  source?: string
  isMajorMilestone?: boolean
  highlightColor?: 'red' | 'blue' | 'grey' | 'green' | 'amber'
}

interface SerpentineTimelineProps {
  items: SerpentineTimelineItem[]
  title?: string
  onItemClick?: (item: SerpentineTimelineItem) => void
}

export default function SerpentineTimeline({ items, title, onItemClick }: SerpentineTimelineProps) {
  // Canvas zoom & pan state
  const [scale, setScale] = useState<number>(1)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 30, y: 30 })
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Selected item modal/drawer state
  const [selectedItem, setSelectedItem] = useState<SerpentineTimelineItem | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  // Layout Grid Parameters (Matching the Reference Image)
  const ITEMS_PER_ROW = 5
  const NODE_SPACING_X = 210
  const ROW_SPACING_Y = 190
  const START_X = 100
  const START_Y = 90

  // Calculate coordinates for each node in a Snake / Serpentine Path
  const nodePositions = items.map((item, index) => {
    const row = Math.floor(index / ITEMS_PER_ROW)
    const indexInRow = index % ITEMS_PER_ROW
    const isEvenRow = row % 2 === 0

    // Left-to-right on even rows, right-to-left on odd rows
    const col = isEvenRow ? indexInRow : (ITEMS_PER_ROW - 1 - indexInRow)
    const x = START_X + col * NODE_SPACING_X
    const y = START_Y + row * ROW_SPACING_Y

    return { x, y, row, col, isEvenRow, index }
  })

  // Wheel Zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = 1.08
    let newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor
    newScale = Math.min(Math.max(0.4, newScale), 2.2)
    setScale(newScale)
  }

  // Pointer drag for panning
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('.timeline-node') || (e.target as HTMLElement).closest('button')) {
      return
    }
    setIsPanning(true)
    setPanStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return
    setPosition({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsPanning(false)
    if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId)
    }
  }

  // Zoom HUD controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.15, 2.2))
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.15, 0.4))
  const handleResetZoom = () => {
    setScale(1)
    setPosition({ x: 30, y: 30 })
  }

  const totalRows = Math.ceil(items.length / ITEMS_PER_ROW)
  const canvasWidth = START_X * 2 + (ITEMS_PER_ROW - 1) * NODE_SPACING_X + 160
  const canvasHeight = START_Y * 2 + Math.max(totalRows - 1, 1) * ROW_SPACING_Y + 160

  // Generate continuous SVG Serpentine track with smooth U-turns
  const generateTrackPath = () => {
    if (nodePositions.length <= 1) return ''

    let path = `M ${nodePositions[0].x} ${nodePositions[0].y}`
    const rowsCount = Math.ceil(nodePositions.length / ITEMS_PER_ROW)

    for (let r = 0; r < rowsCount; r++) {
      const isEven = r % 2 === 0
      const rowNodes = nodePositions.filter(p => p.row === r)
      if (rowNodes.length === 0) continue

      // Straight horizontal segment across the row
      if (isEven) {
        const lastNodeInRow = rowNodes[rowNodes.length - 1]
        path += ` L ${lastNodeInRow.x} ${lastNodeInRow.y}`

        // If there is a next row, draw Right-Hand U-Turn
        if (r < rowsCount - 1) {
          const nextRowFirstNode = nodePositions.find(p => p.row === r + 1)
          if (nextRowFirstNode) {
            const uTurnRadius = ROW_SPACING_Y / 2
            const arcEndX = lastNodeInRow.x
            const arcEndY = lastNodeInRow.y + ROW_SPACING_Y
            // Semi-circular arc right side: sweep-flag = 1
            path += ` A ${uTurnRadius * 0.75} ${uTurnRadius} 0 0 1 ${arcEndX} ${arcEndY}`
          }
        }
      } else {
        const lastNodeInRow = rowNodes[rowNodes.length - 1]
        path += ` L ${lastNodeInRow.x} ${lastNodeInRow.y}`

        // If there is a next row, draw Left-Hand U-Turn
        if (r < rowsCount - 1) {
          const nextRowFirstNode = nodePositions.find(p => p.row === r + 1)
          if (nextRowFirstNode) {
            const uTurnRadius = ROW_SPACING_Y / 2
            const arcEndX = lastNodeInRow.x
            const arcEndY = lastNodeInRow.y + ROW_SPACING_Y
            // Semi-circular arc left side: sweep-flag = 0
            path += ` A ${uTurnRadius * 0.75} ${uTurnRadius} 0 0 0 ${arcEndX} ${arcEndY}`
          }
        }
      }
    }

    return path
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 560,
        background: '#f4f4f2', // Warm neutral editorial background as in reference image
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : 'grab',
        userSelect: 'none',
        borderRadius: 14,
        border: '1px solid #e5e5e0',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
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
          backdropFilter: 'blur(12px)',
          border: '1px solid #e2e8f0',
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
          title="Reset View"
          style={{
            border: 'none', background: '#f1f5f9', padding: '4px 10px',
            borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4,
            cursor: 'pointer', color: '#334155', fontSize: 11, fontWeight: 600
          }}
        >
          <i className="ti ti-arrows-maximize" /> Reset View
        </button>
      </div>

      {/* ── CANVAS HINT WATERMARK ── */}
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
          padding: '5px 12px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 500,
          color: '#555',
          border: '1px solid #e0e0db',
          pointerEvents: 'none'
        }}
      >
        <i className="ti ti-timeline" /> <strong>Serpentine Timeline:</strong> Sequential Left-to-Right & Winding Flow | <strong>Click Node:</strong> Inspect Full Evidence
      </div>

      {/* ── ZOOMABLE & PANNABLE WORLD ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: isPanning ? 'none' : 'transform 0.08s ease-out',
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        {/* ── SVG SERPENTINE DOTTED AXIS TRACK (Matches Reference Image) ── */}
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
          {/* Continuous Dashed Snake Line */}
          <path
            d={generateTrackPath()}
            fill="none"
            stroke="#8c8c88"
            strokeWidth="1.8"
            strokeDasharray="4 5"
          />

          {/* Small Vertical Stems from Node to Text */}
          {nodePositions.map((pos, i) => (
            <line
              key={`stem-${i}`}
              x1={pos.x}
              y1={pos.y - 8}
              x2={pos.x}
              y2={pos.y - 24}
              stroke="#e11d48"
              strokeWidth="1.5"
              opacity={items[i]?.isMajorMilestone || i === 0 ? 1 : 0.4}
            />
          ))}
        </svg>

        {/* ── TIMELINE MILESTONE NODES & EDITORIAL LABELS ── */}
        {items.map((item, index) => {
          const pos = nodePositions[index]
          const isMilestone = item.isMajorMilestone || index === 0 || (item.year && index > 0 && item.year !== items[index - 1]?.year)
          const dotColor = isMilestone ? '#e11d48' : '#64748b' // Magenta/Red for milestone, Slate/Grey for normal

          return (
            <div
              key={item.id ?? index}
              className="timeline-node"
              onClick={(e) => {
                e.stopPropagation()
                setSelectedItem(item)
                if (onItemClick) onItemClick(item)
              }}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                zIndex: 20
              }}
            >
              {/* Top Text Block (Year & Date) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 18,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 170,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  pointerEvents: 'auto'
                }}
              >
                {/* Milestone Year Header in Pink/Red (Matching Reference Image) */}
                {(item.year || isMilestone) && (
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#e11d48', letterSpacing: '-0.2px' }}>
                    {item.year || (item.date ? item.date.split(' ').pop() : '')}
                  </span>
                )}

                {/* Date Heading */}
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.25 }}>
                  {item.date}
                </span>

                {/* Short Event Description Headline */}
                <span style={{
                  fontSize: 11,
                  color: '#4a4a4a',
                  lineHeight: 1.35,
                  marginTop: 2,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.title}
                </span>
              </div>

              {/* Center Dot Node (Pink/Red or Slate Grey circle with white outline) */}
              <div
                style={{
                  width: isMilestone ? 16 : 13,
                  height: isMilestone ? 16 : 13,
                  borderRadius: '50%',
                  background: dotColor,
                  border: '2.5px solid #f4f4f2',
                  boxShadow: `0 0 0 1.5px ${dotColor}`,
                  transition: 'transform 0.15s ease-out, box-shadow 0.15s',
                  transform: selectedItem?.id === item.id ? 'scale(1.3)' : 'scale(1)'
                }}
              />
            </div>
          )
        })}
      </div>

      {/* ── EXPANDED FULL EVIDENCE DETAIL DRAWER / POPUP ── */}
      {selectedItem && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            zIndex: 100,
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: 16,
            maxWidth: 420,
            width: '90%',
            boxShadow: '0 20px 35px -10px rgba(0,0,0,0.18)',
            padding: '16px 20px',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: '#fef2f2', color: '#e11d48', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                📅 {selectedItem.date}
              </span>
              {selectedItem.category && (
                <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 12, fontSize: 10.5, fontWeight: 600 }}>
                  {selectedItem.category}
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: '#94a3b8' }}
            >
              ✕
            </button>
          </div>

          <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.35 }}>
            {selectedItem.title}
          </h4>

          {selectedItem.description && (
            <p style={{ margin: 0, fontSize: 12.5, color: '#334155', lineHeight: 1.6, maxHeight: 180, overflowY: 'auto' }}>
              {selectedItem.description}
            </p>
          )}

          {selectedItem.source && (
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9', fontSize: 10.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-file-text" /> Source: {selectedItem.source}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
