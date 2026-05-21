'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Mail, Phone, FileText, Send, PhoneCall,
  CheckSquare, Calendar, Globe, Briefcase, User, ExternalLink,
  MapPin, Share2, Star, AlertCircle, Wifi, WifiOff, UtensilsCrossed,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

type Contact = {
  id: string; first_name: string; last_name: string; email: string
  phone: string | null; title: string | null; status: string; owner: string | null
  created_at: string
  companies?: {
    name: string; domain: string | null; website: string | null
    industry: string | null; size: string | null
  } | null
}
type Activity = {
  id: string; type: string; title: string; body: string | null
  created_at: string; completed: boolean; due_at: string | null
}
type Deal = { id: string; title: string; value: number; stage: string; probability: number }
type Prospeccion = {
  id: string; created_at: string; contact_id: string | null; user_id: string
  tipo: string | null; direccion: string | null; telefono_local: string | null
  email_local: string | null; web: string | null; redes_sociales: string[] | null
  nombre_dueno: string | null; telefono_dueno: string | null; email_dueno: string | null
  score: number | null; nivel_oportunidad: string | null; nivel_digital: string | null
  tiene_web: boolean; tiene_reservas: boolean; problemas: string[] | null
  ciudad: string | null; nicho: string | null; fecha_prospeccion: string | null
  fuentes: Record<string, string> | null
}

const STATUS_LABELS: Record<string, string> = {
  lead: 'Lead', prospect: 'Prospect', customer: 'Cliente', churned: 'Churned',
}
const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospección', qualification: 'Calificación', proposal: 'Propuesta',
  negotiation: 'Negociación', closed_won: 'Ganado', closed_lost: 'Perdido',
}
const OPORTUNIDAD_COLOR: Record<string, string> = {
  alta: '#4ade80', media: '#facc15', baja: '#f87171',
}
const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  note: <FileText size={14} />, email: <Mail size={14} />, call: <PhoneCall size={14} />,
  meeting: <Calendar size={14} />, task: <CheckSquare size={14} />,
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}
function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ color: 'var(--text-3)', marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
        {children}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase',
      letterSpacing: '0.1em', marginBottom: 12, paddingBottom: 8,
      borderBottom: '1px solid var(--border)',
    }}>{children}</div>
  )
}

interface Props {
  contact: Contact
  activities: Activity[]
  deals: Deal[]
  prospeccion: Prospeccion | null
  userId: string
}

