import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [
    { data: contacts },
    { data: deals },
    { data: activities },
    { data: roadmapProjects },
  ] = await Promise.all([
    supabase.from('contacts').select('id, status, created_at').eq('user_id', user.id),
    supabase.from('deals').select('id, title, value, setup_fee, monthly_fee, stage, close_date, created_at').eq('user_id', user.id),
    supabase.from('activities').select('id, type, title, created_at, completed, due_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    (supabase as any).from('roadmap_projects').select('id, name, nodes, edges').eq('user_id', user.id).order('created_at', { ascending: true }),
  ])
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <DashboardClient
      contacts={contacts ?? []}
      deals={deals ?? []}
      activities={activities ?? []}
      roadmapProjects={roadmapProjects ?? []}
    />
  )
}
