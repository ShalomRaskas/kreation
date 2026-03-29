import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import CreatePage from './pages/CreatePage'
import LibraryPage from './pages/LibraryPage'
import AnalyticsPage from './pages/AnalyticsPage'
import DNALabPage from './pages/DNALabPage'
import SettingsPage from './pages/SettingsPage'
import AgentWorkspace from './pages/AgentWorkspace'
import OmniAgentPage from './pages/OmniAgentPage'
import VoiceFilterPage from './pages/VoiceFilterPage'
import EditorPage from './pages/EditorPage'

export default function App() {
  return (
    <Routes>
      {/* Full-screen workspaces */}
      <Route path="/voice-filter" element={<VoiceFilterPage />} />
      <Route path="/omni" element={<OmniAgentPage />} />
      <Route path="/omni-agent" element={<OmniAgentPage />} />
      <Route path="/workspace" element={<AgentWorkspace />} />

      {/* Standard Layout */}
      <Route path="*" element={
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/editor" element={<EditorPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/dna" element={<DNALabPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  )
}
