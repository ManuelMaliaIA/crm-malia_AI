import { createClient } from '@/lib/supabase/server'
import NewDealClient from './NewDealClient'

export const dynamic = 'force-dynamic'

export default async function NewDealPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  const [{ data: prospectos }, { data: companies }] = await Promise.all([
    sb.from('prospectos').select('id, nombre').order('nombre'),
    supabase.from('companies').select('id, name').eq('user_id', user.id).order('name'),
  ])
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <NewDealClient
      prospectos={prospectos ?? []}
      companies={companies ?? []}
      userId={user.id}
    />
  )
}
