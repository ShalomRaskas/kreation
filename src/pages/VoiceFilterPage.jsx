import { useState, useRef, useEffect, useCallback } from 'react'
import { callClaude } from '../services/voiceSync'

// ─── Constants & Helpers ──────────────────────────────────────────────────────

const VIBE_LABELS      = ['Sincere', 'Dry', 'Sardonic', 'Salty', 'Max Salt']
const EXPERTISE_LABELS = ['Simple', 'Casual', 'Informed', 'Expert', 'Technical']
const LENGTH_LABELS    = ['Detailed', 'Standard', 'Tight', 'Brief', 'Punchy']
const HEAT_LABELS      = ['Safe', 'Mild', 'Edgy', 'Bold', 'Risky']
const DRAFTS_KEY       = 'kreation_drafts_v1'

const SLIDER_COLORS = {
  vibe:      (v) => v === 0 ? '#60a5fa' : `hsl(${20 + (1 - v / 100) * 200}, 80%, 60%)`,
  expertise: (v) => `hsl(${140 + v * 0.6}, 60%, ${55 - v * 0.1}%)`,
  length:    (v) => `hsl(${270 - v * 1.4}, 65%, 62%)`,
  heat:      (v) => `hsl(${120 - v * 1.2}, 75%, 55%)`,
}

// Shared drawer slide-in classes
const DRAWER_BASE = 'absolute top-0 right-0 bottom-0 flex flex-col bg-[#07090e] border-l-2 border-emerald-500/30 shadow-[-24px_0_64px_rgba(0,0,0,0.7)] z-50 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'

function getLabel(labels, val) {
  return labels[Math.min(4, Math.floor(val / 25))]
}

function sentimentColor(vibe, heat) {
  const score = vibe * 0.55 + heat * 0.45
  if (score <= 30) return '#10B981'
  if (score <= 62) return '#f97316'
  return '#ef4444'
}

// ─── Draft Utilities ──────────────────────────────────────────────────────────

