import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ContactDetailClient from './ContactDetailClient'

export const dynamic = 'force-dynamic'

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const sb = supabase as any
  const [{ data: contact }, { data: activities }, { data: deals }, { data: prospeccion }] = await Promise.all([
    supabase.from('contacts').select('*, companies(name, domain, website, industry, size)').eq('id', params.id).eq('user_id', user.id).single(),
    supabase.from('activities').select('*').eq('contact_id', params.id).order('created_at', { ascending: false }),
    sb.from('deals').select('id, title, value, stage, probability, prospecto_id').eq('contact_id', params.id).eq('user_id', user.id),
    supabase.from('prospeccion').select('*').eq('contact_id', params.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  if (!contact) notFound()

  const prospectoIds = (deals ?? []).map((d: any) => d.prospecto_id).filter(Boolean)
  const { data: roadmapProjects } = prospectoIds.length > 0
    ? await sb.from('roadmap_projects').select('id, name, nodes, edges').in('prospecto_id', prospectoIds).eq('user_id', user.id)
    : { data: [] }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <ContactDetailClient
      contact={contact}
      activities={activities ?? []}
      deals={deals ?? []}
      prospeccion={prospeccion ?? null}
      roadmapProjects={roadmapProjects ?? []}
      userId={user.id}
    />
  )
}
