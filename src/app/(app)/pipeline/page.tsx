import { createClient } from '@/lib/supabase/server'
import PipelineClient from './PipelineClient'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deals } = await (supabase as any)
    .from('deals')
    .select('*, contacts(first_name, last_name), companies(name), prospecto:prospectos(id, nombre)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <PipelineClient deals={deals ?? []} userId={user.id} />
}
