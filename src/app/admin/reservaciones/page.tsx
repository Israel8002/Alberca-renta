'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Loader2, X, MessageCircle, Check, CreditCard, AlertTriangle, UserCheck, Edit, FileText, Image as ImageIcon, PlusCircle, Trash2 } from 'lucide-react'
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
  const [siteTitle, setSiteTitle] = useState('')
  const [filterStatus, setFilterStatus] = useState('pending') // Default to pending active solicitudes

  // Edit / Validate Modal State
  const [editingRes, setEditingRes] = useState<any | null>(null)
  const [newAbonoInput, setNewAbonoInput] = useState<string>('')
  const [viewingProofs, setViewingProofs] = useState<string[] | null>(null)

  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [{ data: res }, { data: config }] = await Promise.all([
      supabase.from('reservations').select('*').order('created_at', { ascending: true }),
      supabase.from('site_config').select('payment_info, home_title').eq('id', 'main').single(),
    ])
    setReservations(res || [])
    setPaymentInfo(config?.payment_info || '')
    setSiteTitle(config?.home_title || 'Sistema Reservas v1.0')
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
    setNewAbonoInput('')
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRes) return
    setSaving(true)
    try {
      const addedAbono = parseFloat(newAbonoInput || '0')
      const currentAbono = editingRes.abono_amount || 0
      const totalAbono = currentAbono + addedAbono
      const deposit = editingRes.deposit_amount || 0
      const total = editingRes.total_amount || 0
      const totalPaid = deposit + totalAbono

      let finalStatus = editingRes.status
      if (totalPaid >= total && total > 0) {
        finalStatus = 'pagado'
      } else if (totalAbono > 0 || deposit > 0) {
        finalStatus = 'abono'
      }

      await updateReservationPayment(editingRes.id, {
        abono_amount: totalAbono,
        status: finalStatus as any,
        validated_by_admin: true,
      })

      toast.success(addedAbono > 0 ? `Se sumó un nuevo abono de ${formatMXN(addedAbono)} y se validó la fecha ✅` : 'Solicitud validada por el administrador ✅')
      setEditingRes(null)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar')
    }
    setSaving(false)
  }

  async function handleNotifyOccupied(r: any) {
    // 1. Generate WA link with dynamic siteTitle
    const link = generateDateOccupiedNotificationLink({
      clientName: r.user_name,
      clientPhone: r.user_whatsapp,
      date: r.date,
      siteTitle,
    })
    window.open(link, '_blank')

    // 2. Mark reservation as cancelado in DB so it disappears from active pending requests in admin
    try {
      await updateReservationPayment(r.id, {
        status: 'cancelado',
        validated_by_admin: false,
        admin_note: 'Fecha ocupada por otro usuario',
      })
      toast.success('Cliente notificado por WA. La solicitud se movió a Ocupada/Cancelada')
      loadData()
    } catch {
      toast.error('Error al actualizar estatus')
    }
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
    { key: 'pending', label: '⏳ Pendientes de Validación' },
    { key: 'validated', label: '✅ Validadas / Pagadas' },
    { key: 'cancelado', label: '❌ Ocupadas / Canceladas' },
    { key: 'all', label: 'Todas' },
  ]

  const filtered = reservations
    .filter(r => {
      if (filterStatus === 'pending') return !r.validated_by_admin && r.status !== 'pagado' && r.status !== 'cancelado'
      if (filterStatus === 'validated') return (r.validated_by_admin || r.status === 'pagado') && r.status !== 'cancelado'
      if (filterStatus === 'cancelado') return r.status === 'cancelado'
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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="input-field" style={{ paddingLeft: 36, padding: '10px 12px 10px 36px' }} placeholder="Buscar cliente, WhatsApp o fecha…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {statusFilters.map(f => (
            <button key={f.key} onClick={() => setFilterStatus(f.key)} style={{ padding: '8px 14px', borderRadius: 999, border: filterStatus === f.key ? 'none' : '1px solid rgba(0,95,142,0.2)', background: filterStatus === f.key ? 'var(--color-primary)' : 'white', color: filterStatus === f.key ? 'white' : 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', background: 'white', borderRadius: 16 }}>
          No hay solicitudes en esta categoría
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (Visible on width >= 769px) */}
          <div className="res-desktop-table" style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(0,95,142,0.08)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.3fr 1fr 1.1fr auto', gap: 0, background: '#F8FAFC', padding: '12px 16px', borderBottom: '1px solid rgba(0,95,142,0.08)', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Cliente / Solicitante</span>
              <span>Fecha</span>
              <span>Desglose de Monto</span>
              <span>Comprobantes</span>
              <span>Estado de Validación</span>
              <span style={{ textAlign: 'right' }}>Acciones Admin</span>
            </div>
            {filtered.map((r, i) => {
              const isCancelled = r.status === 'cancelado'
              const isValidated = (r.validated_by_admin || r.status === 'pagado') && !isCancelled
              const dateStr = new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
              const createdTime = r.created_at ? new Date(r.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''
              const paid = (r.deposit_amount || 0) + (r.abono_amount || 0)
              const pending = (r.total_amount || 0) - paid

              return (
                <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.3fr 1fr 1.1fr auto', gap: 0, padding: '14px 16px', borderBottom: '1px solid rgba(0,95,142,0.05)', alignItems: 'center', background: isCancelled ? '#FEF2F2' : (isValidated ? '#F0FDF4' : 'white'), transition: 'background 0.15s' }}>
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
                    {isCancelled ? (
                      <span className="badge badge-cancelado">❌ Ocupada / Cancelada</span>
                    ) : isValidated ? (
                      <span className="badge badge-pagado">✅ Validado</span>
                    ) : (
                      <span className="badge badge-apartado">⏳ Pendiente</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    {/* Action: Validate & Register Abono */}
                    <button
                      onClick={() => openEditModal(r)}
                      title="Validar solicitud o registrar nuevo abono"
                      style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #005F8E, #00B4D8)', border: 'none', borderRadius: 8, color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <UserCheck size={13} /> Validar / Abono
                    </button>

                    {/* Action: Send Banking Details */}
                    <a
                      href={generateSendPaymentInfoLink({ clientName: r.user_name, clientPhone: r.user_whatsapp, date: r.date, paymentInfo, siteTitle })}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Enviar Datos de Pago por WhatsApp"
                      style={{ padding: '6px 10px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, color: '#065F46', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <CreditCard size={13} color="#25D366" /> Datos Pago
                    </a>

                    {/* Action: Notify Occupied & Mark Cancelled */}
                    {!isCancelled && (
                      <button
                        onClick={() => handleNotifyOccupied(r)}
                        title="Notificar por WA que la fecha ya fue ocupada y desocupar solicitud"
                        style={{ padding: '6px 10px', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 8, color: '#991B1B', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <AlertTriangle size={13} color="#DC2626" /> Ocupada
                      </button>
                    )}

                    <button onClick={() => handleDelete(r.id)} style={{ padding: '6px 8px', background: '#F3F4F6', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
                      <X size={13} color="#6B7280" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* MOBILE CARDS VIEW (Visible on width <= 768px) */}
          <div className="res-mobile-cards">
            {filtered.map((r, i) => {
              const isCancelled = r.status === 'cancelado'
              const isValidated = (r.validated_by_admin || r.status === 'pagado') && !isCancelled
              const dateStr = new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
              const createdTime = r.created_at ? new Date(r.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : ''
              const paid = (r.deposit_amount || 0) + (r.abono_amount || 0)
              const pending = (r.total_amount || 0) - paid

              return (
                <div
                  key={r.id}
                  className="card"
                  style={{
                    padding: 16,
                    borderLeft: isCancelled ? '4px solid #EF4444' : (isValidated ? '4px solid #10B981' : '4px solid #F59E0B'),
                    background: isCancelled ? '#FEF2F2' : (isValidated ? '#F0FDF4' : 'white'),
                  }}
                >
                  {/* Card Header: Client & Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>{r.user_name}</p>
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 999, background: '#E0F7FF', color: 'var(--color-primary)', fontWeight: 800 }}>
                          #{i + 1}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                        📱 WhatsApp: <strong>{r.user_whatsapp}</strong> {createdTime && `· 🕒 ${createdTime}`}
                      </p>
                    </div>
                    <div>
                      {isCancelled ? (
                        <span className="badge badge-cancelado" style={{ fontSize: '0.7rem' }}>❌ Ocupada</span>
                      ) : isValidated ? (
                        <span className="badge badge-pagado" style={{ fontSize: '0.7rem' }}>✅ Validado</span>
                      ) : (
                        <span className="badge badge-apartado" style={{ fontSize: '0.7rem' }}>⏳ Pendiente</span>
                      )}
                    </div>
                  </div>

                  {/* Date & Time Slot */}
                  <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Fecha Solicitada</p>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{dateStr}</p>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-primary)', background: '#E0F7FF', padding: '3px 8px', borderRadius: 6 }}>
                      {r.time_slot === 'fin_de_semana' ? 'S-D (Fin de semana)' : 'L-V (Entre semana)'}
                    </span>
                  </div>

                  {/* Breakdown Card */}
                  <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontSize: '0.82rem', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span>Total Evento:</span>
                      <strong>{formatMXN(r.total_amount || 0)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', marginBottom: 2 }}>
                      <span>Anticipo Base:</span>
                      <strong>{formatMXN(r.deposit_amount || 0)}</strong>
                    </div>
                    {r.abono_amount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3B82F6', marginBottom: 2 }}>
                        <span>Abonos Adicionales:</span>
                        <strong>{formatMXN(r.abono_amount)}</strong>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: pending > 0 ? '#EF4444' : '#059669', borderTop: '1px solid #E2E8F0', paddingTop: 4, marginTop: 4, fontWeight: 700 }}>
                      <span>Pendiente:</span>
                      <strong>{formatMXN(pending)}</strong>
                    </div>
                  </div>

                  {/* Proof Button */}
                  {r.proof_urls?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <button
                        onClick={() => setViewingProofs(r.proof_urls)}
                        style={{ width: '100%', padding: '8px', background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, fontSize: '0.78rem', color: '#065F46', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <ImageIcon size={15} /> Ver {r.proof_urls.length} comprobante(s) subidos
                      </button>
                    </div>
                  )}

                  {/* Action Buttons grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => openEditModal(r)}
                      style={{ padding: '10px 8px', background: 'linear-gradient(135deg, #005F8E, #00B4D8)', border: 'none', borderRadius: 10, color: 'white', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    >
                      <UserCheck size={14} /> Validar / Abono
                    </button>

                    <a
                      href={generateSendPaymentInfoLink({ clientName: r.user_name, clientPhone: r.user_whatsapp, date: r.date, paymentInfo, siteTitle })}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '10px 8px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, color: '#065F46', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    >
                      <CreditCard size={14} color="#25D366" /> Datos Pago
                    </a>

                    {!isCancelled && (
                      <button
                        onClick={() => handleNotifyOccupied(r)}
                        style={{ padding: '10px 8px', background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 10, color: '#991B1B', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                      >
                        <AlertTriangle size={14} color="#DC2626" /> Ocupada
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(r.id)}
                      style={{ padding: '10px 8px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 10, color: '#6B7280', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                    >
                      <Trash2 size={14} color="#EF4444" /> Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* VALIDAR Y REGISTRAR ABONOS MODAL */}
      {editingRes && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(13,33,55,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-in" style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem' }}>Validar y Registrar Abonos</h3>
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

            {/* READONLY INFORMATION CARDS */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Costo Total de la Fecha (Sistema):</span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary)', fontFamily: 'monospace' }}>
                  {formatMXN(editingRes.total_amount || 0)}
                </strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.8rem', fontFamily: 'monospace' }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>Anticipo Base:</span>
                  <strong style={{ color: '#059669' }}>{formatMXN(editingRes.deposit_amount || 0)}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>Abonos Acumulados:</span>
                  <strong style={{ color: '#3B82F6' }}>{formatMXN(editingRes.abono_amount || 0)}</strong>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* NEW ABONO INPUT */}
              <div>
                <label className="label" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  ➕ Registrar Nuevo Abono (MXN)
                </label>
                <input
                  className="input-field"
                  type="number"
                  step="0.01"
                  placeholder="Ej. 500.00 (Ingrese la nueva cantidad recibida)"
                  value={newAbonoInput}
                  onChange={e => setNewAbonoInput(e.target.value)}
                  style={{ fontSize: '1rem', fontWeight: 600 }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Si dejas este campo en 0, solo se validará la solicitud con los abonos actuales.
                </p>
              </div>

              {/* DYNAMIC CALCULATION PREVIEW */}
              <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 12, padding: 14, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Abonos Anteriores:</span>
                  <span>{formatMXN(editingRes.abono_amount || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#005F8E', fontWeight: 700 }}>
                  <span>(+) Nuevo Abono:</span>
                  <span>+{formatMXN(parseFloat(newAbonoInput || '0'))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #FCD34D', paddingTop: 6, marginTop: 4, fontWeight: 700 }}>
                  <span>Nuevo Total Pagado Acumulado:</span>
                  <span style={{ color: '#059669' }}>
                    {formatMXN((editingRes.deposit_amount || 0) + (editingRes.abono_amount || 0) + (parseFloat(newAbonoInput || '0')))}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontWeight: 700 }}>
                  <span>Nuevo Saldo Pendiente:</span>
                  <span style={{ color: ((editingRes.total_amount || 0) - (editingRes.deposit_amount || 0) - (editingRes.abono_amount || 0) - (parseFloat(newAbonoInput || '0'))) > 0 ? '#EF4444' : '#059669' }}>
                    {formatMXN(Math.max(0, (editingRes.total_amount || 0) - (editingRes.deposit_amount || 0) - (editingRes.abono_amount || 0) - (parseFloat(newAbonoInput || '0'))))}
                  </span>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '14px', background: 'linear-gradient(135deg, #059669, #10B981)', borderRadius: 12, fontWeight: 700 }}>
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : '✅ Validar y Guardar Abono'}
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

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 769px) {
          .res-desktop-table { display: block !important; }
          .res-mobile-cards { display: none !important; }
        }
        @media (max-width: 768px) {
          .res-desktop-table { display: none !important; }
          .res-mobile-cards { display: flex !important; flex-direction: column; gap: 14px; }
        }
      `}</style>
    </div>
  )
}
