import SystemLogDrawer from './SystemLogDrawer'

export default function SystemFooter({ isSystemLogOpen, setIsSystemLogOpen, isHeatmapActive, setIsHeatmapActive, maturity, logs }) {
    return (
        <>
            <div className="h-8 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-between px-4 text-[10px] font-mono text-white/40 flex-shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 group cursor-pointer hover:text-white/70 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>SYSTEM_ONLINE</span>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 relative group cursor-pointer">
                            <span className="tracking-widest">MATURITY</span>
                            <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                                    style={{ width: `${maturity}%` }}
                                />
                            </div>
                            <span className="text-indigo-400 cursor-help">{Math.floor(maturity)}%</span>

                            {/* Hover Tooltip Popup */}
                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                <div className="bg-[#141414] border border-white/10 px-3 py-1.5 rounded-lg shadow-xl text-white/80 text-[10px] tracking-wide relative">
                                    Last edit increased authenticity by <span className="text-emerald-400 font-semibold">+0.2%</span>
                                    {/* Arrow down */}
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#141414] border-b border-r border-white/10 transform rotate-45" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Heatmap Toggle */}
                    <button
                        onClick={() => setIsHeatmapActive(!isHeatmapActive)}
                        className={`transition-all flex items-center gap-1.5 px-2 py-0.5 rounded border ${isHeatmapActive
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                            : 'text-white/40 border-transparent hover:text-white/70'
                            }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isHeatmapActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                        <span>HEATMAP</span>
                    </button>

                    <button
                        onClick={() => setIsSystemLogOpen(!isSystemLogOpen)}
                        className={`transition-colors flex items-center gap-1.5 ${isSystemLogOpen ? 'text-white' : 'hover:text-white/70'}`}
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        <span>SYSTEM_LOG</span>
                    </button>
                </div>
            </div>

            <SystemLogDrawer
                isOpen={isSystemLogOpen}
                onClose={() => setIsSystemLogOpen(false)}
                logs={logs}
            />
        </>
    )
}
