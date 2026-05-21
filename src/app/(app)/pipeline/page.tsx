import { createClient } from '@/lib/supabase/server'
import PipelineClient from './PipelineClient'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: deals } = await supabase
    .from('deals')
    .select('*, contacts(first_name, last_name), companies(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <PipelineClient deals={deals ?? []} userId={user.id} />
}
