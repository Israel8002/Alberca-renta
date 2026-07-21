'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, X, MessageCircle, Check, Loader2, CreditCard, AlertTriangle, UserCheck } from 'lucide-react'
import {
  generateAdminPaymentReminderLink,
  generatePaymentConfirmedLink,
  generateSendPaymentInfoLink,
  generateDateOccupiedNotificationLink,
} from '@/lib/whatsapp'
import { updateReservationPayment, deleteReservation } from '@/services/reservations'
import toast from 'react-hot-toast'

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string; badge: string }> = {
  apartado:    { bg: '#FEF3C7', dot: '#F59E0B', label: '🟡 Solicitud / Apartado', badge: 'badge-apartado' },
  abono:       { bg: '#DBEAFE', dot: '#3B82F6', label: '🔵 Abono Validado',       badge: 'badge-abono' },
  pagado:      { bg: '#D1FAE5', dot: '#059669', label: '✅ Pagado Confirmado',    badge: 'badge-pagado' },
  cancelado:   { bg: '#F3F4F6', dot: '#9CA3AF', label: '❌ Cancelado / Ocupado',   badge: 'badge-cancelado' },
  promotion:   { bg: '#EDE9FE', dot: '#8B5CF6', label: '🎉 Promoción',            badge: 'badge-promo' },
  maintenance: { bg: '#F3F4F6', dot: '#6B7280', label: '⚙️ Mantenimiento',        badge: 'badge-maintenance' },
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

function getTimeSlotLabel(slot: string) {
  return slot === 'fin_de_semana' ? '12:00 PM – 1:00 AM' : '12:00 PM – 12:00 AM'
}

export default function AdminCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [dayData, setDayData] = useState<Record<string, any[]>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadConfig()
    loadMonthData()
  }, [currentMonth])

  async function loadConfig() {
    const { data } = await supabase.from('site_config').select('payment_info').eq('id', 'main').single()
    setPaymentInfo(data?.payment_info || '')
  }

  async function loadMonthData() {
    setLoading(true)
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')

    const [{ data: reservations }, { data: events }] = await Promise.all([
      supabase.from('reservations').select('*').gte('date', start).lte('date', end).neq('status', 'cancelado').order('created_at', { ascending: true }),
      supabase.from('events').select('*').lte('date', end).gte('end_date', start).eq('is_active', true),
    ])

    const map: Record<string, any[]> = {}

    events?.forEach(ev => {
      const d = new Date(ev.date + 'T12:00:00')
      const dEnd = new Date((ev.end_date || ev.date) + 'T12:00:00')
      let cur = new Date(d)
      while (cur <= dEnd) {
        const key = format(cur, 'yyyy-MM-dd')
        if (!map[key]) map[key] = []
        map[key].push({ ...ev, _type: 'event' })
        cur.setDate(cur.getDate() + 1)
      }
    })

    reservations?.forEach(r => {
      if (!map[r.date]) map[r.date] = []
      map[r.date].push({ ...r, _type: 'reservation' })
    })

    setDayData(map)
    setLoading(false)
  }

  function handleDayClick(dateStr: string) {
    setSelectedDate(dateStr)
    setSelectedItems(dayData[dateStr] || [])
  }

  async function handleValidatePayment(reservationId: string) {
    try {
      await updateReservationPayment(reservationId, { validated_by_admin: true, status: 'pagado' })
      toast.success('Pago validado y reservación confirmada ✅')
      loadMonthData()
      setSelectedDate(null)
    } catch { toast.error('Error al validar') }
  }

  async function handleDeleteReservation(id: string) {
    if (!confirm('¿Eliminar esta reservación?')) return
    try {
      await deleteReservation(id)
      toast.success('Reservación eliminada')
      loadMonthData()
      setSelectedDate(null)
    } catch { toast.error('Error al eliminar') }
  }

  // Links for Admin Actions
  function buildSendPaymentInfoLink(r: any) {
    return generateSendPaymentInfoLink({
      clientName: r.user_name,
      clientPhone: r.user_whatsapp,
      date: r.date,
      paymentInfo,
    })
  }

  function buildDateOccupiedLink(r: any) {
    return generateDateOccupiedNotificationLink({
      clientName: r.user_name,
      clientPhone: r.user_whatsapp,
      date: r.date,
    })
  }

  function buildConfirmedLink(r: any) {
    return generatePaymentConfirmedLink({
      clientName: r.user_name,
      clientPhone: r.user_whatsapp,
      date: r.date,
    })
  }

  // Build calendar weeks
  const weeks: Date[][] = []
  const start = startOfWeek(startOfMonth(currentMonth))
  const end = endOfWeek(endOfMonth(currentMonth))
  let d = start
  while (d <= end) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(d))
      d = new Date(d)
      d.setDate(d.getDate() + 1)
    }
    weeks.push(week)
  }

  // Check if date has a validated reservation
  const isDateValidated = selectedItems.some(i => i._type === 'reservation' && (i.validated_by_admin || i.status === 'pagado'))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif" }}>Calendario de Administración</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Gestión de solicitudes, anticipos e interés de usuarios</p>
        </div>
        <a href="/admin/reservaciones" className="btn-primary" style={{ gap: 6, padding: '10px 18px', fontSize: '0.875rem' }}>
          <Plus size={16} /> Nueva Reservación
        </a>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: val.dot, display: 'inline-block' }} />
            {val.label}
          </span>
        ))}
      </div>

      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ background: 'white', border: '1px solid rgba(0,95,142,0.2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
          <ChevronLeft size={18} />
        </button>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem', textTransform: 'capitalize', minWidth: 180, textAlign: 'center' }}>
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ background: 'white', border: '1px solid rgba(0,95,142,0.2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--color-primary)' }}>
          {DAYS.map(d => (
            <div key={d} style={{ padding: '10px 4px', textAlign: 'center', color: 'white', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          </div>
        ) : (
          weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid rgba(0,95,142,0.06)' }}>
              {week.map((day, di) => {
                const key = format(day, 'yyyy-MM-dd')
                const items = dayData[key] || []
                const inMonth = isSameMonth(day, currentMonth)
                const today = isToday(day)
                const isSelected = selectedDate === key

                const resItems = items.filter(i => i._type === 'reservation')
                const isValidated = resItems.some(r => r.validated_by_admin || r.status === 'pagado')

                return (
                  <div
                    key={di}
                    onClick={() => inMonth && handleDayClick(key)}
                    style={{
                      minHeight: 85,
                      padding: '6px',
                      background: isSelected ? 'rgba(0,180,216,0.12)' : (today ? 'rgba(0,180,216,0.05)' : 'white'),
                      opacity: inMonth ? 1 : 0.3,
                      cursor: inMonth ? 'pointer' : 'default',
                      borderLeft: isSelected ? '3px solid var(--color-primary-lighter)' : '3px solid transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{
                        display: 'inline-flex',
                        width: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        fontSize: '0.8rem',
                        fontWeight: today ? 700 : 400,
                        background: today ? 'var(--color-primary)' : 'transparent',
                        color: today ? 'white' : 'var(--color-text)',
                      }}>
                        {format(day, 'd')}
                      </span>

                      {/* Interest badge */}
                      {resItems.length > 0 && !isValidated && (
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, background: '#FEF3C7', color: '#92400E', padding: '1px 5px', borderRadius: 999 }}>
                          👀 {resItems.length}
                        </span>
                      )}
                    </div>

                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: '0.65rem',
                          padding: '2px 5px',
                          borderRadius: 4,
                          background: item._type === 'reservation'
                            ? (item.validated_by_admin ? '#D1FAE5' : '#FEF3C7')
                            : '#EDE9FE',
                          color: item._type === 'reservation'
                            ? (item.validated_by_admin ? '#065F46' : '#92400E')
                            : '#5B21B6',
                          fontWeight: 600,
                          marginBottom: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item._type === 'reservation'
                          ? `${idx + 1}. ${item.user_name} ${item.validated_by_admin ? '✅' : '⏳'}`
                          : item.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* Day Detail Panel */}
      {selectedDate && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(13,33,55,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setSelectedDate(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="animate-slide-right"
            style={{
              width: 440,
              height: '100vh',
              background: 'white',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem' }}>
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  {selectedItems.filter(i => i._type === 'reservation').length} usuario(s) interesado(s) en esta fecha (orden cronológico)
                </p>
              </div>
              <button onClick={() => setSelectedDate(null)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {selectedItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-text-muted)' }}>
                <p style={{ fontSize: '2rem', marginBottom: 8 }}>🟢</p>
                <p style={{ fontWeight: 600 }}>Fecha disponible sin solicitudes</p>
                <a href="/admin/reservaciones" className="btn-primary" style={{ display: 'inline-flex', marginTop: 16, fontSize: '0.875rem' }}>
                  <Plus size={14} /> Registrar Reservación Directa
                </a>
              </div>
            ) : (
              selectedItems.map((item, idx) => {
                const isReservation = item._type === 'reservation'
                const isValidated = item.validated_by_admin || item.status === 'pagado'

                return (
                  <div key={idx} style={{ border: isValidated ? '2px solid #10B981' : '1px solid rgba(0,95,142,0.15)', borderRadius: 14, padding: 16, marginBottom: 14, background: isValidated ? '#F0FDF4' : 'white' }}>
                    {isReservation ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#E0F7FF', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 999 }}>
                            # {idx + 1} {idx === 0 ? ' (Solicitó Primero)' : ' (Solicitud posterior)'}
                          </span>
                          <span className={`badge ${isValidated ? 'badge-pagado' : 'badge-apartado'}`}>
                            {isValidated ? '✅ Validado y Confirmado' : '⏳ Pendiente de Validación'}
                          </span>
                        </div>

                        <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>{item.user_name}</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>📱 WhatsApp: <strong>{item.user_whatsapp}</strong></p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 8 }}>
                          ⏰ Solicitó a las: {item.created_at ? new Date(item.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'Hora N/A'}
                        </p>

                        <div style={{ background: 'white', border: '1px solid rgba(0,95,142,0.08)', borderRadius: 10, padding: 10, marginBottom: 12, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total:</span><strong>{formatMXN(item.total_amount || 0)}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Anticipo sugerido:</span><strong style={{ color: '#D97706' }}>{formatMXN(item.deposit_amount || 0)}</strong></div>
                        </div>

                        {/* Proof files if uploaded */}
                        {item.proof_urls?.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#065F46', marginBottom: 4 }}>Comprobantes del cliente:</p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {item.proof_urls.map((url: string, i: number) => (
                                <a key={i} href={url} target="_blank" style={{ padding: '3px 8px', background: '#D1FAE5', borderRadius: 6, fontSize: '0.72rem', color: '#065F46', fontWeight: 600, textDecoration: 'none' }}>
                                  📎 Comprobante #{i + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ADMIN ACTIONS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Send Banking Details */}
                          <a
                            href={buildSendPaymentInfoLink(item)}
                            target="_blank"
                            className="btn-whatsapp"
                            style={{ fontSize: '0.8rem', padding: '9px 14px', justifyContent: 'center' }}
                          >
                            <CreditCard size={15} /> 🏦 Enviar Datos de Pago por WhatsApp
                          </a>

                          {/* Confirm / Validate Payment */}
                          {!isValidated && (
                            <button
                              onClick={() => handleValidatePayment(item.id)}
                              className="btn-primary"
                              style={{ fontSize: '0.8rem', padding: '9px 14px', background: 'linear-gradient(135deg, #059669, #10B981)', justifyContent: 'center' }}
                            >
                              <UserCheck size={15} /> ✅ Confirmar Pago y Quedarse con la Fecha
                            </button>
                          )}

                          {/* If Date is validated by another user, allow notifying this client */}
                          {isDateValidated && !isValidated && (
                            <a
                              href={buildDateOccupiedLink(item)}
                              target="_blank"
                              style={{ fontSize: '0.78rem', padding: '9px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 999, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}
                            >
                              <AlertTriangle size={15} /> 📢 Notificar por WA que la fecha ya fue ocupada
                            </a>
                          )}

                          <button onClick={() => handleDeleteReservation(item.id)} className="btn-danger" style={{ fontSize: '0.78rem', padding: '6px 12px', opacity: 0.8 }}>
                            Eliminar solicitud
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="badge badge-promo" style={{ marginBottom: 10 }}>🎉 {item.type}</span>
                        <p style={{ fontWeight: 700 }}>{item.title}</p>
                        {item.description && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: 4 }}>{item.description}</p>}
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
