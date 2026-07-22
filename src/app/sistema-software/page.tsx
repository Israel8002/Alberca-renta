import Link from 'next/link'
import { MessageCircle, Award, CheckCircle, Calendar, Upload, Users, DollarSign, CreditCard, Zap } from 'lucide-react'
import Navbar from '@/components/ui/Navbar'

export const metadata = {
  title: 'Sistema de Reservas En Linea — Software de Gestión para Parques y Albercas',
  description: 'Adquiere el sistema de reservas en línea definitivo para la renta de parques, albercas, quintas y salones de eventos. 100% responsivo y automatizado con WhatsApp.',
}

export default function SoftwareShowcasePage() {
  const whatsappUrl = "https://wa.me/526862770831?text=Hola!%20👋%20Me%20interesa%20adquirir%20el%20Sistema%20de%20Reservas%20En%20L%C3%ADnea%20para%20mi%20negocio.%20%C2%BFMe%20pueden%20brindar%20informaci%C3%B3n%20y%20precios?"

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', background: '#0D2137', color: 'white', overflowX: 'hidden' }}>
        
        {/* HERO SECTION */}
        <section style={{
          padding: '80px 24px 60px',
          background: 'radial-gradient(circle at 50% 20%, #005F8E 0%, #0D2137 70%)',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <span style={{
              background: 'rgba(0,180,216,0.2)',
              border: '1px solid var(--color-primary-lighter)',
              color: 'var(--color-primary-lighter)',
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '6px 16px',
              borderRadius: 999,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: 20,
            }}>
              ⚡ Software de Gestión & Reservaciones v1.0
            </span>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: 20,
              color: 'white',
            }}>
              El Sistema de Reservas En Línea Definitivo para tu Negocio
            </h1>

            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'rgba(255,255,255,0.85)',
              maxWidth: 760,
              margin: '0 auto 36px',
              lineHeight: 1.6,
            }}>
              Automatiza el apartado de fechas, la recepción de comprobantes y la atención por WhatsApp para tu parque, alberca, quinta o salón de eventos. 100% responsivo en cualquier dispositivo.
            </p>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
                style={{ padding: '16px 28px', fontSize: '1.05rem', borderRadius: 14, boxShadow: '0 8px 30px rgba(37,211,102,0.35)' }}
              >
                <MessageCircle size={22} /> Adquirir Sistema vía WhatsApp (6862770831)
              </a>
            </div>
          </div>
        </section>

        {/* ACCESIBLE DESDE CUALQUIER DISPOSITIVO (USANDO LAS FOTOS EXACTAS TAL CUAL FUERON DADAS) */}
        <section style={{ padding: '60px 24px 80px', background: '#0A192F', textAlign: 'center' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: 20,
              color: 'white',
            }}>
              Accesible desde Cualquier Dispositivo
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', maxWidth: 720, margin: '0 auto 48px', lineHeight: 1.6 }}>
              Tus clientes y administradores podrán usar la plataforma cómodamente desde Computadoras de Escritorio, Laptops, Tablets o Celulares sin descargar nada.
            </p>

            {/* SHOWCASE OF USER PROVIDED IMAGES (FOTO 1, FOTO 2, FOTO 3) IN NATURAL FULL ASPECT RATIO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'center' }}>
              
              {/* FOTO 1: VISTA ESCRITORIO */}
              <div style={{ width: '100%', maxWidth: 900, textAlign: 'center' }}>
                <div style={{ marginBottom: 12 }}>
                  <span className="badge badge-pagado" style={{ fontSize: '0.85rem', padding: '6px 14px', borderRadius: 8 }}>
                    💻 Vista Escritorio (PC / Laptop)
                  </span>
                </div>
                <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 16px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <img
                    src="/demo-desktop.png"
                    alt="Foto 1: Vista Escritorio Calendario Disponibilidad"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </div>

              {/* FOTO 2 (TABLET) & FOTO 3 (CELULAR) SIDE BY SIDE IN NATURAL FORMAT */}
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', width: '100%', maxWidth: 900 }}>
                
                {/* FOTO 2: TABLET */}
                <div style={{ flex: '1 1 360px', maxWidth: 440, textAlign: 'center' }}>
                  <div style={{ marginBottom: 12 }}>
                    <span className="badge badge-abono" style={{ fontSize: '0.85rem', padding: '6px 14px', borderRadius: 8 }}>
                      📲 Vista Tablet (iPad)
                    </span>
                  </div>
                  <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 16px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <img
                      src="/demo-tablet.png"
                      alt="Foto 2: Vista Tablet Calendario Disponibilidad"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                </div>

                {/* FOTO 3: CELULAR */}
                <div style={{ flex: '1 1 280px', maxWidth: 340, textAlign: 'center' }}>
                  <div style={{ marginBottom: 12 }}>
                    <span className="badge badge-apartado" style={{ fontSize: '0.85rem', padding: '6px 14px', borderRadius: 8 }}>
                      📱 Vista Celular (Smartphone)
                    </span>
                  </div>
                  <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 16px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    <img
                      src="/demo-mobile.png"
                      alt="Foto 3: Vista Celular Calendario Disponibilidad"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* FUNCIONES PARA EL CLIENTE (MISMO FORMATO PRINCIPAL) */}
        <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: 20,
            color: 'white',
          }}>
            Funciones para el Cliente
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', maxWidth: 720, margin: '0 auto 48px', lineHeight: 1.6 }}>
            Diseñado para brindar una experiencia de usuario rápida, fácil e intuitiva en el apartado de fechas.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, textAlign: 'left' }}>
            {[
              { icon: Calendar, title: 'Calendario en Tiempo Real', desc: 'El cliente consulta inmediatamente qué fechas están libres, confirmadas o con solicitudes activas (👀 INTERÉS X USUARIOS).' },
              { icon: MessageCircle, title: 'Apartado Instantáneo por WhatsApp', desc: 'Genera un mensaje precargado con el nombre, fecha, horario y total calculado para enviar con un clic.' },
              { icon: Upload, title: 'Carga de Comprobantes de Depósito', desc: 'Permite subir fotos o comprobantes PDF de transferencias desde el perfil del cliente (/mi-cuenta).' },
              { icon: CheckCircle, title: 'Monitoreo Transparente de Reserva', desc: 'Refleja la validación del administrador, el anticipo acreditado y el progreso del pago en vivo.' },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,180,216,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Icon size={22} color="var(--color-primary-lighter)" />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8, color: 'white' }}>{f.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* FUNCIONES PARA EL ADMINISTRADOR (CON FOTO 4 Y FOTO 5 EN FORMATO ORIGINAL) */}
        <section style={{ padding: '80px 24px', background: '#0A192F', textAlign: 'center' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: 20,
              color: 'white',
            }}>
              Funciones para el Administrador
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1.1rem', maxWidth: 720, margin: '0 auto 48px', lineHeight: 1.6 }}>
              Control absoluto del negocio con métricas financieras en tiempo real, gestión de abonos y solicitudes por orden cronológico.
            </p>

            {/* FOTO 4 & FOTO 5 SHOWCASE */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 36, marginBottom: 48, alignItems: 'center' }}>
              
              {/* FOTO 4: DASHBOARD ADMIN */}
              <div style={{ width: '100%', maxWidth: 900, textAlign: 'center' }}>
                <div style={{ marginBottom: 12 }}>
                  <span className="badge badge-pagado" style={{ fontSize: '0.85rem', padding: '6px 14px', borderRadius: 8 }}>
                    📊 Foto 4: Panel Dashboard de Administración
                  </span>
                </div>
                <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 16px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <img
                    src="/demo-admin-dashboard.png"
                    alt="Foto 4: Panel de Administración Dashboard"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </div>

              {/* FOTO 5: CALENDARIO ADMIN */}
              <div style={{ width: '100%', maxWidth: 900, textAlign: 'center' }}>
                <div style={{ marginBottom: 12 }}>
                  <span className="badge badge-abono" style={{ fontSize: '0.85rem', padding: '6px 14px', borderRadius: 8 }}>
                    📅 Foto 5: Calendario de Gestión de Solicitudes
                  </span>
                </div>
                <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 16px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <img
                    src="/demo-admin-calendar.png"
                    alt="Foto 5: Calendario de Administración"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </div>

            </div>

            {/* ADMIN FEATURES LIST */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, textAlign: 'left' }}>
              {[
                { icon: Users, title: 'Atención Prioritaria FIFO (#1)', desc: 'Muestra el número de turno exacto (#1, #2) para atender en primer lugar al cliente que envió mensaje de WhatsApp primero.' },
                { icon: DollarSign, title: 'Abonos Acumulativos sin Pérdida', desc: 'Modal inteligente para ingresar nuevos abonos sin sobrescribir ni tener que sumar manualmente las cantidades.' },
                { icon: CreditCard, title: 'Botonera de Envíos de Pago por WA', desc: 'Envía instrucciones bancarias y datos de transferencia con un solo clic directamente a WhatsApp.' },
                { icon: Zap, title: 'Notificación Inteligente de Ocupada', desc: 'Notifica a los clientes de fechas ocupadas vía WhatsApp y libera la solicitud en el sistema automáticamente.' },
              ].map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Icon size={22} color="#F59E0B" />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8, color: 'white' }}>{f.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA FOOTER SECTION */}
        <section style={{
          padding: '80px 24px',
          background: 'linear-gradient(135deg, #005F8E, #00B4D8)',
          textAlign: 'center',
          color: 'white',
        }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Award size={48} style={{ margin: '0 auto 16px', color: '#FBBF24' }} />
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.4rem', fontWeight: 700, marginBottom: 16 }}>
              ¿Quieres este Sistema de Reservas para tu Negocio?
            </h2>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', marginBottom: 36, lineHeight: 1.6 }}>
              Personalizamos la plataforma con el nombre de tu parque, alberca o local, tus horarios, precios y datos bancarios. ¡Empieza a recibir reservaciones hoy mismo!
            </p>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#25D366',
                color: 'white',
                padding: '18px 36px',
                borderRadius: 16,
                fontWeight: 800,
                fontSize: '1.15rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              }}
            >
              <MessageCircle size={24} /> Contactar por WhatsApp: 6862770831
            </a>
          </div>
        </section>

      </main>
    </>
  )
}
