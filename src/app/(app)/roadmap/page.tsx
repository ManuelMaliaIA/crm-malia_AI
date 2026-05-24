import { createClient } from '@/lib/supabase/server'
import RoadmapClient from './RoadmapClient'

export const dynamic = 'force-dynamic'

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data: projects } = await (supabase as any)
    .from('roadmap_projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return <RoadmapClient projects={projects ?? []} userId={user.id} />
}