function loadDrafts() {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]') } catch { return [] }
}
function saveDrafts(d) { localStorage.setItem(DRAFTS_KEY, JSON.stringify(d)) }
function timeAgo(ts) {
  const d = Date.now() - ts
  if (d < 60000)    return 'just now'
  if (d < 3600000)  return `${Math.floor(d / 60000)}m ago`
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`
  return `${Math.floor(d / 86400000)}d ago`
}

// ─── Text Utilities ───────────────────────────────────────────────────────────

function buildCopyText(canvas, tab) {
  if (tab === 'POST')   return canvas.post ?? ''
  if (tab === 'SCRIPT') return (canvas.script ?? []).map(b => `[${b.label}]\n${b.text}`).join('\n\n')
  if (tab === 'THREAD') return (canvas.thread ?? []).map(t => `${t.n}/${t.total}\n${t.text}`).join('\n\n')
  return ''
}

// ─── System Prompts ───────────────────────────────────────────────────────────

function buildSystemPrompt({ vibe, expertise, length, heat }) {
  const vibeDesc =
    vibe === 0  ? 'Completely sincere, warm, and professional. Zero irony or edge.' :
    vibe <= 25  ? 'Dry and understated. Slightly raised eyebrow. Not unkind.' :
    vibe <= 50  ? 'Mildly sardonic. A bit skeptical. Quietly unimpressed.' :
    vibe <= 75  ? 'Salty and cold. Clearly skeptical. Contemptuous of obvious things.' :
                  'Maximum salty. Biting. Every sentence drips disbelief. No warmth at all.'
  const expertiseDesc =
    expertise === 0  ? 'Use the simplest possible language. No jargon. Explain like a 12-year-old would understand.' :
    expertise <= 25  ? 'Plain English. Conversational. Avoid technical terms.' :
    expertise <= 50  ? 'Moderately informed tone. Use common terms for the topic at hand.' :
    expertise <= 75  ? 'Use the professional vocabulary of the user\'s domain — vet terms for dogs, culinary terms for cooking, finance terms for finance.' :
                       'Expert-level technical language specific to the user\'s domain. Assume a highly knowledgeable audience.'
  const lengthDesc =
    length === 0  ? 'Detailed: 4-6 sentences. Include context, reasoning, and a concrete example.' :
    length <= 25  ? 'Moderately detailed: 3-4 sentences with supporting context.' :
    length <= 50  ? 'Standard: 2-3 sentences. Balance brevity and completeness.' :
    length <= 75  ? 'Brief: maximum 2 sentences. Cut all filler.' :
                    'Punchy: 1 sentence maximum. One idea, one impact. Nothing else.'
  const heatDesc =
    heat === 0  ? 'Safe and measured. No controversy. Balanced and inoffensive.' :
    heat <= 25  ? 'Mildly opinionated. Takes a gentle position.' :
    heat <= 50  ? 'Takes a clear position. Slightly provocative but reasonable.' :
    heat <= 75  ? 'Bold and contrarian. Designed to provoke thought and push back.' :
                  'Controversial and risky. Designed to spark debate. No hedging.'

  return `You are KREATION's Voice Filter. Rewrite the user's raw idea through the active DNA profile.

CRITICAL RULES:
- DNA sliders control STYLE only, NOT subject matter.
- NEVER inject words not in the user's input (no "UI", "Stack", "Deploy" unless the user wrote them).
- Match the user's domain: dogs → vet language, cooking → culinary language, etc.
- Output the rewrite only. No preamble, no explanation.

ACTIVE DNA PROFILE:
- VIBE (${vibe}%): ${vibeDesc}
- EXPERTISE (${expertise}%): ${expertiseDesc}
- LENGTH (${length}%): ${lengthDesc}
- HEAT (${heat}%): ${heatDesc}

THREAD RULES: 5 tweets, each under 240 chars.
  Tweet 1 (HOOK): Opening that stops the scroll.
  Tweet 2 (WHY WRONG): Why the common approach is wrong.
  Tweet 3 (STEP): Concrete step 1.
  Tweet 4 (STEP): Concrete step 2.
  Tweet 5 (TAKEAWAY): Final verdict. No softening.

Return ONLY valid JSON:
{
  "post": "POST rewrite.",
  "script": [
    { "label": "HOOK", "text": "Opening." },
    { "label": "BODY", "text": "Core argument." },
    { "label": "CTA",  "text": "Call to action." }
  ],
  "thread": [
    { "n": 1, "total": 5, "beat": "HOOK",      "text": "Under 240." },
    { "n": 2, "total": 5, "beat": "WHY WRONG", "text": "Under 240." },
    { "n": 3, "total": 5, "beat": "STEP",      "text": "Under 240." },
    { "n": 4, "total": 5, "beat": "STEP",      "text": "Under 240." },
    { "n": 5, "total": 5, "beat": "TAKEAWAY",  "text": "Under 240." }
  ]
}`
}

const REFINE_SYSTEM = 'You are a tonal editor. You make text punchier and more biting without changing its subject, structure, or length. Return ONLY the revised text. No quotes. No preamble.'
const IMAGE_SYSTEM  = 'You are a visual prompt specialist. Generate vivid, cinematic, single-sentence image prompts based on text.'

// ─── Placeholders ─────────────────────────────────────────────────────────────

const EMPTY_CANVAS = { post: null, script: null, thread: null }

const PLACEHOLDER_CANVAS = {
  post: 'UI is finally live. Deep black and emerald green. Looks better than your generic SaaS template. Shipping now.',
  script: [
    { label: 'HOOK', text: 'Your dashboard is live. Nobody cares until it ships.' },
    { label: 'BODY', text: 'Deep black. Emerald green. Stack deployed. Template era is over.' },
    { label: 'CTA',  text: 'Fork it. Deploy it. Stop talking about it.' },
  ],
  thread: [
    { n: 1, total: 5, beat: 'HOOK',      text: 'Most builders spend 3 weeks on a dashboard that ships to zero users. Congrats on the UI. Now who is actually deploying?' },
    { n: 2, total: 5, beat: 'WHY WRONG', text: 'You are optimizing the wrong layer. Nobody cares how the dashboard looks before the stack is production-ready. Ship the runtime first.' },
    { n: 3, total: 5, beat: 'STEP',      text: 'Step 1: Lock the stack. React + Vite + Tailwind. No new frameworks mid-build. Terminal only. Get it deployed on a real domain today.' },
    { n: 4, total: 5, beat: 'STEP',      text: 'Step 2: Build one working flow end-to-end before touching any other UI. Prove the pipeline works. Then iterate the design layer.' },
    { n: 5, total: 5, beat: 'TAKEAWAY',  text: 'The dashboard is not the product. The deployment is. Ship ugly. Fix later. Idle builders ship nothing.' },
  ],
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

function Typewriter({ text, speed = 12, onDone }) {
  const [out, setOut] = useState('')
  useEffect(() => {
    let i = 0; setOut('')
    const t = setInterval(() => {
      if (i < text.length) { setOut(p => p + text[i]); i++ }
      else { clearInterval(t); onDone?.() }
    }, speed)
    return () => clearInterval(t)
  }, [text])
  return <>{out}<span className="inline-block w-[2px] h-[1em] ml-0.5 bg-emerald-400 animate-pulse align-middle" /></>
}

// ─── Magic Wand Button ────────────────────────────────────────────────────────

function SparkleBtn({ refining, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={refining}
      title="Refine — 20% saltier"
      className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-lg border border-emerald-900/40 bg-emerald-950/30 hover:bg-emerald-900/50 hover:border-emerald-700/60 transition-all duration-150 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {refining
        ? <span className="w-2 h-2 rounded-full border border-emerald-400 border-t-transparent animate-spin" />
        : <IconSparkle />}
    </button>
  )
}

// ─── DNA Slider ───────────────────────────────────────────────────────────────

function DNASlider({ id, label, value, onChange, labels, description }) {
  const color = SLIDER_COLORS[id]?.(value) ?? '#10B981'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-white/35 tracking-widest uppercase font-bold">{label}</span>
        <span className="text-[9px] font-black tracking-widest" style={{ color }}>{getLabel(labels, value)} — {value}%</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/5 mt-3 mb-1">
        <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-75" style={{ width: `${value}%`, backgroundColor: color }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-black transition-all duration-75 pointer-events-none"
          style={{ left: `calc(${value}% - 6px)`, backgroundColor: color, boxShadow: `0 0 8px ${color}60` }} />
        <input type="range" min="0" max="100" step="5" value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[7px] text-white/15">{labels[0]}</span>
        <span className="text-[7px] text-white/15">{labels[labels.length - 1]}</span>
      </div>
      {description && <p className="text-[8px] text-white/20 leading-relaxed mt-2">{description}</p>}
    </div>
  )
}

// ─── DNA Lab Drawer ───────────────────────────────────────────────────────────

function DNADrawer({ dna, onChange, open }) {
  const desc = {
    vibe:
      dna.vibe <= 0  ? 'Warm. Professional. Genuinely helpful.' :
      dna.vibe <= 25 ? 'Dry. Understated. Slightly raised eyebrow.' :
      dna.vibe <= 50 ? 'Mildly sardonic. Quietly unimpressed.' :
      dna.vibe <= 75 ? 'Salty and cold. Clearly skeptical.' : 'Biting. Maximum edge.',
    expertise:
      dna.expertise <= 25 ? 'Plain English. No jargon.' :
      dna.expertise <= 50 ? 'Conversational and informed.' :
      dna.expertise <= 75 ? 'Field-specific terms from your topic.' : 'Expert-level. Professional audience.',
    length:
      dna.length <= 25 ? '4-6 sentences. Full context.' :
      dna.length <= 50 ? '2-3 sentences. Balanced.' :
      dna.length <= 75 ? 'Max 2 sentences. Cut the fat.' : '1 sentence. One hit.',
    heat:
      dna.heat <= 25 ? 'Safe. Won\'t upset anyone.' :
      dna.heat <= 50 ? 'Takes a position. Mildly provocative.' :
      dna.heat <= 75 ? 'Bold and contrarian.' : 'Controversial. Built to spark debate.',
  }
  const sliders = [
    { id: 'vibe',      label: 'Vibe',      value: dna.vibe,      labels: VIBE_LABELS },
    { id: 'expertise', label: 'Expertise', value: dna.expertise, labels: EXPERTISE_LABELS },
    { id: 'length',    label: 'Length',    value: dna.length,    labels: LENGTH_LABELS },
    { id: 'heat',      label: 'Heat',      value: dna.heat,      labels: HEAT_LABELS },
  ]
  return (
    <div className={`${DRAWER_BASE} w-72 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 flex-shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
        <span className="text-[9px] font-black tracking-[0.25em] text-white/50 uppercase">DNA Lab</span>
        <span className="ml-auto text-[8px] text-emerald-500/40 font-mono">v1.0</span>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-7">
        {sliders.map((s, i) => (
          <div key={s.id}>
            {i > 0 && <div className="h-px bg-white/[0.04] mb-7" />}
            <DNASlider {...s} onChange={v => onChange({ [s.id]: v })} description={desc[s.id]} />
          </div>
        ))}
        <div className="h-px bg-white/[0.04]" />
        <div className="rounded-xl bg-emerald-950/20 border border-emerald-900/20 p-4">
          <p className="text-[8px] text-emerald-500/50 tracking-widest uppercase mb-3">Active Profile</p>
          <div className="space-y-2">
            {sliders.map(s => (
              <div key={s.label} className="flex justify-between items-center">
                <span className="text-[8px] text-white/25">{s.label}</span>
                <span className="text-[8px] font-black" style={{ color: SLIDER_COLORS[s.id]?.(s.value) }}>
                  {getLabel(s.labels, s.value)} ({s.value}%)
                </span>
              </div>
            ))}
          </div>
          <p className="text-[7px] text-white/15 mt-3 leading-relaxed">Style only. Subject from your input.</p>
        </div>
      </div>
      <div className="flex-shrink-0 h-px bg-gradient-to-r from-emerald-500/20 via-emerald-500/50 to-emerald-500/20" />
    </div>
  )
}

