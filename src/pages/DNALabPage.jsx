import { useState, useRef } from 'react'
import { useMic, MicButton } from '../hooks/useMic'

const API_HEADERS = (key) => ({
  'Content-Type': 'application/json',
  'x-api-key': key,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
})

export default function DNALabPage() {
  const [interviewState,  setInterviewState]  = useState('idle')
  const [questionNum,     setQuestionNum]     = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [answer,          setAnswer]          = useState('')
  const [qaHistory,       setQaHistory]       = useState([])
  const [resetState,      setResetState]      = useState('idle')
  const resetTimeoutRef = useRef(null)

  const answerMic = useMic(
    (text) => setAnswer(text),
    (final) => { if (final !== '__error__') setAnswer(final) }
  )

  const handleReset = async () => {
    if (resetState === 'idle')       { setResetState('confirming'); return }
    if (resetState === 'confirming') {
      setResetState('purging')
      try {
        localStorage.removeItem('kreation_dna')
        setResetState('purged')
        resetTimeoutRef.current = setTimeout(() => setResetState('idle'), 3000)
      } catch {
        setResetState('idle')
      }
    }
  }

  const fetchQuestion = async (num, history) => {
    setInterviewState('loading')
    setAnswer('')
    try {
      const key = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!key) throw new Error('Missing API key')
      const historyContext = history.length
        ? `Previous Q&A:\n${history.map((qa, i) => `Q${i + 1}: ${qa.q}\nA: ${qa.a}`).join('\n\n')}\n\n`
        : ''
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: API_HEADERS(key),
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 150,
          system: 'You are conducting a 5-question voice identity interview. Ask one short, provocative question designed to get a raw, unfiltered answer. Ask about opinions, hot takes, passions, or work. Each question should dig deeper than the last. Return ONLY the question — no preamble, no explanation.',
          messages: [{ role: 'user', content: `${historyContext}Generate question ${num} of 5. Make it different from previous questions. Be direct and provocative.` }]
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error?.message)
      setCurrentQuestion(data.content[0].text.trim())
      setQuestionNum(num)
      setInterviewState('questioning')
    } catch (e) {
      console.error(e)
      setInterviewState('idle')
    }
  }

  const extractAndSave = async (answerText, question) => {
    try {
      const key = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!key) return
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: API_HEADERS(key),
        body: JSON.stringify({
          model: 'claude-sonnet-4-6', max_tokens: 400,
          system: 'You are a linguistic pattern extractor. Output only structured JSON. Never give advice or commentary.',
          messages: [{ role: 'user', content: `Analyze this raw spoken answer for voice DNA. Focus purely on HOW they speak, not WHAT they say.\n\nQuestion: ${question}\nAnswer: ${answerText}\n\nExtract patterns: sentence rhythm, fragments, slang, filler words, energy markers, how they open/close thoughts.\n\nReturn ONLY raw JSON (no markdown):\n{"rules": ["..."], "vocabulary": ["..."]}\n\nExtract 1–3 rules and 2–5 vocabulary items.` }]
        })
      })
      const data = await res.json()
      if (!res.ok) return
      const extracted = JSON.parse(data.content[0].text)
      // Store locally (Supabase migration: upsertProfile(extracted))
      const existing = JSON.parse(localStorage.getItem('kreation_dna') || '{"rules":[],"vocabulary":[]}')
      const merged = {
        rules:      [...new Set([...existing.rules,      ...(extracted.rules      || [])])],
        vocabulary: [...new Set([...existing.vocabulary, ...(extracted.vocabulary || [])])],
      }
      localStorage.setItem('kreation_dna', JSON.stringify(merged))
    } catch (e) { console.error('DNA extract silent fail:', e) }
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return
    const q = currentQuestion
    const a = answer.trim()
    const newHistory = [...qaHistory, { q, a }]
    setQaHistory(newHistory)
    setInterviewState('processing')
    extractAndSave(a, q)
    if (questionNum >= 5) {
      setInterviewState('complete')
    } else {
      await fetchQuestion(questionNum + 1, newHistory)
    }
  }

  return (
    <div className="flex flex-col gap-7">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-100">DNA Lab</h1>
          <p className="text-sm text-gray-600 mt-0.5">5 questions. No prep. Just talk. Your answers train the AI on your real voice.</p>
        </div>
        <button
          onClick={handleReset}
          disabled={resetState === 'purging'}
          className={`text-xs font-bold px-4 py-2.5 rounded-xl border transition-all disabled:opacity-50 ${
            resetState === 'confirming'
              ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
              : resetState === 'purged'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-transparent border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50'
          }`}
        >
          {resetState === 'confirming' ? 'Confirm — wipe profile?' :
           resetState === 'purging'    ? 'Wiping...' :
           resetState === 'purged'     ? '✓ DNA Purged' :
                                        'Reset DNA'}
        </button>
      </div>

      {/* Reset banner */}
      {resetState === 'confirming' && (
        <div className="flex items-center justify-between gap-4 bg-red-500/10 border border-red-500/25 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <p className="text-sm text-red-300">Are you sure? This will wipe your saved voice profile.</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleReset}
              className="text-xs font-bold bg-red-500 hover:bg-red-400 text-white px-4 py-1.5 rounded-lg transition-all">
              Yes, purge it
            </button>
            <button onClick={() => setResetState('idle')}
              className="text-xs font-bold text-gray-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.10] px-4 py-1.5 rounded-lg transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Interview panel */}
      <div className="rounded-2xl border border-white/[0.06] glass-panel min-h-[65vh] flex items-center justify-center p-10">

        {interviewState === 'idle' && (
          <div className="text-center max-w-md space-y-7">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20 flex items-center justify-center mx-auto text-4xl">
              🎙
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-100 mb-3">Ready to capture your voice?</h3>
              <p className="text-gray-500 leading-relaxed">5 questions. Answer honestly, in your own words. The AI listens to <em>how</em> you speak — not what you say.</p>
            </div>
            <button
              onClick={() => fetchQuestion(1, [])}
              className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-purple-500/25 text-lg"
            >
              Start Interview
            </button>
          </div>
        )}

        {(interviewState === 'loading' || interviewState === 'processing') && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 font-medium">
              {questionNum === 0
                ? 'Starting your interview...'
                : `Got it. Preparing question ${Math.min(questionNum + 1, 5)} of 5...`}
            </p>
          </div>
        )}

        {interviewState === 'questioning' && (
          <div className="w-full max-w-2xl space-y-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex-shrink-0">Question {questionNum} of 5</span>
              <div className="flex-1 flex gap-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-500 ${n <= questionNum ? 'bg-purple-500' : 'bg-gray-800'}`} />
                ))}
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white leading-snug">{currentQuestion}</h3>
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Type your answer… or hit the mic and just talk."
                  rows={4}
                  className="w-full bg-[#0d1117]/80 rounded-2xl border border-white/[0.06] focus:border-purple-500/40 p-5 text-base leading-relaxed text-gray-200 placeholder-gray-700 focus:outline-none resize-none transition"
                />
                {answerMic.active && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-red-400 font-medium bg-[#0d1117]/90 px-2.5 py-1 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Live
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <MicButton active={answerMic.active} onClick={() => answerMic.toggle('')} />
                <button
                  onClick={submitAnswer}
                  disabled={!answer.trim()}
                  className="flex-1 bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  {questionNum < 5 ? 'Next Question →' : 'Finish Interview'}
                </button>
              </div>
            </div>
          </div>
        )}

        {interviewState === 'complete' && (
          <div className="text-center max-w-md space-y-7">
            <div className="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
              <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm font-bold px-4 py-2 rounded-full mb-4">
                🧬 DNA Fully Synced
              </div>
              <h3 className="text-2xl font-bold text-gray-100 mb-2">Your voice is locked in.</h3>
              <p className="text-gray-500 leading-relaxed">The AI has learned your patterns from all 5 answers. Your next script will sound like you.</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => { setInterviewState('idle'); setQaHistory([]); setQuestionNum(0) }}
                className="text-sm font-bold text-gray-400 hover:text-white bg-white/[0.06] hover:bg-white/[0.10] px-5 py-3 rounded-xl transition-all border border-white/[0.08]"
              >
                Redo Interview
              </button>
              <a
                href="/create"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 inline-block"
              >
                Create Content →
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
