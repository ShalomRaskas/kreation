import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ error: 'Valid email required.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase env vars')
      return NextResponse.json({ error: 'Server misconfigured.' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.trim().toLowerCase() })

    if (error) {
      // Duplicate email — treat as success
      if (error.code === '23505') {
        return NextResponse.json({ success: true })
      }
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Could not save your email. Try again.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Waitlist route error:', err)
    return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
  }
}
