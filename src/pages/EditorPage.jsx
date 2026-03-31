import { useState, useEffect, useRef } from 'react'

const VIDEO_SERVER = 'https://krreation.duckdns.org'

const VIBES = [
  { id: 'high-energy', label: 'High Energy', desc: 'Fast, punchy, confident moments only' },
  { id: 'balanced',    label: 'Balanced',    desc: 'Clear and natural pacing' },
  { id: 'cinematic',   label: 'Cinematic',   desc: 'Composed, intentional, breathing room' },
]

const STEPS = ['Upload', 'Edit', 'Processing', 'Trim', 'Captions']

const s = {
  page: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '48px 24px',
    fontFamily: 'inherit',
  },
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: 32,
  },
  label: {
    display: 'block',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: '12px 14px',
    color: '#fafafa',
    fontSize: 14,
    lineHeight: 1.6,
    resize: 'vertical',
    outline: 'none',
    fontFamily: 'inherit',
    minHeight: 90,
  },
  input: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#fafafa',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputSmall: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: '8px 10px',
    color: '#fafafa',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    width: 90,
    boxSizing: 'border-box',
  },
  btnPrimary: {
    padding: '14px 24px',
    background: '#fff',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '-0.01em',
  },
  btnPrimaryFull: {
    width: '100%',
    padding: '14px 20px',
    background: '#fff',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '-0.01em',
  },
  btnGhost: {
    padding: '14px 24px',
    background: 'transparent',
    color: 'rgba(255,255,255,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnGhostFull: {
    width: '100%',
    padding: '14px 20px',
    background: 'transparent',
    color: 'rgba(255,255,255,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '7px 12px',
    background: 'transparent',
    color: '#f87171',
    border: '1px solid rgba(248,113,113,0.25)',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
  },
  btnDownload: {
    display: 'block',
    width: '100%',
    padding: '16px 20px',
    background: '#fff',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
    letterSpacing: '-0.01em',
    boxSizing: 'border-box',
  },
  error: {
    color: '#f87171',
    fontSize: 13,
    marginTop: 16,
  },
}

