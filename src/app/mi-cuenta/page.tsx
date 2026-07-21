'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, Loader2, Calendar, Shield, Clock, Trash2, AlertCircle } from 'lucide-react'
import { getMyReservations, uploadProofAndUpdate, deleteReservation } from '@/services/reservations'
import Navbar from '@/components/ui/Navbar'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

function ProofUploader({ reservation, onUpload }: { reservation: any; onUpload: () => void }) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (files: File[]) => {
    setUploading(true)
    for (const file of files) {
      try {
        await uploadProofAndUpdate(reservation.id, file, reservation.proof_urls || [])
        toast.success('Comprobante subido ✅')
      } catch { toast.error('Error al subir') }
    }
    setUploading(false)
    onUpload()
  }, [reservation])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
  })

  return (
    <div {...getRootProps()} style={{
      border: '2px dashed rgba(0,95,142,0.25)',
      borderRadius: 10, padding: '14px 16px',
      cursor: 'pointer', background: isDragActive ? '#E0F7FF' : '#F8FEFF',
      textAlign: 'center', transition: 'all 0.2s',
    }}>
      <input {...getInputProps()} />
      {uploading
        ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        : <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Upload size={14} />
            {isDragActive ? 'Suelta aquí' : 'Subir comprobante de pago o transferencia (imagen o PDF)'}
          </p>
      }
    </div>
  )
}

