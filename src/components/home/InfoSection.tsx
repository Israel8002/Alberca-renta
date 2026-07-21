import { Clock, DollarSign, MapPin, Phone, Info } from 'lucide-react'
import { SiteConfig } from '@/types'

interface InfoSectionProps {
  config: Partial<SiteConfig>
}

export default function InfoSection({ config }: InfoSectionProps) {
  const formatMXN = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

  return (
    <section id="info" style={{ background: 'white', padding: '80px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span
            className="badge badge-available"
            style={{ fontSize: '0.7rem', marginBottom: 12 }}
          >
            🏊 Información
          </span>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: 16 }}>
            {config.home_title || 'Alberca Santo Niño'}
          </h2>
          {config.home_description && (
            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '1.0625rem',
                maxWidth: 620,
                margin: '0 auto',
                lineHeight: 1.8,
              }}
            >
              {config.home_description}
            </p>
          )}
        </div>

        {/* Info Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            marginBottom: 48,
          }}
        >
          {/* Horarios */}
          <div
            className="card"
            style={{
              borderTop: '4px solid var(--color-primary-lighter)',
              padding: 28,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #E0F7FF, #BAE6FD)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Clock size={22} color="var(--color-primary)" />
            </div>
            <h3 style={{ fontSize: '1.125rem', marginBottom: 12, fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
              Horarios
            </h3>
            {config.home_schedule ? (
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {config.home_schedule}
              </p>
            ) : (
              <div style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                <p><strong>Lunes – Viernes:</strong></p>
                <p>12:00 PM → 12:00 AM</p>
                <br />
                <p><strong>Sábado y Domingo:</strong></p>
                <p>12:00 PM → 1:00 AM del siguiente día</p>
              </div>
            )}
          </div>

          {/* Precios */}
          <div
            className="card"
            style={{
              borderTop: '4px solid var(--color-accent)',
              padding: 28,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FEF9E7, #FEF3C7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <DollarSign size={22} color="#D97706" />
            </div>
            <h3 style={{ fontSize: '1.125rem', marginBottom: 12, fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
              Precios
            </h3>
            {config.home_prices ? (
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {config.home_prices}
              </p>
            ) : (
              <div style={{ color: 'var(--color-text-muted)' }}>
                {config.weekday_price ? (
                  <>
                    <p style={{ marginBottom: 8 }}>
                      <strong>Lunes – Viernes:</strong>{' '}
                      <span
                        className="font-mono-data"
                        style={{ color: 'var(--color-primary)', fontWeight: 700 }}
                      >
                        {formatMXN(config.weekday_price)}
                      </span>
                    </p>
                    <p>
                      <strong>Fin de semana:</strong>{' '}
                      <span
                        className="font-mono-data"
                        style={{ color: 'var(--color-accent)', fontWeight: 700 }}
                      >
                        {formatMXN(config.weekend_price || 0)}
                      </span>
                    </p>
                  </>
                ) : (
                  <p>Consulta disponibilidad para ver el costo de tu fecha.</p>
                )}
              </div>
            )}
          </div>

          {/* Info adicional */}
          {config.home_additional_info && (
            <div
              className="card"
              style={{
                borderTop: '4px solid var(--color-promo)',
                padding: 28,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Info size={22} color="#7C3AED" />
              </div>
              <h3 style={{ fontSize: '1.125rem', marginBottom: 12, fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>
                Información Adicional
              </h3>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {config.home_additional_info}
              </p>
            </div>
          )}
        </div>

        {/* CTA Final */}
        <div
          style={{
            background: 'linear-gradient(135deg, #005F8E, #00B4D8)',
            borderRadius: 'var(--radius-xl)',
            padding: '48px 40px',
            textAlign: 'center',
            color: 'white',
          }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              marginBottom: 12,
              color: 'white',
            }}
          >
            ¿Listo para reservar?
          </h3>
          <p style={{ opacity: 0.88, marginBottom: 28, fontSize: '1.0625rem' }}>
            Consulta la disponibilidad del calendario y aparta tu fecha en minutos.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/reservar"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 32px',
                background: 'white',
                color: 'var(--color-primary)',
                fontWeight: 700,
                borderRadius: 999,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
              }}
            >
              📅 Ver Calendario
            </a>
            <a
              href="/registro"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 32px',
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(8px)',
                border: '2px solid rgba(255,255,255,0.4)',
                color: 'white',
                fontWeight: 700,
                borderRadius: 999,
                fontSize: '1rem',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              👤 Crear Cuenta
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
