import { useState } from 'react'
import {
  getProfile, saveProfile,
  getDNAControls, saveDNAControls, buildControlContext,
  getCustomSlop, saveCustomSlop,
} from '../services/dnaControls'
import { publishPost } from '../services/learningEngine'
import slopList from '../data/global_slop_list.json'

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: '◉' },
  { id: 'dna', label: 'DNA Controls', icon: '🧬' },
  { id: 'slop', label: 'Slop-Killer', icon: '🔥' },
  { id: 'override', label: 'Manual Override', icon: '⚡' },
]

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection() {
  const [profile, setProfile] = useState(() => getProfile())
  const [saved, setSaved] = useState(false)

  const set = (key, val) => setProfile(p => ({ ...p, [key]: val }))

  const handleSave = () => {
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-7 max-w-lg">
      <div>
        <h2 className="text-lg font-bold text-gray-100">Profile</h2>
        <p className="text-sm text-gray-500 mt-0.5">Your identity anchors how the AI represents you online.</p>
      </div>

      {/* Avatar initial */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl font-black text-indigo-400 flex-shrink-0">
          {profile.name ? profile.name[0].toUpperCase() : '?'}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-300">{profile.name || 'Your Name'}</p>
          <p className="text-xs text-gray-600 font-mono">@{profile.x_handle || 'handle'}</p>
        </div>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Name</label>
        <input
          value={profile.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Your real name"
          className="bg-gray-800/50 rounded-xl border border-gray-700/50 focus:border-indigo-500/40 px-4 py-3 text-sm text-gray-200 placeholder-gray-700 focus:outline-none transition"
        />
      </div>

      {/* X Handle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">X Handle</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-mono text-sm">@</span>
          <input
            value={profile.x_handle}
            onChange={e => set('x_handle', e.target.value.replace('@', ''))}
            placeholder="yourhandle"
            className="w-full bg-gray-800/50 rounded-xl border border-gray-700/50 focus:border-indigo-500/40 pl-8 pr-4 py-3 text-sm text-gray-200 placeholder-gray-700 focus:outline-none transition"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`w-fit px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${saved
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            : 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/25 text-indigo-400'
          }`}
      >
        {saved ? '✓ Saved' : 'Save Profile'}
      </button>
    </div>
  )
}

// ─── Section: DNA Controls ────────────────────────────────────────────────────

const SLIDERS = [
  {
    key: 'spiciness',
    label: 'Spiciness',
    desc: 'How edgy and provocative the output feels. High = hot takes. Low = measured.',
    lo: 'Measured',
    hi: 'Spicy 🌶',
    color: 'accent-orange-500',
  },
  {
    key: 'technical_depth',
    label: 'Technical Depth',
    desc: 'Jargon density and specificity. High = concrete numbers and terms. Low = plain language.',
    lo: 'Simple',
    hi: 'Dense',
    color: 'accent-blue-500',
  },
  {
    key: 'brevity',
    label: 'Brevity',
    desc: 'How terse vs expansive. High = every word earns its place. Low = full context.',
    lo: 'Expansive',
    hi: 'Terse',
    color: 'accent-indigo-500',
  },
]

function DNAControlsSection() {
  const [controls, setControls] = useState(() => getDNAControls())
  const [saved, setSaved] = useState(false)

  const set = (key, val) => setControls(c => ({ ...c, [key]: val }))

  const handleSave = () => {
    saveDNAControls(controls)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-7 max-w-lg">
      <div>
        <h2 className="text-lg font-bold text-gray-100">DNA Controls</h2>
        <p className="text-sm text-gray-500 mt-0.5">Tune how the AI writes. Injected into every generation.</p>
      </div>

      {SLIDERS.map(s => (
        <div key={s.key} className="flex flex-col gap-2.5 p-4 rounded-xl bg-gray-900/30 border border-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-gray-200">{s.label}</label>
            <span className="text-xs font-mono text-gray-400 bg-black/40 px-2 py-0.5 rounded-md border border-white/5 shadow-inner">{controls[s.key]}</span>
          </div>

          <div className="relative w-full h-2.5 bg-gray-950 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border border-gray-800/60 overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-150 ease-out bg-gradient-to-r from-indigo-600 to-${s.color.replace('accent-', '')}`}
              style={{ width: `${controls[s.key]}%` }}
            />
            <input
              type="range" min={0} max={100}
              value={controls[s.key]}
              onChange={e => set(s.key, +e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex justify-between text-[10px] text-gray-500 font-mono tracking-wider uppercase mt-0.5">
            <span>{s.lo}</span>
            <span>{s.hi}</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
        </div>
      ))}

      {/* Live preview */}
      <div className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2">Prompt Preview</p>
        <p className="text-xs text-gray-400 font-mono leading-relaxed">{buildControlContext(controls)}</p>
      </div>

      <button
        onClick={handleSave}
        className={`w-fit px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${saved
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
            : 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/25 text-indigo-400'
          }`}
      >
        {saved ? '✓ Saved' : 'Save Controls'}
      </button>
    </div>
  )
}

// ─── Section: Slop-Killer ─────────────────────────────────────────────────────

function SlopKillerSection() {
  const [custom, setCustom] = useState(() => getCustomSlop())
  const [newWord, setNewWord] = useState('')
  const [saved, setSaved] = useState(false)

  const builtIn = [...slopList.forbidden_words, ...slopList.generic_adjectives]

  const addWord = () => {
    const w = newWord.trim().toLowerCase()
    if (!w || custom.includes(w)) return
    const updated = [...custom, w]
    setCustom(updated)
    saveCustomSlop(updated)
    setNewWord('')
  }

  const removeWord = (w) => {
    const updated = custom.filter(x => x !== w)
    setCustom(updated)
    saveCustomSlop(updated)
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="text-lg font-bold text-gray-100">Slop-Killer</h2>
        <p className="text-sm text-gray-500 mt-0.5">Words that are permanently banned from AI output.</p>
      </div>

      {/* Built-in words */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
          Built-in ({builtIn.length} words)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {builtIn.map(word => (
            <span key={word}
              className="px-2.5 py-1 bg-red-500/8 border border-red-500/15 text-red-400/70 text-[11px] font-mono rounded-lg">
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* Custom words */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
          Your custom words {custom.length > 0 && `(${custom.length})`}
        </p>

        {custom.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {custom.map(word => (
              <span key={word}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/15 border border-red-500/25 text-red-400 text-[11px] font-mono rounded-lg">
                {word}
                <button onClick={() => removeWord(word)} className="text-red-400/50 hover:text-red-400 leading-none">×</button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={newWord}
            onChange={e => setNewWord(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addWord()}
            placeholder="Add a word to ban..."
            className="flex-1 bg-gray-800/50 rounded-xl border border-gray-700/50 focus:border-red-500/30 px-4 py-2 text-sm text-gray-300 placeholder-gray-700 focus:outline-none transition font-mono"
          />
          <button
            onClick={addWord}
            disabled={!newWord.trim()}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-bold disabled:opacity-40 transition-all"
          >
            Ban
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Section: Manual Override ─────────────────────────────────────────────────

function ConnectivitySection() {
  const [posts, setPosts] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState(null)

  const handleSync = async () => {
    if (!posts.trim()) return
    setSyncing(true)
    setResult(null)

    const chunks = posts.split(/\n{2,}/)
      .map(s => s.trim())
      .filter(s => s.split(/\s+/).length >= 5) // at least 5 words
      .slice(0, 20)

    let count = 0
    for (const chunk of chunks) {
      try {
        await publishPost(chunk, 'x', null)
        count++
      } catch { /* skip failed */ }
    }

    setResult(`✓ ${count} post(s) synced to your Vector Memory.`)
    setSyncing(false)
    setPosts('')
  }

  return (
    <div className="flex flex-col gap-7 max-w-lg">
      <div>
        <h2 className="text-lg font-bold text-gray-100">Manual Override</h2>
        <p className="text-sm text-gray-500 mt-0.5">Jumpstart learning by seeding your Vector Memory with 3–5 existing posts you love.</p>
      </div>

      <div className="rounded-2xl border border-gray-800/70 bg-gray-800/20 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-sm text-gray-500">𝕏</span>
          <span className="text-sm font-semibold text-gray-300">Seed Memory with Your Best Posts</span>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Paste 3–5 posts you love below. Separate each post with a blank line. They will be indexed into your Vector Memory immediately as reference templates — the AI will mirror their structure and tone from day one.
        </p>

        <textarea
          value={posts}
          onChange={e => setPosts(e.target.value)}
          placeholder={"Post one goes here\n\nPost two goes here\n\nPost three goes here"}
          rows={8}
          className="w-full bg-gray-900/60 rounded-xl border border-gray-700/40 focus:border-indigo-500/30 p-4 text-sm text-gray-300 placeholder-gray-700 focus:outline-none resize-none transition font-mono"
        />

        {result && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
            {result}
          </div>
        )}

        <button
          onClick={handleSync}
          disabled={syncing || !posts.trim()}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-400 font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {syncing ? (
            <>
              <span className="w-3.5 h-3.5 border border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              Indexing posts...
            </>
          ) : '⚡ Sync to Memory'}
        </button>
      </div>
    </div>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [section, setSection] = useState('profile')

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-100">Settings</h1>
        <p className="text-sm text-gray-600 mt-0.5">Configure your voice DNA, preferences, and integrations.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] min-h-[72vh] bg-gradient-to-br from-[#090b0f]/90 to-[#0d1117]/90 backdrop-blur-2xl">

        {/* Sidebar */}
        <div className="md:col-span-3 border-r border-white/[0.04] p-5 flex flex-col gap-1.5 bg-black/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-4 py-3">Command Center</p>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`group flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 text-left ${section === s.id
                  ? 'bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02] border border-transparent'
                }`}
            >
              <span className={`text-base leading-none transition-transform duration-300 ${section === s.id ? 'scale-110 drop-shadow-[0_0_8px_currentColor]' : 'group-hover:scale-110 opacity-70'}`}>
                {s.icon}
              </span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div className="md:col-span-9 p-8 md:p-10 overflow-y-auto custom-scrollbar relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10">
            {section === 'profile' && <ProfileSection />}
            {section === 'dna' && <DNAControlsSection />}
            {section === 'slop' && <SlopKillerSection />}
            {section === 'override' && <ConnectivitySection />}
          </div>
        </div>

      </div>
    </div>
  )
}
