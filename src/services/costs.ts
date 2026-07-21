import { createClient } from '@/lib/supabase/client'
import { CostCategory } from '@/types'

const supabase = createClient()

export async function getAllCosts() {
  const { data, error } = await supabase
    .from('costs')
    .select('*, profiles(name)')
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createCost(payload: {
  title: string
  description?: string
  amount: number
  category: CostCategory
  provider?: string
  date: string
}) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('costs')
    .insert({ ...payload, added_by: user?.id })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadReceiptAndUpdate(costId: string, file: File, existingUrls: string[]) {
  const fileName = `receipts/${costId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from('alberca-files')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('alberca-files')
    .getPublicUrl(fileName)

  const newUrls = [...existingUrls, publicUrl]
  const { data, error } = await supabase
    .from('costs')
    .update({ receipt_urls: newUrls })
    .eq('id', costId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCost(id: string) {
  const { error } = await supabase.from('costs').delete().eq('id', id)
  if (error) throw error
}

export async function getCostsSummary() {
  const { data, error } = await supabase
    .from('costs')
    .select('amount, category, date')

  if (error) return { total: 0, byCategory: {} }

  const total = data.reduce((sum, c) => sum + (c.amount || 0), 0)
  const byCategory = data.reduce((acc: Record<string, number>, c) => {
    acc[c.category] = (acc[c.category] || 0) + (c.amount || 0)
    return acc
  }, {})

  return { total, byCategory }
}
