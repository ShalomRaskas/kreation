'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteValid, setInviteValid] = useState(false)
  const [inviteChecking, setInviteChecking] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Surface confirmation errors from /auth/callback
  useEffect(() => {
    if (searchParams.get('error') === 'confirmation_failed') {
      setError('Email confirmation failed. Try signing in or request a new link.')
    }
    // Pre-fill invite code from URL if shared as ?code=XXX
    const code = searchParams.get('code')
    if (code) {
      setInviteCode(code.toUpperCase())
      validateCode(code)
    }
  }, [searchParams])

  async function validateCode(code: string) {
    if (!code.trim()) { setInviteValid(false); setInviteError(''); return }
    setInviteChecking(true)
    setInviteError('')
    try {
      const res = await fetch('/api/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      setInviteValid(data.valid)
      if (!data.valid) setInviteError(data.error ?? 'Invalid invite code.')
    } finally {
      setInviteChecking(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (mode === 'signup' && !inviteValid) {
      setError('A valid invite code is required to sign up.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.session) {
          router.push('/onboarding')
        } else {
          setMessage('Check your email to confirm your account, then log in.')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">

        <div className="space-y-2">
          <Link href="/" className="text-sm text-white/30 hover:text-white/60 transition-colors">
            ← Kreation
          </Link>
          <h1 className="text-2xl font-bold">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-white/40">
            {mode === 'signup'
              ? 'Beta access required. Enter your invite code to sign up.'
              : 'Log in to your Kreation account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Invite code (signup only) */}
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-sm text-white/60">Invite code</label>
              <div className="relative">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={e => {
                    const val = e.target.value.toUpperCase()
                    setInviteCode(val)
                    setInviteValid(false)
                    setInviteError('')
                  }}
                  onBlur={() => validateCode(inviteCode)}
                  placeholder="KREATION-XXXX"
                  className={`w-full bg-white/5 border rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors placeholder:text-white/20 pr-10 ${
                    inviteValid ? 'border-green-500/50 focus:border-green-500' :
                    inviteError ? 'border-red-500/50 focus:border-red-500' :
                    'border-white/10 focus:border-white/30'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                  {inviteChecking ? '⏳' : inviteValid ? '✅' : inviteError ? '❌' : ''}
                </span>
              </div>
              {inviteError && <p className="text-xs text-red-400">{inviteError}</p>}
              {inviteValid && <p className="text-xs text-green-400">Valid — you&apos;re in.</p>}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-white/60">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/60">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          {message && (
            <div className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-4 py-3">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'signup' && !inviteValid)}
            className="w-full bg-white text-black rounded-lg py-3 text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading…' : mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div className="text-center text-sm text-white/40">
          {mode === 'signup' ? (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError('') }} className="text-white/70 hover:text-white transition-colors">
                Log in
              </button>
            </>
          ) : (
            <>Have an invite code?{' '}
              <button onClick={() => { setMode('signup'); setError('') }} className="text-white/70 hover:text-white transition-colors">
                Sign up
              </button>
            </>
          )}
        </div>

        {mode === 'signup' && (
          <p className="text-center text-xs text-white/20">
            No invite?{' '}
            <Link href="/" className="underline hover:text-white/40 transition-colors">
              Join the waitlist
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
