'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const QUESTIONS = [
  {
    id: 'what_you_do',
    label: 'Describe what you do — like you\'re texting a friend, not writing a bio.',
  },
  {
    id: 'hot_take',
    label: 'What\'s a hot take you have that most people in your space would disagree with?',
  },
  {
    id: 'recent_reaction',
    label: 'What\'s something that genuinely excited or pissed you off recently?',
  },
  {
    id: 'vibe',
    label: 'How would you describe your vibe in 5 words or less?',
  },
  {
    id: 'unposted_thought',
    label: 'Write something you\'ve been thinking about but haven\'t posted yet.',
  },
]

const Q_LABELS = [
  'Describe what you do like texting a friend',
  'Hot take',
  'Something that excited or pissed you off recently',
  'Your vibe in 5 words or less',
  'Something you\'ve been thinking about but haven\'t posted yet',
]

type Tab = 'qa' | 'past'

export default function OnboardingPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('qa')
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', ''])
  const [pastWriting, setPastWriting] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const answeredCount = answers.filter(a => a.trim().length > 0).length
  const hasPastWriting = pastWriting.trim().length > 0
  const isReady = answeredCount >= 3 || hasPastWriting

  function setAnswer(index: number, value: string) {
    setAnswers(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function buildVoiceSamples(): string {
    const parts: string[] = []

    // Q&A answers
    const qaParts = QUESTIONS.map((q, i) => {
      const answer = answers[i].trim()
      if (!answer) return null
      return `Q: ${Q_LABELS[i]}\nA: ${answer}`
    }).filter(Boolean) as string[]

    if (qaParts.length > 0) {
      parts.push(qaParts.join('\n\n'))
    }

    // Past writing
    if (pastWriting.trim()) {
      parts.push(`--- Past writing samples ---\n${pastWriting.trim()}`)
    }

    return parts.join('\n\n')
  }

  async function handleSave() {
    if (!isReady) return
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const voice_samples = buildVoiceSamples()

      const { error } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, voice_samples }, { onConflict: 'user_id' })

      if (error) throw error
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-10">
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-widest text-white/30">Voice Setup</div>
          <h1 className="text-3xl font-bold">Teach Kreation your voice</h1>
          <p className="text-white/50 leading-relaxed">
            Answer questions in your own words, paste past writing, or both. The more you give it,
            the more it sounds like you.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 border-b border-white/10">
          <button
            onClick={() => setTab('qa')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors rounded-t-lg -mb-px ${
              tab === 'qa'
                ? 'bg-white/10 text-white border border-white/10 border-b-transparent'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Q&amp;A
          </button>
          <button
            onClick={() => setTab('past')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors rounded-t-lg -mb-px ${
              tab === 'past'
                ? 'bg-white/10 text-white border border-white/10 border-b-transparent'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Past Writing
          </button>
        </div>

        {/* Q&A Tab */}
        {tab === 'qa' && (
          <div className="space-y-8">
            {QUESTIONS.map((q, i) => (
              <div key={q.id} className="space-y-3">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-widest text-white/30">
                    Question {i + 1}
                  </span>
                  <p className="text-sm font-medium text-white/80">{q.label}</p>
                </div>
                <textarea
                  value={answers[i]}
                  onChange={e => setAnswer(i, e.target.value)}
                  placeholder="Just write how you'd actually say it..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm leading-relaxed focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20 resize-none"
                />
              </div>
            ))}
            <p className="text-xs text-white/30">
              Answer at least 3 to continue · {answeredCount}/5 answered
            </p>
          </div>
        )}

        {/* Past Writing Tab */}
        {tab === 'past' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-white/80">
                Paste your past posts, tweets, essays, captions, or anything you&apos;ve written.
              </p>
              <p className="text-xs text-white/30">
                Separate different pieces with a blank line. The more variety, the better.
              </p>
            </div>
            <textarea
              value={pastWriting}
              onChange={e => setPastWriting(e.target.value)}
              placeholder={`Paste your old posts here...\n\nFor example:\n"Just shipped something that took 3 weeks. Feels impossible until it isn't."\n\n"Hot take: consistency is overrated. Intensity beats it every time."`}
              rows={16}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm leading-relaxed focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20 resize-none"
            />
            {hasPastWriting && (
              <p className="text-xs text-white/30">
                {pastWriting.trim().split('\n').filter(l => l.trim()).length} lines of writing captured
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!isReady && (
            <p className="text-xs text-white/30 text-center">
              Answer at least 3 questions or paste some past writing to continue
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={!isReady || loading}
            className="w-full bg-white text-black rounded-lg py-3 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving…' : 'Save & Continue →'}
          </button>
        </div>

        <p className="text-xs text-white/30 text-center">
          You can update your voice samples anytime from the dashboard.
        </p>
      </div>
    </main>
  )
}
