'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Topbar from '@/components/layout/Topbar'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { DealStage } from '@/lib/supabase/types'

type Deal = {
  id: string; title: string; value: number; stage: string; probability: number
  close_date: string | null; created_at: string
  contacts?: { first_name: string; last_name: string } | null
  companies?: { name: string } | null
}

const STAGES = [
  { key: 'prospecting',   label: 'Prospección', color: '#5e5e5e' },
  { key: 'qualification', label: 'Calificación', color: '#7b9ef0' },
  { key: 'proposal',      label: 'Propuesta',    color: '#e0aa4a' },
  { key: 'negotiation',   label: 'Negociación',  color: '#d97ae8' },
  { key: 'closed_won',    label: 'Ganado',        color: '#5ac878' },
  { key: 'closed_lost',   label: 'Perdido',       color: '#e87171' },
]

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function DealCard({ deal, isDragging = false }: { deal: Deal; isDragging?: boolean }) {
  const contact = deal.contacts
    ? `${deal.contacts.first_name} ${deal.contacts.last_name}`
    : deal.companies?.name

  return (
    <div className={`deal-card ${isDragging ? 'dragging' : ''}`}>
      <div className="deal-title">{deal.title}</div>
      {contact && <div className="deal-company">{contact}</div>}
      <div className="deal-meta">
        <span className="deal-value">{fmt(Number(deal.value))}</span>
        <span className="deal-prob">{deal.probability}%</span>
      </div>
    </div>
  )
}

function SortableDealCard({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
    >
      <DealCard deal={deal} />
    </div>
  )
}

function DroppableColBody({ stageKey, deals, isOver }: { stageKey: string; deals: Deal[]; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: stageKey })

  return (
    <div
      ref={setNodeRef}
      className={`col-body ${isOver ? 'drag-over' : ''}`}
      style={{ minHeight: 200 }}
    >
      <SortableContext items={deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
        {deals.map(deal => (
          <SortableDealCard key={deal.id} deal={deal} />
        ))}
      </SortableContext>
      {deals.length === 0 && (
        <div style={{
          padding: '20px 0', textAlign: 'center',
          fontSize: 12, color: 'var(--text-4)',
          border: '1px dashed var(--border)', borderRadius: 8,
        }}>
          Arrastra aquí
        </div>
      )}
    </div>
  )
}

export default function PipelineClient({ deals: initial }: { deals: Deal[]; userId?: string }) {
  const [deals, setDeals] = useState(initial)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null

  function getStageOfId(id: string): string | null {
    if (STAGES.find(s => s.key === id)) return id
    return deals.find(d => d.id === id)?.stage ?? null
  }

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function onDragOver({ over }: DragOverEvent) {
    if (!over) { setOverStage(null); return }
    setOverStage(getStageOfId(over.id as string))
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    setOverStage(null)
    if (!over) return

    const draggedDeal = deals.find(d => d.id === active.id)
    if (!draggedDeal) return

    const targetStage = getStageOfId(over.id as string)
    if (!targetStage || targetStage === draggedDeal.stage) return

    setDeals(prev => prev.map(d => d.id === draggedDeal.id ? { ...d, stage: targetStage } : d))

    const sb = createClient()
    await sb.from('deals').update({ stage: targetStage as DealStage }).eq('id', draggedDeal.id)
  }

  const totalPipelineValue = deals
    .filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
    .reduce((s, d) => s + Number(d.value), 0)

  return (
    <>
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
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
          >
            <div className="pipeline-board">
              {STAGES.map(stage => {
                const stageDeals = deals.filter(d => d.stage === stage.key)
                const stageValue = stageDeals.reduce((s, d) => s + Number(d.value), 0)

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

                    <DroppableColBody
                      stageKey={stage.key}
                      deals={stageDeals}
                      isOver={overStage === stage.key}
                    />
                  </div>
                )
              })}
            </div>

            <DragOverlay>
              {activeDeal && <DealCard deal={activeDeal} isDragging />}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </>
  )
}
