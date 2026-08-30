'use client'

import { useRef, useState } from 'react'
import { extractTextApi } from '@/lib/api'

type Mode = 'type' | 'upload' | 'voice'

interface Props {
  value: string
  onChange: (text: string) => void
  disabled?: boolean
}

const VOICE_URL = 'http://localhost:8000/api/voice'

export default function CaseDescriptionInput({ value, onChange, disabled }: Props) {
  const [mode, setMode] = useState<Mode>('type')
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [err, setErr] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── file upload ─────────────────────────────────────────────
  async function handleFile(file: File) {
    setErr('')
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setErr('Only PDF, DOCX and TXT files are supported.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErr('File is larger than 10MB.')
      return
    }
    setUploading(true)
    try {
      const result = await extractTextApi.fromFile(file)
      setUploadedFile(result.fileName || file.name)
      onChange(result.text || '')
      if (!result.text?.trim()) setErr('No text could be read from this file. You can type the description manually.')
    } catch (e: any) {
      setErr((e?.message || 'Failed to extract text.') + ' You can type the description manually.')
    } finally {
      setUploading(false)
    }
  }

  // ── voice recording ─────────────────────────────────────────
  async function startRecording() {
    setErr('')
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setErr('Microphone access was denied. Allow it in your browser settings, or use Type / Upload.')
      return
    }

    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    const chunks: Blob[] = []

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      setIsRecording(false)
      setIsTranscribing(true)
      try {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const fd = new FormData()
        fd.append('file', blob, 'recording.webm')
        const res = await fetch(VOICE_URL, { method: 'POST', body: fd })
        if (!res.ok) throw new Error('bad-status')
        const data = await res.json()
        if (data?.text?.trim()) onChange(data.text.trim())
        else setErr('Could not make out any speech. Try again and speak clearly.')
      } catch {
        setErr('Voice service not available. Please use Type or Upload instead.')
      } finally {
        setIsTranscribing(false)
      }
    }

    recorder.start()
    setIsRecording(true)
    setRecordingTime(0)
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  function fmt(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  function resetInput() {
    onChange('')
    setUploadedFile('')
    setErr('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── render ──────────────────────────────────────────────────
  return (
    <div>
      {/* radio pills */}
      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
        How do you want to add the case description?
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {([
          { key: 'type',   label: '✏️ Type / Paste' },
          { key: 'upload', label: '📄 Upload File' },
          { key: 'voice',  label: '🎙️ Voice Recording' },
        ] as { key: Mode; label: string }[]).map(opt => {
          const on = mode === opt.key
          return (
            <button key={opt.key} type="button" disabled={disabled}
              onClick={() => { setMode(opt.key); setErr('') }}
              style={{
                padding: '8px 16px', borderRadius: 99,
                border: `1.5px solid ${on ? '#0f172a' : '#e2e8f0'}`,
                background: on ? '#0f172a' : '#fff',
                color: on ? '#fff' : '#64748b',
                fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all .15s',
              }}>
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* ── TYPE / PASTE ── */}
      {mode === 'type' && (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          rows={9}
          placeholder="Paste or type case description, facts, petition text, or any relevant information about this case..."
          style={{ ...taStyle, minHeight: 200, background: '#f8fafc', border: '1px solid #e2e8f0' }}
        />
      )}

      {/* ── UPLOAD FILE ── */}
      {mode === 'upload' && (
        <div>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />

          {!uploading && !value && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
              onClick={() => !disabled && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#2563eb' : '#e2e8f0'}`,
                borderRadius: 12, background: dragOver ? '#eff6ff' : '#f8fafc',
                minHeight: 150, padding: '36px 20px', textAlign: 'center',
                cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .2s',
              }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                Drop your file here or click to browse
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Supported: PDF, DOCX, TXT · Max 10MB</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                Upload a petition, plaint, case notes or any document
              </div>
            </div>
          )}

          {uploading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc' }}>
              <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>
                <i className="ti ti-loader animate-spin" /> Extracting text from file…
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Please wait</div>
            </div>
          )}

          {!uploading && value && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>
                  ✓ Extracted Text{uploadedFile ? ` — from ${uploadedFile}` : ''} · you can edit this
                </div>
                <button type="button" onClick={resetInput}
                  style={{ fontSize: 11, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  × Remove
                </button>
              </div>
              <textarea value={value} onChange={e => onChange(e.target.value)} disabled={disabled} rows={10}
                style={{ ...taStyle, background: '#f0f9ff', border: '1px solid #bae6fd' }} />
              <div style={{ fontSize: 11, color: '#0369a1', marginTop: 4 }}>You can edit the extracted text above.</div>
            </div>
          )}
        </div>
      )}

      {/* ── VOICE RECORDING ── */}
      {mode === 'voice' && (
        <div>
          {!isTranscribing && !value && (
            <div style={{ textAlign: 'center', padding: '28px 20px' }}>
              <button type="button" disabled={disabled}
                onClick={isRecording ? stopRecording : startRecording}
                style={{
                  width: 80, height: 80, borderRadius: '50%', border: 'none',
                  background: isRecording ? '#dc2626' : '#2563eb', color: '#fff', fontSize: 30,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  animation: isRecording ? 'pulse 1s infinite' : 'none', transition: 'all .2s',
                }}>
                <i className={`ti ${isRecording ? 'ti-square-filled' : 'ti-microphone'}`} />
              </button>

              {isRecording ? (
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>{fmt(recordingTime)}</div>
                  <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>Recording… click the square to stop</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Click the microphone to start recording</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Speak the case description, facts, or dictate a petition</div>
                </div>
              )}
            </div>
          )}

          {isTranscribing && (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>
                <i className="ti ti-loader animate-spin" /> Transcribing your voice…
              </div>
            </div>
          )}

          {!isTranscribing && value && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#15803d', marginBottom: 8 }}>
                ✓ Extracted Text — you can edit this
              </div>
              <textarea value={value} onChange={e => onChange(e.target.value)} disabled={disabled} rows={10}
                style={{ ...taStyle, background: '#f0f9ff', border: '1px solid #bae6fd' }} />
              <button type="button" onClick={resetInput}
                style={{ marginTop: 8, fontSize: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                × Record again
              </button>
            </div>
          )}
        </div>
      )}

      {err && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
          {err}
        </div>
      )}
    </div>
  )
}

const taStyle: React.CSSProperties = {
  width: '100%', borderRadius: 10, padding: '12px 14px', fontSize: 13, lineHeight: 1.7,
  fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
}
