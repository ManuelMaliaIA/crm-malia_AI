import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/types'

// Cliente con service_role para saltarse RLS e insertar con cualquier user_id
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ProspectPayload {
  nombre: string
  direccion?: string
  telefono_local?: string
  email_local?: string
  web?: string
  redes_sociales?: string[]
  nombre_dueno?: string
  telefono_dueno?: string
  email_dueno?: string
  score?: number
  nivel_oportunidad?: string
  problemas?: string[]
  nicho?: string
  ciudad?: string
}

function splitName(full: string): { first: string; last: string } {
  const parts = (full ?? '').trim().split(/\s+/)
  return { first: parts[0] ?? 'Sin nombre', last: parts.slice(1).join(' ') || '-' }
}

function domainFromUrl(url?: string): string | null {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') } catch { return null }
}

export async function POST(req: NextRequest) {
  // Autenticación por API key
  const apiKey = req.headers.get('x-api-key')
  if (apiKey !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = process.env.CRM_USER_ID
  if (!userId) {
    return NextResponse.json({ error: 'CRM_USER_ID not configured' }, { status: 500 })
  }

  let payload: ProspectPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!payload.nombre) {
    return NextResponse.json({ error: 'nombre is required' }, { status: 400 })
  }

  // 1. Crear o reutilizar empresa
  let companyId: string | null = null
  const { data: existingCompany } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', payload.nombre)
    .maybeSingle()

  if (existingCompany) {
    companyId = existingCompany.id
  } else {
    const { data: newCompany } = await supabase
      .from('companies')
      .insert({
        name: payload.nombre,
        domain: domainFromUrl(payload.web),
        industry: payload.nicho ?? 'restaurante',
        website: payload.web ?? null,
        user_id: userId,
      })
      .select('id')
      .single()
    companyId = newCompany?.id ?? null
  }

  // 2. Crear contacto (dueño si hay datos, si no uno genérico del negocio)
  const hasDueno = !!(payload.nombre_dueno || payload.email_dueno || payload.telefono_dueno)
  const { first, last } = hasDueno && payload.nombre_dueno
    ? splitName(payload.nombre_dueno)
    : { first: payload.nombre, last: '(negocio)' }

  const email = payload.email_dueno || payload.email_local || `sin-email-${Date.now()}@placeholder.crm`

  // Evitar duplicados por email
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', userId)
    .eq('email', email)
    .maybeSingle()

  let contactId: string | null = null
  if (existingContact) {
    contactId = existingContact.id
  } else {
    const { data: newContact } = await supabase
      .from('contacts')
      .insert({
        first_name: first,
        last_name: last,
        email,
        phone: payload.telefono_dueno || payload.telefono_local || null,
        company_id: companyId,
        status: 'lead',
        title: hasDueno ? 'Propietario/a' : 'Contacto negocio',
        owner: 'Prospección Barbate',
        user_id: userId,
      })
      .select('id')
      .single()
    contactId = newContact?.id ?? null
  }

  // 3. Crear nota con el informe completo de prospección
  if (contactId) {
    const problemas = payload.problemas?.length
      ? `\n🔴 Problemas detectados: ${payload.problemas.join(', ')}`
      : ''
    const redes = payload.redes_sociales?.length
      ? `\n📱 Redes: ${payload.redes_sociales.join(' | ')}`
      : ''
    const direccion = payload.direccion ? `\n📍 ${payload.direccion}` : ''
    const telefonoLocal = payload.telefono_local ? `\n📞 Tel. local: ${payload.telefono_local}` : ''

    const body = [
      `⭐ Score: ${payload.score ?? '—'}/100 — Oportunidad ${payload.nivel_oportunidad ?? '—'}`,
      direccion,
      telefonoLocal,
      redes,
      problemas,
      payload.web ? `\n🌐 Web: ${payload.web}` : '',
    ].filter(Boolean).join('')

    await supabase.from('activities').insert({
      type: 'note',
      title: `Prospección automática — ${payload.nombre}`,
      body: body.trim(),
      contact_id: contactId,
      user_id: userId,
      completed: false,
    })
  }

  return NextResponse.json({
    ok: true,
    company_id: companyId,
    contact_id: contactId,
    message: `${payload.nombre} añadido al CRM`,
  })
}
