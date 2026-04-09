import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShoppingCart, Clock, ArrowRight, PackageX } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function KasirDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: activeShift } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .single()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, items:transaction_items(qty, products(name))')
    .eq('shift_id', activeShift?.id ?? '')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Beranda Kasir</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Selamat datang! Kelola transaksi dan sesi kerja Anda.</p>
        </div>
        {activeShift ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Shift Aktif
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-100 text-zinc-500 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Tidak Ada Shift
          </span>
        )}
      </div>

      {/* Shift Card */}
      <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
            <Clock className="w-4 h-4 text-zinc-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Sesi Kerja</p>
            <p className="text-xs text-zinc-400">Status dan kontrol shift harian</p>
          </div>
        </div>

        <div className="p-6">
          {activeShift ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Mulai Shift</p>
                  <p className="text-sm font-bold text-zinc-900">
                    {new Date(activeShift.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {new Date(activeShift.start_time).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Modal Awal</p>
                  <p className="text-sm font-bold text-zinc-900">
                    Rp {Number(activeShift.initial_cash).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                  <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Jumlah Trx</p>
                  <p className="text-sm font-bold text-zinc-900">{transactions?.length || 0} Trx</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Link
                  href="/kasir/transaction"
                  className={buttonVariants({ size: 'default' }) + ' flex-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm h-12'}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buka POS Kasir
                </Link>
                <Link
                  href="/kasir/shift"
                  className={buttonVariants({ variant: 'outline', size: 'default' }) + ' rounded-xl text-sm border-zinc-200 font-semibold h-12 px-6'}
                >
                  Tutup Shift
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-sm text-amber-800 leading-relaxed">
                <strong>Belum ada sesi aktif.</strong> Buka shift terlebih dahulu sebelum memulai transaksi kasir hari ini.
              </div>
              <Link
                href="/kasir/shift"
                className={buttonVariants({ size: 'default' }) + ' w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm h-12'}
              >
                Mulai Buka Shift
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History — tanpa total (pendapatan hanya terlihat saat tutup shift) */}
      {activeShift && (
        <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Riwayat Transaksi Shift Ini</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Total pendapatan & ringkasan tersedia saat tutup shift.</p>
            </div>
            <Link
              href="/kasir/transaction"
              className="flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 rounded-lg transition-colors border border-zinc-100"
            >
              POS <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {transactions && transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-50 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-zinc-400 pl-6">Waktu</TableHead>
                  <TableHead className="text-xs font-semibold text-zinc-400">Item Terjual</TableHead>
                  <TableHead className="text-xs font-semibold text-zinc-400 text-right pr-6">Jml Barang</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(trx => {
                  const items = (trx.items as any[]) || []
                  const totalQty = items.reduce((sum: number, item: any) => sum + item.qty, 0)
                  const names = items.slice(0, 2).map((i: any) => i.products?.name).filter(Boolean).join(', ')
                  return (
                    <TableRow key={trx.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="pl-6 font-medium text-sm text-zinc-700">
                        {new Date(trx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-500 max-w-[200px] truncate">
                        {names || '—'}{items.length > 2 ? ` +${items.length - 2} lainnya` : ''}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <span className="text-xs font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded-md">{totalQty} pcs</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-16 text-center">
              <PackageX className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-500">Belum ada transaksi</p>
              <p className="text-xs text-zinc-400 mt-0.5">Semua transaksi shift ini akan tersimpan di sini.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
