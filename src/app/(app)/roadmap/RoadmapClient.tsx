'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap, ReactFlowProvider,
  addEdge, useNodesState, useEdgesState, useReactFlow,
  Handle, Position,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { createClient } from '@/lib/supabase/client'

/* ─── Types ─────────────────────────────────────────────── */
type NodeStatus = 'done' | 'in_progress' | 'pending' | 'blocked'
type NodePriority = 'high' | 'medium' | 'none'

type NodeData = {
  label: string
  description: string
  status: NodeStatus
  priority: NodePriority
  notes: string
  updatedAt: string
  isNextAction?: boolean
  onEdit?: () => void
  onDelete?: () => void
  [key: string]: unknown
}

type FlowNode = { id: string; type: string; position: { x: number; y: number }; data: NodeData }
type FlowEdge = { id: string; source: string; target: string; [key: string]: unknown }
type Project  = { id: string; name: string; nodes: FlowNode[]; edges: FlowEdge[]; prospecto_id?: number | null }
type Prospecto = { id: number; nombre: string }

/* ─── Constants ─────────────────────────────────────────── */
const STATUS_CFG: Record<NodeStatus, { bg: string; border: string; accent: string; label: string }> = {
  done:        { bg: '#052e16', border: '#22c55e', accent: '#22c55e', label: 'Hecho'     },
  in_progress: { bg: '#1c1502', border: '#ca8a04', accent: '#eab308', label: 'En curso'  },
  pending:     { bg: '#111113', border: '#3f3f46', accent: '#71717a', label: 'Pendiente' },
  blocked:     { bg: '#1c0505', border: '#dc2626', accent: '#ef4444', label: 'Bloqueado' },
}
const PRIORITY_COLOR: Partial<Record<NodePriority, string>> = { high: '#ef4444', medium: '#f97316' }
const COLS = [
  { status: 'done'        as NodeStatus, label: 'Hecho',     color: '#22c55e', dim: '#052e16' },
  { status: 'in_progress' as NodeStatus, label: 'En curso',  color: '#eab308', dim: '#1c1502' },
  { status: 'pending'     as NodeStatus, label: 'Pendiente', color: '#71717a', dim: '#18181b' },
  { status: 'blocked'     as NodeStatus, label: 'Bloqueado', color: '#ef4444', dim: '#1c0505' },
]
const STATUS_OPTIONS = [
  { value: 'done',        label: 'Hecho'     },
  { value: 'in_progress', label: 'En curso'  },
  { value: 'pending',     label: 'Pendiente' },
  { value: 'blocked',     label: 'Bloqueado' },
]
const PRIORITY_OPTIONS = [
  { value: 'none',   label: '— Ninguna', color: '#52525b' },
  { value: 'medium', label: '→ Media',   color: '#f97316' },
  { value: 'high',   label: '↑ Alta',    color: '#ef4444' },
]

