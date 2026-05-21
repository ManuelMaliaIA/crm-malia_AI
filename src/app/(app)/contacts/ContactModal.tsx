'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { ContactStatus } from '@/lib/supabase/types'

interface Props {
  userId: string
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCreated: (contact: any) => void
}

export default function ContactModal({ userId, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', title: '', status: 'lead', owner: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.first_name.trim()) errs.first_name = 'Requerido'
    if (!form.last_name.trim()) errs.last_name = 'Requerido'
    if (!form.email.trim()) errs.email = 'Requerido'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    const sb = createClient()
    const { data, error } = await sb.from('contacts').insert({
      ...form,
      status: form.status as ContactStatus,
      user_id: userId,
    }).select('*, companies(name)').single()

    setLoading(false)
    if (error) { setErrors({ email: error.message }); return }
    onCreated(data)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Nuevo contacto</h2>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className={`form-input ${errors.first_name ? 'error' : ''}`} value={form.first_name} onChange={e => set('first_name', e.target.value)} placeholder="Ana" />
              {errors.first_name && <span className="form-error">{errors.first_name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Apellido *</label>
              <input className={`form-input ${errors.last_name ? 'error' : ''}`} value={form.last_name} onChange={e => set('last_name', e.target.value)} placeholder="García" />
              {errors.last_name && <span className="form-error">{errors.last_name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input type="email" className={`form-input ${errors.email ? 'error' : ''}`} value={form.email} onChange={e => set('email', e.target.value)} placeholder="ana@empresa.com" />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+34 600 000 000" />
            </div>
            <div className="form-group">
              <label className="form-label">Cargo</label>
              <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="CEO" />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-input form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Cliente</option>
                <option value="churned">Churned</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Owner</label>
              <input className="form-input" value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Tu nombre" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Crear contacto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
