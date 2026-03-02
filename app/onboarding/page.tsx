'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const QUESTIONS = [
  {
    label: 'What do you want to create content about?',
    options: ['Business and Entrepreneurship','Fitness and Health','Finance and Money','Lifestyle and Personal Growth','Tech and AI','Sports','Food and Cooking'],
    placeholder: 'Describe your niche…',
  },
  {
    label: 'How would you describe your personality?',
    options: ['Energetic and Hype','Calm and Thoughtful','Funny and Sarcastic','Straight to the Point','Inspirational and Motivating'],
    placeholder: 'Describe your personality…',
  },
  {
    label: 'Who is your target audience?',
    options: ['Young Adults 18-25','Professionals 25-40','General Audience','Beginners in my niche','Experts in my niche'],
    placeholder: 'Describe your audience…',
  },
  {
    label: 'What is your content style?',
    options: ['Casual and Conversational','Educational and Informative','Storytelling','Motivational','Entertaining'],
    placeholder: 'Describe your style…',
  },
  {
    label: 'What platform are you creating for?',
    options: ['YouTube','TikTok','Instagram','Podcast','LinkedIn'],
    placeholder: 'Your platform…',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<string[]>(Array(5).fill(''))
  const [otherMode, setOtherMode] = useState(false)
  const [otherText, setOtherText] = useState('')
  const [animating, setAnimating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth')
    })
  }, [router])

  function selectChoice(value: string) {
    const newAnswers = [...answers]
    newAnswers[currentQ] = value
    setAnswers(newAnswers)
    advance(newAnswers)
  }

  function showOther() {
    setOtherMode(true)
    setOtherText('')
  }

  function confirmOther() {
    if (!otherText.trim()) return
    const newAnswers = [...answers]
    newAnswers[currentQ] = otherText.trim()
    setAnswers(newAnswers)
    setOtherMode(false)
    advance(newAnswers)
  }

  function advance(newAnswers: string[]) {
    setAnimating(true)
    setTimeout(async () => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(q => q + 1)
        setOtherMode(false)
        setOtherText('')
        setAnimating(false)
      } else {
        // Save to Supabase
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('profiles').upsert({
            id: user.id,
            name: user.email?.split('@')[0] || 'Creator',
            content_topic: newAnswers[0],
            personality: newAnswers[1],
            target_audience: newAnswers[2],
            content_style: newAnswers[3],
            platform: newAnswers[4],
          })
        }
        router.push('/dashboard')
      }
    }, 320)
  }

  const progress = ((currentQ) / QUESTIONS.length) * 100
  const q = QUESTIONS[currentQ]

  if (saving) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4" style={{ background: '#0A0A0F' }}>
        <div className="spinner" />
        <p className="text-gray-400">Building your voice profile…</p>
      </div>
    )
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center px-5 pt-12 pb-12"
      style={{ background: 'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(61,53,181,0.22) 0%, transparent 70%), #0A0A0F' }}
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <span className="text-2xl font-extrabold tracking-tight" style={{
          background: 'linear-gradient(135deg, #8B7CF8, #3D35B5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Kre<span style={{ WebkitTextFillColor: 'white' }}>ation</span>
        </span>
        <h1 className="text-2xl font-bold mt-3" style={{
          background: 'linear-gradient(135deg, #fff 30%, #8B7CF8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Let&apos;s get to know you
        </h1>
        <p className="text-gray-500 text-sm mt-1">Five quick taps to build your voice profile.</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg h-1 rounded-full mb-10 overflow-hidden" style={{ background: '#2A2A3E' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #3D35B5, #8B7CF8)' }}
        />
      </div>

      {/* Question */}
      <div
        className={`w-full max-w-lg flex flex-col gap-5 ${animating ? 'animate-slide-out' : 'animate-slide-in'}`}
        key={currentQ}
      >
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8B7CF8' }}>
          Question {currentQ + 1} of {QUESTIONS.length}
        </div>
        <div className="text-2xl font-bold leading-snug">{q.label}</div>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map(opt => (
            <button
              key={opt}
              onClick={() => selectChoice(opt)}
              className="p-4 rounded-2xl text-left text-sm font-medium transition-all hover:-translate-y-0.5"
              style={{ background: '#12121A', border: '1.5px solid #2A2A3E', color: '#9A9AB0' }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.borderColor = '#6C5CE7'
                ;(e.target as HTMLElement).style.color = 'white'
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.borderColor = '#2A2A3E'
                ;(e.target as HTMLElement).style.color = '#9A9AB0'
              }}
            >
              {opt}
            </button>
          ))}

          {/* Other button — spans full width */}
          {!otherMode && (
            <button
              onClick={showOther}
              className="col-span-2 p-4 rounded-2xl text-left text-sm font-medium transition-all hover:-translate-y-0.5"
              style={{ background: '#12121A', border: '1.5px solid #2A2A3E', color: '#9A9AB0' }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.borderColor = '#6C5CE7'
                ;(e.target as HTMLElement).style.color = 'white'
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.borderColor = '#2A2A3E'
                ;(e.target as HTMLElement).style.color = '#9A9AB0'
              }}
            >
              ✏️ Other — type your own
            </button>
          )}

          {otherMode && (
            <div className="col-span-2 flex gap-3 animate-fade-up">
              <input
                autoFocus
                type="text"
                value={otherText}
                onChange={e => setOtherText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmOther()}
                placeholder={q.placeholder}
                maxLength={200}
                className="flex-1 px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: '#1A1A2E', border: '1.5px solid #6C5CE7' }}
              />
              <button
                onClick={confirmOther}
                className="px-5 py-3 rounded-xl font-bold text-white text-sm transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #3D35B5, #6C5CE7)' }}
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
