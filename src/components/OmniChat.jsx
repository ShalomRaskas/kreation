import { useState, useEffect, useRef } from 'react'
import { getVoiceMaturity } from '../services/longTermMemory'

// Helper component for typewriter effect with subtle cursor
function TypewriterText({ text, onComplete, speed = 15 }) {
    const [displayed, setDisplayed] = useState('')

    useEffect(() => {
        let i = 0
        setDisplayed('')
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayed(prev => prev + text.charAt(i))
                i++
            } else {
                clearInterval(timer)
                if (onComplete) onComplete()
            }
        }, speed)
        return () => clearInterval(timer)
    }, [text, speed, onComplete])

    return (
        <span className="relative">
            {displayed}
            <span className="inline-block w-1 h-3.5 ml-0.5 bg-emerald-500/60 shadow-[0_0_8px_#10B981] animate-pulse align-middle" />
        </span>
    )
}

export default function OmniChat({ onStatusChange, traits, onAnalyzeTone }) {
    const [step, setStep] = useState('extraction')
    const [messages, setMessages] = useState([
        { role: 'agent', text: 'INITIATING OMNI-AGENT CONNECTION...', typed: false },
        { role: 'agent', text: 'CONNECTION ESTABLISHED. Voice Sync Active.', typed: false },
        { role: 'agent', text: 'What is the "Spark" (Core Idea) for today\'s content?', id: 'step1' }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(true)
    const [spark, setSpark] = useState('')
    const [platforms, setPlatforms] = useState('')
    const endRef = useRef(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isTyping])

    const addAgentMessage = (text, id = Date.now().toString(), overrideTyping = false) => {
        setIsTyping(true)
        onStatusChange('thinking')

        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'agent', text, id }])
            if (!overrideTyping) onStatusChange('idle')
        }, 800)
    }

    const handleSend = () => {
        if (!input.trim() || isTyping) return
        const userText = input.trim()
        setMessages(prev => [...prev, { role: 'user', text: userText }])
        setInput('')

        // Shadow Learner: Analyze Tone
        if (onAnalyzeTone) onAnalyzeTone(userText)

        if (step === 'extraction') {
            setSpark(userText)
            setStep('formatting')
            addAgentMessage('Spark captured. Which target platforms are we rendering for? (e.g. X, TikTok, LinkedIn)')
        }
        else if (step === 'formatting') {
            const p = userText.toLowerCase()
            setPlatforms(p)
            setStep('strategy')

            const maturity = getVoiceMaturity()
            let stratText = `Strategy locked. Current Voice Maturity is ${maturity}%. Syncing traits: [SARCASM], [SPICINESS], [JARGON]. `

            if (p.includes('tiktok')) {
                stratText += `\n\n>> TIKTOK DETECTED: Automatically boosting 'Spiciness' and 'Jargon' weights by +20% for platform optimization.`
            }

            stratText += `\n\nGenerating content with aggressive structural hooks to compensate for low DNA confidence.`

            addAgentMessage(stratText, 'strat', true)

            setTimeout(() => {
                setStep('done')
                onStatusChange('generating')
            }, 4000)
        }
    }

    return (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden inner-glow">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-black/20 backdrop-blur-xl sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0A84FF] shadow-[0_0_12px_#0A84FF] animate-pulse" />
                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#0A84FF] blur-[4px] animate-ping" />
                    </div>
                    <span className="text-[10px] font-mono tracking-[0.2em] text-white/90 uppercase">Omni-Agent Node</span>
                </div>
                <div className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-[9px] font-mono text-white/40 tracking-widest uppercase">
                    v2026.4.2
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-36">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} fade-in`} style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="flex items-center gap-2 mb-2 opacity-40">
                            <span className="text-[8px] font-mono uppercase tracking-[0.2em]">
                                {msg.role === 'agent' ? 'Cognitive Output' : 'User Query'}
                            </span>
                        </div>

                        <div className={`
                            max-w-[85%] rounded-[1.5rem] p-5 text-[13px] font-mono leading-relaxed transition-all duration-500 glass-panel hover:bg-white/[0.03]
                            ${msg.role === 'user'
                                ? 'bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-50/90 rounded-tr-none shadow-[0_8px_32px_-8px_rgba(16,185,129,0.1)]'
                                : 'text-white/80 rounded-tl-none shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]'}
                        `}>
                            {msg.role === 'agent' && msg.id && idx === messages.length - 1 ? (
                                <TypewriterText
                                    text={msg.text}
                                    onComplete={() => setIsTyping(false)}
                                />
                            ) : (
                                <span className="whitespace-pre-wrap">{msg.text}</span>
                            )}
                        </div>
                    </div>
                ))}

                {isTyping && messages[messages.length - 1].role === 'user' && (
                    <div className="flex items-center gap-3 text-[#0A84FF] p-5 opacity-80">
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] animate-bounce" />
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-widest animate-pulse">Processing...</span>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input Area */}
            <div className="absolute w-full bottom-0 p-8 bg-gradient-to-t from-[#02040a] via-[#02040a]/95 to-transparent pt-20 z-20">
                <div className="relative group max-w-2xl mx-auto">
                    {/* Thinking Aura / Neural Ring */}
                    <div className={`absolute -inset-[3px] bg-gradient-to-r from-emerald-500/20 via-[#0A84FF]/20 to-emerald-500/20 rounded-[1.5rem] blur-xl transition-all duration-1000 ${isTyping ? 'opacity-100 scale-105 animate-pulse' : 'opacity-0 scale-100'}`} />

                    {/* Focus Glow */}
                    <div className={`absolute -inset-[1px] bg-gradient-to-r from-[#0A84FF]/40 to-emerald-500/40 rounded-[1.5rem] transition-opacity duration-500 ${input ? 'opacity-100' : 'opacity-0 group-focus-within:opacity-40'}`} />

                    <div className="relative flex items-center bg-[#080a0f]/80 border border-white/10 rounded-[1.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            disabled={isTyping || step === 'done'}
                            placeholder={step === 'done' ? "Generation in progress..." : "Synchronize thoughts..."}
                            className="w-full bg-transparent px-6 py-5 text-sm font-mono text-white placeholder-white/20 focus:outline-none transition-all disabled:opacity-30"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping || step === 'done'}
                            className="px-6 py-5 text-[#0A84FF] hover:bg-white/[0.05] disabled:opacity-20 transition-all border-l border-white/5"
                        >
                            <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

