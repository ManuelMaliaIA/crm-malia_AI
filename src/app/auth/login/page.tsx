'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Completa todos los campos'); return }
    setLoading(true)

    const sb = createClient()
    const { error: err } = await sb.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (err) { setError(err.message); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-mark">
            <Zap size={20} color="#080808" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>Apex CRM</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Agency</div>
          </div>
        </div>

        <h1 className="auth-title">Bienvenido de nuevo</h1>
        <p className="auth-sub">Accede a tu CRM para continuar gestionando tu pipeline</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4
                }}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'var(--neg-soft)', border: '1px solid rgba(232,113,113,0.3)',
              borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--neg)'
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? <span className="spinner" /> : 'Iniciar sesión'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
          ¿Sin cuenta?{' '}
          <Link href="/auth/register" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
