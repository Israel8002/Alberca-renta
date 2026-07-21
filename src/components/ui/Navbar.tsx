'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Waves, LogOut, Shield, User as UserIcon } from 'lucide-react'
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
  const [loading, setLoading] = useState(!propUserName)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('id', user.id)
          .single()

        const isUserAdmin = profile?.role === 'superadmin' || profile?.role === 'admin'
        setUserState({
          loggedIn: true,
          name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
          isAdmin: isUserAdmin,
        })
      } else {
        setUserState({ loggedIn: false, name: '', isAdmin: false })
      }
      setLoading(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    setUserState({ loggedIn: false, name: '', isAdmin: false })
    router.push('/')
    router.refresh()
  }

  const isUserLoggedIn = userState.loggedIn || !!propUserName
  const isAdminUser = userState.isAdmin || !!propIsAdmin
  const displayName = userState.name || propUserName || ''

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.95)',
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

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

          {!loading && (
            isUserLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                {isAdminUser && (
                  <Link
                    href="/admin"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 14px',
                      background: 'linear-gradient(135deg, #F4A623, #FBBF24)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      borderRadius: 10,
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(244,166,35,0.3)',
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
      </div>
    </nav>
  )
}
