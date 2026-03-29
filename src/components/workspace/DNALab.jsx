import { useState } from 'react'
import { Beaker, Zap, Flame, Terminal, Sliders, ChevronRight } from 'lucide-react'

export default function DNALab({ traits, onTraitChange, onSelectFramework }) {
    const [isFrameworksOpen, setIsFrameworksOpen] = useState(false)

    const frameworks = [
        {
            id: 'cooked-take',
            name: 'The Cooked Take',
            description: 'Aggressive, spicy, and short. Engineered for viral engagement.',
            accent: 'emerald',
            structureType: 'POST',
            traits: { spiciness: 80, brevity: 70, sarcasm: 40, jargon: 0 }
        },
        {
            id: 'embarrassing-number',
            name: 'The Embarrassing Number',
            description: 'Data-driven structural hook with extreme transparency.',
            accent: 'emerald',
            structureType: 'POST',
            traits: { spiciness: 60, brevity: 90, sarcasm: 20, jargon: 50 }
        },
        {
            id: 'witnessed-collapse',
            name: 'The Witnessed Collapse',
            description: 'High-tension video script format with timestamped hooks.',
            accent: 'pink',
            structureType: 'SCRIPT',
            traits: { spiciness: 90, brevity: 40, sarcasm: 60, jargon: 30 }
        },
        {
            id: 'live-scoreboard',
            name: 'The Live Scoreboard',
            description: 'Numbered density thread. Logic-first structural loading.',
            accent: 'indigo',
            structureType: 'THREAD',
            traits: { jargon: 90, sarcasm: 10, brevity: 20, spiciness: 30 }
        }
    ]

    const handleTraitAdjustment = (id, value) => {
        onTraitChange(id, value)
    }

    return (
        <div className="w-80 bg-[#080808] border-r border-white/5 flex flex-col z-20 animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="h-16 border-b border-white/5 flex items-center px-6 shrink-0 gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Beaker size={18} />
                </div>
                <h2 className="text-sm font-medium text-white/80 tracking-wide uppercase">DNA Lab</h2>
            </div>

            {/* Trait Telemetry Sliders */}
            <div className="p-6 flex flex-col gap-8">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase">Trait Telemetry</span>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="w-1 h-1 rounded-full bg-emerald-500/30" />
                        </div>
                    </div>

                    {Object.entries(traits).map(([id, value]) => (
                        <div key={id} className="flex flex-col gap-3 group">
                            <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-mono uppercase tracking-wider transition-colors ${value > 0 ? 'text-emerald-400' : 'text-white/30'}`}>
                                    {id}
                                </span>
                                <span className={`text-[11px] font-mono ${value > 0 ? 'text-emerald-400' : 'text-white/20'}`}>
                                    {value}%
                                </span>
                            </div>
                            <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden group-hover:bg-white/10 transition-colors cursor-pointer">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={value}
                                    onChange={(e) => handleTraitAdjustment(id, parseInt(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div
                                    className={`h-full transition-all duration-300 ${value > 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/20'}`}
                                    style={{ width: `${value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Frameworks Section */}
                <div className="mt-4 flex flex-col gap-4">
                    <button
                        onClick={() => setIsFrameworksOpen(!isFrameworksOpen)}
                        className="flex items-center justify-between group"
                    >
                        <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase group-hover:text-white/60 transition-colors">Framework Library</span>
                        <ChevronRight size={14} className={`text-white/20 group-hover:text-white/40 transition-transform ${isFrameworksOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {isFrameworksOpen && (
                        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            {frameworks.map(fw => (
                                <div
                                    key={fw.id}
                                    onClick={() => onSelectFramework(fw)}
                                    className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[11px] font-bold text-white/90">{fw.name}</span>
                                        <div className={`w-2 h-2 rounded-full bg-${fw.accent}-500/50 group-hover:bg-${fw.accent}-500 transition-colors`} />
                                    </div>
                                    <p className="text-[10px] text-white/40 leading-relaxed font-mono">
                                        {fw.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Status */}
            <div className="mt-auto p-6 border-t border-white/5 flex items-center gap-3">
                <Terminal size={12} className="text-white/20" />
                <span className="text-[9px] font-mono text-white/20 tracking-tighter uppercase">LOCAL_SYNC_ACTIVE_00x</span>
            </div>
        </div>
    )
}
