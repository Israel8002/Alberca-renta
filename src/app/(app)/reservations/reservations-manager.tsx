"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
  Modal,
  ConfirmDialog,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiFetch } from "@/lib/http";
import { formatCurrency, formatDate, dateOnly } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export interface PaymentDTO {
  id: string;
  amount: number;
  type: "ANTICIPO" | "PARCIAL" | "FINAL";
  method: string | null;
  note: string | null;
  createdAt: string;
}
export type Status =
  | "DISPONIBLE"
  | "APARTADO"
  | "LIQUIDADO"
  | "CANCELADO"
  | "MANTENIMIENTO";

export interface ReservationDTO {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string | null;
  date: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  price: number;
  deposit: number;
  status: Status;
  notes: string | null;
  googleEventId: string | null;
  payments: PaymentDTO[];
}

export interface ClientOption {
  id: string;
  fullName: string;
  phone: string;
  address: string | null;
  guests: number;
}

export interface ConfigDTO {
  checkInTime: string;
  checkOutTime: string;
  priceMonThu: number;
  priceFri: number;
  priceSat: number;
  priceSun: number;
  includedGuests: number;
  extraGuestCost: number;
  maxCapacity: number;
  minDeposit: number;
  businessName: string;
  poolAddress: string;
}

const STATUSES: Status[] = [
  "APARTADO",
  "LIQUIDADO",
  "CANCELADO",
  "MANTENIMIENTO",
];

function paidOf(r: ReservationDTO) {
  return r.payments.reduce((s, p) => s + p.amount, 0);
}
function balanceOf(r: ReservationDTO) {
  return Math.max(0, r.price - paidOf(r));
}

function suggestPrice(cfg: ConfigDTO, dateStr: string, guests: number) {
  if (!dateStr) return 0;
  const day = dateOnly(dateStr).getUTCDay();
  let base = cfg.priceMonThu;
  if (day === 0) base = cfg.priceSun;
  else if (day === 5) base = cfg.priceFri;
  else if (day === 6) base = cfg.priceSat;
  const extra = Math.max(0, guests - cfg.includedGuests) * cfg.extraGuestCost;
  return base + extra;
}

