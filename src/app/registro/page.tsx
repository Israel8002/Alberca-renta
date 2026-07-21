'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Waves, Eye, EyeOff, Loader2, User, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    // Validate WhatsApp (10 digits)
    const wa = form.whatsapp.replace(/\D/g, '')
    if (wa.length < 10) {
      toast.error('Ingresa un número de WhatsApp válido (10 dígitos)')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          whatsapp: wa,
          role: 'cliente',
        },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Este correo ya está registrado. Inicia sesión.')
      } else {
        toast.error(error.message)
      }
      setLoading(false)
      return
    }

    toast.success(`¡Bienvenido, ${form.name}! 🏊 Cuenta creada exitosamente.`)
    router.push('/mi-cuenta')
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
          position: 'absolute', top: -100, left: -100,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, right: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(244,166,35,0.1)',
        }} />
      </div>

      <div
        className="animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 460,
          padding: 40,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F4A623, #FBBF24)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(244,166,35,0.35)',
            }}
          >
            <User size={30} color="white" />
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.75rem',
              color: 'var(--color-text)',
              marginBottom: 4,
            }}
          >
            Crear Cuenta
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
            Sistema Reservas v1.0 · Parques y Albercas
          </p>
        </div>

        <form onSubmit={handleRegister}>
          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label className="label">Nombre completo</label>
            <input
              type="text"
              name="name"
              className="input-field"
              placeholder="Juan García"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* WhatsApp */}
          <div style={{ marginBottom: 16 }}>
            <label className="label">WhatsApp (10 dígitos)</label>
            <input
              type="tel"
              name="whatsapp"
              className="input-field"
              placeholder="3311234567"
              value={form.whatsapp}
              onChange={handleChange}
              required
              maxLength={15}
            />
            <p style={{ color: 'var(--color-text-light)', fontSize: '0.78rem', marginTop: 4 }}>
              Este número se usará para comunicaciones de tu reservación
            </p>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label className="label">Correo electrónico</label>
            <input
              type="email"
              name="email"
              className="input-field"
              placeholder="tu@correo.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label className="label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                className="input-field"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
                required
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

          {/* Confirm password */}
          <div style={{ marginBottom: 28 }}>
            <label className="label">Confirmar contraseña</label>
            <input
              type={showPass ? 'text' : 'password'}
              name="confirmPassword"
              className="input-field"
              placeholder="Repite tu contraseña"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
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
                Creando cuenta…
              </>
            ) : (
              '🏊 Crear mi Cuenta'
            )}
          </button>
        </form>

        <div className="divider" />

        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Iniciar Sesión
          </Link>
        </p>
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
