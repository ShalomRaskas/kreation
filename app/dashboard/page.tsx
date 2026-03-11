'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const PLATFORMS = ['X', 'LinkedIn', 'Instagram', 'TikTok', 'YouTube'] as const
type Platform = (typeof PLATFORMS)[number]

const SCRIPT_PLATFORMS: Platform[] = ['TikTok', 'YouTube']

const PLATFORM_COLORS: Record<Platform, string> = {
  X: 'bg-white/10 text-white/80',
  LinkedIn: 'bg-blue-500/15 text-blue-300',
  Instagram: 'bg-purple-500/15 text-purple-300',
  TikTok: 'bg-pink-500/15 text-pink-300',
  YouTube: 'bg-red-500/15 text-red-300',
}

type CardStatus = 'pending' | 'approved' | 'rejected'

interface ContentCard {
  id: string
  platform: Platform
  content: string
  timestamp: number
  status: CardStatus
}

interface HistoryEntry {
  id: string
  topic: string
  timestamp: number
  cards: ContentCard[]
}

const HISTORY_KEY = 'kreation_history'
const MAX_HISTORY = 20

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)))
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DashboardPage() {
  const router = useRouter()

  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [voiceSamples, setVoiceSamples] = useState('')
  const [hasVoice, setHasVoice] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['X'])
  const [queue, setQueue] = useState<ContentCard[]>([])
  const [currentTopic, setCurrentTopic] = useState('')
  const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null)
  const [copiedCard, setCopiedCard] = useState<string | null>(null)

  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)

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
    } else {
      // No voice samples yet — send new users through onboarding
      router.push('/onboarding')
    }
  }, [router])

  useEffect(() => {
    loadProfile()
    setHistory(loadHistory())
  }, [loadProfile])

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
    setQueue([])
    setCurrentEntryId(null)
    setLoading(true)

    const ts = Date.now()

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, voiceSamples, platforms: selectedPlatforms }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      const cards: ContentCard[] = data.results.map(
        (r: { platform: Platform; content: string }) => ({
          id: crypto.randomUUID(),
          platform: r.platform,
          content: r.content,
          timestamp: ts,
          status: 'pending' as CardStatus,
        })
      )

      setQueue(cards)
      setCurrentTopic(topic)
      setCurrentTimestamp(ts)

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        topic,
        timestamp: ts,
        cards,
      }
      setCurrentEntryId(entry.id)
      setHistory((prev) => {
        const updated = [entry, ...prev]
        saveHistory(updated)
        return updated
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function updateCard(id: string, patch: Partial<Pick<ContentCard, 'content' | 'status'>>) {
    setQueue((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    if (currentEntryId) {
      setHistory((prev) => {
        const updated = prev.map((entry) =>
          entry.id === currentEntryId
            ? { ...entry, cards: entry.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) }
            : entry
        )
        saveHistory(updated)
        return updated
      })
    }
  }

  async function handleCopy(card: ContentCard) {
    await navigator.clipboard.writeText(card.content)
    setCopiedCard(card.id)
    setTimeout(() => setCopiedCard(null), 2000)
  }

  function handleRestoreHistory(entry: HistoryEntry) {
    setQueue(entry.cards)
    setCurrentTopic(entry.topic)
    setCurrentTimestamp(entry.timestamp)
    setTopic(entry.topic)
    setCurrentEntryId(entry.id)
    setShowHistory(false)
  }

  function handleDeleteHistory(id: string) {
    setHistory((prev) => {
      const updated = prev.filter((e) => e.id !== id)
      saveHistory(updated)
      return updated
    })
    if (currentEntryId === id) {
      setQueue([])
      setCurrentEntryId(null)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const approvedCount = queue.filter((c) => c.status === 'approved').length
  const rejectedCount = queue.filter((c) => c.status === 'rejected').length

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

      <div className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">

          {/* Header */}
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

            {queue.length > 0 && !loading && (
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
              <p className="text-sm text-white/30">
                Generating for {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}…
              </p>
            </div>
          )}

          {/* Content queue */}
          {queue.length > 0 && !loading && (
            <div className="space-y-4">
              {/* Queue header */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-white/80">{currentTopic}</p>
                  <p className="text-xs text-white/30">
                    {currentTimestamp && formatTime(currentTimestamp)}
                    {queue.length > 1 && ` · ${queue.length} drafts`}
                    {approvedCount > 0 && ` · ${approvedCount} approved`}
                    {rejectedCount > 0 && ` · ${rejectedCount} rejected`}
                  </p>
                </div>
                {queue.length > 1 && approvedCount === queue.length && (
                  <span className="text-xs bg-green-500/15 border border-green-500/25 text-green-300 px-3 py-1 rounded-full">
                    All approved
                  </span>
                )}
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {queue.map((card) => (
                  <div
                    key={card.id}
                    className={`border rounded-xl overflow-hidden transition-all ${
                      card.status === 'approved'
                        ? 'border-green-500/30 bg-green-500/5'
                        : card.status === 'rejected'
                        ? 'border-white/5 bg-white/2 opacity-50'
                        : 'border-white/10 bg-white/[0.03]'
                    }`}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${PLATFORM_COLORS[card.platform]}`}>
                          {card.platform}
                        </span>
                        {SCRIPT_PLATFORMS.includes(card.platform) && (
                          <span className="text-xs text-white/20">Script</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {card.status === 'approved' && (
                          <span className="text-xs text-green-400 font-medium">✓ Approved</span>
                        )}
                        {card.status === 'rejected' && (
                          <span className="text-xs text-white/30">Rejected</span>
                        )}
                        <span className="text-xs text-white/20">{formatTime(card.timestamp)}</span>
                      </div>
                    </div>

                    {/* Editable content */}
                    <div className="px-4 pt-3 pb-2">
                      <textarea
                        value={card.content}
                        onChange={(e) => updateCard(card.id, { content: e.target.value })}
                        disabled={card.status === 'rejected'}
                        rows={
                          card.platform === 'YouTube' ? 18
                          : card.platform === 'TikTok' ? 10
                          : card.platform === 'X' ? 3
                          : 5
                        }
                        className="w-full bg-transparent text-sm leading-relaxed text-white/80 resize-y focus:outline-none placeholder:text-white/20 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Card footer */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5">
                      <span
                        className={`text-xs tabular-nums ${
                          card.platform === 'X' && card.content.length > 280
                            ? 'text-red-400 font-semibold'
                            : 'text-white/25'
                        }`}
                      >
                        {card.content.length} chars
                        {card.platform === 'X' && card.content.length > 280 && (
                          <span className="ml-1">· {card.content.length - 280} over</span>
                        )}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Copy */}
                        <button
                          onClick={() => handleCopy(card)}
                          disabled={card.status === 'rejected'}
                          className={`text-xs border px-2.5 py-1 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                            copiedCard === card.id
                              ? 'text-green-400 border-green-400/30 bg-green-400/10'
                              : 'text-white/40 border-white/10 hover:text-white/70'
                          }`}
                        >
                          {copiedCard === card.id ? '✓ Copied' : 'Copy'}
                        </button>

                        {/* Reject */}
                        <button
                          onClick={() =>
                            updateCard(card.id, {
                              status: card.status === 'rejected' ? 'pending' : 'rejected',
                            })
                          }
                          className={`text-xs border px-2.5 py-1 rounded-md transition-all ${
                            card.status === 'rejected'
                              ? 'text-white/50 border-white/20 bg-white/5'
                              : 'text-white/30 border-white/10 hover:text-red-400 hover:border-red-400/30'
                          }`}
                        >
                          {card.status === 'rejected' ? 'Undo' : 'Reject'}
                        </button>

                        {/* Approve */}
                        <button
                          onClick={() =>
                            updateCard(card.id, {
                              status: card.status === 'approved' ? 'pending' : 'approved',
                            })
                          }
                          disabled={card.status === 'rejected'}
                          className={`text-xs border px-2.5 py-1 rounded-md transition-all font-medium disabled:opacity-30 disabled:cursor-not-allowed ${
                            card.status === 'approved'
                              ? 'text-green-400 border-green-500/40 bg-green-500/10'
                              : 'text-white/60 border-white/20 hover:text-white hover:border-white/40 bg-white/5'
                          }`}
                        >
                          {card.status === 'approved' ? '✓ Approved' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <div className="border-t border-white/10 pt-6 space-y-3">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center justify-between w-full text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>Content history</span>
                {history.length > 0 && (
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{history.length}</span>
                )}
              </span>
              <span className="text-xs">{showHistory ? '↑ Hide' : '↓ Show'}</span>
            </button>

            {showHistory && (
              <div className="space-y-2">
                {history.length === 0 ? (
                  <p className="text-xs text-white/30 py-4 text-center">
                    No history yet. Generate your first post above.
                  </p>
                ) : (
                  history.map((entry) => {
                    const approved = entry.cards.filter((c) => c.status === 'approved').length
                    const total = entry.cards.length
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-start justify-between gap-3 border rounded-lg px-4 py-3 group transition-colors ${
                          entry.id === currentEntryId
                            ? 'border-white/20 bg-white/5'
                            : 'border-white/8 bg-white/[0.02] hover:border-white/15'
                        }`}
                      >
                        <button
                          onClick={() => handleRestoreHistory(entry)}
                          className="flex-1 text-left space-y-1.5 min-w-0"
                        >
                          <p className="text-sm text-white/70 truncate group-hover:text-white/90 transition-colors">
                            {entry.topic}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {entry.cards.map((c) => (
                              <span
                                key={c.id}
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  c.status === 'approved'
                                    ? 'bg-green-500/15 text-green-400'
                                    : c.status === 'rejected'
                                    ? 'bg-white/5 text-white/20 line-through'
                                    : 'bg-white/10 text-white/40'
                                }`}
                              >
                                {c.platform}
                              </span>
                            ))}
                            <span className="text-xs text-white/20">{formatTime(entry.timestamp)}</span>
                            {approved > 0 && (
                              <span className="text-xs text-green-400/70">
                                {approved}/{total} approved
                              </span>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteHistory(entry.id)}
                          className="text-white/15 hover:text-red-400 transition-colors text-xs shrink-0 pt-0.5"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
