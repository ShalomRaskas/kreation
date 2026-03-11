'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const STEPS = [
  {
    id: 'what_you_do',
    question: 'What do you do?',
    subtitle: 'Describe it like you\'re texting a friend, not writing a LinkedIn bio.',
    placeholder: 'e.g. "I\'m building an AI tool that writes social content in your voice. 19, solo founder, figuring it out as I go."',
    example: 'Keep it real. No buzzwords.',
    minLength: 20,
  },
  {
    id: 'hot_take',
    question: 'What\'s your hot take?',
    subtitle: 'Something you believe that most people in your space would push back on.',
    placeholder: 'e.g. "Consistency is overrated. One viral post beats 30 mediocre ones every time."',
    example: 'The more controversial the better. This is what makes your content stand out.',
    minLength: 15,
  },
  {
    id: 'recent_reaction',
    question: 'What\'s got you fired up lately?',
    subtitle: 'Something that genuinely excited or pissed you off recently.',
    placeholder: 'e.g. "Watched a founder with a worse product than mine raise $2M because they had the right connections. Fuel."',
    example: 'Raw emotion = authentic content.',
    minLength: 15,
  },
  {
    id: 'vibe',
    question: 'Your vibe in 5 words or less.',
    subtitle: 'How would someone describe the energy you bring?',
    placeholder: 'e.g. "Direct. Builder. No fluff."',
    example: 'Don\'t overthink this one.',
    minLength: 3,
  },
  {
    id: 'unposted_thought',
    question: 'What haven\'t you posted yet?',
    subtitle: 'Something rattling around in your head that you\'ve been sitting on.',
    placeholder: 'e.g. "I think most \'build in public\' content is actually performance, not transparency. Real building is messy and nobody posts the ugly parts."',
    example: 'This is usually the best content. Just say it.',
    minLength: 20,
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>(['', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [skipped, setSkipped] = useState<boolean[]>([false, false, false, false, false])

  const step = STEPS[currentStep]
  const answer = answers[currentStep]
  const isLastStep = currentStep === STEPS.length - 1
  const answeredCount = answers.filter((a, i) => a.trim().length > 0 && !skipped[i]).length
  const canProceed = answer.trim().length >= step.minLength || skipped[currentStep]
  const progress = ((currentStep) / STEPS.length) * 100

  function setAnswer(value: string) {
    setAnswers(prev => {
      const next = [...prev]
      next[currentStep] = value
      return next
    })
    // Un-skip if they start typing
    if (skipped[currentStep]) {
      setSkipped(prev => { const n = [...prev]; n[currentStep] = false; return n })
    }
  }

  function handleSkip() {
    setSkipped(prev => { const n = [...prev]; n[currentStep] = true; return n })
    if (!isLastStep) setCurrentStep(s => s + 1)
    else handleSave(true)
  }

  function handleNext() {
    if (!canProceed) return
    if (!isLastStep) {
      setCurrentStep(s => s + 1)
    } else {
      handleSave(false)
    }
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep(s => s - 1)
  }

  function buildVoiceSamples(): string {
    return STEPS.map((s, i) => {
      const a = answers[i].trim()
      if (!a || skipped[i]) return null
      return `Q: ${s.question}\nA: ${a}`
    }).filter(Boolean).join('\n\n')
  }

  async function handleSave(fromSkip = false) {
    const validAnswers = answers.filter((a, i) => a.trim().length > 0 && !skipped[i])
    if (validAnswers.length < 2 && !fromSkip) {
      setError('Answer at least 2 questions before continuing.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const voice_samples = buildVoiceSamples()
      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({ user_id: user.id, voice_samples }, { onConflict: 'user_id' })

      if (dbError) throw dbError
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
        <span className="text-base font-bold tracking-tight">Kreation •))</span>
        <span className="text-xs text-white/25">{currentStep + 1} of {STEPS.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-[2px] bg-white/[0.06]">
        <div
          className="h-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${progress + (1 / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">

          {/* Step indicator */}
          <div className="flex gap-1.5 mb-8">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i < currentStep ? 'bg-white' :
                  i === currentStep ? 'bg-white/60' :
                  'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Question */}
          <div className="mb-8">
            <p className="text-xs uppercase tracking-widest text-white/25 mb-3">
              Voice calibration · {currentStep + 1}/{STEPS.length}
            </p>
            <h2 className="text-3xl font-bold mb-3 leading-tight">{step.question}</h2>
            <p className="text-white/40 text-sm leading-relaxed">{step.subtitle}</p>
          </div>

          {/* Input */}
          <textarea
            key={currentStep}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.metaKey && canProceed) handleNext()
            }}
            placeholder={step.placeholder}
            rows={5}
            autoFocus
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl px-5 py-4 text-sm leading-relaxed focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/15 resize-none mb-3"
          />

          {/* Hint */}
          <p className="text-xs text-white/20 mb-8 flex items-center gap-1.5">
            <span>💡</span> {step.example}
          </p>

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-3 rounded-xl text-sm text-white/30 hover:text-white/60 transition-colors border border-white/[0.07] hover:border-white/20"
              >
                ← Back
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed || loading}
              className="flex-1 bg-white text-black rounded-xl py-3 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving…' :
               isLastStep ? `Finish${answeredCount > 0 ? ` (${answeredCount} answers)` : ''}` :
               'Continue →'}
            </button>

            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="px-4 py-3 rounded-xl text-sm text-white/20 hover:text-white/40 transition-colors"
              >
                Skip
              </button>
            )}
          </div>

          {/* Min length hint */}
          {answer.length > 0 && answer.trim().length < step.minLength && (
            <p className="text-xs text-white/20 mt-3 text-center">
              Keep going… ({step.minLength - answer.trim().length} more characters)
            </p>
          )}

          {currentStep === 0 && (
            <p className="text-xs text-white/20 text-center mt-6">
              Takes about 3 minutes · You can always update this later
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
