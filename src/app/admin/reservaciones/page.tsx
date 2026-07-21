'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Loader2, X, MessageCircle, Check } from 'lucide-react'
import { createReservation, updateReservationPayment, deleteReservation } from '@/services/reservations'
import { generateAdminPaymentReminderLink } from '@/lib/whatsapp'
import toast from 'react-hot-toast'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

const EMPTY_FORM = {
  user_name: '', user_whatsapp: '', date: '',
  time_slot: 'lunes_viernes', total_amount: '', deposit_amount: '', status: 'apartado',
}

export default function ReservacionesPage() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: res }, { data: config }] = await Promise.all([
      supabase.from('reservations').select('*').order('date', { ascending: false }),
      supabase.from('site_config').select('payment_info').eq('id', 'main').single(),
    ])
    setReservations(res || [])
    setPaymentInfo(config?.payment_info || '')
    setLoading(false)
  }

  // Auto-detect time slot from date
  function handleDateChange(date: string) {
    const d = new Date(date + 'T12:00:00')
    const day = d.getDay()
    const slot = (day === 0 || day === 6) ? 'fin_de_semana' : 'lunes_viernes'
    setForm(f => ({ ...f, date, time_slot: slot }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await createReservation({
        user_name: form.user_name,
        user_whatsapp: form.user_whatsapp.replace(/\D/g, ''),
        date: form.date,
        time_slot: form.time_slot as any,
        total_amount: parseFloat(form.total_amount),
        deposit_amount: parseFloat(form.deposit_amount || '0'),
      })
      toast.success('Reservación creada ✅')
      setShowForm(false)
      setForm(EMPTY_FORM)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Error al crear')
    }
    setSaving(false)
  }

  async function handleUpdateStatus(id: string, status: string, currentAbonoAmount?: number) {
    try {
      await updateReservationPayment(id, { status: status as any })
      toast.success('Estado actualizado')
      loadData()
    } catch { toast.error('Error') }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta reservación?')) return
    try {
      await deleteReservation(id)
      toast.success('Eliminada')
      loadData()
    } catch { toast.error('Error') }
  }

  const statusFilters = [
    { key: 'all', label: 'Todas' },
    { key: 'apartado', label: '🟡 Apartado' },
    { key: 'abono', label: '🔵 Abono' },
    { key: 'pagado', label: '✅ Pagado' },
    { key: 'cancelado', label: '❌ Cancelado' },
  ]

  const STATUS_COLORS: Record<string, string> = { apartado: '#F59E0B', abono: '#3B82F6', pagado: '#059669', cancelado: '#9CA3AF' }

  const filtered = reservations
    .filter(r => filterStatus === 'all' || r.status === filterStatus)
    .filter(r => r.user_name?.toLowerCase().includes(search.toLowerCase()) || r.user_whatsapp?.includes(search) || r.date?.includes(search))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>Reservaciones</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{reservations.length} total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.875rem' }}>
          <Plus size={16} /> Nueva Reservación
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="input-field" style={{ paddingLeft: 36, padding: '10px 12px 10px 36px' }} placeholder="Buscar nombre, WhatsApp o fecha…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {statusFilters.map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)} style={{ padding: '7px 12px', borderRadius: 999, border: filterStatus === f.key ? 'none' : '1px solid rgba(0,95,142,0.2)', background: filterStatus === f.key ? 'var(--color-primary)' : 'white', color: filterStatus === f.key ? 'white' : 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,95,142,0.08)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr auto', gap: 0, background: '#F8FAFC', padding: '10px 16px', borderBottom: '1px solid rgba(0,95,142,0.08)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Cliente</span>
            <span>Fecha</span>
            <span>Total</span>
            <span>Pagado</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No se encontraron reservaciones</div>
          ) : (
            filtered.map(r => {
              const paid = (r.deposit_amount || 0) + (r.abono_amount || 0)
              return (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr auto', gap: 0, padding: '12px 16px', borderBottom: '1px solid rgba(0,95,142,0.05)', alignItems: 'center', transition: 'background 0.15s' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.user_name}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>📱 {r.user_whatsapp}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                      {new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {r.time_slot === 'fin_de_semana' ? 'S-D' : 'L-V'}
                    </p>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 700 }}>{formatMXN(r.total_amount || 0)}</span>
                  <span style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#059669', fontWeight: 700 }}>{formatMXN(paid)}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: `${STATUS_COLORS[r.status] || '#9CA3AF'}20`, color: STATUS_COLORS[r.status] || '#9CA3AF', width: 'fit-content' }}>
                    {r.status}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {r.status !== 'pagado' && r.status !== 'cancelado' && (
                      <>
                        <a href={generateAdminPaymentReminderLink({ clientName: r.user_name, clientPhone: r.user_whatsapp, date: r.date, timeSlot: r.time_slot, status: r.status, totalAmount: r.total_amount || 0, abonoAmount: r.abono_amount || 0, depositAmount: r.deposit_amount || 0, paymentInfo })} target="_blank" style={{ padding: '5px', background: '#F0FDF4', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex' }}>
                          <MessageCircle size={14} color="#25D366" />
                        </a>
                        <button onClick={() => handleUpdateStatus(r.id, 'pagado')} style={{ padding: '5px', background: '#F0FDF4', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex' }}>
                          <Check size={14} color="#059669" />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDelete(r.id)} style={{ padding: '5px', background: '#FFF1F2', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex' }}>
                      <X size={14} color="#EF4444" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* New Reservation Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(13,33,55,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-in" style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem' }}>Nueva Reservación</h3>
              <button onClick={() => setShowForm(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Nombre del cliente *</label>
                <input className="input-field" placeholder="Juan García" value={form.user_name} onChange={e => setForm({ ...form, user_name: e.target.value })} required />
              </div>
              <div>
                <label className="label">WhatsApp *</label>
                <input className="input-field" placeholder="3311234567" type="tel" value={form.user_whatsapp} onChange={e => setForm({ ...form, user_whatsapp: e.target.value })} required />
              </div>
              <div>
                <label className="label">Fecha *</label>
                <input className="input-field" type="date" value={form.date} onChange={e => handleDateChange(e.target.value)} required />
              </div>
              <div>
                <label className="label">Horario (autodetectado por fecha)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[{ v: 'lunes_viernes', l: 'L-V (12PM-12AM)' }, { v: 'fin_de_semana', l: 'S-D (12PM-1AM)' }].map(opt => (
                    <button key={opt.v} type="button" onClick={() => setForm({ ...form, time_slot: opt.v })} style={{ flex: 1, padding: '9px', borderRadius: 10, border: form.time_slot === opt.v ? '2px solid var(--color-primary)' : '2px solid #E5E7EB', background: form.time_slot === opt.v ? '#E0F7FF' : 'white', color: form.time_slot === opt.v ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="label">Total MXN *</label>
                  <input className="input-field" type="number" step="0.01" placeholder="0.00" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Apartado MXN</label>
                  <input className="input-field" type="number" step="0.01" placeholder="0.00" value={form.deposit_amount} onChange={e => setForm({ ...form, deposit_amount: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '13px' }}>
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : '✅ Crear Reservación'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
