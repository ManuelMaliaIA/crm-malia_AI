import { createClient } from '@/lib/supabase/server'
import ContactsClient from './ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: prospectos } = await supabase
    .from('prospectos')
    .select('*')
    .order('created_at', { ascending: false })

  return <ContactsClient prospectos={prospectos ?? []} userId={user.id} />
}
