'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Globe, Phone, Mail, User, MapPin, Briefcase,
  Star, AlertCircle, Wifi, WifiOff, Calendar, ExternalLink, Share2, TrendingUp } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type Prospeccion = {
  id: string; tipo: string | null; direccion: string | null; telefono_local: string | null
  email_local: string | null; web: string | null; redes_sociales: string[] | null
  nombre_dueno: string | null; telefono_dueno: string | null; email_dueno: string | null
  score: number | null; nivel_oportunidad: string | null; nivel_digital: string | null
  tiene_web: boolean; tiene_reservas: boolean; problemas: string[] | null
  ciudad: string | null; nicho: string | null; fecha_prospeccion: string | null
}
type Contact = {
  id: string; first_name: string; last_name: string; email: string
  phone: string | null; title: string | null; status: string; owner: string | null
  prospeccion?: Prospeccion[]
}
type Company = {
  id: string; name: string; domain: string | null; industry: string | null
  size: string | null; website: string | null; created_at: string
  contacts?: Contact[]
}
type Deal = { id: string; title: string; value: number; stage: string; probability: number; close_date: string | null }

const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospección', qualification: 'Calificación', proposal: 'Propuesta',
  negotiation: 'Negociación', closed_won: 'Ganado', closed_lost: 'Perdido',
}
const OPORTUNIDAD_COLOR: Record<string, string> = {
  alta: '#4ade80', media: '#facc15', baja: '#f87171',
}

