'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { Plus, ArrowUpDown, ChevronUp, ChevronDown, Trash2, Mail, Phone } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import ContactModal from './ContactModal'

type ContactRow = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  status: string
  title: string | null
  owner: string | null
  created_at: string
  companies?: { name: string } | null
}

type SortKey = 'name' | 'email' | 'status' | 'created_at'
type SortDir = 'asc' | 'desc'

const STATUS_LABELS: Record<string, string> = {
  lead: 'Lead', prospect: 'Prospect', customer: 'Cliente', churned: 'Churned'
}

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

export default function ContactsClient({ contacts: initial, userId }: { contacts: ContactRow[]; userId: string }) {
  const router = useRouter()
  const [contacts, setContacts] = useState(initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = useMemo(() => {
    let rows = contacts
    if (statusFilter !== 'all') rows = rows.filter(c => c.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(c =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.companies?.name?.toLowerCase().includes(q)
      )
    }
    rows = [...rows].sort((a, b) => {
      let av = '', bv = ''
      if (sortKey === 'name') { av = `${a.first_name} ${a.last_name}`; bv = `${b.first_name} ${b.last_name}` }
      else if (sortKey === 'email') { av = a.email; bv = b.email }
      else if (sortKey === 'status') { av = a.status; bv = b.status }
      else { av = a.created_at; bv = b.created_at }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return rows
  }, [contacts, search, statusFilter, sortKey, sortDir])

  function toggleSelect(id: string) {
    setSelected(s => {
      const n = new Set(s)
      if (n.has(id)) { n.delete(id) } else { n.add(id) }
      return n
    })
  }

  async function deleteSelected() {
    const sb = createClient()
    const ids = [...selected]
    await sb.from('contacts').delete().in('id', ids)
    setContacts(c => c.filter(x => !ids.includes(x.id)))
    setSelected(new Set())
  }

  async function onContactCreated(contact: ContactRow) {
    setContacts(c => [contact, ...c])
    setShowModal(false)
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ArrowUpDown size={12} opacity={0.4} />
    return sortDir === 'asc' ? <ChevronUp size={12} color="var(--gold)" /> : <ChevronDown size={12} color="var(--gold)" />
  }

  const tabs = [
    { key: 'all', label: 'Todos', count: contacts.length },
    { key: 'lead', label: 'Leads', count: contacts.filter(c => c.status === 'lead').length },
    { key: 'prospect', label: 'Prospects', count: contacts.filter(c => c.status === 'prospect').length },
    { key: 'customer', label: 'Clientes', count: contacts.filter(c => c.status === 'customer').length },
  ]

  return (
    <>
      <Topbar
        title="Contactos"
        subtitle={`${contacts.length} contactos en total`}
        showSearch
        searchPlaceholder="Buscar por nombre, email…"
        onSearch={setSearch}
        actions={
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} strokeWidth={2.5} />
            Nuevo contacto
          </button>
        }
      />

      <div className="page-scroller">
        <div className="page-body">

          {/* Tabs */}
          <div className="flex items-center gap-4 mb-5">
            <div className="seg">
              {tabs.map(t => (
                <button
                  key={t.key}
                  className={`seg-item ${statusFilter === t.key ? 'active' : ''}`}
                  onClick={() => setStatusFilter(t.key)}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span style={{
                      marginLeft: 5, fontSize: 10, fontWeight: 700,
                      background: 'var(--surface-3)', color: 'var(--text-3)',
                      padding: '1px 5px', borderRadius: 999
                    }}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface-2)', border: '1px solid var(--border-hi)',
              borderRadius: 10, padding: '10px 16px', marginBottom: 16
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
              </span>
              <button className="btn-ghost btn-ghost-danger" onClick={deleteSelected}>
                <Trash2 size={13} /> Eliminar
              </button>
              <button
                className="btn-ghost"
                style={{ marginLeft: 'auto' }}
                onClick={() => setSelected(new Set())}
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👤</div>
                <div className="empty-title">Sin contactos</div>
                <p className="empty-sub">
                  {search ? 'No hay resultados para tu búsqueda' : 'Crea tu primer contacto para empezar'}
                </p>
                {!search && (
                  <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
                    <Plus size={14} /> Nuevo contacto
                  </button>
                )}
              </div>
            ) : (
              <table className="crm-table">
                <thead>
                  <tr>
                    <th style={{ width: 40, paddingLeft: 16 }}>
                      <input
                        type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={() => {
                          if (selected.size === filtered.length) setSelected(new Set())
                          else setSelected(new Set(filtered.map(c => c.id)))
                        }}
                        style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
                      />
                    </th>
                    <th onClick={() => toggleSort('name')} style={{ minWidth: 200 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        Nombre <SortIcon k="name" />
                      </span>
                    </th>
                    <th onClick={() => toggleSort('email')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        Email <SortIcon k="email" />
                      </span>
                    </th>
                    <th>Empresa</th>
                    <th onClick={() => toggleSort('status')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        Estado <SortIcon k="status" />
                      </span>
                    </th>
                    <th>Owner</th>
                    <th onClick={() => toggleSort('created_at')}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        Creado <SortIcon k="created_at" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/contacts/${c.id}`)}
                    >
                      <td style={{ paddingLeft: 16 }} onClick={e => { e.stopPropagation(); toggleSelect(c.id) }}>
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => {}}
                          style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar">
                            {initials(c.first_name, c.last_name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{c.first_name} {c.last_name}</div>
                            {c.title && <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{c.title}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}>
                          <Mail size={12} />
                          <span style={{ fontSize: 12.5 }}>{c.email}</span>
                        </div>
                        {c.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', marginTop: 2 }}>
                            <Phone size={12} />
                            <span style={{ fontSize: 12 }}>{c.phone}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>
                        {c.companies?.name ?? '—'}
                      </td>
                      <td>
                        <span className={`chip chip-${c.status}`}>
                          {STATUS_LABELS[c.status]}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12.5 }}>
                        {c.owner ?? '—'}
                      </td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {format(parseISO(c.created_at), 'd MMM yyyy', { locale: es })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>

      {showModal && (
        <ContactModal
          userId={userId}
          onClose={() => setShowModal(false)}
          onCreated={onContactCreated}
        />
      )}
    </>
  )
}
