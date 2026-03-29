export default function GhostEditor({ showGhost, isPreviewMode, isHeatmapActive, onEditorInput }) {
    return (
        <div className="flex-1 overflow-y-auto p-12 z-10 relative flex flex-col items-center">

            <div className={`transition-all duration-700 w-full flex flex-col gap-12 pb-24 ${isPreviewMode
                    ? 'max-w-[375px] border-4 border-white/10 rounded-[3rem] p-8 mt-4 shadow-2xl bg-[#0c0c0c]/50 backdrop-blur-md relative overflow-hidden'
                    : 'max-w-4xl'
                }`}>

                {/* Mobile Top Bar Snippet Outline - Only in Preview */}
                {isPreviewMode && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-white/10 rounded-b-xl z-50"></div>
                )}

                {/* WHY Chips - Agentic Transparency */}
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-mono uppercase tracking-widest rounded-full backdrop-blur-md">
                        Based on 12% Sync
                    </div>
                    <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-mono uppercase tracking-widest rounded-full backdrop-blur-md">
                        Voice Matching: [Jargon]
                    </div>
                </div>

                {/* Visuals Block - Base Layer */}
                <div className={`group transition-all duration-700 ${showGhost ? 'opacity-30 blur-[2px]' : 'opacity-100'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 rounded transition-colors">Visuals</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent transition-colors" />
                    </div>
                    <p
                        contentEditable
                        suppressContentEditableWarning
                        onInput={onEditorInput}
                        className={`leading-relaxed font-light cursor-text outline-none transition-colors
                            ${isPreviewMode ? 'text-[15px]' : 'text-[17px]'}
                            ${isHeatmapActive ? 'text-white/20' : 'text-white/50'}
                        `}
                    >
                        <span className={`${isHeatmapActive ? 'text-white/30' : 'text-white/90 font-normal'}`}>Fast-paced montage:</span> User frustration with standard tools, cutting to a smooth, dark-mode interface lighting up.
                    </p>
                </div>

                {/* Audio Block - Base Layer */}
                <div className={`group transition-all duration-700 ${showGhost ? 'opacity-30 blur-[2px]' : 'opacity-100'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 rounded transition-colors">Audio</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent transition-colors" />
                    </div>
                    <p
                        contentEditable
                        suppressContentEditableWarning
                        onInput={onEditorInput}
                        className={`leading-relaxed font-light cursor-text outline-none transition-colors
                            ${isPreviewMode ? 'text-[15px]' : 'text-[17px]'}
                            ${isHeatmapActive ? 'text-white/20' : 'text-white/50'}
                        `}
                    >
                        [Trending synth-wave beat drops. Deep, confident voiceover.]
                    </p>
                </div>

                {/* Overlay Text Block - Active Layer */}
                <div className={`group transition-all duration-700 relative ${showGhost ? 'z-20 scale-[1.02]' : ''}`}>
                    <div className="flex items-center gap-full mb-4 relative z-20">
                        <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest border border-purple-500/20 bg-purple-500/10 px-2 flex-shrink-0 py-1 rounded mr-3">Overlay Text</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent" />

                        {/* Heatmap Sync Label */}
                        <div className={`absolute right-0 top-0 transition-all duration-500 ${isHeatmapActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest bg-[#0c0c0c] px-3 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                Voice Match: 92% (High Sync)
                            </span>
                        </div>
                    </div>

                    {/* Original AI Base layer shown underneath when showGhost is true */}
                    {showGhost && (
                        <div className={`absolute left-0 right-0 p-6 leading-relaxed font-light text-white/30 blur-[2px] opacity-40 pointer-events-none -z-10 mt-2 ${isPreviewMode ? 'top-8 text-[15px]' : 'top-12 text-[17px]'}`}>
                            Stop fighting your tools.<br />
                            Use the Agentic Workspace instead.
                        </div>
                    )}

                    {/* Active Layer visual difference highlighting manual change */}
                    <div className={`relative mt-2 leading-relaxed font-light cursor-text bg-[#0c0c0c] border rounded-xl p-6 shadow-inner transition-all duration-500
                        ${showGhost ? 'bg-black/80 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.15)] border-emerald-500/30' : 'border-white/10 group-hover:border-white/20'}
                        ${isPreviewMode ? 'text-[15px] p-4' : 'text-[17px]'}
                        ${isHeatmapActive && !showGhost ? 'border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)] bg-black/40' : ''}
                    `}>
                        {/* Refinement Heatmap (Emerald Glow saving indicator) */}
                        <div className={`absolute inset-x-0 bottom-0 top-1/2 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 to-transparent blur-2xl pointer-events-none transition-opacity duration-1000 ${isHeatmapActive ? 'opacity-100' : 'opacity-0 animate-[fadeIn_3s_ease-out_1s_forwards]'}`} />

                        <p
                            contentEditable
                            suppressContentEditableWarning
                            onInput={onEditorInput}
                            className={`outline-none relative z-10 transition-colors ${isHeatmapActive ? 'text-white' : 'text-white/90'}`}
                        >
                            Stop fighting your tools.<br />
                            <span className={`font-normal rounded px-1 -mx-1 py-0.5 transition-colors ${isHeatmapActive ? 'bg-emerald-500/40 text-emerald-100' : 'bg-emerald-500/20 text-emerald-300'}`}>Meet the Agentic Workspace.</span>
                        </p>

                        {/* Active label indicating a user modification the agent is "seeing" */}
                        <div className={`absolute top-0 right-4 -translate-y-1/2 border text-[9px] font-mono uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md transition-all z-20 duration-500
                           ${showGhost || isHeatmapActive ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}
                        `}>
                            Active Edit
                        </div>
                    </div>
                </div>

                {/* Script Text Block - Base Layer */}
                <div className={`group transition-all duration-700 ${showGhost ? 'opacity-30 blur-[2px]' : 'opacity-100'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest border border-white/10 bg-white/5 px-2 py-1 rounded transition-colors">Script Content</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent transition-colors" />
                    </div>
                    <p
                        contentEditable
                        suppressContentEditableWarning
                        onInput={onEditorInput}
                        className={`leading-relaxed font-light cursor-text outline-none transition-colors
                            ${isPreviewMode ? 'text-[15px]' : 'text-[17px]'}
                            ${isHeatmapActive ? 'text-white/20' : 'text-white/60'}
                        `}
                    >
                        "Most content creators are stuck in 2023. They're copy-pasting between 5 different tabs just to write one thread. The Agentic Workspace isn't just an editor—it's a command center. You focus on the idea; the system handles the formatting, constraints, and optimization."
                    </p>
                </div>

            </div>
        </div>
    )
}
