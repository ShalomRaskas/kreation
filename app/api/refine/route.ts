import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { scriptId, feedback } = await request.json()

  const { data: script } = await supabase
    .from('scripts').select('*, profiles(*)').eq('id', scriptId).single()
  if (!script) return NextResponse.json({ error: 'Script not found' }, { status: 404 })

  const profile = (script as Record<string, unknown>).profiles as Record<string, string>

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are a content script writer. Refine the following script based on user feedback. Keep the same voice and style.

Original script:
HOOK: ${script.hook}
MAIN CONTENT: ${script.main_content}
CALL TO ACTION: ${script.call_to_action}

Creator profile:
- Personality: ${profile.personality}
- Style: ${profile.content_style}
- Platform: ${profile.platform}

User feedback: ${feedback}

Return ONLY valid JSON with keys: hook, main_content, call_to_action`,
    messages: [{ role: 'user', content: `Refine with feedback: ${feedback}` }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text
  let parsed: { hook: string; main_content: string; call_to_action: string }
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
  } catch {
    return NextResponse.json({ error: 'Parse error' }, { status: 500 })
  }

  const { data: updated } = await supabase
    .from('scripts')
    .update({ hook: parsed.hook, main_content: parsed.main_content, call_to_action: parsed.call_to_action })
    .eq('id', scriptId).select().single()

  return NextResponse.json({ script: updated })
}
