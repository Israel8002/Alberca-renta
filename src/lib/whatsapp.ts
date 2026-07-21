import { TimeSlot, ReservationStatus } from '@/types'

function cleanPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '')
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

// 1. Cliente quiere apartar una fecha
export function generateClientApartadoLink(params: {
  clientName: string
  clientPhone: string
  adminPhone: string
  date: string
  timeSlot: TimeSlot
  totalAmount: number
}): string {
  const message = `Hola! 👋 Soy *${params.clientName}*, me gustaría apartar la alberca Santo Niño.

📅 *Fecha:* ${formatDate(params.date)}
⏰ *Horario:* ${getTimeSlotLabel(params.timeSlot)}
💰 *Costo total:* ${formatMXN(params.totalAmount)}

¿Me pueden enviar los datos de pago para confirmar mi apartado?`

  const phone = cleanPhone(params.adminPhone)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

// 2. Admin envía información de pago (datos bancarios) al cliente
export function generateSendPaymentInfoLink(params: {
  clientName: string
  clientPhone: string
  date: string
  paymentInfo: string
}): string {
  const message = `Hola *${params.clientName}*! 👋
Te compartimos la información de pago para apartar tu fecha en *Alberca Santo Niño*:

📅 *Fecha solicitada:* ${formatDate(params.date)}

🏦 *Instrucciones de Pago:*
${params.paymentInfo}

Por favor envíanos tu comprobante por aquí una vez realizado el pago para confirmar tu fecha. ¡Gracias! 🏊‍♂️`

  const phone = cleanPhone(params.clientPhone)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

// 3. Admin notifica estado detallado de pago (Apartado, Abono, Total y Pendiente)
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
  const paid = (params.depositAmount || 0) + (params.abonoAmount || 0)
  const pending = Math.max(0, (params.totalAmount || 0) - paid)

  const statusLabel =
    pending === 0
      ? 'PAGADO Y CONFIRMADO 🟢'
      : params.abonoAmount > 0
      ? 'ABONO REGISTRADO 🔵'
      : 'APARTADO PENDIENTE DE LIQUIDAR 🟡'

  const message = `Hola *${params.clientName}* 👋
Te compartimos el desglose detallado de pago de tu reservación en *Alberca Santo Niño*:

📅 *Fecha:* ${formatDate(params.date)}
⏰ *Horario:* ${getTimeSlotLabel(params.timeSlot)}
💳 *Estatus:* ${statusLabel}

💰 *DESGLOSE DE MONTO:*
   • Total del evento: ${formatMXN(params.totalAmount)}
   • Apartado / Anticipo: ${formatMXN(params.depositAmount)}
   • Abonos adicionales: ${formatMXN(params.abonoAmount)}
   ✅ Total abonado/pagado: ${formatMXN(paid)}
   ⏳ *PENDIENTE DE PAGO:* ${formatMXN(pending)}

${pending > 0 ? `🏦 *DATOS DE PAGO:*
${params.paymentInfo}

Por favor envíanos tu comprobante al realizar tu pago para actualizar tu saldo. ¡Gracias! 🏊‍♂️` : '¡Tu reservación se encuentra liquidada al 100%! 🎉'}`

  const phone = cleanPhone(params.clientPhone)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

// 4. Admin confirma pago completado
export function generatePaymentConfirmedLink(params: {
  clientName: string
  clientPhone: string
  date: string
}): string {
  const message = `¡Hola *${params.clientName}*! ✅
Tu pago ha sido confirmado y validado por el administrador.

📅 *Reservación:* ${formatDate(params.date)}
💰 *Estatus:* ¡PAGADO Y CONFIRMADO AL 100%! 🎉

¡Tu fecha ha quedado oficialmente reservada! Te esperamos en *Alberca Santo Niño*. 🏊‍♂️`

  const phone = cleanPhone(params.clientPhone)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

// 5. Admin notifica a otros clientes interesados que la fecha ya fue apartada
export function generateDateOccupiedNotificationLink(params: {
  clientName: string
  clientPhone: string
  date: string
}): string {
  const message = `Hola *${params.clientName}* 👋
Te informamos que la fecha *${formatDate(params.date)}* en *Alberca Santo Niño* ya fue apartada y confirmada por otro cliente. 🏊‍♂️

¿Te gustaría consultar la disponibilidad para otra fecha en nuestro calendario?
Visita nuestro sitio: https://alberca-renta.vercel.app/reservar`

  const phone = cleanPhone(params.clientPhone)
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

// 6. Info de fecha para el cliente
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
