import { Brain, FileDigit, Zap, Flame } from 'lucide-react'

export default function TraitTelemetry({ activeTraits = [], typingPulse = false }) {
    const traits = [
        { id: 'sarcasm', label: 'Sarcasm' },
        { id: 'jargon', label: 'Jargon' },
        { id: 'brevity', label: 'Brevity' },
        { id: 'spiciness', label: 'Spiciness' }
    ]

    return (
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-20 pointer-events-none">
            {traits.map(trait => {
                const isActive = activeTraits.includes(trait.id)
                const isPulsing = isActive && typingPulse

                return (
                    <div key={trait.id} className="flex items-center gap-4 group">
                        <div className="relative flex items-center justify-center">
                            {/* The base indicator node */}
                            <div className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${isActive
                                    ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.8)]'
                                    : 'bg-white/5 border-white/20'
                                } ${isPulsing ? 'scale-[1.7] brightness-150' : 'scale-100'}`} />

                            {/* The pulsing halo effect on active and typing */}
                            {isPulsing && (
                                <div className="absolute inset-0 rounded-full bg-emerald-500/50 blur-md animate-ping" />
                            )}
                        </div>

                        {/* The label, visible on hover or slightly dimmed otherwise */}
                        <span className={`text-[10px] font-mono tracking-widest uppercase transition-colors duration-300 ${isActive
                                ? 'text-emerald-400/80 drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]'
                                : 'text-white/20'
                            } ${isPulsing ? 'text-emerald-300' : ''}`}>
                            {trait.label}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}
