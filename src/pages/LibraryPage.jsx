import { useState } from 'react'
import { getPosts, deletePost } from '../services/database'

const PLATFORM_COLORS = {
  tiktok:   'bg-pink-500/10 border-pink-500/20 text-pink-400',
  reels:    'bg-purple-500/10 border-purple-500/20 text-purple-400',
  shorts:   'bg-red-500/10 border-red-500/20 text-red-400',
  twitter:  'bg-sky-500/10 border-sky-500/20 text-sky-400',
  linkedin: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
}

const PLATFORM_ICONS = {
  tiktok:   '♪',
  reels:    '◈',
  shorts:   '▶',
  twitter:  '𝕏',
  linkedin: 'in',
}

const FILTERS = ['all', 'tiktok', 'reels', 'shorts', 'twitter', 'linkedin']

function PostCard({ post, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copied, setCopied] = useState(false)

  const date = new Date(post.timestamp).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  const colorClass = PLATFORM_COLORS[post.platform] || 'bg-gray-500/10 border-gray-500/20 text-gray-400'

  const handleCopy = () => {
    navigator.clipboard.writeText(post.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${colorClass}`}>
            {PLATFORM_ICONS[post.platform] || '?'} {post.platform}
          </span>
          {post.authenticityScore != null && (
            <span className="text-[11px] font-mono text-gray-600">
              {post.authenticityScore}% DNA
            </span>
          )}
        </div>
        <span className="text-[11px] text-gray-700 font-mono flex-shrink-0">{date}</span>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed line-clamp-4 font-mono whitespace-pre-wrap">
        {post.content}
      </p>

      {post.fingerprint?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {post.fingerprint.slice(0, 4).map((tag, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] text-gray-600 rounded-md font-mono">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
        <button
          onClick={handleCopy}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${
            copied
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-gray-500 hover:text-gray-300'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
        {confirmDelete ? (
          <>
            <button
              onClick={() => { onDelete(post.id); setConfirmDelete(false) }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 transition-all"
            >
              Confirm delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-gray-600 hover:text-gray-400 transition-all"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="ml-auto text-xs text-gray-700 hover:text-red-400 transition-all"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}

export default function LibraryPage() {
  const [filter, setFilter] = useState('all')
  const [posts,  setPosts]  = useState(() => getPosts())

  const filtered = filter === 'all' ? posts : posts.filter(p => p.platform === filter)
  const sorted   = [...filtered].sort((a, b) => b.timestamp - a.timestamp)

  const handleDelete = (id) => {
    deletePost(id)
    setPosts(getPosts())
  }

  return (
    <div className="flex flex-col gap-6 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-100">Library</h1>
          <p className="text-sm text-gray-600 mt-0.5">{posts.length} post{posts.length !== 1 ? 's' : ''} in vector memory</p>
        </div>
      </div>

      {/* Platform filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all capitalize ${
              filter === f
                ? 'bg-emerald-500/[0.12] border-emerald-500/20 text-emerald-400'
                : 'border-white/[0.06] text-gray-600 hover:text-gray-300 hover:bg-white/[0.05]'
            }`}
          >
            {f === 'twitter' ? '𝕏 Twitter' : f === 'all' ? 'All' : (PLATFORM_ICONS[f] || '') + ' ' + f}
          </button>
        ))}
      </div>

      {/* Posts grid */}
      {sorted.length === 0 ? (
        <div className="glass-panel rounded-2xl flex flex-col items-center justify-center gap-4 py-20 opacity-40">
          <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <p className="text-sm text-gray-600">
            {filter === 'all' ? 'No posts yet. Create and publish content to build your library.' : `No ${filter} posts yet.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(post => (
            <PostCard key={post.id} post={post} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
