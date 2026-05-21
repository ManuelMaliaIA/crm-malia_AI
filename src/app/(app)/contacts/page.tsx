import { createClient } from '@/lib/supabase/server'
import ContactsClient from './ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, companies(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <ContactsClient contacts={contacts ?? []} userId={user.id} />
}
