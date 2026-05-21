'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import { Plus, Building2, Globe, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Company = {
  id: string; name: string; domain: string | null; industry: string | null
  size: string | null; website: string | null; created_at: string
}

export default function CompaniesClient({ companies: initial, userId }: { companies: Company[]; userId: string }) {
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
    }).select().single()
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filtered.map(c => (
                <div key={c.id} className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: 'var(--surface-2)',
                      border: '1px solid var(--border-2)', display: 'grid', placeItems: 'center', flexShrink: 0
                    }}>
                      <Building2 size={18} color="var(--text-3)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                      {c.domain && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.domain}</div>}
                    </div>
                  </div>
                  {(c.industry || c.size) && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {c.industry && <span className="chip" style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}>{c.industry}</span>}
                      {c.size && <span className="chip" style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}>{c.size}</span>}
                    </div>
                  )}
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <Globe size={12} /> {c.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              ))}
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
                  <input className="form-input" value={form.industry} onChange={e => setF('industry', e.target.value)} placeholder="SaaS" />
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
                  <input className="form-input" value={form.website} onChange={e => setF('website', e.target.value)} placeholder="https://acme.com" />
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
