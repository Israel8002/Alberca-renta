'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Loader2, X, MessageCircle, Check, CreditCard, AlertTriangle, UserCheck, Edit, FileText, Image as ImageIcon } from 'lucide-react'
import { createReservation, updateReservationPayment, deleteReservation } from '@/services/reservations'
import { generateSendPaymentInfoLink, generateDateOccupiedNotificationLink, generatePaymentConfirmedLink, generateAdminPaymentReminderLink } from '@/lib/whatsapp'
import toast from 'react-hot-toast'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

const EMPTY_FORM = {
  user_name: '', user_whatsapp: '', date: '',
  time_slot: 'lunes_viernes', total_amount: '3000', deposit_amount: '1000', status: 'apartado',
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

  // Edit / Validate Modal State
  const [editingRes, setEditingRes] = useState<any | null>(null)
  const [editDeposit, setEditDeposit] = useState<string>('0')
  const [editAbono, setEditAbono] = useState<string>('0')
  const [editTotal, setEditTotal] = useState<string>('0')
  const [editStatus, setEditStatus] = useState<string>('apartado')
  const [viewingProofs, setViewingProofs] = useState<string[] | null>(null)

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: res }, { data: config }] = await Promise.all([
      supabase.from('reservations').select('*').order('created_at', { ascending: true }),
      supabase.from('site_config').select('payment_info').eq('id', 'main').single(),
    ])
    setReservations(res || [])
    setPaymentInfo(config?.payment_info || '')
    setLoading(false)
  }

  function handleDateChange(date: string) {
    const d = new Date(date + 'T12:00:00')
    const day = d.getDay()
    const slot = (day === 0 || day === 6) ? 'fin_de_semana' : 'lunes_viernes'
    setForm(f => ({ ...f, date, time_slot: slot }))
  }

  function openEditModal(r: any) {
    setEditingRes(r)
    setEditDeposit(String(r.deposit_amount || 0))
    setEditAbono(String(r.abono_amount || 0))
    setEditTotal(String(r.total_amount || 0))
    setEditStatus(r.status || 'apartado')
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRes) return
    setSaving(true)
    try {
      const deposit = parseFloat(editDeposit || '0')
      const abono = parseFloat(editAbono || '0')
      const total = parseFloat(editTotal || '0')
      const paid = deposit + abono

      let finalStatus = editStatus
      if (paid >= total && total > 0) {
        finalStatus = 'pagado'
      } else if (abono > 0) {
        finalStatus = 'abono'
      }

      await updateReservationPayment(editingRes.id, {
        deposit_amount: deposit,
        abono_amount: abono,
        total_amount: total,
        status: finalStatus as any,
        validated_by_admin: true,
      })

      toast.success('Monto y estatus actualizados y validados ✅')
      setEditingRes(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    }
    setSaving(false)
  }

  async function handleSubmitNew(e: React.FormEvent) {
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
        validated_by_admin: true,
      })
      toast.success('Reservación creada y validada ✅')
      setShowForm(false)
      setForm(EMPTY_FORM)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Error al crear')
    }
    setSaving(false)
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
    { key: 'pending', label: '⏳ Pendientes de Validación' },
    { key: 'validated', label: '✅ Validadas / Pagadas' },
  ]

  const filtered = reservations
    .filter(r => {
      if (filterStatus === 'pending') return !r.validated_by_admin && r.status !== 'pagado'
      if (filterStatus === 'validated') return r.validated_by_admin || r.status === 'pagado'
      return true
    })
    .filter(r => r.user_name?.toLowerCase().includes(search.toLowerCase()) || r.user_whatsapp?.includes(search) || r.date?.includes(search))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>Solicitudes y Reservaciones</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{reservations.length} registro(s) por orden de llegada</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.875rem' }}>
          <Plus size={16} /> Crear Reservación Directa
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="input-field" style={{ paddingLeft: 36, padding: '10px 12px 10px 36px' }} placeholder="Buscar cliente, WhatsApp o fecha…" value={search} onChange={e => setSearch(e.target.value)} />
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
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.3fr 1fr 1.1fr auto', gap: 0, background: '#F8FAFC', padding: '12px 16px', borderBottom: '1px solid rgba(0,95,142,0.08)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Cliente / Solicitante</span>
            <span>Fecha</span>
            <span>Desglose de Monto</span>
            <span>Comprobantes</span>
            <span>Estado de Validación</span>
            <span style={{ textAlign: 'right' }}>Acciones Admin</span>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No se encontraron registros</div>
          ) : (
            filtered.map((r, i) => {
              const isValidated = r.validated_by_admin || r.status === 'pagado'
              const dateStr = new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
              const createdTime = r.created_at ? new Date(r.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''
              const paid = (r.deposit_amount || 0) + (r.abono_amount || 0)
              const pending = (r.total_amount || 0) - paid

              return (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.3fr 1fr 1.1fr auto', gap: 0, padding: '14px 16px', borderBottom: '1px solid rgba(0,95,142,0.05)', alignItems: 'center', background: isValidated ? '#F0FDF4' : 'white', transition: 'background 0.15s' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{r.user_name}</p>
                      <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 999, background: '#E0F7FF', color: 'var(--color-primary)', fontWeight: 700 }}>
                        #{i + 1}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>📱 {r.user_whatsapp} {createdTime && `· 🕒 ${createdTime}`}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{dateStr}</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{r.time_slot === 'fin_de_semana' ? 'Fin de semana' : 'Entre semana'}</p>
                  </div>

                  {/* Breakdown */}
                  <div style={{ fontSize: '0.78rem', fontFamily: 'monospace' }}>
                    <div>Total: <strong>{formatMXN(r.total_amount || 0)}</strong></div>
                    <div style={{ color: '#059669' }}>Anticipo: <strong>{formatMXN(r.deposit_amount || 0)}</strong></div>
                    {r.abono_amount > 0 && <div style={{ color: '#3B82F6' }}>Abonos: <strong>{formatMXN(r.abono_amount)}</strong></div>}
                    {pending > 0 && <div style={{ color: '#EF4444' }}>Pendiente: <strong>{formatMXN(pending)}</strong></div>}
                  </div>

                  {/* Proof files */}
                  <div>
                    {r.proof_urls?.length > 0 ? (
                      <button
                        onClick={() => setViewingProofs(r.proof_urls)}
                        style={{ padding: '4px 10px', background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, fontSize: '0.75rem', color: '#065F46', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <ImageIcon size={13} /> {r.proof_urls.length} comprobante(s)
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Sin comprobante</span>
                    )}
                  </div>

                  <div>
                    {isValidated ? (
                      <span className="badge badge-pagado">✅ Validado</span>
                    ) : (
                      <span className="badge badge-apartado">⏳ Pendiente</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {/* Action: Edit & Validate Payment */}
                    <button
                      onClick={() => openEditModal(r)}
                      title="Editar monto y validar depósito"
                      style={{ padding: '6px 10px', background: 'linear-gradient(135deg, #005F8E, #00B4D8)', border: 'none', borderRadius: 8, color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Edit size={13} /> Editar / Validar
                    </button>

                    {/* Action: Send Banking Details */}
                    <a
                      href={generateSendPaymentInfoLink({ clientName: r.user_name, clientPhone: r.user_whatsapp, date: r.date, paymentInfo })}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Enviar Datos de Pago por WhatsApp"
                      style={{ padding: '6px 10px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, color: '#065F46', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <CreditCard size={13} color="#25D366" /> Datos Pago
                    </a>

                    {/* Action: Notify Occupied */}
                    <a
                      href={generateDateOccupiedNotificationLink({ clientName: r.user_name, clientPhone: r.user_whatsapp, date: r.date })}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Notificar por WA que la fecha ya fue ocupada"
                      style={{ padding: '6px 10px', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 8, color: '#991B1B', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <AlertTriangle size={13} color="#DC2626" /> Ocupada
                    </a>

                    <button onClick={() => handleDelete(r.id)} style={{ padding: '6px 8px', background: '#F3F4F6', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
                      <X size={13} color="#6B7280" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* EDIT & VALIDATE PAYMENT MODAL */}
      {editingRes && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(13,33,55,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-in" style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem' }}>Editar y Validar Monto de Pago</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Cliente: <strong>{editingRes.user_name}</strong> (📱 {editingRes.user_whatsapp})</p>
              </div>
              <button onClick={() => setEditingRes(null)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>

            {/* Proof Preview inside Edit Modal */}
            {editingRes.proof_urls?.length > 0 && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#065F46', marginBottom: 6 }}>Comprobante(s) de depósito subidos por el cliente:</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {editingRes.proof_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ padding: '6px 12px', background: 'white', border: '1px solid #059669', borderRadius: 8, fontSize: '0.78rem', color: '#059669', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ImageIcon size={14} /> Abrir Comprobante #{i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Monto Total de la Fecha (MXN) *</label>
                <input className="input-field" type="number" step="0.01" value={editTotal} onChange={e => setEditTotal(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label">Anticipo / Depósito (MXN)</label>
                  <input className="input-field" type="number" step="0.01" value={editDeposit} onChange={e => setEditDeposit(e.target.value)} />
                </div>
                <div>
                  <label className="label">Abonos Adicionales (MXN)</label>
                  <input className="input-field" type="number" step="0.01" value={editAbono} onChange={e => setEditAbono(e.target.value)} />
                </div>
              </div>

              {/* Summary Calculation */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Total Acumulado Pagado:</span>
                  <strong style={{ color: '#059669' }}>
                    {formatMXN((parseFloat(editDeposit || '0')) + (parseFloat(editAbono || '0')))}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pendiente por Liquidar:</span>
                  <strong style={{ color: ((parseFloat(editTotal || '0')) - (parseFloat(editDeposit || '0')) - (parseFloat(editAbono || '0'))) > 0 ? '#EF4444' : '#059669' }}>
                    {formatMXN(Math.max(0, (parseFloat(editTotal || '0')) - (parseFloat(editDeposit || '0')) - (parseFloat(editAbono || '0'))))}
                  </strong>
                </div>
              </div>

              <div>
                <label className="label">Estatus de la Reservación</label>
                <select className="input-field" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  <option value="apartado">🟡 Apartado (Con Anticipo)</option>
                  <option value="abono">🔵 Abono Parcial</option>
                  <option value="pagado">✅ Pagado Total / Liquidado</option>
                  <option value="cancelado">❌ Cancelado</option>
                </select>
              </div>

              <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '14px', background: 'linear-gradient(135deg, #059669, #10B981)', borderRadius: 12, fontWeight: 700 }}>
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : '✅ Validar y Guardar Montos'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PROOF IMAGES MODAL */}
      {viewingProofs && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(13,33,55,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(6px)' }} onClick={() => setViewingProofs(null)}>
          <div onClick={e => e.stopPropagation()} className="animate-fade-in" style={{ background: 'white', borderRadius: 20, padding: 24, width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem' }}>Comprobante(s) de Pago Subidos</h3>
              <button onClick={() => setViewingProofs(null)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {viewingProofs.map((url, i) => (
                <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', textAlign: 'center' }}>
                  <img src={url} alt={`Comprobante ${i + 1}`} style={{ width: '100%', maxHeight: 400, objectFit: 'contain', background: '#F9FAFB' }} />
                  <div style={{ padding: 10, background: '#F3F4F6' }}>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                      🔗 Abrir imagen en tamaño completo
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NEW RESERVATION MODAL */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(13,33,55,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-in" style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem' }}>Nueva Reservación Directa</h3>
              <button onClick={() => setShowForm(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmitNew} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                  <input className="input-field" type="number" step="0.01" placeholder="3000.00" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Apartado MXN</label>
                  <input className="input-field" type="number" step="0.01" placeholder="1000.00" value={form.deposit_amount} onChange={e => setForm({ ...form, deposit_amount: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '13px' }}>
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : '✅ Crear Reservación Validada'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
