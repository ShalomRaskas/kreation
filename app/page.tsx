'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMsg(data.error || 'Something went wrong.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 border-b border-white/[0.06]">
        <span className="text-base font-bold tracking-tight">Kreation •))</span>
        <Link
          href="/auth"
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          Log in →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">

          <div className="inline-flex items-center gap-2 text-xs text-white/40 border border-white/[0.08] bg-white/[0.03] px-4 py-2 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Beta access open — invite only
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            No one can be you.<br />
            <span className="text-white/30">We just help you show up.</span>
          </h1>

          <p className="text-base md:text-lg text-white/40 max-w-lg mx-auto leading-relaxed">
            Kreation learns your voice and generates content that actually sounds like you —
            not a robot, not a template. Built for founders and creators who are done blending in.
          </p>

          {/* CTA split */}
          <div className="flex flex-col items-center gap-4 pt-2">
            <Link
              href="/auth"
              className="bg-white text-black px-7 py-3.5 rounded-xl text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              I have an invite code →
            </Link>

            <div className="w-full max-w-sm">
              {status === 'success' ? (
                <p className="text-sm text-white/50">You&apos;re on the list. We&apos;ll reach out. ✅</p>
              ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="bg-white/10 hover:bg-white/15 border border-white/10 text-white/70 px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {status === 'loading' ? '…' : 'Join waitlist'}
                  </button>
                </form>
              )}
              {status === 'error' && <p className="text-red-400 text-xs mt-2">{errorMsg}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/[0.06] px-6 md:px-10 py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-white/25 mb-10 text-center">How it works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Teach it your voice', desc: 'Answer 5 questions in your own words. No bios, no buzzwords — just how you actually talk.' },
              { step: '02', title: 'Give it a topic', desc: 'Type anything you want to post about. One line is enough.' },
              { step: '03', title: 'Get your content', desc: 'Kreation generates posts for every platform — in your voice, not everyone else\'s.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="space-y-3">
                <div className="text-xs text-white/20 font-mono">{step}</div>
                <div className="text-sm font-semibold">{title}</div>
                <div className="text-sm text-white/35 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof placeholder */}
      <section className="border-t border-white/[0.06] px-6 md:px-10 py-12">
        <div className="max-w-3xl mx-auto text-center space-y-2">
          <p className="text-sm text-white/20">Built for founders who ship.</p>
          <p className="text-xs text-white/15">X · LinkedIn · Instagram · TikTok · YouTube</p>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-4 flex items-center justify-between">
        <span className="text-xs text-white/20">© {new Date().getFullYear()} Kreation</span>
        <Link href="/auth" className="text-xs text-white/20 hover:text-white/40 transition-colors">
          Log in
        </Link>
      </footer>
    </div>
  )
}
