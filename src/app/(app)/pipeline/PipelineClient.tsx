'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
  useDraggable,
  rectIntersection,
} from '@dnd-kit/core'
import Topbar from '@/components/layout/Topbar'
import { Plus, Trash2, Pencil } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { DealStage } from '@/lib/supabase/types'

type Deal = {
  id: string
  title: string
  value: number
  setup_fee: number
  monthly_fee: number
  stage: string
  close_date: string | null
  created_at: string
  description: string | null
  prospecto_id?: number | null
  contacts?: { first_name: string; last_name: string } | null
  companies?: { name: string } | null
  prospecto?: { id: number; nombre: string } | null
}

const STAGES = [
  { key: 'prospecting', label: 'Prospección', color: '#5e5e5e' },
  { key: 'proposal',    label: 'Propuesta',   color: '#e0aa4a' },
  { key: 'negotiation', label: 'Negociación', color: '#d97ae8' },
  { key: 'closed_won',  label: 'Ganado',      color: '#5ac878' },
  { key: 'closed_lost', label: 'Perdido',     color: '#e87171' },
]

function fmt(n: number) {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}K`
  return `€${n}`
}

function dealAnnualValue(d: Deal) {
  const setup = Number(d.setup_fee) || 0
  const monthly = Number(d.monthly_fee) || 0
  if (setup > 0 || monthly > 0) return setup + monthly * 12
  return Number(d.value) || 0
}

function DealCardDisplay({ deal, isDragging = false }: { deal: Deal; isDragging?: boolean }) {
  const contact = deal.prospecto?.nombre
    ?? (deal.contacts ? `${deal.contacts.first_name} ${deal.contacts.last_name}` : deal.companies?.name)

  const setup = Number(deal.setup_fee) || 0
  const monthly = Number(deal.monthly_fee) || 0
  const hasNewFields = setup > 0 || monthly > 0

  return (
    <div className={`deal-card ${isDragging ? 'dragging' : ''}`}>
      <div className="deal-title">{deal.title}</div>
      {contact && <div className="deal-company">{contact}</div>}
      <div className="deal-meta">
        {hasNewFields ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {setup > 0 && <span className="deal-value" style={{ fontSize: 11 }}>{fmt(setup)} setup</span>}
            {monthly > 0 && <span className="deal-value" style={{ fontSize: 11 }}>{fmt(monthly)}/mes</span>}
          </div>
        ) : (
          <span className="deal-value">{fmt(Number(deal.value))}</span>
        )}
      </div>
    </div>
  )
}

function DraggableDeal({ deal, onDelete, onEdit }: { deal: Deal; onDelete: (id: string) => void; onEdit: (deal: Deal) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id })
  const [hovered, setHovered] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm(`¿Eliminar "${deal.title}"?`)) return
    setDeleting(true)
    const sb = createClient()
    await sb.from('deals').delete().eq('id', deal.id)

    // Si había un prospecto vinculado, comprobar si quedan más deals suyos
    if (deal.prospecto?.id) {
      const { data: remaining } = await sb
        .from('deals')
        .select('id')
        .eq('prospecto_id', deal.prospecto.id)
      if (!remaining || remaining.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (sb as any).from('prospectos').update({ en_pipeline: false }).eq('id', deal.prospecto.id)
      }
    }

    onDelete(deal.id)
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    onEdit(deal)
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.35 : 1, cursor: 'grab', touchAction: 'none', position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <DealCardDisplay deal={deal} />
      {hovered && !isDragging && (
        <div
          onPointerDown={e => e.stopPropagation()}
          style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}
        >
          <button
            onClick={handleEdit}
            title="Editar deal"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: 5,
              border: '1px solid rgba(26,111,170,0.3)',
              background: 'rgba(26,111,170,0.1)',
              color: '#1A6FAA', cursor: 'pointer',
            }}
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Eliminar deal"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 22, height: 22, borderRadius: 5,
              border: '1px solid rgba(220,79,79,0.3)',
              background: 'rgba(220,79,79,0.1)',
              color: '#dc4f4f', cursor: deleting ? 'not-allowed' : 'pointer',
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

function DroppableColumn({ stageKey, children, isOver }: {
  stageKey: string; children: React.ReactNode; isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: stageKey })
  return (
    <div
      ref={setNodeRef}
      className={`col-body ${isOver ? 'drag-over' : ''}`}
      style={{ minHeight: 200 }}
    >
      {children}
    </div>
  )
}

function EditDealModal({ deal, prospectos, onClose, onSave }: {
  deal: Deal
  prospectos: Array<{ id: number; nombre: string }>
  onClose: () => void
  onSave: (updated: Deal) => void
}) {
  const [form, setForm] = useState({
    title: deal.title,
    setup_fee: String(Number(deal.setup_fee) || ''),
    monthly_fee: String(Number(deal.monthly_fee) || ''),
    stage: deal.stage,
    close_date: deal.close_date ?? '',
    description: deal.description ?? '',
    prospecto_id: String(deal.prospecto?.id ?? deal.prospecto_id ?? ''),
  })
  const [saving, setSaving] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    const setup = Number(form.setup_fee) || 0
    const monthly = Number(form.monthly_fee) || 0
    const value = setup + monthly * 12
    const newProspectoId = form.prospecto_id ? Number(form.prospecto_id) : null
    const oldProspectoId = deal.prospecto?.id ?? deal.prospecto_id ?? null

    const sb = createClient()
    await sb.from('deals').update({
      title: form.title.trim(),
      setup_fee: setup,
      monthly_fee: monthly,
      value,
      stage: form.stage as DealStage,
      close_date: form.close_date || null,
      description: form.description || null,
      prospecto_id: newProspectoId,
    }).eq('id', deal.id)

    // Actualizar en_pipeline: desmarcar el prospecto anterior, marcar el nuevo
    /* eslint-disable @typescript-eslint/no-explicit-any */
    if (oldProspectoId && oldProspectoId !== newProspectoId) {
      const { data: otherDeals } = await sb.from('deals').select('id').eq('prospecto_id', oldProspectoId).neq('id', deal.id)
      if (!otherDeals?.length) {
        await (sb as any).from('prospectos').update({ en_pipeline: false }).eq('id', oldProspectoId)
      }
    }
    if (newProspectoId) {
      await (sb as any).from('prospectos').update({ en_pipeline: true }).eq('id', newProspectoId)
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    const newProspecto = newProspectoId ? prospectos.find(p => p.id === newProspectoId) ?? null : null
    onSave({ ...deal, title: form.title.trim(), setup_fee: setup, monthly_fee: monthly, value, stage: form.stage, close_date: form.close_date || null, description: form.description || null, prospecto_id: newProspectoId, prospecto: newProspecto })
    setSaving(false)
    onClose()
  }

  const inputStyle = {
    width: '100%', padding: '7px 10px', borderRadius: 7, fontSize: 13,
    border: '1px solid var(--border-2)', background: 'var(--surface-2)',
    color: 'var(--text)', outline: 'none',
  }
  const labelStyle = {
    fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', display: 'block', marginBottom: 4,
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface-1)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 520, border: '1px solid var(--border-2)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Editar deal</div>
          <button onClick={onClose} style={{ color: 'var(--text-3)', fontSize: 18, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nombre *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Setup (€)</label>
              <input type="number" min="0" value={form.setup_fee} onChange={e => set('setup_fee', e.target.value)} style={inputStyle} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Mensualidad (€/mes)</label>
              <input type="number" min="0" value={form.monthly_fee} onChange={e => set('monthly_fee', e.target.value)} style={inputStyle} placeholder="0" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Prospecto</label>
            <select
              value={form.prospecto_id}
              onChange={e => set('prospecto_id', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Sin prospecto</option>
              {prospectos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Etapa</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {STAGES.map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => set('stage', s.key)}
                  style={{
                    padding: '6px 4px', borderRadius: 7, fontSize: 12,
                    border: `1px solid ${form.stage === s.key ? 'var(--gold-dim)' : 'var(--border)'}`,
                    background: form.stage === s.key ? 'var(--gold-soft)' : 'var(--surface-2)',
                    color: form.stage === s.key ? 'var(--gold)' : 'var(--text-3)',
                    fontWeight: form.stage === s.key ? 600 : 400,
                    cursor: 'pointer', transition: 'all .12s ease',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Fecha de cierre</label>
            <input type="date" value={form.close_date} onChange={e => set('close_date', e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
          </div>

          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.title.trim()} className="btn-primary">
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PipelineClient({ deals: initial, prospectos = [] }: { deals: Deal[]; prospectos?: Array<{ id: number; nombre: string }>; userId?: string }) {
  const [deals, setDeals] = useState(initial)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overStageKey, setOverStageKey] = useState<string | null>(null)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null

  function handleDelete(id: string) {
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  function handleSaveEdit(updated: Deal) {
    setDeals(prev => prev.map(d => d.id === updated.id ? updated : d))
  }

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    setOverStageKey(null)
    if (!over) return

    const draggedDeal = deals.find(d => d.id === active.id)
    if (!draggedDeal) return

    const targetStage = over.id as string
    if (!STAGES.find(s => s.key === targetStage)) return
    if (targetStage === draggedDeal.stage) return

    setDeals(prev => prev.map(d => d.id === draggedDeal.id ? { ...d, stage: targetStage } : d))

    const sb = createClient()
    sb.from('deals').update({ stage: targetStage as DealStage }).eq('id', draggedDeal.id)
  }

  const totalPipelineValue = deals
    .filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
    .reduce((s, d) => s + dealAnnualValue(d), 0)

  return (
    <>
      {editDeal && (
        <EditDealModal
          deal={editDeal}
          prospectos={prospectos}
          onClose={() => setEditDeal(null)}
          onSave={handleSaveEdit}
        />
      )}

      <Topbar
        title="Pipeline"
        subtitle={`${fmt(totalPipelineValue)} en pipeline activo`}
        actions={
          <Link href="/deals/new" style={{ textDecoration: 'none' }}>
            <button className="btn-primary">
              <Plus size={14} strokeWidth={2.5} /> Nuevo deal
            </button>
          </Link>
        }
      />

      <div className="page-scroller">
        <div style={{ padding: '24px 32px', height: '100%' }}>
          <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <div className="pipeline-board">
              {STAGES.map(stage => {
                const stageDeals = deals.filter(d => d.stage === stage.key)
                const stageValue = stageDeals.reduce((s, d) => s + dealAnnualValue(d), 0)

                return (
                  <div key={stage.key} className="pipeline-col">
                    <div className="col-header">
                      <div className="col-title">
                        <span style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: stage.color, display: 'inline-block', flexShrink: 0,
                        }} />
                        {stage.label}
                        <span className="col-count">{stageDeals.length}</span>
                      </div>
                      <span className="col-value">{fmt(stageValue)}</span>
                    </div>

                    <DroppableColumn stageKey={stage.key} isOver={overStageKey === stage.key}>
                      {stageDeals.map(deal => (
                        <DraggableDeal
                          key={deal.id}
                          deal={deal}
                          onDelete={handleDelete}
                          onEdit={setEditDeal}
                        />
                      ))}
                      {stageDeals.length === 0 && (
                        <div style={{
                          padding: '20px 0', textAlign: 'center',
                          fontSize: 12, color: 'var(--text-4)',
                          border: '1px dashed var(--border)', borderRadius: 8,
                        }}>
                          Arrastra aquí
                        </div>
                      )}
                    </DroppableColumn>
                  </div>
                )
              })}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeDeal && <DealCardDisplay deal={activeDeal} isDragging />}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </>
  )
}
