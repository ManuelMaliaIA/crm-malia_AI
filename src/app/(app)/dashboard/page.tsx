import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: contacts },
    { data: deals },
    { data: activities },
  ] = await Promise.all([
    supabase.from('contacts').select('id, status, created_at').eq('user_id', user.id),
    supabase.from('deals').select('id, title, value, stage, probability, close_date, created_at').eq('user_id', user.id),
    supabase.from('activities').select('id, type, title, created_at, completed, due_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])

  return (
    <DashboardClient
      contacts={contacts ?? []}
      deals={deals ?? []}
      activities={activities ?? []}
    />
  )
}
