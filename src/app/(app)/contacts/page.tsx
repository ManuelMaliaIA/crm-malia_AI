import { createClient } from '@/lib/supabase/server'
import ContactsClient from './ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: prospectos }, { data: activeDeals }] = await Promise.all([
    supabase.from('prospectos').select('*').order('created_at', { ascending: false }),
    supabase.from('deals')
      .select('prospecto_id, stage')
      .not('prospecto_id', 'is', null),
  ])

  // IDs de prospectos con deals activos (no cerrados)
  const dealProspectoIds = (activeDeals ?? [])
    .filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
    .map(d => d.prospecto_id as number)

  return <ContactsClient prospectos={prospectos ?? []} dealProspectoIds={dealProspectoIds} userId={user.id} />
}
