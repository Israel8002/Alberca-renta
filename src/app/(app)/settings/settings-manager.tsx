"use client";

import { useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import type { Config } from "@prisma/client";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiFetch } from "@/lib/http";
import { formatDate } from "@/lib/utils";

export interface BlockedDTO {
  id: string;
  date: string;
  type: "BLOCKED" | "MAINTENANCE";
  reason: string | null;
}

type ConfigForm = Omit<Config, "id" | "updatedAt">;

export function SettingsManager({
  config,
  blocked,
}: {
  config: Config;
  blocked: BlockedDTO[];
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<ConfigForm>({
    priceMonThu: config.priceMonThu,
    priceFri: config.priceFri,
    priceSat: config.priceSat,
    priceSun: config.priceSun,
    priceSeason: config.priceSeason,
    priceHoliday: config.priceHoliday,
    checkInTime: config.checkInTime,
    checkOutTime: config.checkOutTime,
    minDeposit: config.minDeposit,
    includedGuests: config.includedGuests,
    maxCapacity: config.maxCapacity,
    extraGuestCost: config.extraGuestCost,
    enableGrill: config.enableGrill,
    enableFurniture: config.enableFurniture,
    enableBathrooms: config.enableBathrooms,
    poolAddress: config.poolAddress,
    businessName: config.businessName,
    generalNotes: config.generalNotes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [dates, setDates] = useState<BlockedDTO[]>(blocked);
  const [newDate, setNewDate] = useState("");
  const [newType, setNewType] = useState<"BLOCKED" | "MAINTENANCE">("BLOCKED");
  const [newReason, setNewReason] = useState("");

  function num<K extends keyof ConfigForm>(key: K, value: string) {
    setForm({ ...form, [key]: Number(value) });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/api/config", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      toast("Configuración guardada", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function addDate(e: React.FormEvent) {
    e.preventDefault();
    if (!newDate) return;
    try {
      const created = await apiFetch<BlockedDTO>("/api/blocked-dates", {
        method: "POST",
        body: JSON.stringify({ date: newDate, type: newType, reason: newReason }),
      });
      setDates((d) =>
        [...d.filter((x) => x.date !== created.date.slice(0, 10)), {
          ...created,
          date: created.date.slice(0, 10),
        }].sort((a, b) => a.date.localeCompare(b.date))
      );
      setNewDate("");
      setNewReason("");
      toast("Fecha agregada", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function removeDate(id: string) {
    try {
      await apiFetch(`/api/blocked-dates/${id}`, { method: "DELETE" });
      setDates((d) => d.filter((x) => x.id !== id));
      toast("Fecha eliminada", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Configuración
      </h1>

      <form onSubmit={save} className="space-y-6">
        <Card className="space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Precios
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <NumberField label="Lunes a jueves" value={form.priceMonThu} onChange={(v) => num("priceMonThu", v)} />
            <NumberField label="Viernes" value={form.priceFri} onChange={(v) => num("priceFri", v)} />
            <NumberField label="Sábado" value={form.priceSat} onChange={(v) => num("priceSat", v)} />
            <NumberField label="Domingo" value={form.priceSun} onChange={(v) => num("priceSun", v)} />
            <NumberField label="Temporada" value={form.priceSeason} onChange={(v) => num("priceSeason", v)} />
            <NumberField label="Días festivos" value={form.priceHoliday} onChange={(v) => num("priceHoliday", v)} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Horarios y capacidad
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Horario de entrada">
              <Input type="time" value={form.checkInTime} onChange={(e) => setForm({ ...form, checkInTime: e.target.value })} />
            </Field>
            <Field label="Horario de salida">
              <Input type="time" value={form.checkOutTime} onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })} />
            </Field>
            <NumberField label="Anticipo mínimo" value={form.minDeposit} onChange={(v) => num("minDeposit", v)} />
            <NumberField label="Personas incluidas" value={form.includedGuests} onChange={(v) => num("includedGuests", v)} />
            <NumberField label="Capacidad máxima" value={form.maxCapacity} onChange={(v) => num("maxCapacity", v)} />
            <NumberField label="Costo por persona extra" value={form.extraGuestCost} onChange={(v) => num("extraGuestCost", v)} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Amenidades
          </h2>
          <div className="flex flex-wrap gap-6">
            <Toggle label="Asador" checked={form.enableGrill} onChange={(v) => setForm({ ...form, enableGrill: v })} />
            <Toggle label="Mobiliario" checked={form.enableFurniture} onChange={(v) => setForm({ ...form, enableFurniture: v })} />
            <Toggle label="Baños" checked={form.enableBathrooms} onChange={(v) => setForm({ ...form, enableBathrooms: v })} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            General
          </h2>
          <Field label="Nombre del negocio">
            <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </Field>
          <Field label="Dirección de la alberca (para WhatsApp)">
            <Input value={form.poolAddress} onChange={(e) => setForm({ ...form, poolAddress: e.target.value })} />
          </Field>
          <Field label="Observaciones generales">
            <Textarea rows={3} value={form.generalNotes ?? ""} onChange={(e) => setForm({ ...form, generalNotes: e.target.value })} />
          </Field>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar configuración"}
          </Button>
        </div>
      </form>

      <Card className="space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">
          Fechas bloqueadas y de mantenimiento
        </h2>
        <form onSubmit={addDate} className="flex flex-wrap items-end gap-3">
          <Field label="Fecha">
            <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </Field>
          <Field label="Tipo">
            <Select value={newType} onChange={(e) => setNewType(e.target.value as "BLOCKED" | "MAINTENANCE")}>
              <option value="BLOCKED">Bloqueada</option>
              <option value="MAINTENANCE">Mantenimiento</option>
            </Select>
          </Field>
          <Field label="Motivo" className="flex-1 min-w-40">
            <Input value={newReason} onChange={(e) => setNewReason(e.target.value)} placeholder="Opcional" />
          </Field>
          <Button type="submit">
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </form>

        {dates.length === 0 ? (
          <p className="text-sm text-slate-400">Sin fechas registradas.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {dates.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatDate(d.date)}
                  </span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
                    {d.type === "MAINTENANCE" ? "Mantenimiento" : "Bloqueada"}
                  </span>
                  {d.reason && (
                    <span className="ml-2 text-xs text-slate-400">{d.reason}</span>
                  )}
                </div>
                <button
                  onClick={() => removeDate(d.id)}
                  className="text-rose-400 hover:text-rose-600"
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        min={0}
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-sky-600" : "bg-slate-300 dark:bg-slate-600"
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "left-0.5 translate-x-5" : "left-0.5"
          }`}
        />
      </button>
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    </label>
  );
}
