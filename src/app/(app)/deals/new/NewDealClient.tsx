'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { DealStage } from '@/lib/supabase/types'

const STAGES = [
  { key: 'prospecting', label: 'Prospección' },
  { key: 'proposal',    label: 'Propuesta' },
  { key: 'negotiation', label: 'Negociación' },
  { key: 'closed_won',  label: 'Ganado' },
  { key: 'closed_lost', label: 'Perdido' },
]

interface Props {
  prospectos: Array<{ id: number; nombre: string }>
  companies: Array<{ id: string; name: string }>
  userId: string
}

function fmt(n: number) {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`
  return `€${Math.round(n)}`
}

export default function NewDealClient({ prospectos, companies, userId }: Props) {
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    title: '',
    setup_fee: '',
    monthly_fee: '',
    stage: 'prospecting',
    prospecto_id: '',
    company_id: '',
    close_date: '',
    description: '',
    owner: '',
  })

  function set(field: string, value: string) {
    setForm(f => {
      const next = { ...f, [field]: value }
      // Auto-fill title with prospecto name if title is still empty
      if (field === 'prospecto_id' && !f.title) {
        const p = prospectos.find(p => String(p.id) === value)
        if (p) next.title = p.nombre
      }
      return next
    })
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const setupNum = Number(form.setup_fee) || 0
  const monthlyNum = Number(form.monthly_fee) || 0
  const annualValue = setupNum + monthlyNum * 12

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.title.trim()) errs.title = 'El título es requerido'
    if (setupNum === 0 && monthlyNum === 0) errs.setup_fee = 'Introduce al menos un importe'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const sb = createClient()
    const prospectoId = form.prospecto_id ? Number(form.prospecto_id) : null

    const { error } = await sb.from('deals').insert({
      title: form.title.trim(),
      setup_fee: setupNum,
      monthly_fee: monthlyNum,
      value: annualValue,
      stage: form.stage as DealStage,
      probability: 0,
      prospecto_id: prospectoId,
      company_id: form.company_id || null,
      close_date: form.close_date || null,
      description: form.description || null,
      owner: form.owner || null,
      user_id: userId,
    })

    if (!error && prospectoId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (sb as any).from('prospectos').update({ en_pipeline: true }).eq('id', prospectoId)
    }

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
              {form.title}
              {setupNum > 0 && ` · ${fmt(setupNum)} setup`}
              {monthlyNum > 0 && ` · ${fmt(monthlyNum)}/mes`}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-ghost" onClick={() => {
                setSuccess(false)
                setForm({ title: '', setup_fee: '', monthly_fee: '', stage: 'prospecting', prospecto_id: '', company_id: '', close_date: '', description: '', owner: '' })
              }}>
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
                        <label className="form-label">Setup (pago único, €)</label>
                        <input
                          type="number" min="0"
                          className={`form-input ${errors.setup_fee ? 'error' : ''}`}
                          value={form.setup_fee}
                          onChange={e => set('setup_fee', e.target.value)}
                          placeholder="1500"
                        />
                        {errors.setup_fee && <span className="form-error">{errors.setup_fee}</span>}
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mensualidad (€/mes)</label>
                        <input
                          type="number" min="0"
                          className="form-input"
                          value={form.monthly_fee}
                          onChange={e => set('monthly_fee', e.target.value)}
                          placeholder="300"
                        />
                      </div>
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
                  <div className="card-title" style={{ marginBottom: 16 }}>Etapa</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {STAGES.map(s => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => set('stage', s.key)}
                        style={{
                          padding: '8px 4px', borderRadius: 8,
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
                </div>

                <div className="card">
                  <div className="card-title" style={{ marginBottom: 16 }}>Asignación</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Prospecto</label>
                      <select className="form-input form-select" value={form.prospecto_id} onChange={e => set('prospecto_id', e.target.value)}>
                        <option value="">Sin prospecto</option>
                        {prospectos.map(p => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
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
                    {form.prospecto_id && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-3)' }}>Prospecto</span>
                        <span style={{ fontWeight: 500, maxWidth: 160, textAlign: 'right' }} className="truncate">
                          {prospectos.find(p => String(p.id) === form.prospecto_id)?.nombre}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-3)' }}>Setup</span>
                      <span style={{ fontWeight: 600, color: 'var(--gold)' }}>
                        {setupNum > 0 ? fmt(setupNum) : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-3)' }}>Mensualidad</span>
                      <span style={{ fontWeight: 600, color: 'var(--gold)' }}>
                        {monthlyNum > 0 ? `${fmt(monthlyNum)}/mes` : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'var(--text-3)' }}>Etapa</span>
                      <span>{STAGES.find(s => s.key === form.stage)?.label}</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-3)' }}>Valor anual</span>
                        <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: 15 }}>
                          {annualValue > 0 ? fmt(annualValue) : '—'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>
                        Setup + mensualidad × 12
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
