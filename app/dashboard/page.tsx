import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabaseServer'
import DashboardClient from './DashboardClient'
import type { Profile, Script } from '@/types'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const { data: scripts } = await supabase
    .from('scripts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return <DashboardClient profile={profile as Profile} scripts={(scripts || []) as Script[]} />
}