export default function MiCuentaPage() {
  const [reservations, setReservations] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [{ data: profileData }, reservs] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      getMyReservations(),
    ])

    setProfile(profileData || { name: user.user_metadata?.name || user.email })
    setReservations(reservs)
    setLoading(false)
  }

  async function handleDeleteMyReservation(id: string) {
    if (!confirm('¿Deseas eliminar esta solicitud de tu historial?')) return
    try {
      await deleteReservation(id)
      toast.success('Solicitud eliminada de tu cuenta')
      loadData()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const isAdmin = profile?.role === 'superadmin' || profile?.role === 'admin'

  return (
    <>
      <Navbar userName={profile?.name} isAdmin={isAdmin} />
      <main style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: 60 }}>
        {/* Header */}
        <div className="water-gradient" style={{ padding: '40px 24px 50px', marginBottom: '-20px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'white', border: '2px solid rgba(255,255,255,0.4)' }}>
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'white', marginBottom: 2 }}>
                  Hola, {profile?.name || 'Usuario'}! 👋
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>
                  {profile?.whatsapp ? `📱 ${profile.whatsapp}` : profile?.email || ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>

          {/* Admin Banner if superadmin/admin */}
          {isAdmin && (
            <div style={{
              background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
              border: '1px solid #F59E0B',
              borderRadius: 14,
              padding: '16px 20px',
              marginTop: 32,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              boxShadow: '0 4px 12px rgba(245,158,11,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={22} color="#D97706" />
                <div>
                  <p style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9375rem' }}>
                    Modo {profile.role === 'superadmin' ? '⭐ Superadmin' : '🔑 Admin'} Activo
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#B45309' }}>
                    Tienes acceso total al panel de administración del sistema.
                  </p>
                </div>
              </div>
              <Link href="/admin" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', flexShrink: 0 }}>
                Ir al Panel Admin →
              </Link>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: isAdmin ? 12 : 32, marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem' }}>
              Mis Reservaciones y Solicitudes
            </h2>
            <Link href="/reservar" className="btn-primary" style={{ padding: '9px 18px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} /> Nueva Reservación
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : reservations.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ fontSize: '3rem', marginBottom: 12 }}>🏊</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Aún no tienes reservaciones</p>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>¡Selecciona una fecha en el calendario y solicita tu apartado!</p>
              <Link href="/reservar" className="btn-primary">Ver disponibilidad</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reservations.map(r => {
                const isCancelled = r.status === 'cancelado'
                const isValidated = (r.validated_by_admin || r.status === 'pagado' || r.status === 'abono') && !isCancelled
                const isPending = !isValidated && !isCancelled

                const paid = isValidated ? ((r.deposit_amount || 0) + (r.abono_amount || 0)) : 0
                const pending = (r.total_amount || 0) - paid
                const pct = r.total_amount ? Math.round((paid / r.total_amount) * 100) : 0

                return (
                  <div key={r.id} className="card" style={{ padding: '20px 22px', borderLeft: isCancelled ? '4px solid #EF4444' : (isValidated ? '4px solid #10B981' : '4px solid #F59E0B') }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: 4 }}>
                          📅 {new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                          ⏰ {r.time_slot === 'fin_de_semana' ? '12:00 PM – 1:00 AM del siguiente día' : '12:00 PM – 12:00 AM'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isCancelled ? (
                          <span className="badge" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5', fontWeight: 800 }}>
                            ❌ OCUPADA POR OTRO USUARIO
                          </span>
                        ) : isPending ? (
                          <span className="badge badge-apartado" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} /> Pendiente de Validación
                          </span>
                        ) : r.status === 'abono' ? (
                          <span className="badge badge-abono">🔵 Abono Validado</span>
                        ) : (
                          <span className="badge badge-pagado">✅ Confirmado al 100%</span>
                        )}

                        {/* Delete button for user to clean their list */}
                        <button
                          onClick={() => handleDeleteMyReservation(r.id)}
                          title="Borrar esta solicitud de mi cuenta"
                          style={{
                            background: '#F3F4F6',
                            border: 'none',
                            borderRadius: 8,
                            padding: '6px 8px',
                            cursor: 'pointer',
                            color: '#6B7280',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.75rem',
                          }}
                        >
                          <Trash2 size={14} color="#EF4444" /> Borrar
                        </button>
                      </div>
                    </div>

                    {isCancelled && (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FECDD3', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                        <p style={{ fontSize: '0.82rem', color: '#991B1B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertCircle size={16} /> Esta fecha fue reservada y confirmada por otro cliente. Puedes borrar esta tarjeta con el botón "Borrar" o elegir otra fecha libre.
                        </p>
                      </div>
                    )}

                    {isPending && (
                      <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                        <p style={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 600 }}>
                          ⏳ Tu solicitud fue registrada. Para que el administrador valide tu fecha y confirme tu anticipo, realiza tu pago y sube tu comprobante abajo o envíalo por WhatsApp. El primer usuario en validar pago se queda con la fecha.
                        </p>
                      </div>
                    )}

                    {!isCancelled && (
                      <>
                        {/* Payment progress */}
                        <div style={{ background: '#F3F4F6', borderRadius: 4, height: 8, overflow: 'hidden', marginBottom: 8 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#059669' : 'var(--color-primary-lighter)', borderRadius: 4, transition: 'width 0.3s' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            Pagado/Anticipo: <strong style={{ color: isValidated ? '#059669' : '#D97706' }}>{formatMXN(paid)}</strong>
                            {!isValidated && <span style={{ fontSize: '0.7rem', color: '#B45309' }}> (Pendiente validación)</span>}
                          </span>
                          <span style={{ color: 'var(--color-text-muted)' }}>Total: <strong>{formatMXN(r.total_amount || 0)}</strong></span>
                          {pending > 0 && <span style={{ color: '#EF4444' }}>Pendiente: <strong>{formatMXN(pending)}</strong></span>}
                        </div>

                        {/* Proof files */}
                        {r.proof_urls?.length > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6 }}>Comprobantes subidos:</p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {r.proof_urls.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', background: '#D1FAE5', borderRadius: 6, fontSize: '0.72rem', color: '#065F46', fontWeight: 600, textDecoration: 'none' }}>
                                  📎 Comprobante {i + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Upload proof */}
                        {r.status !== 'pagado' && (
                          <ProofUploader reservation={r} onUpload={loadData} />
                        )}

                        {r.status === 'pagado' && (
                          <div style={{ background: '#D1FAE5', borderRadius: 10, padding: '10px 14px', textAlign: 'center', marginTop: 8 }}>
                            <p style={{ color: '#065F46', fontWeight: 700 }}>🎉 ¡Pago verificado y confirmado! Te esperamos en la alberca.</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}
