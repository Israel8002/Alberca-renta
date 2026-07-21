import { TimeSlot, ReservationStatus } from '@/types'

const ADMIN_NUMBERS = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP?.split(',') || []

function cleanPhone(phone: string): string {
  // Remove spaces, dashes, parentheses; ensure it starts with country code
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '')
  // If it starts with 52 (Mexico) already, keep it; otherwise add 52
  if (cleaned.startsWith('52') && cleaned.length === 12) return cleaned
  if (cleaned.length === 10) return `52${cleaned}`
  return cleaned
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getTimeSlotLabel(slot: TimeSlot): string {
  return slot === 'lunes_viernes'
    ? '12:00 PM – 12:00 AM'
    : '12:00 PM – 1:00 AM (del día siguiente)'
}

function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

// =============================================
// 1. Cliente quiere apartar una fecha
// =============================================
export function generateClientApartadoLink(params: {
  clientName: string
  clientPhone: string
  adminPhone: string
  date: string
  timeSlot: TimeSlot
  totalAmount: number
  paymentInfo: string
}): string {
  const message = `Hola! 👋 Soy *${params.clientName}*, me gustaría apartar la alberca.

📅 *Fecha:* ${formatDate(params.date)}
⏰ *Horario:* ${getTimeSlotLabel(params.timeSlot)}
💰 *Costo total:* ${formatMXN(params.totalAmount)}

He revisado la información de pago.
¿Pueden confirmar disponibilidad?`

  const phone = cleanPhone(params.adminPhone)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

// =============================================
// 2. Admin notifica pago pendiente al cliente
// =============================================
export function generateAdminPaymentReminderLink(params: {
  clientName: string
  clientPhone: string
  date: string
  timeSlot: TimeSlot
  status: ReservationStatus
  totalAmount: number
  abonoAmount: number
  depositAmount: number
  paymentInfo: string
}): string {
  const paid = params.depositAmount + params.abonoAmount
  const pending = params.totalAmount - paid

  const statusLabel =
    params.status === 'apartado'
      ? 'APARTADO ⏳'
      : params.status === 'abono'
      ? 'ABONO PARCIAL 🔵'
      : 'PENDIENTE DE LIQUIDACIÓN 🟡'

  const message = `Hola *${params.clientName}* 👋
Te recordamos tu reservación en *Alberca Santo Niño*:

📅 *Fecha:* ${formatDate(params.date)}
⏰ *Horario:* ${getTimeSlotLabel(params.timeSlot)}
💳 *Estatus:* ${statusLabel}
💰 *Total:* ${formatMXN(params.totalAmount)}
   ✅ Pagado: ${formatMXN(paid)}
   ⏳ Pendiente: ${formatMXN(pending)}

Por favor realiza tu pago:
${params.paymentInfo}

¡Gracias! 🏊‍♂️`

  const phone = cleanPhone(params.clientPhone)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

// =============================================
// 3. Admin confirma pago completado
// =============================================
export function generatePaymentConfirmedLink(params: {
  clientName: string
  clientPhone: string
  date: string
}): string {
  const message = `¡Hola *${params.clientName}*! ✅
Tu pago ha sido confirmado.

📅 *Reservación:* ${formatDate(params.date)}
💰 *Estatus:* ¡PAGADO AL 100%! 🎉

¡Te esperamos en *Alberca Santo Niño*! 🏊‍♂️`

  const phone = cleanPhone(params.clientPhone)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

// =============================================
// 4. Notificación a admins cuando cliente solicita apartado
// =============================================
export function generateAdminNotificationLinks(params: {
  clientName: string
  clientPhone: string
  date: string
  timeSlot: TimeSlot
  totalAmount: number
  adminPhones: string[]
}): string[] {
  const message = `🔔 *Nueva solicitud de apartado*

👤 *Cliente:* ${params.clientName}
📱 *WhatsApp:* ${params.clientPhone}
📅 *Fecha solicitada:* ${formatDate(params.date)}
⏰ *Horario:* ${getTimeSlotLabel(params.timeSlot)}
💰 *Monto:* ${formatMXN(params.totalAmount)}

Revisa el sistema para confirmar.`

  return params.adminPhones.map((phone) => {
    const cleaned = cleanPhone(phone)
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
  })
}

// =============================================
// 5. Info de fecha para el cliente (al ver detalle)
// =============================================
export function generateDateInfoLink(params: {
  adminPhone: string
  date: string
  timeSlot: TimeSlot
  price: number
  eventDescription?: string
}): string {
  const eventPart = params.eventDescription
    ? `\n🎉 *Evento especial:* ${params.eventDescription}`
    : ''

  const message = `Hola! 👋 Me interesa información sobre la disponibilidad:

📅 *Fecha:* ${formatDate(params.date)}
⏰ *Horario:* ${getTimeSlotLabel(params.timeSlot)}
💰 *Costo:* ${formatMXN(params.price)}${eventPart}

¿Está disponible? ¿Cuáles son los siguientes pasos?`

  const phone = cleanPhone(params.adminPhone)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
