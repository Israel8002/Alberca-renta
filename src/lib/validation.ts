import { z } from "zod";

export const clientSchema = z.object({
  fullName: z.string().min(2, "El nombre es obligatorio"),
  phone: z.string().min(7, "El teléfono es obligatorio"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  guests: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional().or(z.literal("")),
});

export const reservationStatus = z.enum([
  "DISPONIBLE",
  "APARTADO",
  "LIQUIDADO",
  "CANCELADO",
  "MANTENIMIENTO",
]);

export const reservationSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  checkIn: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  checkOut: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  guests: z.coerce.number().int().min(0).default(0),
  price: z.coerce.number().min(0).default(0),
  deposit: z.coerce.number().min(0).default(0),
  status: reservationStatus.default("APARTADO"),
  notes: z.string().optional().or(z.literal("")),
});

export const paymentSchema = z.object({
  reservationId: z.string().min(1),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  type: z.enum(["ANTICIPO", "PARCIAL", "FINAL"]).default("PARCIAL"),
  method: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export const blockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  type: z.enum(["BLOCKED", "MAINTENANCE"]).default("BLOCKED"),
  reason: z.string().optional().or(z.literal("")),
});

export const configSchema = z.object({
  priceMonThu: z.coerce.number().min(0),
  priceFri: z.coerce.number().min(0),
  priceSat: z.coerce.number().min(0),
  priceSun: z.coerce.number().min(0),
  priceSeason: z.coerce.number().min(0),
  priceHoliday: z.coerce.number().min(0),
  checkInTime: z.string().regex(/^\d{2}:\d{2}$/),
  checkOutTime: z.string().regex(/^\d{2}:\d{2}$/),
  minDeposit: z.coerce.number().min(0),
  includedGuests: z.coerce.number().int().min(0),
  maxCapacity: z.coerce.number().int().min(1),
  extraGuestCost: z.coerce.number().min(0),
  enableGrill: z.coerce.boolean(),
  enableFurniture: z.coerce.boolean(),
  enableBathrooms: z.coerce.boolean(),
  poolAddress: z.string().optional().or(z.literal("")),
  businessName: z.string().optional().or(z.literal("")),
  generalNotes: z.string().optional().or(z.literal("")),
});
