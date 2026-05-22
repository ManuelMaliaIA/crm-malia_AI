import { createClient } from '@/lib/supabase/server'
import PipelineClient from './PipelineClient'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  const [{ data: deals }, { data: prospectos }] = await Promise.all([
    sb.from('deals')
      .select('*, contacts(first_name, last_name), companies(name), prospecto:prospectos(id, nombre)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    sb.from('prospectos').select('id, nombre').order('nombre'),
  ])
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return <PipelineClient deals={deals ?? []} prospectos={prospectos ?? []} userId={user.id} />
}
