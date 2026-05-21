import { createClient } from '@/lib/supabase/server'
import NewDealClient from './NewDealClient'

export const dynamic = 'force-dynamic'

export default async function NewDealPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: contacts }, { data: companies }] = await Promise.all([
    supabase.from('contacts').select('id, first_name, last_name').eq('user_id', user.id).order('first_name'),
    supabase.from('companies').select('id, name').eq('user_id', user.id).order('name'),
  ])

  return (
    <NewDealClient
      contacts={contacts ?? []}
      companies={companies ?? []}
      userId={user.id}
    />
  )
}
