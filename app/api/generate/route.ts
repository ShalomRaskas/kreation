import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { idea } = await request.json()
  if (!idea) return NextResponse.json({ error: 'Missing idea' }, { status: 400 })

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Fetch last 2 scripts for voice context
  const { data: prevScripts } = await supabase
    .from('scripts')
    .select('topic, hook, main_content, call_to_action')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(2)

  const prevScriptContext = prevScripts && prevScripts.length > 0
    ? `\n\nHere are examples of scripts this user has previously created. Use these to understand their voice, energy level, and style more deeply and make the new script consistent with their established voice:\n\n` +
      prevScripts.map((s, i) => `--- Previous Script ${i + 1} (Topic: ${s.topic}) ---\nHOOK: ${s.hook}\nMAIN CONTENT: ${s.main_content}\nCALL TO ACTION: ${s.call_to_action}`).join('\n\n')
    : ''

  const systemPrompt = `You are a content script writer. Write a ${profile.platform} script for a creator with the following profile:
- Content Topic: ${profile.content_topic}
- Personality: ${profile.personality}
- Target Audience: ${profile.target_audience}
- Content Style: ${profile.content_style}
- Platform: ${profile.platform}
${prevScriptContext}

Write a new script about: ${idea}

The script must have three clearly labeled sections:
- HOOK: grabs attention in the first 5 seconds
- MAIN CONTENT: delivers the value
- CALL TO ACTION: tells viewers what to do next

Match their personality and style exactly. Write in first person. Sound like a real human creator, not generic AI.

Return ONLY valid JSON with exactly these keys:
{
  "hook": "...",
  "main_content": "...",
  "call_to_action": "..."
}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: `Generate a script about: ${idea}` }],
    system: systemPrompt,
  })

  const raw = (message.content[0] as { type: string; text: string }).text
  let parsed: { hook: string; main_content: string; call_to_action: string }
  try {
    // Extract JSON even if wrapped in markdown
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
  } catch {
    return NextResponse.json({ error: 'Failed to parse script response' }, { status: 500 })
  }

  // Save to Supabase
  const { data: saved, error: saveError } = await supabase
    .from('scripts')
    .insert({
      user_id: user.id,
      topic: idea.slice(0, 200),
      hook: parsed.hook,
      main_content: parsed.main_content,
      call_to_action: parsed.call_to_action,
    })
    .select('id')
    .single()

  if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })

  return NextResponse.json({ scriptId: saved.id })
}
