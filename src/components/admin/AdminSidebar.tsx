'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, BookOpen,
  CreditCard, Receipt, Star, Settings, LogOut,
  Waves, ChevronRight,
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

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/')
    router.refresh()
  }

  return (
    <aside
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
          <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>
            Alberca
          </p>
          <p style={{ color: 'var(--color-primary-lighter)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Santo Niño
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
  )
}
