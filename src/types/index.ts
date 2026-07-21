export type UserRole = 'superadmin' | 'admin' | 'cliente'
export type ReservationStatus = 'apartado' | 'abono' | 'pagado' | 'cancelado'
export type TimeSlot = 'lunes_viernes' | 'fin_de_semana'
export type EventType = 'promotion' | 'maintenance' | 'holiday' | 'special'
export type CostCategory = 'mantenimiento' | 'compras' | 'proveedores' | 'servicios' | 'otros'

export interface Profile {
  id: string
  name: string
  whatsapp: string | null
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Reservation {
  id: string
  user_id: string | null
  user_name: string
  user_whatsapp: string
  date: string
  time_slot: TimeSlot
  status: ReservationStatus
  total_amount: number
  deposit_amount: number
  abono_amount: number
  proof_urls: string[]
  validated_by_admin: boolean
  promotion_id: string | null
  admin_note: string | null
  created_by: string | null
  created_at: string
  profiles?: Profile
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  date: string
  end_date: string | null
  type: EventType
  special_price: number | null
  discount_percent: number | null
  image_url: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
}

export interface Cost {
  id: string
  title: string
  description: string | null
  amount: number
  category: CostCategory
  provider: string | null
  receipt_urls: string[]
  date: string
  added_by: string | null
  created_at: string
  profiles?: Profile
}

export interface SiteConfig {
  id: string
  carousel_images: string[]
  home_title: string
  home_description: string
  home_schedule: string
  home_prices: string
  home_additional_info: string
  weekday_price: number
  weekend_price: number
  deposit_amount: number
  admin_whatsapp_numbers: string[]
  payment_info: string
  pool_capacity: number
  updated_at: string
}

export interface DayInfo {
  date: string
  reservation: Reservation | null
  event: CalendarEvent | null
  isAvailable: boolean
  price: number
  timeSlot: TimeSlot
}

export interface WhatsAppMessage {
  phone: string
  message: string
}
