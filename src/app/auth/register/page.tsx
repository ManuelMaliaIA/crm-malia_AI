'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Completa todos los campos'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    const sb = createClient()
    const { error: err } = await sb.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(80,200,120,0.12)', border: '1px solid rgba(80,200,120,0.3)',
            display: 'grid', placeItems: 'center', margin: '0 auto 20px'
          }}>
            <CheckCircle size={28} color="#5ac878" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>¡Cuenta creada!</h2>
          <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 24 }}>
            Revisa tu email para confirmar la cuenta antes de entrar.
          </p>
          <Link href="/auth/login">
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Ir a iniciar sesión
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">
            <Zap size={20} color="#080808" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Apex CRM</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Agency</div>
          </div>
        </div>

        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-sub">Empieza a gestionar tu pipeline con Apex CRM</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
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
                placeholder="Mínimo 6 caracteres"
                style={{ paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <input
              type={showPwd ? 'text' : 'password'}
              className="form-input"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
            />
          </div>

          {error && (
            <div style={{ background: 'var(--neg-soft)', border: '1px solid rgba(232,113,113,0.3)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'var(--neg)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? <span className="spinner" /> : 'Crear cuenta'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
