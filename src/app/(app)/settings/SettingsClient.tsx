'use client'

import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { LogOut, User, Shield, Database } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userEmail: string
  userId: string
}

export default function SettingsClient({ userEmail, userId }: Props) {
  const router = useRouter()

  async function logout() {
    const sb = createClient()
    await sb.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <>
      <Topbar title="Ajustes" subtitle="Configuración de tu cuenta" />
      <div className="page-scroller">
        <div className="page-body" style={{ maxWidth: 640 }}>

          {/* Account */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div className="avatar avatar-lg" style={{ background: 'var(--gold-soft)', color: 'var(--gold)', borderColor: 'var(--gold-mid)' }}>
                {userEmail.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{userEmail}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>Admin · Plan Free</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, background: 'var(--surface-2)'
              }}>
                <User size={14} color="var(--text-3)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Email</div>
                  <div style={{ fontSize: 13 }}>{userEmail}</div>
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8, background: 'var(--surface-2)'
              }}>
                <Shield size={14} color="var(--text-3)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>User ID</div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-2)' }}>{userId}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Database */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head">
              <div>
                <div className="card-title">Base de datos</div>
                <div className="card-sub">Supabase</div>
              </div>
              <Database size={16} color="var(--text-3)" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Para ejecutar el schema de la base de datos, ve al SQL Editor en tu panel de Supabase y ejecuta el contenido de{' '}
              <code style={{ background: 'var(--surface-3)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>
                supabase/schema.sql
              </code>
            </div>
          </div>

          {/* Danger zone */}
          <div className="card" style={{ borderColor: 'rgba(232,113,113,0.2)' }}>
            <div className="card-title" style={{ color: 'var(--neg)', marginBottom: 12 }}>Zona de peligro</div>
            <button className="btn-ghost btn-ghost-danger" onClick={logout}>
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
