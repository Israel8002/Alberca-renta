import { createClient } from '@/lib/supabase/client'
import { Reservation, ReservationStatus, TimeSlot } from '@/types'
import { isWeekend } from 'date-fns'

const supabase = createClient()

export function getTimeSlot(date: Date): TimeSlot {
  const day = date.getDay()
  return day === 0 || day === 6 ? 'fin_de_semana' : 'lunes_viernes'
}

export async function getReservationsByMonth(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('reservations')
    .select('id, date, status, user_name, user_whatsapp, time_slot, total_amount, deposit_amount, abono_amount, validated_by_admin, proof_urls')
    .gte('date', start)
    .lt('date', end)
    .neq('status', 'cancelado')

  if (error) throw error
  return data || []
}

export async function getAllReservations() {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, profiles(name, whatsapp, role)')
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getReservationById(id: string) {
  const { data, error } = await supabase
    .from('reservations')
    .select('*, profiles(name, whatsapp)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createReservation(payload: {
  user_id?: string
  user_name: string
  user_whatsapp: string
  date: string
  time_slot: TimeSlot
  total_amount: number
  deposit_amount: number
  promotion_id?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('reservations')
    .insert({ ...payload, created_by: user?.id, status: 'apartado' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateReservationStatus(id: string, status: ReservationStatus, note?: string) {
  const { data, error } = await supabase
    .from('reservations')
    .update({ status, admin_note: note })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateReservationPayment(id: string, params: {
  status?: ReservationStatus
  abono_amount?: number
  deposit_amount?: number
  validated_by_admin?: boolean
  admin_note?: string
}) {
  const { data, error } = await supabase
    .from('reservations')
    .update(params)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadProofAndUpdate(reservationId: string, file: File, existingUrls: string[]) {
  const fileName = `proofs/${reservationId}/${Date.now()}-${file.name}`
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('alberca-files')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('alberca-files')
    .getPublicUrl(fileName)

  const newUrls = [...existingUrls, publicUrl]

  const { data, error } = await supabase
    .from('reservations')
    .update({ proof_urls: newUrls })
    .eq('id', reservationId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteReservation(id: string) {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getMyReservations() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getPendingPayments() {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .in('status', ['apartado', 'abono'])
    .order('date', { ascending: true })

  if (error) throw error
  return data || []
}
