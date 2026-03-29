import { useState } from 'react'
import voiceProfile from '../data/voiceProfile.json'
import { useMic, MicButton } from '../hooks/useMic'

// ─── Platform configs ─────────────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: 'twitter', name: 'X / Twitter', icon: '𝕏',
    limitLabel: '280 chars', charLimit: 280,
    headerColor: 'text-sky-400',
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    instruction: 'Opening tweet only. Max 280 chars. Standalone hook — must work without context. Bold opinion. No external links. End hard.',
  },
  {
    id: 'linkedin', name: 'LinkedIn', icon: 'in',
    limitLabel: '3,000 chars', charLimit: 3000,
    headerColor: 'text-blue-400',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    instruction: 'First 2 lines = hook visible before "see more". Then: story → insight → lesson → 1 open question at the end to drive comments. Personal narrative over promotion.',
  },
  {
    id: 'tiktok', name: 'TikTok Script', icon: '♪',
    limitLabel: '60–90 sec', charLimit: null,
    headerColor: 'text-pink-400',
    badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    instruction: 'Script with labeled beats. [HOOK] lands in 1.5s or viewers scroll. [BUILD] fast, layered. [PAYOFF + CTA] organic — never salesy.',
  },
]

// ─── DNA system prompt ────────────────────────────────────────────────────────
function buildSystem(profile) {
  const tone  = profile.tone  || 'Authentic, energetic, unfiltered'
  const vocab = profile.vocabulary?.join(', ') || 'natural vernacular'
  const rules = profile.rules?.join(' | ')    || 'Be punchy and direct'
  return [
    `You are Shalom's content engine. Sound exactly like him — not like an AI assistant.`,
    `TONE: ${tone}`,
    `VOCABULARY — weave these in naturally where they fit: ${vocab}`,
    `WRITING RULES: ${rules}`,
    `DNA FILTER — actively ban these generic AI phrases: "In conclusion", "It's worth noting", "leverage", "key takeaway", "dive into", "let's explore", "game-changer", "it's important to". Replace with language from the vocabulary list.`,
  ].join('\n')
}

const API_HEADERS = key => ({
  'Content-Type': 'application/json',
  'x-api-key': key,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
})

