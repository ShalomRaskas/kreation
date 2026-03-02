import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Profile {
  niche: string
  personality: string
  audience: string
  style: string
  platform: string
}

function buildPrompt(profile: Profile, refineFeedback: string): string {
  const { niche, personality, audience, style, platform } = profile

  let prompt = `You are an expert ${platform} scriptwriter who writes in the creator's exact voice.

CREATOR PROFILE:
- Content niche: ${niche}
- Personality: ${personality}
- Target audience: ${audience}
- Content style: ${style}
- Platform: ${platform}

YOUR TASK:
Write a complete ${platform} script for the idea the creator provides. Match their personality and style exactly. Sound like a real person, not a generic AI script.

OUTPUT FORMAT — use EXACTLY these three markers, each on its own line:

[HOOK]
(Opening — first 15-30 seconds. Grab attention immediately. Match the ${personality} personality.)

[MAIN CONTENT]
(Full body of the content. Natural transitions. Speaks directly to ${audience}. Written in ${style} style.)

[CALL TO ACTION]
(Closing — natural, not pushy. Fits the ${personality} personality.)

STRICT RULES:
- Only use [HOOK], [MAIN CONTENT], [CALL TO ACTION] as section markers — no markdown, no bold, no ##
- No text before [HOOK] and no text after the CTA content
- First person voice throughout
- Optimised for ${platform}`

  if (refineFeedback) {
    prompt += `\n\nREFINEMENT FEEDBACK TO APPLY:\n"${refineFeedback}"`
  }

  return prompt
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
    .select('niche, personality, audience, style, platform')
    .eq('id', user.id)
    .single()

  if (!profile?.niche) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const body = await request.json()
  const { idea, refineFeedback = '' } = body

  if (!idea || typeof idea !== 'string' || !idea.trim()) {
    return NextResponse.json({ error: 'idea is required' }, { status: 400 })
  }

  const system = buildPrompt(profile as Profile, refineFeedback)

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

  return NextResponse.json({ text })
}
