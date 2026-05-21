import { createClient } from '@/lib/supabase/server'
import CompaniesClient from './CompaniesClient'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: prospectos } = await supabase
    .from('prospectos')
    .select('*')
    .order('nombre')

  return <CompaniesClient prospectos={prospectos ?? []} userId={user.id} />
}
