import { useState } from 'react'
import { Sliders } from 'lucide-react'

const TWITTER_CONTENT = {
    originalAI: "AI is completely changing how we build software today. It's moving so fast that developers need to adapt or get left behind. We are entering a new paradigm of agentic workflows.",
    userEdit: "AI isn't changing how we build software—it's replacing the builder entirely. Adapt or get cooked. The agentic era is here."
}

const TIKTOK_CONTENT = [
    { time: '0:00s', label: 'HOOK', text: 'AI isn\'t changing how we build software. It\'s replacing the builder entirely.', type: 'video' },
    { time: '0:03s', label: 'BODY', text: 'Adapt or get cooked. The agentic era is here and it\'s moving faster than anyone realizes.', type: 'audio' },
    { time: '0:12s', label: 'CTA', text: 'Drop a 🚀 in the comments if you are building with agents today.', type: 'text' }
]

export default function OmniCanvas({ isHeatmapActive, activeTraits = [], structureType = 'POST', canvasContent, onCanvasEdit }) {
    const [activeTab, setActiveTab] = useState('twitter')

    const handleTextChange = (tab, idx, newText) => {
        if (onCanvasEdit) onCanvasEdit(tab, idx, newText)
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative z-10 p-8 inner-glow">

            {/* Header & Tabs */}
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                    <span className="text-[10px] font-mono tracking-[0.3em] text-emerald-400/80 uppercase">Cognitive Workspace</span>
                </div>

                <div className="flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 backdrop-blur-3xl premium-shadow relative overflow-hidden">
                    {/* Morphing Background Indicator */}
                    <div
                        className="absolute h-[calc(100%-12px)] top-1.5 bg-white/10 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_4px_16px_rgba(255,255,255,0.05)] border border-white/5"
                        style={{
                            width: activeTab === 'twitter' ? '120px' : '100px',
                            left: activeTab === 'twitter' ? '6px' : '130px'
                        }}
                    />
                    <button
                        onClick={() => setActiveTab('twitter')}
                        className={`relative z-10 px-6 py-2.5 rounded-xl text-[10px] font-mono tracking-widest transition-all duration-700 w-[120px] ${activeTab === 'twitter' ? 'text-white' : 'text-white/30 hover:text-white/50'}`}
                    >
                        𝕏 PROTOCOL
                    </button>
                    <button
                        onClick={() => setActiveTab('tiktok')}
                        className={`relative z-10 px-6 py-2.5 rounded-xl text-[10px] font-mono tracking-widest transition-all duration-700 w-[100px] ${activeTab === 'tiktok' ? 'text-white' : 'text-white/30 hover:text-white/50'}`}
                    >
                        ♪ STREAM
                    </button>
                </div>
            </div>

            {/* Canvas Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">

                {/* TWITTER CARD */}
                {activeTab === 'twitter' && (
                    <div className="max-w-2xl mx-auto mt-6 fade-in perspective-1000">
                        <div className="glass-panel rounded-[2.5rem] p-10 relative overflow-hidden group transition-all duration-700 hover:scale-[1.02] hover:-rotate-1 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.6)]">
                            {/* Animated Scanline Overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%]" />

                            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent z-20" />

                            <div className="flex items-center gap-5 mb-12 relative z-20">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden group-hover:bg-emerald-500/20 transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent" />
                                    <span className="text-emerald-400 font-black text-2xl relative z-10">𝕏</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-mono tracking-tight text-white/90">X / THREAD ENGINE</h3>
                                    <p className="text-[9px] font-mono text-emerald-500/50 tracking-[0.2em] uppercase mt-1">Refinement Heatmap Active</p>
                                </div>
                            </div>

                            <div className="space-y-6 font-mono text-[14px] leading-[1.8] relative min-h-[140px] z-20">
                                {/* Ghost Text (Background) */}
                                <div className="absolute inset-0 text-white/[0.04] select-none pointer-events-none line-through decoration-white/5 blur-[0.5px] transition-all duration-1000 group-hover:text-white/[0.02] flex items-center p-8 bg-white/[0.01] rounded-3xl border border-white/[0.02]">
                                    {TWITTER_CONTENT.originalAI}
                                </div>

                                {/* User Edit (Foreground) */}
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleTextChange('twitter', 0, e.target.innerText)}
                                    className={`relative text-emerald-50/90 font-medium p-8 rounded-[1.5rem] border backdrop-blur-3xl transition-all duration-700 shadow-2xl focus:outline-none focus:border-emerald-500/50
                                    ${isHeatmapActive
                                            ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]'
                                            : 'bg-white/[0.02] border-white/5'}`}>
                                    <span className="text-emerald-500/60 mr-3 font-black">≫</span>
                                    {canvasContent.twitter}
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between relative z-20">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-mono text-white/40 tracking-[0.2em] uppercase">Trait Sync Integrity</span>
                                    <span className="text-[10px] font-mono text-emerald-400/80 font-bold uppercase tracking-widest">High Confidence {Math.floor(Math.random() * 10 + 90)}%</span>
                                </div>
                                <div className="flex gap-2">
                                    {activeTraits.map(trait => (
                                        <div key={trait} className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse" />
                                    ))}
                                    {activeTraits.length === 0 && (
                                        <div className="w-2 h-2 rounded-full bg-white/10" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TIKTOK CARD / SCRIPT */}
                {structureType === 'SCRIPT' && (
                    <div className="max-w-2xl mx-auto mt-6 space-y-6 fade-in">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                                    <span className="text-pink-400 font-bold text-lg">♪</span>
                                </div>
                                <h3 className="text-sm font-mono text-white/90 tracking-tight">WITNESSED COLLAPSE ARCHITECTURE</h3>
                            </div>
                            <span className="text-[9px] font-mono text-white/20 tracking-widest">ENCODING SYNC ACTIVE</span>
                        </div>

                        {canvasContent.tiktok.map((block, idx) => (
                            <div key={idx} className="glass-panel rounded-[1.5rem] p-8 relative group transition-all duration-500 hover:translate-x-1">
                                <div className="absolute left-0 top-6 bottom-6 w-[2px] bg-gradient-to-b from-pink-500/40 to-purple-500/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700" />

                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[9px] font-mono font-black tracking-[0.2em] text-[#0A84FF] bg-[#0A84FF]/10 px-3 py-1 rounded-full border border-[#0A84FF]/20">
                                            {block.label}
                                        </span>
                                        <div className="flex items-center gap-2 text-white/30 bg-white/[0.03] px-3 py-1 rounded-full border border-white/5">
                                            <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
                                            </svg>
                                            <span className="text-[9px] font-mono uppercase tracking-tighter">{block.time}</span>
                                        </div>
                                    </div>

                                    {/* Media Icons */}
                                    <div className="flex gap-3">
                                        {block.type === 'video' && (
                                            <div className="flex items-center gap-2 text-pink-400/80 bg-pink-500/10 px-3 py-1.5 rounded-xl border border-pink-500/20 shadow-lg">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                    <path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" />
                                                </svg>
                                                <span className="text-[8px] font-black tracking-widest uppercase">Video</span>
                                            </div>
                                        )}
                                        {block.type === 'audio' && (
                                            <div className="flex items-center gap-2 text-emerald-400/80 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-lg">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
                                                </svg>
                                                <span className="text-[8px] font-black tracking-widest uppercase">Audio</span>
                                            </div>
                                        )}
                                        {block.type === 'text' && (
                                            <div className="flex items-center gap-2 text-[#0A84FF]/80 bg-[#0A84FF]/10 px-3 py-1.5 rounded-xl border border-[#0A84FF]/20 shadow-lg">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                                    <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                                                </svg>
                                                <span className="text-[8px] font-black tracking-widest uppercase">Text</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleTextChange('tiktok', idx, e.target.innerText)}
                                    className="text-[14px] font-mono text-gray-300 leading-relaxed pl-1 focus:outline-none focus:text-white transition-colors"
                                >
                                    <span className="text-white/10 mr-3 select-none">{String(idx + 1).padStart(2, '0')}</span>
                                    {block.text}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* THREAD CARD / SCOREBOARD */}
                {structureType === 'THREAD' && (
                    <div className="max-w-2xl mx-auto mt-6 space-y-6 fade-in">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <Sliders className="text-indigo-400" size={18} />
                                </div>
                                <h3 className="text-sm font-mono text-white/90 tracking-tight">LIVE SCOREBOARD THREAD</h3>
                            </div>
                            <span className="text-[9px] font-mono text-white/20 tracking-widest uppercase">Structural Density: MAX</span>
                        </div>

                        {canvasContent.thread.map((item, idx) => (
                            <div key={item.id} className="glass-panel rounded-[1.5rem] p-8 relative border-l-2 border-indigo-500/30 hover:border-indigo-500 transition-all duration-500">
                                <span className="absolute -left-3 top-8 w-6 h-6 rounded-lg bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
                                    {item.id}
                                </span>
                                <h4 className="text-[10px] font-mono text-indigo-400 tracking-[0.2em] uppercase mb-4 font-black">{item.title}</h4>
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleTextChange('thread', idx, e.target.innerText)}
                                    className="text-[14px] font-mono text-gray-300 leading-relaxed focus:outline-none focus:text-white"
                                >
                                    {item.content}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    )
}

