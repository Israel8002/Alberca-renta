import Link from 'next/link'
import { Waves, Menu, X } from 'lucide-react'

interface NavbarProps {
  isAdmin?: boolean
  userName?: string
}

export default function Navbar({ isAdmin, userName }: NavbarProps) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,95,142,0.08)',
        boxShadow: '0 2px 16px rgba(0,95,142,0.06)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
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
              padding: '8px 16px',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
              fontSize: '0.9375rem',
              textDecoration: 'none',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.2s',
            }}
          >
            Calendario
          </Link>
          <Link
            href="/#info"
            style={{
              padding: '8px 16px',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
              fontSize: '0.9375rem',
              textDecoration: 'none',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.2s',
            }}
          >
            Costos
          </Link>

          {userName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
              {isAdmin && (
                <Link href="/admin" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
                  Panel Admin
                </Link>
              )}
              <Link href="/mi-cuenta" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.875rem' }}>
                Mi Cuenta
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
              <Link href="/login" className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.875rem' }}>
                Iniciar Sesión
              </Link>
              <Link href="/registro" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.875rem' }}>
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
