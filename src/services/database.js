// ─── database.js ─────────────────────────────────────────────────────────────
// localStorage abstraction with a Supabase-ready interface.
//
// To migrate to Supabase, replace each localStorage call with the
// corresponding supabase.from('table').insert/select/delete call and
// remove the localStorage helpers. The function signatures stay the same.
//
// Supabase schema (reference):
//
//   posts:
//     id          bigint primary key default now()
//     content     text not null
//     platform    text
//     fingerprint jsonb
//     authenticity_score int
//     created_at  timestamptz default now()
//
//   edit_diffs:
//     id          serial primary key
//     slop_removed text[]
//     slang_added  text[]
//     edit_ratio   float
//     word_delta   float
//     created_at   timestamptz default now()
//
//   profiles:
//     user_id     text primary key
//     name        text
//     x_handle    text
//     dna_controls jsonb
//     updated_at  timestamptz default now()

const POSTS_KEY   = 'kreation_vector_store'
const DIFFS_KEY   = 'kreation_edit_diffs'
const PROFILE_KEY = 'kreation_profile'

// ─── Posts ────────────────────────────────────────────────────────────────────

export function getPosts({ platform } = {}) {
  try {
    const all = JSON.parse(localStorage.getItem(POSTS_KEY) || '[]')
    return platform ? all.filter(p => p.platform === platform) : all
  } catch { return [] }
}

export function insertPost(post) {
  const posts = getPosts()
  const entry = { ...post, id: post.id ?? Date.now(), timestamp: post.timestamp ?? Date.now() }
  const updated = [...posts, entry].slice(-50) // keep last 50
  localStorage.setItem(POSTS_KEY, JSON.stringify(updated))
  return entry
}

export function deletePost(id) {
  const posts = getPosts()
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts.filter(p => p.id !== id)))
}

// ─── Edit diffs ───────────────────────────────────────────────────────────────

export function getDiffs() {
  try { return JSON.parse(localStorage.getItem(DIFFS_KEY) || '[]') } catch { return [] }
}

export function insertDiff(diff) {
  const diffs = getDiffs()
  const entry = { ...diff, id: Date.now(), timestamp: Date.now() }
  localStorage.setItem(DIFFS_KEY, JSON.stringify([...diffs, entry].slice(-200)))
  return entry
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function getDbProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') } catch { return {} }
}

export function upsertProfile(data) {
  const existing = getDbProfile()
  const updated  = { ...existing, ...data, updated_at: new Date().toISOString() }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated))
  return updated
}