// ─── Drafts Drawer ────────────────────────────────────────────────────────────

function DraftsDrawer({ open, drafts, onLoad, onDelete }) {
  const dnaChips = (dna) => [
    { k: 'V', v: dna.vibe,      l: VIBE_LABELS,      id: 'vibe' },
    { k: 'E', v: dna.expertise, l: EXPERTISE_LABELS, id: 'expertise' },
    { k: 'L', v: dna.length,    l: LENGTH_LABELS,    id: 'length' },
    { k: 'H', v: dna.heat,      l: HEAT_LABELS,      id: 'heat' },
  ]
  return (
    <div className={`${DRAWER_BASE} w-80 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 flex-shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
        <span className="text-[9px] font-black tracking-[0.25em] text-white/50 uppercase">Saved Drafts</span>
        <span className="ml-auto text-[8px] text-white/20 font-mono">{drafts.length} saved</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <div className="w-12 h-12 rounded-xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
              <IconFolder active={false} />
            </div>
            <p className="text-[9px] text-white/20 tracking-widest uppercase">No drafts yet</p>
            <p className="text-[8px] text-white/10 max-w-[160px] leading-relaxed">Use Save Draft in the canvas to store outputs here.</p>
          </div>
        ) : drafts.map(draft => (
          <div key={draft.id} className="rounded-xl border border-white/5 bg-white/[0.02] hover:border-emerald-900/40 hover:bg-white/[0.03] transition-all duration-200 group overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-emerald-500/60 font-mono">{timeAgo(draft.savedAt)}</span>
                <span className="text-[7px] text-white/15 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/5 uppercase tracking-widest">{draft.activeTab}</span>
              </div>
              <button onClick={() => onDelete(draft.id)} title="Delete" className="text-white/15 hover:text-red-400/70 transition-colors text-base leading-none opacity-0 group-hover:opacity-100">×</button>
            </div>
            <button className="w-full text-left px-4 py-3" onClick={() => onLoad(draft)}>
              <p className="text-[12px] text-white/50 leading-relaxed line-clamp-3 group-hover:text-white/70 transition-colors">{draft.preview || '—'}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {dnaChips(draft.dna).map(chip => (
                  <span key={chip.k} className="text-[7px] px-1.5 py-0.5 rounded border border-white/5 bg-white/[0.02] font-mono"
                    style={{ color: SLIDER_COLORS[chip.id]?.(chip.v) ?? '#10B981' }}>
                    {chip.k}:{getLabel(chip.l, chip.v)}
                  </span>
                ))}
              </div>
            </button>
          </div>
        ))}
      </div>
      <div className="flex-shrink-0 h-px bg-gradient-to-r from-emerald-500/20 via-emerald-500/50 to-emerald-500/20" />
    </div>
  )
}

// ─── Canvas: POST ─────────────────────────────────────────────────────────────

function PostCanvas({ post, placeholder, onRefine, refiningId }) {
  const text   = post ?? placeholder
  const isLive = post !== null
  return (
    <div className="max-w-2xl mx-auto mt-4 fade-in">
      <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/10 p-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <span className="text-emerald-400 text-xs font-black">P</span>
          </div>
          <span className="text-[10px] font-mono tracking-widest text-emerald-400/70 uppercase">Post Output</span>
          <span className={`ml-auto text-[9px] font-mono tracking-widest ${isLive ? 'text-emerald-500/50' : 'text-white/15'}`}>
            {isLive ? 'LIVE' : 'PREVIEW'}
          </span>
        </div>
        <div className="group flex items-start gap-2">
          <p className={`flex-1 font-mono text-sm leading-relaxed ${isLive ? 'text-emerald-100' : 'text-white/30'}`}>
            <span className="text-emerald-500/60 mr-2 font-black">≫</span>{text}
          </p>
          {isLive && <SparkleBtn refining={refiningId === 'post'} onClick={() => onRefine('post')} />}
        </div>
      </div>
    </div>
  )
}

// ─── Canvas: SCRIPT ───────────────────────────────────────────────────────────

function ScriptCanvas({ script, placeholder, onRefine, refiningId }) {
  const blocks = script ?? placeholder
  const isLive = script !== null
  return (
    <div className="max-w-2xl mx-auto mt-4 space-y-4 fade-in">
      {blocks.map((block, i) => (
        <div key={i} className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:border-white/10 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[9px] font-mono font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{block.label}</span>
            <span className="text-[9px] font-mono text-white/20 tracking-widest">{i === 0 ? '0:00s' : i === 1 ? '0:04s' : '0:14s'}</span>
            {isLive && <span className="ml-auto"><SparkleBtn refining={refiningId === `script-${i}`} onClick={() => onRefine('script', i)} /></span>}
          </div>
          <p className={`font-mono text-sm leading-relaxed ${isLive ? 'text-white/80' : 'text-white/25'}`}>
            <span className="text-white/10 mr-3 select-none">{String(i + 1).padStart(2, '0')}</span>{block.text}
          </p>
        </div>
      ))}
    </div>
  )
}

// ─── Canvas: THREAD ───────────────────────────────────────────────────────────

const BEAT_COLORS = {
  'HOOK':      { pill: 'bg-rose-500/10 text-rose-400 border-rose-500/20',         dot: 'bg-rose-400' },
  'WHY WRONG': { pill: 'bg-amber-500/10 text-amber-400 border-amber-500/20',       dot: 'bg-amber-400' },
  'STEP':      { pill: 'bg-blue-500/10 text-blue-400 border-blue-500/20',          dot: 'bg-blue-400' },
  'TAKEAWAY':  { pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
}

function ThreadCanvas({ thread, placeholder, onRefine, refiningId }) {
  const items  = thread ?? placeholder
  const isLive = thread !== null
  return (
    <div className="max-w-xl mx-auto mt-2 fade-in">
      {items.map((tweet, i) => {
        const isLast = i === items.length - 1
        const beat   = BEAT_COLORS[tweet.beat] ?? BEAT_COLORS['STEP']
        const cc     = tweet.text.length
        return (
          <div key={i} className="flex">
            <div className="flex flex-col items-center flex-shrink-0 w-12">
              <div className="w-10 h-10 rounded-full bg-emerald-950 border-2 border-emerald-700/50 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <span className="text-emerald-400 text-xs font-black">K</span>
              </div>
              {!isLast && <div className="w-px flex-1 mt-2 mb-1 bg-gradient-to-b from-emerald-900/60 to-emerald-900/10 min-h-[2rem]" />}
            </div>
            <div className={`group flex-1 ml-3 mb-4 rounded-2xl border p-5 transition-all hover:border-white/10 ${isLive ? 'bg-white/[0.025] border-white/[0.06]' : 'bg-white/[0.01] border-white/[0.03]'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${beat.pill}`}>{tweet.beat}</span>
                  <span className="text-[9px] text-white/20 font-mono">{tweet.n}/{tweet.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isLive && <SparkleBtn refining={refiningId === `thread-${i}`} onClick={() => onRefine('thread', i)} />}
                  <span className={`text-[9px] font-mono tabular-nums ${cc > 240 ? 'text-red-400' : cc > 200 ? 'text-amber-400/70' : 'text-white/15'}`}>{cc}/240</span>
                </div>
              </div>
              <p className={`text-[13px] leading-[1.7] ${isLive ? 'text-white/85' : 'text-white/25'}`}>{tweet.text}</p>
              <div className="flex items-center mt-4 pt-3 border-t border-white/[0.04]">
                <span className="text-[9px] text-white/15 font-mono">@kreation</span>
                <div className="ml-auto flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${beat.dot} opacity-60`} />
                  <span className="text-[8px] text-white/15 tracking-widest uppercase">Voice DNA</span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Image Prompt Banner ──────────────────────────────────────────────────────

function ImageBanner({ prompt, pending, onCopy, onClose }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(prompt).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex-shrink-0 mx-6 mb-3 rounded-xl border border-emerald-900/30 bg-emerald-950/20 overflow-hidden transition-all duration-300">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-emerald-900/20">
        <IconImage className="text-emerald-400/70" />
        <span className="text-[8px] text-emerald-500/60 tracking-widest uppercase font-bold">Visual Prompt</span>
        <button onClick={onClose} className="ml-auto text-white/20 hover:text-white/50 transition-colors text-base leading-none">×</button>
      </div>
      <div className="flex items-start gap-3 p-4">
        {pending ? (
          <div className="flex items-center gap-2 text-white/30">
            <span className="inline-flex gap-1">
              {[0, 120, 240].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
            </span>
            <span className="text-[9px] tracking-widest">Generating visual prompt...</span>
          </div>
        ) : (
          <>
            <p className="flex-1 text-[12px] text-emerald-100/80 leading-relaxed italic">"{prompt}"</p>
            <button onClick={copy} className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[8px] font-black tracking-widest uppercase transition-all ${copied ? 'border-emerald-700/50 text-emerald-300 bg-emerald-900/30' : 'border-emerald-900/30 text-emerald-400/60 hover:border-emerald-700/40 hover:text-emerald-300'}`}>
              <IconCopy done={copied} />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconChat     = ({ active }) => <svg className={`w-4 h-4 ${active ? 'text-emerald-300' : 'text-white/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
const IconDNA      = ({ active }) => <svg className={`w-4 h-4 ${active ? 'text-emerald-300' : 'text-white/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3c.6 3-2 5-2 8s2.4 5 2 8M12 3c-.6 3 2 5 2 8s-2.4 5-2 8M8.5 5.5C10 6.5 14 6.5 15.5 5.5M8.5 18.5c1.5-1 5.5-1 7 0M9 10c1 .5 5 .5 6 0M9 14c1 .5 5 .5 6 0" /></svg>
const IconFolder   = ({ active }) => <svg className={`w-4 h-4 ${active ? 'text-emerald-300' : 'text-white/30'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
const IconSparkle  = () => <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l1.8 5.4L19.8 9l-6 1.8L12 17l-1.8-6.2L4.2 9l6-1.6L12 2z" opacity=".9"/><path d="M19 14l.9 2.7L22.6 18l-2.7.9L19 21.6l-.9-2.7L15.4 18l2.7-.9L19 14z" opacity=".5"/></svg>
const IconImage    = ({ className }) => <svg className={`w-3.5 h-3.5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" /></svg>
const IconCopy     = ({ done }) => done
  ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
  : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path strokeLinecap="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
const IconSave     = () => <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>

function RailIcon({ icon, label, active, onClick, badge }) {
  return (
    <button title={label} onClick={onClick}
      className={`group relative flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 ${active ? 'bg-emerald-900/40 border-emerald-700/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'}`}>
      {icon}
      {badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[7px] font-black flex items-center justify-center">{badge > 9 ? '9+' : badge}</span>}
      <span className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded-lg bg-[#0d0d0d] border border-white/10 text-[9px] text-white/60 tracking-widest uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">{label}</span>
    </button>
  )
}

function StatusChip({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/5 rounded-lg px-2.5 py-1">
      <span className="text-[7px] text-white/20 tracking-widest uppercase">{label}:</span>
      <span className="text-[8px] font-black tracking-widest" style={{ color }}>{value}</span>
    </div>
  )
}

// ─── Action Button (canvas header) ───────────────────────────────────────────

function ActionBtn({ onClick, disabled, active, icon, label }) {
  return (
    <button onClick={onClick} disabled={disabled} title={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[8px] font-black tracking-widest uppercase transition-all duration-200 ${
        active
          ? 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300'
          : 'bg-white/[0.02] border-emerald-900/30 text-emerald-400/70 hover:bg-emerald-950/30 hover:border-emerald-700/40 disabled:opacity-20 disabled:cursor-not-allowed'
      }`}>
      {icon}
      {label}
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_DNA = { vibe: 75, expertise: 75, length: 75, heat: 25 }

export default function VoiceFilterPage() {
  const [messages, setMessages]         = useState([
    { role: 'agent', text: 'KREATION VOICE ENGINE v1.0 — ONLINE.' },
    { role: 'agent', text: 'Drop your raw idea. Open the DNA Lab to tune the style. Hover sections in the canvas to refine them individually.' },
  ])
  const [input, setInput]               = useState('')
  const [status, setStatus]             = useState('idle')
  const [canvas, setCanvas]             = useState(EMPTY_CANVAS)
  const [activeTab, setActiveTab]       = useState('POST')
  const [pendingAgent, setPendingAgent] = useState(null)
  const [dna, setDna]                   = useState(DEFAULT_DNA)
  const [openDrawer, setOpenDrawer]     = useState(null)
  const [drafts, setDrafts]             = useState(loadDrafts)
  const [copied, setCopied]             = useState(false)
  const [savedFlash, setSavedFlash]     = useState(false)
  const [refiningId, setRefiningId]     = useState(null)
  const [imagePrompt, setImagePrompt]   = useState(null)
  const [imagePending, setImagePending] = useState(false)

  const endRef   = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pendingAgent, status])

  const toggleDrawer   = (id) => setOpenDrawer(prev => prev === id ? null : id)
  const handleDnaChange = (patch) => setDna(prev => ({ ...prev, ...patch }))

  const handleTypewriterDone = () => {
    if (!pendingAgent) return
    setMessages(prev => [...prev, { role: 'agent', text: pendingAgent }])
    setPendingAgent(null)
    setStatus('idle')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // ── Main Filter ──
  const handleSend = async () => {
    const raw = input.trim()
    if (!raw || status !== 'idle') return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: raw }])
    setStatus('thinking')
    try {
      const result = await callClaude(buildSystemPrompt(dna), raw, 1200)
      const m = result.match(/\{[\s\S]*\}/)
      if (!m) throw new Error('No JSON in model response.')
      const parsed = JSON.parse(m[0])
      setCanvas({ post: parsed.post, script: parsed.script, thread: parsed.thread })
      setImagePrompt(null)
      setStatus('generating')
      setPendingAgent(`Filter applied — Vibe: ${getLabel(VIBE_LABELS, dna.vibe)} / Expertise: ${getLabel(EXPERTISE_LABELS, dna.expertise)} / Length: ${getLabel(LENGTH_LABELS, dna.length)} / Heat: ${getLabel(HEAT_LABELS, dna.heat)}. Canvas updated.`)
    } catch (err) {
      setStatus('idle')
      setMessages(prev => [...prev, { role: 'error', text: `Filter error: ${err.message}` }])
    }
  }

  // ── Magic Wand Refiner ──
  const handleRefine = async (section, idx) => {
    const rid = idx !== undefined ? `${section}-${idx}` : section
    if (refiningId) return
    let text = ''
    if (section === 'post')   text = canvas.post
    if (section === 'script') text = canvas.script[idx].text
    if (section === 'thread') text = canvas.thread[idx].text
    if (!text) return

    setRefiningId(rid)
    try {
      const result = await callClaude(
        REFINE_SYSTEM,
        `Make this approximately 20% more biting and salty than it currently reads. Keep the same length and subject matter. Return ONLY the revised text.\n\nTEXT:\n${text}`,
        512
      )
      const refined = result.trim()
      setCanvas(prev => {
        if (section === 'post') return { ...prev, post: refined }
        if (section === 'script') {
          const s = [...prev.script]; s[idx] = { ...s[idx], text: refined }; return { ...prev, script: s }
        }
        if (section === 'thread') {
          const t = [...prev.thread]; t[idx] = { ...t[idx], text: refined }; return { ...prev, thread: t }
        }
        return prev
      })
    } catch (err) {
      console.error('Refine error:', err)
    } finally {
      setRefiningId(null)
    }
  }

  // ── Image Companion ──
  const handleImagePrompt = async () => {
    if (!canvas.post || imagePending) return
    setImagePrompt('')
    setImagePending(true)
    try {
      const result = await callClaude(
        IMAGE_SYSTEM,
        `Based on the text and emotional tone below, generate one vivid, cinematic, single-sentence image prompt. Make it specific and visual. Return ONLY the prompt sentence.\n\nTEXT:\n${canvas.post}`,
        256
      )
      setImagePrompt(result.trim().replace(/^["']|["']$/g, ''))
    } catch {
      setImagePrompt('Could not generate visual prompt.')
    } finally {
      setImagePending(false)
    }
  }

  // ── Copy ──
  const handleCopy = useCallback(async () => {
    if (!canvas.post) return
    const text = buildCopyText(canvas, activeTab)
    try { await navigator.clipboard.writeText(text) }
    catch {
      const el = document.createElement('textarea')
      el.value = text; document.body.appendChild(el); el.select()
      document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [canvas, activeTab])

  // ── Save Draft ──
  const handleSaveDraft = useCallback(() => {
    if (!canvas.post) return
    const draft = { id: Date.now().toString(), savedAt: Date.now(), dna: { ...dna }, canvas: { ...canvas }, activeTab, preview: canvas.post?.slice(0, 120) ?? '' }
    const updated = [draft, ...drafts].slice(0, 50)
    setDrafts(updated); saveDrafts(updated)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }, [canvas, dna, activeTab, drafts])

  const handleLoadDraft   = (draft) => { setCanvas(draft.canvas); setDna(draft.dna); setActiveTab(draft.activeTab); setOpenDrawer(null) }
  const handleDeleteDraft = (id) => { const u = drafts.filter(d => d.id !== id); setDrafts(u); saveDrafts(u) }

  const hasCanvas   = canvas.post !== null
  const pulseColor  = sentimentColor(dna.vibe, dna.heat)

  const chips = [
    { label: 'VIBE',      val: getLabel(VIBE_LABELS, dna.vibe),           id: 'vibe' },
    { label: 'EXPERTISE', val: getLabel(EXPERTISE_LABELS, dna.expertise), id: 'expertise' },
    { label: 'LENGTH',    val: getLabel(LENGTH_LABELS, dna.length),       id: 'length' },
    { label: 'HEAT',      val: getLabel(HEAT_LABELS, dna.heat),           id: 'heat' },
  ]

  return (
    <div className="flex flex-col h-screen bg-black text-[#f0f6fc] font-mono overflow-hidden">

      {/* ── Header ── */}
      <header className="relative z-40 flex-shrink-0 flex items-center gap-4 px-6 py-3 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981] animate-pulse" />
          <span className="text-xs font-black tracking-[0.25em] text-white uppercase">Kreation</span>
        </div>
        <span className="text-white/10">/</span>
        <span className="text-[10px] text-emerald-400 tracking-[0.2em] uppercase">Voice Engine v1.0</span>
        <div className="ml-auto flex items-center gap-2">
          {chips.map(chip => (
            <StatusChip key={chip.label} label={chip.label} value={chip.val.toUpperCase()}
              color={SLIDER_COLORS[chip.id]?.(chip.id === 'vibe' ? dna.vibe : chip.id === 'expertise' ? dna.expertise : chip.id === 'length' ? dna.length : dna.heat)} />
          ))}
          <div className="w-px h-4 bg-white/10 mx-1" />
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${status === 'idle' ? 'bg-white/20' : status === 'thinking' ? 'bg-blue-400 shadow-[0_0_6px_#60a5fa] animate-pulse' : 'bg-emerald-400 shadow-[0_0_6px_#10B981]'}`} />
            <span className="text-[9px] text-white/30 tracking-widest uppercase">{status}</span>
          </div>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── LEFT RAIL ── */}
        <div className="flex-shrink-0 w-14 z-30 flex flex-col items-center gap-3 pt-5 pb-5 bg-black border-r border-white/[0.04]">
          <RailIcon icon={<IconChat active={false} />} label="Command Center" active={false} onClick={() => {}} />
          <RailIcon icon={<IconDNA active={openDrawer === 'dna'} />} label="DNA Lab" active={openDrawer === 'dna'} onClick={() => toggleDrawer('dna')} />
          <RailIcon icon={<IconFolder active={openDrawer === 'drafts'} />} label="Drafts" active={openDrawer === 'drafts'} onClick={() => toggleDrawer('drafts')} badge={drafts.length} />
          <div className="mt-auto">
            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${openDrawer ? 'bg-emerald-400 shadow-[0_0_6px_#10B981]' : 'bg-white/10'}`} />
          </div>
        </div>

        {/* ── COMMAND CENTER ── */}
        <div className="w-[40%] flex flex-col border-r border-white/5 bg-black" onClick={() => { if (openDrawer) setOpenDrawer(null) }}>
          <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04] flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa] animate-pulse" />
            <span className="text-[9px] tracking-[0.25em] text-white/40 uppercase">Command Center</span>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[8px] tracking-widest text-white/20 uppercase px-1">
                  {msg.role === 'user' ? 'Raw Idea' : msg.role === 'error' ? 'Error' : 'Voice Engine'}
                </span>
                <div className={`max-w-[88%] px-4 py-3 rounded-xl text-[13px] leading-relaxed ${
                  msg.role === 'user'   ? 'bg-white/[0.03] text-white/50 border border-white/5 rounded-tr-none' :
                  msg.role === 'error' ? 'bg-red-950/30 text-red-400 border border-red-900/20 rounded-tl-none' :
                                         'bg-white/[0.02] text-white/70 border border-white/[0.04] rounded-tl-none'
                }`}>{msg.text}</div>
              </div>
            ))}
            {pendingAgent && (
              <div className="flex flex-col gap-1 items-start">
                <span className="text-[8px] tracking-widest text-white/20 uppercase px-1">Voice Engine</span>
                <div className="max-w-[88%] px-4 py-3 rounded-xl rounded-tl-none bg-white/[0.02] text-white/70 border border-white/[0.04] text-[13px] leading-relaxed">
                  <Typewriter text={pendingAgent} onDone={handleTypewriterDone} />
                </div>
              </div>
            )}
            {status === 'thinking' && (
              <div className="flex flex-col gap-1 items-start">
                <span className="text-[8px] tracking-widest text-white/20 uppercase px-1">Voice Engine</span>
                <div className="px-4 py-3 rounded-xl rounded-tl-none bg-white/[0.02] border border-white/[0.04]">
                  <span className="inline-flex gap-1.5">
                    {[0, 120, 240].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="flex-shrink-0 p-5 border-t border-white/5" onClick={e => e.stopPropagation()}>
            <div className={`relative rounded-xl border transition-all duration-300 ${input ? 'border-emerald-900/60' : 'border-white/5'} ${status !== 'idle' ? 'opacity-50 pointer-events-none' : ''}`}>
              {input && <div className="absolute -inset-px rounded-xl bg-emerald-500/10 blur-sm pointer-events-none" />}
              <div className="relative flex items-end bg-white/[0.02] rounded-xl overflow-hidden">
                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Drop your raw idea..." rows={2}
                  className="flex-1 bg-transparent px-4 py-3.5 text-sm text-white/80 placeholder-white/15 resize-none outline-none" />
                <button onClick={handleSend} disabled={!input.trim() || status !== 'idle'}
                  className="m-2 px-4 py-2 rounded-lg text-[9px] tracking-widest uppercase font-black bg-emerald-900/50 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-800/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all">
                  Filter
                </button>
              </div>
            </div>
            <p className="text-[9px] text-white/10 mt-2 tracking-wide text-center">Enter to filter · Shift+Enter for new line</p>
          </div>
        </div>

        {/* ── OMNI-CANVAS ── */}
        <div className="flex-1 flex flex-col bg-[#010101] relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

          {/* Canvas header */}
          <div className="relative z-10 flex-shrink-0 flex items-center gap-3 px-6 py-3.5 border-b border-white/5">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
              <span className="text-[9px] tracking-[0.25em] text-emerald-400/70 uppercase">Omni-Canvas</span>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5">
                {['POST', 'SCRIPT', 'THREAD'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all duration-200 ${activeTab === tab ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-900/60 shadow-[0_0_12px_rgba(16,185,129,0.1)]' : 'text-white/25 hover:text-white/50'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Image Companion */}
              <ActionBtn onClick={handleImagePrompt} disabled={!hasCanvas || imagePending}
                active={imagePrompt !== null} icon={<IconImage className="text-emerald-400" />} label="Image" />
              {/* Copy */}
              <ActionBtn onClick={handleCopy} disabled={!hasCanvas} active={copied}
                icon={<IconCopy done={copied} />} label={copied ? 'Copied!' : 'Copy'} />
              {/* Save Draft */}
              <ActionBtn onClick={handleSaveDraft} disabled={!hasCanvas} active={savedFlash}
                icon={<IconSave />} label={savedFlash ? 'Saved!' : 'Save Draft'} />
              <div className="w-px h-4 bg-white/5" />
              <span className={`text-[9px] font-mono tracking-widest uppercase ${hasCanvas ? 'text-emerald-500/50' : 'text-white/10'}`}>
                {hasCanvas ? 'Live' : 'Empty'}
              </span>
            </div>
          </div>

          {/* Image Prompt Banner */}
          {(imagePrompt !== null || imagePending) && (
            <ImageBanner prompt={imagePrompt} pending={imagePending} onClose={() => { setImagePrompt(null); setImagePending(false) }} />
          )}

          {/* Canvas body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 relative z-10">
            {!hasCanvas ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-40">
                <div className="w-16 h-16 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center">
                  <span className="text-2xl text-white/20">≫</span>
                </div>
                <p className="text-xs text-white/30 max-w-xs leading-relaxed">
                  Type a raw idea in the Command Center.<br />The Voice Filter pushes output here.
                </p>
                <div className="mt-4 w-full max-w-xs border-t border-white/5 pt-4">
                  <p className="text-[9px] text-white/15 tracking-widest uppercase mb-3">Preview</p>
                  {activeTab === 'POST'   && <PostCanvas   post={null} placeholder={PLACEHOLDER_CANVAS.post} onRefine={() => {}} refiningId={null} />}
                  {activeTab === 'SCRIPT' && <ScriptCanvas script={null} placeholder={PLACEHOLDER_CANVAS.script} onRefine={() => {}} refiningId={null} />}
                  {activeTab === 'THREAD' && <ThreadCanvas thread={null} placeholder={PLACEHOLDER_CANVAS.thread} onRefine={() => {}} refiningId={null} />}
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'POST'   && <PostCanvas   post={canvas.post}     placeholder={PLACEHOLDER_CANVAS.post}   onRefine={handleRefine} refiningId={refiningId} />}
                {activeTab === 'SCRIPT' && <ScriptCanvas script={canvas.script} placeholder={PLACEHOLDER_CANVAS.script} onRefine={handleRefine} refiningId={refiningId} />}
                {activeTab === 'THREAD' && <ThreadCanvas thread={canvas.thread} placeholder={PLACEHOLDER_CANVAS.thread} onRefine={handleRefine} refiningId={refiningId} />}
              </>
            )}
          </div>

          {/* ── Sentiment Pulse — persistent 2px glow bar ── */}
          <div className="flex-shrink-0 h-0.5 mx-6 mb-3 relative overflow-hidden rounded-full">
            {/* Persistent sentiment color */}
            <div className="absolute inset-0 rounded-full transition-all duration-700"
              style={{ backgroundColor: pulseColor, boxShadow: `0 0 10px ${pulseColor}60`, opacity: 0.5 }} />
            {/* Generation animation overlay */}
            {status === 'thinking'   && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[plasma_2s_linear_infinite]" />}
            {status === 'generating' && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[plasma_2s_linear_infinite]" />}
          </div>

          {/* Drawers */}
          <DNADrawer    dna={dna} onChange={handleDnaChange} open={openDrawer === 'dna'} />
          <DraftsDrawer open={openDrawer === 'drafts'} drafts={drafts} onLoad={handleLoadDraft} onDelete={handleDeleteDraft} />
        </div>
      </div>
    </div>
  )
}
