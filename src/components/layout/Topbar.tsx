'use client'

import { Bell, Search } from 'lucide-react'
import { useState } from 'react'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  showSearch?: boolean
  searchPlaceholder?: string
  onSearch?: (q: string) => void
}

export default function Topbar({
  title,
  subtitle,
  actions,
  showSearch = false,
  searchPlaceholder = 'Buscar…',
  onSearch,
}: TopbarProps) {
  const [q, setQ] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQ(e.target.value)
    onSearch?.(e.target.value)
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>

      <div className="topbar-right">
        {showSearch && (
          <div className="search-bar">
            <Search size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
            <input
              value={q}
              onChange={handleChange}
              placeholder={searchPlaceholder}
            />
            <span className="kbd">/</span>
          </div>
        )}

        {actions}

        <button className="icon-btn" title="Notificaciones">
          <Bell size={16} strokeWidth={1.8} />
          <span className="bell-dot" />
        </button>
      </div>
    </header>
  )
}
