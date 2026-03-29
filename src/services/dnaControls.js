const CONTROLS_KEY    = 'kreation_dna_controls'
const PROFILE_KEY     = 'kreation_profile'
const CUSTOM_SLOP_KEY = 'kreation_custom_slop'

const CONTROL_DEFAULTS = {
  spiciness:       50,
  technical_depth: 50,
  brevity:         50,
}

// ─── DNA Controls (generation sliders) ────────────────────────────────────────

export function getDNAControls() {
  try {
    const raw = localStorage.getItem(CONTROLS_KEY)
    return raw ? { ...CONTROL_DEFAULTS, ...JSON.parse(raw) } : { ...CONTROL_DEFAULTS }
  } catch { return { ...CONTROL_DEFAULTS } }
}

export function saveDNAControls(controls) {
  localStorage.setItem(CONTROLS_KEY, JSON.stringify(controls))
}

export function buildControlContext(controls) {
  const { spiciness, technical_depth, brevity } = controls
  const lines = []

  const spicy = spiciness > 70 ? 'very edgy, provocative, and willing to say what others won\'t'
              : spiciness > 40 ? 'bold but measured — take a position, don\'t play it safe'
              : 'grounded and professional — no controversy'
  lines.push(`Tone intensity: ${spicy}.`)

  const tech = technical_depth > 70 ? 'technically dense — use specific terminology, exact numbers, concrete details'
             : technical_depth > 40 ? 'balanced — accessible but not dumbed down'
             : 'simple and plain — no jargon, assume a general audience'
  lines.push(`Technical depth: ${tech}.`)

  const brief = brevity > 70 ? 'extremely concise — every word must earn its place, cut ruthlessly'
              : brevity > 40 ? 'lean but complete — no padding, no filler'
              : 'expansive — take time to build context and examples'
  lines.push(`Length style: ${brief}.`)

  return lines.join(' ')
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export function getProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    return raw ? JSON.parse(raw) : { name: '', x_handle: '' }
  } catch { return { name: '', x_handle: '' } }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

// ─── Custom Slop Words ────────────────────────────────────────────────────────

export function getCustomSlop() {
  try {
    const raw = localStorage.getItem(CUSTOM_SLOP_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveCustomSlop(words) {
  localStorage.setItem(CUSTOM_SLOP_KEY, JSON.stringify(words))
}
