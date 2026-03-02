import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Profile {
  intro: string
  writing_samples: string
  content_topic: string
  platform: string
}

function buildPrompt(profile: Profile, idea: string, refineFeedback: string): string {
  const { intro, writing_samples, content_topic, platform } = profile

  let system = `You are a content script writer. Your entire job is to make this script sound like it was written by the actual person, not by AI.

Here is everything you know about them:

This is how they describe themselves in their own words: ${intro}

These are real examples of how they write: ${writing_samples}

They create content about: ${content_topic}

They post on: ${platform}

Study their word choice, sentence length, energy level, punctuation style, and personality from those writing samples. Then write a script about ${idea} that could be mistaken for something they actually wrote.

Use their vocabulary. Match their energy. If they write short punchy sentences, write short punchy sentences. If they use humor, use humor. If they are formal, be formal.

The script must have three sections labeled HOOK, MAIN CONTENT, and CALL TO ACTION.

Return as JSON with keys hook, main_content, call_to_action. Return only valid JSON — no markdown, no code fences, no extra text.`

  if (refineFeedback) {
    system += `\n\nREFINEMENT FEEDBACK TO APPLY:\n"${refineFeedback}"`
  }

  return system
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured on the server' },
      { status: 500 }
    )
  }

  // Verify the user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Load the user's profile to build the prompt server-side
  const { data: profile } = await supabase
    .from('profiles')
    .select('intro, writing_samples, content_topic, platform')
    .eq('id', user.id)
    .single()

  if (!profile?.intro) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const body = await request.json()
  const { idea, refineFeedback = '' } = body

  if (!idea || typeof idea !== 'string' || !idea.trim()) {
    return NextResponse.json({ error: 'idea is required' }, { status: 400 })
  }

  const system = buildPrompt(profile as Profile, idea.trim(), refineFeedback)

  // Call Anthropic — API key stays on the server, never sent to the browser
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: `Content idea: ${idea.trim()}` }],
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: (err as { error?: { message?: string } })?.error?.message ?? `API error ${res.status}` },
      { status: res.status }
    )
  }

  const data = await res.json()
  const text = (data.content?.[0]?.text as string) || ''

  // Attempt to parse JSON response
  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    // Fallback: return raw text for backward compatibility
    return NextResponse.json({ text })
  }
}
