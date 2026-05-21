import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ContactDetailClient from './ContactDetailClient'

export const dynamic = 'force-dynamic'

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: contact }, { data: activities }, { data: deals }] = await Promise.all([
    supabase.from('contacts').select('*, companies(name, domain)').eq('id', params.id).eq('user_id', user.id).single(),
    supabase.from('activities').select('*').eq('contact_id', params.id).order('created_at', { ascending: false }),
    supabase.from('deals').select('id, title, value, stage, probability').eq('contact_id', params.id).eq('user_id', user.id),
  ])

  if (!contact) notFound()

  return (
    <ContactDetailClient
      contact={contact}
      activities={activities ?? []}
      deals={deals ?? []}
      userId={user.id}
    />
  )
}
