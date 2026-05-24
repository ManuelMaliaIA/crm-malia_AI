import { createClient } from '@/lib/supabase/server'
import RoadmapClient from './RoadmapClient'

export const dynamic = 'force-dynamic'

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  const [{ data: projects }, { data: prospectos }] = await Promise.all([
    sb.from('roadmap_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
    sb.from('prospectos').select('id, nombre').order('nombre'),
  ])
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return <RoadmapClient projects={projects ?? []} prospectos={prospectos ?? []} userId={user.id} />
}
