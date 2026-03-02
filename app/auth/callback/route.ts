import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data.user) {
            // Check if user has a profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('niche')
                .eq('id', data.user.id)
                .single()

            if (profile?.niche) {
                return NextResponse.redirect(`${origin}/dashboard`)
            } else {
                return NextResponse.redirect(`${origin}/onboarding`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-error`)
}
