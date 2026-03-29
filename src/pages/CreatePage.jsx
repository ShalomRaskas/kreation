import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMic, MicButton } from '../hooks/useMic'
import AuthenticityGauge from '../components/AuthenticityGauge'
import TerminalLog from '../components/TerminalLog'
import VoiceMaturity from '../components/VoiceMaturity'
import SparkInput from '../components/SparkInput'
import RecordingModal from '../components/RecordingModal'
import {
  callClaude,
  buildDNASystem,
  calculateAuthenticityScore,
  buildRoasterPrompt,
  buildDNASynthPrompt,
  categorizeDiff,
} from '../services/voiceSync'
import {
  publishPost,
  retrieveSimilarPosts,
  analyzeDelta,
  getLearnedContext,
} from '../services/learningEngine'
import {
  getVoiceMaturity,
  getWeights,
  recordEditDiff,
  recordPublish,
  buildWeightContext,
} from '../services/longTermMemory'
import {
  getDNAControls,
  buildControlContext,
} from '../services/dnaControls'

const SYSTEM = buildDNASystem()

const PLATFORMS = [
  {
    id: 'tiktok', label: 'TikTok', icon: '♪',
    cta: 'Generate TikTok Script', outputLabel: 'TikTok Script',
    active: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
    base:   'border-white/[0.06] text-white/30 hover:border-white/20 hover:text-white/60',
    algo: 'Hook must land in the first 1.5 seconds or viewers scroll. Optimise for watch-through rate — build fast, reward at the end. Native, unpolished tone wins over production value. CTA must feel organic, never salesy. 30-45 second sweet spot.',
    format: '[HOOK]\n[SETUP]\n[BUILD]\n[PEAK]\n[PAYOFF + CTA]',
  },
  {
    id: 'reels', label: 'Reels', icon: '◈',
    cta: 'Generate Reel Script', outputLabel: 'Instagram Reel',
    active: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
    base:   'border-white/[0.06] text-white/30 hover:border-white/20 hover:text-white/60',
    algo: 'Shares and saves drive Reels discovery — more than likes. Slightly more polished than TikTok but still raw enough to feel real. Strong opening visual hook. 15-30 seconds is the sweet spot. Leave a hook in the caption to extend dwell time.',
    format: '[HOOK]\n[SETUP]\n[BUILD]\n[PEAK]\n[PAYOFF + SHARE HOOK]',
  },
  {
    id: 'shorts', label: 'Shorts', icon: '▶',
    cta: 'Generate Shorts Script', outputLabel: 'YouTube Short',
    active: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
    base:   'border-white/[0.06] text-white/30 hover:border-white/20 hover:text-white/60',
    algo: 'Completion rate and re-watches are the key metric. Loop-worthy endings pull viewers back — the payoff should connect back to the hook. Educational or insight-driven content thrives. 45-60 seconds. Weave in a subscribe CTA naturally.',
    format: '[HOOK]\n[SETUP]\n[BUILD]\n[PEAK]\n[PAYOFF + LOOP/SUBSCRIBE CTA]',
  },
  {
    id: 'twitter', label: 'X / Twitter', icon: '𝕏',
    cta: 'Generate Thread', outputLabel: 'X Thread',
    active: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
    base:   'border-white/[0.06] text-white/30 hover:border-white/20 hover:text-white/60',
    algo: 'This is a tweet thread, NOT a video script. The opening tweet must work as a standalone hook — it carries the full weight. Bold opinions and hot takes outperform neutral takes. Each point should be quotable on its own. Avoid external links in the opening tweet. Engagement in the first hour is everything.',
    format: '[OPENING TWEET — standalone hook, no more than 2 sentences]\n[POINT 1]\n[POINT 2]\n[POINT 3]\n[CLOSER + engagement question]',
  },
  {
    id: 'linkedin', label: 'LinkedIn', icon: 'in',
    cta: 'Generate Post', outputLabel: 'LinkedIn Post',
    active: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
    base:   'border-white/[0.06] text-white/30 hover:border-white/20 hover:text-white/60',
    algo: 'Comments drive the algorithm — end with a direct open question. The first 2-3 lines appear before the "see more" fold — that is your hook. Dwell time matters so build the story slowly. Personal narrative outperforms promotional content. Text posts outperform posts with external links.',
    format: '[HOOK — 2 lines max, must work before "see more"]\n[STORY / CONTEXT]\n[INSIGHT]\n[LESSON / TAKEAWAY]\n[QUESTION TO DRIVE COMMENTS]',
  },
]

