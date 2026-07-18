"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Phone, Mail } from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  Textarea,
  Modal,
  ConfirmDialog,
} from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiFetch } from "@/lib/http";

export interface ClientRow {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  guests: number;
  notes: string | null;
  reservationsCount: number;
}

const empty = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  guests: 0,
  notes: "",
};

export function ClientsManager({ initial }: { initial: ClientRow[] }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<ClientRow[]>(initial);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<ClientRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.email ?? "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  function openCreate() {
    setEditing(null);
    setForm({ ...empty });
    setModalOpen(true);
  }

  function openEdit(row: ClientRow) {
    setEditing(row);
    setForm({
      fullName: row.fullName,
      phone: row.phone,
      email: row.email ?? "",
      address: row.address ?? "",
      guests: row.guests,
      notes: row.notes ?? "",
    });
    setModalOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const updated = await apiFetch<ClientRow>(`/api/clients/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        setRows((r) =>
          r.map((x) =>
            x.id === editing.id
              ? { ...updated, reservationsCount: x.reservationsCount }
              : x
          )
        );
        toast("Cliente actualizado", "success");
      } else {
        const created = await apiFetch<ClientRow>("/api/clients", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setRows((r) =>
          [...r, { ...created, reservationsCount: 0 }].sort((a, b) =>
            a.fullName.localeCompare(b.fullName)
          )
        );
        toast("Cliente creado", "success");
      }
      setModalOpen(false);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/clients/${toDelete.id}`, { method: "DELETE" });
      setRows((r) => r.filter((x) => x.id !== toDelete.id));
      toast("Cliente eliminado", "success");
      setToDelete(null);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Clientes
        </h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuevo cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, teléfono o correo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Desktop table */}
      <Card className="hidden overflow-x-auto p-0 md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Teléfono</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Reservas</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                  {r.fullName}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {r.phone}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {r.email || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {r.reservationsCount}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setToDelete(r)}
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Sin clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {filtered.map((r) => (
          <Card key={r.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {r.fullName}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                <Phone className="h-3.5 w-3.5" /> {r.phone}
              </p>
              {r.email && (
                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Mail className="h-3.5 w-3.5" /> {r.email}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {r.reservationsCount} reservación(es)
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Button size="sm" variant="ghost" onClick={() => openEdit(r)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setToDelete(r)}>
                <Trash2 className="h-4 w-4 text-rose-500" />
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-slate-400">Sin clientes.</p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar cliente" : "Nuevo cliente"}
      >
        <form onSubmit={save} className="space-y-4">
          <Field label="Nombre completo *">
            <Input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Teléfono *">
              <Input
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="N.º de personas">
              <Input
                type="number"
                min={0}
                value={form.guests}
                onChange={(e) =>
                  setForm({ ...form, guests: Number(e.target.value) })
                }
              />
            </Field>
          </div>
          <Field label="Correo electrónico (opcional)">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Dirección (opcional)">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Observaciones">
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        message={`¿Eliminar a ${toDelete?.fullName}? Esta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
        loading={deleting}
      />
    </div>
  );
}
