import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/ui/Navbar'
import PublicCalendar from '@/components/calendar/PublicCalendar'
import { SiteConfig } from '@/types'

export default async function ReservarPage() {
  const supabase = await createClient()

  const { data: configData } = await supabase
    .from('site_config')
    .select('*')
    .eq('id', 'main')
    .single()

  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase.from('profiles').select('name, role').eq('id', user.id).single()
    profile = data
  }

  const config: Partial<SiteConfig> = configData || {}
  const adminPhone = config.admin_whatsapp_numbers?.[0] || ''

  return (
    <>
      <Navbar
        isAdmin={profile?.role === 'admin' || profile?.role === 'superadmin'}
        userName={profile?.name}
      />
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 60 }}>
        {/* Header */}
        <div
          className="water-gradient"
          style={{ padding: '48px 24px 56px', textAlign: 'center', marginBottom: '-24px' }}
        >
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              color: 'white',
              marginBottom: 8,
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            📅 Calendario de Disponibilidad
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.0625rem' }}>
            Selecciona una fecha disponible para ver detalles y apartar
          </p>
        </div>

        {/* Calendar container */}
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '0 16px',
            position: 'relative',
            top: 0,
          }}
        >
          <div className="card" style={{ padding: '32px 24px', marginBottom: 32 }}>
            <PublicCalendar config={config} adminWhatsapp={adminPhone} />
          </div>

          {/* Info rápida */}
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '20px 24px',
              border: '1px solid rgba(0,95,142,0.1)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>L-V Horario</p>
              <p style={{ fontWeight: 700, color: 'var(--color-primary)' }}>12:00 PM – 12:00 AM</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>S-D Horario</p>
              <p style={{ fontWeight: 700, color: 'var(--color-primary)' }}>12:00 PM – 1:00 AM</p>
            </div>
            {config.weekday_price ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>Precio L-V</p>
                <p style={{ fontWeight: 700, color: 'var(--color-primary)', fontFamily: 'JetBrains Mono' }}>
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(config.weekday_price)}
                </p>
              </div>
            ) : null}
            {config.weekend_price ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>Precio S-D</p>
                <p style={{ fontWeight: 700, color: '#D97706', fontFamily: 'JetBrains Mono' }}>
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(config.weekend_price)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </>
  )
}
