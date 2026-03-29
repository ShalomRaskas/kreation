import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  callClaude,
  buildDNASystem,
  calculateAuthenticityScore,
} from '../services/voiceSync'
import {
  retrieveSimilarPosts,
  getLearnedContext,
  getStoreCount,
} from '../services/learningEngine'
import {
  getVoiceMaturity,
  getWeights,
  buildWeightContext,
} from '../services/longTermMemory'
import {
  getDNAControls,
  buildControlContext,
  getProfile,
} from '../services/dnaControls'

const SYSTEM = buildDNASystem()

const QUICK_PLATFORMS = {
  twitter:  { label: 'Twitter/X',       algo: 'Bold opinions win. Opening tweet must standalone. Each point quotable. No external links in opener.',  format: '[OPENING TWEET]\n[POINT 1]\n[POINT 2]\n[POINT 3]\n[CLOSER + question]' },
  linkedin: { label: 'LinkedIn',        algo: 'First 2-3 lines before fold are your hook. Comments drive algo. End with question. Build story slowly.', format: '[HOOK]\n[STORY]\n[INSIGHT]\n[LESSON]\n[QUESTION]' },
  tiktok:   { label: 'TikTok',          algo: 'Hook in first 1.5s. Native unpolished tone. 30-45 seconds. Build fast, reward at the end.',             format: '[HOOK]\n[SETUP]\n[BUILD]\n[PAYOFF + CTA]' },
  reels:    { label: 'Instagram Reels', algo: 'Shares/saves drive discovery. Raw but slightly polished. 15-30 seconds.',                               format: '[HOOK]\n[SETUP]\n[BUILD]\n[PAYOFF + SHARE HOOK]' },
  shorts:   { label: 'YouTube Shorts',  algo: 'Completion rate is key. Loop-worthy endings. 45-60 seconds.',                                           format: '[HOOK]\n[SETUP]\n[BUILD]\n[PAYOFF + LOOP CTA]' },
}

function getGreeting(name) {
  const hour = new Date().getHours()
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'
  const first = (name || 'there').split(' ')[0]
  return `Good ${time}, ${first}`
}

