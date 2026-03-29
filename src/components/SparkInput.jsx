import { useState } from 'react'
import { useMic, MicButton } from '../hooks/useMic'

export default function SparkInput({ onSpark, isSparking }) {
  const [spark, setSpark] = useState('')

  const mic = useMic(
    (text) => setSpark(text),
    (final) => { if (final !== '__error__') setSpark(final) }
  )

  const submit = () => {
    if (!spark.trim() || isSparking) return
    onSpark(spark.trim())
    setSpark('')
  }

  return (
    <div className="relative group glass-card rounded-2xl px-6 py-5 flex flex-col gap-4 overflow-hidden shadow-2xl transition-all duration-700 hover:border-amber-500/30">
      {/* Background Glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none group-focus-within:bg-amber-500/10 transition-colors duration-1000" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="text-amber-400 text-sm drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">⚡</span>
            <div className="absolute inset-0 bg-amber-400 blur-md opacity-20 animate-pulse" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/80">The Spark Protocol</span>
        </div>
        <span className="text-[9px] text-white/20 font-mono tracking-widest uppercase">Single Thought Stream</span>
      </div>

      <div className="relative z-10 flex gap-4 items-center">
        <div className="shrink-0 glass-card rounded-xl p-1 border-white/10 hover:bg-white/5 transition-colors">
          <MicButton active={mic.active} onClick={() => mic.toggle('')} />
        </div>

        <div className="relative flex-1 group/input">
          <div className={`absolute -inset-[1px] bg-gradient-to-r from-amber-500/40 via-amber-400/20 to-amber-500/40 rounded-xl blur-md transition-opacity duration-700 ${spark ? 'opacity-100' : 'opacity-0 group-focus-within/input:opacity-60'}`} />

          <div className="relative bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl transition-all duration-500 group-focus-within/input:border-amber-500/30">
            <input
              value={spark}
              onChange={e => setSpark(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Vite build failed... Here's what I learned."
              className="w-full bg-transparent px-5 py-4 text-[13px] font-mono text-white placeholder-white/20 focus:outline-none transition-all disabled:opacity-30"
            />
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!spark.trim() || isSparking}
          className="relative shrink-0 w-14 h-12 rounded-xl flex items-center justify-center transition-all duration-500 disabled:opacity-20 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 group/btn"
        >
          {isSparking ? (
            <div className="w-5 h-5 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-amber-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </button>
      </div>

      {mic.active && (
        <div className="flex items-center gap-3 text-[10px] text-red-400 font-mono uppercase tracking-widest pl-1 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Neural Link Active...
        </div>
      )}
    </div>
  )
}

