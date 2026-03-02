import { redirect, notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabaseServer'
import ScriptClient from './ScriptClient'
import type { Script } from '@/types'

export default async function ScriptPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: script } = await supabase
    .from('scripts').select('*').eq('id', params.id).single()

  if (!script) notFound()
  return <ScriptClient script={script as Script} />
}
