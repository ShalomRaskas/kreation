import { callClaude } from './voiceSync'

const STORE_KEY = 'kreation_vector_store'
const DNA_KEY   = 'kreation_learned_dna'
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000

// ─── localStorage helpers ────────────────────────────────────────────────────

function getStore() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]') } catch { return [] }
}
function saveStore(posts) {
  localStorage.setItem(STORE_KEY, JSON.stringify(posts))
}
function getLearnedDNA() {
  try { return JSON.parse(localStorage.getItem(DNA_KEY) || '[]') } catch { return [] }
}
function saveLearnedDNA(entries) {
  localStorage.setItem(DNA_KEY, JSON.stringify(entries))
}

// ─── Semantic fingerprint (Claude extracts key concepts) ─────────────────────

async function extractFingerprint(text) {
  const snippet = text.slice(0, 700)
  const response = await callClaude(
    'You are a semantic analyzer. Extract key themes from content.',
    `Extract 5–8 key themes/concepts from this content. Return ONLY a JSON array of short strings (2–4 words each):\n\n${snippet}`,
    200
  )
  try {
    const match = response.match(/\[[\s\S]*?\]/)
    return match ? JSON.parse(match[0]) : []
  } catch { return [] }
}

// ─── Publish: store a successful post ────────────────────────────────────────

export async function publishPost(content, platform, onLog, authenticityScore = null) {
  const log = e => onLog && onLog(e)
  log({ type: 'LEARN', message: 'Extracting semantic fingerprint...' })

  const fingerprint = await extractFingerprint(content)
  const store = getStore()
  store.push({ id: Date.now(), content, platform, fingerprint, timestamp: Date.now(), authenticityScore })
  saveStore(store.slice(-50)) // keep last 50

  log({ type: 'SYNC', message: `Stored. Fingerprint: ${fingerprint.slice(0, 3).join(', ')}` })
  log({ type: 'EVOLVE', message: `Vector store: ${store.length} post(s) indexed.` })
}

// ─── Retrieval with DNA Drift (recency bias) ──────────────────────────────────

export function retrieveSimilarPosts(topic, limit = 5) {
  const store = getStore()
  if (store.length === 0) return []

  const topicWords = topic.toLowerCase().split(/\W+/).filter(w => w.length > 3)
  const now = Date.now()

  const scored = store.map(post => {
    const fp = post.fingerprint.join(' ').toLowerCase()
    const overlap = topicWords.filter(w => fp.includes(w)).length
    // DNA Drift: 1.5× weight for posts within the last 90 days (3 months)
    const recency = (now - post.timestamp) <= NINETY_DAYS ? 1.5 : 1.0
    // Performance boost: higher authenticity score = better template (0.6–1.4× range)
    const perf = post.authenticityScore != null ? 0.6 + (post.authenticityScore / 100) * 0.8 : 1.0
    return { post, score: overlap * recency * perf }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.post)
}

// ─── Edit delta analysis → extract learned preference ────────────────────────

export async function analyzeDelta(before, after, onLog) {
  const log = e => onLog && onLog(e)

  // Skip trivial edits
  if (Math.abs(before.length - after.length) < 4 && before === after) return

  log({ type: 'LEARN', message: 'Analyzing edit delta...' })

  const response = await callClaude(
    'You are a linguistic preference extractor. Analyze text edits to understand user voice preferences.',
    `The user manually edited their generated content. Analyze what this reveals about their writing style.

BEFORE: "${before.slice(0, 400)}"
AFTER:  "${after.slice(0, 400)}"

Return ONLY valid JSON:
{"preference":"One sentence: what does this edit reveal about their voice/style?","type":"word_choice"|"rhythm"|"tone"|"structure","removed":"exact word or phrase removed, or null","added":"exact word or phrase added, or null"}`,
    200
  )

  let result = null
  try {
    const match = response.match(/\{[\s\S]*\}/)
    if (match) result = JSON.parse(match[0])
  } catch { return }

  if (!result) return

  // Persist to learned DNA
  const learned = getLearnedDNA()
  learned.push({ ...result, timestamp: Date.now() })
  saveLearnedDNA(learned.slice(-100))

  // Specific learning pulse logs
  if (result.removed) {
    log({ type: 'LEARN', message: `User manually removed '${result.removed}'. Adding to personal slop-list.` })
  }
  if (result.type === 'rhythm') {
    log({ type: 'SYNC', message: `Updating Syntax Rhythm: ${result.preference}` })
  } else if (result.type === 'word_choice' && result.added) {
    log({ type: 'SYNC', message: `Updating Syntax Rhythm: User is using shorter sentences today.` })
  }

  return result
}

// ─── Surface learned DNA for system prompt injection ─────────────────────────

export function getLearnedContext() {
  const learned = getLearnedDNA()
  if (learned.length === 0) return ''
  // Most recent 8 preferences
  return learned
    .slice(-8)
    .map(l => l.preference)
    .join(' | ')
}

export function getStoreCount() {
  return getStore().length
}
