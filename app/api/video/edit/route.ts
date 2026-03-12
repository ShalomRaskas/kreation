import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { transcript, prompt, duration } = await req.json()

    if (!transcript || !prompt) {
      return NextResponse.json({ error: 'Missing transcript or prompt' }, { status: 400 })
    }

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: `You are an expert video editor. You receive a video transcript with timestamps and an edit instruction. You output a precise edit plan as JSON.

Your response must be valid JSON with this exact structure:
{
  "clips": [
    { "start": <seconds>, "end": <seconds>, "reason": "<why this clip>" }
  ],
  "summary": "<brief description of the final video>",
  "estimated_duration": <total seconds of final cut>,
  "caption": "<suggested caption for posting>"
}

Rules:
- Only include the most relevant segments
- Respect the prompt's intent exactly
- Keep clips tight — no dead air
- Timestamps must be within the video duration
- The caption should be post-ready`,
      messages: [
        {
          role: 'user',
          content: `Video duration: ${duration || 'unknown'} seconds

Full transcript:
${transcript}

Edit instruction: ${prompt}

Return the edit plan as JSON.`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse edit plan' }, { status: 500 })
    }

    const editPlan = JSON.parse(jsonMatch[0])
    return NextResponse.json({ editPlan, raw })
  } catch (err: unknown) {
    console.error('Video edit error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