export function ReservationsManager({
  initial,
  clients,
  config,
}: {
  initial: ReservationDTO[];
  clients: ClientOption[];
  config: ConfigDTO;
}) {
  const { toast } = useToast();
  const [rows, setRows] = useState<ReservationDTO[]>(initial);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReservationDTO | null>(null);
  const [detail, setDetail] = useState<ReservationDTO | null>(null);
  const [toDelete, setToDelete] = useState<ReservationDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(
    () => (statusFilter ? rows.filter((r) => r.status === statusFilter) : rows),
    [rows, statusFilter]
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(r: ReservationDTO) {
    setEditing(r);
    setFormOpen(true);
  }

  function upsertRow(r: ReservationDTO) {
    setRows((prev) => {
      const exists = prev.some((x) => x.id === r.id);
      const next = exists
        ? prev.map((x) => (x.id === r.id ? r : x))
        : [r, ...prev];
      return next.sort((a, b) => b.date.localeCompare(a.date));
    });
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/reservations/${toDelete.id}`, { method: "DELETE" });
      setRows((r) => r.filter((x) => x.id !== toDelete.id));
      toast("Reservación eliminada", "success");
      setToDelete(null);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setDeleting(false);
    }
  }

  function openWhatsApp(r: ReservationDTO) {
    const url = buildWhatsAppUrl({
      clientName: r.clientName,
      clientPhone: r.clientPhone,
      date: r.date,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      guests: r.guests,
      total: r.price,
      deposit: paidOf(r),
      balance: balanceOf(r),
      businessName: config.businessName,
      address: r.clientAddress || config.poolAddress,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Reservaciones
        </h1>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-auto"
          >
            <option value="">Todos los estados</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <Button onClick={openCreate} disabled={clients.length === 0}>
            <Plus className="h-4 w-4" /> Nueva
          </Button>
        </div>
      </div>

      {clients.length === 0 && (
        <Card className="flex items-center gap-3 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm">
            Primero registra al menos un cliente para crear reservaciones.
          </p>
        </Card>
      )}

      {/* Desktop table */}
      <Card className="hidden overflow-x-auto p-0 lg:block">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Horario</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Saldo</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                  {r.clientName}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {formatDate(r.date).replace(/^\w+, /, "")}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {r.checkIn}–{r.checkOut}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {formatCurrency(r.price)}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                  {formatCurrency(balanceOf(r))}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[r.status].badge}`}
                  >
                    {STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <RowActions
                    onView={() => setDetail(r)}
                    onEdit={() => openEdit(r)}
                    onDelete={() => setToDelete(r)}
                    onWhatsApp={() => openWhatsApp(r)}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  Sin reservaciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {filtered.map((r) => (
          <Card key={r.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {r.clientName}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(r.date).replace(/^\w+, /, "")} · {r.checkIn}–
                  {r.checkOut}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[r.status].badge}`}
              >
                {STATUS_LABELS[r.status]}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">
                Total: {formatCurrency(r.price)}
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Saldo: {formatCurrency(balanceOf(r))}
              </span>
            </div>
            <div className="flex justify-end">
              <RowActions
                onView={() => setDetail(r)}
                onEdit={() => openEdit(r)}
                onDelete={() => setToDelete(r)}
                onWhatsApp={() => openWhatsApp(r)}
              />
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-slate-400">Sin reservaciones.</p>
        )}
      </div>

      {formOpen && (
        <ReservationForm
          editing={editing}
          clients={clients}
          config={config}
          onClose={() => setFormOpen(false)}
          onSaved={(r) => {
            upsertRow(r);
            setFormOpen(false);
          }}
        />
      )}

      {detail && (
        <ReservationDetail
          reservation={detail}
          config={config}
          onClose={() => setDetail(null)}
          onChanged={(r) => {
            upsertRow(r);
            setDetail(r);
          }}
          onWhatsApp={() => openWhatsApp(detail)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        message={`¿Eliminar la reservación de ${toDelete?.clientName}? Se eliminará también su evento en Google Calendar.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </div>
  );
}

function RowActions({
  onView,
  onEdit,
  onDelete,
  onWhatsApp,
}: {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onWhatsApp: () => void;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={onWhatsApp} title="Confirmar por WhatsApp">
        <MessageCircle className="h-4 w-4 text-emerald-500" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onView} title="Detalles">
        <Eye className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onEdit} title="Editar">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={onDelete} title="Eliminar">
        <Trash2 className="h-4 w-4 text-rose-500" />
      </Button>
    </div>
  );
}

function ReservationForm({
  editing,
  clients,
  config,
  onClose,
  onSaved,
}: {
  editing: ReservationDTO | null;
  clients: ClientOption[];
  config: ConfigDTO;
  onClose: () => void;
  onSaved: (r: ReservationDTO) => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: editing?.clientId ?? clients[0]?.id ?? "",
    date: editing?.date ?? "",
    checkIn: editing?.checkIn ?? config.checkInTime,
    checkOut: editing?.checkOut ?? config.checkOutTime,
    guests: editing?.guests ?? clients[0]?.guests ?? 0,
    price: editing?.price ?? 0,
    deposit: editing?.deposit ?? 0,
    status: (editing?.status ?? "APARTADO") as Status,
    notes: editing?.notes ?? "",
  });

  async function checkDate(date: string, status: Status) {
    if (!date || !["APARTADO", "LIQUIDADO", "MANTENIMIENTO"].includes(status)) {
      setAvailability(null);
      return;
    }
    try {
      const res = await apiFetch<{ available: boolean; reason?: string }>(
        `/api/availability?date=${date}${editing ? `&ignore=${editing.id}` : ""}`
      );
      setAvailability(res.available ? null : res.reason || "Fecha no disponible");
    } catch {
      setAvailability(null);
    }
  }

  function applySuggestedPrice() {
    setForm((f) => ({
      ...f,
      price: suggestPrice(config, f.date, f.guests),
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.guests > config.maxCapacity) {
      toast(`La capacidad máxima es de ${config.maxCapacity} personas.`, "error");
      return;
    }
    setSaving(true);
    try {
      const payload = JSON.stringify(form);
      const saved = await apiFetch<{ id: string }>(
        editing ? `/api/reservations/${editing.id}` : "/api/reservations",
        { method: editing ? "PUT" : "POST", body: payload }
      );
      // Refetch full DTO for consistency
      const full = await apiFetch<RawReservation>(
        `/api/reservations/${saved.id}`
      );
      onSaved(mapRaw(full));
      toast(editing ? "Reservación actualizada" : "Reservación creada", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={editing ? "Editar reservación" : "Nueva reservación"}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Cliente *">
          <Select
            required
            value={form.clientId}
            onChange={(e) => {
              const c = clients.find((x) => x.id === e.target.value);
              setForm({
                ...form,
                clientId: e.target.value,
                guests: c?.guests || form.guests,
              });
            }}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} · {c.phone}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha *">
            <Input
              type="date"
              required
              value={form.date}
              onChange={(e) => {
                setForm({ ...form, date: e.target.value });
                checkDate(e.target.value, form.status);
              }}
            />
          </Field>
          <Field label="N.º de personas">
            <Input
              type="number"
              min={0}
              max={config.maxCapacity}
              value={form.guests}
              onChange={(e) =>
                setForm({ ...form, guests: Number(e.target.value) })
              }
            />
          </Field>
        </div>

        {availability && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-sm text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
            <AlertTriangle className="h-4 w-4" /> {availability}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Hora de entrada">
            <Input
              type="time"
              value={form.checkIn}
              onChange={(e) => setForm({ ...form, checkIn: e.target.value })}
            />
          </Field>
          <Field label="Hora de salida">
            <Input
              type="time"
              value={form.checkOut}
              onChange={(e) => setForm({ ...form, checkOut: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio total">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Anticipo">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.deposit}
              onChange={(e) =>
                setForm({ ...form, deposit: Number(e.target.value) })
              }
            />
          </Field>
        </div>
        <button
          type="button"
          onClick={applySuggestedPrice}
          className="text-xs font-medium text-sky-600 hover:underline"
        >
          Sugerir precio ({formatCurrency(suggestPrice(config, form.date, form.guests))})
        </button>

        <Field label="Estado">
          <Select
            value={form.status}
            onChange={(e) => {
              const status = e.target.value as Status;
              setForm({ ...form, status });
              checkDate(form.date, status);
            }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Observaciones">
          <Textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !!availability}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ReservationDetail({
  reservation,
  config,
  onClose,
  onChanged,
  onWhatsApp,
}: {
  reservation: ReservationDTO;
  config: ConfigDTO;
  onClose: () => void;
  onChanged: (r: ReservationDTO) => void;
  onWhatsApp: () => void;
}) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<PaymentDTO["type"]>("PARCIAL");
  const [adding, setAdding] = useState(false);
  const paid = paidOf(reservation);
  const balance = balanceOf(reservation);

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    setAdding(true);
    try {
      await apiFetch("/api/payments", {
        method: "POST",
        body: JSON.stringify({
          reservationId: reservation.id,
          amount: value,
          type,
        }),
      });
      const full = await apiFetch<RawReservation>(
        `/api/reservations/${reservation.id}`
      );
      onChanged(mapRaw(full));
      setAmount("");
      toast("Pago registrado", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setAdding(false);
    }
  }

  async function removePayment(id: string) {
    try {
      await apiFetch(`/api/payments/${id}`, { method: "DELETE" });
      const full = await apiFetch<RawReservation>(
        `/api/reservations/${reservation.id}`
      );
      onChanged(mapRaw(full));
      toast("Pago eliminado", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <Modal open onClose={onClose} title="Detalle de reservación">
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {reservation.clientName}
            </h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[reservation.status].badge}`}
            >
              {STATUS_LABELS[reservation.status]}
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <Detail label="Fecha" value={formatDate(reservation.date)} />
            <Detail
              label="Horario"
              value={`${reservation.checkIn} – ${reservation.checkOut}`}
            />
            <Detail label="Personas" value={String(reservation.guests)} />
            <Detail label="Teléfono" value={reservation.clientPhone} />
            <Detail label="Total" value={formatCurrency(reservation.price)} />
            <Detail label="Pagado" value={formatCurrency(paid)} />
            <Detail label="Saldo pendiente" value={formatCurrency(balance)} />
          </dl>
          {reservation.notes && (
            <p className="mt-2 text-sm text-slate-500">{reservation.notes}</p>
          )}
        </div>

        <Button variant="success" className="w-full" onClick={onWhatsApp}>
          <MessageCircle className="h-4 w-4" /> Confirmar por WhatsApp
        </Button>

        <div>
          <h4 className="mb-2 font-semibold text-slate-900 dark:text-white">
            Pagos
          </h4>
          {reservation.payments.length === 0 ? (
            <p className="text-sm text-slate-400">Sin pagos registrados.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {reservation.payments.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {formatCurrency(p.amount)}
                    </span>
                    <span className="ml-2 text-xs text-slate-400">
                      {p.type} ·{" "}
                      {new Date(p.createdAt).toLocaleDateString("es-MX")}
                    </span>
                  </div>
                  <button
                    onClick={() => removePayment(p.id)}
                    className="text-rose-400 hover:text-rose-600"
                    aria-label="Eliminar pago"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addPayment} className="mt-3 flex items-end gap-2">
            <Field label="Monto" className="flex-1">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Tipo">
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as PaymentDTO["type"])}
              >
                <option value="ANTICIPO">Anticipo</option>
                <option value="PARCIAL">Parcial</option>
                <option value="FINAL">Final</option>
              </Select>
            </Field>
            <Button type="submit" disabled={adding}>
              {adding ? "…" : "Agregar"}
            </Button>
          </form>
          {config.minDeposit > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              Anticipo mínimo sugerido: {formatCurrency(config.minDeposit)}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}

// ---- helpers to normalize API responses ----
interface RawReservation {
  id: string;
  clientId: string;
  client: { fullName: string; phone: string; address: string | null };
  date: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  price: number;
  deposit: number;
  status: Status;
  notes: string | null;
  googleEventId: string | null;
  payments: PaymentDTO[];
}

function mapRaw(r: RawReservation): ReservationDTO {
  return {
    id: r.id,
    clientId: r.clientId,
    clientName: r.client.fullName,
    clientPhone: r.client.phone,
    clientAddress: r.client.address,
    date: r.date.slice(0, 10),
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    guests: r.guests,
    price: r.price,
    deposit: r.deposit,
    status: r.status,
    notes: r.notes,
    googleEventId: r.googleEventId,
    payments: r.payments,
  };
}
