'use client'
import { useState } from 'react'
import type { Script } from '@/types'
import Link from 'next/link'

export default function ScriptClient({ script }: { script: Script }) {
  const [refineOpen, setRefineOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [refining, setRefining] = useState(false)
  const [current, setCurrent] = useState(script)
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  async function copy() {
    const text = `HOOK\n${current.hook}\n\nMAIN CONTENT\n${current.main_content}\n\nCALL TO ACTION\n${current.call_to_action}`
    await navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function share() {
    navigator.clipboard.writeText(window.location.href)
    setShared(true); setTimeout(() => setShared(false), 2000)
  }

  async function refine() {
    if (!feedback.trim()) return
    setRefining(true)
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: current.id, feedback }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCurrent(data.script)
      setRefineOpen(false); setFeedback('')
    } catch (e) { console.error(e) }
    finally { setRefining(false) }
  }

  const sections = [
    { key: 'hook',         label: 'Hook',            emoji: '🎣', color: '#8B7CF8', content: current.hook },
    { key: 'main_content', label: 'Main Content',     emoji: '📝', color: '#7070C8', content: current.main_content },
    { key: 'call_to_action', label: 'Call to Action', emoji: '🚀', color: '#8B7CF8', content: current.call_to_action },
  ]

  return (
    <main
      className="min-h-screen flex flex-col items-center"
      style={{ background: 'radial-gradient(ellipse 55% 35% at 20% 10%, rgba(108,92,231,0.1) 0%, transparent 60%), #0A0A0F' }}
    >
      {/* Nav */}
      <nav className="w-full max-w-3xl flex items-center justify-between px-5 pt-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold tracking-tight" style={{
            background: 'linear-gradient(135deg, #8B7CF8, #3D35B5)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Kre<span style={{ WebkitTextFillColor: 'white' }}>ation</span></span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.3)', color: '#8B7CF8' }}>
            Script Ready
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={copy}
            className="text-sm font-semibold px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ background: '#1A1A2E', border: '1px solid #2A2A3E', color: copied ? '#8B7CF8' : '#9A9AB0' }}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          <button onClick={share}
            className="text-sm font-semibold px-3 py-2 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ background: '#1A1A2E', border: '1px solid #2A2A3E', color: shared ? '#8B7CF8' : '#9A9AB0' }}>
            {shared ? '✓ Link Copied' : '🔗 Share'}
          </button>
          <Link href="/dashboard"
            className="text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5"
            style={{ border: '1.5px solid #2A2A3E', color: '#9A9AB0' }}>
            Create Your Video
          </Link>
        </div>
      </nav>

      <div className="w-full max-w-3xl px-5 py-8 flex flex-col gap-5 pb-16">
        <h1 className="text-2xl font-bold" style={{ color: '#8B7CF8' }}>{current.topic}</h1>

        {sections.map(s => (
          <div key={s.key} className="rounded-2xl overflow-hidden" style={{ background: '#12121A', border: '1px solid #2A2A3E' }}>
            <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid #2A2A3E' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'rgba(108,92,231,0.15)' }}>{s.emoji}</div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: s.color }}>{s.label}</span>
            </div>
            <div className="px-6 py-5 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#E0E0F0' }}>
              {s.content}
            </div>
          </div>
        ))}

        <button onClick={() => setRefineOpen(!refineOpen)}
          className="self-center text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
          style={{ border: '1.5px solid #2A2A3E', color: '#9A9AB0' }}>
          ✏️ Refine This Script
        </button>

        {refineOpen && (
          <div className="rounded-2xl p-5 flex flex-col gap-4 animate-fade-up"
            style={{ background: '#12121A', border: '1.5px solid rgba(108,92,231,0.4)' }}>
            <h3 className="font-semibold">What would you like to change?</h3>
            <p className="text-sm text-gray-500">e.g. &ldquo;Make the hook punchier&rdquo; or &ldquo;Add a personal story&rdquo;</p>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
              placeholder="Type your feedback…" rows={3}
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none"
              style={{ background: '#1A1A2E', border: '1.5px solid #2A2A3E' }}
              onFocus={e => (e.target.style.borderColor = '#6C5CE7')}
              onBlur={e => (e.target.style.borderColor = '#2A2A3E')}
            />
            <div className="flex gap-3 flex-wrap">
              <button onClick={refine} disabled={refining || !feedback.trim()}
                className="px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #3D35B5, #6C5CE7)' }}>
                {refining ? <><div className="spinner-sm" />Regenerating…</> : '↺ Regenerate with Feedback'}
              </button>
              <button onClick={() => setRefineOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm"
                style={{ border: '1.5px solid #2A2A3E', color: '#9A9AB0' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
