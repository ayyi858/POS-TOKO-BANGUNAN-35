'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getActiveShift(userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('shifts').select('*').eq('user_id', userId).eq('is_active', true).single()
    return data || null
}

export async function getLatestShift(userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase.from('shifts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single()
    return data || null
}

export async function openShift(userId: string, initialCash: number) {
    const supabase = await createClient()
    
    // Validasi adakah shift aktif
    const active = await getActiveShift(userId)
    if (active) throw new Error("Masih ada shift yang aktif!")

    const { data, error } = await supabase.from('shifts').insert([{
        user_id: userId,
        initial_cash: initialCash,
        is_active: true,
        status: null // starts without status
    }]).select().single()

    if (error) throw new Error("Gagal membuka shift: " + error.message)

    revalidatePath('/kasir', 'layout')
    return data
}

export async function closeShift(shiftId: string, actualCash: number) {
  const supabase = await createClient()
  
  // 1. Ambil data shift dan total transaksi selama shift ini
  const { data: shift, error: shiftError } = await supabase.from('shifts').select('*').eq('id', shiftId).single()
  if (shiftError || !shift) throw new Error("Shift tidak ditemukan")

  const { data: transactions } = await supabase.from('transactions').select('total').eq('shift_id', shiftId)
  
  const totalSales = transactions?.reduce((sum, trx) => sum + Number(trx.total), 0) || 0
  const expectedCash = Number(shift.initial_cash) + totalSales
  const difference = actualCash - expectedCash
  
  let status = 'AMAN'
  if (difference < 0) status = 'MINUS'
  if (difference > 0) status = 'LEBIH'
  
  // 2. Update Shift
  const { error } = await supabase.from('shifts').update({
    end_time: new Date().toISOString(),
    expected_cash: expectedCash,
    actual_cash: actualCash,
    difference,
    status,
    is_active: false
  }).eq('id', shiftId)
  
  if (error) throw new Error("Gagal menutup shift: " + error.message)
  
  // 3. Buat entri deposit awal (BELUM_SETOR)
  await supabase.from('deposits').insert([{
    shift_id: shiftId,
    amount: actualCash,
    status: 'BELUM_SETOR'
  }])
  
  revalidatePath('/kasir', 'layout')
  return { success: true, difference, status }
}

export async function submitDeposit(shiftId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('deposits').update({
        status: 'SUDAH_SETOR',
        created_at: new Date().toISOString()
    }).eq('shift_id', shiftId)
    
    if (error) throw new Error("Setoran gagal diproses")
    revalidatePath('/kasir/setoran')
    return { success: true }
}
