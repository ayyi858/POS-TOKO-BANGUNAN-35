'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { getActiveShift, openShift, closeShift, getLatestShift } from '@/actions/shift'
import { toast } from 'sonner'
import { Clock, CheckCircle2, AlertCircle, TrendingUp, Wallet, Receipt } from 'lucide-react'

export default function ShiftPage() {
  const [activeShift, setActiveShift] = useState<any>(null)
  const [latestShift, setLatestShift] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cash, setCash] = useState<string>('')
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    const fetchShift = async () => {
      const res = await fetch('/api/auth/me')
      const user = await res.json()
      if (user?.id) {
        setUserId(user.id)
        const shift = await getActiveShift(user.id)
        setActiveShift(shift)
        if (!shift) {
          const last = await getLatestShift(user.id)
          setLatestShift(last)
        }
      }
      setLoading(false)
    }
    fetchShift()
  }, [])

  const handleOpenShift = async () => {
    if (!cash) return toast.error('Masukkan modal awal!')
    try {
      setLoading(true)
      await openShift(userId, Number(cash))
      toast.success('Shift berhasil dibuka!')
      window.location.reload()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseShift = async () => {
    if (!cash) return toast.error('Masukkan jumlah uang fisik di laci!')
    try {
      setLoading(true)
      const res = await closeShift(activeShift.id, Number(cash))
      let alertMsg = 'Shift ditutup.'
      if (res.status === 'MINUS') alertMsg = `⚠️ Kasir MINUS Rp ${Math.abs(res.difference).toLocaleString('id-ID')}`
      if (res.status === 'LEBIH') alertMsg = `✅ Kasir LEBIH Rp ${res.difference.toLocaleString('id-ID')}`
      if (res.status === 'AMAN') alertMsg = '✅ Uang Kasir AMAN sesuai total sistem.'
      toast(alertMsg)
      window.location.reload()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Manajemen Shift</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Buka atau tutup sesi kerja kasir harian.</p>
      </div>

      {!activeShift ? (
        /* ===== BUKA SHIFT ===== */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">Buka Shift Baru</p>
                <p className="text-xs text-zinc-400">Masukkan modal awal laci/kas sebelum memulai transaksi</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Modal Awal Kas (Rp)</label>
                <Input
                  type="number"
                  value={cash}
                  onChange={e => setCash(e.target.value)}
                  placeholder="100000"
                  className="h-12 rounded-xl border-zinc-200 bg-zinc-50 text-base font-bold focus-visible:ring-zinc-900"
                />
              </div>
              <Button
                className="w-full h-12 rounded-xl bg-zinc-900 hover:bg-zinc-800 font-bold text-sm"
                onClick={handleOpenShift}
                disabled={loading}
              >
                Buka Shift Sekarang
              </Button>
            </div>
          </div>

          {/* Ringkasan shift terakhir untuk kasir */}
          {latestShift && (
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100">
                <p className="text-sm font-semibold text-zinc-900">Ringkasan Shift Terakhir</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {new Date(latestShift.end_time).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="px-6 py-5 grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Wallet className="w-3.5 h-3.5 text-zinc-500" />
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Modal Awal</p>
                  </div>
                  <p className="text-sm font-bold text-zinc-900">Rp {Number(latestShift.initial_cash).toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Total Penjualan</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">
                    Rp {(Number(latestShift.expected_cash) - Number(latestShift.initial_cash)).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Receipt className="w-3.5 h-3.5 text-zinc-500" />
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Uang Fisik</p>
                  </div>
                  <p className="text-sm font-bold text-zinc-900">Rp {Number(latestShift.actual_cash).toLocaleString('id-ID')}</p>
                </div>
                <div className={`rounded-xl p-4 border ${
                  latestShift.status === 'MINUS' ? 'bg-red-50 border-red-100' :
                  latestShift.status === 'LEBIH' ? 'bg-amber-50 border-amber-100' :
                  'bg-emerald-50 border-emerald-100'
                }`}>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Status</p>
                  <p className={`text-sm font-black ${
                    latestShift.status === 'MINUS' ? 'text-red-600' :
                    latestShift.status === 'LEBIH' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {latestShift.status}
                    {latestShift.difference !== 0 && (
                      <span className="text-xs font-semibold ml-1">
                        ({latestShift.difference > 0 ? '+' : ''}Rp {Number(latestShift.difference).toLocaleString('id-ID')})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ===== TUTUP SHIFT ===== */
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Shift Sedang Berjalan</p>
              <p className="text-xs text-zinc-400">
                Dibuka: {new Date(activeShift.start_time).toLocaleString('id-ID')}
              </p>
            </div>
            <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aktif
            </span>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">Modal Awal Shift</p>
              <p className="text-base font-bold text-zinc-900">Rp {Number(activeShift.initial_cash).toLocaleString('id-ID')}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Hitung Uang Fisik di Laci (Rp)
              </label>
              <Input
                type="number"
                value={cash}
                onChange={e => setCash(e.target.value)}
                placeholder="0"
                className="h-12 rounded-xl border-zinc-200 bg-zinc-50 text-base font-bold focus-visible:ring-zinc-900"
              />
            </div>

            <div className="flex items-start gap-2.5 bg-amber-50 rounded-xl p-4 border border-amber-100">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Sistem akan mencocokkan total transaksi + modal awal dengan uang fisik yang Anda masukkan. Hasil selisih (Aman/Minus/Lebih) akan langsung ditampilkan.
              </p>
            </div>

            <Button
              className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-sm text-white"
              onClick={handleCloseShift}
              disabled={loading}
            >
              Tutup Shift & Lihat Ringkasan
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
