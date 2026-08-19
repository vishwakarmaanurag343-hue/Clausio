'use client'

import React, { useState } from 'react'

interface FlashCardProps {
  title?: string
  badge?: string
  badgeColor?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate'
  icon?: string
  children?: React.ReactNode
  content?: any
  footer?: React.ReactNode
  copyable?: boolean
  defaultExpanded?: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * Intelligent FlashCard component that converts raw JSON or unstructured text
 * into beautiful, structured, interactive legal intelligence cards.
 */
export default function FlashCard({
  title,
  badge,
  badgeColor = 'blue',
  icon,
  children,
  content,
  footer,
  copyable = true,
  defaultExpanded = true,
  className = '',
  style = {},
}: FlashCardProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(defaultExpanded)

  const colorMap = {
    blue:   { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', iconBg: '#dbeafe' },
    green:  { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', iconBg: '#dcfce7' },
    amber:  { bg: '#fffbeb', border: '#fde68a', text: '#b45309', iconBg: '#fef3c7' },
    red:    { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', iconBg: '#fee2e2' },
    purple: { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce', iconBg: '#f3e8ff' },
    slate:  { bg: '#f8fafc', border: '#e2e8f0', text: '#475569', iconBg: '#f1f5f9' },
  }

  const badgeTheme = colorMap[badgeColor] || colorMap.blue

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    const textToCopy = typeof content === 'string' 
      ? content 
      : typeof content === 'object' 
        ? JSON.stringify(content, null, 2) 
        : title || ''
    
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      className={`flash-card ${className}`}
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.04)',
        transition: 'all 0.2s ease',
        marginBottom: 14,
        ...style,
      }}
    >
      {/* Header */}
      {(title || badge || icon || copyable) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: expanded ? 12 : 0,
            cursor: 'pointer',
          }}
          onClick={() => setExpanded(!expanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {icon && (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: badgeTheme.iconBg,
                  color: badgeTheme.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                <i className={`ti ${icon}`} />
              </div>
            )}
            {title && (
              <h3
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#0f172a',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {title}
              </h3>
            )}
            {badge && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  background: badgeTheme.bg,
                  border: `1px solid ${badgeTheme.border}`,
                  color: badgeTheme.text,
                  flexShrink: 0,
                }}
              >
                {badge}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {copyable && (
              <button
                onClick={handleCopy}
                title="Copy contents"
                style={{
                  background: copied ? '#f0fdf4' : '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: copied ? '#15803d' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s',
                }}
              >
                <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <i className={`ti ${expanded ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 14 }} />
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      {expanded && (
        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
          {children ? (
            children
          ) : content ? (
            <StructuredContentRenderer data={content} />
          ) : null}

          {footer && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 10,
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Intelligent JSON / Object renderer that renders key-value pairs, arrays,
 * judgments, and statutory provisions in clean UI blocks instead of raw text.
 */
export function StructuredContentRenderer({ data }: { data: any }) {
  if (data === null || data === undefined) return null

  // If simple string or number
  if (typeof data !== 'object') {
    return <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{String(data)}</p>
  }

  // If array of items
  if (Array.isArray(data)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '8px 12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              fontSize: 12,
            }}
          >
            {typeof item === 'object' ? (
              <StructuredContentRenderer data={item} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: '#2563eb', fontWeight: 700 }}>•</span>
                <span>{String(item)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  // If key-value object
  const entries = Object.entries(data)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
      {entries.map(([key, val]) => {
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase())

        return (
          <div
            key={key}
            style={{
              padding: '6px 10px',
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #f1f5f9',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: 2,
              }}
            >
              {formattedKey}
            </div>
            <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>
              {typeof val === 'object' ? (
                <StructuredContentRenderer data={val} />
              ) : (
                String(val)
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
