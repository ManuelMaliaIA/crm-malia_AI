'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DealStage } from '@/lib/supabase/types'

const STAGES = [
  { key: 'prospecting', label: 'Prospección', prob: 20 },
  { key: 'qualification', label: 'Calificación', prob: 40 },
  { key: 'proposal', label: 'Propuesta', prob: 60 },
  { key: 'negotiation', label: 'Negociación', prob: 80 },
  { key: 'closed_won', label: 'Ganado', prob: 100 },
  { key: 'closed_lost', label: 'Perdido', prob: 0 },
]

interface Props {
  contacts: Array<{ id: string; first_name: string; last_name: string }>
  companies: Array<{ id: string; name: string }>
  userId: string
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n)}`
}

export default function NewDealClient({ contacts, companies, userId }: Props) {
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    title: '',
    value: '',
    stage: 'prospecting',
    probability: '20',
    contact_id: '',
    company_id: '',
    close_date: '',
    description: '',
    owner: '',
  })

  function set(field: string, value: string) {
    setForm(f => {
      const next = { ...f, [field]: value }
      if (field === 'stage') {
        const stage = STAGES.find(s => s.key === value)
        if (stage) next.probability = String(stage.prob)
      }
      return next
    })
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const weightedValue = Number(form.value) * (Number(form.probability) / 100)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'El título es requerido'
    if (!form.value || isNaN(Number(form.value))) errs.value = 'Valor inválido'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const sb = createClient()
    const { error } = await sb.from('deals').insert({
      title: form.title.trim(),
      value: Number(form.value),
      stage: form.stage as DealStage,
      probability: Number(form.probability),
      contact_id: form.contact_id || null,
      company_id: form.company_id || null,
      close_date: form.close_date || null,
      description: form.description || null,
      owner: form.owner || null,
      user_id: userId,
    })
    setLoading(false)
    if (error) { setErrors({ title: error.message }); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <>
        <header className="topbar">
          <button className="icon-btn" onClick={() => router.push('/pipeline')}>
            <ArrowLeft size={16} />
          </button>
          <div className="topbar-left" style={{ marginLeft: 8 }}>
            <h1 className="page-title">Nuevo deal</h1>
          </div>
        </header>
        <div className="page-scroller">
          <div className="page-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(80,200,120,0.12)', border: '1px solid rgba(80,200,120,0.3)',
              display: 'grid', placeItems: 'center', marginBottom: 20
            }}>
              <CheckCircle size={32} color="#5ac878" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Deal creado exitosamente
            </h2>
            <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 28 }}>
              {form.title} — {fmt(Number(form.value))}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-ghost" onClick={() => { setSuccess(false); setForm({ title: '', value: '', stage: 'prospecting', probability: '20', contact_id: '', company_id: '', close_date: '', description: '', owner: '' }) }}>
                Crear otro
              </button>
              <button className="btn-primary" onClick={() => router.push('/pipeline')}>
                Ver pipeline
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <header className="topbar">
        <button className="icon-btn" onClick={() => router.back()}>
          <ArrowLeft size={16} />
        </button>
        <div className="topbar-left" style={{ marginLeft: 8 }}>
          <h1 className="page-title">Nuevo deal</h1>
          <p className="page-sub">Añade un deal al pipeline</p>
        </div>
      </header>

      <div className="page-scroller">
        <div className="page-body">
          <form onSubmit={submit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
              {/* Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 16 }}>Información básica</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Nombre del deal *</label>
                      <input
                        className={`form-input ${errors.title ? 'error' : ''}`}
                        value={form.title}
                        onChange={e => set('title', e.target.value)}
                        placeholder="ej. Implementación agente IA"
                      />
                      {errors.title && <span className="form-error">{errors.title}</span>}
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Valor ($) *</label>
                        <input
                          type="number"
                          min="0"
                          className={`form-input ${errors.value ? 'error' : ''}`}
                          value={form.value}
                          onChange={e => set('value', e.target.value)}
                          placeholder="15000"
                        />
                        {errors.value && <span className="form-error">{errors.value}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Fecha de cierre</label>
                        <input
                          type="date"
                          className="form-input"
                          value={form.close_date}
                          onChange={e => set('close_date', e.target.value)}
                          style={{ colorScheme: 'dark' }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Descripción</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        value={form.description}
                        onChange={e => set('description', e.target.value)}
                        placeholder="Detalles del deal…"
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-title" style={{ marginBottom: 16 }}>Etapa y probabilidad</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                    {STAGES.map(s => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => set('stage', s.key)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: 8,
                          border: `1px solid ${form.stage === s.key ? 'var(--gold-dim)' : 'var(--border)'}`,
                          background: form.stage === s.key ? 'var(--gold-soft)' : 'var(--surface-2)',
                          color: form.stage === s.key ? 'var(--gold)' : 'var(--text-3)',
                          fontSize: 12.5, fontWeight: form.stage === s.key ? 600 : 400,
                          cursor: 'pointer', transition: 'all .12s ease'
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Probabilidad: {form.probability}%</label>
                    <input
                      type="range" min="0" max="100" step="5"
                      value={form.probability}
                      onChange={e => set('probability', e.target.value)}
                      style={{ width: '100%', accentColor: 'var(--gold)' }}
                    />
                  </div>
                </div>

                <div className="card">
                  <div className="card-title" style={{ marginBottom: 16 }}>Asignación</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Contacto</label>
                      <select className="form-input form-select" value={form.contact_id} onChange={e => set('contact_id', e.target.value)}>
                        <option value="">Sin contacto</option>
                        {contacts.map(c => (
                          <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Empresa</label>
                      <select className="form-input form-select" value={form.company_id} onChange={e => set('company_id', e.target.value)}>
                        <option value="">Sin empresa</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Owner</label>
                      <input className="form-input" value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Tu nombre" />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Crear deal'}
                  </button>
                </div>
              </div>

              {/* Summary panel */}
              <div style={{ position: 'sticky', top: 20 }}>
                <div className="card">
                  <div className="card-title" style={{ marginBottom: 16 }}>Resumen</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-3)' }}>Nombre</span>
                      <span style={{ fontWeight: 500, maxWidth: 160, textAlign: 'right' }} className="truncate">
                        {form.title || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-3)' }}>Valor</span>
                      <span style={{ fontWeight: 600, color: 'var(--gold)' }}>
                        {form.value ? fmt(Number(form.value)) : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-3)' }}>Etapa</span>
                      <span>{STAGES.find(s => s.key === form.stage)?.label}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-3)' }}>Probabilidad</span>
                      <span>{form.probability}%</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-3)' }}>Valor ponderado</span>
                        <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>
                          {form.value ? fmt(weightedValue) : '—'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>
                        Valor × probabilidad
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
