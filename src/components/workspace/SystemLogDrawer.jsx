export default function SystemLogDrawer({ isOpen, onClose, logs = [] }) {
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div className={`fixed right-0 top-0 bottom-8 w-80 bg-[#0c0c0c] border-l border-white/5 z-40 transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0">
                    <h3 className="text-[11px] font-mono text-white/60 tracking-widest uppercase">System Telemetry Log</h3>
                    <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 font-mono text-[11px] tracking-wide">
                    {logs.map(log => (
                        <div key={log.id} className={`flex flex-col gap-1 border-l-2 pl-3 animate-in fade-in slide-in-from-left-2 duration-300 border-${log.color}-500/50`}>
                            <span className="text-white/30">{log.timestamp} {log.label}</span>
                            <span className={`text-${log.color}-400`}>{log.content}</span>
                            <span className="text-white/70">{log.subContent}</span>
                        </div>
                    ))}

                    {logs.length === 0 && (
                        <div className="h-full flex items-center justify-center opacity-20 italic">
                            No telemetry captured...
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
