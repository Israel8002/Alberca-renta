'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, MessageCircle, Calendar, Clock, DollarSign, Info } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { SiteConfig, CalendarEvent } from '@/types'
import { generateClientApartadoLink, generateDateInfoLink } from '@/lib/whatsapp'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  apartado:    { bg: '#FEF3C7', text: '#92400E', label: 'Apartado' },
  abono:       { bg: '#DBEAFE', text: '#1E40AF', label: 'Con Abono' },
  pagado:      { bg: '#D1FAE5', text: '#065F46', label: 'Pagado' },
  cancelado:   { bg: '#F3F4F6', text: '#6B7280', label: 'Disponible' },
  promotion:   { bg: '#EDE9FE', text: '#5B21B6', label: 'Promoción' },
  maintenance: { bg: '#F3F4F6', text: '#374151', label: 'No disponible' },
  available:   { bg: 'transparent', text: '#059669', label: 'Disponible' },
}

type DayStatus = 'available' | 'apartado' | 'abono' | 'pagado' | 'maintenance' | 'promotion' | 'cancelado'

interface DayData {
  status: DayStatus
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
  const [userName, setUserName] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const supabase = createClient()

  const loadMonthData = useCallback(async (month: Date) => {
    setLoading(true)
    const year = month.getFullYear()
    const m = month.getMonth() + 1
    const start = format(startOfMonth(month), 'yyyy-MM-dd')
    const end = format(endOfMonth(month), 'yyyy-MM-dd')

    const [{ data: reservations }, { data: events }] = await Promise.all([
      supabase.from('reservations').select('date, status').gte('date', start).lte('date', end).neq('status', 'cancelado'),
      supabase.from('events').select('date, end_date, type, title, special_price').lte('date', end).gte('end_date', start).eq('is_active', true),
    ])

    const map: Record<string, DayData> = {}

    events?.forEach(ev => {
      const d = new Date(ev.date + 'T12:00:00')
      const dEnd = new Date((ev.end_date || ev.date) + 'T12:00:00')
      let cur = new Date(d)
      while (cur <= dEnd) {
        const key = format(cur, 'yyyy-MM-dd')
        if (ev.type === 'maintenance') {
          map[key] = { status: 'maintenance', eventTitle: ev.title, eventType: ev.type }
        } else {
          map[key] = { status: 'promotion', eventTitle: ev.title, eventType: ev.type, price: ev.special_price || undefined }
        }
        cur.setDate(cur.getDate() + 1)
      }
    })

    reservations?.forEach(r => {
      map[r.date] = { status: r.status as DayStatus }
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
    return dayData[key] || { status: 'available' }
  }

  function canSelect(d: Date): boolean {
    const info = getDayInfo(d)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (d < today) return false
    if (!isSameMonth(d, currentMonth)) return false
    return info.status === 'available' || info.status === 'promotion'
  }

  function handleApartar() {
    if (!selectedDay) return
    if (!userName.trim() || !userPhone.trim()) {
      toast.error('Ingresa tu nombre y número de WhatsApp')
      return
    }
    const dayInfo = getDayInfo(selectedDay)
    const price = dayInfo.price || getMXNPrice(config, selectedDay)
    const adminPhone = config.admin_whatsapp_numbers?.[0] || adminWhatsapp

    const link = generateClientApartadoLink({
      clientName: userName,
      clientPhone: userPhone,
      adminPhone,
      date: format(selectedDay, 'yyyy-MM-dd'),
      timeSlot: getTimeSlot(selectedDay),
      totalAmount: price,
      paymentInfo: config.payment_info || '',
    })
    window.open(link, '_blank')
  }

  function handleInfo() {
    if (!selectedDay) return
    const dayInfo = getDayInfo(selectedDay)
    const price = dayInfo.price || getMXNPrice(config, selectedDay)
    const adminPhone = config.admin_whatsapp_numbers?.[0] || adminWhatsapp

    const link = generateDateInfoLink({
      adminPhone,
      date: format(selectedDay, 'yyyy-MM-dd'),
      timeSlot: getTimeSlot(selectedDay),
      price,
      eventDescription: dayInfo.eventTitle,
    })
    window.open(link, '_blank')
  }

  const selectedInfo = selectedDay ? getDayInfo(selectedDay) : null
  const selectedPrice = selectedDay ? (selectedInfo?.price || getMXNPrice(config, selectedDay)) : 0

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
          { color: '#F59E0B', label: 'Apartado' },
          { color: '#3B82F6', label: 'Con Abono' },
          { color: '#059669', label: 'Pagado' },
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
                  if (info.status === 'available') dotColor = '#10B981'
                  else if (info.status === 'apartado') dotColor = '#F59E0B'
                  else if (info.status === 'abono') dotColor = '#3B82F6'
                  else if (info.status === 'pagado') dotColor = '#059669'
                  else if (info.status === 'promotion') dotColor = '#8B5CF6'
                  else if (info.status === 'maintenance') dotColor = '#9CA3AF'
                }

                return (
                  <div
                    key={di}
                    onClick={() => selectable && setSelectedDay(d)}
                    style={{
                      minHeight: 72,
                      padding: '8px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: selectable ? 'pointer' : 'default',
                      background: isSelected ? 'rgba(0,180,216,0.15)' : (today && inMonth ? 'rgba(0,180,216,0.06)' : 'white'),
                      opacity: inMonth ? 1 : 0.3,
                      transition: 'background 0.15s',
                      position: 'relative',
                    }}
                  >
                    {/* Today ring */}
                    <span style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: today ? 700 : 400,
                      color: today ? 'white' : (inMonth ? 'var(--color-text)' : 'var(--color-text-light)'),
                      background: today ? 'var(--color-primary)' : 'transparent',
                      border: isSelected ? '2px solid var(--color-primary-lighter)' : 'none',
                      marginBottom: 4,
                    }}>
                      {dayNum}
                    </span>

                    {/* Status dot */}
                    {inMonth && info.status !== 'available' && (
                      <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: dotColor,
                      }} />
                    )}
                    {inMonth && info.status === 'available' && (
                      <span style={{ fontSize: '0.6rem', color: '#10B981', fontWeight: 600 }}>Libre</span>
                    )}
                    {inMonth && info.eventTitle && (
                      <span style={{ fontSize: '0.58rem', color: '#5B21B6', textAlign: 'center', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                  {format(selectedDay, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                </h3>
                {selectedInfo?.status === 'promotion' && selectedInfo.eventTitle && (
                  <span className="badge badge-promo">🎉 {selectedInfo.eventTitle}</span>
                )}
              </div>
              <button onClick={() => setSelectedDay(null)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* Info rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
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
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Apartado: {formatMXN(config.deposit_amount)}</p>
                  ) : null}
                </div>
              </div>
              {config.payment_info && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 16px', background: '#F0FFF4', borderRadius: 12 }}>
                  <Info size={18} color="#059669" style={{ marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 4, fontWeight: 600 }}>Información de Pago</p>
                    <p style={{ fontSize: '0.875rem', whiteSpace: 'pre-line', color: 'var(--color-text)' }}>{config.payment_info}</p>
                  </div>
                </div>
              )}
            </div>

            {/* User form */}
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 20 }}>
              <p style={{ fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}>
                📱 Para apartar, ingresa tus datos:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                <input
                  className="input-field"
                  placeholder="Tu nombre completo"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                />
                <input
                  className="input-field"
                  placeholder="Tu WhatsApp (ej: 3311234567)"
                  type="tel"
                  value={userPhone}
                  onChange={e => setUserPhone(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleApartar}
                  className="btn-whatsapp"
                  style={{ flex: 1, padding: '14px' }}
                >
                  <MessageCircle size={18} />
                  Apartar esta fecha
                </button>
                <button
                  onClick={handleInfo}
                  className="btn-secondary"
                  style={{ padding: '14px 18px' }}
                >
                  <Info size={18} />
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 8 }}>
                Al presionar el botón se abrirá WhatsApp con un mensaje pre-cargado.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
