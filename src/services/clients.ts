import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types'

const supabase = createClient()

export async function getAllClients() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'cliente')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAllAdmins() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'superadmin'])
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateUserRole(userId: string, role: UserRole) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteUser(userId: string) {
  // Delete profile (auth user deletion requires admin SDK - just deactivate)
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', userId)

  if (error) throw error
}

export async function createAdminUser(email: string, password: string, name: string, whatsapp: string, role: 'admin' | 'superadmin' = 'admin') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, whatsapp, role }
    }
  })
  if (error) throw error
  return data
}

export async function getClientWithReservations(clientId: string) {
  const [profileRes, reservationsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', clientId).single(),
    supabase.from('reservations').select('*').eq('user_id', clientId).order('date', { ascending: false })
  ])

  return {
    profile: profileRes.data,
    reservations: reservationsRes.data || []
  }
}
