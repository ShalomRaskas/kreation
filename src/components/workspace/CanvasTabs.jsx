import { useState } from 'react'
import { Eye, Send, Smartphone, Wand2 } from 'lucide-react'

export default function CanvasTabs({ showGhost, setShowGhost, onPortContent, isPreviewMode, setIsPreviewMode }) {
    const [activeTab, setActiveTab] = useState('script') // post, script, thread

    return (
        <div className="h-16 border-b border-white/5 flex items-center px-8 shrink-0 z-10 justify-between">
            <div className="flex items-center gap-8 h-full">
                <button
                    onClick={() => setActiveTab('post')}
                    className={`text-sm font-medium tracking-wide transition-colors relative h-full flex items-center ${activeTab === 'post' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
                >
                    POST
                    {activeTab === 'post' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
                </button>

                <button
                    onClick={() => setActiveTab('script')}
                    className={`text-sm font-medium tracking-wide transition-colors relative h-full flex items-center ${activeTab === 'script' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
                >
                    SCRIPT
                    {activeTab === 'script' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
                </button>

                <button
                    onClick={() => setActiveTab('thread')}
                    className={`text-sm font-medium tracking-wide transition-colors relative h-full flex items-center ${activeTab === 'thread' ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
                >
                    THREAD
                    {activeTab === 'thread' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
                </button>
            </div>

            <div className="flex items-center gap-3">
                {/* Platform Morph */}
                <button
                    onClick={() => onPortContent('morph')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all"
                >
                    <Wand2 size={14} />
                    <span className="text-[11px] font-mono tracking-widest uppercase">Morph</span>
                </button>

                {/* Chameleon Preview Toggle */}
                <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all ${isPreviewMode
                        ? 'bg-purple-500/10 border-purple-500/50 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                        : 'bg-transparent border-white/10 text-white/40 hover:text-white hover:border-white/20'
                        }`}
                >
                    <Smartphone size={14} />
                    <span className="text-[11px] font-mono tracking-widest uppercase">Preview</span>
                </button>

                {/* Mirror Toggle (Ghost) */}
                <button
                    onClick={() => setShowGhost(!showGhost)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all ${showGhost
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-transparent border-white/10 text-white/40 hover:text-white hover:border-white/20'
                        }`}
                >
                    <Eye size={14} />
                    <span className="text-[11px] font-mono tracking-widest uppercase">Show Ghost</span>
                </button>

                {/* Context Bridge */}
                <button
                    onClick={() => onPortContent('tiktok')}
                    className="flex items-center gap-2 px-4 py-1.5 rounded bg-indigo-500 hover:bg-indigo-400 text-white transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                    <Send size={14} />
                    <span className="text-[11px] font-mono tracking-widest uppercase">Port Content</span>
                </button>
            </div>
        </div>
    )
}
