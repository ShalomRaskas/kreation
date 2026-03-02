'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const HEADLINE = "Turn Your Ideas Into Reality"

export default function LandingPage() {
  const [displayed, setDisplayed] = useState('')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setDisplayed(HEADLINE.slice(0, i + 1))
      i++
      if (i >= HEADLINE.length) clearInterval(interval)
    }, 60)
    return () => clearInterval(interval)
  }, [])

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    // Beehiiv integration — replace PUBLICATION_ID with real value
    try {
      await fetch('https://api.beehiiv.com/v2/publications/PUBLICATION_ID/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reactivate_existing: true, send_welcome_email: true }),
      })
    } catch (_) {}
    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
      style={{
        background: 'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(61,53,181,0.22) 0%, transparent 70%), #0A0A0F',
      }}
    >
      {/* Logo */}
      <div className="mb-10">
        <span className="text-3xl font-extrabold tracking-tight" style={{
          background: 'linear-gradient(135deg, #8B7CF8, #3D35B5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Kre<span style={{ WebkitTextFillColor: 'white' }}>ation</span>
        </span>
      </div>

      {/* Headline */}
      <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 max-w-3xl leading-tight min-h-[1.2em]">
        <span style={{
          background: 'linear-gradient(135deg, #fff 30%, #8B7CF8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {displayed}
        </span>
        <span className="animate-pulse" style={{ color: '#6C5CE7' }}>|</span>
      </h1>

      <p className="text-lg text-gray-400 max-w-xl mb-10">
        AI-powered scripts written in your exact voice. Answer 5 questions once. Generate scripts forever.
      </p>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <Link
          href="/auth"
          className="px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:-translate-y-1"
          style={{
            background: 'linear-gradient(135deg, #3D35B5, #6C5CE7)',
            boxShadow: '0 4px 20px rgba(108,92,231,0.4)',
          }}
        >
          Get Started Free →
        </Link>
        <Link
          href="/auth?mode=login"
          className="px-8 py-4 rounded-xl font-semibold text-gray-400 border transition-all hover:border-accent hover:text-white"
          style={{ borderColor: '#2A2A3E', background: 'transparent' }}
        >
          Sign In
        </Link>
      </div>

      {/* Email signup */}
      <div className="w-full max-w-md">
        <p className="text-sm text-gray-500 mb-3">Join the waitlist for early access</p>
        {submitted ? (
          <p className="text-accent2 font-semibold">✓ You&apos;re on the list!</p>
        ) : (
          <form onSubmit={handleEmailSubmit} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
              style={{
                background: '#12121A',
                border: '1.5px solid #2A2A3E',
              }}
              onFocus={e => e.target.style.borderColor = '#6C5CE7'}
              onBlur={e => e.target.style.borderColor = '#2A2A3E'}
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #3D35B5, #6C5CE7)' }}
            >
              {submitting ? '…' : 'Join'}
            </button>
          </form>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 w-full max-w-3xl">
        {[
          { icon: '🎯', title: 'Your Voice', desc: 'Scripts that sound exactly like you — not generic AI.' },
          { icon: '⚡', title: '30-Second Setup', desc: 'Answer 5 quick questions. Your voice profile is ready.' },
          { icon: '📋', title: 'Hook, Body, CTA', desc: 'Every script structured to keep viewers watching.' },
        ].map(f => (
          <div
            key={f.title}
            className="p-6 rounded-2xl text-left"
            style={{ background: '#12121A', border: '1px solid #2A2A3E' }}
          >
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="font-bold mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
