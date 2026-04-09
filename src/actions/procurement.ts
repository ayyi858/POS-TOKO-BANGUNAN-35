'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendFonntMessage, getSettings } from './settings'

export async function getProcurementSchedules() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('procurement_schedules')
    .select(`*, products (name), suppliers (name)`)
    .order('scheduled_date', { ascending: true })
    
  if (error) {
    console.error("Error fetching schedules:", error)
    return []
  }
  return data
}

export async function createSchedule(data: {
   product_id: string
   supplier_id: string
   scheduled_date: string
   reminder_time?: string   // e.g. "08:00"
   qty: number
   notes?: string
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('procurement_schedules')
    .insert({
       product_id: data.product_id,
       supplier_id: data.supplier_id,
       scheduled_date: data.scheduled_date,
       reminder_time: data.reminder_time || '08:00',
       qty: data.qty,
       notes: data.notes || '',
       status: 'UPCOMING'
    })

  if (error) throw new Error(error.message)
  revalidatePath('/owner/procurement')
  return true
}

export async function updateScheduleStatus(id: string, status: 'UPCOMING' | 'DONE' | 'OVERDUE') {
   const supabase = await createClient()
  
   const { error } = await supabase
     .from('procurement_schedules')
     .update({ status })
     .eq('id', id)
 
   if (error) throw new Error(error.message)
   revalidatePath('/owner/procurement')
   return true
}

export async function deleteSchedule(id: string) {
    const supabase = await createClient()
   
    const { error } = await supabase
      .from('procurement_schedules')
      .delete()
      .eq('id', id)
  
    if (error) throw new Error(error.message)
    revalidatePath('/owner/procurement')
    return true
 }

export async function updateSchedule(id: string, data: {
   product_id?: string
   supplier_id?: string
   scheduled_date?: string
   reminder_time?: string
   qty?: number
   notes?: string
}) {
   const supabase = await createClient()
  
   const { error } = await supabase
     .from('procurement_schedules')
     .update(data)
     .eq('id', id)
 
   if (error) throw new Error(error.message)
   revalidatePath('/owner/procurement')
   return true
}


export async function sendScheduleReminder(scheduleId: string) {
   const supabase = await createClient()

   const { data: schedule } = await supabase
     .from('procurement_schedules')
     .select(`*, products (name), suppliers (name)`)
     .eq('id', scheduleId)
     .single()
     
   if (!schedule) throw new Error('Data jadwal tidak ditemukan.')

   const settings = await getSettings()
   const waNumber = settings['wa_reminder_number']

   if (!waNumber) {
      throw new Error('Nomor WA pengingat belum dikonfigurasi di menu Pengaturan.')
   }

   const msg = buildReminderMessage(schedule)
   await sendFonntMessage(waNumber, msg)
   return true
}

/** 
 * Auto-send reminders for ALL schedules that are today and match current time (±5 min)
 * This should be called by a cron job or API route
 */
export async function checkAndSendAutoReminders() {
  const supabase = await createClient()
  const settings = await getSettings()
  const waNumber = settings['wa_reminder_number']
  if (!waNumber) return { sent: 0, reason: 'No WA number configured' }

  const todayStr = new Date().toISOString().slice(0, 10)
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()

  const { data: schedules } = await supabase
    .from('procurement_schedules')
    .select(`*, products (name), suppliers (name)`)
    .eq('scheduled_date', todayStr)
    .eq('status', 'UPCOMING')

  if (!schedules || schedules.length === 0) return { sent: 0 }

  let sent = 0
  for (const schedule of schedules) {
    const reminderTime = schedule.reminder_time || '08:00'
    const [rh, rm] = reminderTime.split(':').map(Number)
    const reminderMinutes = rh * 60 + rm

    // Send if current time is within ±5 minutes of scheduled reminder time
    if (Math.abs(nowMinutes - reminderMinutes) <= 5) {
      try {
        const msg = buildReminderMessage(schedule)
        await sendFonntMessage(waNumber, msg)
        sent++
      } catch (err) {
        console.error(`Gagal kirim reminder untuk schedule ${schedule.id}:`, err)
      }
    }
  }
  return { sent }
}

function buildReminderMessage(schedule: any) {
  return `🔔 *REMINDER PENGADAAN BARANG* 🔔\n\n` +
         `Jadwal: ${new Date(schedule.scheduled_date).toLocaleDateString('id-ID')}\n` +
         (schedule.reminder_time ? `Waktu: ${schedule.reminder_time} WIB\n` : '') +
         `Supplier: ${schedule.suppliers?.name || '-'}\n` +
         `Produk: ${schedule.products?.name || '-'}\n` +
         `Jumlah: ${schedule.qty} Pcs\n` +
         (schedule.notes ? `Catatan: ${schedule.notes}\n` : '') +
         `\n_Sistem POS & Inventori_`
}
