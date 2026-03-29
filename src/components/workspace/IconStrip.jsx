import { Home, MessageSquare, LayoutTemplate, Settings, UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function IconStrip({ onToggleDNALab, isDNALabOpen }) {
    return (
        <div className="w-16 bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center py-6 gap-8 z-30 flex-shrink-0">
            <Link to="/" className="text-white/40 hover:text-white transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                    <span className="font-bold text-xs">K</span>
                </div>
            </Link>

            <div className="flex flex-col gap-6 mt-4">
                <button className="text-white hover:text-white transition-colors relative group">
                    <MessageSquare size={20} />
                    {/* Active indicator */}
                    {!isDNALabOpen && (
                        <div className="absolute -left-[27px] top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full animate-in fade-in duration-300" />
                    )}
                </button>
                <button
                    onClick={onToggleDNALab}
                    className={`transition-colors relative group ${isDNALabOpen ? 'text-white' : 'text-white/40 hover:text-white'}`}
                >
                    <LayoutTemplate size={20} />
                    {isDNALabOpen && (
                        <div className="absolute -left-[27px] top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-in slide-in-from-left duration-300" />
                    )}
                </button>
            </div>

            <div className="mt-auto flex flex-col gap-6">
                <button className="text-white/40 hover:text-white transition-colors">
                    <Settings size={20} />
                </button>
                <button className="text-white/40 hover:text-white transition-colors">
                    <UserCircle size={20} />
                </button>
            </div>
        </div>
    )
}