function voiceLabel(val) {
  return val > 70 ? 'High' : val > 40 ? 'Medium' : 'Low'
}

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins || 1}m ago`
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(diff / 86400000)
  return `${days}d ago`
}

function platformIcon(platform) {
  switch (platform) {
    case 'twitter': return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
      </svg>
    )
    case 'linkedin': return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
      </svg>
    )
    default: return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    )
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const profile     = getProfile()
  const voiceMaturity = getVoiceMaturity()
  const weights     = getWeights()
  const storeCount  = getStoreCount()
  const controls    = getDNAControls()

  const recentPosts = (() => {
    try {
      return JSON.parse(localStorage.getItem('kreation_vector_store') || '[]')
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 3)
    } catch { return [] }
  })()

  const [quickTopic,    setQuickTopic]    = useState('')
  const [quickPlatform, setQuickPlatform] = useState('twitter')
  const [quickType,     setQuickType]     = useState('text')
  const [quickOutput,   setQuickOutput]   = useState('')
  const [quickScore,    setQuickScore]    = useState(null)
  const [isGenerating,  setIsGenerating]  = useState(false)
  const [quickError,    setQuickError]    = useState('')

  const handleQuickGenerate = async () => {
    if (!quickTopic.trim()) return
    setIsGenerating(true)
    setQuickError('')
    setQuickOutput('')
    setQuickScore(null)

    try {
      const p          = QUICK_PLATFORMS[quickPlatform]
      const learnedCtx = getLearnedContext()
      const weightCtx  = buildWeightContext(getWeights())
      const controlCtx = buildControlContext(getDNAControls())

      const similar = retrieveSimilarPosts(quickTopic)
      const similarBlock = similar.length
        ? `\n\nPAST SUCCESSFUL POSTS:\n${similar.map((s, i) => `[${i + 1}] ${s.content.slice(0, 160)}`).join('\n')}`
        : ''

      const userMessage =
        `TARGET PLATFORM: ${p.label}\nALGORITHM NOTES: ${p.algo}\nOUTPUT FORMAT:\n${p.format}` +
        similarBlock +
        (weightCtx  ? `\n\nVOICE WEIGHTS:\n${weightCtx}`          : '') +
        (learnedCtx ? `\n\nLEARNED PREFERENCES:\n${learnedCtx}`   : '') +
        `\n\nDNA CONTROLS:\n${controlCtx}` +
        `\n\nTopic: ${quickTopic}\n\nWrite content exactly as specified. Direct output only.`

      const result = await callClaude(SYSTEM, userMessage, 1024)
      const { score } = calculateAuthenticityScore(result)
      setQuickOutput(result)
      setQuickScore(score)
    } catch (e) {
      setQuickError(e.message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Stat data
  const stats = [
    {
      label: 'Content created',
      value: storeCount,
      sub: storeCount === 1 ? '1 post in memory' : `${storeCount} posts in memory`,
      subColor: '#22c55e',
    },
    {
      label: 'Edits logged',
      value: weights?.edit_count ?? 0,
      sub: 'Shadow Learner active',
      subColor: '#71717a',
    },
    {
      label: 'Voice accuracy',
      value: `${voiceMaturity}%`,
      sub: voiceMaturity >= 90 ? '🪞 Mirror Mode active' : 'Based on your edits',
      subColor: '#a5b4fc',
    },
    {
      label: 'Published posts',
      value: weights?.publish_count ?? 0,
      sub: 'Total publishes',
      subColor: '#71717a',
    },
  ]

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ color: '#fafafa', fontSize: 24, fontWeight: 600, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {getGreeting(profile.name)}
          </h1>
          <p style={{ color: '#71717a', fontSize: 14, margin: 0 }}>
            Here's what's happening with your content
          </p>
        </div>
        <button
          onClick={() => navigate('/create')}
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
            color: '#fff', border: 'none', padding: '10px 20px',
            borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create new
        </button>
      </div>

      {/* ── Stats Row ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...cardStyle, padding: 20 }}>
            <p style={{ color: '#52525b', fontSize: 12, margin: '0 0 8px', letterSpacing: '0.02em' }}>{s.label}</p>
            <p style={{ color: '#fafafa', fontSize: 28, fontWeight: 600, margin: 0 }}>{s.value}</p>
            <p style={{ color: s.subColor, fontSize: 12, margin: '4px 0 0' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Two Column ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>

        {/* Quick Create */}
        <div style={{ ...cardStyle, padding: 24 }}>
          <h2 style={{ color: '#fafafa', fontSize: 16, fontWeight: 600, margin: '0 0 20px' }}>Quick create</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#71717a', fontSize: 12, display: 'block', marginBottom: 8 }}>
              What's on your mind?
            </label>
            <textarea
              value={quickTopic}
              onChange={e => setQuickTopic(e.target.value)}
              placeholder="Share an idea, lesson, or hot take..."
              style={{
                width: '100%', background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                padding: 14, color: '#e4e4e7', fontSize: 14, resize: 'none',
                height: 100, fontFamily: 'inherit', boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <label style={{ color: '#71717a', fontSize: 12, flex: 1 }}>
              Platform
              <select
                value={quickPlatform}
                onChange={e => setQuickPlatform(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                  padding: '10px 12px', color: '#e4e4e7', fontSize: 13,
                  marginTop: 8, cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="twitter">Twitter/X</option>
                <option value="linkedin">LinkedIn</option>
                <option value="tiktok">TikTok</option>
                <option value="reels">Instagram Reels</option>
                <option value="shorts">YouTube Shorts</option>
              </select>
            </label>
            <label style={{ color: '#71717a', fontSize: 12, flex: 1 }}>
              Content type
              <select
                value={quickType}
                onChange={e => setQuickType(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
                  padding: '10px 12px', color: '#e4e4e7', fontSize: 13,
                  marginTop: 8, cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="text">Text Post</option>
                <option value="video">Video Script</option>
              </select>
            </label>
          </div>

          {quickError && (
            <p style={{ color: '#f87171', fontSize: 12, margin: '0 0 12px' }}>{quickError}</p>
          )}

          <button
            onClick={handleQuickGenerate}
            disabled={isGenerating || !quickTopic.trim()}
            style={{
              width: '100%',
              background: isGenerating || !quickTopic.trim()
                ? 'rgba(99,102,241,0.4)'
                : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
              color: '#fff', border: 'none', padding: 12,
              borderRadius: 8, fontSize: 14, fontWeight: 500,
              cursor: isGenerating || !quickTopic.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {isGenerating ? (
              <>
                <div style={{
                  width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Generating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                </svg>
                Generate in my voice
              </>
            )}
          </button>

          {/* Inline output */}
          {quickOutput && (
            <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: '#71717a', fontSize: 12 }}>
                  {QUICK_PLATFORMS[quickPlatform].label} · DNA Match {quickScore}%
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => navigator.clipboard.writeText(quickOutput)}
                    style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#71717a', fontSize: 12, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                    }}
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => navigate('/create')}
                    style={{
                      background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
                      color: '#a5b4fc', fontSize: 12, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
                    }}
                  >
                    Open in editor →
                  </button>
                </div>
              </div>
              <pre style={{
                color: '#e4e4e7', fontSize: 14, lineHeight: 1.7,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 16,
                margin: 0, fontFamily: 'inherit',
              }}>
                {quickOutput}
              </pre>
            </div>
          )}
        </div>

        {/* Voice Profile */}
        <div style={{ ...cardStyle, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ color: '#fafafa', fontSize: 16, fontWeight: 600, margin: 0 }}>Your voice profile</h2>
            <a href="/dna" style={{ color: '#6366f1', fontSize: 12, textDecoration: 'none' }}>Edit →</a>
          </div>

          {[
            { label: 'Directness',      val: controls.spiciness        ?? 50 },
            { label: 'Conversational',  val: 100 - (controls.technical_depth ?? 50) },
            { label: 'Technical depth', val: controls.technical_depth   ?? 50 },
          ].map(({ label, val }) => (
            <div key={label} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#a1a1aa', fontSize: 13 }}>{label}</span>
                <span style={{ color: '#e4e4e7', fontSize: 13 }}>{voiceLabel(val)}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', height: 6, borderRadius: 3 }}>
                <div style={{
                  background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                  height: 6, borderRadius: 3, width: `${val}%`, transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          ))}

          <div style={{
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 10, padding: 14, marginTop: 8,
          }}>
            <p style={{ color: '#a5b4fc', fontSize: 12, margin: '0 0 4px', fontWeight: 500 }}>Voice maturity</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', height: 6, borderRadius: 3 }}>
                <div style={{
                  background: voiceMaturity >= 90
                    ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                    : 'linear-gradient(90deg, #6366f1, #a78bfa)',
                  height: 6, borderRadius: 3, width: `${voiceMaturity}%`, transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                {voiceMaturity}%
              </span>
            </div>
            {voiceMaturity >= 90 && (
              <p style={{ color: '#4ade80', fontSize: 11, margin: '6px 0 0' }}>🪞 Mirror Mode active</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Content ──────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#fafafa', fontSize: 16, fontWeight: 600, margin: 0 }}>Recent content</h2>
          <a href="/library" style={{ color: '#6366f1', fontSize: 13, textDecoration: 'none' }}>View all →</a>
        </div>

        {recentPosts.length === 0 ? (
          <div style={{ ...cardStyle, padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ color: '#52525b', fontSize: 14, margin: 0 }}>
              No published content yet. Hit <strong style={{ color: '#71717a' }}>Create new</strong> to get started.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentPosts.map(post => (
              <div
                key={post.id}
                style={{ ...cardStyle, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}
              >
                <div style={{
                  width: 40, height: 40, background: 'rgba(0,0,0,0.3)',
                  borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, color: '#71717a',
                }}>
                  {platformIcon(post.platform)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#e4e4e7', fontSize: 14, margin: '0 0 4px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.content?.slice(0, 80)}...
                  </p>
                  <p style={{ color: '#52525b', fontSize: 12, margin: 0 }}>
                    {QUICK_PLATFORMS[post.platform]?.label ?? post.platform} · {timeAgo(post.timestamp)}
                    {post.authenticityScore != null ? ` · ${post.authenticityScore}% match` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                    fontSize: 11, padding: '4px 10px', borderRadius: 20,
                  }}>
                    Published
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(post.content)}
                    style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#71717a', fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
