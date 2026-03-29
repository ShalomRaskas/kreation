// ─────────────────────────────────────────────────────────────────────────────
// agent-edit-patch.js  (v2)
//
// Signals used for edit decisions:
//   1. Whisper segment timestamp gaps  →  pause detection (no API cost)
//   2. MediaPipe FaceMesh via Python   →  look-away detection (no API cost)
//   3. Text-based stutter/filler scan  →  stays unchanged
//   Gemini vision: REMOVED
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. Pause detection — pure Whisper segment gaps ───────────────────────────
//    gap ≥ 0.5s  → soft pause  (cut if other signals agree)
//    gap ≥ 1.5s  → hard pause  (always cut — speaker fully stopped)

function detectPauses(segments) {
  const pauses = []
  for (let i = 0; i < segments.length - 1; i++) {
    const gap = parseFloat((segments[i + 1].start - segments[i].end).toFixed(3))
    if (gap >= 0.5) {
      pauses.push({
        afterSegIndex: i,
        start:    parseFloat(segments[i].end.toFixed(3)),
        end:      parseFloat(segments[i + 1].start.toFixed(3)),
        duration: gap,
        type:     gap >= 1.5 ? 'hard' : 'soft',
        context:  segments[i].text.trim().slice(-60),
      })
    }
  }
  return pauses
}

// ── 2. Stutter / filler detection — text-based, unchanged ────────────────────

function detectStutters(segments) {
  const FILLERS = new Set(['um', 'uh', 'like', 'so', 'basically', 'literally', 'right', 'okay', 'you know'])
  const issues = []
  for (let i = 0; i < segments.length; i++) {
    const seg   = segments[i]
    const words = seg.text.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) continue

    if (words.length >= 2 && words[0] === words[1] && words[0].length > 2) {
      issues.push({ segIndex: i, start: seg.start, end: seg.end, type: 'stutter', text: seg.text })
      continue
    }
    const fillerCount = words.filter(w => FILLERS.has(w)).length
    if (words.length <= 5 && fillerCount >= 2) {
      issues.push({ segIndex: i, start: seg.start, end: seg.end, type: 'filler', text: seg.text })
      continue
    }
    if (words.length <= 3 && i + 1 < segments.length) {
      const nextWords = segments[i + 1].text.trim().toLowerCase().split(/\s+/)
      if (nextWords[0] === words[0])
        issues.push({ segIndex: i, start: seg.start, end: seg.end, type: 'false_start', text: seg.text })
    }
  }
  return issues
}

// ── 3. Look-away detection — MediaPipe FaceMesh via Python subprocess ─────────
//    Samples every 30 frames (~1 fps at 30fps).
//    Returns [{timestamp, type, deviation?}] or [] on any failure.

function detectLookingAway(videoPath) {
  return new Promise(resolve => {
    const fs         = require('fs')
    const { execFile } = require('child_process')
    const scriptPath = path.join(__dirname, 'face_detect.py')

    if (!fs.existsSync(scriptPath)) {
      console.warn('[face] face_detect.py not found — skipping look-away detection')
      return resolve([])
    }

    execFile('python3', [scriptPath, videoPath, '30'], { timeout: 90000 }, (err, stdout, stderr) => {
      if (err) {
        console.warn('[face] detection error:', err.message)
        if (stderr) console.warn('[face] stderr:', stderr.slice(0, 200))
        return resolve([])
      }
      try {
        resolve(JSON.parse(stdout.trim()))
      } catch {
        console.warn('[face] could not parse output:', stdout.slice(0, 100))
        resolve([])
      }
    })
  })
}

// ── 4. Claude edit planner — transcript + pauses + lookaway only ──────────────

async function claudePlanEdit(anthropic, { segments, pauses, stutters, lookaway, vibe, feedback }) {
  const transcriptLines = segments.map((s, i) =>
    `[${i}] ${s.start.toFixed(2)}-${s.end.toFixed(2)}s: "${s.text.trim()}"`
  ).join('\n')

  const pauseList = pauses.length
    ? pauses.map(p =>
        `  ${p.start}s–${p.end}s (${p.duration}s, ${p.type}): after "${p.context}"`
      ).join('\n')
    : '  None'

  const stutterList = stutters.length
    ? stutters.map(s => `  Seg ${s.segIndex} at ${s.start}s [${s.type}]: "${s.text}"`).join('\n')
    : '  None'

  const lookawayList = lookaway.length
    ? lookaway.map(e =>
        `  ${e.timestamp}s — ${e.type}${e.deviation != null ? ` (deviation ${e.deviation})` : ''}`
      ).join('\n')
    : '  None'

  const vibeRules = {
    'high-energy': 'KEEP: high-energy, direct, confident. CUT: hesitation, hard pauses, low energy.',
    'balanced':    'KEEP: clear, confident delivery. CUT: hard pauses, stutters, rambling.',
    'cinematic':   'KEEP: composed, intentional moments. CUT: mistakes, restarts, filler.',
  }[vibe] || 'KEEP: clear delivery. CUT: hard pauses, stutters, filler.'

  const prompt = `You are a professional video editor. Create a precise edit plan.

TRANSCRIPT SEGMENTS (index, timestamps, text):
${transcriptLines}

PAUSES — from Whisper timestamp gaps (soft ≥0.5s, hard ≥1.5s):
${pauseList}

STUTTERS / FILLERS — text analysis:
${stutterList}

CAMERA PRESENCE — MediaPipe face landmarks, sampled every 30 frames:
${lookawayList}

EDIT STYLE: ${vibeRules}
${feedback ? `\nPREVIOUS ATTEMPT — ISSUES TO FIX:\n${feedback}\n` : ''}
RULES:
- Output 3–8 clips total
- NEVER cut mid-sentence — always finish the thought
- Clip boundaries must align with segment boundaries (±0.1s)
- Hard pauses (≥1.5s): always cut — use pause.end as the next clip start
- Soft pauses (0.5–1.5s): cut only when stutter or look-away also occurs nearby
- Stutter/filler segments: remove unless they carry essential meaning
- Look-away windows: cut if a pause or stutter also occurs in that window; otherwise keep
- Result must be complete and coherent as a standalone message

Return ONLY valid JSON — no markdown, no explanation:
{"clips":[{"start":0.0,"end":5.2,"reason":"opening hook"}],"cutSummary":"brief description of what was removed"}`

  const resp = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  return JSON.parse(resp.content[0].text.replace(/```json\n?|\n?```/g, '').trim())
}

