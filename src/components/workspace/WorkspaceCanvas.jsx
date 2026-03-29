import { useState } from 'react'
import CanvasTabs from './CanvasTabs'
import GhostEditor from './GhostEditor'
import TraitTelemetry from './TraitTelemetry'

export default function WorkspaceCanvas({ showGhost, setShowGhost, onPortContent, isHeatmapActive, activeTraits = [] }) {
    const [isPreviewMode, setIsPreviewMode] = useState(false)
    const [typingPulse, setTypingPulse] = useState(false)

    // Simulate the 'Neural Thread' pinging the Trait Telemetry when the user types
    const handleEditorInput = () => {
        setTypingPulse(true)
        setTimeout(() => setTypingPulse(false), 300)
    }

    return (
        <div className="flex-1 bg-[#050505] flex flex-col relative overflow-hidden">
            {/* Subtle Background glows for aesthetics */}
            <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none" />

            <TraitTelemetry activeTraits={activeTraits} typingPulse={typingPulse} />
            <CanvasTabs
                showGhost={showGhost}
                setShowGhost={setShowGhost}
                onPortContent={onPortContent}
                isPreviewMode={isPreviewMode}
                setIsPreviewMode={setIsPreviewMode}
            />
            <GhostEditor
                showGhost={showGhost}
                isPreviewMode={isPreviewMode}
                isHeatmapActive={isHeatmapActive}
                onEditorInput={handleEditorInput}
            />
        </div>
    )
}