// ─── Helper: extract first JSON object from a string ─────────────────────────
function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON found in response')
  return JSON.parse(match[0])
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [topic,          setTopic]          = useState('')
  const [questions,      setQuestions]      = useState([])
  const [answers,        setAnswers]        = useState(['', '', ''])
  // 'idle' | 'loading' | 'answering' | 'generating' | 'done'
  const [itvStep,        setItvStep]        = useState('idle')
  const [posts,          setPosts]          = useState({})
  const [copyStatus,     setCopyStatus]     = useState({})
  const [scheduleStatus, setScheduleStatus] = useState({})
  const [error,          setError]          = useState('')

  // Three mic instances — called unconditionally at top level (Rules of Hooks)
  const mic0 = useMic(
    t => setAnswers(p => { const n = [...p]; n[0] = t; return n }),
    f => { if (f !== '__error__') setAnswers(p => { const n = [...p]; n[0] = f; return n }) }
  )
  const mic1 = useMic(
    t => setAnswers(p => { const n = [...p]; n[1] = t; return n }),
    f => { if (f !== '__error__') setAnswers(p => { const n = [...p]; n[1] = f; return n }) }
  )
  const mic2 = useMic(
    t => setAnswers(p => { const n = [...p]; n[2] = t; return n }),
    f => { if (f !== '__error__') setAnswers(p => { const n = [...p]; n[2] = f; return n }) }
  )
  const mics = [mic0, mic1, mic2]

  // ── Generate interview questions ──────────────────────────────────────────
  const generateQuestions = async () => {
    if (!topic.trim()) return
    setItvStep('loading'); setError('')
    try {
      const key = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!key) throw new Error('Missing VITE_ANTHROPIC_API_KEY')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: API_HEADERS(key),
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 300,
          system: 'You generate interview questions for a founder/creator. Questions must be spicy, specific, and pull out raw, unfiltered content — not polished takes. Return ONLY a valid JSON array of exactly 3 question strings. No preamble.',
          messages: [{ role: 'user', content: `Topic: "${topic}"\n\nGenerate 3 provocative interview questions that will surface real opinions and strong emotions about this topic. Return JSON array only: ["Q1","Q2","Q3"]` }],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message)
      const raw = data.content[0].text
      const parsed = JSON.parse(raw.match(/\[[\s\S]*\]/)?.[0] ?? raw)
      setQuestions(parsed)
      setAnswers(['', '', ''])
      setItvStep('answering')
    } catch (e) { setError(e.message); setItvStep('idle') }
  }

  // ── Generate all platform posts in one call ───────────────────────────────
  const generatePosts = async () => {
    setItvStep('generating'); setError(''); setPosts({})
    try {
      const key = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!key) throw new Error('Missing VITE_ANTHROPIC_API_KEY')
      const qa  = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || '(skipped)'}`).join('\n\n')
      const fmt = PLATFORMS.map(p => `${p.id.toUpperCase()}: ${p.instruction}`).join('\n')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: API_HEADERS(key),
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 2048,
          system: buildSystem(voiceProfile),
          messages: [{
            role: 'user',
            content: `Topic: "${topic}"\n\nInterview answers (raw material — use the voice and energy, not just the words):\n${qa}\n\nWrite posts for all 3 platforms.\n\n${fmt}\n\nReturn ONLY valid JSON with this exact shape — no markdown, no preamble:\n{"twitter":"...","linkedin":"...","tiktok":"..."}`,
          }],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message)
      setPosts(extractJSON(data.content[0].text))
      setItvStep('done')
    } catch (e) { setError(e.message); setItvStep('answering') }
  }

  // ── Copy / schedule handlers ──────────────────────────────────────────────
  const copy = async (id) => {
    await navigator.clipboard.writeText(posts[id])
    setCopyStatus(p => ({ ...p, [id]: 'copied' }))
    setTimeout(() => setCopyStatus(p => ({ ...p, [id]: '' })), 2000)
  }

  const schedule = (id) => {
    setScheduleStatus(p => ({ ...p, [id]: 'queued' }))
    setTimeout(() => setScheduleStatus(p => ({ ...p, [id]: '' })), 3000)
  }

  const reset = () => {
    setTopic(''); setQuestions([]); setAnswers(['', '', ''])
    setPosts({}); setItvStep('idle'); setError('')
  }

  const isGenerating = itvStep === 'generating'
  const hasPosts     = Object.keys(posts).length > 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] rounded-3xl overflow-hidden border border-gray-800/60 shadow-2xl min-h-[80vh]">

      {/* ════════════════════ INTERVIEW SIDEBAR ════════════════════ */}
      <aside className="bg-[#0d1117] border-r border-gray-800/50 flex flex-col">

        {/* Sidebar header */}
        <div className="px-6 py-4 border-b border-gray-800/40">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-bold text-green-400 uppercase tracking-widest font-mono">Interview Mode</span>
          </div>
          <p className="text-gray-700 text-xs font-mono">3 answers → 3 platform posts</p>
        </div>

        {/* Topic */}
        <div className="px-5 py-4 border-b border-gray-800/30">
          <div className="text-[11px] font-mono text-gray-700 mb-2 tracking-widest">&gt; TOPIC</div>
          <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="e.g. why I quit my job to build this"
            onKeyDown={e => e.key === 'Enter' && itvStep === 'idle' && generateQuestions()}
            className="w-full bg-gray-900/80 border border-gray-800 focus:border-green-500/40 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-800 focus:outline-none font-mono transition-all" />
        </div>

        {/* Questions + answers */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {itvStep === 'idle' && (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-12">
              <div className="text-gray-800 text-5xl font-mono select-none">▸</div>
              <p className="text-gray-700 text-xs font-mono text-center leading-relaxed max-w-[200px]">
                set a topic above<br/>then start the interview
              </p>
            </div>
          )}

          {itvStep === 'loading' && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-6 h-6 border-2 border-green-500/20 border-t-green-400 rounded-full animate-spin"></div>
              <p className="text-green-400 text-xs font-mono animate-pulse">loading questions...</p>
            </div>
          )}

          {(itvStep === 'answering' || itvStep === 'generating' || itvStep === 'done') && (
            <div className="space-y-7">
              {questions.map((q, idx) => (
                <div key={idx}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-green-500 text-xs font-mono mt-0.5 flex-shrink-0">Q{idx + 1}.</span>
                    <p className="text-gray-300 text-sm leading-snug font-medium">{q}</p>
                  </div>
                  <div className="relative pl-5">
                    <textarea
                      value={answers[idx]}
                      onChange={e => setAnswers(p => { const n = [...p]; n[idx] = e.target.value; return n })}
                      placeholder="// your answer..."
                      rows={2}
                      disabled={itvStep === 'done' || itvStep === 'generating'}
                      className="w-full bg-gray-900/60 border border-gray-800 focus:border-green-500/25 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-800 focus:outline-none resize-none transition-all font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {mics[idx].active && (
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono text-red-400 flex items-center gap-1 bg-gray-950/80 px-1.5 py-0.5 rounded pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        live
                      </span>
                    )}
                  </div>
                  <div className="pl-5 mt-1.5">
                    <MicButton active={mics[idx].active} onClick={() => mics[idx].toggle('')} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar footer */}
        <div className="px-5 py-4 border-t border-gray-800/40 space-y-2.5">
          {error && (
            <p className="text-red-400 text-xs font-mono bg-red-500/5 border border-red-500/15 px-3 py-2 rounded-lg" title={error}>
              ! {error}
            </p>
          )}

          {itvStep === 'idle' && (
            <button onClick={generateQuestions} disabled={!topic.trim()}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-25 disabled:cursor-not-allowed text-gray-900 font-bold py-3 rounded-xl transition-all font-mono text-sm">
              &gt; Start Interview
            </button>
          )}

          {itvStep === 'loading' && (
            <div className="w-full bg-green-500/10 text-green-500/40 font-bold py-3 rounded-xl font-mono text-sm text-center">
              loading...
            </div>
          )}

          {itvStep === 'answering' && (
            <button onClick={generatePosts} disabled={answers.every(a => !a.trim())}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-25 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all font-mono text-sm">
              &gt; Generate All Posts →
            </button>
          )}

          {itvStep === 'generating' && (
            <div className="w-full bg-indigo-500/10 text-indigo-400/50 font-bold py-3 rounded-xl font-mono text-sm text-center flex items-center justify-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-indigo-400/20 border-t-indigo-400 rounded-full animate-spin"></div>
              generating...
            </div>
          )}

          {itvStep === 'done' && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={reset}
                className="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold py-2.5 rounded-xl transition-all font-mono text-xs border border-gray-700/50">
                &gt; New Session
              </button>
              <button onClick={() => { setItvStep('answering'); setPosts({}); setError('') }}
                className="bg-green-500/10 hover:bg-green-500/15 text-green-400 hover:text-green-300 font-bold py-2.5 rounded-xl transition-all font-mono text-xs border border-green-500/20">
                &gt; Regenerate
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ════════════════════ POST GRID ════════════════════ */}
      <main className="bg-gray-900/25 flex flex-col">

        {/* Grid header */}
        <div className="px-7 py-4 border-b border-gray-800/40 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Post Preview</span>
          </div>
          {hasPosts && (
            <>
              <span className="text-gray-800 font-mono text-xs">|</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs">🧬</span>
                <span className="text-xs font-mono text-green-500/60">DNA filter active</span>
              </div>
            </>
          )}
          {isGenerating && (
            <div className="ml-auto flex items-center gap-2 text-xs font-mono text-gray-600">
              <div className="w-3 h-3 border border-gray-600/30 border-t-gray-500 rounded-full animate-spin"></div>
              writing posts...
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-2 gap-5 content-start">
          {PLATFORMS.map(p => (
            <PostCard
              key={p.id}
              platform={p}
              content={posts[p.id]}
              isLoading={isGenerating}
              copyStatus={copyStatus[p.id]}
              scheduleStatus={scheduleStatus[p.id]}
              onCopy={() => copy(p.id)}
              onSchedule={() => schedule(p.id)}
              className={p.id === 'tiktok' ? 'xl:col-span-2' : ''}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ platform, content, isLoading, copyStatus, scheduleStatus, onCopy, onSchedule, className = '' }) {
  const { name, icon, limitLabel, charLimit, headerColor, badge } = platform
  const charCount = content?.length ?? 0
  const overLimit  = charLimit && charCount > charLimit
  const nearLimit  = charLimit && !overLimit && charCount > charLimit * 0.85

  return (
    <div className={`flex flex-col rounded-2xl border border-gray-800/50 bg-[#0d1117]/90 overflow-hidden ${className}`}>

      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800/40">
        <div className="flex items-center gap-2.5">
          <span className={`font-mono font-bold text-sm leading-none ${headerColor}`}>{icon}</span>
          <span className="text-sm font-bold text-gray-200">{name}</span>
          {content && !isLoading && (
            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${badge}`}>
              DNA ✓
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {content && charLimit && (
            <span className={`text-xs font-mono tabular-nums ${
              overLimit ? 'text-red-400' : nearLimit ? 'text-yellow-500' : 'text-gray-700'
            }`}>
              {charCount.toLocaleString()}/{charLimit.toLocaleString()}
            </span>
          )}
          <span className="text-xs font-mono text-gray-700">{limitLabel}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="flex-1 px-5 py-4 min-h-[160px] overflow-y-auto max-h-[320px]">
        {isLoading ? (
          <div className="space-y-2.5 animate-pulse pt-1">
            {[92, 78, 88, 60, 80, 70].map((w, i) => (
              <div key={i} className="h-2 bg-gray-800 rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : content ? (
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono">{content}</p>
        ) : (
          <div className="h-full flex items-end pb-1">
            <p className="text-gray-800 text-xs font-mono">// post will appear here after interview</p>
          </div>
        )}
      </div>

      {/* Card footer */}
      {content && !isLoading && (
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-800/30">
          <button onClick={onCopy}
            className={`text-xs font-bold font-mono px-3.5 py-1.5 rounded-lg transition-all border ${
              copyStatus === 'copied'
                ? 'bg-green-500/10 text-green-400 border-green-500/25'
                : 'text-gray-600 hover:text-gray-300 border-gray-700/40 hover:border-gray-600'
            }`}>
            {copyStatus === 'copied' ? '✓ copied' : 'copy'}
          </button>
          <button onClick={onSchedule}
            className={`text-xs font-bold font-mono px-3.5 py-1.5 rounded-lg transition-all border ${
              scheduleStatus === 'queued'
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                : 'text-gray-700 hover:text-gray-400 border-gray-800 hover:border-gray-600/50'
            }`}>
            {scheduleStatus === 'queued' ? '✓ queued' : 'send to scheduler'}
          </button>
        </div>
      )}
    </div>
  )
}
