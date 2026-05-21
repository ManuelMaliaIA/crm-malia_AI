'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import { Building2, Phone, Mail, Globe, MapPin, User, Share2, FileText, ChevronDown, ChevronUp, ExternalLink, Copy, Check, Trash2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
  icebreak: string | null
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

function ProspectoRow({ p, onDelete }: { p: Prospecto; onDelete: (id: number) => void }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  function copyIcebreak() {
    if (!p.icebreak) return
    navigator.clipboard.writeText(p.icebreak)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    const sb = createClient()
    await sb.from('prospectos').delete().eq('id', p.id)
    onDelete(p.id)
  }

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

        {/* Acciones */}
        <td style={{ padding: '12px 16px 12px 8px', width: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Eliminar contacto"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 26, height: 26, borderRadius: 6,
                border: '1px solid var(--border-2)',
                background: 'transparent',
                color: deleting ? 'var(--text-4)' : 'var(--text-3)',
                cursor: deleting ? 'not-allowed' : 'pointer',
                transition: 'all .15s ease',
              }}
              onMouseEnter={e => { if (!deleting) { e.currentTarget.style.background = 'rgba(220,79,79,0.1)'; e.currentTarget.style.color = '#dc4f4f'; e.currentTarget.style.borderColor = 'rgba(220,79,79,0.3)' }}}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
            >
              <Trash2 size={13} />
            </button>
            <div style={{ color: 'var(--text-3)' }}>
              {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </div>
          </div>
        </td>
      </tr>

      {/* Panel expandido */}
      {open && (
        <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
          <td colSpan={9} style={{ padding: '20px 24px' }}>
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

                {/* Icebreak */}
                {p.icebreak && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Label>Mensaje de apertura</Label>
                      <button
                        onClick={copyIcebreak}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 11, fontWeight: 600, padding: '3px 10px',
                          borderRadius: 6, border: '1px solid var(--border-2)',
                          background: copied ? 'rgba(14,140,120,0.1)' : 'var(--surface-2)',
                          color: copied ? '#0E8C78' : 'var(--text-2)',
                          cursor: 'pointer', transition: 'all .15s ease',
                        }}
                      >
                        {copied ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
                      </button>
                    </div>
                    <div style={{
                      fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6,
                      background: 'var(--surface-2)', borderRadius: 8,
                      padding: '10px 14px', borderLeft: '3px solid var(--gold)',
                      fontStyle: 'italic',
                    }}>
                      {p.icebreak}
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

const EMPTY_FORM = {
  nombre: '', tipo: '', direccion: '', telefono: '', email: '', web: '',
  ciudad: '', cp: '', nicho: '', dueno_nombre: '', dueno_telefono: '', dueno_email: '', nota: '',
}

function NuevoContactoModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Prospecto) => void }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  function field(key: keyof typeof EMPTY_FORM, label: string, required = false) {
    return (
      <div>
        <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
          {label}{required && <span style={{ color: '#e87171' }}> *</span>}
        </label>
        <input
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{
            width: '100%', padding: '7px 10px', borderRadius: 7, fontSize: 13,
            border: '1px solid var(--border-2)', background: 'var(--surface-1)',
            color: 'var(--text)', outline: 'none',
          }}
        />
      </div>
    )
  }

  async function handleSave() {
    if (!form.nombre.trim()) return
    setSaving(true)
    const sb = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb as any).from('prospectos').insert({
      nombre: form.nombre.trim(),
      tipo: form.tipo || null,
      direccion: form.direccion || null,
      telefono: form.telefono || null,
      email: form.email || null,
      web: form.web || null,
      ciudad: form.ciudad || null,
      cp: form.cp || null,
      nicho: form.nicho || null,
      dueno_nombre: form.dueno_nombre || null,
      dueno_telefono: form.dueno_telefono || null,
      dueno_email: form.dueno_email || null,
      nota: form.nota || null,
      fecha_prospeccion: new Date().toISOString().split('T')[0],
    }).select().single()
    setSaving(false)
    if (!error && data) { onCreated(data as Prospecto); onClose() }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface-1)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 620,
        border: '1px solid var(--border-2)', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Nuevo contacto</div>
          <button onClick={onClose} style={{ color: 'var(--text-3)', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>{field('nombre', 'Nombre del negocio', true)}</div>
          {field('tipo', 'Tipo')}
          {field('nicho', 'Nicho')}
          <div style={{ gridColumn: '1/-1' }}>{field('direccion', 'Dirección')}</div>
          {field('telefono', 'Teléfono')}
          {field('email', 'Email')}
          {field('web', 'Web')}
          {field('ciudad', 'Ciudad')}
          {field('cp', 'Código postal')}

          <div style={{ gridColumn: '1/-1', borderTop: '1px solid var(--border)', paddingTop: 14, fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Propietario</div>
          {field('dueno_nombre', 'Nombre')}
          {field('dueno_telefono', 'Teléfono')}
          <div style={{ gridColumn: '1/-1' }}>{field('dueno_email', 'Email')}</div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>Nota</label>
            <textarea
              value={form.nota}
              onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
              rows={3}
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 7, fontSize: 13,
                border: '1px solid var(--border-2)', background: 'var(--surface-1)',
                color: 'var(--text)', outline: 'none', resize: 'vertical',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.nombre.trim()} className="btn-primary">
            {saving ? 'Guardando…' : 'Crear contacto'}
          </button>
        </div>
      </div>
    </div>
  )
}

type ScoreFilter = 'todos' | 'alto' | 'medio' | 'bajo' | 'sin_score'

export default function ContactsClient({ prospectos: initial }: { prospectos: Prospecto[]; userId: string }) {
  const [prospectos, setProspectos] = useState(initial)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('todos')

  function handleDelete(id: number) {
    setProspectos(prev => prev.filter(p => p.id !== id))
  }

  function handleCreated(p: Prospecto) {
    setProspectos(prev => [p, ...prev])
  }

  const filtered = prospectos.filter(p => {
    if (search && !(
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.ciudad?.toLowerCase().includes(search.toLowerCase()) ||
      p.tipo?.toLowerCase().includes(search.toLowerCase()) ||
      p.direccion?.toLowerCase().includes(search.toLowerCase())
    )) return false

    if (scoreFilter === 'alto') return p.score != null && p.score >= 70
    if (scoreFilter === 'medio') return p.score != null && p.score >= 40 && p.score < 70
    if (scoreFilter === 'bajo') return p.score != null && p.score < 40
    if (scoreFilter === 'sin_score') return p.score == null
    return true
  })

  return (
    <>
      {showModal && <NuevoContactoModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
      <Topbar
        title="Contactos"
        subtitle={`${prospectos.length} negocios prospectados`}
        showSearch
        searchPlaceholder="Buscar por nombre, tipo, ciudad…"
        onSearch={setSearch}
        actions={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} strokeWidth={2.5} /> Nuevo contacto
          </button>
        }
      />
      <div className="page-scroller">
        <div className="page-body">

          {/* Filtros de score */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {([
              { key: 'todos',     label: 'Todos',       color: 'var(--text-2)' },
              { key: 'alto',      label: '🟢 Score alto (≥70)',  color: '#0E8C78' },
              { key: 'medio',     label: '🟠 Score medio (40–69)', color: '#E8963C' },
              { key: 'bajo',      label: '🔴 Score bajo (<40)',   color: '#e87171' },
              { key: 'sin_score', label: 'Sin score',    color: 'var(--text-3)' },
            ] as { key: ScoreFilter; label: string; color: string }[]).map(f => (
              <button
                key={f.key}
                onClick={() => setScoreFilter(f.key)}
                style={{
                  fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 99,
                  border: `1px solid ${scoreFilter === f.key ? f.color : 'var(--border-2)'}`,
                  background: scoreFilter === f.key ? `${f.color}18` : 'var(--surface-1)',
                  color: scoreFilter === f.key ? f.color : 'var(--text-3)',
                  cursor: 'pointer', transition: 'all .15s ease',
                }}
              >
                {f.label}
                {f.key !== 'todos' && (
                  <span style={{ marginLeft: 6, opacity: 0.7 }}>
                    ({prospectos.filter(p =>
                      f.key === 'alto' ? (p.score != null && p.score >= 70) :
                      f.key === 'medio' ? (p.score != null && p.score >= 40 && p.score < 70) :
                      f.key === 'bajo' ? (p.score != null && p.score < 40) :
                      p.score == null
                    ).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Building2 size={24} /></div>
              <div className="empty-title">Sin contactos</div>
              <p className="empty-sub">Crea tu primer contacto o importa desde el kit de prospección</p>
              <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                <Plus size={14} /> Nuevo contacto
              </button>
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
                    <th style={{ width: 60 }} />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => <ProspectoRow key={p.id} p={p} onDelete={handleDelete} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
