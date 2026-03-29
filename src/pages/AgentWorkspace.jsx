import { useState } from 'react'
import IconStrip from '../components/workspace/IconStrip'
import DNALab from '../components/workspace/DNALab'
import CommandCenter from '../components/workspace/CommandCenter'
import WorkspaceCanvas from '../components/workspace/WorkspaceCanvas'
import SystemFooter from '../components/workspace/SystemFooter'

export default function AgentWorkspace() {
    const [showGhost, setShowGhost] = useState(false)
    const [isSystemLogOpen, setIsSystemLogOpen] = useState(false)
    const [isHeatmapActive, setIsHeatmapActive] = useState(false)
    const [bridgeAction, setBridgeAction] = useState(null)
    const [isDNALabOpen, setIsDNALabOpen] = useState(false)
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
        setMaturity(prev => Math.min(100, prev + 0.5))
        addLog('system', 'System', `Framework Applied: ${framework.name}`, 'Recalculating DNA sequence...', 'emerald')
    }

    const handlePortContent = (platform) => {
        setBridgeAction(platform)
        // Reset the action quickly so it can be re-triggered
        setTimeout(() => setBridgeAction(null), 100)
    }

    return (
        <div className="flex flex-col h-screen w-full bg-[#050505] text-[#e6edf3] font-sans overflow-hidden">
            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
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
                <CommandCenter bridgeAction={bridgeAction} />
                <WorkspaceCanvas
                    showGhost={showGhost}
                    setShowGhost={setShowGhost}
                    onPortContent={handlePortContent}
                    isHeatmapActive={isHeatmapActive}
                    activeTraits={Object.entries(traits).filter(([_, v]) => v > 0).map(([k]) => k)}
                />
            </div>

            {/* Footer Area */}
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