function fmt(n: number) {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`
  return `€${n}`
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

interface Props { company: Company; deals: Deal[]; userId: string }

export default function CompanyDetailClient({ company, deals }: Props) {
  const router = useRouter()
  const contacts = company.contacts ?? []
  const owner = contacts[0] ?? null
  const prosp = owner?.prospeccion?.[0] ?? null
  const oColor = prosp?.nivel_oportunidad
    ? OPORTUNIDAD_COLOR[prosp.nivel_oportunidad.toLowerCase()] ?? 'var(--text-2)'
    : 'var(--text-2)'

  return (
    <>
      <header className="topbar">
        <button className="icon-btn" onClick={() => router.push('/companies')}>
          <ArrowLeft size={16} />
        </button>
        <div className="topbar-left" style={{ marginLeft: 8 }}>
          <h1 className="page-title">{company.name}</h1>
          <p className="page-sub">
            {[company.industry, prosp?.ciudad ?? null].filter(Boolean).map(s => (s as string)[0].toUpperCase() + (s as string).slice(1)).join(' · ')}
          </p>
        </div>
        {prosp?.score != null && (
          <div className="topbar-right">
            <span style={{
              fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
              background: prosp.score >= 70 ? 'rgba(74,222,128,0.15)' : prosp.score >= 40 ? 'rgba(250,204,21,0.15)' : 'rgba(248,113,113,0.15)',
              color: prosp.score >= 70 ? '#4ade80' : prosp.score >= 40 ? '#facc15' : '#f87171',
            }}>
              Score {prosp.score}/100
            </span>
          </div>
        )}
      </header>

      <div className="page-scroller">
        <div className="page-body">
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

            {/* ── Columna izquierda ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Perfil empresa */}
              <div className="card" style={{ textAlign: 'center', padding: '24px 18px' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, background: 'var(--surface-2)',
                  border: '1px solid var(--border-2)', display: 'grid', placeItems: 'center', margin: '0 auto 14px',
                }}>
                  <Building2 size={24} color="var(--text-3)" />
                </div>
                <div style={{ fontSize: 17, fontWeight: 600 }}>{company.name}</div>
                {company.industry && (
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4, textTransform: 'capitalize' }}>{company.industry}</div>
                )}
                {company.website && (
                  <a
                    href={company.website} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, color: 'var(--gold)', textDecoration: 'none' }}
                  >
                    <Globe size={11} /> {company.domain ?? company.website.replace(/^https?:\/\//, '')}
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>

              {/* Negocio */}
              <div className="card">
                <SectionTitle>Negocio</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(prosp?.tipo ?? company.industry) && (
                    <InfoRow icon={<Briefcase size={14} />} label="Tipo">
                      <span style={{ fontSize: 13, color: 'var(--text-2)', textTransform: 'capitalize' }}>{prosp?.tipo ?? company.industry}</span>
                    </InfoRow>
                  )}
                  {prosp?.direccion && (
                    <InfoRow icon={<MapPin size={14} />} label="Dirección">
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{prosp.direccion}</span>
                    </InfoRow>
                  )}
                  {(prosp?.telefono_local ?? owner?.phone) && (
                    <InfoRow icon={<Phone size={14} />} label="Teléfono local">
                      <a href={`tel:${prosp?.telefono_local ?? owner?.phone}`} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>
                        {prosp?.telefono_local ?? owner?.phone}
                      </a>
                    </InfoRow>
                  )}
                  {(prosp?.email_local) && !prosp.email_local.includes('@placeholder.crm') && (
                    <InfoRow icon={<Mail size={14} />} label="Email local">
                      <a href={`mailto:${prosp.email_local}`} style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>
                        {prosp.email_local}
                      </a>
                    </InfoRow>
                  )}
                  {(prosp?.web ?? company.website) && (
                    <InfoRow icon={<Globe size={14} />} label="Web">
                      <a
                        href={prosp?.web ?? company.website!}
                        target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}
                      >
                        {company.domain ?? (prosp?.web ?? company.website ?? '').replace(/^https?:\/\//, '')}
                        <ExternalLink size={11} style={{ flexShrink: 0 }} />
                      </a>
                    </InfoRow>
                  )}
                  {prosp?.redes_sociales && prosp.redes_sociales.length > 0 && (
                    <InfoRow icon={<Share2 size={14} />} label="Redes sociales">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {prosp.redes_sociales.map((r, i) => (
                          <a key={i} href={r.startsWith('http') ? r : `https://${r}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 12.5, color: 'var(--text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}>
                            {r.replace(/^https?:\/\//, '')} <ExternalLink size={10} style={{ flexShrink: 0 }} />
                          </a>
                        ))}
                      </div>
                    </InfoRow>
                  )}
                </div>
              </div>

              {/* Dueño */}
              {owner && (
                <div className="card">
                  <SectionTitle>Propietario</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                      onClick={() => router.push(`/contacts/${owner.id}`)}
                    >
                      <div className="avatar" style={{ flexShrink: 0 }}>
                        {owner.first_name[0]}{owner.last_name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>
                          {owner.first_name} {owner.last_name}
                        </div>
                        {owner.title && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{owner.title}</div>}
                      </div>
                    </div>
                    {(prosp?.telefono_dueno ?? owner.phone) && (
                      <InfoRow icon={<Phone size={14} />} label="Teléfono personal">
                        <a href={`tel:${prosp?.telefono_dueno ?? owner.phone}`} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>
                          {prosp?.telefono_dueno ?? owner.phone}
                        </a>
                      </InfoRow>
                    )}
                    {prosp?.email_dueno && (
                      <InfoRow icon={<Mail size={14} />} label="Email personal">
                        <a href={`mailto:${prosp.email_dueno}`} style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>
                          {prosp.email_dueno}
                        </a>
                      </InfoRow>
                    )}
                    {!prosp?.email_dueno && !owner.email.includes('@placeholder.crm') && (
                      <InfoRow icon={<Mail size={14} />} label="Email">
                        <a href={`mailto:${owner.email}`} style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>
                          {owner.email}
                        </a>
                      </InfoRow>
                    )}
                    {owner.owner && (
                      <InfoRow icon={<User size={14} />} label="Prospectado por">
                        <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{owner.owner}</span>
                      </InfoRow>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Columna derecha ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Análisis */}
              {prosp && (
                <div className="card">
                  <SectionTitle>Análisis de oportunidad</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                    {prosp.score != null && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score de oportunidad</span>
                          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{prosp.score}/100</span>
                        </div>
                        <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${prosp.score}%`, borderRadius: 4,
                            background: prosp.score >= 70 ? '#4ade80' : prosp.score >= 40 ? '#facc15' : '#f87171',
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      {prosp.nivel_oportunidad && (
                        <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Oportunidad</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: oColor, textTransform: 'capitalize' }}>{prosp.nivel_oportunidad}</div>
                        </div>
                      )}
                      {prosp.nivel_digital && (
                        <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Nivel digital</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{prosp.nivel_digital}</div>
                        </div>
                      )}
                      {(prosp.ciudad || prosp.nicho) && (
                        <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Nicho / Ciudad</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'capitalize' }}>
                            {[prosp.nicho, prosp.ciudad].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{
                        fontSize: 12, padding: '5px 12px', borderRadius: 6,
                        background: prosp.tiene_web ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                        color: prosp.tiene_web ? '#4ade80' : '#f87171',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        {prosp.tiene_web ? <Wifi size={12} /> : <WifiOff size={12} />}
                        {prosp.tiene_web ? 'Tiene web' : 'Sin web'}
                      </span>
                      <span style={{
                        fontSize: 12, padding: '5px 12px', borderRadius: 6,
                        background: prosp.tiene_reservas ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)',
                        color: prosp.tiene_reservas ? '#4ade80' : '#f87171',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        <Calendar size={12} />
                        {prosp.tiene_reservas ? 'Reservas online' : 'Sin reservas'}
                      </span>
                      {prosp.fecha_prospeccion && (
                        <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={12} />
                          {format(parseISO(prosp.fecha_prospeccion), "d MMM yyyy", { locale: es })}
                        </span>
                      )}
                    </div>

                    {prosp.problemas && prosp.problemas.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Problemas detectados</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {prosp.problemas.map((p, i) => (
                            <span key={i} style={{
                              fontSize: 12, padding: '4px 10px', borderRadius: 6,
                              background: 'rgba(248,113,113,0.1)', color: '#f87171',
                              display: 'flex', alignItems: 'center', gap: 5,
                            }}>
                              <AlertCircle size={11} /> {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Deals */}
              {deals.length > 0 && (
                <div className="card">
                  <SectionTitle>Oportunidades ({deals.length})</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {deals.map(d => (
                      <div key={d.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={13} color="var(--gold)" />
                            <span style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{d.title}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <span className={`stage-badge stage-${d.stage}`}>{STAGE_LABELS[d.stage]}</span>
                            {d.probability > 0 && (
                              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{d.probability}%</span>
                            )}
                            {d.close_date && (
                              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                Cierre {format(parseISO(d.close_date), "d MMM", { locale: es })}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', flexShrink: 0, marginLeft: 12 }}>
                          {fmt(Number(d.value))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!prosp && deals.length === 0 && (
                <div className="card">
                  <div className="empty-state" style={{ padding: '30px 0' }}>
                    <Star size={24} color="var(--text-3)" />
                    <p className="empty-sub" style={{ marginTop: 10 }}>Sin datos de análisis ni oportunidades aún</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
