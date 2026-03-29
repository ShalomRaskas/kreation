import { NavLink } from 'react-router-dom'
import { getProfile } from '../services/dnaControls'
import FeedbackButton from './FeedbackButton'

const NAV_ITEMS = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    end: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    path: '/create',
    label: 'Create content',
    end: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
    ),
  },
  {
    path: '/library',
    label: 'Content library',
    end: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    path: '/editor',
    label: 'Video Editor',
    end: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
  },
  {
    path: '/dna',
    label: 'Voice profile',
    end: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
      </svg>
    ),
  },
  {
    path: '/analytics',
    label: 'Analytics',
    end: false,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
      </svg>
    ),
  },
]

const NAV_BASE   = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all'
const NAV_IDLE   = 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-white/[0.04]'
const NAV_ACTIVE = 'bg-indigo-500/10 text-indigo-300'

export default function Layout({ children, bare = false }) {
  const profile = getProfile()
  const name = profile.name || 'Shalom'
  const nameWords = name.trim().split(' ')
  const initials = nameWords.length > 1
    ? (nameWords[0][0] + nameWords[nameWords.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen bg-[#0a0a0f]">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside style={{ width: 240, background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
        className="shrink-0 flex flex-col">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-base leading-none">K</span>
          </div>
          <span style={{ color: '#f4f4f5', fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>Kreation</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 flex flex-col">
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `${NAV_BASE} ${isActive ? NAV_ACTIVE : NAV_IDLE}`}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Connected */}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: '#52525b', fontSize: 11, letterSpacing: '0.05em' }}
              className="uppercase px-3 mb-2 font-medium">Connected</p>
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span style={{ color: '#a1a1aa', fontSize: 13 }}>Twitter/X</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span style={{ color: '#a1a1aa', fontSize: 13 }}>LinkedIn</span>
            </div>
          </div>
        </nav>

        {/* User profile */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}
          className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: '#e4e4e7', fontSize: 13, fontWeight: 500 }} className="truncate">{name}</p>
            <p style={{ color: '#52525b', fontSize: 11 }}>Free plan</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
          </svg>
        </div>

      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      {bare ? (
        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      ) : (
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1200px] mx-auto px-8 py-8">
            {children}
          </div>
        </main>
      )}

      <FeedbackButton />
    </div>
  )
}
