"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button, Card, Modal } from "@/components/ui";
import { apiFetch } from "@/lib/http";
import { formatCurrency, formatDate, toISODate } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import type { Status } from "../reservations/reservations-manager";

interface CalReservation {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  price: number;
  status: Status;
  notes: string | null;
}
interface CalBlocked {
  id: string;
  date: string;
  type: "BLOCKED" | "MAINTENANCE";
  reason: string | null;
}

interface RawRes {
  id: string;
  client: { fullName: string; phone: string };
  date: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  price: number;
  status: Status;
  notes: string | null;
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getUTCFullYear());
  const [month, setMonth] = useState(today.getUTCMonth());
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<CalReservation[]>([]);
  const [blocked, setBlocked] = useState<CalBlocked[]>([]);
  const [selected, setSelected] = useState<CalReservation | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const from = toISODate(new Date(Date.UTC(year, month, 1)));
    const to = toISODate(new Date(Date.UTC(year, month + 1, 0)));
    try {
      const [res, blk] = await Promise.all([
        apiFetch<RawRes[]>(`/api/reservations?from=${from}&to=${to}`),
        apiFetch<CalBlocked[]>(`/api/blocked-dates`),
      ]);
      setReservations(
        res.map((r) => ({
          id: r.id,
          clientName: r.client.fullName,
          clientPhone: r.client.phone,
          date: r.date.slice(0, 10),
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          guests: r.guests,
          price: r.price,
          status: r.status,
          notes: r.notes,
        }))
      );
      setBlocked(blk.map((b) => ({ ...b, date: b.date.slice(0, 10) })));
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function prev() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function resFor(day: number) {
    const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return reservations.filter((r) => r.date === d);
  }
  function blockedFor(day: number) {
    const d = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return blocked.find((b) => b.date === d);
  }

  const isToday = (day: number) =>
    year === today.getUTCFullYear() &&
    month === today.getUTCMonth() &&
    day === today.getUTCDate();

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Calendario
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-40 text-center text-sm font-semibold text-slate-800 dark:text-slate-200">
            {MONTHS[month]} {year}
          </span>
          <Button variant="secondary" size="sm" onClick={next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Legend />

      <Card className="p-2 sm:p-4">
        {loading && (
          <div className="flex justify-center py-4 text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const dayRes = resFor(day);
            const blk = blockedFor(day);
            return (
              <div
                key={i}
                className={`min-h-16 rounded-lg border p-1 text-left sm:min-h-24 ${
                  isToday(day)
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <span className="text-xs font-medium text-slate-500">{day}</span>
                <div className="mt-1 space-y-1">
                  {blk && (
                    <div className="truncate rounded bg-slate-200 px-1 py-0.5 text-[10px] text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {blk.type === "MAINTENANCE" ? "Mantenimiento" : "Bloqueado"}
                    </div>
                  )}
                  {dayRes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[10px] text-white"
                      style={{ backgroundColor: STATUS_COLORS[r.status].hex }}
                      title={`${r.clientName} · ${STATUS_LABELS[r.status]}`}
                    >
                      <span className="truncate">{r.clientName}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {selected && (
        <Modal open onClose={() => setSelected(null)} title="Detalle del evento">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {selected.clientName}
              </h3>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[selected.status].badge}`}
              >
                {STATUS_LABELS[selected.status]}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Item label="Fecha" value={formatDate(selected.date)} />
              <Item
                label="Horario"
                value={`${selected.checkIn} – ${selected.checkOut}`}
              />
              <Item label="Personas" value={String(selected.guests)} />
              <Item label="Teléfono" value={selected.clientPhone} />
              <Item label="Total" value={formatCurrency(selected.price)} />
            </dl>
            {selected.notes && (
              <p className="text-sm text-slate-500">{selected.notes}</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}

function Legend() {
  const items: [Status | "BLOCKED", string][] = [
    ["LIQUIDADO", "Liquidado"],
    ["APARTADO", "Apartado"],
    ["CANCELADO", "Cancelado"],
    ["MANTENIMIENTO", "Mantenimiento"],
  ];
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
      {items.map(([key, label]) => (
        <span key={key} className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[key as Status].hex }}
          />
          {label}
        </span>
      ))}
    </div>
  );
}
