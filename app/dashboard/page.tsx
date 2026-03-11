'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const PLATFORMS = ['X', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube'] as const
type Platform = (typeof PLATFORMS)[number]

const SCRIPT_PLATFORMS: Platform[] = ['TikTok', 'YouTube']

const PLATFORM_COLORS: Record<Platform, string> = {
  X: 'bg-white/10 text-white',
  LinkedIn: 'bg-blue-500/20 text-blue-300',
  Instagram: 'bg-pink-500/20 text-pink-300',
  TikTok: 'bg-purple-500/20 text-purple-300',
  YouTube: 'bg-red-500/20 text-red-300',
}

interface PlatformResult {
  platform: Platform
  content: string
}

type NavView = 'generate' | 'history' | 'settings'

export default function DashboardPage() {
  const router = useRouter()

  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [voiceSamples, setVoiceSamples] = useState('')
  const [hasVoice, setHasVoice] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['X'])
  const [results, setResults] = useState<PlatformResult[]>([])
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null)
  const [activeNav, setActiveNav] = useState<NavView>('generate')
  const [history, setHistory] = useState<{ topic: string; results: PlatformResult[]; timestamp: string }[]>([])

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    setUserEmail(user.email ?? '')
    setUserName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'there')

    const { data } = await supabase
      .from('profiles')
      .select('voice_samples')
      .eq('user_id', user.id)
      .single()

    if (!data?.voice_samples) {
      router.push('/onboarding')
      return
    }
    setVoiceSamples(data.voice_samples)
    setHasVoice(true)

    try {
      const stored = localStorage.getItem('kreation_history')
      if (stored) setHistory(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [router])

  useEffect(() => { loadProfile() }, [loadProfile])

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        if (prev.length === 1) return prev
        return prev.filter((p) => p !== platform)
      }
      return [...prev, platform]
    })
  }

  async function handleGenerate() {
    if (!topic.trim() || !hasVoice || selectedPlatforms.length === 0) return
    setError('')
    setResults([])
    setLoading(true)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, voiceSamples, platforms: selectedPlatforms }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      const platformResults: PlatformResult[] = data.results
      setResults(platformResults)

      const entry = { topic, results: platformResults, timestamp: new Date().toISOString() }
      const updated = [entry, ...history].slice(0, 20)
      setHistory(updated)
      localStorage.setItem('kreation_history', JSON.stringify(updated))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy(platform: Platform, content: string) {
    await navigator.clipboard.writeText(content)
    setCopiedPlatform(platform)
    setTimeout(() => setCopiedPlatform(null), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const NAV_ITEMS = [
    { id: 'generate' as NavView, label: 'Generate', icon: '✦' },
    { id: 'history' as NavView, label: 'History', icon: '◷' },
    { id: 'settings' as NavView, label: 'Settings', icon: '⚙' },
  ]

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-white overflow-hidden">

      {/* ── Sidebar (desktop only) ── */}
      <aside className="hidden md:flex w-[240px] flex-shrink-0 bg-[#1a1a1a] flex-col border-r border-white/[0.06]">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <span className="text-lg font-bold tracking-tight">Kreation •))</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                activeNav === item.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <span className="text-base w-4 text-center">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-white/30 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-3 w-full text-xs text-white/25 hover:text-white/50 transition-colors text-left"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f0f0f] border-b border-white/[0.06] flex items-center justify-between px-5 py-4">
        <span className="text-base font-bold tracking-tight">Kreation •))</span>
        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden md:pt-0 pt-[57px] pb-[64px] md:pb-0">

        {/* ── Generate View ── */}
        {activeNav === 'generate' && (
          <div className="flex-1 flex flex-col overflow-y-auto">

            {/* Welcome / idle state */}
            {results.length === 0 && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32">
                <h1 className="text-4xl font-bold mb-3 tracking-tight">
                  Welcome back, {userName} 👋
                </h1>
                <p className="text-white/40 mb-10 text-lg">What do you want to create today?</p>

                {/* Platform toggles */}
                <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-xl">
                  {PLATFORMS.map((platform) => {
                    const selected = selectedPlatforms.includes(platform)
                    return (
                      <button
                        key={platform}
                        onClick={() => togglePlatform(platform)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                          selected
                            ? 'bg-white text-black border-white'
                            : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 border-white/10'
                        }`}
                      >
                        {SCRIPT_PLATFORMS.includes(platform) ? `${platform} · Script` : platform}
                      </button>
                    )
                  })}
                </div>

                {/* Prompt bar */}
                <div className="w-full max-w-xl flex items-center gap-3 bg-[#1a1a1a] border border-white/10 rounded-2xl px-5 py-4 focus-within:border-white/30 transition-colors">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder="What do you want to post about?"
                    className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-white/20"
                    autoFocus
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={!topic.trim() || loading}
                    className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center text-sm font-bold disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/90 transition-colors flex-shrink-0"
                  >
                    ↑
                  </button>
                </div>

                {error && (
                  <p className="mt-4 text-sm text-red-400">{error}</p>
                )}
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="flex gap-2">
                  {selectedPlatforms.map((p, i) => (
                    <span
                      key={p}
                      className="text-sm text-white/40 animate-pulse"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-white/30">Generating in your voice…</p>
              </div>
            )}

            {/* Results feed */}
            {results.length > 0 && !loading && (
              <div className="flex-1 px-4 md:px-8 py-8 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-white/50">Generated for &ldquo;{topic}&rdquo;</h2>
                  <button
                    onClick={() => { setResults([]); setTopic('') }}
                    className="text-xs text-white/30 hover:text-white/60 transition-colors"
                  >
                    ← New
                  </button>
                </div>

                {results.map((r) => (
                  <div
                    key={r.platform}
                    className="bg-[#1a1a1a] border border-white/[0.07] rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLATFORM_COLORS[r.platform as Platform]}`}>
                        {SCRIPT_PLATFORMS.includes(r.platform as Platform) ? `${r.platform} · Script` : r.platform}
                      </span>
                      <span className={`text-xs tabular-nums ${
                        r.platform === 'X' && r.content.length > 280 ? 'text-red-400' : 'text-white/20'
                      }`}>
                        {r.content.length} chars
                        {r.platform === 'X' && r.content.length > 280 && ` · ${r.content.length - 280} over`}
                      </span>
                    </div>

                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-white/80">{r.content}</p>

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleCopy(r.platform as Platform, r.content)}
                        className={`text-xs border px-3 py-1.5 rounded-lg transition-all ${
                          copiedPlatform === r.platform
                            ? 'text-green-400 border-green-400/30 bg-green-400/10'
                            : 'text-white/30 border-white/10 hover:text-white/60 hover:border-white/20'
                        }`}
                      >
                        {copiedPlatform === r.platform ? 'Copied ✓' : 'Copy'}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Bottom prompt bar */}
                <div className="pt-4">
                  <div className="flex items-center gap-3 bg-[#1a1a1a] border border-white/10 rounded-2xl px-5 py-4 focus-within:border-white/30 transition-colors">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                      placeholder="Try another topic…"
                      className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-white/20"
                    />
                    <button
                      onClick={handleGenerate}
                      disabled={!topic.trim() || loading}
                      className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center text-sm font-bold disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/90 transition-colors flex-shrink-0"
                    >
                      ↑
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── History View ── */}
        {activeNav === 'history' && (
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <h2 className="text-xl font-bold mb-6">History</h2>
            {history.length === 0 ? (
              <p className="text-white/30 text-sm">No generations yet.</p>
            ) : (
              <div className="space-y-4">
                {history.map((entry, i) => (
                  <div
                    key={i}
                    onClick={() => { setResults(entry.results); setTopic(entry.topic); setActiveNav('generate') }}
                    className="bg-[#1a1a1a] border border-white/[0.07] rounded-2xl px-5 py-4 cursor-pointer hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium truncate max-w-[70%]">{entry.topic}</p>
                      <span className="text-xs text-white/25">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {entry.results.map((r) => (
                        <span key={r.platform} className={`text-xs px-2 py-0.5 rounded-full ${PLATFORM_COLORS[r.platform as Platform]}`}>
                          {r.platform}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Settings View ── */}
        {activeNav === 'settings' && (
          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8">
            <h2 className="text-xl font-bold mb-6">Settings</h2>
            <div className="space-y-4 max-w-md">
              <div className="bg-[#1a1a1a] border border-white/[0.07] rounded-2xl px-5 py-4">
                <p className="text-sm font-medium mb-1">Voice profile</p>
                <p className="text-xs text-white/30 mb-4">Update the writing samples Kreation uses to match your voice.</p>
                <button
                  onClick={() => router.push('/onboarding')}
                  className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
                >
                  Edit voice →
                </button>
              </div>
              <div className="bg-[#1a1a1a] border border-white/[0.07] rounded-2xl px-5 py-4">
                <p className="text-sm font-medium mb-1">Account</p>
                <p className="text-xs text-white/30 mb-4">{userEmail}</p>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#1a1a1a] border-t border-white/[0.06] flex items-center">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveNav(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs transition-colors ${
              activeNav === item.id ? 'text-white' : 'text-white/30'
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}
