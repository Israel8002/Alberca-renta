'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X, MessageCircle, Clock, DollarSign, Lock, CheckCircle2, Eye } from 'lucide-react'
import { format, startOfMonth, endOfMonth, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { SiteConfig } from '@/types'
import { generateClientApartadoLink } from '@/lib/whatsapp'
import { createReservation } from '@/services/reservations'
import toast from 'react-hot-toast'

type DayStatus = 'available' | 'apartado' | 'abono' | 'pagado' | 'maintenance' | 'promotion' | 'cancelado'

interface DayData {
  status: DayStatus
  validated?: boolean
  interestCount: number
  reservationId?: string
  userName?: string
  eventTitle?: string
  eventType?: string
  price?: number
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function getMXNPrice(config: Partial<SiteConfig>, date: Date): number {
  const day = date.getDay()
  if (day === 0 || day === 6) return config.weekend_price || 0
  return config.weekday_price || 0
}

function getTimeSlotLabel(date: Date): string {
  const day = date.getDay()
  return day === 0 || day === 6 ? '12:00 PM – 1:00 AM (del día siguiente)' : '12:00 PM – 12:00 AM'
}

function getTimeSlot(date: Date) {
  const day = date.getDay()
  return day === 0 || day === 6 ? 'fin_de_semana' : 'lunes_viernes'
}

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

export default function PublicCalendar({ config, adminWhatsapp }: { config: Partial<SiteConfig>; adminWhatsapp: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [dayData, setDayData] = useState<Record<string, DayData>>({})
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Auth & Profile state
  const [userProfile, setUserProfile] = useState<{ id: string; name: string; whatsapp: string } | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedAdminPhone, setSelectedAdminPhone] = useState('')

  const supabase = createClient()

  // Load auth user and profile
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, whatsapp')
          .eq('id', user.id)
          .maybeSingle()

        setUserProfile({
          id: user.id,
          name: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Cliente',
          whatsapp: profile?.whatsapp || user.user_metadata?.whatsapp || '',
        })
      } else {
        setIsLoggedIn(false)
        setUserProfile(null)
      }
    }
    checkAuth()
  }, [])

  // Admin WhatsApp numbers selection
  const adminPhones = (config.admin_whatsapp_numbers && config.admin_whatsapp_numbers.length > 0)
    ? config.admin_whatsapp_numbers
    : (adminWhatsapp ? [adminWhatsapp] : [])

  useEffect(() => {
    if (adminPhones.length > 0 && !selectedAdminPhone) {
      setSelectedAdminPhone(adminPhones[0])
    }
  }, [adminPhones, selectedAdminPhone])

  const loadMonthData = useCallback(async (month: Date) => {
    setLoading(true)
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end = format(endOfMonth(month), 'yyyy-MM-dd')

    const [{ data: reservations }, { data: events }] = await Promise.all([
      supabase.from('reservations').select('date, status, validated_by_admin').gte('date', start).lte('date', end).neq('status', 'cancelado'),
      supabase.from('events').select('date, end_date, type, title, special_price').lte('date', end).gte('end_date', start).eq('is_active', true),
    ])

    const map: Record<string, DayData> = {}

    // Process events
    events?.forEach(ev => {
      const d = new Date(ev.date + 'T12:00:00')
      const dEnd = new Date((ev.end_date || ev.date) + 'T12:00:00')
      let cur = new Date(d)
      while (cur <= dEnd) {
        const key = format(cur, 'yyyy-MM-dd')
        if (ev.type === 'maintenance') {
          map[key] = { status: 'maintenance', eventTitle: ev.title, eventType: ev.type, interestCount: 0 }
        } else {
          map[key] = { status: 'promotion', eventTitle: ev.title, eventType: ev.type, price: ev.special_price || undefined, interestCount: 0 }
        }
        cur.setDate(cur.getDate() + 1)
      }
    })

    // Process reservations & count unvalidated interests
    reservations?.forEach(r => {
      const existing = map[r.date] || { status: 'available', interestCount: 0 }
      if (r.validated_by_admin || r.status === 'pagado' || r.status === 'abono') {
        map[r.date] = { ...existing, status: r.status as DayStatus, validated: true }
      } else {
        const newCount = (existing.interestCount || 0) + 1
        if (!existing.validated && existing.status !== 'maintenance') {
          map[r.date] = { ...existing, interestCount: newCount }
        }
      }
    })

    setDayData(map)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadMonthData(currentMonth)
  }, [currentMonth, loadMonthData])

  const weeks: Date[][] = []
  const start = startOfWeek(startOfMonth(currentMonth))
  const end = endOfWeek(endOfMonth(currentMonth))
  let day = start
  while (day <= end) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(day))
      day = new Date(day)
      day.setDate(day.getDate() + 1)
    }
    weeks.push(week)
  }

  function getDayInfo(d: Date): DayData {
    const key = format(d, 'yyyy-MM-dd')
    return dayData[key] || { status: 'available', interestCount: 0 }
  }

  function canSelect(d: Date): boolean {
    const info = getDayInfo(d)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (d < today) return false
    if (!isSameMonth(d, currentMonth)) return false
    // Date is selectable if not validated/confirmed or maintenance
    if (info.status === 'maintenance') return false
    if (info.validated || info.status === 'pagado') return false
    return true
  }

  async function handleApartar() {
    if (!selectedDay) return
    if (!isLoggedIn || !userProfile) {
      toast.error('Debes iniciar sesión para apartar')
      return
    }

    setSubmitting(true)
    try {
      const dayInfo = getDayInfo(selectedDay)
      const price = dayInfo.price || getMXNPrice(config, selectedDay)
      const dateStr = format(selectedDay, 'yyyy-MM-dd')
      const timeSlot = getTimeSlot(selectedDay)

      // 1. Create reservation record in Database marked as pending validation
      await createReservation({
        user_id: userProfile.id,
        user_name: userProfile.name,
        user_whatsapp: userProfile.whatsapp,
        date: dateStr,
        time_slot: timeSlot,
        total_amount: price,
        deposit_amount: config.deposit_amount || 0,
      })

      toast.success('¡Solicitud registrada! Se abrirá WhatsApp para contactar al administrador.')

      // 2. Open WhatsApp pre-filled link to chosen Admin number
      const adminPhoneToUse = selectedAdminPhone || adminPhones[0] || ''
      const link = generateClientApartadoLink({
        clientName: userProfile.name,
        clientPhone: userProfile.whatsapp,
        adminPhone: adminPhoneToUse,
        date: dateStr,
        timeSlot,
        totalAmount: price,
        siteTitle: config.home_title,
      })

      window.open(link, '_blank')
      setSelectedDay(null)
      loadMonthData(currentMonth)
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar solicitud')
    }
    setSubmitting(false)
  }

  const selectedInfo = selectedDay ? getDayInfo(selectedDay) : null
  const selectedPrice = selectedDay ? (selectedInfo?.price || getMXNPrice(config, selectedDay)) : 0
  const dateFormatted = selectedDay ? format(selectedDay, "EEEE d 'de' MMMM, yyyy", { locale: es }) : ''

  // Preview message text
  const previewMessage = selectedDay && userProfile ? `Hola! 👋 Soy *${userProfile.name}*, me gustaría apartar una fecha en *${config.home_title || 'Sistema Reservas v1.0'}*.

📅 *Fecha:* ${dateFormatted}
⏰ *Horario:* ${getTimeSlotLabel(selectedDay)}
💰 *Costo total:* ${formatMXN(selectedPrice)}

¿Me pueden enviar los datos de pago para confirmar mi apartado?` : ''

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
      {/* Calendar Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          style={{ background: 'white', border: '1px solid rgba(0,95,142,0.2)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: 'var(--color-primary)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', textTransform: 'capitalize', color: 'var(--color-text)' }}>
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          style={{ background: 'white', border: '1px solid rgba(0,95,142,0.2)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: 'var(--color-primary)' }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
        {[
          { color: '#10B981', label: 'Disponible' },
          { color: '#F59E0B', label: 'Con Solicitud / Interés' },
          { color: '#059669', label: 'Apartado Confirmado' },
          { color: '#8B5CF6', label: 'Promoción' },
          { color: '#9CA3AF', label: 'No disponible' },
        ].map(item => (
          <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
            {item.label}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Day names */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--color-primary)' }}>
          {DAYS.map(d => (
            <div key={d} style={{ padding: '12px 4px', textAlign: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Cargando disponibilidad…
          </div>
        ) : (
          weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderTop: '1px solid rgba(0,95,142,0.06)' }}>
              {week.map((d, di) => {
                const info = getDayInfo(d)
                const inMonth = isSameMonth(d, currentMonth)
                const today = isToday(d)
                const selectable = canSelect(d)
                const isSelected = selectedDay && format(d, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')
                const dayNum = format(d, 'd')

                let dotColor = 'transparent'
                if (inMonth) {
                  if (info.validated || info.status === 'pagado') dotColor = '#059669'
                  else if (info.status === 'maintenance') dotColor = '#9CA3AF'
                  else if (info.status === 'promotion') dotColor = '#8B5CF6'
                  else if (info.interestCount > 0) dotColor = '#F59E0B'
                  else if (info.status === 'available') dotColor = '#10B981'
                }

                return (
                  <div
                    key={di}
                    onClick={() => selectable && setSelectedDay(d)}
                    style={{
                      minHeight: 74,
                      padding: '8px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: selectable ? 'pointer' : 'default',
                      background: isSelected ? 'rgba(0,180,216,0.15)' : (today && inMonth ? 'rgba(0,180,216,0.06)' : 'white'),
                      opacity: inMonth ? (selectable ? 1 : 0.45) : 0.25,
                      transition: 'background 0.15s',
                      position: 'relative',
                    }}
                  >
                    {/* Day Number */}
                    <span style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: today ? 700 : 400,
                      color: today ? 'white' : (inMonth ? 'var(--color-text)' : 'var(--color-text-light)'),
                      background: today ? 'var(--color-primary)' : 'transparent',
                      border: isSelected ? '2px solid var(--color-primary-lighter)' : 'none',
                      marginBottom: 3,
                    }}>
                      {dayNum}
                    </span>

                    {/* Status dot / Interest count label */}
                    {inMonth && !info.validated && info.interestCount > 0 && (
                      <span style={{
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        background: '#FEF3C7',
                        color: '#92400E',
                        padding: '1px 5px',
                        borderRadius: 999,
                        border: '1px solid #F59E0B',
                        textAlign: 'center',
                        lineHeight: 1.1,
                      }}>
                        👀 {info.interestCount} {info.interestCount === 1 ? 'Interesado' : 'Interesados'}
                      </span>
                    )}

                    {inMonth && info.validated && (
                      <span style={{ fontSize: '0.6rem', color: '#059669', fontWeight: 700 }}>Confirmado</span>
                    )}

                    {inMonth && !info.validated && info.interestCount === 0 && info.status === 'available' && (
                      <span style={{ fontSize: '0.6rem', color: '#10B981', fontWeight: 600 }}>Libre</span>
                    )}

                    {inMonth && info.eventTitle && (
                      <span style={{ fontSize: '0.55rem', color: '#5B21B6', textAlign: 'center', lineHeight: 1.1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {info.eventTitle}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(13,33,55,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setSelectedDay(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="animate-fade-in"
            style={{
              background: 'white',
              borderRadius: '24px 24px 0 0',
              padding: 28,
              width: '100%',
              maxWidth: 560,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, background: '#E5E7EB', borderRadius: 2, margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', textTransform: 'capitalize', marginBottom: 4 }}>
                  {dateFormatted}
                </h3>
                {selectedInfo?.status === 'promotion' && selectedInfo.eventTitle && (
                  <span className="badge badge-promo">🎉 {selectedInfo.eventTitle}</span>
                )}
                {selectedInfo && selectedInfo.interestCount > 0 && !selectedInfo.validated && (
                  <span className="badge" style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.72rem', marginTop: 4 }}>
                    👀 {selectedInfo.interestCount} usuario(s) interesado(s) en esta fecha
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedDay(null)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* Day Info Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: '#F0FAFF', borderRadius: 12 }}>
                <Clock size={18} color="var(--color-primary)" />
                <div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 2, fontWeight: 600 }}>Horario</p>
                  <p style={{ fontWeight: 600 }}>{getTimeSlotLabel(selectedDay)}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 16px', background: '#FFFBEB', borderRadius: 12 }}>
                <DollarSign size={18} color="#D97706" />
                <div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 2, fontWeight: 600 }}>Costo del día</p>
                  <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--color-primary)' }} className="font-mono-data">
                    {formatMXN(selectedPrice)}
                  </p>
                  {config.deposit_amount ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Monto de apartado / anticipo: {formatMXN(config.deposit_amount)}</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* AUTH CHECK & RESERVATION SECTION */}
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 20 }}>
              {!isLoggedIn ? (
                /* Unauthenticated View */
                <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 16, padding: 20, textAlign: 'center' }}>
                  <Lock size={28} color="#D97706" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontWeight: 700, color: '#92400E', fontSize: '1.05rem', marginBottom: 6 }}>
                    Inicia sesión para apartar esta fecha
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#B45309', marginBottom: 16 }}>
                    Para registrar tu apartado y dar seguimiento a tu fecha, debes tener una cuenta iniciada.
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <Link href="/login" className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
                      Iniciar Sesión
                    </Link>
                    <Link href="/registro" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
                      Crear Cuenta
                    </Link>
                  </div>
                </div>
              ) : (
                /* Authenticated User View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Logged in User Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12 }}>
                    <CheckCircle2 size={20} color="#059669" />
                    <div>
                      <p style={{ fontSize: '0.78rem', color: '#065F46', fontWeight: 600 }}>Solicitud a nombre de:</p>
                      <p style={{ fontWeight: 700, color: '#064E3B', fontSize: '0.9375rem' }}>
                        {userProfile?.name} {userProfile?.whatsapp ? `(📱 ${userProfile.whatsapp})` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Admin WhatsApp Number Selector */}
                  {adminPhones.length > 1 && (
                    <div>
                      <label className="label" style={{ marginBottom: 6 }}>
                        📱 Selecciona el número de WhatsApp de atención:
                      </label>
                      <select
                        className="input-field"
                        value={selectedAdminPhone}
                        onChange={e => setSelectedAdminPhone(e.target.value)}
                        style={{ fontSize: '0.9rem', fontWeight: 600 }}
                      >
                        {adminPhones.map((phone, idx) => (
                          <option key={idx} value={phone}>
                            WhatsApp Administrador #{idx + 1} (+52 {phone})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* WhatsApp Message Preview */}
                  <div>
                    <label className="label" style={{ marginBottom: 6 }}>
                      💬 Vista Previa del Mensaje a Enviar:
                    </label>
                    <div style={{
                      background: '#F0F4F0',
                      border: '1px solid #D1FAE5',
                      borderRadius: 12,
                      padding: '14px 16px',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                      fontFamily: 'Inter, sans-serif',
                      color: '#064E3B',
                    }}>
                      {previewMessage}
                    </div>
                  </div>

                  {/* Main Action Button */}
                  <button
                    onClick={handleApartar}
                    disabled={submitting}
                    className="btn-whatsapp"
                    style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <MessageCircle size={20} />
                    {submitting ? 'Registrando...' : 'Apartar esta fecha por WhatsApp'}
                  </button>

                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    Al hacer clic, tu solicitud se guardará en tu cuenta como <strong>Pendiente de Validación</strong> y se abrirá WhatsApp con el mensaje pre-cargado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
