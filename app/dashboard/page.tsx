'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  niche: string
  personality: string
  audience: string
  style: string
  platform: string
}

interface Script {
  hook: string
  main: string
  cta: string
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'input' | 'output'>('input')
  const [idea, setIdea] = useState('')
  const [script, setScript] = useState<Script | null>(null)
  const [lastIdea, setLastIdea] = useState('')
  const [generating, setGenerating] = useState(false)
  const [refining, setRefining] = useState(false)
  const [showRefine, setShowRefine] = useState(false)
  const [refineFeedback, setRefineFeedback] = useState('')
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('niche, personality, audience, style, platform')
        .eq('id', user.id)
        .single()

      if (!data?.niche) {
        router.push('/onboarding')
        return
      }

      setProfile(data)
      setLoading(false)
    }

    loadProfile()
  }, [router])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  const callGenerate = async (idea: string, feedback: string) => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, refineFeedback: feedback }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Server error ${res.status}`)
    }

    const data = await res.json()
    return data.text as string
  }

  const generateScript = async () => {
    const trimmedIdea = idea.trim()
    if (!trimmedIdea) {
      showToast('Describe your idea first!')
      return
    }

    setLastIdea(trimmedIdea)
    setGenerating(true)

    try {
      const raw = await callGenerate(trimmedIdea, '')
      setScript(parseScript(raw))
      setView('output')
    } catch (e: unknown) {
      showToast(`Error: ${(e as Error).message}`)
    } finally {
      setGenerating(false)
    }
  }

  const refineScript = async () => {
    if (!refineFeedback.trim()) {
      showToast('Describe what to change')
      return
    }

    setRefining(true)

    try {
      const raw = await callGenerate(lastIdea, refineFeedback)
      setScript(parseScript(raw))
      showToast('Script refined ✓')
      setShowRefine(false)
      setRefineFeedback('')
    } catch (e: unknown) {
      showToast(`Error: ${(e as Error).message}`)
    } finally {
      setRefining(false)
    }
  }

  const parseScript = (text: string): Script => ({
    hook: extractSection(text, 'HOOK'),
    main: extractSection(text, 'MAIN CONTENT'),
    cta: extractSection(text, 'CALL TO ACTION'),
  })

  const extractSection = (text: string, label: string): string => {
    const safe = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(
      `\\[${safe}\\]\\s*\\n?([\\s\\S]*?)(?=\\n\\s*\\[(?:HOOK|MAIN CONTENT|CALL TO ACTION)\\]|$)`,
      'i'
    )
    const m = text.match(re)
    if (m && m[1].trim()) return m[1].trim()

    const chunks = text.split(/\[(?:HOOK|MAIN CONTENT|CALL TO ACTION)\]/i).slice(1)
    const order = ['HOOK', 'MAIN CONTENT', 'CALL TO ACTION']
    const idx = order.indexOf(label.toUpperCase())
    if (idx !== -1 && chunks[idx]) return chunks[idx].trim()

    return '(Section not found — try regenerating)'
  }

  const copyScript = () => {
    if (!script) return
    const text = `[HOOK]\n${script.hook}\n\n[MAIN CONTENT]\n${script.main}\n\n[CALL TO ACTION]\n${script.cta}`
    navigator.clipboard
      .writeText(text)
      .then(() => showToast('Copied to clipboard ✓'))
      .catch(() => showToast('Copy failed — select and copy manually'))
  }

  // ── Loading state ──
  if (loading) {
    return (
      <div
        className="page active"
        style={{ background: 'var(--bg)', justifyContent: 'center' }}
      >
        <div className="spinner" style={{ width: 48, height: 48 }} />
      </div>
    )
  }

  // ── Output view ──
  if (view === 'output' && script) {
    return (
      <>
        <section className="page active" id="page-output">
          <div className="output-nav">
            <div className="output-nav-left">
              <div className="logo">
                Kre<span>ation</span>
              </div>
              <span className="tag">Script Ready</span>
            </div>
            <div className="output-nav-right">
              <button className="btn btn-icon" onClick={copyScript}>
                📋 Copy Script
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setIdea('')
                  setView('input')
                }}
              >
                Create Another
              </button>
            </div>
          </div>

          <div className="output-content">
            <div className="script-section">
              <div className="section-header">
                <div className="section-badge badge-hook">🎣</div>
                <span className="section-title title-hook">Hook</span>
              </div>
              <div className="section-body">{script.hook}</div>
            </div>

            <div className="script-section">
              <div className="section-header">
                <div className="section-badge badge-main">📝</div>
                <span className="section-title title-main">Main Content</span>
              </div>
              <div className="section-body">{script.main}</div>
            </div>

            <div className="script-section">
              <div className="section-header">
                <div className="section-badge badge-cta">🚀</div>
                <span className="section-title title-cta">Call to Action</span>
              </div>
              <div className="section-body">{script.cta}</div>
            </div>

            <button
              className="btn btn-ghost"
              style={{ alignSelf: 'center' }}
              onClick={() => setShowRefine(r => !r)}
            >
              ✏️ Refine This Script
            </button>

            {showRefine && (
              <div className="refine-panel show">
                <h3>What would you like to change?</h3>
                <p style={{ fontSize: '0.875rem' }}>
                  e.g. &quot;Make the hook punchier&quot; or &quot;Add a personal story in the main content&quot;.
                </p>
                <textarea
                  placeholder="Type your feedback here…"
                  rows={3}
                  value={refineFeedback}
                  onChange={e => setRefineFeedback(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={refineScript}
                    disabled={refining}
                  >
                    {refining ? 'Refining…' : '↺ Regenerate with Feedback'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => setShowRefine(false)}
                  >
                    Cancel
                  </button>
                </div>

                {refining && (
                  <div className="loading-overlay show" style={{ minHeight: '80px' }}>
                    <div className="spinner" />
                    <div className="loading-text">
                      Refining<span className="loading-dots" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <div className={`toast ${toastVisible ? 'show' : ''}`}>{toastMsg}</div>
      </>
    )
  }

  // ── Input view (dashboard) ──
  return (
    <>
      <section className="page active" id="page-dashboard">
        <div className="dash-nav">
          <div className="logo">
            Kre<span>ation</span>
          </div>
          <div className="dash-nav-right">
            <div className="profile-pill">
              <div className="profile-avatar">
                {profile?.niche?.[0]?.toUpperCase() ?? '✦'}
              </div>
              <span>{profile?.niche ?? 'Your Profile'}</span>
            </div>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
              onClick={() => router.push('/onboarding')}
            >
              Edit Profile
            </button>
            <button
              className="btn btn-ghost"
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
              onClick={signOut}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="dash-content">
          <div className="welcome-block">
            <h2>
              Ready to create? <span style={{ color: 'var(--accent2)' }}>✦</span>
            </h2>
            <p style={{ marginTop: '0.35rem' }}>
              Your voice profile is loaded. Drop an idea and let&apos;s build your script.
            </p>
          </div>

          <div className={`idea-card ${generating ? 'generating' : ''}`}>
            <textarea
              placeholder="What idea do you want to turn into content today? Just think out loud…"
              rows={5}
              value={idea}
              onChange={e => setIdea(e.target.value.slice(0, 1000))}
              disabled={generating}
            />
            <div className="card-footer">
              <span className="char-hint">{idea.length} / 1000</span>
              <button
                className="btn btn-primary"
                onClick={generateScript}
                disabled={generating}
              >
                {generating ? 'Generating…' : '⚡ Generate My Script'}
              </button>
            </div>
          </div>

          {generating && (
            <div className="loading-overlay show">
              <div className="spinner" />
              <div className="loading-text">
                Writing your script<span className="loading-dots" />
              </div>
              <p style={{ fontSize: '0.82rem', maxWidth: '280px', textAlign: 'center' }}>
                Crafting in your voice — hook, body, and call to action.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className={`toast ${toastVisible ? 'show' : ''}`}>{toastMsg}</div>
    </>
  )
}