export default function EditorPage() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

  // Step 1 — Upload
  const [videoId,    setVideoId]    = useState('')
  const [videoExt,   setVideoExt]   = useState('')
  const [localVideoURL, setLocalVideoURL] = useState('')
  const [isUploading,setIsUploading]= useState(false)
  const [uploadPct,  setUploadPct]  = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Step 2 — Edit
  const [userPrompt, setUserPrompt] = useState('')
  const [vibe,       setVibe]       = useState('balanced')

  // Step 3 — Processing
  const [jobProgress,    setJobProgress]    = useState('')
  const [processingDone, setProcessingDone] = useState(false)
  const [outputId,       setOutputId]       = useState('')
  const [summary,        setSummary]        = useState('')
  const [clips,          setClips]          = useState([])
  const [captionSegments,setCaptionSegments]= useState([])
  const [captionWords,   setCaptionWords]   = useState([])

  // Step 4 — Trim
  const [remainingClips, setRemainingClips] = useState([])
  const [trimRendering,  setTrimRendering]  = useState(false)

  // Step 5 — Captions
  const [editedSegments, setEditedSegments] = useState([])
  const [captionStyle,   setCaptionStyle]   = useState('subtitle')
  const [exportRendering,setExportRendering]= useState(false)
  const [exportDone,     setExportDone]     = useState(false)
  const [exportOutputId, setExportOutputId] = useState('')

  // B-roll
  const [brollItems,   setBrollItems]   = useState([]) // { key, file, mediaId, insertAt, duration, uploading }
  const [brollApplying,setBrollApplying]= useState(false)
  const [brollDone,    setBrollDone]    = useState(false)
  const [brollOutputId,setBrollOutputId]= useState('')

  const fileInputRef   = useRef(null)
  const brollInputRef  = useRef(null)
  const pollRef        = useRef(null)
  const brollKeyRef    = useRef(0)
  const videoRef       = useRef(null)
  const previewTimer   = useRef(null)

  const previewClip = (start) => {
    const v = videoRef.current
    if (!v) return
    clearTimeout(previewTimer.current)
    v.currentTime = start
    v.play()
    previewTimer.current = setTimeout(() => v.pause(), 3000)
  }

  useEffect(() => () => clearInterval(pollRef.current), [])

  // ── Generic poll ─────────────────────────────────────────────────────────────
  const poll = (jobId, onProgress, onDone, onError) => {
    clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${VIDEO_SERVER}/job/${jobId}`)
        const data = await res.json()
        if (data.progress != null) onProgress(data.progress)
        if (data.status === 'done') {
          clearInterval(pollRef.current)
          onDone(data)
        } else if (data.status === 'error') {
          clearInterval(pollRef.current)
          onError(data.error || 'Processing failed.')
        }
      } catch {
        // transient — keep polling
      }
    }, 2000)
  }

  // ── Step 1: Upload ────────────────────────────────────────────────────────────
  const startUpload = (file) => {
    if (!file) return
    const allowed = ['video/mp4', 'video/quicktime', 'video/webm']
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp4|mov|webm)$/i)) {
      setError('Please upload an MP4, MOV, or WEBM file.')
      return
    }
    setError('')
    setIsUploading(true)
    setUploadPct(0)
    setLocalVideoURL(URL.createObjectURL(file))

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
          const data   = JSON.parse(xhr.responseText)
          const rawExt = (data.ext || file.name.split('.').pop()).replace(/^\./, '')
          setVideoId(data.videoId)
          setVideoExt(rawExt)
          setStep(2)
        } catch {
          setError('Upload succeeded but response was malformed.')
        }
      } else {
        setError(`Upload failed (${xhr.status}).`)
      }
    })
    xhr.addEventListener('error', () => {
      setIsUploading(false)
      setError('Upload failed — check that the video server is running.')
    })
    xhr.send(formData)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    startUpload(e.dataTransfer.files?.[0])
  }

  // ── Step 2: Edit ──────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    setError('')
    try {
      const res  = await fetch(`${VIDEO_SERVER}/edit`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ videoId, ext: videoExt, prompt: userPrompt, vibe }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Edit request failed')
      setStep(3)
      setProcessingDone(false)
      setJobProgress('')
      poll(
        data.jobId,
        (prog) => setJobProgress(prog),
        (result) => {
          setOutputId(result.outputId || result.downloadUrl?.split('/').pop() || data.jobId)
          setSummary(result.summary || result.cutSummary || '')
          setClips(result.clips || [])
          setCaptionSegments(result.captionSegments || [])
          setCaptionWords(result.captionWords || [])
          setProcessingDone(true)
        },
        (msg) => setError(msg),
      )
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Step 4: Trim ──────────────────────────────────────────────────────────────
  const goToTrim = () => {
    setRemainingClips(clips.map(c => ({ ...c })))
    setTrimRendering(false)
    setStep(4)
  }

  const handleApplyTrim = async () => {
    setError('')
    setTrimRendering(true)
    try {
      const res  = await fetch(`${VIDEO_SERVER}/render`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ outputId, clips: remainingClips }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Render failed')
      poll(
        data.jobId,
        () => {},
        (result) => {
          if (result.outputId) setOutputId(result.outputId)
          setTrimRendering(false)
          setEditedSegments(captionSegments.map(seg => ({ ...seg })))
          setStep(5)
        },
        (msg) => { setError(msg); setTrimRendering(false) },
      )
    } catch (e) {
      setError(e.message)
      setTrimRendering(false)
    }
  }

  // ── Step 5: Captions + Export ─────────────────────────────────────────────────
  const goToCaptions = () => {
    setEditedSegments(captionSegments.map(seg => ({ ...seg })))
    setExportDone(false)
    setExportOutputId('')
    setBrollDone(false)
    setBrollOutputId('')
    setBrollItems([])
    setStep(5)
  }

  const handleExportWithCaptions = async () => {
    setError('')
    setExportRendering(true)
    try {
      const res  = await fetch(`${VIDEO_SERVER}/render`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          outputId,
          captionSegments: captionStyle === 'bold-word' && captionWords.length > 0
            ? captionWords.map(w => ({ start: w.start, end: w.end, text: w.word }))
            : editedSegments,
          captionStyle: captionStyle === 'bold-word' ? 'word' : 'subtitle',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Export failed')
      poll(
        data.jobId,
        () => {},
        (result) => {
          setExportOutputId(result.outputId || outputId)
          setExportRendering(false)
          setExportDone(true)
        },
        (msg) => { setError(msg); setExportRendering(false) },
      )
    } catch (e) {
      setError(e.message)
      setExportRendering(false)
    }
  }

  // ── B-roll ────────────────────────────────────────────────────────────────────
  const handleBrollFile = (file) => {
    if (!file || brollItems.length >= 3) return
    const key = ++brollKeyRef.current
    setBrollItems(prev => [...prev, { key, file, mediaId: null, insertAt: '', duration: '', uploading: true }])

    const formData = new FormData()
    formData.append('video', file)
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${VIDEO_SERVER}/upload`)
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText)
          setBrollItems(prev => prev.map(it => it.key === key ? { ...it, mediaId: data.videoId, uploading: false } : it))
        } catch {
          setBrollItems(prev => prev.filter(it => it.key !== key))
          setError('B-roll upload failed.')
        }
      } else {
        setBrollItems(prev => prev.filter(it => it.key !== key))
        setError('B-roll upload failed.')
      }
    })
    xhr.addEventListener('error', () => {
      setBrollItems(prev => prev.filter(it => it.key !== key))
      setError('B-roll upload failed.')
    })
    xhr.send(formData)
  }

  const handleApplyBroll = async () => {
    setError('')
    setBrollApplying(true)
    const placements = brollItems
      .filter(it => it.mediaId && it.insertAt !== '' && it.duration !== '')
      .map(it => ({ mediaId: it.mediaId, insertAt: parseFloat(it.insertAt), duration: parseFloat(it.duration) }))
    const baseId = exportDone ? exportOutputId : outputId
    try {
      const res  = await fetch(`${VIDEO_SERVER}/broll`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ outputId: baseId, placements }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'B-roll render failed')
      poll(
        data.jobId,
        () => {},
        (result) => {
          setBrollOutputId(result.outputId || baseId)
          setBrollApplying(false)
          setBrollDone(true)
        },
        (msg) => { setError(msg); setBrollApplying(false) },
      )
    } catch (e) {
      setError(e.message)
      setBrollApplying(false)
    }
  }

  const fmtTime = (secs) => {
    if (secs == null) return '—'
    const m   = Math.floor(secs / 60)
    const sec = (secs % 60).toFixed(1)
    return `${m}:${sec.padStart(4, '0')}`
  }

  const downloadId = brollDone ? brollOutputId : exportDone ? exportOutputId : outputId

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ color: '#fafafa', fontSize: 22, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.03em' }}>
          AI Video Editor
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          Upload your footage, describe the edit, get a finished video.
        </p>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 40 }}>
        {STEPS.map((label, i) => {
          const num    = i + 1
          const active = step === num
          const done   = step > num
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: done ? '#fff' : active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                  color: done ? '#0a0a0a' : active ? '#fafafa' : 'rgba(255,255,255,0.2)',
                  border: `1px solid ${done ? '#fff' : active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                  {done ? '✓' : num}
                </div>
                <span style={{
                  fontSize: 11,
                  color: active ? '#fafafa' : 'rgba(255,255,255,0.3)',
                  fontWeight: active ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1,
                  height: 1,
                  background: done ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                  marginTop: 14,
                  marginLeft: 8,
                  marginRight: 8,
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── STEP 1: UPLOAD ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          style={{
            ...s.card,
            padding: '72px 32px',
            textAlign: 'center',
            cursor: isUploading ? 'default' : 'pointer',
            border: `1px solid ${isDragging ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
            transition: 'border-color 0.15s',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            style={{ display: 'none' }}
            onChange={e => startUpload(e.target.files?.[0])}
          />
          {isUploading ? (
            <>
              <p style={{ color: '#fafafa', fontSize: 15, fontWeight: 600, margin: '0 0 20px' }}>Uploading…</p>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 4, overflow: 'hidden', maxWidth: 320, margin: '0 auto' }}>
                <div style={{ background: '#fff', height: '100%', width: `${uploadPct}%`, transition: 'width 0.2s' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 12 }}>{uploadPct}%</p>
            </>
          ) : (
            <>
              <div style={{ color: 'rgba(255,255,255,0.18)', marginBottom: 16 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p style={{ color: '#fafafa', fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Drop your video here</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>MP4, MOV, or WEBM · click to browse</p>
            </>
          )}
        </div>
      )}

      {/* ── STEP 2: EDIT ────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={s.card}>
            <label style={s.label}>Describe your edit</label>
            <textarea
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              placeholder="e.g. Remove all pauses and hesitations, keep only the confident moments, cut to 60 seconds"
              style={s.textarea}
              autoFocus
            />
          </div>

          <div style={s.card}>
            <label style={s.label}>Edit style</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {VIBES.map(v => (
                <button
                  key={v.id}
                  onClick={() => setVibe(v.id)}
                  style={{
                    flex: 1, padding: '14px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: vibe === v.id ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${vibe === v.id ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ color: '#fafafa', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{v.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 1.4 }}>{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleEdit} style={s.btnPrimaryFull} disabled={!userPrompt.trim()}>
            Edit Video
          </button>

          <button onClick={() => setStep(1)} style={s.btnGhostFull}>
            ← Upload different video
          </button>
        </div>
      )}

      {/* ── STEP 3: PROCESSING ──────────────────────────────────────────────── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={s.card}>
            {!processingDone ? (
              <>
                <p style={{ color: '#fafafa', fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>
                  {jobProgress || 'Processing…'}
                </p>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 3, overflow: 'hidden' }}>
                  <div style={{ background: '#fff', height: '100%', width: '100%', opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }} />
                </div>
                <style>{`@keyframes pulse { 0%,100%{opacity:.2} 50%{opacity:.5} }`}</style>
              </>
            ) : (
              <>
                <p style={{ color: '#fafafa', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>Edit complete</p>
                {summary && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6, margin: '0 0 28px' }}>
                    {summary}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={goToTrim} style={{ ...s.btnPrimary, flex: 1 }}>
                    Trim & Finalize
                  </button>
                  <button onClick={goToCaptions} style={{ ...s.btnGhost, flex: 1 }}>
                    Skip to Captions
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 4: MANUAL TRIM ─────────────────────────────────────────────── */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Hidden video for preview scrubbing */}
          {localVideoURL && (
            <div style={{ borderRadius: 10, overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.06)' }}>
              <video
                ref={videoRef}
                src={localVideoURL}
                style={{ width: '100%', maxHeight: 200, display: 'block', objectFit: 'contain' }}
                playsInline
              />
            </div>
          )}

          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <label style={{ ...s.label, marginBottom: 0 }}>Clips — {remainingClips.length} remaining</label>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                {fmtTime(remainingClips.reduce((sum, c) => sum + (c.end - c.start), 0))} total
              </span>
            </div>
            {remainingClips.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No clips. All have been removed.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {remainingClips.map((clip, i) => {
                  const dur = clip.end != null && clip.start != null ? (clip.end - clip.start).toFixed(1) : '—'
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8,
                      }}
                    >
                      {/* Top row: timestamps + duration + actions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <div>
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Start</div>
                            <div style={{ color: '#fafafa', fontSize: 13, fontWeight: 500 }}>{fmtTime(clip.start)}</div>
                          </div>
                          <div>
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>End</div>
                            <div style={{ color: '#fafafa', fontSize: 13, fontWeight: 500 }}>{fmtTime(clip.end)}</div>
                          </div>
                          <div>
                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Duration</div>
                            <div style={{ color: '#fafafa', fontSize: 13, fontWeight: 500 }}>{dur}s</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {localVideoURL && (
                            <button
                              onClick={() => previewClip(clip.start)}
                              style={{ ...s.btnGhost, padding: '6px 12px', fontSize: 12 }}
                            >
                              ▶ Preview
                            </button>
                          )}
                          <button
                            onClick={() => setRemainingClips(prev => prev.filter((_, j) => j !== i))}
                            style={s.btnDanger}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {/* Editable in/out */}
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginBottom: 4 }}>Adjust start (s)</div>
                          <input
                            type="number"
                            step="0.1"
                            value={clip.start}
                            onChange={e => setRemainingClips(prev => prev.map((c, j) => j === i ? { ...c, start: parseFloat(e.target.value) || 0 } : c))}
                            style={s.inputSmall}
                          />
                        </div>
                        <div>
                          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginBottom: 4 }}>Adjust end (s)</div>
                          <input
                            type="number"
                            step="0.1"
                            value={clip.end}
                            onChange={e => setRemainingClips(prev => prev.map((c, j) => j === i ? { ...c, end: parseFloat(e.target.value) || 0 } : c))}
                            style={s.inputSmall}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <button
            onClick={handleApplyTrim}
            disabled={trimRendering || remainingClips.length === 0}
            style={{ ...s.btnPrimaryFull, opacity: trimRendering || remainingClips.length === 0 ? 0.5 : 1 }}
          >
            {trimRendering ? 'Rendering…' : 'Apply Trim'}
          </button>

          <button onClick={goToCaptions} style={s.btnGhostFull}>
            Skip — go to captions
          </button>
        </div>
      )}

      {/* ── STEP 5: CAPTIONS ────────────────────────────────────────────────── */}
      {step === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Transcript editor */}
          <div style={s.card}>
            <label style={s.label}>Transcript — edit any line</label>
            {editedSegments.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No caption segments available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {editedSegments.map((seg, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, minWidth: 44, textAlign: 'right', flexShrink: 0 }}>
                      {fmtTime(seg.start)}
                    </span>
                    <input
                      value={seg.text || ''}
                      onChange={e => setEditedSegments(prev => prev.map((s, j) => j === i ? { ...s, text: e.target.value } : s))}
                      style={s.input}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caption style */}
          <div style={s.card}>
            <label style={s.label}>Caption style</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { id: 'subtitle',   label: 'Subtitle',   desc: 'Clean sentence lines at the bottom' },
                { id: 'bold-word',  label: 'TikTok',     desc: 'Word-by-word, bold, center screen' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setCaptionStyle(opt.id)}
                  style={{
                    flex: 1, padding: '14px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: captionStyle === opt.id ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${captionStyle === opt.id ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ color: '#fafafa', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{opt.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Export actions */}
          <button
            onClick={handleExportWithCaptions}
            disabled={exportRendering || exportDone}
            style={{ ...s.btnPrimaryFull, opacity: exportRendering || exportDone ? 0.5 : 1 }}
          >
            {exportRendering ? 'Exporting…' : exportDone ? 'Exported ✓' : 'Export with Captions'}
          </button>

          <a
            href={`${VIDEO_SERVER}/download/${outputId}`}
            download
            style={s.btnGhostFull}
          >
            Export without Captions
          </a>

          {/* Download link after export */}
          {(exportDone || brollDone) && (
            <a
              href={`${VIDEO_SERVER}/download/${downloadId}`}
              download
              style={s.btnDownload}
            >
              Download finished video
            </a>
          )}

          {/* B-roll section */}
          <div style={{ ...s.card, marginTop: 8 }}>
            <label style={s.label}>Upload B-roll</label>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>
              Add up to 3 videos or images to insert into the edit.
            </p>

            {brollItems.map((item, i) => (
              <div
                key={item.key}
                style={{
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: item.uploading ? 0 : 12 }}>
                  <span style={{ color: '#fafafa', fontSize: 13, fontWeight: 500 }}>
                    {item.file.name.length > 32 ? item.file.name.slice(0, 32) + '…' : item.file.name}
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {item.uploading && (
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Uploading…</span>
                    )}
                    <button
                      onClick={() => setBrollItems(prev => prev.filter(it => it.key !== item.key))}
                      style={s.btnDanger}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {!item.uploading && (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 6 }}>Insert at (seconds)</div>
                      <input
                        type="number"
                        value={item.insertAt}
                        min="0"
                        step="0.1"
                        onChange={e => setBrollItems(prev => prev.map(it => it.key === item.key ? { ...it, insertAt: e.target.value } : it))}
                        style={s.inputSmall}
                        placeholder="0.0"
                      />
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 6 }}>Duration (seconds)</div>
                      <input
                        type="number"
                        value={item.duration}
                        min="0.5"
                        step="0.1"
                        onChange={e => setBrollItems(prev => prev.map(it => it.key === item.key ? { ...it, duration: e.target.value } : it))}
                        style={s.inputSmall}
                        placeholder="3.0"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {brollItems.length < 3 && (
              <>
                <input
                  ref={brollInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,image/*"
                  style={{ display: 'none' }}
                  onChange={e => { handleBrollFile(e.target.files?.[0]); e.target.value = '' }}
                />
                <button
                  onClick={() => brollInputRef.current?.click()}
                  style={{
                    ...s.btnGhostFull,
                    borderStyle: 'dashed',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: 13,
                  }}
                >
                  + Add B-roll file ({3 - brollItems.length} remaining)
                </button>
              </>
            )}

            {brollItems.some(it => !it.uploading && it.mediaId) && (
              <button
                onClick={handleApplyBroll}
                disabled={brollApplying}
                style={{ ...s.btnPrimaryFull, marginTop: 14, opacity: brollApplying ? 0.5 : 1 }}
              >
                {brollApplying ? 'Applying B-roll…' : brollDone ? 'B-roll Applied ✓' : 'Apply B-roll'}
              </button>
            )}

            {brollDone && (
              <a
                href={`${VIDEO_SERVER}/download/${brollOutputId}`}
                download
                style={{ ...s.btnDownload, marginTop: 12 }}
              >
                Download with B-roll
              </a>
            )}
          </div>

        </div>
      )}

      {error && <p style={s.error}>{error}</p>}

    </div>
  )
}
