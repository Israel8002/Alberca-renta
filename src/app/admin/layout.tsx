import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    redirect('/')
  }

  return (
    <div className="admin-layout-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AdminSidebar role={profile.role} />
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {/* Top bar (Desktop only) */}
        <div
          className="admin-topbar-desktop"
          style={{
            padding: '14px 28px',
            background: 'white',
            borderBottom: '1px solid rgba(0,95,142,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 14px',
              background: 'var(--color-bg)',
              borderRadius: 999,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #005F8E, #00B4D8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              {profile.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.2 }}>{profile.name}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{profile.role}</p>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="admin-main-content">
          {children}
        </div>
      </main>
    </div>
  )
}
