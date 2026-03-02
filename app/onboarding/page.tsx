'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  {
    step: 1,
    heading: "Talk to me like you're texting a friend",
    subtext:
      "Tell me who you are, what you do, and what you care about. Don't try to sound professional.",
    field: 'intro' as const,
    minChars: 50,
    placeholder: "Hey, I'm...",
  },
  {
    step: 2,
    heading: 'Show me how you actually write',
    subtext:
      "Paste 3–5 tweets, captions, or anything you've written that felt like you. No examples yet? Just write a few sentences about something you're passionate about.",
    field: 'writing_samples' as const,
    minChars: 100,
    placeholder: "Here are some things I've written...",
  },
  {
    step: 3,
    heading: 'What do you want to create content about?',
    subtext: 'Just say it naturally. One sentence is fine.',
    field: 'content_topic' as const,
    minChars: 20,
    placeholder: 'I want to talk about...',
  },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [values, setValues] = useState({ intro: '', writing_samples: '', content_topic: '' })
  const [platform, setPlatform] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const step = STEPS[currentStep]
  const currentValue = values[step.field]
  const meetsMin = currentValue.length >= step.minChars
  const isLast = currentStep === STEPS.length - 1

  const handleChange = (val: string) => {
    setValues(prev => ({ ...prev, [step.field]: val }))
  }

  const handleContinue = async () => {
    if (!meetsMin) return
    if (!isLast) {
      setCurrentStep(s => s + 1)
    } else {
      await saveProfile()
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      intro: values.intro,
      writing_samples: values.writing_samples,
      content_topic: values.content_topic,
      platform: platform.trim(),
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

  if (saving) {
    return (
      <div className="page active" style={{ background: 'var(--bg)' }}>
        <div className="spinner" style={{ width: 48, height: 48 }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Setting up your profile…</p>
      </div>
    )
  }

  const progressPct = ((currentStep + 1) / STEPS.length) * 100

  return (
    <section className="page active" id="page-onboarding">
      <div className="ob-header">
        <span className="logo" style={{ fontSize: '1.6rem', display: 'block', marginBottom: '1.25rem' }}>
          Kre<span>ation</span>
        </span>
        <h1>Let&apos;s get to know you</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </div>

      {/* Progress bar */}
      <div className="ob-progress-bar">
        <div className="ob-progress-fill" style={{ width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
      </div>

      <div className="ob-wrap">
        <div className="ob-slide active">
          <div className="ob-q-text" style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
            {step.heading}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            {step.subtext}
          </p>

          <textarea
            value={currentValue}
            onChange={e => handleChange(e.target.value)}
            placeholder={step.placeholder}
            rows={7}
            style={{
              width: '100%',
              background: 'var(--card-bg, rgba(255,255,255,0.05))',
              border: '1px solid var(--border, rgba(255,255,255,0.12))',
              borderRadius: '12px',
              color: 'var(--text, #fff)',
              padding: '1rem',
              fontSize: '1rem',
              resize: 'vertical',
              lineHeight: 1.6,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />

          {/* Live character counter */}
          <p style={{
            textAlign: 'right',
            fontSize: '0.8rem',
            marginTop: '0.4rem',
            color: meetsMin ? 'var(--accent, #a78bfa)' : 'var(--text-muted)',
          }}>
            {currentValue.length} / {step.minChars} characters
            {meetsMin && ' ✓'}
          </p>

          {/* Platform input — only on last step */}
          {isLast && (
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                What platform are you mainly posting on? (e.g. YouTube, TikTok, Instagram)
              </label>
              <input
                type="text"
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                placeholder="YouTube"
                style={{
                  width: '100%',
                  background: 'var(--card-bg, rgba(255,255,255,0.05))',
                  border: '1px solid var(--border, rgba(255,255,255,0.12))',
                  borderRadius: '8px',
                  color: 'var(--text, #fff)',
                  padding: '0.6rem 1rem',
                  fontSize: '0.95rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          <button
            onClick={handleContinue}
            disabled={!meetsMin}
            style={{
              marginTop: '1.5rem',
              width: '100%',
              padding: '0.85rem',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: meetsMin ? 'pointer' : 'not-allowed',
              background: meetsMin
                ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
                : 'rgba(255,255,255,0.08)',
              color: meetsMin ? '#fff' : 'var(--text-muted)',
              border: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {isLast ? 'Finish →' : 'Continue →'}
          </button>
        </div>
      </div>
    </section>
  )
}
