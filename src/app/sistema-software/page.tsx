import Link from 'next/link'
import {
  Calendar, CheckCircle, ShieldCheck, Smartphone, Monitor, Tablet,
  MessageCircle, DollarSign, Upload, Users, Zap, Clock, ArrowRight, Check, Award, CreditCard
} from 'lucide-react'
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

        {/* MULTI-DEVICE MOCKUP SHOWCASE (FOTO 2 REQUISITO) */}
        <section style={{ padding: '40px 24px 80px', background: '#0A192F' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', marginBottom: 12 }}>
              📱 Accesible desde Cualquier Dispositivo
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', maxWidth: 680, margin: '0 auto 40px' }}>
              Tus clientes y administradores pueden acceder desde Computadoras, Laptops, Tablets y Smartphones sin necesidad de instalar ninguna app.
            </p>

            {/* MOCKUP CONTAINER */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,95,142,0.3), rgba(0,180,216,0.1))',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 28,
              padding: '40px 24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

                {/* LAPTOP / DESKTOP MOCKUP */}
                <div style={{
                  background: '#1E293B',
                  borderRadius: 16,
                  padding: 12,
                  width: '100%',
                  maxWidth: 520,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  border: '2px solid rgba(255,255,255,0.15)',
                }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, paddingLeft: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
                  </div>
                  <div style={{ background: '#0F172A', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <img
                      src="/alberca1.jpg"
                      alt="Vista Escritorio Sistema de Reservas"
                      style={{ width: '100%', height: 240, objectFit: 'cover' }}
                    />
                    <div style={{ padding: 16, textAlign: 'left', background: 'white', color: '#0D2137' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <strong style={{ fontSize: '0.9rem' }}>💻 Vista Escritorio Admin / Cliente</strong>
                        <span className="badge badge-pagado" style={{ fontSize: '0.65rem' }}>100% Responsivo</span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: '#475569' }}>
                        Calendario interactivo completo con desglose de solicitudes, costos, comprobantes y panel de control.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SMARTPHONE & TABLET MOCKUPS */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {/* TABLET */}
                  <div style={{
                    background: '#1E293B',
                    borderRadius: 20,
                    padding: 10,
                    width: 220,
                    border: '2px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  }}>
                    <div style={{ background: 'white', color: '#0D2137', borderRadius: 12, padding: 14, textTransform: 'none', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Tablet size={16} color="var(--color-primary)" />
                        <strong style={{ fontSize: '0.8rem' }}>Tablet View</strong>
                      </div>
                      <span className="badge badge-apartado" style={{ fontSize: '0.6rem', marginBottom: 6 }}>👀 INTERÉS 2 USUARIOS</span>
                      <p style={{ fontSize: '0.72rem', color: '#64748B' }}>Menú adaptativo tipo hamburguesa y modal fluído.</p>
                    </div>
                  </div>

                  {/* SMARTPHONE */}
                  <div style={{
                    background: '#1E293B',
                    borderRadius: 24,
                    padding: 8,
                    width: 170,
                    border: '3px solid var(--color-primary-lighter)',
                    boxShadow: '0 10px 30px rgba(0,180,216,0.3)',
                  }}>
                    <div style={{ background: '#0D2137', color: 'white', borderRadius: 16, padding: 12, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                        <Smartphone size={14} color="#25D366" />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>Mobile View</span>
                      </div>
                      <div style={{ background: '#10B981', padding: '4px 6px', borderRadius: 6, fontSize: '0.62rem', fontWeight: 700, color: 'white', textAlign: 'center', marginBottom: 6 }}>
                        WA Directo
                      </div>
                      <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)' }}>Botonera 2x2 súper accesible para dedos.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* CLIENT FEATURES (VISTA CLIENTE) */}
        <section style={{ padding: '70px 24px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textTransform: 'capitalize', textAlign: 'center', marginBottom: 48 }}>
            <span style={{ color: 'var(--color-primary-lighter)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Experiencia del Usuario</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', marginTop: 6, color: 'white' }}>
              👤 Funciones para el Cliente
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { icon: Calendar, title: 'Calendario en Tiempo Real', desc: 'El cliente ve los días libres, ocupados o con indicador de interés (👀 INTERÉS X USUARIOS).' },
              { icon: MessageCircle, title: 'Apartado Automático por WhatsApp', desc: 'Genera mensajes pre-llenados con la fecha, el horario y el total calculado sin escribir nada.' },
              { icon: Upload, title: 'Carga de Comprobantes de Pago', desc: 'El cliente sube fotos o PDF de su transferencia directamente desde su perfil (/mi-cuenta).' },
              { icon: CheckCircle, title: 'Monitoreo de Estado de Reserva', desc: 'Estado visual en tiempo real: Pendiente de Validación, Abono Validado o Confirmado al 100%.' },
            ].map((f, i) => {
              const Icon = f.icon
              return (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(0,180,216,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Icon size={24} color="var(--color-primary-lighter)" />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 8, color: 'white' }}>{f.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ADMIN FEATURES (VISTA ADMINISTRADOR) */}
        <section style={{ padding: '70px 24px', background: '#0A192F' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Control Total</span>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', marginTop: 6, color: 'white' }}>
                🔑 Funciones para el Administrador
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              {[
                { icon: Users, title: 'Orden Cronológico de Llegada (FIFO)', desc: 'Muestra quién solicitó primero la fecha (#1, #2...) para atender al cliente que mandó WhatsApp primero.' },
                { icon: DollarSign, title: 'Abonos Acumulativos sin Pérdida', desc: 'Modal inteligente para ingresar nuevos abonos sin sobrescribir ni calcular mentalmente.' },
                { icon: CreditCard, title: 'Envío de Datos Bancarios por WA', desc: 'Botonera rápida para enviar instrucciones de pago y cuentas bancarias al cliente con un clic.' },
                { icon: Zap, title: 'Notificación de Fecha Ocupada', desc: 'Avisa a otros interesados por WhatsApp que la fecha ya fue confirmada por otro usuario y libera la solicitud.' },
              ].map((f, i) => {
                const Icon = f.icon
                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                      <Icon size={24} color="#F59E0B" />
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
              Personalizamos el sistema con el nombre de tu parque, alberca o local, tus horarios, precios y datos bancarios. ¡Empieza a recibir reservaciones hoy mismo!
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
