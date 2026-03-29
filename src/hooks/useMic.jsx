import { useState, useRef } from 'react'

export function useMic(onTranscriptUpdate, onStop) {
  const recRef       = useRef(null)
  const committedRef = useRef('')
  const [active, setActive] = useState(false)

  const toggle = (baseText = '') => {
    if (active) { recRef.current?.stop(); return }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return null

    committedRef.current = ''
    const r = new SR()
    r.continuous = true; r.interimResults = true; r.lang = 'en-US'

    r.onresult = (e) => {
      let committed = '', interim = ''
      for (let i = 0; i < e.results.length; i++) {
        e.results[i].isFinal
          ? (committed += e.results[i][0].transcript + ' ')
          : (interim  += e.results[i][0].transcript)
      }
      committedRef.current = committed
      onTranscriptUpdate(baseText + committed + interim)
    }
    r.onend  = () => { setActive(false); onStop(baseText + committedRef.current.trimEnd()) }
    r.onerror = (e) => { setActive(false); if (e.error !== 'no-speech') onStop('__error__') }

    recRef.current = r
    r.start()
    setActive(true)
    return true
  }

  return { active, toggle }
}

export function MicButton({ active, onClick, size = 'sm' }) {
  const sm = size === 'sm'
  return (
    <button onClick={onClick} title={active ? 'Stop' : 'Record'}
      className={`relative flex items-center justify-center rounded-full transition-all duration-200 flex-shrink-0 ${
        sm ? 'w-10 h-10' : 'w-24 h-24'
      } ${active
        ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
        : sm
          ? 'bg-gray-700/60 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-600/50'
          : 'bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white border border-gray-600/50 shadow-xl hover:shadow-2xl hover:scale-105'
      }`}>
      {active && <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40"></span>}
      <svg className={`relative z-10 ${sm ? 'w-4 h-4' : 'w-10 h-10'}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1a4 4 0 014 4v6a4 4 0 01-8 0V5a4 4 0 014-4zm0 2a2 2 0 00-2 2v6a2 2 0 004 0V5a2 2 0 00-2-2zm-1 15.93V21h2v-2.07A8.001 8.001 0 0020 11h-2a6 6 0 01-12 0H4a8.001 8.001 0 007 7.93z"/>
      </svg>
    </button>
  )
}
