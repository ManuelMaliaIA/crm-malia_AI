'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Phone, Building2, FileText, Send, PhoneCall, CheckSquare, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

type Contact = {
  id: string; first_name: string; last_name: string; email: string
  phone: string | null; title: string | null; status: string; owner: string | null
  created_at: string; companies?: { name: string; domain: string | null } | null
}
type Activity = {
  id: string; type: string; title: string; body: string | null
  created_at: string; completed: boolean; due_at: string | null
}
type Deal = { id: string; title: string; value: number; stage: string; probability: number }

const STATUS_LABELS: Record<string, string> = {
  lead: 'Lead', prospect: 'Prospect', customer: 'Cliente', churned: 'Churned'
}
const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospección', qualification: 'Calificación', proposal: 'Propuesta',
  negotiation: 'Negociación', closed_won: 'Ganado', closed_lost: 'Perdido',
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  note: <FileText size={14} />,
  email: <Mail size={14} />,
  call: <PhoneCall size={14} />,
  meeting: <Calendar size={14} />,
  task: <CheckSquare size={14} />,
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

interface Props {
  contact: Contact
  activities: Activity[]
  deals: Deal[]
  userId: string
}

export default function ContactDetailClient({ contact, activities: initActs, deals, userId }: Props) {
  const router = useRouter()
  const [activities, setActivities] = useState(initActs)
  const [tab, setTab] = useState<'note' | 'email' | 'call' | 'task'>('note')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  async function addActivity() {
    if (!body.trim()) return
    setLoading(true)
    const sb = createClient()
    const { data } = await sb.from('activities').insert({
      type: tab,
      title: tab === 'note' ? 'Nota' : tab === 'email' ? 'Email enviado' : tab === 'call' ? 'Llamada' : 'Tarea',
      body: body.trim(),
      contact_id: contact.id,
      user_id: userId,
      completed: false,
    }).select().single()
    setLoading(false)
    if (data) {
      setActivities(a => [data, ...a])
      setBody('')
    }
  }

  return (
    <>
      {/* Topbar */}
      <header className="topbar">
        <button className="icon-btn" onClick={() => router.push('/contacts')}>
          <ArrowLeft size={16} />
        </button>
        <div className="topbar-left" style={{ marginLeft: 8 }}>
          <h1 className="page-title">{contact.first_name} {contact.last_name}</h1>
          <p className="page-sub">{contact.title ?? 'Sin cargo'} · {contact.companies?.name ?? 'Sin empresa'}</p>
        </div>
        <div className="topbar-right">
          <span className={`chip chip-${contact.status}`}>{STATUS_LABELS[contact.status]}</span>
        </div>
      </header>

      <div className="page-scroller">
        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

            {/* Sidebar info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Profile card */}
              <div className="card" style={{ textAlign: 'center', padding: '24px 18px' }}>
                <div className="avatar avatar-xl" style={{ margin: '0 auto 14px' }}>
                  {initials(contact.first_name, contact.last_name)}
                </div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>{contact.first_name} {contact.last_name}</div>
                {contact.title && <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>{contact.title}</div>}
                {contact.companies?.name && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>{contact.companies.name}</div>
                )}
                <span className={`chip chip-${contact.status}`} style={{ marginTop: 12, display: 'inline-flex' }}>
                  {STATUS_LABELS[contact.status]}
                </span>
              </div>

              {/* Contact info */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 14 }}>Información</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Mail size={14} color="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Email</div>
                      <a href={`mailto:${contact.email}`} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>
                        {contact.email}
                      </a>
                    </div>
                  </div>
                  {contact.phone && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Phone size={14} color="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Teléfono</div>
                        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{contact.phone}</span>
                      </div>
                    </div>
                  )}
                  {contact.companies?.name && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Building2 size={14} color="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Empresa</div>
                        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{contact.companies.name}</span>
                      </div>
                    </div>
                  )}
                  {contact.owner && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--surface-3)', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Owner</div>
                        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{contact.owner}</span>
                      </div>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 11.5, color: 'var(--text-4)' }}>
                    Creado {format(parseISO(contact.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                  </div>
                </div>
              </div>

              {/* Associated deals */}
              {deals.length > 0 && (
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 14 }}>Deals ({deals.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {deals.map(d => (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{d.title}</div>
                          <span className={`stage-badge stage-${d.stage}`} style={{ marginTop: 3, display: 'inline-block' }}>
                            {STAGE_LABELS[d.stage]}
                          </span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', flexShrink: 0, marginLeft: 10 }}>
                          {fmt(Number(d.value))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Composer */}
              <div className="card">
                <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                  {(['note', 'email', 'call', 'task'] as const).map(t => (
                    <button
                      key={t}
                      className={`seg-item ${tab === t ? 'active' : ''}`}
                      onClick={() => setTab(t)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {ACTIVITY_ICONS[t]}
                      {t === 'note' ? 'Nota' : t === 'email' ? 'Email' : t === 'call' ? 'Llamada' : 'Tarea'}
                    </button>
                  ))}
                </div>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder={
                    tab === 'note' ? 'Añade una nota…' :
                    tab === 'email' ? 'Descripción del email enviado…' :
                    tab === 'call' ? 'Resumen de la llamada…' :
                    'Descripción de la tarea…'
                  }
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    className="btn-primary"
                    onClick={addActivity}
                    disabled={!body.trim() || loading}
                  >
                    {loading ? <span className="spinner" /> : <><Send size={13} /> Guardar</>}
                  </button>
                </div>
              </div>

              {/* Timeline entries */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: 4 }}>
                  Actividades ({activities.length})
                </div>
                {activities.length === 0 ? (
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <p className="empty-sub">Sin actividades. Añade la primera arriba.</p>
                  </div>
                ) : (
                  <div className="timeline">
                    {activities.map(act => (
                      <div key={act.id} className="timeline-entry">
                        <div className="timeline-icon" style={{ color: act.type === 'note' ? 'var(--text-3)' : 'var(--gold)' }}>
                          {ACTIVITY_ICONS[act.type] ?? <FileText size={14} />}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-title">{act.title}</div>
                          {act.body && <div className="timeline-body">{act.body}</div>}
                          <div className="timeline-time">
                            {format(parseISO(act.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
