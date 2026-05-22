import { createClient } from '@/lib/supabase/server'
import NewDealClient from './NewDealClient'

export const dynamic = 'force-dynamic'

export default async function NewDealPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ data: prospectos }, { data: companies }] = await Promise.all([
    (supabase as any).from('prospectos').select('id, nombre').order('nombre'),
    supabase.from('companies').select('id, name').eq('user_id', user.id).order('name'),
  ])

  return (
    <NewDealClient
      prospectos={prospectos ?? []}
      companies={companies ?? []}
      userId={user.id}
    />
  )
}
