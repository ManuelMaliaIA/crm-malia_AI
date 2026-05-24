'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import { FileText, Mail, PhoneCall, Calendar, CheckSquare, Check } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'

type Activity = {
  id: string; type: string; title: string; body: string | null
  created_at: string; completed: boolean; due_at: string | null
  contacts?: { first_name: string; last_name: string } | null
  deals?: { title: string } | null
}

const ICONS: Record<string, React.ReactNode> = {
  note: <FileText size={14} />,
  email: <Mail size={14} />,
  call: <PhoneCall size={14} />,
  meeting: <Calendar size={14} />,
  task: <CheckSquare size={14} />,
}

const TYPE_LABELS: Record<string, string> = {
  note: 'Nota', email: 'Email', call: 'Llamada', meeting: 'Reunión', task: 'Tarea'
}

export default function ActivitiesClient({ activities: initial }: { activities: Activity[]; userId: string }) {
  const [activities, setActivities] = useState(initial)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())

  function toggleNote(id: string) {
    setExpandedNotes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const filtered = activities.filter(a => {
    if (filter === 'pending') return !a.completed && a.due_at
    if (filter === 'completed') return a.completed
    if (['note', 'email', 'call', 'meeting', 'task'].includes(filter)) return a.type === filter
    return true
  }).filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()))

  async function toggleComplete(act: Activity) {
    const sb = createClient()
    await sb.from('activities').update({ completed: !act.completed }).eq('id', act.id)
    setActivities(prev => prev.map(a => a.id === act.id ? { ...a, completed: !a.completed } : a))
  }

  return (
    <>
      <Topbar
        title="Actividades"
        subtitle={`${activities.filter(a => !a.completed).length} pendientes`}
        showSearch
        searchPlaceholder="Buscar actividad…"
        onSearch={setSearch}
      />
      <div className="page-scroller">
        <div className="page-body">
          {/* Filter tabs */}
          <div className="seg" style={{ marginBottom: 20 }}>
            {['all', 'pending', 'completed', 'note', 'email', 'call', 'task'].map(f => (
              <button key={f} className={`seg-item ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'completed' ? 'Completadas' : TYPE_LABELS[f]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">{ICONS.task}</div>
              <div className="empty-title">Sin actividades</div>
              <p className="empty-sub">Las actividades aparecerán aquí cuando añadas notas, llamadas o tareas</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="timeline" style={{ padding: '4px 20px' }}>
                {filtered.map(act => (
                  <div key={act.id} className="timeline-entry">
                    <div className="timeline-icon" style={{ color: act.completed ? 'var(--text-4)' : 'var(--gold)' }}>
                      {ICONS[act.type] ?? <FileText size={14} />}
                    </div>
                    <div className="timeline-content">
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                        <div>
                          <div className="timeline-title" style={{ textDecoration: act.completed ? 'line-through' : 'none', opacity: act.completed ? 0.5 : 1 }}>
                            {act.title}
                          </div>
                          <div className="timeline-time" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            <span>{TYPE_LABELS[act.type]}</span>
                            {act.contacts && <span>· {act.contacts.first_name} {act.contacts.last_name}</span>}
                            {act.deals && <span>· {act.deals.title}</span>}
                            <span>· {format(parseISO(act.created_at), "d MMM yyyy", { locale: es })}</span>
                            {act.body && (
                              <button
                                onClick={() => toggleNote(act.id)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 3,
                                  fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                                  border: '1px solid var(--border)',
                                  background: expandedNotes.has(act.id) ? 'var(--surface-2)' : 'transparent',
                                  color: expandedNotes.has(act.id) ? 'var(--text-2)' : 'var(--text-4)',
                                  cursor: 'pointer', transition: 'all .1s ease',
                                }}
                              >
                                <FileText size={9} strokeWidth={2} />
                                Nota
                              </button>
                            )}
                          </div>
                          {act.body && expandedNotes.has(act.id) && (
                            <div className="timeline-body">{act.body}</div>
                          )}
                        </div>
                        {act.type === 'task' && (
                          <button
                            onClick={() => toggleComplete(act)}
                            style={{
                              width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
                              border: `1.5px solid ${act.completed ? '#5ac878' : 'var(--border-hi)'}`,
                              background: act.completed ? 'rgba(80,200,120,0.12)' : 'transparent',
                              color: act.completed ? '#5ac878' : 'var(--text-4)',
                              display: 'grid', placeItems: 'center', cursor: 'pointer', transition: 'all .12s ease'
                            }}
                          >
                            {act.completed && <Check size={12} strokeWidth={2.5} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
