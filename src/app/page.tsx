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
            color: 'rgba(255,255,255,0.6)',
            padding: '40px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span style={{ color: 'var(--color-primary-lighter)', fontSize: '1.5rem' }}>🏊</span>
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                color: 'white',
                fontSize: '1.1rem',
                fontWeight: 600,
              }}
            >
              Alberca Santo Niño
            </span>
          </div>
          <p style={{ fontSize: '0.875rem' }}>
            © {new Date().getFullYear()} Alberca Santo Niño. Todos los derechos reservados.
          </p>
        </footer>
      </main>
    </>
  )
}
