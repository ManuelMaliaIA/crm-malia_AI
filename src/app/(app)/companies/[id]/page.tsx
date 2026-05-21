import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CompanyDetailClient from './CompanyDetailClient'

export const dynamic = 'force-dynamic'

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: company }, { data: deals }] = await Promise.all([
    supabase
      .from('companies')
      .select('*, contacts(*, prospeccion(*))')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('deals')
      .select('id, title, value, stage, probability, close_date')
      .eq('company_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  if (!company) notFound()

  return <CompanyDetailClient company={company} deals={deals ?? []} userId={user.id} />
}
