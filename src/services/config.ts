import { createClient } from '@/lib/supabase/client'
import { SiteConfig } from '@/types'

const supabase = createClient()

export async function getSiteConfig(): Promise<Partial<SiteConfig>> {
  const { data, error } = await supabase
    .from('site_config')
    .select('*')
    .eq('id', 'main')
    .single()

  if (error) return {}
  return data
}

export async function updateSiteConfig(updates: Partial<SiteConfig>) {
  const { data, error } = await supabase
    .from('site_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', 'main')
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadCarouselImage(file: File): Promise<string> {
  const fileName = `carousel/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('alberca-files')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('alberca-files')
    .getPublicUrl(fileName)

  return publicUrl
}

export async function deleteCarouselImage(url: string) {
  // Extract path from URL
  const path = url.split('/alberca-files/')[1]
  if (!path) return
  await supabase.storage.from('alberca-files').remove([path])
}

export async function getPriceForDate(dateStr: string, config: Partial<SiteConfig>): Promise<number> {
  const date = new Date(dateStr + 'T12:00:00')
  const day = date.getDay()
  const isWeekendDay = day === 0 || day === 6

  // Check events for special price on this date
  const { data: events } = await supabase
    .from('events')
    .select('special_price, discount_percent, type')
    .lte('date', dateStr)
    .gte('end_date', dateStr)
    .eq('is_active', true)

  if (events && events.length > 0) {
    const specialEvent = events.find(e => e.special_price)
    if (specialEvent?.special_price) return specialEvent.special_price
  }

  return isWeekendDay
    ? (config.weekend_price || 0)
    : (config.weekday_price || 0)
}
