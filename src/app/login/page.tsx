'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Waves, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        toast.error('Por favor confirma tu correo electrónico antes de iniciar sesión')
      } else {
        toast.error(error.message || 'Correo o contraseña incorrectos')
      }
      setLoading(false)
      return
    }

    // Fetch role to redirect accordingly
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, name')
      .eq('id', data.user.id)
      .single()

    toast.success(`¡Bienvenido${profile?.name ? `, ${profile.name}` : ''}! 🏊`)

    if (profile?.role === 'superadmin' || profile?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/mi-cuenta')
    }

    router.refresh()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0D2137 0%, #005F8E 50%, #00B4D8 100%)',
        padding: 24,
      }}
    >
      {/* Decorative circles */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(0,180,216,0.1)',
        }} />
      </div>

      <div
        className="card-glass animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 40,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #005F8E, #00B4D8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(0,119,182,0.3)',
            }}
          >
            <Waves size={30} color="white" />
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.75rem',
              color: 'var(--color-text)',
              marginBottom: 4,
            }}
          >
            Bienvenido
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Alberca Santo Niño
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 20 }}>
            <label className="label">Correo electrónico</label>
            <input
              type="email"
              className="input-field"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label className="label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                }}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: 12 }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Entrando…
              </>
            ) : (
              '🏊 Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="divider" />

        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          ¿No tienes cuenta?{' '}
          <Link
            href="/registro"
            style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Regístrate aquí
          </Link>
        </p>

        <p style={{ textAlign: 'center', marginTop: 12 }}>
          <Link
            href="/"
            style={{ color: 'var(--color-text-light)', fontSize: '0.875rem', textDecoration: 'none' }}
          >
            ← Volver al inicio
          </Link>
        </p>
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
