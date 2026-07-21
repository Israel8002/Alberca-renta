'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'
import { createEvent, deleteEvent, updateEvent } from '@/services/events'
import toast from 'react-hot-toast'

const EVENT_TYPES = [
  { value: 'promotion', label: '🎉 Promoción', color: '#8B5CF6' },
  { value: 'maintenance', label: '⚙️ Mantenimiento', color: '#6B7280' },
  { value: 'holiday', label: '🎊 Día festivo', color: '#F59E0B' },
  { value: 'special', label: '⭐ Evento especial', color: '#EF4444' },
]

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

const EMPTY_FORM = { title: '', description: '', date: '', end_date: '', type: 'promotion', special_price: '', discount_percent: '' }

export default function EventosPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState<any | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoading(true)
    const { data } = await supabase.from('events').select('*').order('date', { ascending: false })
    setEvents(data || [])
    setLoading(false)
  }

  function openNew() {
    setEditEvent(null)
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0] })
    setShowForm(true)
  }

  function openEdit(ev: any) {
    setEditEvent(ev)
    setForm({
      title: ev.title,
      description: ev.description || '',
      date: ev.date,
      end_date: ev.end_date || ev.date,
      type: ev.type,
      special_price: ev.special_price ? String(ev.special_price) : '',
      discount_percent: ev.discount_percent ? String(ev.discount_percent) : '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: any = {
        title: form.title,
        description: form.description || undefined,
        date: form.date,
        end_date: form.end_date || form.date,
        type: form.type as any,
        special_price: form.special_price ? parseFloat(form.special_price) : undefined,
        discount_percent: form.discount_percent ? parseInt(form.discount_percent) : undefined,
      }
      if (editEvent) {
        await updateEvent(editEvent.id, payload)
        toast.success('Evento actualizado ✅')
      } else {
        await createEvent(payload)
        toast.success('Evento creado ✅')
      }
      setShowForm(false)
      loadEvents()
    } catch { toast.error('Error al guardar') }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este evento?')) return
    try {
      await deleteEvent(id)
      toast.success('Evento eliminado')
      loadEvents()
    } catch { toast.error('Error') }
  }

  async function handleToggleActive(ev: any) {
    await supabase.from('events').update({ is_active: !ev.is_active }).eq('id', ev.id)
    loadEvents()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>Eventos y Promociones</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Visibles en el calendario público</p>
        </div>
        <button onClick={openNew} className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.875rem' }}>
          <Plus size={16} /> Nuevo Evento
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: '3rem' }}>🎉</p>
          <p style={{ fontWeight: 600 }}>No hay eventos registrados</p>
          <p style={{ fontSize: '0.875rem' }}>Crea promociones o eventos especiales que aparecerán en el calendario</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {events.map(ev => {
            const evType = EVENT_TYPES.find(t => t.value === ev.type)
            return (
              <div key={ev.id} className="card" style={{ padding: '18px 20px', borderLeft: `4px solid ${evType?.color || '#6B7280'}`, opacity: ev.is_active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: `${evType?.color}15`, color: evType?.color }}>
                    {evType?.label}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleToggleActive(ev)} style={{ background: ev.is_active ? '#D1FAE5' : '#F3F4F6', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: ev.is_active ? '#065F46' : '#6B7280' }}>
                      {ev.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                    <button onClick={() => openEdit(ev)} style={{ background: '#EFF6FF', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                      <Pencil size={13} color="#3B82F6" />
                    </button>
                    <button onClick={() => handleDelete(ev.id)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                      <Trash2 size={13} color="#EF4444" />
                    </button>
                  </div>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{ev.title}</h3>
                {ev.description && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 8 }}>{ev.description}</p>}
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  📅 {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                  {ev.end_date && ev.end_date !== ev.date && ` → ${new Date(ev.end_date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`}
                </p>
                {ev.special_price && (
                  <p style={{ fontWeight: 700, color: evType?.color, marginTop: 6, fontFamily: 'monospace' }}>
                    Precio especial: {formatMXN(ev.special_price)}
                  </p>
                )}
                {ev.discount_percent && (
                  <p style={{ fontWeight: 700, color: '#059669', marginTop: 4, fontSize: '0.875rem' }}>
                    Descuento: {ev.discount_percent}%
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(13,33,55,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-in" style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem' }}>
                {editEvent ? 'Editar Evento' : 'Nuevo Evento'}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Título del evento *</label>
                <input className="input-field" placeholder="Ej: Semana Santa - Precio especial" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="label">Tipo de evento</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {EVENT_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: t.value })}
                      style={{ padding: '8px 12px', borderRadius: 10, border: form.type === t.value ? `2px solid ${t.color}` : '2px solid #E5E7EB', background: form.type === t.value ? `${t.color}10` : 'white', color: form.type === t.value ? t.color : 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="label">Fecha inicio *</label>
                  <input className="input-field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Fecha fin</label>
                  <input className="input-field" type="date" value={form.end_date} min={form.date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              {(form.type === 'promotion' || form.type === 'special') && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="label">Precio especial (MXN)</label>
                    <input className="input-field" type="number" placeholder="0.00" step="0.01" value={form.special_price} onChange={e => setForm({ ...form, special_price: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">% Descuento</label>
                    <input className="input-field" type="number" placeholder="0" min="0" max="100" value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: e.target.value })} />
                  </div>
                </div>
              )}
              <div>
                <label className="label">Descripción</label>
                <textarea className="input-field" rows={3} placeholder="Descripción visible al cliente…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '13px' }}>
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : editEvent ? '✅ Actualizar Evento' : '✅ Crear Evento'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
