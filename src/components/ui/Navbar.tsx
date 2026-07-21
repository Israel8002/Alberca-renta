'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Waves, LogOut, Shield, User as UserIcon, Menu, X, Calendar, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'

interface NavbarProps {
  isAdmin?: boolean
  userName?: string
}

export default function Navbar({ isAdmin: propIsAdmin, userName: propUserName }: NavbarProps) {
  const [userState, setUserState] = useState<{
    loggedIn: boolean
    name: string
    isAdmin: boolean
  }>({
    loggedIn: !!propUserName,
    name: propUserName || '',
    isAdmin: !!propIsAdmin,
  })
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('id', user.id)
            .maybeSingle()

          const role = profile?.role || user.user_metadata?.role || 'cliente'
          const isUserAdmin = role === 'superadmin' || role === 'admin' || pathname.startsWith('/admin')

          setUserState({
            loggedIn: true,
            name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
            isAdmin: isUserAdmin,
          })
        } else {
          setUserState({ loggedIn: false, name: '', isAdmin: false })
        }
      } catch {
        setUserState({ loggedIn: false, name: '', isAdmin: false })
      }
      setLoading(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser()
    })

    return () => subscription.unsubscribe()
  }, [pathname])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    setUserState({ loggedIn: false, name: '', isAdmin: false })
    setMobileOpen(false)
    router.push('/')
    router.refresh()
  }

  const isUserLoggedIn = userState.loggedIn || !!propUserName
  const isAdminUser = userState.isAdmin || propIsAdmin || pathname.startsWith('/admin')
  const displayName = userState.name || propUserName || ''

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,95,142,0.08)',
        boxShadow: '0 2px 16px rgba(0,95,142,0.06)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 20px',
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #005F8E, #00B4D8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Waves size={20} color="white" />
          </div>
          <div>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'var(--color-text)',
                lineHeight: 1,
              }}
            >
              Alberca
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'var(--color-primary-lighter)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Santo Niño
            </span>
          </div>
        </Link>

        {/* Desktop Links (Hidden on mobile) */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            href="/reservar"
            style={{
              padding: '8px 14px',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
              fontSize: '0.9rem',
              textDecoration: 'none',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Calendario
          </Link>
          <Link
            href="/#info"
            style={{
              padding: '8px 14px',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
              fontSize: '0.9rem',
              textDecoration: 'none',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Costos
          </Link>

          {isUserLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              {isAdminUser && (
                <Link
                  href="/admin"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    background: 'linear-gradient(135deg, #005F8E, #00B4D8)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    borderRadius: 10,
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(0,95,142,0.25)',
                  }}
                >
                  <Shield size={15} />
                  Panel Admin
                </Link>
              )}
              <Link
                href="/mi-cuenta"
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <UserIcon size={15} />
                {displayName || 'Mi Cuenta'}
              </Link>
              <button
                onClick={handleLogout}
                title="Cerrar Sesión"
                style={{
                  background: '#FEE2E2',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            !loading && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
                <Link href="/login" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Iniciar Sesión
                </Link>
                <Link href="/registro" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Registrarse
                </Link>
              </div>
            )
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="nav-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: 'none',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            color: 'var(--color-primary)',
          }}
          aria-label="Abrir menú"
        >
          {mobileOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div
          className="nav-mobile-menu animate-fade-in"
          style={{
            background: 'white',
            borderBottom: '1px solid rgba(0,95,142,0.1)',
            padding: '16px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
          }}
        >
          <Link
            href="/reservar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <Calendar size={18} color="var(--color-primary)" />
            Calendario de Disponibilidad
          </Link>
          <Link
            href="/#info"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <DollarSign size={18} color="var(--color-primary)" />
            Costos e Información
          </Link>

          <div style={{ height: 1, background: '#E5E7EB', margin: '4px 0' }} />

          {isUserLoggedIn ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isAdminUser && (
                <Link
                  href="/admin"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px',
                    background: 'linear-gradient(135deg, #005F8E, #00B4D8)',
                    color: 'white',
                    fontWeight: 700,
                    borderRadius: 12,
                    textDecoration: 'none',
                  }}
                >
                  <Shield size={18} />
                  Ir al Panel de Administración
                </Link>
              )}
              <Link
                href="/mi-cuenta"
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '14px',
                  borderRadius: 12,
                }}
              >
                <UserIcon size={18} />
                Mi Cuenta ({displayName})
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px',
                  background: '#FEE2E2',
                  border: 'none',
                  borderRadius: 12,
                  color: '#DC2626',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.9375rem',
                }}
              >
                <LogOut size={18} />
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                href="/login"
                className="btn-secondary"
                style={{ textAlign: 'center', padding: '12px' }}
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                className="btn-primary"
                style={{ textAlign: 'center', padding: '12px' }}
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @media (min-width: 769px) {
          .nav-mobile-toggle { display: none !important; }
          .nav-mobile-menu { display: none !important; }
          .nav-desktop { display: flex !important; }
        }
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  )
}
