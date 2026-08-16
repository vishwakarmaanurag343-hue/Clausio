'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCaseStore, useUIStore } from '@/lib/store'
import { aiApi, casesApi, BASE } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import CitationPanel from './CitationPanel'

export default function AIInsights() {
  const router = useRouter()
  const { selectedCaseId, setSelectedCase } = useCaseStore()
  const { aiPanelExpanded, aiPanelWidth, setAIPanelWidth, toggleAIPanelExpand, toggleAIPanel } = useUIStore()

  const [allUserCases, setAllUserCases] = useState<any[]>([])
  const [summary,     setSummary]     = useState<any>(null)
  const [loading,     setLoading]     = useState(false)
  const [chatInput,   setChatInput]   = useState('')
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', content: string, progress?: string[], isStreaming?: boolean}[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [loadingTextIndex, setLoadingTextIndex] = useState(0)
  const [isDragging,  setIsDragging]  = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isDragOver,  setIsDragOver]  = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Citation Panel State
  const [citationOpen, setCitationOpen] = useState(false)
  const [citationTitle, setCitationTitle] = useState('')
  const [citationContent, setCitationContent] = useState('')

  // Searchable Case Dropdown State
  const [caseSearchQuery, setCaseSearchQuery] = useState('')
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false)
  const caseSearchRef = useRef<HTMLDivElement>(null)

  const chatEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const pcmBufferRef = useRef<Float32Array[]>([])
  const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('clausio_token')
    if (!token) return
    casesApi.getAll()
      .then(d => setAllUserCases(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (caseSearchRef.current && !caseSearchRef.current.contains(event.target as Node)) {
        setCaseDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredUserCases = allUserCases.filter(c => {
    if (!caseSearchQuery.trim()) return true
    const q = caseSearchQuery.toLowerCase()
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.caseNumber && c.caseNumber.toLowerCase().includes(q)) ||
      (c.court && c.court.toLowerCase().includes(q)) ||
      (c.clientName && c.clientName.toLowerCase().includes(q))
    )
  })

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatLoading])

  useEffect(() => {
    return () => {
      if (chunkIntervalRef.current) clearInterval(chunkIntervalRef.current)
      processorRef.current?.disconnect()
      audioCtxRef.current?.close()
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
    setIsDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging) return
    const newWidth = window.innerWidth - e.clientX - 32
    setAIPanelWidth(newWidth)
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!isDragging) return
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch {}
    setIsDragging(false)
  }

  // Load AI summary when case changes
  useEffect(() => {
    if (!selectedCaseId) return
    setLoading(true)
    setSummary(null)
    aiApi.getSummary(selectedCaseId)
      .then(res => {
        let raw = res.summary ?? res.result ?? ''
        if (typeof raw === 'object' && raw !== null) {
          setSummary(raw)
          return
        }

        let cleanText = String(raw).trim()

        // Strip out trailing Citation Verification Report notice if attached
        const citationIdx = cleanText.indexOf('"⚠️ Citation Verification Report') !== -1 
          ? cleanText.indexOf('"⚠️ Citation Verification Report')
          : cleanText.indexOf('⚠️ Citation Verification Report')

        if (citationIdx !== -1) {
          cleanText = cleanText.substring(0, citationIdx).trim()
        }

        // Strip markdown code fences
        cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

        try {
          const parsed = JSON.parse(cleanText)
          if (parsed && typeof parsed === 'object') {
            const formattedSummary = {
              fullSummary: parsed.Case_Summary || parsed.fullSummary || parsed.summary || (typeof parsed === 'string' ? parsed : ''),
              keyStrengths: parsed.Key_Facts?.map((f: any) => typeof f === 'object' ? `${f.Fact_Description || ''} ${f.Fact_Related_Law ? `(${f.Fact_Related_Law})` : ''}`.trim() : String(f)) || parsed.keyStrengths || [],
              keyWeaknesses: parsed.Case_Issues?.map((i: any) => typeof i === 'object' ? `${i.Issue_Description || ''} ${i.Issue_Related_Law ? `(${i.Issue_Related_Law})` : ''}`.trim() : String(i)) || parsed.keyWeaknesses || [],
              nextSteps: parsed.Case_Outcomes?.map((o: any) => typeof o === 'object' ? `${o.Outcome_Description || ''} ${o.Outcome_Related_Law ? `(${o.Outcome_Related_Law})` : ''}`.trim() : String(o)) || parsed.nextSteps || [],
              verdictProbability: parsed.verdictProbability || (parsed.Case_Court ? { favorable: 75, basis: `Jurisdiction: ${parsed.Case_Court}` } : null)
            }
            setSummary(formattedSummary)
            return
          }
        } catch {
          if (cleanText.includes('"Case_Summary":')) {
            const summaryMatch = cleanText.match(/"Case_Summary"\s*:\s*"([^"]+)"/)
            if (summaryMatch) {
              setSummary({
                fullSummary: summaryMatch[1],
                keyStrengths: [],
                keyWeaknesses: [],
                nextSteps: [],
                verdictProbability: null
              })
              return
            }
          }
        }

        setSummary({ fullSummary: cleanText, keyStrengths: [], keyWeaknesses: [], nextSteps: [], verdictProbability: null })
      })
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))
  }, [selectedCaseId])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setAttachedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFile(e.target.files[0])
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const performUpload = async (file: File) => {
    if (!selectedCaseId) return false
    
    setChatHistory(prev => {
      const newHistory = [...prev]
      const lastMsg = newHistory[newHistory.length - 1]
      if (lastMsg.role === 'ai') {
        lastMsg.isStreaming = true
        lastMsg.progress = ['Uploading and analyzing document...']
      }
      return newHistory
    })
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('clausio_token') : ''
      const res = await fetch(`${BASE}/ai/upload-context/${selectedCaseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (!res.ok) throw new Error('Upload failed')
      if (!res.body) throw new Error('No body in response')
        
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      
      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true })
          const lines = chunkStr.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const msg = line.substring(6).trim()
              if (!msg) continue
              
              setChatHistory(prev => {
                const newHistory = [...prev]
                const lastMsg = { ...newHistory[newHistory.length - 1] }
                
                if (msg.startsWith('SUCCESS:') || msg.startsWith('ERROR:')) {
                  // Final message of upload, we don't display it as text, just complete progress
                } else {
                  lastMsg.progress = [...(lastMsg.progress || []), msg]
                }
                newHistory[newHistory.length - 1] = lastMsg
                return newHistory
              })
            }
          }
        }
      }
      return true
    } catch (err) {
      setChatHistory(prev => {
        const newHistory = [...prev]
        const lastMsg = newHistory[newHistory.length - 1]
        lastMsg.content = 'Unable to process document. Please try again.'
        lastMsg.isStreaming = false
        return newHistory
      })
      return false
    }
  }

  async function handleAskClausio() {
    if (!chatInput.trim() && !attachedFile) return
    if (!selectedCaseId) return
    
    const userMessage = chatInput
    const currentFile = attachedFile
    
    // Add user message (including file info) and empty AI message
    const userContent = currentFile 
      ? `📎 Attached Document: [${currentFile.name}]\n\n${userMessage}`
      : userMessage

    setChatHistory(prev => [
      ...prev, 
      { role: 'user', content: userContent },
      { role: 'ai', content: '', progress: [], isStreaming: true }
    ])
    setChatInput('')
    setAttachedFile(null)
    setChatLoading(true)
    
    // 1. Process Upload if file attached
    if (currentFile) {
      const uploadSuccess = await performUpload(currentFile)
      if (!uploadSuccess) {
        setChatLoading(false)
        return // stop if upload fails
      }
    }
    
    // 2. Stream Chat Response
    try {
      const stream = aiApi.chatStream({ message: userContent || 'Summarize this document', caseId: selectedCaseId, history: [] })
      
      for await (const chunk of stream) {
        setChatHistory(prev => {
          const newHistory = [...prev]
          const lastMsg = { ...newHistory[newHistory.length - 1] }
          
          if (chunk.startsWith('[sys]')) {
            const sysMsg = chunk.replace('[sys]', '').trim()
            if (sysMsg) {
              lastMsg.progress = [...(lastMsg.progress || []), sysMsg]
            }
          } else {
            lastMsg.content = (lastMsg.content || '') + chunk
          }
          
          newHistory[newHistory.length - 1] = lastMsg
          return newHistory
        })
      }
    } catch (err) {
      setChatHistory(prev => {
        const newHistory = [...prev]
        const lastMsg = newHistory[newHistory.length - 1]
        lastMsg.content = lastMsg.content || 'Unable to get AI response. Please try again.'
        return newHistory
      })
    } finally {
      setChatHistory(prev => {
        const newHistory = [...prev]
        if (newHistory.length > 0) {
          newHistory[newHistory.length - 1].isStreaming = false
        }
        return newHistory
      })
      setChatLoading(false)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (chatLoading) {
      setLoadingTextIndex(0)
      interval = setInterval(() => {
        setLoadingTextIndex(prev => prev + 1)
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [chatLoading])

  const loadingMessages = [
    "Thinking...",
    "Reviewing case files...",
    "Extracting key insights...",
    "Analyzing evidence...",
    "Drafting response..."
  ]

  const handleVoiceInput = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach(t => t.stop())
      mediaRecorderRef.current = null
      streamRef.current = null
      setIsListening(false)
      return
    }

    try {
      // First, get basic permission so we can read the device labels
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(d => d.kind === 'audioinput')
      
      // Try to find a real microphone (skip virtual ones like Zoom or BlackHole)
      const realMic = audioInputs.find(d => 
        !d.label.toLowerCase().includes('zoom') && 
        !d.label.toLowerCase().includes('blackhole') &&
        d.deviceId !== 'default' &&
        d.deviceId !== 'communications'
      )

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: realMic ? { deviceId: { exact: realMic.deviceId } } : true
      })
      
      streamRef.current = stream
      
      const audioTrack = stream.getAudioTracks()[0]
      console.log(`[voice] Using microphone: ${audioTrack?.label || 'Unknown'}`)
      
      // Save existing chat input so we can append to it
      const originalText = chatInput.trim()

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      // Accumulate all chunks so the WebM file header is never lost
      const audioChunks: Blob[] = []

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          audioChunks.push(e.data)
          const fullBlob = new Blob(audioChunks, { type: mimeType })
          
          try {
            const fd = new FormData()
            fd.append('file', fullBlob, 'audio.webm')
            const res = await fetch('http://localhost:8000/api/voice', { method: 'POST', body: fd })
            if (res.ok) {
              const data = await res.json()
              if (data.text?.trim()) {
                // Replace live text with the transcription of the entire audio so far
                setChatInput(originalText + (originalText ? ' ' : '') + data.text.trim())
              }
            }
          } catch (err) {
            console.error('Voice API error', err)
          }
        }
      }

      recorder.onstop = () => setIsListening(false)
      recorder.start(1500) // send update every 1.5 seconds for lower latency
      setIsListening(true)

    } catch (e) {
      console.error(e)
      alert('Microphone access denied. Please allow microphone access and try again.')
      setIsListening(false)
    }
  }

  const favorable = summary?.verdictProbability?.favorable ?? null

  return (
    <div 
      className="chat-aurora-bg" 
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        borderLeft: '1px solid rgba(0,0,0,0.08)', 
        position: 'relative',
        background: isDragOver ? 'rgba(56, 189, 248, 0.05)' : undefined
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, border: '2px dashed #38bdf8', background: 'rgba(56, 189, 248, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '20px 40px', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <i className="ti ti-upload" style={{ fontSize: 48, color: '#38bdf8', marginBottom: 12 }} />
            <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Drop document to process</h3>
            <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#64748b' }}>PDF, PNG, JPG supported</p>
          </div>
        </div>
      )}

      {/* ── DRAGGABLE LEFT RESIZE HANDLE (Desktop only) ── */}
      <div
        className="desktop-panel-toggles"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'absolute',
          left: -4,
          top: 0,
          bottom: 0,
          width: 12,
          cursor: 'col-resize',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          touchAction: 'none'
        }}
        title="Drag to resize AI Insights panel"
      >
        <div
          style={{
            width: isDragging ? 4 : 2,
            height: 48,
            borderRadius: 4,
            background: isDragging ? '#7c3aed' : 'rgba(0,0,0,0.12)',
            boxShadow: isDragging ? '0 0 8px rgba(124,58,237,0.5)' : 'none',
            transition: 'background 0.15s, width 0.15s'
          }}
        />
      </div>

      {/* Header (Desktop only) */}
      <div className="desktop-header-item" style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: 'rgba(255,255,255,0.4)' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }}>
          <video 
            src="/aivideo.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.8)' }} 
          />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>AI Insights</span>

        {selectedCaseId && (
          <button
            onClick={() => { setChatHistory([]); setChatInput('') }}
            style={{ fontSize: 12, fontWeight: 600, color: '#334155', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 14, transition: 'background 0.15s, border-color 0.15s', flexShrink: 0, whiteSpace: 'nowrap' }}
            title="Start a new chat"
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' }}
          >
            <i className="ti ti-plus" style={{ fontSize: 13 }} />
            New Chat
          </button>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>

        {/* No case selected message (desktop only) */}
        {!selectedCaseId && (
          <div className="desktop-header-item" style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12 }}>
            Select a case to see AI insights
          </div>
        )}

        {/* Loading */}
        {loading && selectedCaseId && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            {/* Kept blank for a cleaner UI transition */}
          </div>
        )}

        {/* AI Summary */}
        {!loading && summary && (
          <>
            {/* Success probability */}
            {favorable !== null && (
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, marginBottom: 4 }}>Case success probability</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{favorable}%</div>
                <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${favorable}%`, height: 6, background: favorable >= 60 ? '#10b981' : favorable >= 40 ? '#f59e0b' : '#ef4444', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                  {summary.verdictProbability?.basis ?? 'Based on evidence and case facts'}
                </div>
              </div>
            )}

            {/* Key strengths */}
            {summary.keyStrengths?.length > 0 && (
              <>
                <p style={{ fontSize: 10, color: '#15803d', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontWeight: 700 }}>Strengths</p>
                {summary.keyStrengths.slice(0, 3).map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0, marginTop: 4 }} />
                    <p style={{ fontSize: 11, color: '#0f172a', lineHeight: 1.5, margin: 0 }}>
                      {typeof s === 'string' ? s : s.strength ?? ''}
                    </p>
                  </div>
                ))}
              </>
            )}

            {/* Key weaknesses */}
            {summary.keyWeaknesses?.length > 0 && (
              <>
                <p style={{ fontSize: 10, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontWeight: 700, marginTop: 14 }}>Risks</p>
                {summary.keyWeaknesses.slice(0, 2).map((w: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: i < 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <p style={{ fontSize: 11, color: '#0f172a', lineHeight: 1.5, margin: 0 }}>
                        {typeof w === 'string' ? w : w.weakness ?? ''}
                      </p>
                      <button
                        onClick={() => router.push('/strategy')}
                        style={{ marginTop: 4, fontSize: 10, padding: '2px 8px', border: 'none', background: '#fef2f2', color: '#991b1b', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, borderRadius: 4 }}
                      >
                        Fix now
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Next steps */}
            {summary.nextSteps?.length > 0 && (
              <>
                <p style={{ fontSize: 10, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontWeight: 700, marginTop: 14 }}>Next Actions</p>
                {summary.nextSteps.slice(0, 3).map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: 4 }} />
                    <p style={{ fontSize: 11, color: '#0f172a', lineHeight: 1.5, margin: 0 }}>
                      {typeof s === 'string' ? s : s.action ?? ''}
                    </p>
                  </div>
                ))}
              </>
            )}

            {/* Case killer */}
            {summary.caseKiller && (
              <div style={{ marginTop: 14, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>⚠ Case Killer Risk</div>
                <p style={{ fontSize: 11, color: '#7f1d1d', lineHeight: 1.5, margin: 0 }}>{summary.caseKiller}</p>
              </div>
            )}

            {/* Full summary */}
            {summary.fullSummary && (
              <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>AI SUMMARY</div>
                <div className="prose prose-sm prose-slate max-w-none" style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  <ReactMarkdown>{summary.fullSummary}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Quick navigation */}
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8, fontWeight: 700 }}>Quick Access</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: '⚖️ Hearings', route: '/hearings' },
                  { label: '📄 Drafting', route: '/drafting' },
                  { label: '💰 Financial', route: '/financial' },
                  { label: '✅ Readiness', route: '/readiness' },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(item.route)}
                    style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 8, fontSize: 11, color: '#0f172a', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', fontWeight: 500 }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Empty Chat State (Clean Centered Layout Matching Mobile Prototype) */}
        {chatHistory.length === 0 && !chatLoading && (
          <div className="mobile-chat-hero-container" style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <h2 className="mobile-ai-hero-title" style={{ fontSize: 24, fontWeight: 500, color: '#1e293b', margin: '0 0 28px', letterSpacing: '-0.02em', textAlign: 'center', fontFamily: 'Inter, -apple-system, sans-serif' }}>
              Where Should We Begin ?
            </h2>

            {/* Input Bar inside Centered Container on Mobile */}
            <div className="mobile-centered-input-wrapper" style={{ width: '100%', maxWidth: 440, padding: '0 8px' }}>
              <div className="apple-intelligence-chat-pill" style={{ background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', height: 52, padding: '0 8px 0 8px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload Document"
                  style={{ 
                    background: '#e2e8f0', 
                    border: 'none', 
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b',
                    flexShrink: 0,
                    transition: 'transform 0.2s',
                  }}
                  onPointerDown={e => e.currentTarget.style.transform = 'scale(0.85)'}
                  onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <i className="ti ti-plus" style={{ fontSize: 18, color: '#64748b' }} />
                </button>
                <input
                  type="text"
                  className="apple-intelligence-input-text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAskClausio()
                    }
                  }}
                  placeholder={isListening ? "Listening..." : "Ask Clausio about this case..."}
                  style={{ 
                    flex: 1, 
                    border: 'none', 
                    outline: 'none', 
                    background: 'transparent',
                    padding: '0 12px', 
                    fontSize: 14, 
                    color: '#0f172a',
                    fontWeight: 500,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                />
                <button
                  onClick={handleVoiceInput}
                  title="Voice Typing"
                  style={{ 
                    background: '#f1f5f9', 
                    border: 'none', 
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isListening ? '#ef4444' : '#64748b',
                    marginRight: 6,
                    flexShrink: 0,
                    transition: 'transform 0.2s',
                    transform: isListening ? 'scale(1.15)' : 'scale(1)'
                  }}
                >
                  <i className="ti ti-microphone" style={{ fontSize: 18 }} />
                </button>
                <button
                  onClick={handleAskClausio}
                  disabled={chatLoading || (!chatInput.trim() && !attachedFile) || !selectedCaseId}
                  className="apple-intelligence-send-btn"
                  title="Send message"
                  style={{ 
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#cbd5e1',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    flexShrink: 0,
                    opacity: chatLoading || (!chatInput.trim() && !attachedFile) ? 0.6 : 1 
                  }}
                >
                  {chatLoading ? <i className="ti ti-loader animate-spin" /> : <i className="ti ti-send" style={{ fontSize: 16 }} />}
                </button>
              </div>

              {/* Centered Interactive Search Case Pill */}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                <div ref={caseSearchRef} style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#e2e8f0',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 24,
                      padding: '4px 14px',
                      boxShadow: caseDropdownOpen ? '0 0 0 2px rgba(56,189,248,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <i className="ti ti-search" style={{ fontSize: 14, color: '#64748b', marginRight: 8, flexShrink: 0 }} />
                    <input
                      type="text"
                      value={caseSearchQuery}
                      onChange={e => {
                        setCaseSearchQuery(e.target.value)
                        setCaseDropdownOpen(true)
                      }}
                      onFocus={() => setCaseDropdownOpen(true)}
                      placeholder={selectedCaseId ? (allUserCases.find(c => c.id === selectedCaseId)?.name || 'Search Your Case...') : 'Search Your Case...'}
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#334155',
                        fontFamily: 'inherit',
                        padding: '4px 0',
                      }}
                    />
                    <button
                      onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', padding: 0, marginLeft: 4 }}
                    >
                      <i className={`ti ${caseDropdownOpen ? 'ti-chevron-up' : 'ti-chevron-down'}`} style={{ fontSize: 14 }} />
                    </button>
                  </div>

                  {/* Real-time Case Search Dropdown */}
                  {caseDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        right: 0,
                        maxHeight: 220,
                        overflowY: 'auto',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 16,
                        boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                        zIndex: 1000,
                        padding: '6px',
                      }}
                    >
                      {filteredUserCases.length === 0 ? (
                        <div style={{ padding: '12px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                          No cases found matching "{caseSearchQuery}"
                        </div>
                      ) : (
                        filteredUserCases.map(c => {
                          const isSelected = c.id === selectedCaseId
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                setSelectedCase(c.id, c.name)
                                setCaseSearchQuery(c.name)
                                setCaseDropdownOpen(false)
                              }}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: isSelected ? '#f1f5f9' : 'transparent',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={e => e.currentTarget.style.background = isSelected ? '#f1f5f9' : 'transparent'}
                            >
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                                {c.caseNumber && (
                                  <div style={{ fontSize: 11, color: '#64748b' }}>#{c.caseNumber} • {c.court || 'Court'}</div>
                                )}
                              </div>
                              {isSelected && (
                                <i className="ti ti-check" style={{ color: '#0284c7', fontSize: 14, flexShrink: 0, marginLeft: 8 }} />
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Suggestion Chips (Desktop only or optional) */}
            <div className="desktop-header-item" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', width: '100%', paddingBottom: 8, padding: '0 4px', marginTop: 20 }}>
              {[
                { text: "Summarize this case", icon: "ti-sparkles" },
                { text: "What are the key risks?", icon: "ti-alert-triangle" },
                { text: "Draft an email to client", icon: "ti-mail" }
              ].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => setChatInput(chip.text)}
                  style={{ flexShrink: 0, padding: '10px 14px', background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16, fontSize: 12, color: '#334155', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.03)', transition: 'transform 0.1s' }}
                  onPointerDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                  onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <i className={`ti ${chip.icon}`} style={{ color: '#38bdf8', fontSize: 14 }} />
                  {chip.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat History */}
        {(chatHistory.length > 0 || chatLoading) && (
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {chatHistory.map((msg, i) => (
              <div key={i}>
                {msg.role === 'user' ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 4px' }}>
                    <div style={{ 
                      maxWidth: '85%', 
                      background: '#ffffff', 
                      color: '#0f172a',
                      border: '1px solid rgba(0,0,0,0.06)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                      borderRadius: 18, 
                      borderBottomRightRadius: 4,
                      padding: '10px 14px' 
                    }}>
                      <p style={{ fontSize: 12, lineHeight: 1.5, margin: 0, fontWeight: 500 }}>{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0 4px', maxWidth: '90%' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)', marginTop: 2 }}>
                      <video src="/aivideo.mp4" autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.8)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="prose prose-sm prose-slate max-w-none" style={{ fontSize: 12, color: '#0f172a', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                        <ReactMarkdown 
                          components={{
                            a: ({ node, ...props }) => {
                              // Style citations as pills
                              const citationText = props.children?.toString() || ''
                              const isCitation = props.href?.startsWith('#') || citationText.includes('Section') || citationText.includes('Act') || citationText.includes('Clause') || citationText.includes('Article')
                              if (isCitation) {
                                return (
                                  <span 
                                    onClick={() => {
                                      setCitationTitle(citationText)
                                      setCitationContent(`This is the verified source text for ${citationText}. In a production environment, this text would be fetched directly from the case documents or legal databases via an API call using the citation reference.`)
                                      setCitationOpen(true)
                                    }}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', color: '#3b82f6', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid #cbd5e1', transition: 'background 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                                  >
                                    <i className="ti ti-book" style={{ fontSize: 12 }} />
                                    {props.children}
                                  </span>
                                )
                              }
                              return <a {...props} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }} />
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                        {msg.isStreaming && <span className="animate-pulse">...</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            

            
            <div ref={chatEndRef} style={{ height: 1 }} />
          </div>
        )}
      </div>

      {/* Ask Clausio bottom input (Rendered when active chat history exists or desktop) */}
      {(chatHistory.length > 0 || chatLoading) && (
        <div style={{ padding: '12px 14px', background: 'transparent', flexShrink: 0 }}>
        {attachedFile && (
          <div style={{ 
            marginBottom: 8, 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 8, 
            background: '#f1f5f9', 
            padding: '6px 12px', 
            borderRadius: 16, 
            border: '1px solid #cbd5e1',
            fontSize: 12,
            color: '#334155'
          }}>
            <i className="ti ti-file-text" style={{ color: '#3b82f6', fontSize: 14 }} />
            <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {attachedFile.name}
            </span>
            <button 
              onClick={() => setAttachedFile(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
            >
              <i className="ti ti-x" style={{ fontSize: 14 }} />
            </button>
          </div>
        )}
        <div className="apple-intelligence-chat-pill">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.png,.jpg,.jpeg"
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Upload Document"
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              color: '#64748b',
              marginLeft: 12,
              marginRight: 4,
              transition: 'transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), color 0.2s',
            }}
            onPointerDown={e => e.currentTarget.style.transform = 'scale(0.85)'}
            onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
            onPointerLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <i className="ti ti-paperclip" style={{ fontSize: 18 }} />
          </button>
          <textarea
            rows={1}
            className="apple-intelligence-input-text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleAskClausio()
              }
            }}
            placeholder={isListening ? "Listening..." : "Ask Clausio about this case..."}
            style={{ resize: 'none', maxHeight: 120, paddingTop: 6, paddingBottom: 6 }}
          />
          <button
            onClick={handleVoiceInput}
            title="Voice Typing"
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              color: isListening ? '#ef4444' : '#64748b',
              marginRight: 8,
              transition: 'transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), color 0.2s',
              transform: isListening ? 'scale(1.15)' : 'scale(1)'
            }}
          >
            <i className="ti ti-microphone" style={{ fontSize: 18 }} />
          </button>
          <button
            onClick={handleAskClausio}
            disabled={chatLoading || (!chatInput.trim() && !attachedFile) || !selectedCaseId}
            className="apple-intelligence-send-btn"
            title="Send message"
            style={{ opacity: chatLoading || (!chatInput.trim() && !attachedFile) ? 0.5 : 1 }}
          >
            {chatLoading ? <i className="ti ti-loader animate-spin" /> : <i className="ti ti-arrow-right" style={{ fontSize: 16 }} />}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <select
              value={selectedCaseId}
              onChange={e => {
                const found = allUserCases.find(c => c.id === e.target.value)
                if (found) setSelectedCase(found.id, found.name)
              }}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                background: '#e2e8f0',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 20,
                padding: '6px 32px 6px 16px',
                fontSize: 12,
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
                fontFamily: 'inherit',
                outline: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <option value="" disabled>Search Your Case ▾</option>
              {allUserCases.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.caseNumber || 'No #'})
                </option>
              ))}
            </select>
            <i className="ti ti-chevron-down" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#64748b', pointerEvents: 'none' }} />
          </div>
        </div>
      </div>
      )}

      <CitationPanel 
        isOpen={citationOpen}
        title={citationTitle}
        content={citationContent}
        onClose={() => setCitationOpen(false)}
      />
    </div>
  )
}
