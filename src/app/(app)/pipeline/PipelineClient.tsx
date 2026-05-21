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

function DealCardDisplay({ deal, isDragging = false }: { deal: Deal; isDragging?: boolean }) {
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

function DraggableDeal({ deal }: { deal: Deal }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.35 : 1, cursor: 'grab', touchAction: 'none' }}
    >
      <DealCardDisplay deal={deal} />
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

export default function PipelineClient({ deals: initial }: { deals: Deal[]; userId?: string }) {
  const [deals, setDeals] = useState(initial)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overStageKey, setOverStageKey] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeDeal = activeId ? deals.find(d => d.id === activeId) : null

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
            collisionDetection={rectIntersection}
            onDragStart={onDragStart}
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

                    <DroppableColumn
                      stageKey={stage.key}
                      isOver={overStageKey === stage.key}
                    >
                      {stageDeals.map(deal => (
                        <DraggableDeal key={deal.id} deal={deal} />
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
