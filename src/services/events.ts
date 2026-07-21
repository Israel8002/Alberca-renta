import { createClient } from '@/lib/supabase/client'
import { CalendarEvent, EventType } from '@/types'

const supabase = createClient()

export async function getEventsByMonth(year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const end = `${year}-${String(month + 1).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .lte('date', end)
    .gte('end_date', start)
    .eq('is_active', true)
    .order('date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getAllEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getEventForDate(dateStr: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .lte('date', dateStr)
    .gte('end_date', dateStr)
    .eq('is_active', true)
    .maybeSingle()

  if (error) return null
  return data
}

export async function createEvent(payload: {
  title: string
  description?: string
  date: string
  end_date: string
  type: EventType
  special_price?: number
  discount_percent?: number
  image_url?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('events')
    .insert({ ...payload, created_by: user?.id, is_active: true })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEvent(id: string, payload: Partial<CalendarEvent>) {
  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) throw error
}
