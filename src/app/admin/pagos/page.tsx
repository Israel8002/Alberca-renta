'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Check, Eye, X, AlertCircle, Loader2, PlusCircle, CreditCard, ImageIcon } from 'lucide-react'
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

  // Adding Abono modal
  const [abonoModalRes, setAbonoModalRes] = useState<any | null>(null)
  const [abonoInput, setAbonoInput] = useState<string>('')
  const [savingAbono, setSavingAbono] = useState(false)
  const [viewingProofs, setViewingProofs] = useState<string[] | null>(null)

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
    const link = generateAdminPaymentReminderLink({
      clientName: r.user_name,
      clientPhone: r.user_whatsapp,
      date: r.date,
      timeSlot: r.time_slot,
      status: r.status,
      totalAmount: r.total_amount || 0,
      abonoAmount: r.abono_amount || 0,
      depositAmount: r.deposit_amount || 0,
      paymentInfo,
    })

    const paid = (r.deposit_amount || 0) + (r.abono_amount || 0)
    const pending = Math.max(0, (r.total_amount || 0) - paid)
    const dateStr = new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const msg = `Hola *${r.user_name}* 👋\nTe compartimos el desglose detallado de pago de tu reservación en *Alberca Santo Niño*:\n\n📅 *Fecha:* ${dateStr}\n⏰ *Horario:* ${getTimeSlotLabel(r.time_slot)}\n\n💰 *DESGLOSE DE MONTO:*\n   • Total del evento: ${formatMXN(r.total_amount || 0)}\n   • Apartado / Anticipo: ${formatMXN(r.deposit_amount || 0)}\n   • Abonos registrados: ${formatMXN(r.abono_amount || 0)}\n   ✅ Total pagado/abonado: ${formatMXN(paid)}\n   ⏳ *PENDIENTE DE PAGO:* ${formatMXN(pending)}\n\n🏦 *DATOS DE PAGO:*\n${paymentInfo}\n\nPor favor envíanos tu comprobante al realizar tu pago. ¡Gracias! 🏊‍♂️`

    setPreviewMsg(msg)
    setPreviewLink(link)
    setSelectedRes(r)
  }

  async function handleMarkPaid(r: any) {
    try {
      await updateReservationPayment(r.id, { status: 'pagado', validated_by_admin: true })
      toast.success('Reservación marcada como totalmente pagada ✅')
      const confirmLink = generatePaymentConfirmedLink({ clientName: r.user_name, clientPhone: r.user_whatsapp, date: r.date })
      window.open(confirmLink, '_blank')
      loadData()
      setSelectedRes(null)
    } catch { toast.error('Error al actualizar') }
  }

  async function handleAddAbonoSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!abonoModalRes) return
    setSavingAbono(true)
    try {
      const addedAbono = parseFloat(abonoInput || '0')
      const currentAbono = abonoModalRes.abono_amount || 0
      const newAbono = currentAbono + addedAbono
      const deposit = abonoModalRes.deposit_amount || 0
      const total = abonoModalRes.total_amount || 0
      const newPaid = deposit + newAbono

      const isFullyPaid = newPaid >= total && total > 0
      const newStatus = isFullyPaid ? 'pagado' : 'abono'

      await updateReservationPayment(abonoModalRes.id, {
        abono_amount: newAbono,
        status: newStatus as any,
        validated_by_admin: true,
      })

      if (isFullyPaid) {
        toast.success('¡Monto total liquidado! Reservación marcada como Pagada ✅')
        const confirmLink = generatePaymentConfirmedLink({ clientName: abonoModalRes.user_name, clientPhone: abonoModalRes.user_whatsapp, date: abonoModalRes.date })
        window.open(confirmLink, '_blank')
      } else {
        toast.success(`Abono de ${formatMXN(addedAbono)} registrado exitosamente ✅`)
      }

      setAbonoModalRes(null)
      setAbonoInput('')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar abono')
    }
    setSavingAbono(false)
  }

  const filtered = reservations.filter(r => filterStatus === 'all' || r.status === filterStatus)

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>Pagos Pendientes y Abonos</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {reservations.length} reservación(es) con saldo pendiente de liquidar
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
          <p style={{ color: 'var(--color-text-muted)' }}>No hay reservaciones con pagos pendientes</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(r => {
            const deposit = r.deposit_amount || 0
            const abonos = r.abono_amount || 0
            const paid = deposit + abonos
            const total = r.total_amount || 0
            const pending = Math.max(0, total - paid)
            const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0
            const isFullyPaid = paid >= total && total > 0

            return (
              <div key={r.id} className="card" style={{ padding: '20px 24px', borderLeft: isFullyPaid ? '4px solid #10B981' : '4px solid #F59E0B' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>{r.user_name}</p>
                      <span className={`badge badge-${r.status}`}>{r.status === 'apartado' ? '🟡 Apartado' : '🔵 Con Abono'}</span>
                      {r.proof_urls?.length > 0 && (
                        <button
                          onClick={() => setViewingProofs(r.proof_urls)}
                          style={{ padding: '3px 8px', background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 6, fontSize: '0.72rem', color: '#065F46', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <ImageIcon size={12} /> {r.proof_urls.length} comprobante(s)
                        </button>
                      )}
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem', marginBottom: 8 }}>
                      📱 WhatsApp: <strong>{r.user_whatsapp}</strong> · 📅 <strong>{new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </p>

                    {/* DETAILED MONTO BREAKDOWN */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', maxWidth: 460, marginBottom: 8, fontSize: '0.82rem', fontFamily: 'monospace' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Evento:</span><strong>{formatMXN(total)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}><span>Anticipo / Apartado:</span><strong>{formatMXN(deposit)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3B82F6' }}><span>Abonos Adicionales:</span><strong>{formatMXN(abonos)}</strong></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: 4, marginTop: 4 }}>
                        <span>Total Abonado ({pct}%):</span><strong style={{ color: '#059669' }}>{formatMXN(paid)}</strong>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden', maxWidth: 460 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: isFullyPaid ? '#059669' : '#3B82F6', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 2, fontWeight: 600 }}>Pendiente por Liquidar</p>
                    <p style={{ fontWeight: 800, fontSize: '1.4rem', color: pending > 0 ? '#EF4444' : '#059669', fontFamily: 'monospace' }}>
                      {formatMXN(pending)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Button 1: Send Reminder with Detailed Breakdown */}
                  <button
                    onClick={() => buildPreview(r)}
                    className="btn-whatsapp"
                    style={{ fontSize: '0.8rem', padding: '9px 14px' }}
                  >
                    <MessageCircle size={15} /> Recordar pago (WhatsApp)
                  </button>

                  {/* Button 2: Add Abono */}
                  <button
                    onClick={() => { setAbonoModalRes(r); setAbonoInput('') }}
                    style={{ padding: '9px 14px', background: '#E0F7FF', border: '1px solid #00B4D8', borderRadius: 999, cursor: 'pointer', fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <PlusCircle size={15} /> Registrar Abono
                  </button>

                  {/* Button 3: Mark Paid + Send Confirmation (Auto-enabled when total reached or clickable) */}
                  <button
                    onClick={() => handleMarkPaid(r)}
                    disabled={!isFullyPaid && pending > 0}
                    style={{
                      padding: '9px 16px',
                      background: isFullyPaid ? 'linear-gradient(135deg, #059669, #10B981)' : '#E5E7EB',
                      border: 'none',
                      borderRadius: 999,
                      cursor: (isFullyPaid || pending === 0) ? 'pointer' : 'not-allowed',
                      fontSize: '0.8rem',
                      color: isFullyPaid ? 'white' : '#9CA3AF',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: isFullyPaid ? '0 4px 12px rgba(5,150,105,0.25)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Check size={15} /> Marcar Pagado + Enviar confirmación
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* REGISTER ABONO MODAL */}
      {abonoModalRes && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(13,33,55,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-in" style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem' }}>Registrar Nuevo Abono</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Cliente: <strong>{abonoModalRes.user_name}</strong></p>
              </div>
              <button onClick={() => setAbonoModalRes(null)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: '0.85rem', fontFamily: 'monospace' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Evento:</span><strong>{formatMXN(abonoModalRes.total_amount || 0)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}><span>Ya Pagado:</span><strong>{formatMXN((abonoModalRes.deposit_amount || 0) + (abonoModalRes.abono_amount || 0))}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444' }}><span>Pendiente Actual:</span><strong>{formatMXN(Math.max(0, (abonoModalRes.total_amount || 0) - (abonoModalRes.deposit_amount || 0) - (abonoModalRes.abono_amount || 0)))}</strong></div>
            </div>

            <form onSubmit={handleAddAbonoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Monto del nuevo abono (MXN) *</label>
                <input
                  className="input-field"
                  type="number"
                  step="0.01"
                  placeholder="Ej. 1000.00"
                  value={abonoInput}
                  onChange={e => setAbonoInput(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="btn-primary" disabled={savingAbono} style={{ padding: '13px', borderRadius: 12, fontWeight: 700 }}>
                {savingAbono ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : '✅ Registrar Abono'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PROOF IMAGES MODAL */}
      {viewingProofs && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(13,33,55,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(6px)' }} onClick={() => setViewingProofs(null)}>
          <div onClick={e => e.stopPropagation()} className="animate-fade-in" style={{ background: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem' }}>Comprobantes de Pago Subidos</h3>
              <button onClick={() => setViewingProofs(null)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {viewingProofs.map((url, i) => (
                <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', textAlign: 'center' }}>
                  <img src={url} alt={`Comprobante ${i + 1}`} style={{ width: '100%', maxHeight: 400, objectFit: 'contain', background: '#F9FAFB' }} />
                  <div style={{ padding: 10, background: '#F3F4F6' }}>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                      🔗 Abrir en tamaño completo
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Message Preview Modal */}
      {selectedRes && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(13,33,55,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedRes(null)}
        >
          <div onClick={e => e.stopPropagation()} className="animate-fade-in" style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem' }}>Vista Previa de Recordatorio de Pago</h3>
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
              <a href={previewLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp" style={{ flex: 1, justifyContent: 'center' }}>
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
