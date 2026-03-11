import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { topic, platform, content, rating } = await req.json()
  if (!topic || !platform || !content || !['up', 'down'].includes(rating)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { error } = await supabase.from('content_feedback').insert({
    user_id: user.id,
    topic,
    platform,
    content,
    rating,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
