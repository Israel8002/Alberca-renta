import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS, OCCUPYING_STATUSES } from "@/lib/constants";
import {
  CalendarCheck,
  Wallet,
  AlertCircle,
  CalendarClock,
  CalendarX,
  CalendarRange,
} from "lucide-react";

export const dynamic = "force-dynamic";

function monthRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const daysInMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
  ).getUTCDate();
  return { start, end, daysInMonth };
}

export default async function DashboardPage() {
  const now = new Date();
  const { start, end, daysInMonth } = monthRange(now);

  const [monthReservations, monthPayments, activeReservations, upcoming, blocked] =
    await Promise.all([
      prisma.reservation.findMany({
        where: { date: { gte: start, lt: end }, status: { not: "CANCELADO" } },
      }),
      prisma.payment.findMany({
        where: { createdAt: { gte: start, lt: end } },
      }),
      prisma.reservation.findMany({
        where: { status: { in: ["APARTADO", "LIQUIDADO"] } },
        include: { payments: true },
      }),
      prisma.reservation.findMany({
        where: { date: { gte: start }, status: { in: OCCUPYING_STATUSES } },
        include: { client: true },
        orderBy: { date: "asc" },
        take: 5,
      }),
      prisma.blockedDate.findMany({ where: { date: { gte: start, lt: end } } }),
    ]);

  const income = monthPayments.reduce((s, p) => s + p.amount, 0);
  const pending = activeReservations.reduce((s, r) => {
    const paid = r.payments.reduce((a, p) => a + p.amount, 0);
    return s + Math.max(0, r.price - paid);
  }, 0);

  const occupiedDays = new Set(
    monthReservations
      .filter((r) => OCCUPYING_STATUSES.includes(r.status))
      .map((r) => new Date(r.date).getUTCDate())
  );
  blocked.forEach((b) => occupiedDays.add(new Date(b.date).getUTCDate()));
  const occupied = occupiedDays.size;
  const available = daysInMonth - occupied;

  const cards = [
    {
      label: "Reservaciones del mes",
      value: monthReservations.length,
      icon: CalendarCheck,
      color: "text-sky-600 bg-sky-100 dark:bg-sky-900/40",
    },
    {
      label: "Ingresos del mes",
      value: formatCurrency(income),
      icon: Wallet,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40",
    },
    {
      label: "Pendientes por cobrar",
      value: formatCurrency(pending),
      icon: AlertCircle,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/40",
    },
    {
      label: "Días ocupados",
      value: occupied,
      icon: CalendarX,
      color: "text-rose-600 bg-rose-100 dark:bg-rose-900/40",
    },
    {
      label: "Días disponibles",
      value: available,
      icon: CalendarRange,
      color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/40",
    },
    {
      label: "Próximas reservaciones",
      value: upcoming.length,
      icon: CalendarClock,
      color: "text-violet-600 bg-violet-100 dark:bg-violet-900/40",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Resumen de {formatDate(start).replace(/^\w+, /, "")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="flex items-center gap-4">
              <div className={`rounded-xl p-3 ${c.color}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                  {c.label}
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {c.value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Próximas reservaciones
          </h2>
          <Link
            href="/reservations"
            className="text-sm font-medium text-sky-600 hover:underline"
          >
            Ver todas
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No hay reservaciones próximas.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcoming.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                    {r.client.fullName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(r.date)} · {r.checkIn}–{r.checkOut}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[r.status].badge}`}
                >
                  {STATUS_LABELS[r.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
