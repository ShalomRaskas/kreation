export default function VoiceMaturity({ maturity }) {
  const isMirror = maturity >= 90
  const color = isMirror ? '#10b981' : maturity >= 60 ? '#f59e0b' : '#6366f1'
  const label = isMirror ? '🪞 Mirror' : maturity >= 60 ? 'Calibrating' : 'Learning'

  return (
    <div className="flex flex-col gap-1.5 min-w-[148px]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Voice Maturity</span>
        <span
          className={`text-[9px] font-black tracking-wide uppercase ${
            isMirror ? 'text-emerald-400 animate-pulse' : 'text-gray-500'
          }`}
        >
          {label}
        </span>
      </div>
      <div className="relative h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${maturity}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[9px] font-mono text-gray-700">{maturity}% calibrated</span>
    </div>
  )
}
