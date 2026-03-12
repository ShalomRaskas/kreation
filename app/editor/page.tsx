'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Clip {
  start: number
  end: number
  reason: string
}

interface EditPlan {
  clips: Clip[]
  summary: string
  estimated_duration: number
  caption: string
}

type Step = 'upload' | 'transcript' | 'prompt' | 'result'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function EditorPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoURL, setVideoURL] = useState<string>('')
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoId, setVideoId] = useState<string>('')
  const [videoExt, setVideoExt] = useState<string>('.mp4')
  const [processing, setProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string>('')

  const [transcript, setTranscript] = useState('')
  const [editPrompt, setEditPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [editPlan, setEditPlan] = useState<EditPlan | null>(null)
  const [copied, setCopied] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please upload a video file (mp4, mov, webm)')
      return
    }
    setError('')
    setVideoFile(file)
    const url = URL.createObjectURL(file)
    setVideoURL(url)

    // Upload directly to Supabase Storage (HTTPS)
    setUploading(true)
    setUploadProgress(0)

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'mp4'
      const storageName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { data, error } = await supabase.storage
        .from('videos')
        .upload(`uploads/${storageName}`, file, {
          contentType: file.type,
          upsert: false,
        })

      if (error) throw new Error(error.message)

      setVideoId(data.path)
      setVideoExt(`.${ext}`)
      setUploadProgress(100)
      setStep('transcript')
    } catch (err) {
      setError('Upload failed. Check your connection and try again.')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  const handleDurationLoad = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration)
    }
  }

  async function handleGetEditPlan() {
    if (!transcript.trim() || !editPrompt.trim()) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/video/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          prompt: editPrompt,
          duration: videoDuration,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate edit plan')
      const plan = data.editPlan
      setEditPlan(plan)

      // Kick off actual video processing
      if (videoId && plan.clips?.length > 0) {
        setProcessing(true)
        try {
          const processRes = await fetch('/api/video/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              storagePath: videoId,
              clips: plan.clips.map((c: Clip) => ({ start: c.start, end: c.end })),
            }),
          })
          const processData = await processRes.json()
          if (processRes.ok && processData.downloadUrl) {
            setDownloadUrl(processData.downloadUrl)
          }
        } catch {
          // Non-fatal — user still gets the edit plan
        } finally {
          setProcessing(false)
        }
      }

      setStep('result')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleCopyCaption() {
    if (!editPlan) return
    navigator.clipboard.writeText(editPlan.caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleReset() {
    setStep('upload')
    setVideoFile(null)
    setVideoURL('')
    setVideoDuration(0)
    setTranscript('')
    setEditPrompt('')
    setEditPlan(null)
    setError('')
    setVideoId('')
    setDownloadUrl('')
    setUploadProgress(0)
  }

  const STEPS = [
    { id: 'upload', label: 'Upload' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'prompt', label: 'Edit' },
    { id: 'result', label: 'Result' },
  ]

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white/30 hover:text-white/60 transition-colors text-sm"
          >
            ← Dashboard
          </button>
          <span className="text-sm font-bold tracking-tight">Kreation •)) / Editor</span>
        </div>

        {/* Step indicator */}
        <div className="hidden md:flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                  i === stepIndex
                    ? 'bg-white text-black font-semibold'
                    : i < stepIndex
                      ? 'text-white/60'
                      : 'text-white/20'
                }`}
              >
                {i < stepIndex && <span>✓</span>}
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <span className={`text-xs ${i < stepIndex ? 'text-white/30' : 'text-white/10'}`}>
                  /
                </span>
              )}
            </div>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* ── STEP 1: Upload ── */}
        {step === 'upload' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">AI Video Editor</h1>
              <p className="text-white/40">
                Upload your raw footage. Tell Kreation what you want. Get a ready-to-cut edit plan
                in seconds.
              </p>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-white/40 bg-white/5'
                  : 'border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
              <div className="space-y-3">
                <div className="text-4xl">▶</div>
                <div>
                  <p className="text-sm font-medium text-white/70">
                    Drop your video here, or click to browse
                  </p>
                  <p className="text-xs text-white/25 mt-1">MP4, MOV, WEBM · up to 2GB</p>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        )}

        {/* ── STEP 2: Transcript ── */}
        {step === 'transcript' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Add your transcript</h1>
              <p className="text-white/40">
                Paste the transcript of your video. Auto-transcription is coming — for now, you can
                copy from YouTube, Descript, or any tool.
              </p>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>Uploading {videoFile?.name}…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Video preview */}
            {videoURL && !uploading && (
              <div className="rounded-xl overflow-hidden bg-black border border-white/[0.06]">
                <video
                  ref={videoRef}
                  src={videoURL}
                  controls
                  onLoadedMetadata={handleDurationLoad}
                  className="w-full max-h-[280px] object-contain"
                />
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-white/30 truncate max-w-[60%]">
                    {videoFile?.name}
                  </span>
                  {videoDuration > 0 && (
                    <span className="text-xs text-white/30">
                      {formatTime(videoDuration)}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-medium text-white/60">Transcript</label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={`Paste your video transcript here with timestamps if you have them. Example:\n\n[0:00] Hey guys, today I want to talk about...\n[0:12] The biggest mistake I see founders make is...\n[1:30] Here's what actually works...`}
                rows={10}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none font-mono"
              />
              <p className="text-xs text-white/20">
                No timestamps? Just paste the raw text — Kreation will work with what you give it.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors border border-white/10 hover:border-white/20"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep('prompt')}
                disabled={!transcript.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white text-black font-semibold disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Edit Prompt ── */}
        {step === 'prompt' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Describe your edit</h1>
              <p className="text-white/40">
                Tell Kreation exactly what you want. Be specific — the more detail, the better the
                cut.
              </p>
            </div>

            {/* Prompt examples */}
            <div className="space-y-2">
              <p className="text-xs text-white/25 uppercase tracking-wider">Examples</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Make this 30 seconds, focus on the most valuable insight',
                  'Cut a 15-second hook for TikTok',
                  'Keep only the part about pricing, make it punchy',
                  'Create a 60-second version removing the intro',
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setEditPrompt(example)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors border border-white/[0.06]"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-white/60">Edit instruction</label>
              <textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="e.g. Make this into a 20-second TikTok. Focus on the part where I talk about quitting my job. Cut everything else."
                rows={4}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
                autoFocus
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('transcript')}
                className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors border border-white/10 hover:border-white/20"
              >
                ← Back
              </button>
              <button
                onClick={handleGetEditPlan}
                disabled={!editPrompt.trim() || loading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white text-black font-semibold disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
              >
                {loading ? 'Generating edit plan…' : 'Generate edit plan →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Result ── */}
        {step === 'result' && editPlan && (
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Your edit plan</h1>
                <p className="text-white/40">
                  {editPlan.summary}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatTime(editPlan.estimated_duration)}</div>
                <div className="text-xs text-white/30">final cut</div>
              </div>
            </div>

            {/* Clips */}
            <div className="space-y-3">
              <p className="text-xs text-white/25 uppercase tracking-wider">
                {editPlan.clips.length} clip{editPlan.clips.length !== 1 ? 's' : ''}
              </p>
              {editPlan.clips.map((clip, i) => (
                <div
                  key={i}
                  className="bg-[#1a1a1a] border border-white/[0.07] rounded-xl px-5 py-4 flex items-start gap-4"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white/60">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-mono font-medium">
                        {formatTime(clip.start)} → {formatTime(clip.end)}
                      </span>
                      <span className="text-xs text-white/30">
                        {clip.end - clip.start}s
                      </span>
                    </div>
                    <p className="text-xs text-white/50">{clip.reason}</p>
                  </div>
                  {videoURL && (
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = clip.start
                          videoRef.current.play()
                        }
                      }}
                      className="flex-shrink-0 text-xs px-2.5 py-1 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70 transition-colors border border-white/[0.06]"
                    >
                      ▶ Preview
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Caption */}
            <div className="bg-[#1a1a1a] border border-white/[0.07] rounded-xl px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/25 uppercase tracking-wider">Suggested caption</p>
                <button
                  onClick={handleCopyCaption}
                  className={`text-xs px-3 py-1 rounded-lg transition-all border ${
                    copied
                      ? 'text-green-400 border-green-400/30 bg-green-400/10'
                      : 'text-white/30 border-white/10 hover:text-white/60 hover:border-white/20'
                  }`}
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{editPlan.caption}</p>
            </div>

            {/* Video preview (small) */}
            {videoURL && (
              <div className="rounded-xl overflow-hidden bg-black border border-white/[0.06]">
                <video
                  ref={videoRef}
                  src={videoURL}
                  controls
                  className="w-full max-h-[200px] object-contain"
                />
                <p className="text-xs text-white/20 px-4 py-2">
                  Use the timestamps above to make your cuts in any editing tool
                </p>
              </div>
            )}

            {/* Download / processing state */}
            {processing && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 flex items-center gap-4">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white/70">Cutting your video…</p>
                  <p className="text-xs text-white/30 mt-0.5">FFmpeg is applying the edit plan</p>
                </div>
              </div>
            )}

            {downloadUrl && !processing && (
              <a
                href={downloadUrl}
                download
                className="flex items-center justify-between bg-white text-black rounded-xl px-5 py-4 font-semibold hover:bg-white/90 transition-colors"
              >
                <div>
                  <p className="text-sm font-bold">Download edited video</p>
                  <p className="text-xs text-black/50 mt-0.5">Ready to post</p>
                </div>
                <span className="text-xl">↓</span>
              </a>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('prompt')}
                className="px-4 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors border border-white/10 hover:border-white/20"
              >
                ← Try different edit
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white text-black font-semibold hover:bg-white/90 transition-colors"
              >
                New video →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
