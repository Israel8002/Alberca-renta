'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Check, Eye, X, AlertCircle, Loader2 } from 'lucide-react'
import { generateAdminPaymentReminderLink, generatePaymentConfirmedLink } from '@/lib/whatsapp'
import { updateReservationPayment } from '@/services/reservations'
import toast from 'react-hot-toast'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

function getTimeSlotLabel(slot: string) {
  return slot === 'fin_de_semana' ? '12:00 PM – 1:00 AM' : '12:00 PM – 12:00 AM'
}

export default function PagosPage() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentInfo, setPaymentInfo] = useState('')
  const [selectedRes, setSelectedRes] = useState<any | null>(null)
  const [previewMsg, setPreviewMsg] = useState('')
  const [previewLink, setPreviewLink] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'apartado' | 'abono'>('all')
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: resData }, { data: configData }] = await Promise.all([
      supabase.from('reservations').select('*').in('status', ['apartado', 'abono']).order('date', { ascending: true }),
      supabase.from('site_config').select('payment_info').eq('id', 'main').single(),
    ])
    setReservations(resData || [])
    setPaymentInfo(configData?.payment_info || '')
    setLoading(false)
  }

  function buildPreview(r: any) {
    const paid = (r.deposit_amount || 0) + (r.abono_amount || 0)
    const pending = (r.total_amount || 0) - paid
    const statusLabel = r.status === 'apartado' ? 'APARTADO ⏳' : 'ABONO PARCIAL 🔵'
    const dateStr = new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const msg = `Hola *${r.user_name}* 👋\nTe recordamos tu reservación en *Alberca Santo Niño*:\n\n📅 *Fecha:* ${dateStr}\n⏰ *Horario:* ${getTimeSlotLabel(r.time_slot)}\n💳 *Estatus:* ${statusLabel}\n💰 *Total:* ${formatMXN(r.total_amount || 0)}\n   ✅ Pagado: ${formatMXN(paid)}\n   ⏳ Pendiente: ${formatMXN(pending)}\n\nPor favor realiza tu pago:\n${paymentInfo}\n\n¡Gracias! 🏊‍♂️`

    setPreviewMsg(msg)
    setPreviewLink(generateAdminPaymentReminderLink({
      clientName: r.user_name,
      clientPhone: r.user_whatsapp,
      date: r.date,
      timeSlot: r.time_slot,
      status: r.status,
      totalAmount: r.total_amount || 0,
      abonoAmount: r.abono_amount || 0,
      depositAmount: r.deposit_amount || 0,
      paymentInfo,
    }))
    setSelectedRes(r)
  }

  async function handleMarkPaid(r: any) {
    try {
      await updateReservationPayment(r.id, { status: 'pagado', validated_by_admin: true })
      toast.success('Reservación marcada como pagada ✅')
      const confirmLink = generatePaymentConfirmedLink({ clientName: r.user_name, clientPhone: r.user_whatsapp, date: r.date })
      window.open(confirmLink, '_blank')
      loadData()
      setSelectedRes(null)
    } catch { toast.error('Error al actualizar') }
  }

  async function handleUpdateAbono(r: any, amount: number) {
    try {
      await updateReservationPayment(r.id, { abono_amount: amount, status: 'abono' })
      toast.success('Abono actualizado')
      loadData()
      setSelectedRes(null)
    } catch { toast.error('Error al actualizar') }
  }

  const filtered = reservations.filter(r => filterStatus === 'all' || r.status === filterStatus)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>Pagos Pendientes</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {reservations.length} reservaciones con pago incompleto
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ key: 'all', label: 'Todos' }, { key: 'apartado', label: '🟡 Apartado' }, { key: 'abono', label: '🔵 Con Abono' }].map(f => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key as any)}
            style={{
              padding: '7px 16px', borderRadius: 999,
              border: filterStatus === f.key ? 'none' : '1px solid rgba(0,95,142,0.2)',
              background: filterStatus === f.key ? 'var(--color-primary)' : 'white',
              color: filterStatus === f.key ? 'white' : 'var(--color-text-muted)',
              fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
            }}
          >{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#059669' }}>
          <p style={{ fontSize: '3rem' }}>✅</p>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>¡Todo al corriente!</p>
          <p style={{ color: 'var(--color-text-muted)' }}>No hay pagos pendientes</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(r => {
            const paid = (r.deposit_amount || 0) + (r.abono_amount || 0)
            const pending = (r.total_amount || 0) - paid
            const pct = r.total_amount ? Math.round((paid / r.total_amount) * 100) : 0

            return (
              <div key={r.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontWeight: 700, fontSize: '1rem' }}>{r.user_name}</p>
                      <span className={`badge badge-${r.status}`}>{r.status === 'apartado' ? '🟡 Apartado' : '🔵 Abono'}</span>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>
                      📱 {r.user_whatsapp} · 📅 {new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    {/* Progress bar */}
                    <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden', width: 200, marginTop: 8 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#059669' : '#3B82F6', borderRadius: 3, transition: 'width 0.3s' }} />
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
                      {formatMXN(paid)} de {formatMXN(r.total_amount || 0)} ({pct}%)
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 2 }}>Pendiente</p>
                    <p style={{ fontWeight: 800, fontSize: '1.25rem', color: '#EF4444', fontFamily: 'monospace' }}>{formatMXN(pending)}</p>
                  </div>
                </div>

                {/* Proof files */}
                {r.proof_urls?.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {r.proof_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" style={{ padding: '4px 10px', background: '#D1FAE5', borderRadius: 6, fontSize: '0.75rem', color: '#065F46', fontWeight: 600, textDecoration: 'none' }}>
                        📎 Comprobante {i + 1}
                      </a>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => buildPreview(r)}
                    className="btn-whatsapp"
                    style={{ fontSize: '0.78rem', padding: '8px 14px' }}
                  >
                    <MessageCircle size={14} /> Recordar pago
                  </button>
                  <button
                    onClick={() => handleMarkPaid(r)}
                    style={{ padding: '8px 14px', background: '#D1FAE5', border: 'none', borderRadius: 999, cursor: 'pointer', fontSize: '0.78rem', color: '#065F46', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Check size={14} /> Marcar pagado + Enviar confirmación
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Message Preview Modal */}
      {selectedRes && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(13,33,55,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedRes(null)}
        >
          <div onClick={e => e.stopPropagation()} className="animate-fade-in" style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem' }}>Vista Previa del Mensaje</h3>
              <button onClick={() => setSelectedRes(null)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
              Para: <strong>{selectedRes.user_name}</strong> · 📱 {selectedRes.user_whatsapp}
            </p>
            <div style={{ background: '#F0F4F0', borderRadius: 12, padding: 16, marginBottom: 20, fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', lineHeight: 1.8, whiteSpace: 'pre-line', border: '1px solid #D1FAE5' }}>
              {previewMsg}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a href={previewLink} target="_blank" className="btn-whatsapp" style={{ flex: 1, justifyContent: 'center' }}>
                <MessageCircle size={16} /> Enviar por WhatsApp
              </a>
              <button onClick={() => setSelectedRes(null)} className="btn-secondary" style={{ padding: '12px 16px' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
