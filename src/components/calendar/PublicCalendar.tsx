'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X, MessageCircle, Clock, DollarSign, Info, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, isSameMonth, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { SiteConfig } from '@/types'
import { generateClientApartadoLink } from '@/lib/whatsapp'
import toast from 'react-hot-toast'

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

  // Auth & Profile state
  const [userProfile, setUserProfile] = useState<{ name: string; whatsapp: string } | null>(null)
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
          .select('name, whatsapp')
          .eq('id', user.id)
          .maybeSingle()

        setUserProfile({
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
    if (!isLoggedIn || !userProfile) {
      toast.error('Debes iniciar sesión para apartar')
      return
    }

    const dayInfo = getDayInfo(selectedDay)
    const price = dayInfo.price || getMXNPrice(config, selectedDay)
    const adminPhoneToUse = selectedAdminPhone || adminPhones[0] || ''

    if (!adminPhoneToUse) {
      toast.error('No se ha configurado un número de administrador')
      return
    }

    const link = generateClientApartadoLink({
      clientName: userProfile.name,
      clientPhone: userProfile.whatsapp,
      adminPhone: adminPhoneToUse,
      date: format(selectedDay, 'yyyy-MM-dd'),
      timeSlot: getTimeSlot(selectedDay),
      totalAmount: price,
      paymentInfo: config.payment_info || '',
    })
    window.open(link, '_blank')
  }

  const selectedInfo = selectedDay ? getDayInfo(selectedDay) : null
  const selectedPrice = selectedDay ? (selectedInfo?.price || getMXNPrice(config, selectedDay)) : 0
  const dateFormatted = selectedDay ? format(selectedDay, "EEEE d 'de' MMMM, yyyy", { locale: es }) : ''

  // Preview message text
  const previewMessage = selectedDay && userProfile ? `Hola! 👋 Soy *${userProfile.name}*, me gustaría apartar la alberca.

📅 *Fecha:* ${dateFormatted}
⏰ *Horario:* ${getTimeSlotLabel(selectedDay)}
💰 *Costo total:* ${formatMXN(selectedPrice)}

He revisado la información. ¿Pueden confirmar disponibilidad?` : ''

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
                  {dateFormatted}
                </h3>
                {selectedInfo?.status === 'promotion' && selectedInfo.eventTitle && (
                  <span className="badge badge-promo">🎉 {selectedInfo.eventTitle}</span>
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
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Monto de apartado: {formatMXN(config.deposit_amount)}</p>
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
                    Para seguridad de tus datos y agilizar tu apartado, debes contar con un usuario registrado.
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
                      <p style={{ fontSize: '0.78rem', color: '#065F46', fontWeight: 600 }}>Usuario registrado</p>
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
                    className="btn-whatsapp"
                    style={{ width: '100%', padding: '14px', fontSize: '1rem', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <MessageCircle size={20} />
                    Apartar esta fecha por WhatsApp
                  </button>

                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    Al presionar se abrirá la app de WhatsApp con el mensaje pre-cargado enviado al administrador.
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
