'use client'

import React from 'react'
import { parseAiJson } from '@/lib/api'

interface Props {
  content: string | any
  citationCallback?: (title: string, content: string) => void
}

// ── FLASH CARD WRAPPER ────────────────────────────────────────────────
function FlashCard({
  title, icon, badge, badgeColor, borderColor, bgColor, children
}: {
  title?: string
  icon?: string
  badge?: string
  badgeColor?: string
  borderColor?: string
  bgColor?: string
  children: React.ReactNode
}) {
  const badgeStyles: Record<string, { bg: string; color: string }> = {
    green:  { bg: '#f0fdf4', color: '#16a34a' },
    red:    { bg: '#fef2f2', color: '#dc2626' },
    amber:  { bg: '#fffbeb', color: '#d97706' },
    blue:   { bg: '#eff6ff', color: '#2563eb' },
    purple: { bg: '#eef2ff', color: '#4f46e5' },
    slate:  { bg: '#f8fafc', color: '#475569' },
  }
  const bs = badgeColor ? badgeStyles[badgeColor] ?? badgeStyles.blue : null

  return (
    <div style={{
      background: bgColor ?? '#fff',
      border: `1.5px solid ${borderColor ?? '#e2e8f0'}`,
      borderRadius: 14,
      padding: '18px 20px',
      marginBottom: 14,
      fontFamily: 'Inter,-apple-system,sans-serif',
      boxShadow: '0 1px 6px rgba(0,0,0,.04)'
    }}>
      {(title || badge) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
          {icon && (
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
              {icon}
            </div>
          )}
          {title && <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', flex: 1 }}>{title}</div>}
          {badge && bs && (
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bs.bg, color: bs.color, flexShrink: 0 }}>
              {badge}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

// ── PROBABILITY GRID ──────────────────────────────────────────────────
function ProbGrid({ favorable, partial, adverse }: { favorable: number; partial: number; adverse: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
      {[
        { label: '✅ Favorable', value: favorable, bg: '#f0fdf4', border: '#86efac', color: '#16a34a' },
        { label: '⚠️ Partial',   value: partial,   bg: '#fffbeb', border: '#fcd34d', color: '#d97706' },
        { label: '❌ Adverse',   value: adverse,   bg: '#fef2f2', border: '#fca5a5', color: '#dc2626' },
      ].map((p, i) => (
        <div key={i} style={{ background: p.bg, border: `1.5px solid ${p.border}`, borderRadius: 12, padding: '16px 8px', textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: p.color, letterSpacing: -1 }}>{p.value}%</div>
          <div style={{ fontSize: 11, fontWeight: 500, color: p.color, marginTop: 4 }}>{p.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── BULLET ITEM ───────────────────────────────────────────────────────
function BulletItem({ text, color }: { text: string; color: 'green' | 'red' | 'amber' | 'blue' | 'purple' }) {
  const map = {
    green:  { bg: '#f0fdf4', border: '#bbf7d0', dot: '#16a34a', text: '#15803d', icon: 'ti-check', label: 'Favorable / Compliant' },
    red:    { bg: '#fef2f2', border: '#fecaca', dot: '#dc2626', text: '#b91c1c', icon: 'ti-alert-triangle', label: 'Risk / Adverse Flag' },
    amber:  { bg: '#fffbeb', border: '#fef3c7', dot: '#d97706', text: '#b45309', icon: 'ti-clock', label: 'Under Review / Pending' },
    blue:   { bg: '#eff6ff', border: '#bfdbfe', dot: '#2563eb', text: '#1d4ed8', icon: 'ti-info-circle', label: 'Fact / Evidence' },
    purple: { bg: '#f5f3ff', border: '#ddd6fe', dot: '#7c3aed', text: '#6d28d9', icon: 'ti-scale', label: 'Legal Statute' },
  }
  const c = map[color]
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      padding: '12px 16px', borderRadius: 12, marginBottom: 10,
      border: `1.5px solid ${c.border}`, background: c.bg,
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      transition: 'all 0.15s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: c.text }}>
          <i className={`ti ${c.icon}`} style={{ fontSize: 13 }} />
          <span>{c.label}</span>
        </div>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.65, color: '#1e293b' }} dangerouslySetInnerHTML={{ __html: boldify(text) }} />
    </div>
  )
}

// ── NUMBERED ITEM ─────────────────────────────────────────────────────
function NumItem({ num, title, sub, priority }: { num: number | string; title: string; sub?: string; priority?: string }) {
  const p = (priority ?? '').toLowerCase()
  const isRed   = p.includes('critical') || p.includes('high')
  const isAmber = p.includes('medium')
  const c = isRed
    ? { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626', text: '#dc2626' }
    : isAmber
    ? { bg: '#fffbeb', border: '#fcd34d', badge: '#d97706', text: '#d97706' }
    : { bg: '#eff6ff', border: '#93c5fd', badge: '#2563eb', text: '#2563eb' }
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 10, marginBottom: 8, border: `1.5px solid ${c.border}`, background: c.bg, alignItems: 'flex-start' }}>
      <div style={{ width: 24, height: 24, borderRadius: 7, background: c.badge, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{num}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }} dangerouslySetInnerHTML={{ __html: boldify(title) }} />
        {sub && <div style={{ fontSize: 12, color: c.text, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── KV ROW ────────────────────────────────────────────────────────────
function KVRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #f1f5f9', gap: 16, fontSize: 13 }}>
      <span style={{ color: '#64748b', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#0f172a', fontWeight: 600, textAlign: 'right' }} dangerouslySetInnerHTML={{ __html: boldify(value) }} />
    </div>
  )
}

// ── TABLE ─────────────────────────────────────────────────────────────
function RiskTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => {
                const cl = cell.toLowerCase()
                const isHigh   = cl.includes('high') || cl.includes('critical') || cl.includes('severe')
                const isMedium = cl.includes('medium') || cl.includes('moderate')
                const isLow    = cl.includes('low') || cl.includes('favorable')
                const chip = isHigh
                  ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#fef2f2', color: '#dc2626' }}>{cell}</span>
                  : isMedium
                  ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#fffbeb', color: '#d97706' }}>{cell}</span>
                  : isLow
                  ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#f0fdf4', color: '#16a34a' }}>{cell}</span>
                  : null
                return (
                  <td key={j} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', color: '#0f172a', verticalAlign: 'top' }}>
                    {chip ?? <span dangerouslySetInnerHTML={{ __html: boldify(cell) }} />}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── SECTION DIVIDER ───────────────────────────────────────────────────
function SectionDivider({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 8px', paddingLeft: 2 }}>
      {text}
    </div>
  )
}

// ── HELPERS ───────────────────────────────────────────────────────────
function boldify(text: string) {
  if (!text) return ''
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<strong>$1</strong>')
    .replace(/\*\*/g, '')
    .replace(/^\*\s*/g, '')
}

function detectColor(text: string): 'green' | 'red' | 'amber' | 'blue' | 'purple' {
  const t = text.toLowerCase()
  // Adverse / Dangerous / Red Flags
  if (
    t.includes('chargesheet') || t.includes('misappropriation') || t.includes('misconduct') ||
    t.includes('suspicious') || t.includes('unnatural death') || t.includes('positive') ||
    t.includes('ketamine') || t.includes('poison') || t.includes('adverse') ||
    t.includes('risk') || t.includes('weak') || t.includes('danger') || t.includes('critical') ||
    t.includes('assault') || t.includes('dowry') || t.includes('default') || t.includes('fail') ||
    t.includes('objected') || t.includes('congestion') || t.includes('edema')
  ) return 'red'

  // Favorable / Positive / Green Flags
  if (
    t.includes('negative for') || t.includes('negative') || t.includes('due compliance') ||
    t.includes('natural justice') || t.includes('favorable') || t.includes('strength') ||
    t.includes('strong') || t.includes('support') || t.includes('good') || t.includes('discharged') ||
    t.includes('acquitted') || t.includes('valid') || t.includes('timely')
  ) return 'green'

  // Caution / Pending / Amber
  if (
    t.includes('interim') || t.includes('pending') || t.includes('medium') ||
    t.includes('moderate') || t.includes('consider') || t.includes('may') ||
    t.includes('fsl report') || t.includes('examination') || t.includes('call data')
  ) return 'amber'

  // Law / Section / Court / Purple
  if (t.includes('section 174') || t.includes('section') || t.includes('crpc') || t.includes('ipc') || t.includes('hma') || t.includes('court')) return 'purple'

  return 'blue'
}

function detectPriority(text: string): string | undefined {
  const t = text.toLowerCase()
  if (t.includes('immediately') || t.includes('critical') || t.includes('urgent') || t.includes('24 hr')) return 'Critical'
  if (t.includes('high') || t.includes('important')) return 'High'
  if (t.includes('medium') || t.includes('moderate')) return 'Medium'
  return undefined
}

function sectionIcon(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('verdict') || t.includes('probability') || t.includes('outcome')) return '⚖️'
  if (t.includes('strength')) return '💪'
  if (t.includes('risk') || t.includes('weak') || t.includes('danger') || t.includes('misconduct')) return '⚠️'
  if (t.includes('action') || t.includes('step') || t.includes('task') || t.includes('plan')) return '✅'
  if (t.includes('judgment') || t.includes('citation') || t.includes('case') || t.includes('vs') || t.includes('v.')) return '⚖️'
  if (t.includes('financial') || t.includes('income') || t.includes('mainten') || t.includes('money')) return '💰'
  if (t.includes('summary') || t.includes('overview') || t.includes('executive')) return '📄'
  if (t.includes('cross') || t.includes('witness') || t.includes('question')) return '❓'
  if (t.includes('hearing') || t.includes('brief') || t.includes('argument')) return '🎯'
  if (t.includes('risk register') || t.includes('triage')) return '🚨'
  if (t.includes('mitigation') || t.includes('immediate')) return '🛡️'
  return '📋'
}

function sectionBorder(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('strength') || t.includes('favorable') || t.includes('good')) return '#86efac'
  if (t.includes('risk') || t.includes('weak') || t.includes('danger') || t.includes('adverse')) return '#fca5a5'
  if (t.includes('verdict') || t.includes('probability')) return '#818cf8'
  if (t.includes('financial') || t.includes('income') || t.includes('mainten')) return '#86efac'
  if (t.includes('judgment') || t.includes('citation') || t.includes('research') || t.includes('vs') || t.includes('v.')) return '#c7d2fe'
  if (t.includes('action') || t.includes('step') || t.includes('plan')) return '#818cf8'
  if (t.includes('hearing') || t.includes('brief')) return '#fcd34d'
  return '#e2e8f0'
}

// ── MARKDOWN → FLASH CARDS ────────────────────────────────────────────
function parseMarkdownToFlashCards(text: string): React.ReactNode {
  const lines = text.split('\n')
  const output: React.ReactNode[] = []
  let i = 0
  let cardKey = 0

  while (i < lines.length) {
    const line = lines[i].trim()

    // H1 — page title
    if (line.startsWith('# ')) {
      output.push(
        <div key={cardKey++} style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
          {line.slice(2)}
        </div>
      )
      i++; continue
    }

    // H2 / H3 — section → Flash Card
    if (line.startsWith('## ') || line.startsWith('### ')) {
      const sectionTitle = line.replace(/^#+\s/, '')
      i++
      // Collect body
      const bodyLines: string[] = []
      while (i < lines.length && !lines[i].trim().startsWith('#') && !lines[i].trim().match(/^---+$/)) {
        bodyLines.push(lines[i])
        i++
      }
      const body = bodyLines.join('\n').trim()
      if (!body) continue

      output.push(
        <FlashCard
          key={cardKey++}
          title={sectionTitle}
          icon={sectionIcon(sectionTitle)}
          borderColor={sectionBorder(sectionTitle)}
        >
          {renderBodyContent(body, sectionTitle)}
        </FlashCard>
      )
      continue
    }

    // HR — skip
    if (line.match(/^---+$/)) { i++; continue }

    // Empty — skip
    if (!line) { i++; continue }

    // Plain paragraph
    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('#') && !lines[i].trim().match(/^---+$/)) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length > 0) {
      const txt = paraLines.join(' ').trim()
      output.push(
        <div key={cardKey++} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, marginBottom: 10, fontSize: 13, color: '#334155', lineHeight: 1.75, border: '1px solid #e2e8f0' }}
          dangerouslySetInnerHTML={{ __html: boldify(txt) }}
        />
      )
    }
  }

  return <div style={{ fontFamily: 'Inter,-apple-system,sans-serif' }}>{output}</div>
}

function renderBodyContent(body: string, sectionTitle: string): React.ReactNode {
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean)

  // Table
  if (lines.some(l => l.startsWith('|'))) {
    const tableLines = lines.filter(l => l.startsWith('|') && !l.match(/^\|[\s\-|]+\|$/))
    const rows = tableLines.map(l =>
      l.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim())
    )
    if (rows.length > 1) {
      return (
        <div>
          <RiskTable headers={rows[0]} rows={rows.slice(1)} />
        </div>
      )
    }
  }

  // Numbered list
  if (lines.some(l => /^\d+\./.test(l))) {
    const items = lines.filter(l => /^\d+\./.test(l))
    return (
      <>
        {items.map((line, idx) => {
          const m = line.match(/^(\d+)\.\s+(.+)/)
          if (!m) return null
          const title = m[2].replace(/^[\*\-•]\s*/, '').trim()
          return <NumItem key={idx} num={parseInt(m[1])} title={title} priority={detectPriority(title)} />
        })}
      </>
    )
  }

  // Bullet list
  if (lines.some(l => /^[-•*]/.test(l))) {
    return (
      <>
        {lines.filter(l => /^[-•*]/.test(l)).map((line, idx) => {
          const text = line.replace(/^[-•*]+\s*/, '').replace(/^\*\s*/, '').trim()
          return <BulletItem key={idx} text={text} color={detectColor(text)} />
        })}
      </>
    )
  }

  // KV pairs (Key: Value)
  if (lines.some(l => l.includes(':') && !l.startsWith('|'))) {
    const kvLines = lines.filter(l => l.includes(':'))
    const nonKv   = lines.filter(l => !l.includes(':'))
    return (
      <div>
        {nonKv.length > 0 && (
          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.75, marginBottom: 10 }}
            dangerouslySetInnerHTML={{ __html: boldify(nonKv.join(' ')) }}
          />
        )}
        {kvLines.map((line, idx) => {
          const colonIdx = line.indexOf(':')
          const key = line.slice(0, colonIdx).replace(/\*\*/g, '').trim()
          const val = line.slice(colonIdx + 1).trim()
          if (!key || !val) return null
          return <KVRow key={idx} label={key} value={val} />
        })}
      </div>
    )
  }

  // Plain text
  return (
    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.75 }}
      dangerouslySetInnerHTML={{ __html: boldify(body) }}
    />
  )
}

// ── JSON STRUCTURED RENDERER ──────────────────────────────────────────
function renderStructuredJSON(data: any): React.ReactNode {
  // Verdict probability pattern
  if (data.verdictProbability || data.probability || data.outcomes) {
    const vp = data.verdictProbability ?? data.probability ?? data.outcomes
    return (
      <div style={{ fontFamily: 'Inter,-apple-system,sans-serif' }}>
        <FlashCard title="Verdict Probability" icon="⚖️" badge={`${vp?.favorable ?? 0}% Favorable`} badgeColor="green" borderColor="#818cf8">
          <ProbGrid
            favorable={vp?.favorable ?? 0}
            partial={vp?.partial ?? 0}
            adverse={vp?.adverse ?? 0}
          />
          {vp?.reasoning && (
            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
              {vp.reasoning}
            </div>
          )}
        </FlashCard>

        {Array.isArray(data.keyStrengths) && data.keyStrengths.length > 0 && (
          <FlashCard title="Key Strengths" icon="💪" badge={`${data.keyStrengths.length} Found`} badgeColor="green" borderColor="#86efac">
            {data.keyStrengths.map((s: any, i: number) => (
              <BulletItem key={i} text={typeof s === 'string' ? s : s.strength ?? s.text ?? JSON.stringify(s)} color="green" />
            ))}
          </FlashCard>
        )}

        {Array.isArray(data.keyWeaknesses) && data.keyWeaknesses.length > 0 && (
          <FlashCard title="Risks and Weaknesses" icon="⚠️" badge={`${data.keyWeaknesses.length} Risks`} badgeColor="red" borderColor="#fca5a5">
            {data.keyWeaknesses.map((w: any, i: number) => (
              <BulletItem key={i} text={typeof w === 'string' ? w : w.weakness ?? w.text ?? JSON.stringify(w)} color="red" />
            ))}
          </FlashCard>
        )}

        {Array.isArray(data.nextSteps) && data.nextSteps.length > 0 && (
          <FlashCard title="Next Steps" icon="✅" badge="Action" badgeColor="blue" borderColor="#818cf8">
            {data.nextSteps.map((s: any, i: number) => (
              <NumItem key={i} num={i + 1} title={typeof s === 'string' ? s : s.action ?? s.title ?? JSON.stringify(s)} />
            ))}
          </FlashCard>
        )}

        {data.coreFacts && (
          <FlashCard title="Core Facts" icon="📄" borderColor="#e2e8f0">
            <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.75 }}>{data.coreFacts}</div>
          </FlashCard>
        )}
      </div>
    )
  }

  // Array of judgments / research items
  if (Array.isArray(data)) {
    return (
      <div style={{ fontFamily: 'Inter,-apple-system,sans-serif' }}>
        {data.map((item, idx) => {
          const title     = item.title ?? item.citation ?? item.caseName ?? item.claim ?? `Item ${idx + 1}`
          const badge     = item.court ?? item.priority ?? item.year?.toString()
          const badgeColor= item.priority === 'High' ? 'red' : item.court ? 'purple' : 'blue'
          const body      = item.ratioDecidendi ?? item.summary ?? item.description ?? item.text ?? ''
          const argument  = item.courtArgument ?? item.howToUse ?? ''
          return (
            <FlashCard key={idx} title={title} icon="🔨" badge={badge} badgeColor={badgeColor as any} borderColor="#818cf8">
              {body && <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, marginBottom: argument ? 10 : 0 }}>{body}</div>}
              {argument && (
                <div style={{ marginTop: 10, background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', border: '1px solid #86efac' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#16a34a', marginBottom: 5, textTransform: 'uppercase', letterSpacing: .5 }}>💬 How to use in court</div>
                  <div style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.7 }}>{argument}</div>
                </div>
              )}
            </FlashCard>
          )
        })}
      </div>
    )
  }

  // Generic object with DraftText / Markdown content
  if (data.DraftText || data.draftText || data.Analysis || data.analysis || data.markdown) {
    const markdownContent = data.DraftText || data.draftText || data.Analysis || data.analysis || data.markdown
    return (
      <div style={{ fontFamily: 'Inter,-apple-system,sans-serif', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Top Badges for metadata if present */}
        {(data.OverallRiskRating || data.overallRiskRating || data.TopRecommendation || data.topRecommendation) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 4 }}>
            {(data.OverallRiskRating || data.overallRiskRating) && (
              <div style={{
                background: (data.OverallRiskRating || data.overallRiskRating).toLowerCase().includes('high') ? '#fef2f2' : '#f0fdf4',
                color: (data.OverallRiskRating || data.overallRiskRating).toLowerCase().includes('high') ? '#dc2626' : '#16a34a',
                border: `1px solid ${(data.OverallRiskRating || data.overallRiskRating).toLowerCase().includes('high') ? '#fca5a5' : '#86efac'}`,
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6
              }}>
                <i className="ti ti-shield-alert" /> Risk Rating: {data.OverallRiskRating || data.overallRiskRating}
              </div>
            )}
            {(data.TopRecommendation || data.topRecommendation) && (
              <div style={{
                background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, flex: 1, minWidth: 250, display: 'flex', alignItems: 'center', gap: 6
              }}>
                <i className="ti ti-bulb" /> <strong>Key Strategy:</strong> {data.TopRecommendation || data.topRecommendation}
              </div>
            )}
          </div>
        )}

        {/* Rich Markdown rendered sections */}
        {parseMarkdownToFlashCards(String(markdownContent))}

        {/* Citations used pill list */}
        {Array.isArray(data.CitationsUsed || data.citationsUsed) && (data.CitationsUsed || data.citationsUsed).length > 0 && (
          <FlashCard title="Applicable Citations & Statutes" icon="⚖️" badge={`${(data.CitationsUsed || data.citationsUsed).length} Cited`} badgeColor="purple" borderColor="#c7d2fe">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {(data.CitationsUsed || data.citationsUsed).map((c: string, i: number) => (
                <span key={i} style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                  § {c}
                </span>
              ))}
            </div>
          </FlashCard>
        )}
      </div>
    )
  }

  // Generic object → KV flash card
  return (
    <FlashCard title="AI Analysis" icon="📋" borderColor="#818cf8">
      {Object.entries(data).map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim()
        const val   = typeof value === 'object' ? JSON.stringify(value) : String(value)
        return <KVRow key={key} label={label} value={val} />
      })}
    </FlashCard>
  )
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────
export default function AIResponseFormatter({ content }: Props) {
  if (!content) return null

  if (typeof content === 'object') return <>{renderStructuredJSON(content)}</>

  const raw = String(content).trim()

  const parsed = parseAiJson<any>(raw)
  if (parsed && typeof parsed === 'object') return <>{renderStructuredJSON(parsed)}</>

  return <>{parseMarkdownToFlashCards(raw)}</>
}
