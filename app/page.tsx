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
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/10">
        <span className="text-xl font-bold tracking-tight">Kreation</span>
        <div className="flex items-center gap-4">
          <Link href="/auth" className="text-sm text-white/60 hover:text-white transition-colors">
            Log in
          </Link>
          <Link
            href="/auth"
            className="text-sm bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="inline-block text-xs uppercase tracking-widest text-white/40 border border-white/10 px-4 py-2 rounded-full">
            Early Access
          </div>

          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            Your voice.{' '}
            <span className="text-white/40">Everywhere. Always.</span>
          </h1>

          <p className="text-lg text-white/60 max-w-xl mx-auto leading-relaxed">
            AI that learns how you write and posts for you. Built for founders and creators
            who are done sounding like everyone else.
          </p>

          {status === 'success' ? (
            <div className="text-2xl font-semibold tracking-tight">
              You're on the list. ✅
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
              <div className="flex w-full max-w-md gap-2">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-white text-black px-5 py-3 rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {status === 'loading' ? 'Joining…' : 'Get Early Access'}
                </button>
              </div>
              {status === 'error' && (
                <p className="text-red-400 text-xs">{errorMsg}</p>
              )}
              <p className="text-xs text-white/30">
                No spam. Just early access when we're ready.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/10 px-8 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-sm uppercase tracking-widest text-white/40 mb-12 text-center">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Teach it your voice', desc: 'Paste 5–10 of your own posts or messages.' },
              { step: '02', title: 'Give it a topic', desc: 'Type anything you want to post about.' },
              { step: '03', title: 'Get your post', desc: 'Kreation writes it the way you would.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="space-y-3">
                <div className="text-xs text-white/30 font-mono">{step}</div>
                <div className="text-base font-semibold">{title}</div>
                <div className="text-sm text-white/50 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-8 py-6 text-center text-xs text-white/30">
        © {new Date().getFullYear()} Kreation. Built for founders who ship.
      </footer>
    </main>
  )
}
