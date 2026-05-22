'use client'

import Topbar from '@/components/layout/Topbar'
import { TrendingUp, Users, Briefcase, Target } from 'lucide-react'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface Props {
  contacts: Array<{ id: string; status: string; created_at: string }>
  deals: Array<{ id: string; title: string; value: number; setup_fee: number; monthly_fee: number; stage: string; close_date: string | null; created_at: string }>
  activities: Array<{ id: string; type: string; title: string; created_at: string; completed: boolean; due_at: string | null }>
}

const STAGE_LABELS: Record<string, string> = {
  prospecting: 'Prospección',
  qualification: 'Calificación',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  closed_won: 'Ganado',
  closed_lost: 'Perdido',
}

const ACTIVITY_ICONS: Record<string, string> = {
  note: '📝', email: '📧', call: '📞', meeting: '🤝', task: '✅',
}

function SparkLine({ values }: { values: number[] }) {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${100 - (v / max) * 100}`)
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="spark">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function DashboardClient({ contacts, deals, activities }: Props) {
  const activeDeals = deals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
  const wonDeals = deals.filter(d => d.stage === 'closed_won')
  const totalRevenue = wonDeals.reduce((s, d) => s + Number(d.value), 0)
  const winRate = deals.length ? Math.round((wonDeals.length / deals.length) * 100) : 0

  // Monthly revenue (last 6 months)
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { label: format(d, 'MMM', { locale: es }), month: d.getMonth(), year: d.getFullYear() }
  })
  const monthlyRev = months.map(({ month, year }) =>
    wonDeals
      .filter(d => {
        const c = parseISO(d.created_at)
        return c.getMonth() === month && c.getFullYear() === year
      })
      .reduce((s, d) => s + Number(d.value), 0)
  )

  // Pipeline funnel
  const stageOrder = ['prospecting', 'proposal', 'negotiation']
  const funnelData = stageOrder.map(s => ({
    label: STAGE_LABELS[s],
    count: deals.filter(d => d.stage === s).length,
    value: deals.filter(d => d.stage === s).reduce((sum, d) => sum + Number(d.value), 0),
  }))
  const maxFunnel = Math.max(...funnelData.map(f => f.count), 1)

  // Hot deals (highest value active)
  const hotDeals = [...activeDeals].sort((a, b) => Number(b.value) - Number(a.value)).slice(0, 5)

  // Upcoming activities
  const upcoming = activities
    .filter(a => !a.completed && a.due_at)
    .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
    .slice(0, 5)

  function dueDateLabel(iso: string) {
    const d = parseISO(iso)
    if (isToday(d)) return 'Hoy'
    if (isTomorrow(d)) return 'Mañana'
    return format(d, 'd MMM', { locale: es })
  }

  return (
    <>
      <Topbar title="Dashboard" subtitle={`${format(new Date(), "EEEE d 'de' MMMM", { locale: es })}`} />
      <div className="page-scroller">
        <div className="page-body">

          {/* KPI Row */}
          <div className="kpi-row">
            <div className="kpi kpi-teal">
              <div className="kpi-head">
                <span className="kpi-label">Revenue total</span>
                <span className="chip chip-up"><TrendingUp size={9} />+12%</span>
              </div>
              <div className="kpi-value">{fmt(totalRevenue)}</div>
              <div className="kpi-sub">{wonDeals.length} deals cerrados</div>
              <SparkLine values={monthlyRev} />
            </div>

            <div className="kpi kpi-blue">
              <div className="kpi-head">
                <span className="kpi-label">Deals activos</span>
                <Briefcase size={15} color="rgba(255,255,255,0.7)" />
              </div>
              <div className="kpi-value">{activeDeals.length}</div>
              <div className="kpi-sub">{fmt(activeDeals.reduce((s, d) => s + Number(d.value), 0))} en pipeline</div>
            </div>

            <div className="kpi kpi-purple">
              <div className="kpi-head">
                <span className="kpi-label">Tasa de cierre</span>
                <Target size={15} color="rgba(255,255,255,0.7)" />
              </div>
              <div className="kpi-value">{winRate}%</div>
              <div className="kpi-sub">{wonDeals.length} de {deals.length} deals</div>
            </div>

            <div className="kpi kpi-amber">
              <div className="kpi-head">
                <span className="kpi-label">Contactos</span>
                <Users size={15} color="rgba(255,255,255,0.7)" />
              </div>
              <div className="kpi-value">{contacts.length}</div>
              <div className="kpi-sub">{contacts.filter(c => c.status === 'customer').length} clientes activos</div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid-2" style={{ marginTop: 20 }}>
            {/* Revenue chart */}
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Revenue mensual</div>
                  <div className="card-sub">Últimos 6 meses</div>
                </div>
              </div>
              <RevenueChart months={months.map(m => m.label)} values={monthlyRev} />
            </div>

            {/* Pipeline funnel */}
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Pipeline</div>
                  <div className="card-sub">Por etapa</div>
                </div>
              </div>
              <div className="funnel">
                {funnelData.map((row) => (
                  <div key={row.label} className="funnel-row">
                    <span className="funnel-label">{row.label}</span>
                    <div className="funnel-bar-wrap">
                      <div
                        className="funnel-bar"
                        style={{ width: `${row.count ? (row.count / maxFunnel) * 100 : 0}%` }}
                      />
                      <span className="funnel-bar-text">
                        {row.count} · {fmt(row.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid-2" style={{ marginTop: 20 }}>
            {/* Hot deals */}
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Hot deals</div>
                  <div className="card-sub">Mayor valor en pipeline</div>
                </div>
                <Link href="/pipeline" style={{ textDecoration: 'none' }}>
                  <button className="btn-ghost" style={{ fontSize: 12 }}>Ver todo</button>
                </Link>
              </div>
              {hotDeals.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <p className="empty-sub">No hay deals activos aún</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {hotDeals.map((deal) => (
                    <div
                      key={deal.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 0', borderBottom: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{deal.title}</div>
                        <span className={`stage-badge stage-${deal.stage}`} style={{ marginTop: 3, display: 'inline-block' }}>
                          {STAGE_LABELS[deal.stage]}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {(Number(deal.setup_fee) > 0 || Number(deal.monthly_fee) > 0) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'right' }}>
                            {Number(deal.setup_fee) > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>{fmt(Number(deal.setup_fee))} setup</div>}
                            {Number(deal.monthly_fee) > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>{fmt(Number(deal.monthly_fee))}/mes</div>}
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>{fmt(Number(deal.value))}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming activities */}
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Próximas actividades</div>
                  <div className="card-sub">Pendientes ordenadas por fecha</div>
                </div>
                <Link href="/activities" style={{ textDecoration: 'none' }}>
                  <button className="btn-ghost" style={{ fontSize: 12 }}>Ver todo</button>
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 0' }}>
                  <p className="empty-sub">Sin actividades pendientes</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {upcoming.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 0', borderBottom: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ fontSize: 18, flexShrink: 0 }}>
                        {ACTIVITY_ICONS[act.type] ?? '📋'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{act.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                          {act.type.charAt(0).toUpperCase() + act.type.slice(1)}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 11, fontWeight: 600, flexShrink: 0,
                          color: isToday(parseISO(act.due_at!)) ? 'var(--gold)' : 'var(--text-3)'
                        }}
                      >
                        {dueDateLabel(act.due_at!)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

function RevenueChart({ months, values }: { months: string[]; values: number[] }) {
  const max = Math.max(...values, 1)
  const W = 600, H = 180, PAD = { top: 16, right: 16, bottom: 28, left: 52 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const pts = values.map((v, i) => {
    const x = PAD.left + (i / (values.length - 1)) * innerW
    const y = PAD.top + innerH - (v / max) * innerH
    return [x, y] as [number, number]
  })

  const path = pts.length > 1
    ? `M ${pts.map(([x, y]) => `${x},${y}`).join(' L ')}`
    : ''

  const area = pts.length > 1
    ? `M ${pts[0][0]},${H - PAD.bottom} L ${pts.map(([x, y]) => `${x},${y}`).join(' L ')} L ${pts[pts.length - 1][0]},${H - PAD.bottom} Z`
    : ''

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 180 }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8963C" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#E8963C" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Y gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = PAD.top + innerH - t * innerH
        return (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#DDE3ED" strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6A85A0" fontFamily="Inter">
              {t === 0 ? '$0' : fmt(max * t)}
            </text>
          </g>
        )
      })}
      {/* Area */}
      {area && <path d={area} fill="url(#areaGrad)" />}
      {/* Line */}
      {path && <path d={path} fill="none" stroke="#E8963C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {/* Points */}
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#E8963C" />
      ))}
      {/* X labels */}
      {months.map((m, i) => {
        const x = PAD.left + (i / (months.length - 1)) * innerW
        return (
          <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize="10" fill="#6A85A0" fontFamily="Inter">
            {m}
          </text>
        )
      })}
    </svg>
  )
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}
