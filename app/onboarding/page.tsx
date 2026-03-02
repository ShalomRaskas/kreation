'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const QUESTIONS = [
  {
    label: 'Question 1 of 5',
    text: 'What do you want to create content about?',
    choices: [
      { emoji: '💼', label: 'Business & Entrepreneurship', value: 'Business and Entrepreneurship' },
      { emoji: '💪', label: 'Fitness & Health', value: 'Fitness and Health' },
      { emoji: '💰', label: 'Finance & Money', value: 'Finance and Money' },
      { emoji: '🌱', label: 'Lifestyle & Personal Growth', value: 'Lifestyle and Personal Growth' },
      { emoji: '🤖', label: 'Tech & AI', value: 'Tech and AI' },
      { emoji: '🏆', label: 'Sports', value: 'Sports' },
      { emoji: '🍳', label: 'Food & Cooking', value: 'Food and Cooking' },
    ],
    placeholder: 'Describe your niche…',
  },
  {
    label: 'Question 2 of 5',
    text: 'How would you describe your personality?',
    choices: [
      { emoji: '⚡', label: 'Energetic & Hype', value: 'Energetic and Hype' },
      { emoji: '🧘', label: 'Calm & Thoughtful', value: 'Calm and Thoughtful' },
      { emoji: '😂', label: 'Funny & Sarcastic', value: 'Funny and Sarcastic' },
      { emoji: '🎯', label: 'Straight to the Point', value: 'Straight to the Point' },
      { emoji: '🔥', label: 'Inspirational & Motivating', value: 'Inspirational and Motivating' },
    ],
    placeholder: 'Describe your personality…',
  },
  {
    label: 'Question 3 of 5',
    text: 'Who is your target audience?',
    choices: [
      { emoji: '🎓', label: 'Young Adults 18–25', value: 'Young Adults 18-25' },
      { emoji: '💼', label: 'Professionals 25–40', value: 'Professionals 25-40' },
      { emoji: '🌍', label: 'General Audience', value: 'General Audience' },
      { emoji: '🌱', label: 'Beginners in my niche', value: 'Beginners in my niche' },
      { emoji: '🏅', label: 'Experts in my niche', value: 'Experts in my niche' },
    ],
    placeholder: 'Describe your audience…',
  },
  {
    label: 'Question 4 of 5',
    text: 'What is your content style?',
    choices: [
      { emoji: '💬', label: 'Casual & Conversational', value: 'Casual and Conversational' },
      { emoji: '📚', label: 'Educational & Informative', value: 'Educational and Informative' },
      { emoji: '📖', label: 'Storytelling', value: 'Storytelling' },
      { emoji: '🚀', label: 'Motivational', value: 'Motivational' },
      { emoji: '🎭', label: 'Entertaining', value: 'Entertaining' },
    ],
    placeholder: 'Describe your style…',
  },
  {
    label: 'Question 5 of 5',
    text: 'What platform are you creating for?',
    choices: [
      { emoji: '▶️', label: 'YouTube', value: 'YouTube' },
      { emoji: '🎵', label: 'TikTok', value: 'TikTok' },
      { emoji: '📸', label: 'Instagram', value: 'Instagram' },
      { emoji: '🎙️', label: 'Podcast', value: 'Podcast' },
      { emoji: '💼', label: 'LinkedIn', value: 'LinkedIn' },
    ],
    placeholder: 'Your platform…',
  },
]

export default function OnboardingPage() {
  const [currentQ, setCurrentQ] = useState(0)
  const [slideKey, setSlideKey] = useState(0) // changing this remounts slide → triggers slideIn
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''))
  const [selected, setSelected] = useState<string>('')
  const [showOther, setShowOther] = useState(false)
  const [otherValue, setOtherValue] = useState('')
  const [saving, setSaving] = useState(false)
  const otherInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Reset per-slide state whenever the question changes
  useEffect(() => {
    setSelected('')
    setShowOther(false)
    setOtherValue('')
  }, [currentQ])

  const advance = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQ] = value
    setAnswers(newAnswers)

    if (currentQ < 4) {
      setSlideKey(k => k + 1)
      setCurrentQ(q => q + 1)
    } else {
      saveProfile(newAnswers)
    }
  }

  const selectChoice = (value: string) => {
    setSelected(value)
    setTimeout(() => advance(value), 380)
  }

  const confirmOther = () => {
    const val = otherValue.trim()
    if (!val) {
      otherInputRef.current?.focus()
      return
    }
    advance(val)
  }

  const saveProfile = async (finalAnswers: string[]) => {
    setSaving(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      niche: finalAnswers[0],
      personality: finalAnswers[1],
      audience: finalAnswers[2],
      style: finalAnswers[3],
      platform: finalAnswers[4],
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error saving profile:', error)
      setSaving(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const q = QUESTIONS[currentQ]
  const progress = (currentQ / 5) * 100

  if (saving) {
    return (
      <div className="page active" style={{ background: 'var(--bg)' }}>
        <div className="spinner" style={{ width: 48, height: 48 }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
          Setting up your profile…
        </p>
      </div>
    )
  }

  return (
    <section className="page active" id="page-onboarding">
      <div className="ob-header">
        <span className="logo" style={{ fontSize: '1.6rem', display: 'block', marginBottom: '1.25rem' }}>
          Kre<span>ation</span>
        </span>
        <h1>Let&apos;s get to know you</h1>
        <p>Five quick taps to build your creative voice profile.</p>
      </div>

      <div className="ob-progress-bar">
        <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="ob-wrap">
        {/* key={slideKey} causes remount → CSS slideIn animation fires on each question */}
        <div key={slideKey} className="ob-slide active">
          <div className="ob-q-label">{q.label}</div>
          <div className="ob-q-text">{q.text}</div>

          <div className="ob-choices">
            {q.choices.map(choice => (
              <button
                key={choice.value}
                className={`ob-choice ${selected === choice.value ? 'selected' : ''}`}
                onClick={() => selectChoice(choice.value)}
              >
                {choice.emoji} {choice.label}
              </button>
            ))}
            <button
              className={`ob-choice other-btn ${showOther ? 'selected' : ''}`}
              onClick={() => {
                setShowOther(true)
                setTimeout(() => otherInputRef.current?.focus(), 50)
              }}
            >
              ✏️ Other — type your own
            </button>
          </div>

          {showOther && (
            <div className="ob-other-input-wrap show">
              <input
                ref={otherInputRef}
                type="text"
                placeholder={q.placeholder}
                maxLength={200}
                value={otherValue}
                onChange={e => setOtherValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmOther()}
              />
              <button className="ob-other-confirm" onClick={confirmOther}>
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
