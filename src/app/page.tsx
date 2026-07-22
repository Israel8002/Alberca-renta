import Navbar from '@/components/ui/Navbar'
import HeroCarousel from '@/components/home/HeroCarousel'
import PublicCalendar from '@/components/calendar/PublicCalendar'
import { createClient } from '@/lib/supabase/client'
import { SiteConfig } from '@/types'
import Link from 'next/link'

async function getConfig(): Promise<{ config: Partial<SiteConfig>; banners: string[] }> {
  const supabase = createClient()
  const [{ data: config }, { data: banners }] = await Promise.all([
    supabase.from('site_config').select('*').eq('id', 'main').maybeSingle(),
    supabase.from('banners').select('image_url').eq('is_active', true).order('sort_order', { ascending: true }),
  ])

  return {
    config: config || {},
    banners: banners?.map(b => b.image_url) || ['/alberca1.jpg', '/alberca2.jpg', '/alberca3.jpg'],
  }
}

export default async function HomePage() {
  const { config, banners } = await getConfig()

  return (
    <>
      <Navbar />

      <main style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        {/* Hero Carousel Section */}
        <section style={{ maxWidth: 1200, margin: '24px auto 0', padding: '0 16px' }}>
          <HeroCarousel images={banners.length > 0 ? banners : ['/alberca1.jpg', '/alberca2.jpg', '/alberca3.jpg']} title={config.home_title || 'Sistema Reservas v1.0'} />
        </section>

        {/* Welcome Section */}
        <section style={{ textAlign: 'center', padding: '36px 16px 20px', maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.25rem', color: 'var(--color-primary-dark)', marginBottom: 12 }}>
            {config.home_title || 'Sistema Reservas v1.0'}
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {config.home_description || 'Consulta nuestra disponibilidad en tiempo real y aparta tu fecha ideal directamente por WhatsApp.'}
          </p>
        </section>

        {/* Public Calendar Section */}
        <section style={{ padding: '0 0 60px' }}>
          <PublicCalendar config={config} adminWhatsapp={config.weekday_price ? String(config.admin_whatsapp_numbers?.[0] || '6862770831') : '6862770831'} />
        </section>

        {/* FOOTER */}
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
            Contacto Whatsapp / Adquirir Sistema: <Link href="/sistema-software" style={{ color: '#25D366', textDecoration: 'underline', fontWeight: 700 }}>6862770831</Link>
          </p>
        </footer>
      </main>
    </>
  )
}
