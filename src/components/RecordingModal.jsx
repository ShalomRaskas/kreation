import { useNavigate } from 'react-router-dom'

export default function RecordingModal({ script, platform, onClose }) {
  const navigate = useNavigate()

  const lines = script ? script.split('\n') : []

  const handleUpload = () => {
    navigate('/editor')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0f0f0f] flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
        <span className="text-sm font-bold text-white">Script</span>
        {platform && (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-gray-400">
            {platform}
          </span>
        )}
        <button
          onClick={onClose}
          className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* ── Script ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-white/30">Your Script</span>
            {platform && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-white/30">
                {platform}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {lines.map((line, i) => (
              <p key={i} className="text-xl leading-relaxed font-medium text-white/90">
                {line || '\u00A0'}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-white/[0.06] px-8 py-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Record this naturally</h2>
            <p className="text-sm text-white/40 mt-1">
              Don't read word for word — use this as your guide. Record on your phone or camera, then upload the footage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-sm text-white/40 hover:text-white transition-all px-5 py-2.5 rounded-xl border border-white/[0.06] hover:border-white/20"
            >
              ← Back
            </button>
            <button
              onClick={handleUpload}
              className="flex-1 bg-white hover:bg-white/90 text-black text-sm font-bold py-2.5 rounded-xl transition-all"
            >
              Done recording → Upload footage
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
