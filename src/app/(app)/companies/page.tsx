import { createClient } from '@/lib/supabase/server'
import CompaniesClient from './CompaniesClient'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: companies } = await supabase
    .from('companies')
    .select('*, contacts!inner(id, first_name, last_name, title, phone, email)')
    .eq('user_id', user.id)
    .order('name')

  return <CompaniesClient companies={companies ?? []} userId={user.id} />
}
