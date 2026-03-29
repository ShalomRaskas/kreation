const LTM_KEY = 'kreation_long_term_memory'

const DEFAULTS = {
  weights: {
    avg_words_per_sentence: 0, // converges on user's natural sentence length
    word_delta: 0,             // rolling sentence length direction
    tone_direction: 'neutral', // 'sharp' | 'casual' | 'neutral'
    formatting_dna: 'compact', // 'punchy' | 'spaced' | 'compact'
    slop_removed: {},          // slop words user removes: { word: count }
    slang_added:  {},          // jargon words user adds:  { word: count }
    removed_words: {},         // all removed words
    added_words:   {},         // all added words
  },
  edit_count:              0,
  publish_count:           0,
  low_edit_publish_count:  0,  // publishes where AI was right (<5% edits)
  voice_maturity:          10,
}

function getLTM() {
  try {
    const raw = localStorage.getItem(LTM_KEY)
    if (!raw) return JSON.parse(JSON.stringify(DEFAULTS))
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULTS,
      ...parsed,
      weights: { ...DEFAULTS.weights, ...parsed.weights },
    }
  } catch { return JSON.parse(JSON.stringify(DEFAULTS)) }
}

function saveLTM(data) {
  localStorage.setItem(LTM_KEY, JSON.stringify(data))
}

// Voice Maturity formula:
//   Base: 10%
//   Low-edit publish (<5% edits, AI was in sync): +10% each
//   High-edit publish (AI needed corrections): +2% each
//   Ceiling: 100% (8 perfectly-aligned publishes → Mirror mode)
function computeVoiceMaturity(lowEditPublishCount, publishCount) {
  const highEditCount = Math.max(0, publishCount - lowEditPublishCount)
  return Math.min(100, Math.round(10 + lowEditPublishCount * 10 + highEditCount * 2))
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export function getVoiceMaturity() {
  return getLTM().voice_maturity
}

export function getWeights() {
  return getLTM().weights
}

// ─── Write ────────────────────────────────────────────────────────────────────

// Accepts the full diff object from categorizeDiff() in voiceSync.js
export function recordEditDiff({ slopRemoved, slangAdded, otherRemoved, otherAdded, wordDelta, afterAvg }) {
  const ltm = getLTM()
  const w   = { ...ltm.weights }

  // Rolling averages
  w.word_delta            = (w.word_delta + wordDelta) / 2
  w.avg_words_per_sentence = w.avg_words_per_sentence > 0
    ? (w.avg_words_per_sentence + afterAvg) / 2
    : afterAvg

  // Categorized frequency maps
  const acc = (map, words) => {
    const out = { ...map }
    words.forEach(word => { out[word] = (out[word] || 0) + 1 })
    return out
  }
  w.slop_removed  = acc(w.slop_removed,  slopRemoved)
  w.slang_added   = acc(w.slang_added,   slangAdded)
  w.removed_words = acc(w.removed_words, [...slopRemoved, ...otherRemoved])
  w.added_words   = acc(w.added_words,   [...slangAdded,  ...otherAdded])

  // Derive tone from word count direction
  w.tone_direction = w.word_delta < -1.5 ? 'sharp'
                   : w.word_delta >  1.5 ? 'casual'
                   : 'neutral'

  // Derive formatting from actual word count per sentence
  const avg = w.avg_words_per_sentence
  w.formatting_dna = avg > 0 && avg <= 7  ? 'punchy'
                   : avg > 14             ? 'spaced'
                   : 'compact'

  const newLTM = { ...ltm, weights: w, edit_count: ltm.edit_count + 1 }
  saveLTM(newLTM)
  return newLTM
}

// editRatio comes from categorizeDiff().editRatio
// Only grows Voice Maturity meaningfully when editRatio < 0.05
export function recordPublish(editRatio = 1) {
  const ltm     = getLTM()
  const isInSync = editRatio < 0.05
  const newLTM  = {
    ...ltm,
    publish_count:          ltm.publish_count + 1,
    low_edit_publish_count: isInSync
      ? ltm.low_edit_publish_count + 1
      : ltm.low_edit_publish_count,
  }
  newLTM.voice_maturity = computeVoiceMaturity(
    newLTM.low_edit_publish_count,
    newLTM.publish_count
  )
  saveLTM(newLTM)
  return { ...newLTM, isInSync }
}

// ─── Prompt injection ─────────────────────────────────────────────────────────

export function getDebugSnapshot() {
  const ltm = getLTM()
  return {
    voice_maturity:          ltm.voice_maturity,
    edit_count:              ltm.edit_count,
    publish_count:           ltm.publish_count,
    low_edit_publish_count:  ltm.low_edit_publish_count,
    weights:                 ltm.weights,
  }
}

export function buildWeightContext(weights) {
  const lines = []
  const avg = Math.round(weights.avg_words_per_sentence)

  if (avg > 0 && avg <= 7)
    lines.push(`User writes very short sentences (~${avg} words each) — match this exactly. No padding.`)
  else if (avg >= 15)
    lines.push(`User writes longer flowing sentences (~${avg} words each) — let ideas develop.`)

  if (weights.tone_direction === 'sharp')  lines.push('Tone calibration: sharp and direct — zero softening language.')
  if (weights.tone_direction === 'casual') lines.push('Tone calibration: casual and conversational.')

  if (weights.formatting_dna === 'punchy') lines.push('Formatting DNA: punchy — very short paragraphs, hard stops, no filler.')
  if (weights.formatting_dna === 'spaced') lines.push('Formatting DNA: flowing — give ideas room to breathe.')

  const topSlop = Object.entries(weights.slop_removed || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w)
  if (topSlop.length)
    lines.push(`User always removes these slop words — NEVER use: ${topSlop.join(', ')}`)

  const topSlang = Object.entries(weights.slang_added || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w)
  if (topSlang.length)
    lines.push(`User always adds their own jargon — prefer: ${topSlang.join(', ')}`)

  return lines.join('\n')
}
