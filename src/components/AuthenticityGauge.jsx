const SCORE_META = [
  { min: 90, label: 'HUMAN-PASSING', color: '#10b981', ring: 'ring-emerald-500/40', bg: 'bg-emerald-500/10', text: 'text-emerald-400', pulse: true  },
  { min: 70, label: 'STRONG',        color: '#f59e0b', ring: 'ring-amber-500/30',   bg: 'bg-amber-500/10',   text: 'text-amber-400',  pulse: false },
  { min: 50, label: 'AVERAGE',       color: '#3b82f6', ring: 'ring-blue-500/30',    bg: 'bg-blue-500/10',    text: 'text-blue-400',   pulse: false },
  { min: 0,  label: 'SLOP RISK',     color: '#ef4444', ring: 'ring-red-500/30',     bg: 'bg-red-500/10',     text: 'text-red-400',    pulse: false },
]

export default function AuthenticityGauge({ score, onPurge, isPurging }) {
  if (score === null || score === undefined) return null

  const meta = SCORE_META.find(m => score >= m.min) || SCORE_META[SCORE_META.length - 1]
  const showPurge = score < 70

  return (
    <div className="flex items-center gap-2.5">
      {/* Score meter */}
      <div
        className={`relative flex items-center gap-2.5 px-3 py-1.5 rounded-xl border ring-1 ${meta.ring} ${meta.bg} transition-all duration-500`}
        style={{ borderColor: `${meta.color}30` }}
      >
        {/* Neon pulse ring when human-passing */}
        {meta.pulse && (
          <span
            className="absolute inset-0 rounded-xl ring-1 ring-emerald-400/50 animate-ping"
            style={{ animationDuration: '2s' }}
          />
        )}

        {/* Bar */}
        <div className="relative w-16 h-[3px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%`, backgroundColor: meta.color }}
          />
        </div>

        <span className={`text-[11px] font-black tracking-wide ${meta.text}`}>
          {meta.label}
        </span>
        <span className="text-[10px] font-mono text-white/25">{score}</span>
      </div>

      {/* Purge Slop button — appears when score < 70 */}
      {showPurge && (
        <button
          onClick={onPurge}
          disabled={isPurging}
          className="text-[11px] font-bold px-3 py-1.5 rounded-xl border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPurging ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
              Purging...
            </span>
          ) : '🔥 Purge Slop'}
        </button>
      )}
    </div>
  )
}
