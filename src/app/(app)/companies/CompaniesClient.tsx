'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { Plus, Building2, Globe, X, User, Phone, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type ContactSnip = { id: string; first_name: string; last_name: string; title: string | null; phone: string | null; email: string }
type Company = {
  id: string; name: string; domain: string | null; industry: string | null
  size: string | null; website: string | null; created_at: string
  contacts?: ContactSnip[]
}

export default function CompaniesClient({ companies: initial, userId }: { companies: Company[]; userId: string }) {
  const router = useRouter()
  const [companies, setCompanies] = useState(initial)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', domain: '', industry: '', size: '', website: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = companies.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  function setF(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setErrors({ name: 'Requerido' }); return }
    setLoading(true)
    const sb = createClient()
    const { data, error } = await sb.from('companies').insert({
      name: form.name.trim(),
      domain: form.domain || null,
      industry: form.industry || null,
      size: form.size || null,
      website: form.website || null,
      user_id: userId,
    }).select('*, contacts(id, first_name, last_name, title, phone, email)').single()
    setLoading(false)
    if (error) { setErrors({ name: error.message }); return }
    setCompanies(c => [data, ...c])
    setShowModal(false)
    setForm({ name: '', domain: '', industry: '', size: '', website: '' })
  }

  return (
    <>
      <Topbar
        title="Empresas"
        subtitle={`${companies.length} empresas`}
        showSearch
        searchPlaceholder="Buscar empresa…"
        onSearch={setSearch}
        actions={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nueva empresa
          </button>
        }
      />
      <div className="page-scroller">
        <div className="page-body">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Building2 size={24} /></div>
              <div className="empty-title">Sin empresas</div>
              <p className="empty-sub">Añade empresas para asociarlas a contactos y deals</p>
              <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                <Plus size={14} /> Nueva empresa
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
              {filtered.map(c => {
                const owner = c.contacts?.[0] ?? null
                return (
                  <div
                    key={c.id}
                    className="card"
                    style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                    onClick={() => router.push(`/companies/${c.id}`)}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
                  >
                    {/* Cabecera empresa */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)',
                        border: '1px solid var(--border-2)', display: 'grid', placeItems: 'center', flexShrink: 0
                      }}>
                        <Building2 size={18} color="var(--text-3)" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }} className="truncate">{c.name}</div>
                        {c.domain && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.domain}</div>}
                      </div>
                    </div>

                    {/* Chips */}
                    {(c.industry || c.size) && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                        {c.industry && <span className="chip" style={{ background: 'var(--surface-3)', color: 'var(--text-3)', textTransform: 'capitalize' }}>{c.industry}</span>}
                        {c.size && <span className="chip" style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}>{c.size}</span>}
                      </div>
                    )}

                    {/* Web */}
                    {c.website && (
                      <a
                        href={c.website} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, fontSize: 12, color: 'var(--gold)', textDecoration: 'none' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <Globe size={12} /> {c.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}

                    {/* Propietario vinculado */}
                    {owner && (
                      <div style={{
                        borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4,
                        display: 'flex', flexDirection: 'column', gap: 5,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
                          <User size={11} />
                          <span style={{ fontWeight: 500, color: 'var(--text-2)' }}>
                            {owner.first_name} {owner.last_name}
                          </span>
                          {owner.title && <span style={{ color: 'var(--text-3)' }}>· {owner.title}</span>}
                        </div>
                        {owner.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-3)' }}>
                            <Phone size={10} /> {owner.phone}
                          </div>
                        )}
                        {!owner.email.includes('@placeholder.crm') && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--text-3)' }}>
                            <Mail size={10} /> {owner.email}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 className="modal-title" style={{ margin: 0 }}>Nueva empresa</h2>
              <button className="icon-btn" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className={`form-input ${errors.name ? 'error' : ''}`} value={form.name} onChange={e => setF('name', e.target.value)} placeholder="Acme Corp" />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Dominio</label>
                  <input className="form-input" value={form.domain} onChange={e => setF('domain', e.target.value)} placeholder="acme.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Industria</label>
                  <input className="form-input" value={form.industry} onChange={e => setF('industry', e.target.value)} placeholder="restaurante" />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Tamaño</label>
                  <select className="form-input form-select" value={form.size} onChange={e => setF('size', e.target.value)}>
                    <option value="">Seleccionar</option>
                    <option>1–10</option><option>11–50</option><option>51–200</option>
                    <option>201–500</option><option>500+</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input className="form-input" value={form.website} onChange={e => setF('website', e.target.value)} placeholder="https://negocio.es" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <span className="spinner" /> : 'Crear empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