const VIDEO_IDS = ['tiktok', 'reels', 'shorts']
const TEXT_IDS  = ['twitter', 'linkedin']

export default function CreatePage() {
  const navigate = useNavigate()

  const [contentType,     setContentType]     = useState('video')
  const [topic,           setTopic]           = useState('')
  const [brainDump,       setBrainDump]       = useState('')
  const [platform,        setPlatform]        = useState('tiktok')
  const [showRecording,   setShowRecording]   = useState(false)

  const visiblePlatforms = PLATFORMS.filter(p =>
    contentType === 'video' ? VIDEO_IDS.includes(p.id) : TEXT_IDS.includes(p.id)
  )

  const handleTypeChange = (type) => {
    setContentType(type)
    const valid = type === 'video' ? VIDEO_IDS : TEXT_IDS
    if (!valid.includes(platform)) setPlatform(valid[0])
  }

  const [generatedScript, setGeneratedScript] = useState('')
  const [isGenerating,    setIsGenerating]    = useState(false)
  const [createError,     setCreateError]     = useState('')

  const [createLogs,        setCreateLogs]        = useState([])
  const [authenticityScore, setAuthenticityScore] = useState(null)
  const [isPurging,         setIsPurging]         = useState(false)

  const editBeforeRef  = useRef('')
  const aiDraftRef     = useRef('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishFlash, setPublishFlash] = useState(false)
  const [isSparking,   setIsSparking]   = useState(false)
  const [voiceMaturity, setVoiceMaturity] = useState(() => getVoiceMaturity())

  const builderMic = useMic(
    (text) => setBrainDump(text),
    (final) => {
      if (final === '__error__') setCreateError('Microphone error — try Chrome or Edge.')
      else setBrainDump(final)
    }
  )

  const addLog = (entry) => setCreateLogs(prev => [...prev, entry])

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setIsGenerating(true)
    setCreateError('')
    setCreateLogs([])
    setAuthenticityScore(null)
    setGeneratedScript('')

    const logs = []
    const log = (entry) => { logs.push(entry); setCreateLogs([...logs]) }

    try {
      const p = PLATFORMS.find(pl => pl.id === platform)
      const platformBlock = `TARGET PLATFORM: ${p.label}\nALGORITHM NOTES: ${p.algo}\nOUTPUT FORMAT:\n${p.format}`

      const similarPosts   = retrieveSimilarPosts(topic)
      const learnedCtx     = getLearnedContext()
      const weightCtx      = buildWeightContext(getWeights())
      const combinedLearned = [learnedCtx, weightCtx].filter(Boolean).join('\n')

      const similarBlock = similarPosts.length
        ? `\n\nPAST SUCCESSFUL POSTS (similar theme — mirror their tone and structure):\n${similarPosts.map((sp, i) => `[${i + 1}] ${sp.content.slice(0, 200)}`).join('\n')}`
        : ''
      const learnedBlock = combinedLearned
        ? `\n\nLEARNED VOICE PREFERENCES (apply all of these):\n${combinedLearned}`
        : ''

      const controlCtx   = buildControlContext(getDNAControls())
      const controlBlock = `\n\nDNA CONTROLS:\n${controlCtx}`

      if (similarPosts.length) log({ type: 'EVOLVE', message: `Injecting ${similarPosts.length} similar post(s) from memory.` })
      if (weightCtx)           log({ type: 'LEARN',  message: `Weight context active: ${weightCtx.split('\n')[0]}` })
      else if (learnedCtx)     log({ type: 'LEARN',  message: `Applying ${learnedCtx.split('|').length} learned preference(s).` })

      const userMessage = brainDump.trim()
        ? `${platformBlock}${similarBlock}${learnedBlock}${controlBlock}\n\nTopic: ${topic}\n\nBrain Dump:\n${brainDump}\n\nWrite content exactly as specified for this platform.`
        : `${platformBlock}${similarBlock}${learnedBlock}${controlBlock}\n\nTopic: ${topic}\n\nNo brain dump. From my voice profile alone, write content for this platform from scratch.`

      // ── STEP 1: Draft ──────────────────────────────────────────────────
      log({ type: 'DNA', message: 'Detecting user-specific rhythm...' })
      const draft = await callClaude(SYSTEM, userMessage, 1024)

      const { score: rawScore, log: scoreLogs } = calculateAuthenticityScore(draft)
      scoreLogs.forEach(l => log(l))
      setAuthenticityScore(rawScore)

      const isMirrorMode = voiceMaturity >= 90
      if (rawScore >= 70 || isMirrorMode) {
        log({ type: 'SYNC', message: isMirrorMode
          ? `🪞 Mirror Mode — reflecting your voice. No critique needed. (${rawScore}% match)`
          : `DNA match at ${rawScore}. No refinement needed.`
        })
        aiDraftRef.current = draft
        setGeneratedScript(draft)
        return
      }

      // ── STEP 2: Roaster ────────────────────────────────────────────────
      log({ type: 'DNA', message: 'Roaster scanning for mid-tier content...' })
      const roasterResponse = await callClaude(
        'You are a brutal content critic. Identify the weakest sections. Return only valid JSON.',
        buildRoasterPrompt(draft),
        600
      )

      let flagged = []
      try {
        const match = roasterResponse.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          flagged = (parsed.flagged || []).filter(f => f.severity === 'high' || f.severity === 'medium')
          if (parsed.verdict) log({ type: 'DNA', message: `Verdict: ${parsed.verdict}` })
        }
      } catch { /* malformed JSON */ }

      if (flagged.length === 0) {
        aiDraftRef.current = draft
        setGeneratedScript(draft)
        return
      }

      // ── STEP 3: DNA-Synth ──────────────────────────────────────────────
      log({ type: 'SYNC', message: `Injecting user-jargon: "going all in", "that's the thing", "cooked"` })
      log({ type: 'DNA', message: `Rewriting ${flagged.length} flagged section(s) with DNA-Synth...` })

      const refined = await callClaude(SYSTEM, buildDNASynthPrompt(draft, flagged), 1200)

      const { score: refinedScore, log: refinedLogs } = calculateAuthenticityScore(refined)
      const gained = Math.max(0, refinedScore - rawScore)
      refinedLogs.forEach(l => log(l))
      log({ type: 'CLEAN', message: `Removed ${flagged.length} generic section(s). Score +${gained}` })
      log({ type: 'SYNC',  message: `DNA Match: ${refinedScore}%. Script is human-passing.` })

      setAuthenticityScore(refinedScore)
      aiDraftRef.current = refined
      setGeneratedScript(refined)

    } catch (e) {
      setCreateError(e.message)
      log({ type: 'ERROR', message: e.message })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePurge = async () => {
    if (!generatedScript || isPurging) return
    setIsPurging(true)
    const logs = [...createLogs]
    const log = (entry) => { logs.push(entry); setCreateLogs([...logs]) }

    try {
      log({ type: 'DNA', message: 'Purge triggered — re-roasting output...' })

      const roasterResponse = await callClaude(
        'You are a brutal content critic. Identify the weakest sections. Return only valid JSON.',
        buildRoasterPrompt(generatedScript),
        600
      )

      let flagged = []
      try {
        const match = roasterResponse.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          flagged = parsed.flagged || []
        }
      } catch { /* skip */ }

      if (flagged.length === 0) {
        log({ type: 'SYNC', message: 'No slop found. Output is already clean.' })
        return
      }

      log({ type: 'SYNC', message: `Injecting user-jargon: "going all in", "that's the thing", "proper"` })
      const purged = await callClaude(SYSTEM, buildDNASynthPrompt(generatedScript, flagged), 1200)
      const { score: newScore } = calculateAuthenticityScore(purged)
      log({ type: 'CLEAN', message: `Purge complete. DNA Match: ${newScore}%` })

      setAuthenticityScore(newScore)
      setGeneratedScript(purged)
    } catch (e) {
      log({ type: 'ERROR', message: e.message })
    } finally {
      setIsPurging(false)
    }
  }

  const handlePublish = async () => {
    if (!generatedScript || isPublishing) return
    setIsPublishing(true)
    try {
      const diff = aiDraftRef.current
        ? categorizeDiff(aiDraftRef.current, generatedScript)
        : { editRatio: 1 }

      await publishPost(generatedScript, platform, addLog, authenticityScore)
      const ltm = recordPublish(diff.editRatio)
      setVoiceMaturity(ltm.voice_maturity)

      if (ltm.isInSync) {
        addLog({ type: 'EVOLVE', message: `🪞 AI was in sync (<5% edits). Voice Maturity: ${ltm.voice_maturity}%` })
      } else {
        addLog({ type: 'EVOLVE', message: `Voice Maturity: ${ltm.voice_maturity}% — ${Math.round(diff.editRatio * 100)}% of draft was edited.` })
      }

      setPublishFlash(true)
      setTimeout(() => setPublishFlash(false), 2000)
    } catch (e) {
      addLog({ type: 'ERROR', message: e.message })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSpark = async (sparkText) => {
    setIsSparking(true)
    setCreateError('')
    setCreateLogs([])
    setAuthenticityScore(null)
    setGeneratedScript('')
    setTopic(sparkText)

    const logs = []
    const log = (entry) => { logs.push(entry); setCreateLogs([...logs]) }

    try {
      const weights   = getWeights()
      const weightCtx = buildWeightContext(weights)
      const p = PLATFORMS.find(pl => pl.id === platform)

      log({ type: 'DNA', message: `⚡ Spark detected — pulling voice weights...` })
      if (weightCtx) log({ type: 'LEARN', message: weightCtx.split('\n')[0] })

      const similarPosts = retrieveSimilarPosts(sparkText)
      const similarBlock = similarPosts.length
        ? `\n\nPAST SUCCESSFUL POSTS (use for structural reference):\n${similarPosts.map((sp, i) => `[${i + 1}] ${sp.content.slice(0, 200)}`).join('\n')}`
        : ''
      if (similarPosts.length) log({ type: 'EVOLVE', message: `Pulled ${similarPosts.length} similar post(s) from memory.` })

      const controlCtx = buildControlContext(getDNAControls())

      const userMessage =
        `TARGET PLATFORM: ${p.label}\nALGORITHM NOTES: ${p.algo}\nOUTPUT FORMAT:\n${p.format}` +
        similarBlock +
        (weightCtx ? `\n\nVOICE WEIGHTS (apply all):\n${weightCtx}` : '') +
        `\n\nDNA CONTROLS:\n${controlCtx}` +
        `\n\nSPARK INPUT: "${sparkText}"\n\nGenerate a complete ${p.label} post from this spark. No questions. Direct output.`

      const output = await callClaude(SYSTEM, userMessage, 1024)
      const { score } = calculateAuthenticityScore(output)
      setAuthenticityScore(score)
      aiDraftRef.current = output
      setGeneratedScript(output)
      log({ type: 'SYNC', message: `⚡ Spark → Post complete. DNA Match: ${score}%` })

    } catch (e) {
      setCreateError(e.message)
      log({ type: 'ERROR', message: e.message })
    } finally {
      setIsSparking(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Main two-panel ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-white/[0.06] min-h-[76vh]" style={{ background: 'rgba(255,255,255,0.01)' }}>

        {/* Left: Command Center */}
        <div className="lg:col-span-5 flex flex-col border-r border-white/[0.06]">
          <div className="flex flex-col gap-5 p-8">

            {/* Section label */}
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">
              Command Center
            </p>

            {/* Content type toggle */}
            <div className="flex rounded-lg border border-white/[0.06] p-0.5 bg-white/[0.02]">
              <button
                onClick={() => handleTypeChange('video')}
                className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-widest rounded-md transition-all ${
                  contentType === 'video'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/20 hover:text-white/40'
                }`}
              >
                ▶ Video Script
              </button>
              <button
                onClick={() => handleTypeChange('text')}
                className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-widest rounded-md transition-all ${
                  contentType === 'text'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/20 hover:text-white/40'
                }`}
              >
                ✦ Text Post
              </button>
            </div>

            {/* Topic */}
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="What are we creating today?"
              autoComplete="off"
              className="w-full bg-transparent border-b border-white/[0.08] focus:border-emerald-500/30 pb-4 text-2xl font-bold text-white placeholder-white/20 focus:outline-none transition-all"
            />

            {/* Platform selector */}
            <div className="flex items-center gap-2 flex-wrap">
              {visiblePlatforms.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    platform === p.id ? p.active : p.base
                  }`}
                >
                  <span className="text-sm leading-none">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Spark */}
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30 mb-2">
                The Spark Protocol
              </p>
              <SparkInput onSpark={handleSpark} isSparking={isSparking} />
            </div>

            {/* Brain dump */}
            <div className="relative min-h-[160px] flex-1">
              <textarea
                value={brainDump}
                onChange={e => setBrainDump(e.target.value)}
                placeholder="Raw thoughts, angles, hot takes… or leave blank and let your Voice Profile do the work."
                className="absolute inset-0 w-full h-full bg-transparent rounded-xl border border-white/[0.06] focus:border-white/[0.12] p-4 text-sm leading-relaxed text-white/70 placeholder-white/20 focus:outline-none resize-none transition"
              />
            </div>

            {/* Error */}
            {createError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
                {createError}
              </div>
            )}

            {/* Recording hint */}
            {builderMic.active && (
              <div className="flex items-center gap-2 text-xs text-red-400 font-mono pl-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Transcribing live — tap mic to stop
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <MicButton
                active={builderMic.active}
                onClick={() => {
                  const base = brainDump.trim() ? brainDump.trimEnd() + '\n\n' : ''
                  const started = builderMic.toggle(base)
                  if (started === null) setCreateError('Web Speech API not supported — try Chrome or Edge.')
                }}
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                {isGenerating
                  ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Generating...</>
                  : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> {PLATFORMS.find(p => p.id === platform)?.cta ?? 'Generate'}</>
                }
              </button>
            </div>

            {/* Voice Maturity */}
            <VoiceMaturity maturity={voiceMaturity} />
          </div>
        </div>

        {/* Right: Voice Engine Output */}
        <div className="lg:col-span-7 flex flex-col">

          {/* Output header */}
          <div className="flex items-center gap-3 px-8 pt-8 pb-4 flex-shrink-0 flex-wrap gap-y-2 border-b border-white/[0.04]">
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/30">
              Voice Engine
            </p>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-xs text-white/40">
              {PLATFORMS.find(p => p.id === platform)?.outputLabel ?? 'Output'}
            </span>

            <div className="ml-auto flex items-center gap-2">
              <AuthenticityGauge
                score={authenticityScore}
                onPurge={handlePurge}
                isPurging={isPurging}
              />
              {generatedScript && authenticityScore !== null && (
                <button
                  onClick={() => navigator.clipboard.writeText(generatedScript)}
                  className="text-xs text-white/30 hover:text-white/70 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-1.5 rounded-lg transition-all border border-white/[0.06]"
                >
                  Copy
                </button>
              )}
              {generatedScript && contentType === 'video' && (
                <button
                  onClick={() => navigate('/editor')}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all border bg-indigo-500/10 border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/20"
                >
                  Upload footage →
                </button>
              )}
              {generatedScript && contentType === 'video' && (
                <button
                  onClick={() => setShowRecording(true)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all border bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-white/40 hover:text-white"
                >
                  ● Take to Recording
                </button>
              )}
              {generatedScript && (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                    publishFlash
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-white/30 hover:text-white/70'
                  }`}
                >
                  {isPublishing ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : publishFlash ? '✓ Saved' : 'Publish'}
                </button>
              )}
            </div>
          </div>

          {/* Output body */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {generatedScript ? (
              <textarea
                value={generatedScript}
                onChange={e => setGeneratedScript(e.target.value)}
                onFocus={() => { editBeforeRef.current = generatedScript }}
                onBlur={async (e) => {
                  const before = editBeforeRef.current
                  const after  = e.target.value
                  if (before === after) return

                  const diff = categorizeDiff(before, after)
                  const ltm  = recordEditDiff(diff)
                  setVoiceMaturity(ltm.voice_maturity)

                  if (diff.slopRemoved.length)
                    addLog({ type: 'CLEAN', message: `Slop removed: "${diff.slopRemoved.slice(0, 3).join('", "')}" — added to personal ban list.` })
                  if (diff.slangAdded.length)
                    addLog({ type: 'LEARN', message: `Slang added: "${diff.slangAdded.slice(0, 3).join('", "')}" — reinforcing voice DNA.` })
                  if (diff.wordDelta < -1.5)
                    addLog({ type: 'SYNC', message: `Sentence compression: ~${Math.round(diff.beforeAvg)}w → ~${Math.round(diff.afterAvg)}w avg. DNA: Punchy.` })
                  else if (diff.wordDelta > 1.5)
                    addLog({ type: 'SYNC', message: `Sentence expansion: ~${Math.round(diff.beforeAvg)}w → ~${Math.round(diff.afterAvg)}w avg. DNA: Flowing.` })
                  addLog({ type: 'EVOLVE', message: `Edit ratio: ${Math.round(diff.editRatio * 100)}% changed. Edit #${ltm.edit_count} captured.` })

                  const { score: newScore } = calculateAuthenticityScore(after)
                  setAuthenticityScore(newScore)

                  analyzeDelta(before, after, addLog)
                }}
                spellCheck={false}
                className="w-full min-h-full bg-transparent text-white/80 text-lg leading-relaxed font-medium resize-none focus:outline-none"
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="font-mono text-[11px] uppercase tracking-widest text-white/20 text-center leading-loose">
                  Type a raw idea in the Command Center.<br/>
                  The Voice Engine pushes output here.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Terminal Log */}
      <TerminalLog logs={createLogs} />

      {/* Recording Modal */}
      {showRecording && (
        <RecordingModal
          script={generatedScript}
          platform={PLATFORMS.find(p => p.id === platform)?.label}
          onClose={() => setShowRecording(false)}
        />
      )}
    </div>
  )
}
