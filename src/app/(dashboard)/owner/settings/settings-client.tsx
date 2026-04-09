'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveSettings, sendFonntMessage } from '@/actions/settings'
import { toast } from 'sonner'
import { MessageCircle, Save } from 'lucide-react'

export function SettingsClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [token, setToken] = useState(initialSettings['fonnte_token'] || '')
  const [waNumber, setWaNumber] = useState(initialSettings['wa_reminder_number'] || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await saveSettings({
        'fonnte_token': token,
        'wa_reminder_number': waNumber
      })
      toast.success('Pengaturan berhasil disimpan')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    if (!token) return toast.error('Token Fonnte belum diisi.')
    if (!waNumber) return toast.error('Nomor WA tujuan belum diisi.')
    
    setIsTesting(true)
    try {
      await sendFonntMessage(
        waNumber, 
        '👋 Halo! Ini adalah pesan percobaan (Test Connection) dari Sistem POS Inventory TB Tiga Lima.'
      )
      toast.success('Pesan test berhasil dikirim. Silakan cek WhatsApp Anda.')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-white">
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-3">
           <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
             <MessageCircle className="w-5 h-5 text-emerald-600" />
           </div>
           <div>
             <h3 className="text-base font-bold text-zinc-900">Integrasi Fonnte (WhatsApp API)</h3>
             <p className="text-xs text-zinc-500 mt-0.5">Atur token API dan target nomor untuk pengiriman notifikasi/reminder pengadaan barang.</p>
           </div>
        </div>
        
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Fonnte API Token</label>
              <Input 
                value={token} 
                onChange={(e) => setToken(e.target.value)} 
                type="password"
                placeholder="Paste API Token dari app.fonnte.com"
                className="h-11 rounded-lg border-zinc-200 bg-zinc-50 text-sm focus-visible:ring-zinc-900"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Dapatkan token di halaman pengaturan <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Fonnte.com</a>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Nomor WhatsApp Tujuan Reminder</label>
              <Input 
                value={waNumber} 
                onChange={(e) => setWaNumber(e.target.value)} 
                placeholder="Contoh: 08123456789 (Tanpa + atau 62)"
                className="h-11 rounded-lg border-zinc-200 bg-zinc-50 text-sm focus-visible:ring-zinc-900"
              />
              <p className="text-[10px] text-zinc-400 mt-1">Sistem Fonnte akan otomatis menyesuaikan kode negara berdasarkan setting region Anda (default 62/ID).</p>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-zinc-100">
              <Button 
                type="submit" 
                disabled={isSaving}
                className="h-10 px-5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={isTesting || !token || !waNumber}
                className="h-10 px-5 rounded-lg text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 border-zinc-200 text-sm font-medium"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {isTesting ? 'Mengirim test...' : 'Test Pengiriman WA'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 flex gap-3">
         <div className="text-amber-800 font-medium text-sm">
           <strong>Catatan Fonnte:</strong> Jika notifikasi tidak masuk meski test sukses, pastikan device/nomor sender di dashboard Fonnte dalam keadaan <em>Connected</em>.
         </div>
      </div>
    </div>
  )
}
