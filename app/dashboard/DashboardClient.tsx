'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Profile, Script } from '@/types'
import Link from 'next/link'

export default function DashboardClient({ profile, scripts }: { profile: Profile; scripts: Script[] }) {
  const router = useRouter()
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    if (!idea.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, profileId: profile.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      router.push(`/script/${data.scriptId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const profileFields = [
    { label: 'Topic', value: profile.content_topic },
    { label: 'Personality', value: profile.personality },
    { label: 'Audience', value: profile.target_audience },
    { label: 'Style', value: profile.content_style },
    { label: 'Platform', value: profile.platform },
  ]

  return (
    <main
      className="min-h-screen flex flex-col items-center"
      style={{
        background: 'radial-gradient(ellipse 60% 40% at 80% 20%, rgba(61,53,181,0.1) 0%, transparent 60%), radial-gradient(ellipse 50% 35% at 10% 80%, rgba(108,92,231,0.07) 0%, transparent 60%), #0A0A0F',
      }}
    >
      {/* Nav */}
      <nav className="w-full max-w-3xl flex items-center justify-between px-5 pt-6 pb-0">
        <span className="text-xl font-extrabold tracking-tight" style={{
          background: 'linear-gradient(135deg, #8B7CF8, #3D35B5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Kre<span style={{ WebkitTextFillColor: 'white' }}>ation</span>
        </span>
        <button
          onClick={signOut}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Sign out
        </button>
      </nav>

      <div className="w-full max-w-3xl px-5 py-8 flex flex-col gap-8">

        {/* Voice Profile Card */}
        <div className="rounded-2xl p-6" style={{ background: '#12121A', border: '1px solid #2A2A3E' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold">Your Voice Profile</h2>
              <p className="text-sm text-gray-500">Used to generate all your scripts</p>
            </div>
            <Link
              href="/onboarding"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:-translate-y-0.5"
              style={{ background: '#1A1A2E', border: '1px solid #2A2A3E', color: '#8B7CF8' }}
            >
              Edit Profile
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {profileFields.map(f => (
              <div key={f.label} className="rounded-xl p-3" style={{ background: '#1A1A2E', border: '1px solid #2A2A3E' }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#6C5CE7' }}>{f.label}</div>
                <div className="text-sm font-medium text-white">{f.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Script History */}
        {scripts.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">Recent Scripts</h2>
            <div className="flex flex-col gap-3">
              {scripts.slice(0, 3).map(s => (
                <Link
                  key={s.id}
                  href={`/script/${s.id}`}
                  className="flex items-center justify-between p-4 rounded-2xl transition-all hover:-translate-y-0.5 group"
                  style={{ background: '#12121A', border: '1px solid #2A2A3E' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{s.topic}</div>
                    <div className="text-xs text-gray-600 mt-0.5 truncate">{s.hook.slice(0, 80)}…</div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span className="text-xs text-gray-600">{formatDate(s.created_at)}</span>
                    <span className="text-gray-600 group-hover:text-accent2 transition-colors">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Idea Input */}
        <div>
          <h2 className="text-lg font-bold mb-4">Generate a New Script</h2>
          <div
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: '#12121A', border: '1.5px solid #2A2A3E' }}
          >
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value.slice(0, 1000))}
              placeholder="What idea do you want to turn into content today? Just think out loud…"
              rows={5}
              className="w-full bg-transparent text-white text-base outline-none resize-none leading-relaxed placeholder-gray-600"
            />
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-gray-600">{idea.length} / 1000</span>
              {error && <span className="text-red-400 text-xs">{error}</span>}
              <button
                onClick={generate}
                disabled={loading || !idea.trim()}
                className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #3D35B5, #6C5CE7)', boxShadow: '0 4px 20px rgba(108,92,231,0.35)' }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                    Generating…
                  </>
                ) : '⚡ Generate My Script'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