// ── 5. Claude plan validator — unchanged ──────────────────────────────────────

async function claudeValidatePlan(anthropic, { segments, clips }) {
  const keptSegs = segments.filter(seg =>
    clips.some(clip => {
      const overlap = Math.min(seg.end, clip.end) - Math.max(seg.start, clip.start)
      const segDur  = seg.end - seg.start
      return segDur > 0 && overlap / segDur > 0.5
    })
  )
  const keptText     = keptSegs.map(s => s.text.trim()).join(' ')
  const originalText = segments.map(s => s.text.trim()).join(' ')

  const prompt = `Validate whether this video edit flows naturally.

ORIGINAL: "${originalText}"

AFTER EDIT: "${keptText}"

Check:
1. Does it start with a complete thought (not mid-sentence)?
2. Does it end properly (not abruptly cut off)?
3. No jarring jumps where critical context is missing?
4. Does it make sense as a standalone message?

Return ONLY valid JSON:
{"score":0-100,"issues":["list any problems"],"verdict":"pass" or "revise"}`

  const resp = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })
  return JSON.parse(resp.content[0].text.replace(/```json\n?|\n?```/g, '').trim())
}

// ── 6. /agent-edit route — no Gemini ─────────────────────────────────────────

app.post('/agent-edit', async (req, res) => {
  const { videoId, ext, vibe = 'balanced', segments = [], duration = 0 } = req.body
  if (!videoId || !ext)  return res.status(400).json({ error: 'videoId and ext required' })
  if (!segments.length)  return res.status(400).json({ error: 'segments required' })

  try {
    const Anthropic = require('@anthropic-ai/sdk')
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const videoPath = path.join(uploadDir, `${videoId}.${ext}`)

    // Phase 1 — Whisper-gap pause + text stutter scan (no API, instant)
    const pauses   = detectPauses(segments)
    const stutters = detectStutters(segments)
    console.log(`[agent-edit] pauses=${pauses.length} (hard=${pauses.filter(p => p.type === 'hard').length}) stutters=${stutters.length}`)

    // Phase 2 — MediaPipe face presence (Python, sampled every 30 frames)
    console.log('[agent-edit] running face detection…')
    const lookaway = await detectLookingAway(videoPath)
    console.log(`[agent-edit] look-away events=${lookaway.length}`)

    // Phase 3 — Claude plan → validate → revise loop (max 3 iterations)
    let clips       = null
    let cutSummary  = ''
    let allFeedback = []
    const MAX_ITER  = 3

    for (let iter = 0; iter < MAX_ITER; iter++) {
      console.log(`[agent-edit] iteration ${iter + 1}/${MAX_ITER}`)

      const plan = await claudePlanEdit(anthropic, {
        segments, pauses, stutters, lookaway, vibe,
        feedback: allFeedback.length ? allFeedback.join('; ') : null,
      })

      if (!plan.clips?.length) {
        clips = [{ start: 0, end: duration }]; cutSummary = 'No cuts needed'; break
      }

      cutSummary = plan.cutSummary || ''
      console.log(`[agent-edit] plan: ${plan.clips.length} clips — ${cutSummary}`)

      const validation = await claudeValidatePlan(anthropic, { segments, clips: plan.clips })
      console.log(`[agent-edit] score=${validation.score} verdict=${validation.verdict}`)

      if (validation.verdict === 'pass' || validation.score >= 75 || iter === MAX_ITER - 1) {
        clips = plan.clips; break
      }

      if (validation.issues?.length) allFeedback.push(...validation.issues)
    }

    res.json({
      clips,
      cutSummary,
      iterations: allFeedback.length > 0 ? allFeedback.length + 1 : 1,
      source: 'agent',
    })
  } catch (e) {
    console.error('[agent-edit] error:', e)
    res.status(500).json({ error: e.message })
  }
})
