import { createClient } from '@/lib/supabase/server'
import { Calendar, Users, CreditCard, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1, fontFamily: 'JetBrains Mono, monospace' }}>{value}</p>
        {sub && <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  )
}

function formatMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const today = new Date()
  const startMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { count: totalClients },
    { data: reservations },
    { data: pendingPayments },
    { data: upcomingReservations },
    { data: costs },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'cliente'),
    supabase.from('reservations').select('status, total_amount, deposit_amount, abono_amount, date, validated_by_admin').gte('date', startMonth),
    supabase.from('reservations').select('*, profiles(name, whatsapp)').in('status', ['apartado', 'abono']).eq('validated_by_admin', true).gte('date', today.toISOString().split('T')[0]).order('date', { ascending: true }).limit(5),
    supabase.from('reservations').select('*').gte('date', today.toISOString().split('T')[0]).neq('status', 'cancelado').order('date', { ascending: true }).limit(5),
    supabase.from('costs').select('amount').gte('date', startMonth),
  ])

  const totalIncome = (reservations || []).reduce((sum, r) => {
    if (!r.validated_by_admin && r.status !== 'pagado' && r.status !== 'abono') return sum
    const paid = (r.deposit_amount || 0) + (r.abono_amount || 0)
    return sum + (r.status === 'pagado' ? (r.total_amount || 0) : paid)
  }, 0)

  const totalCosts = (costs || []).reduce((sum, c) => sum + (c.amount || 0), 0)
  const pendingCount = (pendingPayments || []).length

  const statusLabel: Record<string, string> = {
    apartado: '🟡 Apartado',
    abono: '🔵 Abono',
    pagado: '✅ Pagado',
    cancelado: '❌ Cancelado',
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.75rem', fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
          Panel de Administración
        </h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Sistema Reservas v1.0 — {today.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard icon={Users} label="Clientes" value={totalClients || 0} color="#005F8E" />
        <StatCard icon={TrendingUp} label="Ingresos validados" value={formatMXN(totalIncome)} color="#059669" sub="Anticipos y abonos validados" />
        <StatCard icon={CreditCard} label="Costos del mes" value={formatMXN(totalCosts)} color="#EF4444" />
        <StatCard icon={AlertCircle} label="Pagos pendientes" value={pendingCount} color="#F59E0B" sub="Validados pendientes de liquidar" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Próximas reservaciones */}
        <div className="card">
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--color-primary)" />
            Próximas Reservaciones
          </h3>
          {(upcomingReservations || []).length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px 0' }}>No hay reservaciones próximas</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(upcomingReservations || []).map((r: any) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--color-bg)', borderRadius: 10 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.user_name}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span className={`badge badge-${r.status}`}>{statusLabel[r.status] || r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagos pendientes */}
        <div className="card">
          <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} color="#F59E0B" />
            Pagos Pendientes Validados
          </h3>
          {(pendingPayments || []).length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', color: '#059669' }}>
              <CheckCircle size={32} style={{ marginBottom: 8 }} />
              <p style={{ fontWeight: 600 }}>¡Todo al corriente!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(pendingPayments || []).map((r: any) => {
                const paid = (r.deposit_amount || 0) + (r.abono_amount || 0)
                const pending = Math.max(0, (r.total_amount || 0) - paid)
                return (
                  <div key={r.id} style={{ padding: '10px 12px', background: '#FFFBEB', borderRadius: 10, borderLeft: '3px solid #F59E0B' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.user_name}</p>
                      <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400E', fontFamily: 'monospace' }}>
                        {formatMXN(pending)}
                      </p>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      {new Date(r.date + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' · '}{r.user_whatsapp}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
