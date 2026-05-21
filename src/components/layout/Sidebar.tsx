'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Briefcase, Building2,
  Activity, Settings, Plus, Zap
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contactos', icon: Users, badge: null },
  { href: '/pipeline', label: 'Pipeline', icon: Briefcase },
  { href: '/companies', label: 'Empresas', icon: Building2 },
  { href: '/activities', label: 'Actividades', icon: Activity },
]

interface SidebarProps {
  userEmail?: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'U'

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <div className="brand-mark">
          <Zap size={16} color="#4F8EF7" strokeWidth={2.5} />
        </div>
        <div>
          <div className="brand-name">Malia AI CRM</div>
          <div className="brand-sub">AI Agency</div>
        </div>
      </div>

      {/* New deal button */}
      <Link href="/deals/new" className="new-btn" style={{ textDecoration: 'none' }}>
        <Plus size={15} strokeWidth={2.5} />
        <span>Nuevo deal</span>
        <span className="kbd" style={{ marginLeft: 'auto' }}>N</span>
      </Link>

      {/* Navigation */}
      <nav className="nav-section">
        <div className="nav-label">Principal</div>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${pathname.startsWith(href) ? 'active' : ''}`}
          >
            <Icon size={16} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <nav className="nav-section" style={{ marginTop: 8 }}>
        <div className="nav-label">Sistema</div>
        <Link
          href="/settings"
          className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}
        >
          <Settings size={16} strokeWidth={1.8} />
          <span>Ajustes</span>
        </Link>
      </nav>

      {/* User card */}
      <div className="user-card">
        <div className="user-avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name">{userEmail ?? 'Usuario'}</div>
          <div className="user-sub">Admin</div>
        </div>
      </div>
    </aside>
  )
}
