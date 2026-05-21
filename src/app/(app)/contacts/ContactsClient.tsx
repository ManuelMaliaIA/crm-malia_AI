'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import {
  Building2, Phone, Mail, Globe, MapPin, User, Share2,
  AlertCircle, Wifi, WifiOff, Calendar, ChevronDown, ChevronUp,
  ExternalLink, Star, Briefcase,
} from 'lucide-react'
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
  phone: string | null; title: string | null; owner: string | null
  prospeccion?: Prospeccion[]
}
type Company = {
  id: string; name: string; domain: string | null; industry: string | null
  website: string | null; created_at: string; contacts?: Contact[]
}

const OPORTUNIDAD_COLOR: Record<string, string> = {
  alta: '#4ade80', media: '#facc15', baja: '#f87171',
}
const OPORTUNIDAD_BG: Record<string, string> = {
  alta: 'rgba(74,222,128,0.12)', media: 'rgba(250,204,21,0.12)', baja: 'rgba(248,113,113,0.12)',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>{children}</div>
}

function InfoItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
      <div style={{ color: 'var(--text-3)', marginTop: 1, flexShrink: 0 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function CompanyRow({ company }: { company: Company }) {
  const [open, setOpen] = useState(false)
  const contact = company.contacts?.[0] ?? null
  const prosp = contact?.prospeccion?.[0] ?? null
  const nivel = prosp?.nivel_oportunidad?.toLowerCase() ?? ''
  const oColor = OPORTUNIDAD_COLOR[nivel] ?? 'var(--text-3)'
  const oBg = OPORTUNIDAD_BG[nivel] ?? 'transparent'
  const tel = prosp?.telefono_local ?? contact?.phone ?? null
  const emailLocal = prosp?.email_local && !prosp.email_local.includes('@placeholder.crm') ? prosp.email_local : null
  const direccion = prosp?.direccion ?? null

  return (
    <>
      {/* ── Fila de tabla ── */}
      <tr
        onClick={() => setOpen(o => !o)}
        style={{ cursor: 'pointer', borderBottom: open ? 'none' : '1px solid var(--border)', background: open ? 'var(--surface-2)' : 'transparent' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--surface-1)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Nombre */}
        <td style={{ padding: '12px 16px', width: 40 }}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
            {initials(company.name)}
          </div>
        </td>
        <td style={{ padding: '12px 8px 12px 0', minWidth: 180 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{company.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2, textTransform: 'capitalize' }}>
            {prosp?.tipo ?? company.industry ?? '—'}
          </div>
        </td>

        {/* Dirección */}
        <td style={{ padding: '12px 8px', minWidth: 200 }}>
          {direccion ? (
            <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{direccion}</span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>
          )}
        </td>

        {/* Teléfono */}
        <td style={{ padding: '12px 8px', minWidth: 130 }}>
          {tel ? (
            <a
              href={`tel:${tel}`}
              style={{ fontSize: 12.5, color: 'var(--text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={e => e.stopPropagation()}
            >
              <Phone size={11} color="var(--text-3)" /> {tel}
            </a>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>
          )}
        </td>

        {/* Web */}
        <td style={{ padding: '12px 8px', minWidth: 130 }}>
          {(prosp?.web ?? company.website) ? (
            <a
              href={prosp?.web ?? company.website!}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={e => e.stopPropagation()}
            >
              <Globe size={11} />
              {(company.domain ?? (prosp?.web ?? company.website ?? '').replace(/^https?:\/\//, '')).replace(/\/$/, '').slice(0, 22)}
            </a>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Sin web</span>
          )}
        </td>

        {/* Oportunidad */}
        <td style={{ padding: '12px 8px' }}>
          {prosp?.nivel_oportunidad ? (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 5, background: oBg, color: oColor, textTransform: 'capitalize' }}>
              {prosp.nivel_oportunidad}
            </span>
          ) : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
        </td>

        {/* Score */}
        <td style={{ padding: '12px 8px', minWidth: 80 }}>
          {prosp?.score != null ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 40, height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${prosp.score}%`, background: prosp.score >= 70 ? '#4ade80' : prosp.score >= 40 ? '#facc15' : '#f87171', borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{prosp.score}</span>
            </div>
          ) : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
        </td>

        {/* Chevron */}
        <td style={{ padding: '12px 16px 12px 8px', width: 30 }}>
          <div style={{ color: 'var(--text-3)' }}>
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </td>
      </tr>

      {/* ── Panel expandido ── */}
      {open && (
        <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <td colSpan={8} style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28 }}>

              {/* Negocio */}
              <Section title="Negocio">
                {(prosp?.tipo ?? company.industry) && (
                  <InfoItem icon={<Briefcase size={13} />}>
                    <Label>Tipo</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)', textTransform: 'capitalize' }}>{prosp?.tipo ?? company.industry}</span>
                  </InfoItem>
                )}
                {prosp?.ciudad && (
                  <InfoItem icon={<MapPin size={13} />}>
                    <Label>Ciudad</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{prosp.ciudad}</span>
                  </InfoItem>
                )}
                {direccion && (
                  <InfoItem icon={<MapPin size={13} />}>
                    <Label>Dirección</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{direccion}</span>
                  </InfoItem>
                )}
                {tel && (
                  <InfoItem icon={<Phone size={13} />}>
                    <Label>Teléfono local</Label>
                    <a href={`tel:${tel}`} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>{tel}</a>
                  </InfoItem>
                )}
                {emailLocal && (
                  <InfoItem icon={<Mail size={13} />}>
                    <Label>Email local</Label>
                    <a href={`mailto:${emailLocal}`} style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>{emailLocal}</a>
                  </InfoItem>
                )}
                {(prosp?.web ?? company.website) && (
                  <InfoItem icon={<Globe size={13} />}>
                    <Label>Web</Label>
                    <a href={prosp?.web ?? company.website!} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}>
                      {(prosp?.web ?? company.website ?? '').replace(/^https?:\/\//, '')}
                      <ExternalLink size={10} style={{ flexShrink: 0 }} />
                    </a>
                  </InfoItem>
                )}
                {prosp?.redes_sociales && prosp.redes_sociales.length > 0 && (
                  <InfoItem icon={<Share2 size={13} />}>
                    <Label>Redes sociales</Label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {prosp.redes_sociales.map((r, i) => (
                        <a key={i} href={r.startsWith('http') ? r : `https://${r}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, color: 'var(--text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}>
                          {r.replace(/^https?:\/\//, '')} <ExternalLink size={9} style={{ flexShrink: 0 }} />
                        </a>
                      ))}
                    </div>
                  </InfoItem>
                )}
              </Section>

              {/* Propietario */}
              <Section title="Propietario">
                {(prosp?.nombre_dueno ?? (contact && `${contact.first_name} ${contact.last_name}`)) && (
                  <InfoItem icon={<User size={13} />}>
                    <Label>Nombre</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                      {prosp?.nombre_dueno ?? `${contact!.first_name} ${contact!.last_name}`}
                    </span>
                  </InfoItem>
                )}
                {prosp?.telefono_dueno && (
                  <InfoItem icon={<Phone size={13} />}>
                    <Label>Teléfono personal</Label>
                    <a href={`tel:${prosp.telefono_dueno}`} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>{prosp.telefono_dueno}</a>
                  </InfoItem>
                )}
                {prosp?.email_dueno && (
                  <InfoItem icon={<Mail size={13} />}>
                    <Label>Email personal</Label>
                    <a href={`mailto:${prosp.email_dueno}`} style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>{prosp.email_dueno}</a>
                  </InfoItem>
                )}
                {contact?.owner && (
                  <InfoItem icon={<User size={13} />}>
                    <Label>Prospectado por</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{contact.owner}</span>
                  </InfoItem>
                )}
                {prosp?.fecha_prospeccion && (
                  <InfoItem icon={<Calendar size={13} />}>
                    <Label>Fecha prospección</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                      {format(parseISO(prosp.fecha_prospeccion), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </InfoItem>
                )}
              </Section>

              {/* Análisis */}
              <Section title="Análisis">
                {prosp?.score != null && (
                  <div>
                    <Label>Score</Label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${prosp.score}%`, borderRadius: 3, background: prosp.score >= 70 ? '#4ade80' : prosp.score >= 40 ? '#facc15' : '#f87171' }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', minWidth: 36 }}>{prosp.score}/100</span>
                    </div>
                  </div>
                )}
                {prosp?.nivel_oportunidad && (
                  <InfoItem icon={<Star size={13} />}>
                    <Label>Oportunidad</Label>
                    <span style={{ fontSize: 13, fontWeight: 600, color: oColor, textTransform: 'capitalize' }}>{prosp.nivel_oportunidad}</span>
                  </InfoItem>
                )}
                {prosp?.nivel_digital && (
                  <InfoItem icon={<Wifi size={13} />}>
                    <Label>Nivel digital</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{prosp.nivel_digital}</span>
                  </InfoItem>
                )}
                {prosp && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: prosp.tiene_web ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: prosp.tiene_web ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {prosp.tiene_web ? <Wifi size={10} /> : <WifiOff size={10} />}
                      {prosp.tiene_web ? 'Tiene web' : 'Sin web'}
                    </span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: prosp.tiene_reservas ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)', color: prosp.tiene_reservas ? '#4ade80' : '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={10} />
                      {prosp.tiene_reservas ? 'Reservas' : 'Sin reservas'}
                    </span>
                  </div>
                )}
                {prosp?.problemas && prosp.problemas.length > 0 && (
                  <div>
                    <Label>Problemas detectados</Label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                      {prosp.problemas.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#f87171' }}>
                          <AlertCircle size={10} style={{ flexShrink: 0 }} /> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Section>

            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function ContactsClient({ companies }: { companies: Company[]; userId: string }) {
  const [search, setSearch] = useState('')

  const filtered = companies.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.contacts?.[0]?.prospeccion?.[0]?.ciudad?.toLowerCase().includes(search.toLowerCase()) ||
    c.industry?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Topbar
        title="Contactos"
        subtitle={`${companies.length} negocios`}
        showSearch
        searchPlaceholder="Buscar por nombre, tipo, ciudad…"
        onSearch={setSearch}
      />
      <div className="page-scroller">
        <div className="page-body">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Building2 size={24} /></div>
              <div className="empty-title">Sin resultados</div>
              <p className="empty-sub">No hay negocios que coincidan con la búsqueda</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th colSpan={2} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Negocio</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dirección</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Teléfono</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Web</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Oportunidad</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</th>
                    <th style={{ width: 30 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => <CompanyRow key={c.id} company={c} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
