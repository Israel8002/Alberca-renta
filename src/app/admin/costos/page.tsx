'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Upload, Trash2, ExternalLink, Loader2, X } from 'lucide-react'
import { createCost, deleteCost, uploadReceiptAndUpdate } from '@/services/costs'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'

const CATEGORIES = [
  { value: 'mantenimiento', label: '🔧 Mantenimiento' },
  { value: 'compras', label: '🛒 Compras' },
  { value: 'proveedores', label: '🚚 Proveedores' },
  { value: 'servicios', label: '⚡ Servicios' },
  { value: 'otros', label: '📋 Otros' },
]

const CATEGORY_COLORS: Record<string, string> = {
  mantenimiento: '#3B82F6',
  compras: '#F59E0B',
  proveedores: '#8B5CF6',
  servicios: '#10B981',
  otros: '#6B7280',
}

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

function ReceiptDropzone({ costId, existing, onUpload }: { costId: string; existing: string[]; onUpload: () => void }) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (files: File[]) => {
    setUploading(true)
    for (const file of files) {
      try {
        await uploadReceiptAndUpdate(costId, file, existing)
      } catch { toast.error('Error subiendo archivo') }
    }
    setUploading(false)
    onUpload()
  }, [costId, existing])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [], 'application/pdf': [] } })

  return (
    <div {...getRootProps()} style={{ border: '2px dashed rgba(0,95,142,0.3)', borderRadius: 10, padding: '12px 16px', cursor: 'pointer', background: isDragActive ? '#E0F7FF' : '#F8FEFF', textAlign: 'center', transition: 'all 0.2s' }}>
      <input {...getInputProps()} />
      {uploading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} /> : (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <Upload size={14} style={{ display: 'inline', marginRight: 4 }} />
          {isDragActive ? 'Suelta aquí' : 'Subir factura/recibo (PDF o imagen)'}
        </p>
      )}
    </div>
  )
}

export default function CostosPage() {
  const [costs, setCosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [form, setForm] = useState({ title: '', description: '', amount: '', category: 'mantenimiento', provider: '', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadCosts() }, [])

  async function loadCosts() {
    setLoading(true)
    const { data } = await supabase.from('costs').select('*').order('date', { ascending: false })
    setCosts(data || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await createCost({ ...form, amount: parseFloat(form.amount) } as any)
      toast.success('Costo registrado ✅')
      setShowForm(false)
      setForm({ title: '', description: '', amount: '', category: 'mantenimiento', provider: '', date: new Date().toISOString().split('T')[0] })
      loadCosts()
    } catch { toast.error('Error al guardar') }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este costo?')) return
    try {
      await deleteCost(id)
      toast.success('Eliminado')
      loadCosts()
    } catch { toast.error('Error') }
  }

  const filtered = costs.filter(c => filterCat === 'all' || c.category === filterCat)
  const total = filtered.reduce((sum, c) => sum + (c.amount || 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>Costos y Facturas</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Total filtrado: <strong style={{ color: '#EF4444', fontFamily: 'monospace' }}>{formatMXN(total)}</strong></p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.875rem' }}>
          <Plus size={16} /> Registrar Costo
        </button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button onClick={() => setFilterCat('all')} style={{ padding: '6px 14px', borderRadius: 999, border: filterCat === 'all' ? 'none' : '1px solid rgba(0,95,142,0.2)', background: filterCat === 'all' ? 'var(--color-primary)' : 'white', color: filterCat === 'all' ? 'white' : 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
          Todos
        </button>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setFilterCat(c.value)} style={{ padding: '6px 14px', borderRadius: 999, border: filterCat === c.value ? 'none' : '1px solid rgba(0,95,142,0.2)', background: filterCat === c.value ? CATEGORY_COLORS[c.value] : 'white', color: filterCat === c.value ? 'white' : 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}>
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(cost => (
            <div key={cost.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[cost.category], display: 'inline-block' }} />
                    <p style={{ fontWeight: 700 }}>{cost.title}</p>
                    <span style={{ fontSize: '0.72rem', color: CATEGORY_COLORS[cost.category], background: `${CATEGORY_COLORS[cost.category]}15`, padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>
                      {CATEGORIES.find(c => c.value === cost.category)?.label}
                    </span>
                  </div>
                  {cost.description && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 4 }}>{cost.description}</p>}
                  {cost.provider && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>🏢 {cost.provider}</p>}
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                    📅 {new Date(cost.date + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: '1.2rem', color: '#EF4444', fontFamily: 'monospace' }}>{formatMXN(cost.amount)}</p>
                  <button onClick={() => handleDelete(cost.id)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', marginTop: 4 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {/* Receipts */}
              {cost.receipt_urls?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {cost.receipt_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" style={{ padding: '4px 10px', background: '#EDE9FE', borderRadius: 6, fontSize: '0.72rem', color: '#5B21B6', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ExternalLink size={11} /> Factura {i + 1}
                    </a>
                  ))}
                </div>
              )}
              <ReceiptDropzone costId={cost.id} existing={cost.receipt_urls || []} onUpload={loadCosts} />
            </div>
          ))}
        </div>
      )}

      {/* New Cost Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(13,33,55,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div className="animate-fade-in" style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.25rem' }}>Registrar Costo</h3>
              <button onClick={() => setShowForm(false)} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Descripción del gasto *</label>
                <input className="input-field" placeholder="Ej: Cloro para alberca" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="label">Monto (MXN) *</label>
                  <input className="input-field" type="number" placeholder="0.00" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Fecha *</label>
                  <input className="input-field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Categoría</label>
                <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Proveedor</label>
                <input className="input-field" placeholder="Nombre del proveedor" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} />
              </div>
              <div>
                <label className="label">Notas adicionales</label>
                <textarea className="input-field" rows={2} placeholder="Detalles adicionales…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '13px', fontSize: '0.9375rem' }}>
                {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : '✅ Registrar Costo'}
              </button>
            </form>
          </div>
        </div>
      )}
      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
