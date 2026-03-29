import { useEffect, useRef } from 'react'

const TYPE_STYLE = {
  DNA: { prefix: '[DNA]', cls: 'text-indigo-400' },
  SYNC: { prefix: '[SYNC]', cls: 'text-emerald-400' },
  CLEAN: { prefix: '[CLEAN]', cls: 'text-amber-400' },
  LEARN: { prefix: '[LEARN]', cls: 'text-violet-400' },
  EVOLVE: { prefix: '[EVOLVE]', cls: 'text-cyan-400' },
  INFO: { prefix: '[INFO]', cls: 'text-slate-500' },
  ERROR: { prefix: '[ERROR]', cls: 'text-red-400' },
}

export default function TerminalLog({ logs }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  if (logs.length === 0) return null

  return (
    <div className="relative rounded-2xl border border-emerald-500/20 bg-[#090b0f]/80 overflow-hidden shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)] backdrop-blur-md group">
      {/* Animated top edge highlight */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50" />

      {/* Titlebar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-900/40 border-b border-white/5 backdrop-blur-xl">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        </div>
        <span className="text-[11px] font-mono text-emerald-500/70 tracking-widest uppercase ml-1 drop-shadow-sm">System Terminal</span>
      </div>

      {/* Log entries */}
      <div
        className="bg-black/40 p-5 space-y-2 max-h-48 overflow-y-auto custom-scrollbar relative"
        style={{ fontFamily: "'Geist Mono', 'JetBrains Mono', ui-monospace, monospace" }}
      >
        {/* Subtle inner grid/scanline effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />

        {logs.map((entry, i) => {
          const s = TYPE_STYLE[entry.type] || TYPE_STYLE.INFO
          const isLast = i === logs.length - 1
          return (
            <div key={i} className="flex gap-3 text-[12px] leading-relaxed relative z-10 transition-all duration-300 animate-[fadeIn_0.2s_ease-out]">
              <span className={`font-bold shrink-0 ${s.cls} drop-shadow-[0_0_8px_currentColor]`}>{s.prefix}</span>
              <span className="text-gray-300 font-medium tracking-wide">{entry.message}</span>
              {isLast && (
                <span className="text-emerald-400 font-bold animate-pulse ml-1 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">█</span>
              )}
            </div>
          )
        })}
        <div ref={endRef} />
      </div>
    </div>
  )
}
