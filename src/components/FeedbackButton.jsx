import { useState } from 'react'
import { getDebugSnapshot } from '../services/longTermMemory'

export default function FeedbackButton() {
  const [open,        setOpen]        = useState(false)
  const [type,        setType]        = useState('bug')
  const [description, setDescription] = useState('')
  const [showDebug,   setShowDebug]   = useState(false)
  const [copied,      setCopied]      = useState(false)

  const buildReport = () => {
    const debug = getDebugSnapshot()
    return JSON.stringify({ type, description, debug, timestamp: new Date().toISOString() }, null, 2)
  }

  const copyReport = () => {
    navigator.clipboard.writeText(buildReport())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const close = () => { setOpen(false); setDescription(''); setShowDebug(false); setCopied(false) }

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gray-800/90 hover:bg-gray-700 border border-gray-700/60 hover:border-gray-600 text-gray-500 hover:text-gray-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl shadow-xl backdrop-blur transition-all"
      >
        <span className="text-sm">🐛</span>
        Feedback
      </button>

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
          {/* Click-away area */}
          <div className="absolute inset-0 pointer-events-auto" onClick={close} />

          {/* Modal */}
          <div className="relative pointer-events-auto w-full max-w-md bg-gray-900 border border-gray-700/70 rounded-2xl shadow-2xl flex flex-col gap-4 p-5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-200">Report / Suggest</span>
              <button onClick={close} className="text-gray-600 hover:text-gray-300 text-lg leading-none">×</button>
            </div>

            {/* Type toggle */}
            <div className="flex gap-2">
              {['bug', 'feature'].map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    type === t
                      ? t === 'bug'
                        ? 'bg-red-500/15 border-red-500/30 text-red-400'
                        : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                      : 'bg-transparent border-gray-700/50 text-gray-600 hover:text-gray-400'
                  }`}>
                  {t === 'bug' ? '🐛 Bug' : '💡 Feature'}
                </button>
              ))}
            </div>

            {/* Description */}
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={type === 'bug' ? 'What broke? What did you expect to happen?' : 'What would make this 10× better?'}
              rows={4}
              className="w-full bg-gray-800/60 rounded-xl border border-gray-700/40 focus:border-indigo-500/30 p-3.5 text-sm text-gray-300 placeholder-gray-700 focus:outline-none resize-none transition"
            />

            {/* Debug data toggle */}
            <div>
              <button
                onClick={() => setShowDebug(d => !d)}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition"
              >
                <span className="font-mono">{showDebug ? '▾' : '▸'}</span>
                Debug snapshot (voice_weights, maturity)
              </button>
              {showDebug && (
                <pre className="mt-2 bg-black/60 rounded-xl border border-gray-800 p-3 text-[10px] font-mono text-gray-500 overflow-auto max-h-40">
                  {JSON.stringify(getDebugSnapshot(), null, 2)}
                </pre>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={copyReport}
                disabled={!description.trim()}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  copied
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-indigo-500/15 hover:bg-indigo-500/25 border-indigo-500/25 text-indigo-400'
                }`}
              >
                {copied ? '✓ Copied to clipboard' : 'Copy Report'}
              </button>
              <button onClick={close}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-700/50 text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
