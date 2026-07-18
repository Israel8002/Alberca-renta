import type { ReservationStatus } from "@prisma/client";

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  DISPONIBLE: "Disponible",
  APARTADO: "Apartado",
  LIQUIDADO: "Liquidado",
  CANCELADO: "Cancelado",
  MANTENIMIENTO: "Mantenimiento",
};

// Colors used across calendar/badges. Tailwind-safe static classes.
export const STATUS_COLORS: Record<
  ReservationStatus,
  { dot: string; badge: string; hex: string }
> = {
  DISPONIBLE: {
    dot: "bg-sky-500",
    badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
    hex: "#0ea5e9",
  },
  APARTADO: {
    dot: "bg-amber-500",
    badge:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    hex: "#f59e0b",
  },
  LIQUIDADO: {
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    hex: "#10b981",
  },
  CANCELADO: {
    dot: "bg-rose-500",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
    hex: "#f43f5e",
  },
  MANTENIMIENTO: {
    dot: "bg-slate-400",
    badge:
      "bg-slate-200 text-slate-700 dark:bg-slate-700/60 dark:text-slate-300",
    hex: "#94a3b8",
  },
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  ANTICIPO: "Anticipo",
  PARCIAL: "Pago parcial",
  FINAL: "Pago final",
};

// Statuses that occupy a date (block double booking).
export const OCCUPYING_STATUSES: ReservationStatus[] = [
  "APARTADO",
  "LIQUIDADO",
  "MANTENIMIENTO",
];
