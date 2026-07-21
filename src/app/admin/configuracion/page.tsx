'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Upload, Trash2, Loader2, Plus, X, Image } from 'lucide-react'
import { updateSiteConfig, uploadCarouselImage } from '@/services/config'
import toast from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newAdminWa, setNewAdminWa] = useState('')
  const supabase = createClient()

  useEffect(() => { loadConfig() }, [])

  async function loadConfig() {
    setLoading(true)
    const { data } = await supabase.from('site_config').select('*').eq('id', 'main').single()
    setConfig(data || {})
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateSiteConfig(config)
      toast.success('Configuración guardada ✅')
    } catch { toast.error('Error al guardar') }
    setSaving(false)
  }

  const onDropCarousel = useCallback(async (files: File[]) => {
    setUploading(true)
    const urls: string[] = [...(config.carousel_images || [])]
    for (const file of files) {
      try {
        const url = await uploadCarouselImage(file)
        urls.push(url)
      } catch { toast.error(`Error subiendo ${file.name}`) }
    }
    setConfig((prev: any) => ({ ...prev, carousel_images: urls }))
    setUploading(false)
    toast.success('Imágenes subidas')
  }, [config.carousel_images])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCarousel,
    accept: { 'image/*': [] },
    multiple: true,
  })

  function removeCarouselImage(idx: number) {
    const imgs = [...(config.carousel_images || [])]
    imgs.splice(idx, 1)
    setConfig((prev: any) => ({ ...prev, carousel_images: imgs }))
  }

  function addAdminWa() {
    const cleaned = newAdminWa.replace(/\D/g, '')
    if (cleaned.length < 10) { toast.error('Número inválido'); return }
    const current = config.admin_whatsapp_numbers || []
    setConfig((prev: any) => ({ ...prev, admin_whatsapp_numbers: [...current, cleaned] }))
    setNewAdminWa('')
  }

  function removeAdminWa(idx: number) {
    const arr = [...(config.admin_whatsapp_numbers || [])]
    arr.splice(idx, 1)
    setConfig((prev: any) => ({ ...prev, admin_whatsapp_numbers: arr }))
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>Configuración</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Personaliza el sitio público y las notificaciones</p>
        </div>
        <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
          {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</> : <><Save size={16} /> Guardar Cambios</>}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Carrusel ── */}
        <section className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Image size={18} color="var(--color-primary)" /> Carrusel de Fotos
          </h2>
          <div {...getRootProps()} style={{ border: '2px dashed rgba(0,95,142,0.3)', borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', background: isDragActive ? '#E0F7FF' : '#F8FEFF', marginBottom: 16, transition: 'all 0.2s' }}>
            <input {...getInputProps()} />
            {uploading ? (
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            ) : (
              <>
                <Upload size={28} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Arrastra imágenes aquí</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>o haz clic para seleccionar · JPG, PNG, WebP</p>
              </>
            )}
          </div>
          {(config.carousel_images || []).length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {(config.carousel_images || []).map((url: string, i: number) => (
                <div key={i} style={{ position: 'relative', width: 100, height: 70 }}>
                  <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '2px solid rgba(0,95,142,0.15)' }} />
                  <button
                    onClick={() => removeCarouselImage(i)}
                    style={{ position: 'absolute', top: -6, right: -6, background: '#EF4444', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={11} color="white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Texto del inicio ── */}
        <section className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>📝 Texto de la Página de Inicio</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">Título principal</label>
              <input className="input-field" value={config.home_title || ''} onChange={e => setConfig({ ...config, home_title: e.target.value })} placeholder="Alberca Santo Niño" />
            </div>
            <div>
              <label className="label">Descripción</label>
              <textarea className="input-field" rows={3} value={config.home_description || ''} onChange={e => setConfig({ ...config, home_description: e.target.value })} placeholder="Descripción principal del negocio…" />
            </div>
            <div>
              <label className="label">Horarios (texto libre)</label>
              <textarea className="input-field" rows={3} value={config.home_schedule || ''} onChange={e => setConfig({ ...config, home_schedule: e.target.value })} placeholder="Lunes a Viernes: 12:00 PM – 12:00 AM&#10;Sábado y Domingo: 12:00 PM – 1:00 AM" />
            </div>
            <div>
              <label className="label">Descripción de precios (texto libre)</label>
              <textarea className="input-field" rows={3} value={config.home_prices || ''} onChange={e => setConfig({ ...config, home_prices: e.target.value })} placeholder="Describe los precios para los clientes…" />
            </div>
            <div>
              <label className="label">Información adicional</label>
              <textarea className="input-field" rows={3} value={config.home_additional_info || ''} onChange={e => setConfig({ ...config, home_additional_info: e.target.value })} placeholder="Capacidad, reglas, estacionamiento, etc." />
            </div>
          </div>
        </section>

        {/* ── Precios base ── */}
        <section className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>💰 Precios Base (MXN)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div>
              <label className="label">Precio Lunes–Viernes</label>
              <input className="input-field" type="number" step="0.01" value={config.weekday_price || ''} onChange={e => setConfig({ ...config, weekday_price: parseFloat(e.target.value) })} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Precio Sábado–Domingo</label>
              <input className="input-field" type="number" step="0.01" value={config.weekend_price || ''} onChange={e => setConfig({ ...config, weekend_price: parseFloat(e.target.value) })} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Monto de Apartado</label>
              <input className="input-field" type="number" step="0.01" value={config.deposit_amount || ''} onChange={e => setConfig({ ...config, deposit_amount: parseFloat(e.target.value) })} placeholder="0.00" />
            </div>
          </div>
        </section>

        {/* ── Instrucciones de pago ── */}
        <section className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>🏦 Instrucciones de Pago</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>Este texto se incluye en los mensajes de WhatsApp y se muestra en el detalle de fecha del calendario.</p>
          <textarea className="input-field" rows={5} value={config.payment_info || ''} onChange={e => setConfig({ ...config, payment_info: e.target.value })} placeholder="Ej:&#10;CLABE: 1234 5678 9012 3456&#10;Banco: BBVA&#10;A nombre de: Juan García&#10;Concepto: Reservación Alberca Santo Niño [TU NOMBRE]" />
        </section>

        {/* ── WhatsApp de admins ── */}
        <section className="card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>📱 Números de WhatsApp (Admins)</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>Las notificaciones de nuevas solicitudes se enviarán a estos números.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {(config.admin_whatsapp_numbers || []).map((num: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F0FAFF', borderRadius: 10, border: '1px solid rgba(0,95,142,0.1)' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>📱 +52 {num}</span>
                <button onClick={() => removeAdminWa(i)} style={{ background: '#FEE2E2', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}>
                  <Trash2 size={14} color="#EF4444" />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input-field" placeholder="Número (10 dígitos, sin código de país)" value={newAdminWa} onChange={e => setNewAdminWa(e.target.value)} style={{ flex: 1 }} />
            <button onClick={addAdminWa} className="btn-primary" style={{ padding: '12px 16px', borderRadius: 12, flexShrink: 0 }}>
              <Plus size={16} />
            </button>
          </div>
        </section>

      </div>

      <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
