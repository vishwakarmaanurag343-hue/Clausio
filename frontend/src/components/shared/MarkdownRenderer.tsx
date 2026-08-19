'use client'

/**
 * MarkdownRenderer — converts raw AI markdown text into beautiful cards
 * Replaces all pre-wrap / whiteSpace: pre-wrap displays in Clausio
 * 
 * Usage:
 *   import MarkdownRenderer from '@/components/shared/MarkdownRenderer'
 *   <MarkdownRenderer text={rawAiOutput} />
 */

interface Props {
  text: string
  compact?: boolean
}

function parseMarkdown(text: string) {
  if (!text) return []

  const lines  = text.split('\n')
  const blocks: any[] = []
  let   i      = 0

  while (i < lines.length) {
    const line = lines[i]

    // H1
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2).trim() })
      i++
      continue
    }

    // H2
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() })
      i++
      continue
    }

    // H3
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', text: line.slice(4).trim() })
      i++
      continue
    }

    // Table
    if (line.startsWith('|')) {
      const tableLines = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      // Parse table
      const rows = tableLines
        .filter(l => !l.match(/^\|[\s\-|]+\|$/)) // skip separator rows
        .map(l => l.split('|').filter((_,idx,arr) => idx > 0 && idx < arr.length-1).map(c => c.trim()))
      if (rows.length > 0) {
        blocks.push({ type: 'table', headers: rows[0], rows: rows.slice(1) })
      }
      continue
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // Bullet list
    if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      const items = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* ') || lines[i].startsWith('• '))) {
        items.push(lines[i].slice(2).trim())
        i++
      }
      blocks.push({ type: 'list', items })
      continue
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const items = []
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, '').trim())
        i++
      }
      blocks.push({ type: 'olist', items })
      continue
    }

    // Bold paragraph (key: value)
    if (line.startsWith('**') && line.includes('**:')) {
      const match = line.match(/\*\*(.+?)\*\*:?\s*(.*)/)
      if (match) {
        blocks.push({ type: 'kv', key: match[1], value: match[2] })
        i++
        continue
      }
    }

    // Empty line — skip
    if (line.trim() === '') {
      i++
      continue
    }

    // Paragraph
    const paraLines = []
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('|') && !lines[i].startsWith('- ') && !lines[i].startsWith('* ') && !lines[i].match(/^\d+\.\s/) && !lines[i].match(/^---+$/)) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'para', text: paraLines.join(' ') })
    }
  }

  return blocks
}

function renderInline(text: string) {
  if (!text) return text
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>')
  // Code
  text = text.replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:11px;font-family:monospace">$1</code>')
  return text
}

function Inline({ text }: { text: string }) {
  return <span dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
}

function riskColor(text: string) {
  const t = text.toLowerCase()
  if (t.includes('high') || t.includes('critical') || t.includes('severe'))
    return { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626', badgeBg: '#fef2f2' }
  if (t.includes('medium') || t.includes('moderate') || t.includes('significant'))
    return { bg: '#fffbeb', border: '#fde68a', badge: '#d97706', badgeBg: '#fffbeb' }
  return { bg: '#f0fdf4', border: '#bbf7d0', badge: '#16a34a', badgeBg: '#f0fdf4' }
}

export default function MarkdownRenderer({ text, compact }: Props) {
  if (!text) return null

  const blocks = parseMarkdown(text)
  const pad    = compact ? 12 : 16

  return (
    <div style={{ fontFamily: 'Inter,-apple-system,sans-serif', fontSize: 13, color: '#0f172a', lineHeight: 1.7 }}>
      {blocks.map((block, idx) => {
        switch (block.type) {

          case 'h1':
            return (
              <div key={idx} style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>
                  <Inline text={block.text} />
                </h1>
              </div>
            )

          case 'h2':
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 10px', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, borderLeft: '3px solid #2563eb' }}>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e40af' }}>
                  <Inline text={block.text} />
                </h2>
              </div>
            )

          case 'h3':
            return (
              <h3 key={idx} style={{ margin: '14px 0 6px', fontSize: 13, fontWeight: 700, color: '#334155' }}>
                <Inline text={block.text} />
              </h3>
            )

          case 'hr':
            return <div key={idx} style={{ height: 1, background: '#e2e8f0', margin: '16px 0' }} />

          case 'kv':
            return (
              <div key={idx} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '0.5px solid #f1f5f9' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', flexShrink: 0, minWidth: 120 }}>
                  <Inline text={block.key} />
                </span>
                <span style={{ fontSize: 12, color: '#0f172a' }}>
                  <Inline text={block.value} />
                </span>
              </div>
            )

          case 'para':
            return (
              <p key={idx} style={{ margin: '0 0 10px', fontSize: 13, color: '#334155', lineHeight: 1.75 }}>
                <Inline text={block.text} />
              </p>
            )

          case 'list':
            return (
              <div key={idx} style={{ margin: '8px 0 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {block.items.map((item: string, j: number) => {
                  const colors = riskColor(item)
                  return (
                    <div key={j} style={{ display: 'flex', gap: 8, padding: '7px 10px', background: colors.bg, border: `0.5px solid ${colors.border}`, borderRadius: 7 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: colors.badge, flexShrink: 0, marginTop: 6 }} />
                      <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
                        <Inline text={item} />
                      </span>
                    </div>
                  )
                })}
              </div>
            )

          case 'olist':
            return (
              <div key={idx} style={{ margin: '8px 0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {block.items.map((item: string, j: number) => (
                  <div key={j} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{j + 1}</div>
                    <span style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>
                      <Inline text={item} />
                    </span>
                  </div>
                ))}
              </div>
            )

          case 'table':
            return (
              <div key={idx} style={{ margin: '10px 0 16px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr>
                      {block.headers.map((h: string, j: number) => (
                        <th key={j} style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                          <Inline text={h} />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row: string[], j: number) => {
                      const rowText = row.join(' ')
                      const colors  = riskColor(rowText)
                      return (
                        <tr key={j} style={{ background: j % 2 === 0 ? '#fff' : '#fafafa' }}>
                          {row.map((cell: string, k: number) => (
                            <td key={k} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', color: '#334155', verticalAlign: 'top', fontSize: 12 }}>
                              {(cell.toLowerCase().includes('high') || cell.toLowerCase().includes('critical') || cell.toLowerCase().includes('severe')) ? (
                                <span style={{ padding: '2px 8px', borderRadius: 20, background: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: 11 }}>
                                  <Inline text={cell} />
                                </span>
                              ) : (cell.toLowerCase().includes('medium') || cell.toLowerCase().includes('moderate')) ? (
                                <span style={{ padding: '2px 8px', borderRadius: 20, background: '#fffbeb', color: '#d97706', fontWeight: 600, fontSize: 11 }}>
                                  <Inline text={cell} />
                                </span>
                              ) : (cell.toLowerCase().includes('low') || cell.toLowerCase().includes('favorable')) ? (
                                <span style={{ padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: 11 }}>
                                  <Inline text={cell} />
                                </span>
                              ) : (
                                <Inline text={cell} />
                              )}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