export default function ContactDetailClient({ contact, activities: initActs, deals, prospeccion, userId }: Props) {
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
    if (data) { setActivities(a => [data, ...a]); setBody('') }
  }

  const oColor = prospeccion?.nivel_oportunidad
    ? OPORTUNIDAD_COLOR[prospeccion.nivel_oportunidad.toLowerCase()] ?? 'var(--text-2)'
    : 'var(--text-2)'

  return (
    <>
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
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>

            {/* ── Columna izquierda ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Perfil */}
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

              {/* ── Negocio ── */}
              <div className="card">
                <SectionTitle>Negocio</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {(prospeccion?.tipo ?? contact.companies?.industry) && (
                    <InfoRow icon={<UtensilsCrossed size={14} />} label="Tipo">
                      <span style={{ fontSize: 13, color: 'var(--text-2)', textTransform: 'capitalize' }}>
                        {prospeccion?.tipo ?? contact.companies?.industry}
                      </span>
                    </InfoRow>
                  )}

                  {prospeccion?.direccion && (
                    <InfoRow icon={<MapPin size={14} />} label="Dirección">
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{prospeccion.direccion}</span>
                    </InfoRow>
                  )}

                  {(prospeccion?.telefono_local ?? contact.phone) && (
                    <InfoRow icon={<Phone size={14} />} label="Teléfono local">
                      <a
                        href={`tel:${prospeccion?.telefono_local ?? contact.phone}`}
                        style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}
                      >
                        {prospeccion?.telefono_local ?? contact.phone}
                      </a>
                    </InfoRow>
                  )}

                  {(prospeccion?.email_local ?? contact.email) && (
                    <InfoRow icon={<Mail size={14} />} label="Email local">
                      <a
                        href={`mailto:${prospeccion?.email_local ?? contact.email}`}
                        style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}
                      >
                        {prospeccion?.email_local ?? contact.email}
                      </a>
                    </InfoRow>
                  )}

                  {(prospeccion?.web ?? contact.companies?.website) && (
                    <InfoRow icon={<Globe size={14} />} label="Web">
                      <a
                        href={prospeccion?.web ?? contact.companies!.website!}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}
                      >
                        {contact.companies?.domain ?? prospeccion?.web ?? contact.companies?.website}
                        <ExternalLink size={11} style={{ flexShrink: 0 }} />
                      </a>
                    </InfoRow>
                  )}

                  {prospeccion?.redes_sociales && prospeccion.redes_sociales.length > 0 && (
                    <InfoRow icon={<Share2 size={14} />} label="Redes sociales">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {prospeccion.redes_sociales.map((r, i) => (
                          <a
                            key={i}
                            href={r.startsWith('http') ? r : `https://${r}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 12.5, color: 'var(--text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}
                          >
                            {r.replace(/^https?:\/\//, '')}
                            <ExternalLink size={10} style={{ flexShrink: 0 }} />
                          </a>
                        ))}
                      </div>
                    </InfoRow>
                  )}

                  {contact.owner && (
                    <InfoRow icon={<User size={14} />} label="Prospectado por">
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{contact.owner}</span>
                    </InfoRow>
                  )}
                </div>
              </div>

              {/* ── Dueño ── */}
              {prospeccion && (prospeccion.nombre_dueno || prospeccion.telefono_dueno || prospeccion.email_dueno) && (
                <div className="card">
                  <SectionTitle>Dueño</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {prospeccion.nombre_dueno && (
                      <InfoRow icon={<User size={14} />} label="Nombre">
                        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{prospeccion.nombre_dueno}</span>
                      </InfoRow>
                    )}
                    {prospeccion.telefono_dueno && (
                      <InfoRow icon={<Phone size={14} />} label="Teléfono personal">
                        <a href={`tel:${prospeccion.telefono_dueno}`} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>
                          {prospeccion.telefono_dueno}
                        </a>
                      </InfoRow>
                    )}
                    {prospeccion.email_dueno && (
                      <InfoRow icon={<Mail size={14} />} label="Email personal">
                        <a href={`mailto:${prospeccion.email_dueno}`} style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>
                          {prospeccion.email_dueno}
                        </a>
                      </InfoRow>
                    )}
                  </div>
                </div>
              )}

              {/* ── Análisis ── */}
              {prospeccion && (
                <div className="card">
                  <SectionTitle>Análisis</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {prospeccion.score != null && (
                      <div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Score</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', width: `${prospeccion.score}%`, borderRadius: 3,
                              background: prospeccion.score >= 70 ? '#4ade80' : prospeccion.score >= 40 ? '#facc15' : '#f87171',
                            }} />
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', minWidth: 36 }}>
                            {prospeccion.score}/100
                          </span>
                        </div>
                      </div>
                    )}

                    {prospeccion.nivel_oportunidad && (
                      <InfoRow icon={<Star size={14} />} label="Oportunidad">
                        <span style={{ fontSize: 13, fontWeight: 600, color: oColor, textTransform: 'capitalize' }}>
                          {prospeccion.nivel_oportunidad}
                        </span>
                      </InfoRow>
                    )}

                    {prospeccion.nivel_digital && (
                      <InfoRow icon={<Wifi size={14} />} label="Nivel digital">
                        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{prospeccion.nivel_digital}</span>
                      </InfoRow>
                    )}

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 4,
                        background: prospeccion.tiene_web ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                        color: prospeccion.tiene_web ? '#4ade80' : '#f87171',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        {prospeccion.tiene_web ? <Wifi size={11} /> : <WifiOff size={11} />}
                        {prospeccion.tiene_web ? 'Tiene web' : 'Sin web'}
                      </span>
                      <span style={{
                        fontSize: 11, padding: '3px 8px', borderRadius: 4,
                        background: prospeccion.tiene_reservas ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                        color: prospeccion.tiene_reservas ? '#4ade80' : '#f87171',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <Calendar size={11} />
                        {prospeccion.tiene_reservas ? 'Reservas online' : 'Sin reservas'}
                      </span>
                    </div>

                    {prospeccion.problemas && prospeccion.problemas.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Problemas</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {prospeccion.problemas.map((p, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-2)' }}>
                              <AlertCircle size={11} color="#f87171" style={{ flexShrink: 0 }} />
                              {p}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(prospeccion.ciudad || prospeccion.nicho) && (
                      <InfoRow icon={<Briefcase size={14} />} label="Nicho / Ciudad">
                        <span style={{ fontSize: 13, color: 'var(--text-2)', textTransform: 'capitalize' }}>
                          {[prospeccion.nicho, prospeccion.ciudad].filter(Boolean).join(' · ')}
                        </span>
                      </InfoRow>
                    )}

                    {prospeccion.fecha_prospeccion && (
                      <InfoRow icon={<Calendar size={14} />} label="Prospectado el">
                        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                          {format(parseISO(prospeccion.fecha_prospeccion), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </InfoRow>
                    )}
                  </div>
                </div>
              )}

              {/* Deals */}
              {deals.length > 0 && (
                <div className="card">
                  <SectionTitle>Deals ({deals.length})</SectionTitle>
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

            {/* ── Timeline ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  <button className="btn-primary" onClick={addActivity} disabled={!body.trim() || loading}>
                    {loading ? <span className="spinner" /> : <><Send size={13} /> Guardar</>}
                  </button>
                </div>
              </div>

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
