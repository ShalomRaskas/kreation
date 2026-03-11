import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const BASE_SYSTEM = `You are a social media ghostwriter. You will be given a set of answers a person wrote to personal questions — these reveal their real voice, personality, and communication style. Study how they write: their tone, vocabulary, sentence length, energy, humor or lack of it, formality level. Then generate content on the given topic in their exact voice. Output ONLY the content — no explanations, no commentary, no labels. Sound like THEM, not like AI. Do not add hashtags unless their natural writing includes them.`

const PLATFORM_INSTRUCTIONS: Record<string, string> = {
  X: 'Format: single post, max 280 characters, punchy and direct, no hashtags unless the voice samples include them.',
  LinkedIn:
    'Format: LinkedIn post. Start with a strong hook sentence. Use line breaks between short paragraphs. 150-300 words. End with a question or CTA. Professional but personal.',
  Instagram:
    'Format: Instagram caption. Conversational, vibe-first. 50-150 words. Can use emojis if the voice samples suggest that style. End with a subtle CTA.',
  TikTok:
    'Format: TikTok spoken word script. Write exactly what they would SAY out loud, not read. Hook in the first sentence must grab attention instantly. 60-90 seconds when spoken. Conversational, no jargon.',
  YouTube:
    'Format: YouTube video script. Include: [INTRO] hook that earns the view, [MAIN] the core content with natural transitions, [OUTRO] call to action. 3-5 minutes when spoken. Keep energy high.',
}

async function generateForPlatform(
  topic: string,
  voiceSamples: string,
  platform: string,
): Promise<{ platform: string; content: string }> {
  const platformInstruction = PLATFORM_INSTRUCTIONS[platform]
  if (!platformInstruction) throw new Error(`Unknown platform: ${platform}`)

  const systemPrompt = `${BASE_SYSTEM}\n\n${platformInstruction}`

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: platform === 'YouTube' ? 2048 : platform === 'TikTok' ? 1024 : 512,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Here are examples of how I write:\n${voiceSamples}\n\nNow write content about: ${topic}`,
      },
    ],
  })

  const content = message.content[0].type === 'text' ? message.content[0].text : ''
  return { platform, content }
}

export async function POST(req: NextRequest) {
  try {
    const { topic, voiceSamples, platforms } = await req.json()

    if (!topic || !voiceSamples) {
      return NextResponse.json({ error: 'Missing topic or voice samples' }, { status: 400 })
    }

    const selectedPlatforms: string[] = Array.isArray(platforms) && platforms.length > 0
      ? platforms
      : ['X']

    const results = await Promise.all(
      selectedPlatforms.map((platform) => generateForPlatform(topic, voiceSamples, platform)),
    )

    return NextResponse.json({ results })
  } catch (err: unknown) {
    console.error('Generate error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
