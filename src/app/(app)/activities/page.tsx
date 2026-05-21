import { createClient } from '@/lib/supabase/server'
import ActivitiesClient from './ActivitiesClient'

export const dynamic = 'force-dynamic'

export default async function ActivitiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: activities } = await supabase
    .from('activities')
    .select('*, contacts(first_name, last_name), deals(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <ActivitiesClient activities={activities ?? []} userId={user.id} />
}
