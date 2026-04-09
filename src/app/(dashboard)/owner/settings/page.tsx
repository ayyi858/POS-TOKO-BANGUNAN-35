import { getSettings } from '@/actions/settings'
import { SettingsClient } from './settings-client'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const initialSettings = await getSettings()

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Pengaturan Sistem</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Konfigurasi notifikasi WhatsApp dan sinkronisasi eksternal.</p>
      </div>

      <SettingsClient initialSettings={initialSettings} />
    </div>
  )
}
