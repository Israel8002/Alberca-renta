import { formatCurrency, formatDate } from "@/lib/utils";

export interface WhatsAppReservation {
  clientName: string;
  clientPhone: string;
  date: Date | string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  deposit: number;
  balance: number;
  businessName?: string;
  address?: string;
}

/** Normalizes a phone to Mexican wa.me format: 521 + 10 digits. */
export function normalizeMxPhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  // Strip a leading 52 / 521 if the admin already typed it.
  let local = digits;
  if (local.startsWith("521")) local = local.slice(3);
  else if (local.startsWith("52")) local = local.slice(2);
  local = local.slice(-10);
  return `521${local}`;
}

export function buildWhatsAppMessage(r: WhatsAppReservation): string {
  const lines = [
    `Hola ${r.clientName} 👋`,
    `Tu reservación para la alberca ha sido registrada.`,
    ``,
    `📅 Fecha: ${formatDate(r.date)}`,
    `🕒 Horario: ${r.checkIn} a ${r.checkOut}`,
    `👥 Personas: ${r.guests}`,
    `💵 Total: ${formatCurrency(r.total)}`,
    `💰 Anticipo: ${formatCurrency(r.deposit)}`,
    `📌 Saldo pendiente: ${formatCurrency(r.balance)}`,
  ];
  if (r.address) lines.push(`📍 Dirección: ${r.address}`);
  lines.push(``, `Gracias por tu preferencia.`);
  if (r.businessName) lines.push(r.businessName);
  return lines.join("\n");
}

export function buildWhatsAppUrl(r: WhatsAppReservation): string {
  const phone = normalizeMxPhone(r.clientPhone);
  const text = encodeURIComponent(buildWhatsAppMessage(r));
  return `https://wa.me/${phone}?text=${text}`;
}
