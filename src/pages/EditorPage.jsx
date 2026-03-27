import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

const VIDEO_SERVER = 'https://krreation.duckdns.org'

const videoHeaders = () => ({ 'Content-Type': 'application/json' })

const STEPS = ['Upload', 'Transcript', 'Edit', 'Result']


function formatTime(s) {
  if (s == null || isNaN(s)) return '0:00'
  const m   = Math.floor(s / 60)
  const sec = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${sec}`
}

const card = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
}

const btnPrimary = {
  background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
  color: '#fff', border: 'none', borderRadius: 8,
  padding: '10px 20px', fontSize: 14, fontWeight: 500,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
}

const btnGhost = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#a1a1aa', borderRadius: 8,
  padding: '10px 20px', fontSize: 14, fontWeight: 500,
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
}

export default function EditorPage() {
  const [searchParams] = useSearchParams()

  const [step,         setStep]         = useState('upload')
  const [videoId,      setVideoId]      = useState('')
  const [videoExt,     setVideoExt]     = useState('')
  const [videoFile,    setVideoFile]    = useState(null)
  const [videoURL,     setVideoURL]     = useState('')
  const [duration,     setDuration]     = useState(0)
  const [transcript,   setTranscript]   = useState('')
  const [segments,     setSegments]     = useState([])
  const [editPrompt,   setEditPrompt]   = useState('') // kept for reset handler
  const [vibe,         setVibe]         = useState('balanced')
  const [clips,        setClips]        = useState([])
  const [_jobId,       setJobId]        = useState('')
  const [jobStatus,    setJobStatus]    = useState('')
  const [uploadPct,    setUploadPct]    = useState(0)
  const [isUploading,  setIsUploading]  = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl,  setDownloadUrl]  = useState('')
  const [error,        setError]        = useState('')
  const [isDragging,   setIsDragging]   = useState(false)
  const [elapsed,      setElapsed]      = useState(0)
  const [jobProgress,  setJobProgress]  = useState(0)  // clips done
  const [totalClips,   setTotalClips]   = useState(0)  // total clips to cut

  const fileInputRef  = useRef(null)
  const pollRef       = useRef(null)
  const videoRef      = useRef(null)
  const timerRef      = useRef(null)
  const startTimeRef  = useRef(null)

  // ── Read query params from RecordingModal handoff ──────────────────────
  useEffect(() => {
    const qVideoId = searchParams.get('videoId')
    const qExt     = (searchParams.get('ext') || '').replace(/^\./, '')
    const source   = searchParams.get('source')
    if (qVideoId && qExt) {
      setVideoId(qVideoId)
      setVideoExt(qExt)
      setVideoURL(`${VIDEO_SERVER}/video/${qVideoId}.${qExt}`)
      setStep('transcript')
      if (source === 'recording') {
        runTranscribe(qVideoId, qExt)
      }
    }
  }, [])

  // ── Cleanup polling on unmount ─────────────────────────────────────────
  useEffect(() => () => { clearInterval(pollRef.current); clearInterval(timerRef.current) }, [])

  // ── Elapsed timer while processing ─────────────────────────────────────
  useEffect(() => {
    if (isProcessing) {
      startTimeRef.current = Date.now()
      setElapsed(0)
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 500)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isProcessing])

  // ── Upload ─────────────────────────────────────────────────────────────
  const uploadFile = (file) => {
    if (!file) return
    setError('')

    // Check duration before uploading
    const tempURL = URL.createObjectURL(file)
    const tempVid = document.createElement('video')
    tempVid.preload = 'metadata'
    tempVid.src = tempURL
    tempVid.onloadedmetadata = () => {
      URL.revokeObjectURL(tempURL)
      if (tempVid.duration > 300) {
        setError(`Video is ${Math.round(tempVid.duration / 60)} min long — max is 5 minutes. Trim it first.`)
        return
      }
      startUpload(file)
    }
    tempVid.onerror = () => { URL.revokeObjectURL(tempURL); startUpload(file) } // fallback if metadata fails
  }

  const startUpload = (file) => {
    setVideoFile(file)
    setVideoURL(URL.createObjectURL(file))
    setIsUploading(true)
    setUploadPct(0)

    const formData = new FormData()
    formData.append('video', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${VIDEO_SERVER}/upload`)

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100))
    })

    xhr.addEventListener('load', () => {
      setIsUploading(false)
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText)
          const rawExt = (data.ext || file.name.split('.').pop()).replace(/^\./, '')
          setVideoId(data.videoId)
          setVideoExt(rawExt)
          setStep('transcript')
          runTranscribe(data.videoId, rawExt)
        } catch {
          setError('Upload succeeded but response was malformed.')
        }
      } else {
        setError(`Upload failed: ${xhr.statusText}`)
      }
    })

    xhr.addEventListener('error', () => {
      console.error('[upload] XHR error event', { readyState: xhr.readyState, status: xhr.status, statusText: xhr.statusText })
      setIsUploading(false)
      setError('Upload failed — check that the video server is running.')
    })

    xhr.addEventListener('abort', () => {
      console.error('[upload] XHR aborted', { readyState: xhr.readyState })
      setIsUploading(false)
      setError('Upload was aborted.')
    })

    xhr.addEventListener('loadstart', () => console.log('[upload] loadstart — request sent'))
    xhr.addEventListener('loadend', () => console.log('[upload] loadend — readyState:', xhr.readyState, 'status:', xhr.status))

    xhr.send(formData)
  }

  const handleFileInput = (e) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('video/')) uploadFile(file)
  }

  // ── Transcribe ─────────────────────────────────────────────────────────
  const runTranscribe = async (vid, ext) => {
    setIsTranscribing(true)
    setError('')
    try {
      const res  = await fetch(`${VIDEO_SERVER}/transcribe`, {
        method: 'POST',
        headers: videoHeaders(),
        body: JSON.stringify({ videoId: vid, ext }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Transcription failed')
      const segs = (data.segments || []).filter(s => s.text?.trim())
      setSegments(segs)
      setTranscript(segs.map(s => s.text).join(' '))
      if (segs.length === 0) setError('Transcription returned no speech. You can type the transcript manually below.')
    } catch (e) {
      setError(e.message)
    } finally {
      setIsTranscribing(false)
    }
  }

  // ── Analyze + process ──────────────────────────────────────────────────
  const [agentPhase,   setAgentPhase]   = useState('')  // current agent step description
  const [agentSummary, setAgentSummary] = useState('')  // edit plan summary from agent
  const [agentIter,    setAgentIter]    = useState(0)   // how many iterations the agent ran

  const handleEdit = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    setError('')
    setClips([])
    setAgentPhase('')
    setAgentSummary('')
    setAgentIter(0)
    setStep('result')

    try {
      // ── Agentic edit: analyze + plan + validate in one shot ──
      setAgentPhase('Detecting pauses & stutters…')
      const agentRes = await fetch(`${VIDEO_SERVER}/agent-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, ext: videoExt, vibe, segments, duration }),
      })
      const agentData = await agentRes.json()
      console.log('agent-edit status:', agentRes.status, 'response:', agentData)

      let resolvedClips
      if (agentRes.ok && agentData.clips?.length) {
        resolvedClips = agentData.clips
        setAgentSummary(agentData.cutSummary || '')
        setAgentIter(agentData.iterations || 1)
        setAgentPhase('Edit plan validated — cutting clips…')
      } else {
        // Fallback: transcript-only analysis
        console.warn('[edit] agent-edit failed, falling back to /analyze:', agentData.error)
        setAgentPhase('Falling back to transcript analysis…')
        const analyzeRes = await fetch(`${VIDEO_SERVER}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId, ext: videoExt,
            transcript: segments.map(s => s.text).join(' '),
            segments, duration, words: [],
          })
        })
        const analyzeData = await analyzeRes.json()
        if (!analyzeRes.ok) throw new Error(analyzeData.error || 'Analysis failed')
        resolvedClips = analyzeData.clips || []
        setAgentPhase('Cutting clips…')
      }

      setClips(resolvedClips)
      setTotalClips(resolvedClips.length)

      // ── Process: cut the video with the planned clips ──
      const processRes = await fetch(`${VIDEO_SERVER}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId, ext: videoExt,
          clips: resolvedClips.map(c => ({ start: c.start, end: c.end }))
        })
      })
      const processData = await processRes.json()
      console.log('process status:', processRes.status, 'response:', processData)
      if (!processRes.ok) throw new Error(processData.error || 'Processing failed')

      const jid = processData.jobId
      if (!jid) throw new Error('No jobId returned from /process')
      setJobId(jid)

      // ── Poll until done ──
      pollRef.current = setInterval(async () => {
        const poll = await fetch(`${VIDEO_SERVER}/job/${jid}`)
        const job = await poll.json()
        console.log('poll response:', job)
        setJobStatus(job.status)
        if (job.progress != null) setJobProgress(job.progress)
        if (job.status === 'done') {
          clearInterval(pollRef.current)
          setDownloadUrl(`${VIDEO_SERVER}${job.downloadUrl}`)
          setIsProcessing(false)
          setAgentPhase('')
        } else if (job.status === 'error') {
          clearInterval(pollRef.current)
          setError(job.error || 'Processing failed')
          setIsProcessing(false)
        }
      }, 2000)

    } catch (e) {
      setError(e.message)
      setIsProcessing(false)
    }
  }

  const currentStepIndex = { upload: 0, transcript: 1, edit: 2, result: 3 }[step] ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 style={{ color: '#fafafa', fontSize: 22, fontWeight: 600, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          AI Video Editor
        </h1>
        <p style={{ color: '#71717a', fontSize: 13, margin: 0 }}>
          Upload your footage and describe the edit — AI handles the rest
        </p>
      </div>

      {/* ── Step indicator ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i < currentStepIndex
                  ? 'rgba(34,197,94,0.15)'
                  : i === currentStepIndex
                    ? 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)'
                    : 'rgba(255,255,255,0.06)',
                border: i < currentStepIndex
                  ? '1px solid rgba(34,197,94,0.3)'
                  : i === currentStepIndex
                    ? 'none'
                    : '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {i < currentStepIndex ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 600, color: i === currentStepIndex ? '#fff' : '#52525b' }}>
                    {i + 1}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 13, fontWeight: 500,
                color: i === currentStepIndex ? '#fafafa' : i < currentStepIndex ? '#4ade80' : '#52525b',
              }}>
                {s}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: 40, height: 1, margin: '0 12px',
                background: i < currentStepIndex ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Error (non-result steps only — result step has its own error card) */}
      {error && step !== 'result' && (
        <div style={{ ...card, padding: '12px 16px', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)' }}>
          <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>⚠ {error}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP: UPLOAD
      ══════════════════════════════════════════════════════════════════ */}
      {step === 'upload' && (
        <div style={{ ...card, padding: 32 }}>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 12,
              padding: '48px 32px',
              textAlign: 'center',
              cursor: isUploading ? 'default' : 'pointer',
              background: isDragging ? 'rgba(99,102,241,0.05)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />

            {isUploading ? (
              <div style={{ width: '100%', maxWidth: 360, margin: '0 auto' }}>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 8, marginBottom: 16, overflow: 'hidden' }}>
                  <div style={{
                    background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                    height: '100%', borderRadius: 6, width: `${uploadPct}%`, transition: 'width 0.4s',
                  }} />
                </div>
                <p style={{ color: '#a5b4fc', fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>
                  Uploading {uploadPct}%
                </p>
                <p style={{ color: '#52525b', fontSize: 12, margin: 0 }}>
                  {videoFile?.name} · {videoFile ? (videoFile.size / 1024 / 1024).toFixed(1) : 0} MB
                </p>
                {uploadPct < 5 && videoFile?.size > 100 * 1024 * 1024 && (
                  <p style={{ color: '#71717a', fontSize: 11, margin: '8px 0 0' }}>
                    Large file — upload may take a few minutes
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div style={{
                  width: 56, height: 56,
                  background: 'rgba(99,102,241,0.1)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.5" strokeLinecap="round">
                    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <p style={{ color: '#fafafa', fontSize: 16, fontWeight: 500, margin: '0 0 8px' }}>
                  Drop your video here
                </p>
                <p style={{ color: '#52525b', fontSize: 13, margin: '0 0 20px' }}>
                  MP4, MOV, WebM — any resolution
                </p>
                <div style={btnPrimary}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Choose file
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP: TRANSCRIPT
      ══════════════════════════════════════════════════════════════════ */}
      {step === 'transcript' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>

          {/* Video preview */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: '#71717a', fontSize: 12 }}>Preview</span>
            </div>
            {videoURL ? (
              <video
                ref={videoRef}
                src={videoURL}
                controls
                onLoadedMetadata={e => setDuration(e.target.duration)}
                style={{ width: '100%', display: 'block', background: '#000', maxHeight: 320, objectFit: 'contain' }}
              />
            ) : (
              <div style={{ padding: 48, textAlign: 'center', color: '#52525b', fontSize: 13 }}>
                No video preview available
              </div>
            )}
            {duration > 0 && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#71717a', fontSize: 12 }}>Duration: {formatTime(duration)}</span>
              </div>
            )}
          </div>

          {/* Transcript */}
          <div style={{ ...card, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ color: '#fafafa', fontSize: 14, fontWeight: 600, margin: 0 }}>Transcript</p>
              {isTranscribing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: '2px solid rgba(165,180,252,0.3)', borderTop: '2px solid #a5b4fc',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  <span style={{ color: '#a5b4fc', fontSize: 12 }}>Transcribing…</span>
                </div>
              )}
            </div>

            {segments.length > 0 ? (
              <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {segments.map((seg, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#52525b', fontSize: 11, whiteSpace: 'nowrap', paddingTop: 2, flexShrink: 0 }}>
                      {formatTime(seg.start)}
                    </span>
                    <span style={{ color: '#e4e4e7', fontSize: 13, lineHeight: 1.5 }}>{seg.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder={isTranscribing ? 'Transcribing…' : 'Transcript will appear here after upload'}
                disabled={isTranscribing}
                style={{
                  flex: 1, minHeight: 220,
                  background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, padding: '12px 14px', color: '#e4e4e7', fontSize: 13,
                  lineHeight: 1.6, resize: 'none', outline: 'none', fontFamily: 'inherit',
                }}
              />
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => runTranscribe(videoId, videoExt)}
                disabled={isTranscribing || !videoId}
                style={{ ...btnGhost, opacity: isTranscribing || !videoId ? 0.4 : 1, cursor: isTranscribing || !videoId ? 'not-allowed' : 'pointer' }}
              >
                Re-transcribe
              </button>
              <button
                onClick={() => setStep('edit')}
                disabled={!transcript.trim() && !segments.some(s => s.text?.trim())}
                style={{ ...btnPrimary, opacity: !transcript.trim() && !segments.some(s => s.text?.trim()) ? 0.4 : 1, cursor: !transcript.trim() && !segments.some(s => s.text?.trim()) ? 'not-allowed' : 'pointer' }}
              >
                Next: Edit →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP: EDIT
      ══════════════════════════════════════════════════════════════════ */}
      {step === 'edit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

          {/* Prompt panel */}
          <div style={{ ...card, padding: 28 }}>
            <p style={{ color: '#fafafa', fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>
              What do you want to create?
            </p>
            <p style={{ color: '#71717a', fontSize: 13, margin: '0 0 24px' }}>
              Describe your edit goal — be specific about length, style, and what to keep or cut.
            </p>

            {/* Vibe selector */}
            <p style={{ color: '#71717a', fontSize: 12, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Edit style</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {[
                { id: 'high-energy', label: 'High Energy', desc: 'Fast, punchy, strong eye contact only' },
                { id: 'balanced',    label: 'Balanced',    desc: 'Clear and confident, natural pacing' },
                { id: 'cinematic',   label: 'Cinematic',   desc: 'Composed, intentional, breathing room' },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setVibe(v.id)}
                  style={{
                    flex: 1, padding: '14px 12px', borderRadius: 10, cursor: 'pointer',
                    background: vibe === v.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${vibe === v.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                >
                  <div style={{ color: vibe === v.id ? '#a5b4fc' : '#fafafa', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{v.label}</div>
                  <div style={{ color: '#52525b', fontSize: 11, lineHeight: 1.4 }}>{v.desc}</div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('transcript')} style={btnGhost}>← Back</button>
              <button
                onClick={handleEdit}
                disabled={isProcessing}
                style={{
                  ...btnPrimary,
                  opacity: isProcessing ? 0.4 : 1,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Generate edit
              </button>
            </div>
          </div>

          {/* Transcript summary */}
          <div style={{ ...card, padding: 20 }}>
            <p style={{ color: '#71717a', fontSize: 12, margin: '0 0 12px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Transcript · {formatTime(duration)}
            </p>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {segments.length > 0 ? (
                segments.map((seg, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <span style={{ color: '#52525b', fontSize: 11 }}>{formatTime(seg.start)} </span>
                    <span style={{ color: '#a1a1aa', fontSize: 13, lineHeight: 1.5 }}>{seg.text}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: '#52525b', fontSize: 13, lineHeight: 1.6 }}>{transcript}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP: RESULT
      ══════════════════════════════════════════════════════════════════ */}
      {step === 'result' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Status / Error */}
          {isProcessing && (() => {
            const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

            // Phase logic:
            // 0-5s   → detecting pauses
            // 5-30s  → vision analysis
            // 30-50s → planning / validating
            // 50s+   → cutting clips (also when jobStatus=processing)
            const AGENT_PHASES = [
              { until: 5,  label: 'Detecting pauses & stutters…', pct: 8 },
              { until: 30, label: 'AI vision analyzing footage…',  pct: 25 },
              { until: 50, label: 'Planning & validating edit…',   pct: 45 },
            ]
            const inCutting = totalClips > 0 || jobStatus === 'processing'
            const cutPct    = totalClips > 0 ? Math.round((jobProgress / totalClips) * 50) : 0
            let pct, phaseLabel
            if (inCutting) {
              pct        = 50 + cutPct
              phaseLabel = totalClips > 0
                ? `Cutting clip ${jobProgress + 1} of ${totalClips}…`
                : 'Cutting video…'
            } else if (agentPhase) {
              const p    = AGENT_PHASES.find(p => elapsed < p.until) || AGENT_PHASES[AGENT_PHASES.length - 1]
              pct        = p.pct
              phaseLabel = agentPhase
            } else {
              const p    = AGENT_PHASES.find(p => elapsed < p.until) || AGENT_PHASES[AGENT_PHASES.length - 1]
              pct        = p.pct + Math.min(4, elapsed)
              phaseLabel = p.label
            }

            return (
              <div style={{ ...card, padding: '24px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <p style={{ color: '#fafafa', fontSize: 14, fontWeight: 600, margin: '0 0 3px' }}>
                      AI Agent is editing your video
                    </p>
                    <p style={{ color: '#71717a', fontSize: 12, margin: 0 }}>{phaseLabel}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#a5b4fc', fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
                      {fmt(elapsed)}
                    </span>
                    <button
                      onClick={() => { clearInterval(pollRef.current); clearInterval(timerRef.current); setIsProcessing(false); setJobStatus('cancelled') }}
                      style={{ ...btnGhost, fontSize: 12, padding: '6px 12px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Agent step indicators */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {[
                    { label: 'Detect', done: elapsed >= 5 },
                    { label: 'Vision', done: elapsed >= 30 },
                    { label: 'Plan',   done: elapsed >= 50 || totalClips > 0 },
                    { label: 'Validate', done: totalClips > 0 },
                    { label: 'Cut',    done: false },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: s.done ? '#4ade80' : 'rgba(255,255,255,0.1)',
                        flexShrink: 0,
                      }} />
                      <span style={{ color: s.done ? '#4ade80' : '#3f3f46', fontSize: 10, fontWeight: 500 }}>{s.label}</span>
                      {i < 4 && <span style={{ color: '#27272a', fontSize: 10, marginLeft: 2 }}>→</span>}
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 6,
                    background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                    width: `${pct}%`,
                    transition: 'width 0.8s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ color: '#52525b', fontSize: 11 }}>{pct}%</span>
                  <span style={{ color: '#52525b', fontSize: 11 }}>{fmt(elapsed)} elapsed</span>
                </div>
              </div>
            )
          })()}

          {!isProcessing && error && (
            <div style={{ ...card, padding: '20px 24px', borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}>
              <p style={{ color: '#fca5a5', fontSize: 14, fontWeight: 500, margin: '0 0 6px' }}>Processing failed</p>
              <p style={{ color: '#f87171', fontSize: 13, margin: '0 0 16px', lineHeight: 1.5 }}>{error}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setError(''); setStep('edit') }} style={{ ...btnGhost, fontSize: 13, padding: '7px 14px' }}>
                  ← Try different prompt
                </button>
                <button onClick={() => { setError(''); setStep('transcript') }} style={{ ...btnGhost, fontSize: 13, padding: '7px 14px', color: '#52525b' }}>
                  Back to transcript
                </button>
              </div>
            </div>
          )}

          {/* Finished video */}
          {downloadUrl && (
            <div>
              <p style={{ color: '#fafafa', fontSize: 15, fontWeight: 600, margin: '0 0 10px' }}>
                Edited video ready · {clips.length} clip{clips.length !== 1 ? 's' : ''} kept
              </p>
              {agentSummary && (
                <div style={{
                  background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 8, padding: '10px 14px', marginBottom: 14,
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{ color: '#a5b4fc', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', paddingTop: 1 }}>
                    AGENT{agentIter > 1 ? ` · ${agentIter} iter` : ''}
                  </span>
                  <span style={{ color: '#71717a', fontSize: 12, lineHeight: 1.5 }}>{agentSummary}</span>
                </div>
              )}
              <div style={{ ...card, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#fafafa', fontSize: 14, fontWeight: 500 }}>Final cut</span>
                  <a
                    href={downloadUrl}
                    download="edited.mp4"
                    style={{ ...btnPrimary, textDecoration: 'none', fontSize: 13, padding: '7px 14px' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                  </a>
                </div>
                <video
                  src={downloadUrl}
                  controls
                  style={{ width: '100%', display: 'block', background: '#000', maxHeight: 400, objectFit: 'contain' }}
                />
              </div>
            </div>
          )}

          {/* Edit another */}
          {!isProcessing && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setStep('edit'); setClips([]); setJobStatus('') }} style={btnGhost}>
                Try different edit
              </button>
              <button
                onClick={() => { setStep('upload'); setVideoId(''); setVideoExt(''); setVideoURL(''); setTranscript(''); setSegments([]); setClips([]); setEditPrompt(''); setJobId(''); setJobStatus(''); setDownloadUrl(''); setError('') }}
                style={{ ...btnGhost, color: '#52525b' }}
              >
                Upload new video
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
