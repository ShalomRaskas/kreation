'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const PLATFORMS = ['X', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube'] as const
type Platform = (typeof PLATFORMS)[number]

const SCRIPT_PLATFORMS: Platform[] = ['TikTok', 'YouTube']
const PLATFORM_LABELS: Record<Platform, string> = {
  X: 'X',
  LinkedIn: 'LinkedIn',
  Instagram: 'Instagram',
  TikTok: 'TikTok · Script',
  YouTube: 'YouTube · Script',
}

interface PlatformResult {
  platform: Platform
  content: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [voiceSamples, setVoiceSamples] = useState('')
  const [hasVoice, setHasVoice] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['X'])
  const [results, setResults] = useState<PlatformResult[]>([])
  const [activeTab, setActiveTab] = useState<Platform | null>(null)
  const [copiedPlatform, setCopiedPlatform] = useState<Platform | null>(null)

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUserEmail(user.email ?? '')

    const { data } = await supabase
      .from('profiles')
      .select('voice_samples')
      .eq('user_id', user.id)
      .single()

    if (data?.voice_samples) {
      setVoiceSamples(data.voice_samples)
      setHasVoice(true)
    }
  }, [supabase, router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  function togglePlatform(platform: Platform) {
    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        // Don't allow deselecting the last one
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
    setActiveTab(null)
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
      if (platformResults.length > 0) {
        setActiveTab(platformResults[0].platform as Platform)
      }
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

  const activeResult = results.find((r) => r.platform === activeTab)

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <span className="text-lg font-bold tracking-tight">Kreation</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/30 hidden sm:block">{userEmail}</span>
          <button
            onClick={() => router.push('/onboarding')}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Edit voice
          </button>
          <button
            onClick={handleSignOut}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-2xl space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Generate content</h1>
            <p className="text-sm text-white/50">
              {hasVoice
                ? 'Your voice is loaded. Pick platforms and generate.'
                : 'No voice samples found.'}
            </p>
          </div>

          {/* No voice warning */}
          {!hasVoice && (
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-5 py-4 text-sm text-yellow-300">
              You haven&apos;t set up your voice yet.{' '}
              <button
                onClick={() => router.push('/onboarding')}
                className="underline hover:no-underline"
              >
                Complete onboarding →
              </button>
            </div>
          )}

          {/* Topic input */}
          <div className="space-y-3">
            <label className="text-sm text-white/60">What do you want to post about?</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. why consistency beats motivation"
              disabled={!hasVoice}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20 disabled:opacity-40"
            />
          </div>

          {/* Platform toggles */}
          <div className="space-y-3">
            <label className="text-sm text-white/60">Select platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => {
                const selected = selectedPlatforms.includes(platform)
                return (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    disabled={!hasVoice}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      selected
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 border border-white/10'
                    }`}
                  >
                    {SCRIPT_PLATFORMS.includes(platform) ? `${platform} · Script` : platform}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Generate button */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={!topic.trim() || !hasVoice || loading || selectedPlatforms.length === 0}
              className="bg-white text-black px-6 py-3 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  Generating…
                </span>
              ) : (
                'Generate'
              )}
            </button>

            {results.length > 0 && !loading && (
              <button
                onClick={handleGenerate}
                className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
              >
                <span className="text-base">↺</span> Regenerate
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-8 flex flex-col items-center gap-3">
              <div className="flex gap-1.5">
                {selectedPlatforms.map((p, i) => (
                  <span
                    key={p}
                    className="text-xs text-white/40 animate-pulse"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    {p}
                  </span>
                ))}
              </div>
              <p className="text-sm text-white/30">Generating for {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}…</p>
            </div>
          )}

          {/* Results tabs */}
          {results.length > 0 && !loading && (
            <div className="space-y-4">
              {/* Tab bar */}
              <div className="flex gap-1 border-b border-white/10 pb-0">
                {results.map((r) => (
                  <button
                    key={r.platform}
                    onClick={() => setActiveTab(r.platform as Platform)}
                    className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg -mb-px ${
                      activeTab === r.platform
                        ? 'bg-white/10 text-white border border-white/10 border-b-transparent'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {PLATFORM_LABELS[r.platform as Platform]}
                  </button>
                ))}
              </div>

              {/* Active tab content */}
              {activeResult && (
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap">
                    {activeResult.content}
                  </div>

                  {/* Footer row: char count + copy */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs tabular-nums ${
                        activeResult.platform === 'X' && activeResult.content.length > 280
                          ? 'text-red-400 font-semibold'
                          : 'text-white/30'
                      }`}
                    >
                      {activeResult.content.length} characters
                      {activeResult.platform === 'X' && activeResult.content.length > 280 && (
                        <span className="ml-1">· {activeResult.content.length - 280} over limit</span>
                      )}
                    </span>

                    <button
                      onClick={() => handleCopy(activeResult.platform as Platform, activeResult.content)}
                      className={`text-xs border px-3 py-1 rounded-md transition-all ${
                        copiedPlatform === activeResult.platform
                          ? 'text-green-400 border-green-400/30 bg-green-400/10'
                          : 'text-white/40 border-white/10 hover:text-white/70'
                      }`}
                    >
                      {copiedPlatform === activeResult.platform ? 'Copied! ✓' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
