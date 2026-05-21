'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import { Building2, Phone, Mail, Globe, MapPin, User, Share2, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

type Prospecto = {
  id: number
  nombre: string
  tipo: string | null
  direccion: string | null
  telefono: string | null
  telefono_2: string | null
  telefono_3: string | null
  email: string | null
  web: string | null
  redes: string | null
  nota: string | null
  dueno_nombre: string | null
  dueno_telefono: string | null
  dueno_email: string | null
  dueno_nota: string | null
  dueno_fuente: string | null
  ciudad: string | null
  cp: string | null
  nicho: string | null
  fecha_prospeccion: string | null
  created_at: string
  score: number | null
  nivel_oportunidad: string | null
  nivel_digital: string | null
  tiene_web: boolean | null
  tiene_reservas: boolean | null
  problemas: string[] | null
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

function ProspectoRow({ p }: { p: Prospecto }) {
  const [open, setOpen] = useState(false)

  const redesLinks = p.redes
    ? p.redes.split(',').map(r => r.trim()).filter(Boolean)
    : []

  return (
    <>
      {/* Fila colapsada */}
      <tr
        onClick={() => setOpen(o => !o)}
        style={{ cursor: 'pointer', borderBottom: open ? 'none' : '1px solid var(--border)', background: open ? 'var(--surface-2)' : 'transparent' }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--surface-1)' }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Avatar + nombre */}
        <td style={{ padding: '12px 16px', width: 40 }}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
            {initials(p.nombre)}
          </div>
        </td>
        <td style={{ padding: '12px 8px 12px 0', minWidth: 180 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{p.nombre}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{p.tipo ?? '—'}</div>
        </td>

        {/* Dirección */}
        <td style={{ padding: '12px 8px', minWidth: 200 }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{p.direccion ?? '—'}</span>
        </td>

        {/* Teléfono */}
        <td style={{ padding: '12px 8px', minWidth: 130 }}>
          {p.telefono ? (
            <a href={`tel:${p.telefono}`} style={{ fontSize: 12.5, color: 'var(--text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }} onClick={e => e.stopPropagation()}>
              <Phone size={11} color="var(--text-3)" /> {p.telefono}
            </a>
          ) : <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>}
        </td>

        {/* Web */}
        <td style={{ padding: '12px 8px', minWidth: 140 }}>
          {p.web ? (
            <a href={p.web.startsWith('http') ? p.web : `https://${p.web}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={e => e.stopPropagation()}>
              <Globe size={11} /> {p.web.replace(/^https?:\/\//, '').slice(0, 24)}
            </a>
          ) : <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Sin web</span>}
        </td>

        {/* Ciudad */}
        <td style={{ padding: '12px 8px' }}>
          <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{p.ciudad ?? '—'}</span>
        </td>

        {/* Score */}
        <td style={{ padding: '12px 8px', minWidth: 70 }}>
          {p.score != null ? (
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: p.score >= 70 ? '#0E8C78' : p.score >= 40 ? '#E8963C' : '#e87171'
            }}>
              {p.score}/100
            </span>
          ) : <span style={{ fontSize: 12, color: 'var(--text-4)' }}>—</span>}
        </td>

        {/* Chevron */}
        <td style={{ padding: '12px 16px 12px 8px', width: 30 }}>
          <div style={{ color: 'var(--text-3)' }}>
            {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </td>
      </tr>

      {/* Panel expandido */}
      {open && (
        <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <td colSpan={8} style={{ padding: '20px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 28 }}>

              {/* Negocio */}
              <Section title="Negocio">
                {p.tipo && (
                  <InfoItem icon={<Building2 size={13} />}>
                    <Label>Tipo</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{p.tipo}</span>
                  </InfoItem>
                )}
                {p.direccion && (
                  <InfoItem icon={<MapPin size={13} />}>
                    <Label>Dirección</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{p.direccion}</span>
                  </InfoItem>
                )}
                {p.telefono && (
                  <InfoItem icon={<Phone size={13} />}>
                    <Label>Teléfono</Label>
                    <a href={`tel:${p.telefono}`} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>{p.telefono}</a>
                  </InfoItem>
                )}
                {p.telefono_2 && (
                  <InfoItem icon={<Phone size={13} />}>
                    <Label>Teléfono 2</Label>
                    <a href={`tel:${p.telefono_2}`} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>{p.telefono_2}</a>
                  </InfoItem>
                )}
                {p.telefono_3 && (
                  <InfoItem icon={<Phone size={13} />}>
                    <Label>Teléfono 3</Label>
                    <a href={`tel:${p.telefono_3}`} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>{p.telefono_3}</a>
                  </InfoItem>
                )}
                {p.email && (
                  <InfoItem icon={<Mail size={13} />}>
                    <Label>Email</Label>
                    <a href={`mailto:${p.email}`} style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>{p.email}</a>
                  </InfoItem>
                )}
                {p.web && (
                  <InfoItem icon={<Globe size={13} />}>
                    <Label>Web</Label>
                    <a href={p.web.startsWith('http') ? p.web : `https://${p.web}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}>
                      {p.web.replace(/^https?:\/\//, '')} <ExternalLink size={10} style={{ flexShrink: 0 }} />
                    </a>
                  </InfoItem>
                )}
                {redesLinks.length > 0 && (
                  <InfoItem icon={<Share2 size={13} />}>
                    <Label>Redes sociales</Label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {redesLinks.map((r, i) => (
                        <a key={i} href={r.startsWith('http') ? r : `https://${r}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 12, color: 'var(--text-2)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, wordBreak: 'break-all' }}>
                          {r} <ExternalLink size={9} style={{ flexShrink: 0 }} />
                        </a>
                      ))}
                    </div>
                  </InfoItem>
                )}
                {p.nota && (
                  <InfoItem icon={<FileText size={13} />}>
                    <Label>Nota</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic' }}>{p.nota}</span>
                  </InfoItem>
                )}
              </Section>

              {/* Dueño */}
              <Section title="Propietario">
                {p.dueno_nombre ? (
                  <InfoItem icon={<User size={13} />}>
                    <Label>Nombre</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{p.dueno_nombre}</span>
                  </InfoItem>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>Sin nombre identificado</span>
                )}
                {p.dueno_telefono && (
                  <InfoItem icon={<Phone size={13} />}>
                    <Label>Teléfono</Label>
                    <a href={`tel:${p.dueno_telefono}`} style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>{p.dueno_telefono}</a>
                  </InfoItem>
                )}
                {p.dueno_email && (
                  <InfoItem icon={<Mail size={13} />}>
                    <Label>Email</Label>
                    <a href={`mailto:${p.dueno_email}`} style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>{p.dueno_email}</a>
                  </InfoItem>
                )}
                {p.dueno_nota && (
                  <InfoItem icon={<FileText size={13} />}>
                    <Label>Nota</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic' }}>{p.dueno_nota}</span>
                  </InfoItem>
                )}
                {p.dueno_fuente && (
                  <InfoItem icon={<User size={13} />}>
                    <Label>Fuente</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{p.dueno_fuente}</span>
                  </InfoItem>
                )}
              </Section>

              {/* Análisis */}
              <Section title="Análisis">
                {/* Score */}
                {p.score != null && (
                  <div>
                    <Label>Score</Label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          width: `${p.score}%`,
                          background: p.score >= 70 ? '#0E8C78' : p.score >= 40 ? '#E8963C' : '#e87171',
                          transition: 'width .4s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: p.score >= 70 ? '#0E8C78' : p.score >= 40 ? '#E8963C' : '#e87171', minWidth: 32 }}>
                        {p.score}
                      </span>
                    </div>
                  </div>
                )}

                {/* Nivel oportunidad */}
                {p.nivel_oportunidad && (
                  <div>
                    <Label>Oportunidad</Label>
                    <span style={{
                      display: 'inline-block', marginTop: 3,
                      fontSize: 11.5, fontWeight: 600, padding: '2px 10px', borderRadius: 99,
                      background: p.nivel_oportunidad === 'alta' ? 'rgba(14,140,120,0.12)' : p.nivel_oportunidad === 'media' ? 'rgba(232,150,60,0.12)' : 'rgba(232,113,113,0.12)',
                      color: p.nivel_oportunidad === 'alta' ? '#0E8C78' : p.nivel_oportunidad === 'media' ? '#E8963C' : '#e87171',
                      textTransform: 'capitalize'
                    }}>
                      {p.nivel_oportunidad}
                    </span>
                  </div>
                )}

                {/* Nivel digital */}
                {p.nivel_digital && (
                  <InfoItem icon={<Globe size={13} />}>
                    <Label>Presencia digital</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)', textTransform: 'capitalize' }}>{p.nivel_digital}</span>
                  </InfoItem>
                )}

                {/* Badges tiene_web / tiene_reservas */}
                {(p.tiene_web != null || p.tiene_reservas != null) && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {p.tiene_web != null && (
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500,
                        background: p.tiene_web ? 'rgba(14,140,120,0.1)' : 'rgba(232,113,113,0.1)',
                        color: p.tiene_web ? '#0E8C78' : '#e87171'
                      }}>
                        {p.tiene_web ? '✓ Tiene web' : '✗ Sin web'}
                      </span>
                    )}
                    {p.tiene_reservas != null && (
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 99, fontWeight: 500,
                        background: p.tiene_reservas ? 'rgba(14,140,120,0.1)' : 'rgba(232,113,113,0.1)',
                        color: p.tiene_reservas ? '#0E8C78' : '#e87171'
                      }}>
                        {p.tiene_reservas ? '✓ Reservas online' : '✗ Sin reservas'}
                      </span>
                    )}
                  </div>
                )}

                {/* Problemas */}
                {p.problemas && p.problemas.length > 0 && (
                  <div>
                    <Label>Problemas detectados</Label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                      {p.problemas.map((pr, i) => (
                        <span key={i} style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                          <span style={{ color: '#e87171', flexShrink: 0 }}>·</span> {pr}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detalles extras */}
                {p.nicho && (
                  <InfoItem icon={<Building2 size={13} />}>
                    <Label>Nicho</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)', textTransform: 'capitalize' }}>{p.nicho}</span>
                  </InfoItem>
                )}
                {p.fecha_prospeccion && (
                  <InfoItem icon={<FileText size={13} />}>
                    <Label>Fecha prospección</Label>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                      {format(parseISO(p.fecha_prospeccion), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </InfoItem>
                )}
              </Section>

            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function ContactsClient({ prospectos }: { prospectos: Prospecto[]; userId: string }) {
  const [search, setSearch] = useState('')

  const filtered = prospectos.filter(p =>
    !search ||
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.ciudad?.toLowerCase().includes(search.toLowerCase()) ||
    p.tipo?.toLowerCase().includes(search.toLowerCase()) ||
    p.direccion?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Topbar
        title="Contactos"
        subtitle={`${prospectos.length} negocios prospectados`}
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
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ciudad</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score</th>
                    <th style={{ width: 30 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => <ProspectoRow key={p.id} p={p} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
