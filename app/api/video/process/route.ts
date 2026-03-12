import { NextRequest, NextResponse } from 'next/server'

const VIDEO_SERVER = 'http://165.227.186.223/video'

export async function POST(req: NextRequest) {
  try {
    const { storagePath, clips, outputName } = await req.json()

    if (!storagePath || !clips) {
      return NextResponse.json({ error: 'Missing storagePath or clips' }, { status: 400 })
    }

    const res = await fetch(`${VIDEO_SERVER}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storagePath, clips, outputName }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Processing failed')

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
