'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Calendar, Users, BookOpen,
  CreditCard, Receipt, Star, Settings, LogOut,
  Waves, Menu, X, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/calendario', label: 'Calendario', icon: Calendar },
  { href: '/admin/reservaciones', label: 'Reservaciones', icon: BookOpen },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/pagos', label: 'Pagos', icon: CreditCard },
  { href: '/admin/costos', label: 'Costos', icon: Receipt },
  { href: '/admin/eventos', label: 'Eventos', icon: Star },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export default function AdminSidebar({ role }: { role?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/')
    router.refresh()
  }

  return (
    <>
      {/* Mobile Top Header (Visible only on mobile/tablet <= 768px) */}
      <header
        className="admin-mobile-header"
        style={{
          height: 64,
          background: 'var(--color-bg-dark)',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #005F8E, #00B4D8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Waves size={18} color="white" />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.1 }}>Sistema Reservas v1.0</p>
            <span style={{ fontSize: '0.62rem', color: role === 'superadmin' ? '#F4A623' : 'var(--color-primary-lighter)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Parques y Albercas
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 6 }}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="admin-mobile-drawer animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(13,33,55,0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            padding: 20,
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #005F8E, #00B4D8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Waves size={20} color="white" />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Sistema Reservas v1.0</p>
                <p style={{ color: 'var(--color-primary-lighter)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Parques y Albercas</p>
              </div>
            </div>
            <button onClick={() => setMobileOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={20} />
            </button>
          </div>

          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {NAV_ITEMS.map(item => {
              const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 12,
                    textDecoration: 'none',
                    background: isActive ? 'rgba(0,180,216,0.2)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? 'var(--color-primary-lighter)' : 'white',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icon size={20} color={isActive ? 'var(--color-primary-lighter)' : 'rgba(255,255,255,0.7)'} />
                    {item.label}
                  </div>
                  <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
                </Link>
              )
            })}
          </nav>

          <div style={{ paddingTop: 20, marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              <Waves size={18} /> Ver sitio público
            </Link>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                borderRadius: 10,
                background: '#FEE2E2',
                border: 'none',
                color: '#DC2626',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <LogOut size={18} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar (Visible only on desktop >= 769px) */}
      <aside
        className="admin-desktop-sidebar"
        style={{
          width: 240,
          minHeight: '100vh',
          background: 'var(--color-bg-dark)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #005F8E, #00B4D8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Waves size={20} color="white" />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.2 }}>
              Sistema Reservas v1.0
            </p>
            <p style={{ color: 'var(--color-primary-lighter)', fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
              Parques y Albercas
            </p>
          </div>
        </div>

        {/* Role badge */}
        <div style={{ padding: '10px 20px' }}>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              padding: '3px 8px',
              borderRadius: 999,
              background: role === 'superadmin' ? 'rgba(244,166,35,0.2)' : 'rgba(0,180,216,0.15)',
              color: role === 'superadmin' ? '#F4A623' : 'var(--color-primary-lighter)',
            }}
          >
            {role === 'superadmin' ? '⭐ Superadmin' : '🔑 Admin'}
          </span>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  background: isActive ? 'rgba(0,180,216,0.15)' : 'transparent',
                  color: isActive ? 'var(--color-primary-lighter)' : 'rgba(255,255,255,0.6)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s',
                  borderLeft: isActive ? '3px solid var(--color-primary-lighter)' : '3px solid transparent',
                }}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 10,
              textDecoration: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '0.875rem',
              marginBottom: 4,
            }}
          >
            <Waves size={16} />
            Ver sitio
          </Link>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'none',
              border: 'none',
              color: 'rgba(239,68,68,0.7)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.15s',
            }}
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <style jsx global>{`
        @media (min-width: 769px) {
          .admin-mobile-header { display: none !important; }
          .admin-mobile-drawer { display: none !important; }
          .admin-desktop-sidebar { display: flex !important; }
        }
        @media (max-width: 768px) {
          .admin-desktop-sidebar { display: none !important; }
          .admin-mobile-header { display: flex !important; }
        }
      `}</style>
    </>
  )
}
