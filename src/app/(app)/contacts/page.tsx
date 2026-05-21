import { createClient } from '@/lib/supabase/server'
import ContactsClient from './ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: companies } = await supabase
    .from('companies')
    .select('*, contacts(id, first_name, last_name, email, phone, title, owner, prospeccion(*))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <ContactsClient companies={companies ?? []} userId={user.id} />
}
