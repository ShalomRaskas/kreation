import { useState, useEffect, useRef } from 'react'

const VIDEO_SERVER = 'https://krreation.duckdns.org'

const VIBES = [
  { id: 'high-energy', label: 'High Energy', desc: 'Fast, punchy, confident moments only' },
  { id: 'balanced',    label: 'Balanced',    desc: 'Clear and natural pacing' },
  { id: 'cinematic',   label: 'Cinematic',   desc: 'Composed, intentional, breathing room' },
]

const s = {
  page: {
    maxWidth: 680,
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
  btnPrimary: {
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
    marginTop: 12,
  },
}

export default function EditorPage() {
  const [state,       setState]      = useState('upload')   // 'upload' | 'edit' | 'processing'
  const [videoId,     setVideoId]    = useState('')
  const [videoExt,    setVideoExt]   = useState('')
  const [userPrompt,  setUserPrompt] = useState('')
  const [vibe,        setVibe]       = useState('balanced')
  const [jobId,       setJobId]      = useState('')
  const [jobStatus,   setJobStatus]  = useState('')
  const [jobSummary,  setJobSummary] = useState('')
  const [outputId,    setOutputId]   = useState('')
  const [progress,    setProgress]   = useState(0)
  const [uploadPct,   setUploadPct]  = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging,  setIsDragging] = useState(false)
  const [error,       setError]      = useState('')

  const fileInputRef = useRef(null)
  const pollRef      = useRef(null)

  useEffect(() => () => clearInterval(pollRef.current), [])

  // ── Upload ────────────────────────────────────────────────────────────────
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
          setState('edit')
        } catch {
          setError('Upload succeeded but response was malformed.')
        }
      } else {
        setError(`Upload failed (${xhr.status}). Check that the video server is running.`)
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
    const file = e.dataTransfer.files?.[0]
    if (file) startUpload(file)
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
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
      setJobId(data.jobId)
      setJobStatus('queued')
      setProgress(0)
      setState('processing')
      startPolling(data.jobId)
    } catch (e) {
      setError(e.message)
    }
  }

  // ── Poll ──────────────────────────────────────────────────────────────────
  const startPolling = (jid) => {
    clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${VIDEO_SERVER}/job/${jid}`)
        const data = await res.json()
        setJobStatus(data.status)
        if (data.progress != null) setProgress(data.progress)
        if (data.status === 'done') {
          clearInterval(pollRef.current)
          setOutputId(data.outputId || data.downloadUrl?.split('/').pop() || jid)
          setJobSummary(data.summary || data.cutSummary || '')
          setProgress(100)
        } else if (data.status === 'error') {
          clearInterval(pollRef.current)
          setError(data.error || 'Processing failed.')
        }
      } catch {
        // transient network error — keep polling
      }
    }, 2000)
  }

  const reset = () => {
    clearInterval(pollRef.current)
    setState('upload')
    setVideoId('')
    setVideoExt('')
    setUserPrompt('')
    setVibe('balanced')
    setJobId('')
    setJobStatus('')
    setJobSummary('')
    setOutputId('')
    setProgress(0)
    setUploadPct(0)
    setError('')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>

      <div style={{ marginBottom: 40 }}>
        <h1 style={{ color: '#fafafa', fontSize: 22, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.03em' }}>
          AI Video Editor
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
          Upload your footage, describe the edit, get a finished video.
        </p>
      </div>

      {/* ── STATE 1: UPLOAD ─────────────────────────────────────────────── */}
      {state === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          style={{
            ...s.card,
            padding: '64px 32px',
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
              <p style={{ color: '#fafafa', fontSize: 15, fontWeight: 600, margin: '0 0 20px' }}>
                Uploading…
              </p>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 4, overflow: 'hidden', maxWidth: 320, margin: '0 auto' }}>
                <div style={{ background: '#fff', height: '100%', width: `${uploadPct}%`, transition: 'width 0.2s' }} />
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 12 }}>{uploadPct}%</p>
            </>
          ) : (
            <>
              <div style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 16 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p style={{ color: '#fafafa', fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>
                Drop your video here
              </p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, margin: 0 }}>
                MP4, MOV, or WEBM · max 5 minutes
              </p>
            </>
          )}
        </div>
      )}

      {/* ── STATE 2: EDIT ───────────────────────────────────────────────── */}
      {state === 'edit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={s.card}>
            <label style={s.label}>What do you want to create?</label>
            <textarea
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              placeholder="Describe your edit — e.g. 'Remove all pauses and hesitations, keep only the confident moments, cut to 60 seconds'"
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
                    flex: 1, padding: '14px 12px', borderRadius: 10, cursor: 'pointer',
                    background: vibe === v.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${vibe === v.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                >
                  <div style={{ color: '#fafafa', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{v.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, lineHeight: 1.4 }}>{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleEdit} style={s.btnPrimary}>
            Edit Video
          </button>

          <button onClick={reset} style={s.btnGhost}>
            ← Upload different video
          </button>
        </div>
      )}

      {/* ── STATE 3: PROCESSING ─────────────────────────────────────────── */}
      {state === 'processing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={s.card}>
            {jobStatus === 'done' ? (
              <>
                <p style={{ color: '#fafafa', fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>
                  Edit complete
                </p>
                {jobSummary && (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
                    {jobSummary}
                  </p>
                )}
                <a
                  href={`${VIDEO_SERVER}/download/${outputId}`}
                  download
                  style={s.btnDownload}
                >
                  Download edited video
                </a>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ color: '#fafafa', fontSize: 14, fontWeight: 600, margin: 0 }}>
                    {jobStatus === 'queued'     ? 'Queued…'
                     : jobStatus === 'transcribing' ? 'Transcribing audio…'
                     : jobStatus === 'analyzing'    ? 'Analyzing footage…'
                     : jobStatus === 'cutting'      ? 'Cutting clips…'
                     : 'Processing…'}
                  </p>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{progress}%</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
                  <div style={{
                    background: '#fff',
                    height: '100%',
                    width: `${progress}%`,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </>
            )}
          </div>

          {jobStatus === 'done' && (
            <button onClick={reset} style={s.btnGhost}>
              Edit another video
            </button>
          )}
        </div>
      )}

      {error && <p style={s.error}>{error}</p>}

    </div>
  )
}
