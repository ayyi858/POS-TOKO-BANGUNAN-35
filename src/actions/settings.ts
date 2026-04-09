'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSettings() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('app_settings').select('*')
  
  if (error) {
    console.error('Error fetching settings:', error)
    return {}
  }
  
  const settingsObj: Record<string, string> = {}
  data.forEach((row: any) => {
    settingsObj[row.key] = row.value
  })
  
  return settingsObj
}

export async function saveSettings(settings: Record<string, string>) {
  const supabase = await createClient()
  
  const entries = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
  }))

  // The upsert here depends on the 'key' being the primary key in app_settings table
  const { error } = await supabase
    .from('app_settings')
    .upsert(entries, { onConflict: 'key' })

  if (error) {
    console.error('Save Settings Error:', error)
    throw new Error('Gagal menyimpan pengaturan')
  }

  return true
}

export async function sendFonntMessage(target: string, message: string) {
  const settings = await getSettings()
  const token = settings['fonnte_token']

  if (!token) {
     throw new Error('Token Fonnte belum dikonfigurasi di Pengaturan.')
  }

  if (!target) {
     throw new Error('Nomor tujuan WA tidak valid.')
  }

  try {
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target,
        message,
        delay: '2',
        countryCode: '62'
      }),
    })

    const resData = await response.json()
    
    if (!resData.status) {
      throw new Error(resData.reason || 'Gagal mengirim pesan via Fonnte')
    }

    return resData
  } catch (err: any) {
    console.error('Fonnte Send Error:', err)
    throw new Error(err.message || 'Error saat menghubungi Fonnte API')
  }
}
