import { getVoiceMaturity } from '../services/longTermMemory'

function getLTMRaw() {
  try { return JSON.parse(localStorage.getItem('kreation_long_term_memory') || '{}') } catch { return {} }
}

function Section({ title, children }) {
  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-600">{title}</p>
      {children}
    </div>
  )
}

function WordCloud({ words, colorClass }) {
  if (!words || words.length === 0) {
    return <p className="text-xs text-gray-700 font-mono">No data yet.</p>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {words.map(([word, count]) => (
        <span key={word} className={`flex items-center gap-1.5 px-2.5 py-1 border text-[11px] font-mono rounded-lg ${colorClass}`}>
          {word}
          <span className="opacity-50">×{count}</span>
        </span>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const ltm      = getLTMRaw()
  const maturity = getVoiceMaturity()
  const weights  = ltm.weights || {}

  const publishCount    = ltm.publish_count            ?? 0
  const editCount       = ltm.edit_count               ?? 0
  const lowEditCount    = ltm.low_edit_publish_count   ?? 0
  const highEditCount   = Math.max(0, publishCount - lowEditCount)
  const syncRate        = publishCount > 0 ? Math.round((lowEditCount / publishCount) * 100) : 0

  const avgWords    = weights.avg_words_per_sentence ?? 0
  const wordDelta   = weights.word_delta             ?? 0
  const tone        = weights.tone_direction         || 'neutral'
  const formatting  = weights.formatting_dna         || 'compact'

  const topSlop  = Object.entries(weights.slop_removed  || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const topSlang = Object.entries(weights.slang_added   || {}).sort((a, b) => b[1] - a[1]).slice(0, 10)
  const topRemoved = Object.entries(weights.removed_words || {}).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const topAdded   = Object.entries(weights.added_words  || {}).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const barColor = maturity >= 90 ? 'bg-emerald-500' : maturity >= 60 ? 'bg-amber-500' : 'bg-indigo-500'
  const barLabel = maturity >= 90 ? '🪞 Mirror Mode' : maturity >= 60 ? 'Calibrating' : 'Learning'

  return (
    <div className="flex flex-col gap-6 fade-in">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-100">Analytics</h1>
        <p className="text-sm text-gray-600 mt-0.5">How the AI is learning your voice over time.</p>
      </div>

      {/* Voice Maturity */}
      <Section title="Voice Maturity">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-black text-gray-100">{maturity}%</p>
            <p className="text-sm text-gray-500 mt-1">{barLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-700">Mirror at 90%+</p>
            <p className="text-xs text-gray-700 mt-0.5">8 in-sync publishes needed</p>
          </div>
        </div>
        <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${maturity}%` }}
          />
        </div>
      </Section>

      {/* Publish stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Publishes', value: publishCount, color: 'text-indigo-400' },
          { label: 'Total Edits',     value: editCount,    color: 'text-purple-400' },
          { label: 'AI In-Sync',      value: lowEditCount, color: 'text-emerald-400' },
          { label: 'Sync Rate',       value: `${syncRate}%`, color: syncRate >= 60 ? 'text-emerald-400' : 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="glass-panel rounded-2xl p-5">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Voice DNA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Section title="Sentence Rhythm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Avg words / sentence</span>
              <span className="font-mono font-bold text-gray-300">
                {avgWords > 0 ? avgWords.toFixed(1) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Word delta trend</span>
              <span className={`font-mono font-bold ${
                wordDelta < -0.5 ? 'text-emerald-400' :
                wordDelta > 0.5  ? 'text-amber-400'  : 'text-gray-400'
              }`}>
                {wordDelta > 0 ? `+${wordDelta.toFixed(1)}` : wordDelta.toFixed(1)}
                {wordDelta < -0.5 ? ' (compressing)' : wordDelta > 0.5 ? ' (expanding)' : ' (stable)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Tone direction</span>
              <span className="font-mono font-bold text-gray-300 capitalize">{tone}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Formatting DNA</span>
              <span className="font-mono font-bold text-gray-300 capitalize">{formatting}</span>
            </div>
          </div>
        </Section>

        <Section title="Slop Removed">
          <WordCloud
            words={topSlop}
            colorClass="bg-red-500/8 border-red-500/15 text-red-400/80"
          />
        </Section>

        <Section title="Slang Reinforced">
          <WordCloud
            words={topSlang}
            colorClass="bg-emerald-500/8 border-emerald-500/15 text-emerald-400/80"
          />
        </Section>

        <Section title="Most Edited Words">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-wider">Removed</p>
              <WordCloud words={topRemoved} colorClass="bg-white/[0.04] border-white/[0.06] text-gray-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-wider">Added</p>
              <WordCloud words={topAdded}   colorClass="bg-white/[0.04] border-white/[0.06] text-gray-500" />
            </div>
          </div>
        </Section>
      </div>

      {/* Empty state */}
      {publishCount === 0 && editCount === 0 && (
        <div className="glass-panel rounded-2xl flex flex-col items-center justify-center gap-3 py-16 opacity-40">
          <p className="text-sm text-gray-600">No data yet. Start creating and publishing content to see analytics here.</p>
        </div>
      )}

    </div>
  )
}
