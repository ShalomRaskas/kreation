import voiceProfile from '../data/voiceProfile.json'
import slopList from '../data/global_slop_list.json'
import userDNA from '../data/user_voice_dna.json'

// ─── Shared API call ──────────────────────────────────────────────────────────

export async function callClaude(system, userMessage, maxTokens = 1024) {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`)
  return data.content[0].text
}

// ─── Enhanced system prompt (DNA-injected) ────────────────────────────────────

export function buildDNASystem() {
  const tone    = voiceProfile.tone || 'Authentic, energetic, unfiltered'
  const vocab   = voiceProfile.vocabulary?.join(', ') || 'natural vernacular'
  const rules   = voiceProfile.rules?.join(' | ') || 'Be direct and authentic'
  const scripts = voiceProfile.pastScripts?.length
    ? voiceProfile.pastScripts.map((s, i) => `[Script ${i+1} — ${s.topic}]\n${s.script}`).join('\n\n')
    : 'None yet — infer the voice from tone and rules.'
  const jargon = userDNA.jargon.join(', ')
  const structures = userDNA.sentence_structures.join(' | ')
  const slopBan = slopList.forbidden_words.join(', ')
  const openerBan = slopList.forbidden_openers.join(' | ')

  return `You are a content writer matching an exact human voice. Never polish. Never generalise.

TONE: ${tone}
VOCABULARY PATTERNS: ${vocab}
WRITING RULES: ${rules}
PAST SCRIPTS (rhythm guides): ${scripts}

USER JARGON TO INJECT (use these naturally): ${jargon}
SENTENCE STRUCTURES (match these patterns): ${structures}
ENERGY PATTERN: ${userDNA.energy_pattern}

HARD-BAN (never use): ${slopBan}
FORBIDDEN OPENERS: ${openerBan}
AVOID IN OUTPUT: ${userDNA.avoid_in_output.join(', ')}

CRITICAL: Write exactly as this person speaks — raw, self-correcting, looping. Not cleaner. Not more polished.`
}

// ─── Authenticity score (local, instant, no API) ─────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function calculateAuthenticityScore(text) {
  if (!text || text.length < 10) return { score: 0, log: [] }
  const lower = text.toLowerCase()
  const log = []
  let score = 55 // baseline

  // Slop word penalty
  const slopFound = slopList.forbidden_words.filter(w =>
    new RegExp(`\\b${escapeRegex(w)}\\b`, 'i').test(lower)
  )
  if (slopFound.length > 0) {
    const penalty = Math.min(slopFound.length * 10, 35)
    score -= penalty
    log.push({ type: 'CLEAN', message: `Removed ${slopFound.length} generic adjective(s): ${slopFound.slice(0, 3).join(', ')}` })
  }

  // Generic adjective penalty
  const adjFound = slopList.generic_adjectives.filter(w =>
    new RegExp(`\\b${escapeRegex(w)}\\b`, 'i').test(lower)
  )
  if (adjFound.length > 0) {
    score -= Math.min(adjFound.length * 5, 15)
    log.push({ type: 'CLEAN', message: `Detected ${adjFound.length} filler adjective(s)` })
  }

  // Forbidden opener penalty
  const opener = slopList.forbidden_openers.find(o => lower.startsWith(o.toLowerCase()))
  if (opener) {
    score -= 12
    log.push({ type: 'CLEAN', message: `Generic opener: "${opener}"` })
  }

  // dna_replacements penalty (words that should have been swapped)
  const replacements = voiceProfile.dna_replacements || {}
  const unswapped = Object.keys(replacements).filter(bad =>
    new RegExp(`\\b${escapeRegex(bad)}\\b`, 'i').test(lower)
  )
  if (unswapped.length > 0) {
    score -= Math.min(unswapped.length * 7, 20)
    log.push({ type: 'CLEAN', message: `Removed ${unswapped.length} replaceable word(s)` })
  }

  // Jargon bonus
  const jargonFound = userDNA.jargon.filter(w => lower.includes(w.toLowerCase()))
  if (jargonFound.length > 0) {
    score += Math.min(jargonFound.length * 8, 22)
    log.push({ type: 'SYNC', message: `Injecting user-jargon: "${jargonFound.slice(0, 3).join('", "')}"` })
  }

  // Signature phrase bonus
  const phraseFound = userDNA.signature_phrases.filter(p => lower.includes(p.toLowerCase()))
  if (phraseFound.length > 0) {
    score += Math.min(phraseFound.length * 6, 15)
  }

  // DNA rhythm markers bonus (user-authentic fillers present)
  const markers = userDNA.rhythm_markers.filter(m =>
    new RegExp(`\\b${escapeRegex(m)}\\b`, 'i').test(lower)
  )
  if (markers.length >= 2) {
    score += 8
    log.push({ type: 'DNA', message: 'Detecting user-specific rhythm...' })
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), log }
}

// ─── Roaster prompt ───────────────────────────────────────────────────────────

export function buildRoasterPrompt(content) {
  const slopTerms = [...slopList.forbidden_words, ...slopList.generic_adjectives].join(', ')
  return `You are a brutal content critic. Identify ONLY the weakest, most generic mid-tier sections in this content.

Weakness markers: slop words (${slopTerms}), generic openers, vague claims without specifics, polished corporate phrasing.

Content:
${content}

Return ONLY valid JSON — no markdown:
{"flagged":[{"section":"exact weak text","reason":"why it's weak","severity":"low"|"medium"|"high"}],"verdict":"one sentence"}`
}

// ─── DNA-Synth prompt ─────────────────────────────────────────────────────────

export function buildDNASynthPrompt(content, flagged) {
  const issues = flagged.map(f => `WEAK: "${f.section}"\nWHY: ${f.reason}`).join('\n\n')
  return `You are a DNA-Synth agent. Rewrite flagged sections to match the user's exact voice.

USER VOICE DNA:
- Jargon to inject: ${userDNA.jargon.join(', ')}
- Sentence structures: ${userDNA.sentence_structures.join(' | ')}
- Energy pattern: ${userDNA.energy_pattern}
- Authentic intensifiers: ${userDNA.authentic_intensifiers.join(', ')}

FLAGGED WEAK SECTIONS:
${issues}

FULL CONTENT TO REWRITE:
${content}

Fix every flagged section. Keep all strong sections intact. Inject jargon naturally — do not force it.
Return ONLY the full rewritten content. No explanation. No preamble.`
}

// ─── Categorized diff engine ──────────────────────────────────────────────────

// Compares AI draft (before) vs user-edited version (after).
// Returns categorized changes cross-referenced against slopList and userDNA.
export function categorizeDiff(beforeText, afterText) {
  const extractWords = t => (t.toLowerCase().match(/\b[a-z]{3,}\b/g) || [])
  const beforeWords = new Set(extractWords(beforeText))
  const afterWords  = new Set(extractWords(afterText))

  const removed = [...beforeWords].filter(w => !afterWords.has(w))
  const added   = [...afterWords].filter(w => !beforeWords.has(w))

  // Build lookup sets from known categories
  const slopSet   = new Set([...slopList.forbidden_words, ...slopList.generic_adjectives].map(w => w.toLowerCase()))
  const jargonSet = new Set([
    ...userDNA.jargon,
    ...userDNA.rhythm_markers,
    ...userDNA.authentic_intensifiers,
  ].map(w => w.toLowerCase()))

  const slopRemoved  = removed.filter(w => slopSet.has(w))
  const slangAdded   = added.filter(w => jargonSet.has(w))
  const otherRemoved = removed.filter(w => !slopSet.has(w))
  const otherAdded   = added.filter(w => !jargonSet.has(w))

  // Average words-per-sentence (not characters — more meaningful)
  const avgWords = text => {
    const sentences = text.split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.split(/\s+/).length > 1)
    if (!sentences.length) return 0
    return sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
  }
  const beforeAvg = avgWords(beforeText)
  const afterAvg  = avgWords(afterText)
  const wordDelta = afterAvg - beforeAvg // negative = user prefers shorter

  // Edit ratio: changed words relative to original (capped at 1.0)
  const beforeTotal = extractWords(beforeText).length
  const editRatio   = beforeTotal > 0
    ? Math.min(1, (removed.length + added.length) / (beforeTotal * 2))
    : 0

  return {
    slopRemoved,   // known slop words the user removed
    slangAdded,    // known jargon/voice words the user added
    otherRemoved,  // non-slop words removed (style preference)
    otherAdded,    // other words added (may become personal vocabulary)
    beforeAvg,
    afterAvg,
    wordDelta,
    editRatio,     // 0–1: fraction of content changed
  }
}

export { userDNA, slopList, voiceProfile }
