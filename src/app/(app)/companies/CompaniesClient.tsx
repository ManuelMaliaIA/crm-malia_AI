'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import { Building2, Phone, Mail, Globe, MapPin, Share2, ExternalLink } from 'lucide-react'

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
  ciudad: string | null
  cp: string | null
  nicho: string | null
}

export default function CompaniesClient({ prospectos }: { prospectos: Prospecto[]; userId: string }) {
  const [search, setSearch] = useState('')

  const filtered = prospectos.filter(p =>
    !search ||
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.ciudad?.toLowerCase().includes(search.toLowerCase()) ||
    p.tipo?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Topbar
        title="Empresas"
        subtitle={`${prospectos.length} negocios`}
        showSearch
        searchPlaceholder="Buscar empresa…"
        onSearch={setSearch}
      />
      <div className="page-scroller">
        <div className="page-body">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Building2 size={24} /></div>
              <div className="empty-title">Sin empresas</div>
              <p className="empty-sub">No hay negocios que coincidan con la búsqueda</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
              {filtered.map(p => {
                const redesLinks = p.redes
                  ? p.redes.split(',').map(r => r.trim()).filter(Boolean)
                  : []

                return (
                  <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Cabecera */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)',
                        border: '1px solid var(--border-2)', display: 'grid', placeItems: 'center', flexShrink: 0,
                      }}>
                        <Building2 size={18} color="var(--text-3)" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }} className="truncate">{p.nombre}</div>
                        {p.tipo && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.tipo}</div>}
                      </div>
                    </div>

                    {/* Dirección */}
                    {p.direccion && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12.5, color: 'var(--text-2)' }}>
                        <MapPin size={12} color="var(--text-3)" style={{ marginTop: 2, flexShrink: 0 }} />
                        {p.direccion}
                      </div>
                    )}

                    {/* Teléfonos */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {p.telefono && (
                        <a href={`tel:${p.telefono}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-2)', textDecoration: 'none' }}>
                          <Phone size={12} color="var(--text-3)" /> {p.telefono}
                        </a>
                      )}
                      {p.telefono_2 && (
                        <a href={`tel:${p.telefono_2}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}>
                          <Phone size={11} color="var(--text-3)" /> {p.telefono_2}
                        </a>
                      )}
                      {p.telefono_3 && (
                        <a href={`tel:${p.telefono_3}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}>
                          <Phone size={11} color="var(--text-3)" /> {p.telefono_3}
                        </a>
                      )}
                    </div>

                    {/* Email */}
                    {p.email && (
                      <a href={`mailto:${p.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--gold)', textDecoration: 'none' }}>
                        <Mail size={12} /> {p.email}
                      </a>
                    )}

                    {/* Web */}
                    {p.web && (
                      <a href={p.web.startsWith('http') ? p.web : `https://${p.web}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gold)', textDecoration: 'none' }}>
                        <Globe size={12} /> {p.web.replace(/^https?:\/\//, '')}
                        <ExternalLink size={10} />
                      </a>
                    )}

                    {/* Redes */}
                    {redesLinks.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {redesLinks.map((r, i) => (
                          <a key={i} href={r.startsWith('http') ? r : `https://${r}`} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)', textDecoration: 'none' }}>
                            <Share2 size={11} color="var(--text-3)" /> {r.replace(/^https?:\/\//, '')}
                            <ExternalLink size={9} />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Dueño */}
                    {p.dueno_nombre && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Propietario</div>
                        <div style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>{p.dueno_nombre}</div>
                        {p.dueno_telefono && (
                          <a href={`tel:${p.dueno_telefono}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}>
                            <Phone size={10} /> {p.dueno_telefono}
                          </a>
                        )}
                        {p.dueno_email && (
                          <a href={`mailto:${p.dueno_email}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--gold)', textDecoration: 'none' }}>
                            <Mail size={10} /> {p.dueno_email}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Ciudad */}
                    {p.ciudad && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                        {p.ciudad}{p.cp ? ` · ${p.cp}` : ''}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