/* ─── CustomNode ─────────────────────────────────────────── */
function CustomNode({ data, selected }: { data: NodeData; selected?: boolean }) {
  const cfg = STATUS_CFG[data.status] ?? STATUS_CFG.pending
  const pColor = data.priority && data.priority !== 'none' ? (PRIORITY_COLOR[data.priority] ?? null) : null
  return (
    <div
      onDoubleClick={e => { e.stopPropagation(); data.onEdit?.() }}
      style={{
        background: cfg.bg,
        border: `1.5px solid ${data.isNextAction ? '#1A6FAA' : selected ? '#1A6FAA' : cfg.border}`,
        borderLeft: pColor ? `4px solid ${pColor}` : undefined,
        borderRadius: 10, minWidth: 175, maxWidth: 220,
        boxShadow: data.isNextAction
          ? '0 0 0 2px #09090b, 0 0 0 4px #1A6FAA, 0 12px 40px rgba(26,111,170,0.3)'
          : selected ? '0 0 0 2px #1A6FAA' : '0 2px 14px rgba(0,0,0,0.5)',
        cursor: 'grab', position: 'relative', userSelect: 'none', transition: 'box-shadow 0.2s',
      }}
    >
      {data.isNextAction && (
        <div style={{ position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)', background: '#1A6FAA', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.08em' }}>
          ★ SIGUIENTE ACCIÓN
        </div>
      )}
      <Handle type="target" position={Position.Left}  style={{ background: '#27272a', border: '2px solid #3f3f46', width: 10, height: 10 }} />
      <div style={{ padding: '10px 10px 10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.accent, flexShrink: 0, marginTop: 4 }} />
          <span style={{ color: '#fafafa', fontWeight: 600, fontSize: 12.5, lineHeight: 1.35, flex: 1, wordBreak: 'break-word' }}>{data.label}</span>
          <button onClick={e => { e.stopPropagation(); data.onDelete?.() }} style={{ background: 'none', border: 'none', color: '#3f3f46', cursor: 'pointer', fontSize: 15, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
        </div>
        {data.description && (
          <div style={{ color: '#52525b', fontSize: 10.5, marginTop: 5, marginLeft: 14, lineHeight: 1.4 }}>{data.description}</div>
        )}
        <div style={{ marginTop: 8, marginLeft: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9.5, color: cfg.accent, fontWeight: 600 }}>{cfg.label}</span>
          {data.notes && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 8.5, fontWeight: 700, letterSpacing: '0.04em',
              padding: '1px 5px', borderRadius: 3,
              background: 'rgba(26,111,170,0.18)',
              color: '#3b9fd8',
              border: '1px solid rgba(26,111,170,0.35)',
            }}>✎ NOTA</span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#27272a', border: '2px solid #3f3f46', width: 10, height: 10 }} />
    </div>
  )
}

// nodeTypes must be outside component to avoid React Flow re-render warnings
/* eslint-disable @typescript-eslint/no-explicit-any */
const nodeTypes: NodeTypes = { roadmapNode: CustomNode as any }
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ─── PaneDoubleClick ────────────────────────────────────── */
function PaneDoubleClick({ onCreateAt }: { onCreateAt: (pos: { x: number; y: number }) => void }) {
  const { screenToFlowPosition } = useReactFlow()
  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      onDoubleClick={e => {
        if ((e.target as Element).closest('.react-flow__node')) return
        onCreateAt(screenToFlowPosition({ x: e.clientX, y: e.clientY }))
      }}
    />
  )
}

/* ─── Helper ─────────────────────────────────────────────── */
function findNextActionId(nodes: FlowNode[], edges: FlowEdge[]): string | null {
  const prevMap: Record<string, string[]> = {}
  edges.forEach(e => {
    if (!prevMap[e.target]) prevMap[e.target] = []
    prevMap[e.target].push(e.source)
  })
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  for (const node of nodes) {
    if (node.data.status !== 'pending') continue
    const preds = prevMap[node.id] ?? []
    if (preds.every(pid => byId[pid]?.data?.status === 'done')) return node.id
  }
  return null
}

/* ─── RoadmapFlowInner ───────────────────────────────────── */
function RoadmapFlowInner({
  project, onProjectChange, onPositionChange, onEditNode, onCreateAt, searchQuery,
}: {
  project: Project
  onProjectChange: (updater: (prev: Project[]) => Project[]) => void
  onPositionChange: (updater: (prev: Project[]) => Project[]) => void
  onEditNode: (id: string) => void
  onCreateAt: (pos: { x: number; y: number }) => void
  searchQuery: string
}) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const enrichedNodes = useMemo(() => {
    const nextId = findNextActionId(project.nodes, project.edges)
    const q = searchQuery.trim().toLowerCase()
    return project.nodes
      .filter(n => !q || n.data.label.toLowerCase().includes(q) || n.data.description?.toLowerCase().includes(q))
      .map(n => ({
        ...n,
        data: {
          ...n.data,
          isNextAction: n.id === nextId,
          onEdit:   () => onEditNode(n.id),
          onDelete: () => onProjectChange(prev => prev.map(p =>
            p.id !== project.id ? p : {
              ...p,
              nodes: p.nodes.filter(node => node.id !== n.id),
              edges: p.edges.filter(e => e.source !== n.id && e.target !== n.id),
            }
          )),
        },
      }))
  }, [project, onProjectChange, onEditNode, searchQuery])

  const [nodes, setNodes, onNodesChange] = useNodesState(enrichedNodes as any)
  const [edges, setEdges, onEdgesChange] = useEdgesState(project.edges as any)

  useEffect(() => { setNodes(enrichedNodes as any) }, [enrichedNodes])
  useEffect(() => { setEdges(project.edges as any)  }, [project.edges])

  const onEdgesChangeWithSync = useCallback((changes: any[]) => {
    onEdgesChange(changes)
    const removedIds = new Set(changes.filter((c: any) => c.type === 'remove').map((c: any) => c.id))
    if (removedIds.size > 0) {
      onProjectChange(prev => prev.map(p =>
        p.id !== project.id ? p : { ...p, edges: p.edges.filter(e => !removedIds.has(e.id)) }
      ))
    }
  }, [onEdgesChange, onProjectChange, project.id])

  const onConnect = useCallback((params: any) => {
    const newEdge = { ...params, id: `e${params.source}-${params.target}` }
    setEdges((eds: any) => addEdge(newEdge, eds))
    onProjectChange(prev => prev.map(p =>
      p.id !== project.id ? p : { ...p, edges: addEdge(newEdge, p.edges as any) as any }
    ))
  }, [project.id, onProjectChange, setEdges])

  const onNodeDragStop = useCallback((_: any, node: any) => {
    onPositionChange(prev => prev.map(p =>
      p.id !== project.id ? p : {
        ...p,
        nodes: p.nodes.map(n => n.id !== node.id ? n : { ...n, position: node.position }),
      }
    ))
  }, [project.id, onPositionChange])
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const stats = useMemo(() => {
    const total = project.nodes.length
    const done  = project.nodes.filter(n => n.data.status === 'done').length
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 }
  }, [project.nodes])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 18px', background: '#0c0c0e', borderBottom: '1px solid #1c1c1f', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ color: '#52525b', fontSize: 11 }}>
            <strong style={{ color: '#d4d4d8' }}>{stats.done}/{stats.total}</strong> completados
          </span>
          <span style={{ color: '#1A6FAA', fontWeight: 700, fontSize: 11 }}>{stats.pct}%</span>
        </div>
        <div style={{ background: '#18181b', borderRadius: 99, height: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${stats.pct}%`, background: 'linear-gradient(90deg, #1A6FAA, #1A6FAA)', borderRadius: 99, transition: 'width 0.4s ease' }} />
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChangeWithSync}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          defaultEdgeOptions={{
            style: { stroke: '#3f3f46', strokeWidth: 2 },
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            markerEnd: { type: 'arrowclosed' as any, color: '#3f3f46' },
          }}
        >
          <PaneDoubleClick onCreateAt={onCreateAt} />
          <Background color="#3d3550" gap={22} size={1.5} style={{ background: '#0d0d12' }} />
          <Controls style={{ background: '#111113', border: '1px solid #27272a', borderRadius: 8 }} />
          <MiniMap
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            nodeColor={(n: any) => {
              if (n.data?.status === 'done')        return '#22c55e'
              if (n.data?.status === 'in_progress') return '#eab308'
              if (n.data?.status === 'blocked')     return '#ef4444'
              return '#3f3f46'
            }}
            style={{ background: '#09090b', border: '1px solid #1c1c1f', borderRadius: 8 }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}

/* ─── StatusPanel ────────────────────────────────────────── */
function StatusPanel({ nodes, onStatusChange }: {
  nodes: FlowNode[]
  onStatusChange: (id: string, status: NodeStatus) => void
}) {
  const [collapsed, setCollapsed]   = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overStatus, setOverStatus] = useState<NodeStatus | null>(null)
  const grouped = Object.fromEntries(COLS.map(c => [c.status, nodes.filter(n => n.data.status === c.status)]))
  const iconBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: '1', display: 'flex', alignItems: 'center' }

  if (collapsed) return (
    <div style={{ width: 36, background: '#0c0c0e', borderLeft: '1px solid #1c1c1f', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: 8, flexShrink: 0 }}>
      <button onClick={() => setCollapsed(false)} style={iconBtn}>‹</button>
      {COLS.map(({ status, color }) => (
        <div key={status} style={{ width: 6, height: 6, borderRadius: '50%', background: grouped[status].length > 0 ? color : '#27272a' }} />
      ))}
    </div>
  )

  return (
    <aside style={{ width: 192, background: '#0c0c0e', borderLeft: '1px solid #1c1c1f', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '13px 12px 10px', borderBottom: '1px solid #1c1c1f', flexShrink: 0 }}>
        <button onClick={() => setCollapsed(true)} style={iconBtn}>›</button>
        <span style={{ fontSize: 10, color: '#3f3f46', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: 6 }}>Estados</span>
      </div>
      {COLS.map(({ status, label, color, dim }) => (
        <div key={status}
          onDrop={e => { e.preventDefault(); if (draggingId) onStatusChange(draggingId, status); setDraggingId(null); setOverStatus(null) }}
          onDragOver={e => { e.preventDefault(); setOverStatus(status) }}
          onDragLeave={() => setOverStatus(null)}
          style={{ flex: 1, minHeight: 90, borderLeft: `2px solid ${overStatus === status ? color : 'transparent'}`, background: overStatus === status ? dim : 'transparent', transition: 'background 0.12s, border-color 0.12s', padding: '8px 10px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color, fontWeight: 600 }}>{label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#52525b' }}>{grouped[status].length}</span>
          </div>
          {grouped[status].map(node => (
            <div key={node.id} draggable
              onDragStart={e => { setDraggingId(node.id); e.dataTransfer.effectAllowed = 'move' }}
              onDragEnd={() => { setDraggingId(null); setOverStatus(null) }}
              style={{ background: draggingId === node.id ? dim : '#18181b', border: `1px solid ${draggingId === node.id ? color : '#27272a'}`, borderRadius: 5, padding: '5px 8px', marginBottom: 4, fontSize: 11, color: draggingId === node.id ? color : '#71717a', cursor: 'grab', opacity: draggingId === node.id ? 0.5 : 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={node.data.label}
            >
              {node.data.label}
            </div>
          ))}
          {grouped[status].length === 0 && (
            <div style={{ border: `1px dashed ${overStatus === status ? color : '#27272a'}`, borderRadius: 5, padding: '8px 6px', textAlign: 'center', fontSize: 10, color: '#3f3f46' }}>
              Suelta aquí
            </div>
          )}
        </div>
      ))}
    </aside>
  )
}

/* ─── ProjectSidebar ─────────────────────────────────────── */
function ProjectSidebar({ projects, activeId, prospectos, onSelect, onCreate, onDelete, onRename, onDuplicate, onLinkProspecto }: {
  projects: Project[]
  activeId: string | null
  prospectos: Prospecto[]
  onSelect: (id: string) => void
  onCreate: (name: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onDuplicate: (id: string) => void
  onLinkProspecto: (projectId: string, prospectoId: number | null) => void
}) {
  const [collapsed, setCollapsed]   = useState(false)
  const [adding, setAdding]         = useState(false)
  const [newName, setNewName]       = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [hoveredId, setHoveredId]   = useState<string | null>(null)

  const iconBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: '1', display: 'flex', alignItems: 'center' }
  const smBtn:   React.CSSProperties = { background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 13, padding: '0 2px', lineHeight: '1', flexShrink: 0 }

  function handleCreate() {
    const name = newName.trim(); if (!name) return
    onCreate(name); setNewName(''); setAdding(false)
  }
  function startRename(p: Project) { setRenamingId(p.id); setRenameValue(p.name) }
  function commitRename() {
    const name = renameValue.trim()
    if (name && renamingId) onRename(renamingId, name)
    setRenamingId(null); setRenameValue('')
  }

  if (collapsed) return (
    <div style={{ width: 36, background: '#0c0c0e', borderRight: '1px solid #1c1c1f', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: 8, flexShrink: 0 }}>
      <button onClick={() => setCollapsed(false)} style={iconBtn}>›</button>
      {projects.map(p => (
        <div key={p.id} onClick={() => onSelect(p.id)} title={p.name}
          style={{ width: 6, height: 6, borderRadius: '50%', cursor: 'pointer', background: p.id === activeId ? '#1A6FAA' : '#27272a' }} />
      ))}
    </div>
  )

  return (
    <aside style={{ width: 210, background: '#0c0c0e', borderRight: '1px solid #1c1c1f', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '13px 12px 10px', borderBottom: '1px solid #1c1c1f', flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: '#3f3f46', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', flex: 1 }}>Proyectos</span>
        <button onClick={() => setCollapsed(true)} style={iconBtn}>‹</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {projects.map(p => {
          const isActive   = p.id === activeId
          const isHovered  = hoveredId === p.id
          const isRenaming = renamingId === p.id
          const showActions = (isActive || isHovered) && !isRenaming
          return (
            <div key={p.id}>
            <div
              onClick={() => { if (!isRenaming) onSelect(p.id) }}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 8px 8px 12px', background: isActive ? '#18181b' : 'transparent', borderLeft: `2px solid ${isActive ? '#1A6FAA' : 'transparent'}`, cursor: 'pointer', transition: 'background 0.12s' }}
            >
              {isRenaming ? (
                <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenamingId(null) }}
                  onBlur={commitRename}
                  onClick={e => e.stopPropagation()}
                  style={{ flex: 1, background: '#27272a', border: '1px solid #1A6FAA', borderRadius: 4, padding: '2px 6px', color: '#fafafa', fontSize: 12, outline: 'none', minWidth: 0 }}
                />
              ) : (
                <span style={{ flex: 1, fontSize: 12.5, color: isActive ? '#fafafa' : '#71717a', fontWeight: isActive ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name}
                </span>
              )}
              {showActions && (
                <>
                  <button onClick={e => { e.stopPropagation(); startRename(p) }}    title="Renombrar" style={smBtn}>✎</button>
                  <button onClick={e => { e.stopPropagation(); onDuplicate(p.id) }} title="Duplicar"  style={smBtn}>⧉</button>
                  {projects.length > 1 && (
                    <button onClick={e => { e.stopPropagation(); onDelete(p.id) }} title="Eliminar" style={smBtn}>×</button>
                  )}
                </>
              )}
            </div>
            {isActive && prospectos.length > 0 && (
              <div style={{ padding: '0 8px 8px 14px' }} onClick={e => e.stopPropagation()}>
                <select
                  value={p.prospecto_id ?? ''}
                  onChange={e => onLinkProspecto(p.id, e.target.value ? Number(e.target.value) : null)}
                  style={{ width: '100%', background: '#18181b', border: '1px solid #27272a', borderRadius: 5, padding: '4px 6px', color: p.prospecto_id ? '#a1a1aa' : '#52525b', fontSize: 11, outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">→ Sin cliente vinculado</option>
                  {prospectos.map(pr => (
                    <option key={pr.id} value={pr.id}>{pr.nombre}</option>
                  ))}
                </select>
              </div>
            )}
            </div>
          )
        })}
      </div>
      <div style={{ padding: '8px 10px 12px', borderTop: '1px solid #1c1c1f', flexShrink: 0 }}>
        {adding ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setAdding(false); setNewName('') } }}
              placeholder="Nombre…"
              style={{ flex: 1, background: '#18181b', border: '1px solid #27272a', borderRadius: 6, padding: '6px 8px', color: '#fafafa', fontSize: 12, outline: 'none', minWidth: 0 }}
            />
            <button onClick={handleCreate} style={{ ...iconBtn, color: '#1A6FAA', fontSize: 16 }}>✓</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            style={{ width: '100%', background: 'none', border: '1px dashed #27272a', borderRadius: 6, padding: '7px 0', color: '#3f3f46', cursor: 'pointer', fontSize: 12, transition: 'color 0.12s, border-color 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = '#52525b' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#3f3f46'; e.currentTarget.style.borderColor = '#27272a' }}
          >
            + Nuevo proyecto
          </button>
        )}
      </div>
    </aside>
  )
}

/* ─── NodeModal ──────────────────────────────────────────── */
function NodeModal({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (data: { label: string; description: string; status: NodeStatus }) => void
}) {
  const [label, setLabel]           = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus]         = useState<NodeStatus>('pending')
  const lbl: React.CSSProperties = { display: 'block', color: '#52525b', fontSize: 11, marginBottom: 5, marginTop: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const inp: React.CSSProperties = { width: '100%', background: '#0c0c0e', border: '1px solid #27272a', borderRadius: 6, padding: '8px 10px', color: '#fafafa', fontSize: 13, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    onAdd({ label: label.trim(), description: description.trim(), status })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <form onSubmit={handleSubmit} style={{ background: '#111113', border: '1px solid #27272a', borderRadius: 12, padding: 28, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
        <h3 style={{ margin: '0 0 20px', color: '#fafafa', fontSize: 15, fontWeight: 700 }}>Añadir paso</h3>
        <label style={lbl}>Nombre del paso</label>
        <input autoFocus value={label} onChange={e => setLabel(e.target.value)} placeholder="ej. Diseño UI/UX" style={inp} required />
        <label style={lbl}>Descripción (opcional)</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="ej. Wireframes en Figma" style={inp} />
        <label style={lbl}>Estado inicial</label>
        <select value={status} onChange={e => setStatus(e.target.value as NodeStatus)} style={inp}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px 0', background: '#18181b', border: '1px solid #27272a', borderRadius: 6, color: '#71717a', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
          <button type="submit" style={{ flex: 2, padding: '9px 0', background: '#1A6FAA', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Añadir</button>
        </div>
      </form>
    </div>
  )
}

/* ─── EditNodeModal ──────────────────────────────────────── */
function EditNodeModal({ node, onClose, onSave }: {
  node: FlowNode
  onClose: () => void
  onSave: (updates: Partial<NodeData>) => void
}) {
  const [label, setLabel]           = useState(node.data.label)
  const [description, setDescription] = useState(node.data.description ?? '')
  const [notes, setNotes]           = useState(node.data.notes ?? '')
  const [status, setStatus]         = useState<NodeStatus>(node.data.status)
  const [priority, setPriority]     = useState<NodePriority>(node.data.priority === 'high' || node.data.priority === 'medium' ? node.data.priority : 'none')

  const lbl: React.CSSProperties = { display: 'block', color: '#52525b', fontSize: 11, marginBottom: 5, marginTop: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }
  const inp: React.CSSProperties = { width: '100%', background: '#0c0c0e', border: '1px solid #27272a', borderRadius: 7, padding: '9px 12px', color: '#fafafa', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    onSave({ label: label.trim(), description: description.trim(), notes, status, priority })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <form onSubmit={handleSubmit} style={{ background: '#111113', border: '1px solid #27272a', borderRadius: 14, padding: 28, width: 420, boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}>
        <h3 style={{ margin: '0 0 22px', color: '#fafafa', fontSize: 15, fontWeight: 700 }}>Editar paso</h3>
        <label style={lbl}>Nombre</label>
        <input autoFocus value={label} onChange={e => setLabel(e.target.value)} style={inp} required />
        <label style={lbl}>Descripción corta</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Subtítulo visible en la tarjeta" style={inp} />
        <label style={lbl}>Estado</label>
        <select value={status} onChange={e => setStatus(e.target.value as NodeStatus)} style={inp}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <label style={lbl}>Prioridad</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          {PRIORITY_OPTIONS.map(o => (
            <button key={o.value} type="button" onClick={() => setPriority(o.value as NodePriority)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: priority === o.value ? `${o.color}20` : '#0c0c0e', border: `1.5px solid ${priority === o.value ? o.color : '#27272a'}`, color: priority === o.value ? o.color : '#52525b', transition: 'all 0.12s' }}
            >{o.label}</button>
          ))}
        </div>
        <label style={lbl}>Notas</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Apuntes, recordatorios, detalles…"
          style={{ ...inp, resize: 'vertical', minHeight: 90, lineHeight: 1.5 }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px 0', background: '#18181b', border: '1px solid #27272a', borderRadius: 7, color: '#71717a', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
          <button type="submit" style={{ flex: 2, padding: '9px 0', background: '#1A6FAA', border: 'none', borderRadius: 7, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Guardar</button>
        </div>
      </form>
    </div>
  )
}

/* ─── Main Client ────────────────────────────────────────── */
export default function RoadmapClient({ projects: initial, prospectos, userId }: { projects: Project[]; prospectos: Prospecto[]; userId: string }) {
  const [projects, setProjects]           = useState<Project[]>(initial)
  const [activeId, setActiveId]           = useState<string | null>(initial[0]?.id ?? null)
  const [showAddModal, setShowAddModal]   = useState(false)
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery]     = useState('')
  const dragTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeProject = projects.find(p => p.id === activeId) ?? null
  const editingNode   = editingNodeId ? activeProject?.nodes.find(n => n.id === editingNodeId) : null

  /* eslint-disable @typescript-eslint/no-explicit-any */
  async function persistProject(project: Project) {
    const sb = createClient()
    await (sb as any).from('roadmap_projects').upsert({
      id: project.id, user_id: userId,
      name: project.name, nodes: project.nodes, edges: project.edges,
      prospecto_id: project.prospecto_id ?? null,
    })
  }

  async function deleteProjectFromDB(id: string) {
    const sb = createClient()
    await (sb as any).from('roadmap_projects').delete().eq('id', id)
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  function updateProjects(updater: (prev: Project[]) => Project[], targetId?: string) {
    setProjects(prev => {
      const next = updater(prev)
      const changed = next.find(p => p.id === (targetId ?? activeId))
      if (changed) persistProject(changed)
      return next
    })
  }

  function updateProjectsDebounced(updater: (prev: Project[]) => Project[]) {
    setProjects(prev => {
      const next = updater(prev)
      if (dragTimerRef.current) clearTimeout(dragTimerRef.current)
      const changed = next.find(p => p.id === activeId)
      if (changed) {
        const snapshot = { ...changed, nodes: [...changed.nodes] }
        dragTimerRef.current = setTimeout(() => persistProject(snapshot), 600)
      }
      return next
    })
  }

  const handleLinkProspecto = useCallback((projectId: string, prospectoId: number | null) => {
    updateProjects(prev => prev.map(p => p.id !== projectId ? p : { ...p, prospecto_id: prospectoId }), projectId)
  }, [activeId])

  const handleAddNode = useCallback(({ label, description, status }: { label: string; description: string; status: NodeStatus }) => {
    const id = `n-${Date.now()}`
    updateProjects(prev => prev.map(p =>
      p.id !== activeId ? p : {
        ...p,
        nodes: [...p.nodes, {
          id, type: 'roadmapNode',
          position: { x: 160 + Math.random() * 280, y: 140 + Math.random() * 180 },
          data: { label, description, status, notes: '', priority: 'none', updatedAt: new Date().toISOString() },
        }],
      }
    ))
  }, [activeId])

  const handleSaveNode = useCallback((id: string, updates: Partial<NodeData>) => {
    updateProjects(prev => prev.map(p =>
      p.id !== activeId ? p : {
        ...p,
        nodes: p.nodes.map(n => n.id !== id ? n : { ...n, data: { ...n.data, ...updates, updatedAt: new Date().toISOString() } }),
      }
    ))
  }, [activeId])

  const handleStatusChange = useCallback((nodeId: string, newStatus: NodeStatus) => {
    updateProjects(prev => prev.map(p =>
      p.id !== activeId ? p : {
        ...p,
        nodes: p.nodes.map(n => n.id !== nodeId ? n : { ...n, data: { ...n.data, status: newStatus, updatedAt: new Date().toISOString() } }),
      }
    ))
  }, [activeId])

  const handleCreateProject = useCallback(async (name: string) => {
    const id = crypto.randomUUID()
    const newProject: Project = { id, name, nodes: [], edges: [] }
    setProjects(prev => [...prev, newProject])
    setActiveId(id)
    await persistProject(newProject)
  }, [userId])

  const handleDeleteProject = useCallback((pid: string) => {
    if (projects.length <= 1) return
    const remaining = projects.filter(p => p.id !== pid)
    setProjects(remaining)
    if (activeId === pid) setActiveId(remaining[0].id)
    deleteProjectFromDB(pid)
  }, [projects, activeId])

  const handleCreateNodeAt = useCallback((position: { x: number; y: number }) => {
    const id = `n-${Date.now()}`
    updateProjects(prev => prev.map(p =>
      p.id !== activeId ? p : {
        ...p,
        nodes: [...p.nodes, {
          id, type: 'roadmapNode', position,
          data: { label: 'Nuevo paso', description: '', status: 'pending', notes: '', priority: 'none', updatedAt: new Date().toISOString() },
        }],
      }
    ))
    setEditingNodeId(id)
  }, [activeId])

  const handleRenameProject = useCallback((id: string, name: string) => {
    updateProjects(prev => prev.map(p => p.id !== id ? p : { ...p, name }), id)
  }, [])

  const handleDuplicateProject = useCallback(async (id: string) => {
    const source = projects.find(p => p.id === id)
    if (!source) return
    const newId = crypto.randomUUID()
    const ts = Date.now()
    const idMap: Record<string, string> = {}
    const newNodes = source.nodes.map(n => {
      const nid = `${n.id}-c${ts}`; idMap[n.id] = nid
      return { ...n, id: nid }
    })
    const newEdges = source.edges.map(e => ({
      ...e, id: `${e.id}-c${ts}`,
      source: idMap[e.source] ?? e.source,
      target: idMap[e.target] ?? e.target,
    }))
    const newProject: Project = { id: newId, name: `${source.name} (copia)`, nodes: newNodes, edges: newEdges }
    setProjects(prev => [...prev, newProject])
    setActiveId(newId)
    await persistProject(newProject)
  }, [projects, userId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#09090b', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 50, background: '#0c0c0e', borderBottom: '1px solid #1c1c1f', flexShrink: 0, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fafafa', fontWeight: 700, fontSize: 14 }}>Roadmap</span>
          {activeProject && (
            <span style={{ color: '#52525b', fontSize: 13 }}>{activeProject.name}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            placeholder="Buscar paso…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 7, padding: '6px 12px', color: '#fafafa', fontSize: 12.5, outline: 'none', width: 200 }}
          />
          <button
            onClick={() => setShowAddModal(true)}
            style={{ background: '#1A6FAA', border: 'none', borderRadius: 7, padding: '7px 14px', color: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 600 }}
          >
            + Paso
          </button>
        </div>
      </header>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ProjectSidebar
          projects={projects}
          activeId={activeId}
          prospectos={prospectos}
          onSelect={setActiveId}
          onCreate={handleCreateProject}
          onDelete={handleDeleteProject}
          onRename={handleRenameProject}
          onDuplicate={handleDuplicateProject}
          onLinkProspecto={handleLinkProspecto}
        />

        <main style={{ flex: 1, overflow: 'hidden' }}>
          {activeProject ? (
            <ReactFlowProvider>
              <RoadmapFlowInner
                key={activeProject.id}
                project={activeProject}
                onProjectChange={updateProjects}
                onPositionChange={updateProjectsDebounced}
                onEditNode={setEditingNodeId}
                onCreateAt={handleCreateNodeAt}
                searchQuery={searchQuery}
              />
            </ReactFlowProvider>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3f3f46', fontSize: 14 }}>
              Crea un proyecto desde el panel izquierdo
            </div>
          )}
        </main>

        {activeProject && (
          <StatusPanel nodes={activeProject.nodes} onStatusChange={handleStatusChange} />
        )}
      </div>

      {showAddModal && (
        <NodeModal onClose={() => setShowAddModal(false)} onAdd={handleAddNode} />
      )}
      {editingNode && (
        <EditNodeModal
          node={editingNode}
          onClose={() => setEditingNodeId(null)}
          onSave={updates => { handleSaveNode(editingNodeId!, updates); setEditingNodeId(null) }}
        />
      )}
    </div>
  )
}
