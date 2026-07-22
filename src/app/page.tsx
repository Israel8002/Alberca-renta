import { createClient } from '@/lib/supabase/server'
import { SiteConfig } from '@/types'
import Navbar from '@/components/ui/Navbar'
import HeroCarousel from '@/components/home/HeroCarousel'
import InfoSection from '@/components/home/InfoSection'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch site config
  const { data: configData } = await supabase
    .from('site_config')
    .select('*')
    .eq('id', 'main')
    .single()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const config: Partial<SiteConfig> = configData || {}

  return (
    <>
      <Navbar
        isAdmin={profile?.role === 'admin' || profile?.role === 'superadmin'}
        userName={profile?.name}
      />
      <main>
        {/* Hero con carrusel */}
        <HeroCarousel
          images={config.carousel_images || []}
          title={config.home_title || 'Alberca Santo Niño'}
        />

        {/* Info Section */}
        <InfoSection config={config} />

        {/* Footer */}
        <footer
          style={{
            background: 'var(--color-bg-dark)',
            color: 'rgba(255,255,255,0.7)',
            padding: '48px 24px',
            textAlign: 'center',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span style={{ color: 'var(--color-primary-lighter)', fontSize: '1.5rem' }}>🏊</span>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                color: 'white',
                fontSize: '1.25rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}
            >
              SISTEMA DE RESERVAS
            </span>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, marginBottom: 4 }}>
            © {new Date().getFullYear()} Sistema de Reservas v1.0
          </p>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
            Todos los derechos reservados
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-primary-lighter)', fontWeight: 600 }}>
            Contacto Whatsapp: <a href="https://alberca-renta.vercel.app/sistema-software" style={{ color: '#25D366', textDecoration: 'none', fontWeight: 700 }}>6862770831</a>
          </p>
        </footer>
      </main>
    </>
  )
}
