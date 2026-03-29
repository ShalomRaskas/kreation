import { useState } from 'react'
import OmniChat from '../components/OmniChat'
import OmniCanvas from '../components/OmniCanvas'
import IconStrip from '../components/workspace/IconStrip'
import DNALab from '../components/workspace/DNALab'
import SystemFooter from '../components/workspace/SystemFooter'

export default function OmniAgentPage() {
    const [syncStatus, setSyncStatus] = useState('idle') // idle, thinking, generating

    const [isDNALabOpen, setIsDNALabOpen] = useState(false)
    const [isSystemLogOpen, setIsSystemLogOpen] = useState(false)
    const [isHeatmapActive, setIsHeatmapActive] = useState(false)
    const [structureType, setStructureType] = useState('POST') // POST, SCRIPT, THREAD
    const [traits, setTraits] = useState({
        sarcasm: 40,
        jargon: 0,
        brevity: 0,
        spiciness: 60
    })
    const [maturity, setMaturity] = useState(75)
    const [logs, setLogs] = useState([
        { id: 1, type: 'system', timestamp: '14:22:01.004', label: 'System', content: 'Sarcasm match: 99.1%', subContent: 'Maturity score up +0.2%', color: 'emerald' },
        { id: 2, type: 'agent', timestamp: '14:21:58.892', label: 'Agent', content: 'Recalculating Trait Weights', subContent: 'Active Edit detected in [OVERLAY TEXT]...', color: 'indigo' }
    ])

    const [canvasContent, setCanvasContent] = useState({
        twitter: "AI isn't changing how we build software—it's replacing the builder entirely. Adapt or get cooked. The agentic era is here.",
        tiktok: [
            { time: '0:00s', label: 'HOOK', text: 'AI isn\'t changing how we build software. It\'s replacing the builder entirely.', type: 'video' },
            { time: '0:03s', label: 'BODY', text: 'Adapt or get cooked. The agentic era is here and it\'s moving faster than anyone realizes.', type: 'audio' },
            { time: '0:12s', label: 'CTA', text: 'Drop a 🚀 in the comments if you are building with agents today.', type: 'text' }
        ],
        thread: [
            { id: 1, title: 'THE DEPLOYMENT PARADIGM', content: 'Legacy builders are still manual. The agentic era is auto-scaling intelligence. If you aren\'t deploying agents, you aren\'t building.' },
            { id: 2, title: 'THE COLD START PROBLEM', content: 'Most startups fail because of the context gap. Our long-term memory layer solves the cold start overnight.' },
            { id: 3, title: 'KREATION V1.0', content: 'We are open-sourcing the future of agentic content production today.' }
        ]
    })

    const addLog = (type, label, content, subContent, color) => {
        const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        setLogs(prev => [{
            id: Date.now(),
            type,
            timestamp,
            label,
            content,
            subContent,
            color
        }, ...prev].slice(0, 50))
    }

    const handleTraitChange = (id, value) => {
        setTraits(prev => ({ ...prev, [id]: value }))
        setMaturity(prev => Math.min(100, prev + 0.1))
        addLog('system', 'System', 'Voice DNA Updated.', 'Recalculating Authenticity Match...', 'emerald')
    }

    const handleSelectFramework = (framework) => {
        setTraits(prev => ({ ...prev, ...framework.traits }))
        if (framework.structureType) setStructureType(framework.structureType)
        setMaturity(prev => Math.min(100, prev + 0.5))
        addLog('system', 'System', `Framework Applied: ${framework.name}`, 'Recalculating DNA sequence...', 'emerald')
    }

    const analyzeTone = (text) => {
        const lowerText = text.toLowerCase()
        let adjustments = {}

        // Jargon markers
        if (lowerText.match(/build|stack|deploy|frontend|backend|ai|ml|startup|latency|paradigm|agentic/)) {
            adjustments.jargon = Math.min(100, traits.jargon + 15)
        }

        // Spiciness markers
        if (lowerText.match(/\!|replace|cooked|collapse|alpha|death|destroyed/)) {
            adjustments.spiciness = Math.min(100, traits.spiciness + 10)
        }

        // Brevity markers
        if (text.length < 50) {
            adjustments.brevity = Math.min(100, traits.brevity + 10)
        } else if (text.length > 150) {
            adjustments.brevity = Math.max(0, traits.brevity - 10)
        }

        if (lowerText.includes("frontend") && lowerText.includes("backend") && lowerText.includes("kreation")) {
            addLog('agent', 'Omni-Agent', 'Engineered Draft Generated.', 'Applying Builder Jargon + High Brevity.', 'emerald')
            setCanvasContent(prev => ({
                ...prev,
                twitter: "Building the high-performance stack for the agentic era. 𝕏 protocol + [KREATION] long-term memory layer. Frontend/Backend doesn't exist anymore—only [DEPLOYMENT] remains. ≫ adapt or get cooked.",
                thread: [
                    { id: 1, title: 'THE KREATION PARADIGM', content: 'Frontend, Backend, AI/ML—we are merging the stack into a single agentic runtime. Kreation isn\'t a tool; it\'s the new builder standard.' },
                    { id: 2, title: 'SCALING INTELLIGENCE', content: 'Startups are moving from code-first to logic-first. Our context-bridge is the backbone for 2026 deployment.' },
                    { id: 3, title: 'JOIN THE SYNC', content: 'We are building the infrastructure for the witnessed collapse of manual workflows.' }
                ]
            }))
            setTraits(prev => ({ ...prev, brevity: 90, jargon: 85 }))
            setStructureType('POST')
        }

        if (Object.keys(adjustments).length > 0) {
            setTraits(prev => ({ ...prev, ...adjustments }))
            addLog('agent', 'Shadow Learner', 'Neural Morph detected.', 'Syncing user tone to DNA sliders...', 'indigo')
        }
    }

    const handleCanvasEdit = (tab, idx, newText) => {
        // Shadow Learning on edits
        const oldText = tab === 'twitter' ? canvasContent.twitter : (tab === 'tiktok' ? canvasContent.tiktok[idx].text : canvasContent.thread[idx].content)
        const wordCountDelta = Math.abs(newText.split(' ').length - oldText.split(' ').length)

        if (wordCountDelta > 0) {
            const increment = (wordCountDelta / 10) * 0.1
            setMaturity(prev => Math.min(100, prev + increment))
            setIsHeatmapActive(true)
            addLog('system', 'System', 'ACTIVE EDIT detected.', `Maturity increased by +${increment.toFixed(2)}%`, 'emerald')
            setTimeout(() => setIsHeatmapActive(false), 2000)
        }

        // Update content state
        setCanvasContent(prev => {
            if (tab === 'twitter') return { ...prev, twitter: newText }
            if (tab === 'tiktok') {
                const newTiktok = [...prev.tiktok]
                newTiktok[idx].text = newText
                return { ...prev, tiktok: newTiktok }
            }
            if (tab === 'thread') {
                const newThread = [...prev.thread]
                newThread[idx].content = newText
                return { ...prev, thread: newThread }
            }
            return prev
        })
    }

    return (
        <div className="flex flex-col h-screen bg-[#02040a] text-[#f0f6fc] font-sans overflow-hidden mesh-gradient">
            {/* Main Workspace Frame */}
            <div className="flex flex-1 overflow-hidden relative m-4 rounded-[2rem] border border-white/10 glass-panel shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] fade-in">
                <IconStrip
                    onToggleDNALab={() => setIsDNALabOpen(!isDNALabOpen)}
                    isDNALabOpen={isDNALabOpen}
                />

                {isDNALabOpen && (
                    <DNALab
                        traits={traits}
                        onTraitChange={handleTraitChange}
                        onSelectFramework={handleSelectFramework}
                    />
                )}

                {/* Left Pane: Omni-Agent Chat (40%) */}
                <div className="w-[40%] bg-white/[0.01] border-r border-white/5 flex flex-col relative z-20 backdrop-blur-3xl">
                    <OmniChat onStatusChange={setSyncStatus} traits={traits} onAnalyzeTone={analyzeTone} />
                </div>

                {/* Right Pane: Omni-Canvas (60%) */}
                <div className="w-[60%] flex flex-col relative overflow-hidden z-10 bg-black/10">
                    <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#0A84FF]/5 rounded-full blur-[150px] animate-pulse pointer-events-none" />
                    <div className="absolute bottom-[-5%] right-[-5%] w-[50%] h-[50%] bg-[#10B981]/5 rounded-full blur-[130px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

                    <OmniCanvas
                        isHeatmapActive={isHeatmapActive}
                        activeTraits={Object.entries(traits).filter(([_, v]) => v > 0).map(([k]) => k)}
                        structureType={structureType}
                        canvasContent={canvasContent}
                        onCanvasEdit={handleCanvasEdit}
                    />
                </div>
            </div>

            {/* Sync Status Footer - The Fluid Beam */}
            <div className="mx-8 h-[2px] bg-white/5 relative overflow-hidden flex-shrink-0">
                {syncStatus === 'thinking' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0A84FF] to-transparent bg-[length:200%_100%] animate-plasma opacity-80 shadow-[0_0_15px_#0A84FF]" />
                )}
                {syncStatus === 'generating' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#10B981] to-transparent bg-[length:200%_100%] animate-plasma shadow-[0_0_15px_#10B981]" />
                )}
            </div>

            <SystemFooter
                isSystemLogOpen={isSystemLogOpen}
                setIsSystemLogOpen={setIsSystemLogOpen}
                isHeatmapActive={isHeatmapActive}
                setIsHeatmapActive={setIsHeatmapActive}
                maturity={maturity}
                logs={logs}
            />
        </div>
    )
}

