'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Search, Phone, Trash2, ChevronDown, ChevronUp, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [clientReservations, setClientReservations] = useState<Record<string, any[]>>({})
  const supabase = createClient()

  useEffect(() => { loadClients() }, [])

  async function loadClients() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('role', 'cliente').order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  async function toggleClient(clientId: string) {
    if (expanded === clientId) { setExpanded(null); return }
    setExpanded(clientId)
    if (!clientReservations[clientId]) {
      const { data } = await supabase.from('reservations').select('*').eq('user_id', clientId).order('date', { ascending: false })
      setClientReservations(prev => ({ ...prev, [clientId]: data || [] }))
    }
  }

  async function handleDeactivate(clientId: string, isActive: boolean) {
    const { error } = await supabase.from('profiles').update({ is_active: !isActive }).eq('id', clientId)
    if (error) { toast.error('Error'); return }
    toast.success(isActive ? 'Cliente desactivado' : 'Cliente activado')
    loadClients()
  }

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.whatsapp?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const statusLabel: Record<string, string> = { apartado: '🟡 Apartado', abono: '🔵 Abono', pagado: '✅ Pagado', cancelado: '❌ Cancelado' }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>Clientes</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{clients.length} clientes registrados</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          className="input-field"
          style={{ paddingLeft: 40 }}
          placeholder="Buscar por nombre, WhatsApp o correo…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>Cargando clientes…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
          <p style={{ fontSize: '2rem' }}>👤</p>
          <p>No se encontraron clientes</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(client => (
            <div key={client.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Client header */}
              <div
                style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                onClick={() => toggleClient(client.id)}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #005F8E, #00B4D8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
                }}>
                  {client.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{client.name}</p>
                    {!client.is_active && <span className="badge badge-cancelado" style={{ fontSize: '0.65rem' }}>Inactivo</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 12, color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
                    <span>📱 {client.whatsapp || 'Sin WhatsApp'}</span>
                    {client.email && <span>✉️ {client.email}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {client.whatsapp && (
                    <a
                      href={`https://wa.me/52${client.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      onClick={e => e.stopPropagation()}
                      className="btn-whatsapp"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      <MessageCircle size={14} /> Mensaje
                    </a>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); handleDeactivate(client.id, client.is_active) }}
                    style={{ background: client.is_active ? '#FEE2E2' : '#D1FAE5', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '0.75rem', color: client.is_active ? '#991B1B' : '#065F46', fontWeight: 600 }}
                  >
                    {client.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  {expanded === client.id ? <ChevronUp size={18} color="var(--color-text-muted)" /> : <ChevronDown size={18} color="var(--color-text-muted)" />}
                </div>
              </div>

              {/* Reservations expansion */}
              {expanded === client.id && (
                <div style={{ borderTop: '1px solid rgba(0,95,142,0.08)', padding: '12px 20px 16px', background: 'var(--color-bg)' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Historial de Reservaciones
                  </p>
                  {(clientReservations[client.id] || []).length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Sin reservaciones</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(clientReservations[client.id] || []).map(r => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'white', borderRadius: 10, border: '1px solid rgba(0,95,142,0.07)' }}>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                              {new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                              Total: {formatMXN(r.total_amount || 0)} · Pagado: {formatMXN((r.deposit_amount || 0) + (r.abono_amount || 0))}
                            </p>
                          </div>
                          <span className={`badge badge-${r.status}`}>{statusLabel[r.status]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
