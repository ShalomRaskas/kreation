import { useState, useEffect } from 'react'

export default function CommandCenter({ bridgeAction }) {
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'agent',
            state: 'Analyzing Tone',
            content: "I'm reviewing the structure and pacing of the initial prompt to determine the best format for the script. Would you prefer a fast-paced hook or something more narrative-driven?",
            iconColor: 'indigo'
        },
        {
            id: 2,
            role: 'user',
            content: "Let's refine the hook. It needs to be punchier for TikTok."
        },
        {
            id: 3,
            role: 'agent',
            state: 'Drafting Content',
            content: "Got it. I'm updating the script with a higher-energy hook and restructuring the first 3 seconds for maximum retention.",
            iconColor: 'emerald'
        }
    ])

    useEffect(() => {
        if (bridgeAction) {
            const isMorph = bridgeAction === 'morph'
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'agent',
                state: isMorph ? 'Neural Morph' : 'Context Bridge',
                content: isMorph
                    ? "Transforming Twitter logic into TikTok script structure. Adjusting 'Brevity' for visual pacing."
                    : `Re-engineering the [POST] logic for [SCRIPT] format (${bridgeAction.toUpperCase()}). Adjusting Spiciness levels now.`,
                iconColor: isMorph ? 'emerald' : 'purple'
            }])
        }
    }, [bridgeAction])

    // Utility to get proper icon and colors depending on state
    const getIconColorClasses = (color) => {
        if (color === 'emerald') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        if (color === 'purple') return 'bg-purple-500/10 border-purple-500/20 text-purple-400'
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' // default indigo
    }

    const getBorderColorClass = (color) => {
        if (color === 'emerald') return 'border-l-emerald-500/50'
        if (color === 'purple') return 'border-l-purple-500/50'
        return ''
    }

    return (
        <div className="w-[40%] min-w-[380px] bg-[#02040a]/40 border-r border-white/5 flex flex-col relative z-20 backdrop-blur-3xl">
            {/* Header */}
            <div className="h-16 border-b border-white/5 flex items-center px-6 shrink-0 justify-between">
                <div className="flex flex-col">
                    <h2 className="text-[11px] font-mono font-bold text-white/90 tracking-[0.2em] uppercase">Command Center</h2>
                    <span className="text-[9px] font-mono text-white/20 tracking-tighter uppercase">Omni-Kernel v2.0.6</span>
                </div>
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                    <span className="text-[9px] font-mono text-indigo-400 tracking-wider font-bold">ACTIVE</span>
                </div>
            </div>

            {/* Chat / Assessment Area */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 pb-32 custom-scrollbar">
                {messages.map((msg) => {
                    if (msg.role === 'user') {
                        return (
                            <div key={msg.id} className="self-end max-w-[85%] fade-in">
                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl rounded-tr-sm px-5 py-4 shadow-xl backdrop-blur-md">
                                    <p className="text-[13px] text-white/90 leading-relaxed font-mono">{msg.content}</p>
                                </div>
                            </div>
                        )
                    }

                    // Agent message
                    const iconClasses = getIconColorClasses(msg.iconColor)
                    const borderClass = getBorderColorClass(msg.iconColor)

                    return (
                        <div key={msg.id} className="flex flex-col gap-3 self-start max-w-[90%] fade-in">
                            <div className="flex items-center gap-3 pl-1">
                                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${iconClasses} shadow-lg`}>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <span className={`text-[10px] font-mono uppercase tracking-[0.2em] font-black ${iconClasses.split(' ').pop()}`}>{msg.state}</span>
                            </div>
                            <div className={`glass-panel rounded-[1.5rem] rounded-tl-sm px-6 py-5 shadow-2xl border-l-[3px] transition-all duration-500 hover:bg-white/[0.04] ${borderClass}`}>
                                <p className="text-[13px] text-white/80 leading-relaxed font-mono italic opacity-90">"{msg.content}"</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#02040a] via-[#02040a] to-transparent pt-16">
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl flex items-end p-2.5 shadow-2xl focus-within:border-indigo-500/40 focus-within:bg-white/[0.04] transition-all duration-500 backdrop-blur-3xl">
                    <textarea
                        className="w-full bg-transparent text-[13px] text-white placeholder-white/30 resize-none outline-none px-3 py-2 min-h-[44px] max-h-[120px]"
                        placeholder="Instruct the agent..."
                        rows={1}
                    />
                    <button className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 flex items-center justify-center transition-colors shrink-0 mb-1 mr-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
