import { NextRequest, NextResponse } from 'next/server'

const INVITE_CODES = (process.env.BETA_INVITE_CODES ?? '')
  .split(',')
  .map(c => c.trim().toUpperCase())
  .filter(Boolean)

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  if (!code) return NextResponse.json({ valid: false, error: 'No code provided.' }, { status: 400 })

  const valid = INVITE_CODES.includes(code.trim().toUpperCase())
  if (!valid) return NextResponse.json({ valid: false, error: 'Invalid invite code.' }, { status: 200 })

  return NextResponse.json({ valid: true })
}
