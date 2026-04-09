import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { DollarSign, PackageOpen, AlertTriangle, Truck, Info, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function OwnerDashboard() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  
  const { data: transactions } = await supabase
    .from('transactions')
    .select('total, created_at')
    .gte('created_at', `${today}T00:00:00Z`)

  const totalSalesToday = transactions?.reduce((sum, trx) => sum + Number(trx.total), 0) || 0

  const { data: products } = await supabase.from('products').select('*')
  const reorderProducts = products?.filter(p => p.stock <= p.min_stock) || []
  
  const { data: supplierProducts } = await supabase.from('supplier_products').select('*, suppliers(name)')

  const reorderAlerts = reorderProducts.map(p => {
    const vendors = supplierProducts?.filter(sp => sp.product_id === p.id) || []
    const cheapestVendor = vendors.sort((a, b) => Number(a.cost_price) - Number(b.cost_price))[0]
    const targetStock = p.min_stock * 3
    const recommendedQty = Math.max(1, targetStock - p.stock)
    return { ...p, cheapestVendor, recommendedQty }
  })

  const { data: shiftsMinus } = await supabase
    .from('shifts')
    .select('*, users(name)')
    .eq('status', 'MINUS')

  const stats = [
    {
      label: 'Penjualan Hari Ini',
      value: `Rp ${totalSalesToday.toLocaleString('id-ID')}`,
      sub: `${transactions?.length || 0} transaksi`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Stok Perlu Reorder',
      value: `${reorderProducts.length}`,
      sub: 'produk menipis',
      icon: PackageOpen,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Kasir Minus',
      value: `${shiftsMinus?.length || 0}`,
      sub: 'shift berselisih',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Total Produk',
      value: `${products?.length || 0}`,
      sub: 'item di katalog',
      icon: Truck,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Dashboard</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Laporan harian dan status inventori toko.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl border border-zinc-100 p-5 flex items-start gap-4">
              <div className={`${s.bg} p-2.5 rounded-lg shrink-0`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-500 truncate">{s.label}</p>
                <p className="text-2xl font-bold text-zinc-900 mt-0.5 leading-none">{s.value}</p>
                <p className="text-xs text-zinc-400 mt-1">{s.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Reorder Alert */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Sistem Reorder Cerdas</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Stok habis dicarikan vendor termurah otomatis.</p>
            </div>
            {reorderAlerts.length > 0 && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                {reorderAlerts.length} item
              </span>
            )}
          </div>

          {reorderAlerts.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-sm font-medium text-zinc-700">Semua stok aman</p>
              <p className="text-xs text-zinc-400">Tidak ada produk yang perlu direorder.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {reorderAlerts.map(alert => (
                <div key={alert.id} className="px-6 py-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-zinc-50/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-zinc-900 truncate">{alert.name}</h4>
                      <Badge className="bg-red-50 text-red-600 border-0 text-[10px] px-1.5 py-0 rounded font-semibold shrink-0">
                        Sisa {alert.stock}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Min. {alert.min_stock} · Rekomendasi beli:{' '}
                      <span className="font-semibold text-zinc-600">{alert.recommendedQty} pcs</span>
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-lg px-4 py-3 w-full sm:w-56 shrink-0">
                    {alert.cheapestVendor ? (
                      <>
                        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">Vendor Termurah</p>
                        <p className="text-sm font-semibold text-zinc-900 truncate">
                          {(alert.cheapestVendor.suppliers as any)?.name}
                        </p>
                        <p className="text-base font-bold text-emerald-600 mt-0.5">
                          Rp {Number(alert.cheapestVendor.cost_price).toLocaleString('id-ID')}
                          <span className="text-xs text-zinc-400 font-normal"> /pc</span>
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        Belum ada vendor terhubung
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {reorderAlerts.length > 0 && (
            <div className="px-6 py-3 border-t border-zinc-100 flex items-center justify-between">
              <p className="text-xs text-zinc-400">Lakukan pembelian via menu vendor.</p>
              <Link href="/owner/suppliers" className="flex items-center gap-1 text-xs font-semibold text-zinc-900 hover:text-zinc-600 transition-colors">
                Kelola Vendor <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Kasir Minus */}
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h3 className="text-sm font-semibold text-zinc-900">Catatan Kasir Minus</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Selisih nominal dari shift ditutup.</p>
          </div>
          <div className="divide-y divide-zinc-50">
            {!shiftsMinus || shiftsMinus.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-zinc-600">Nihil</p>
                <p className="text-xs text-zinc-400 mt-1">Kinerja kasir hari ini sangat baik.</p>
              </div>
            ) : (
              shiftsMinus.map(s => (
                <div key={s.id} className="px-5 py-3.5 hover:bg-zinc-50/50 transition-colors">
                  <p className="text-sm font-semibold text-zinc-900">{(s.users as any)?.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] text-zinc-400 font-medium">
                      {new Date(s.end_time).toLocaleString('id-ID')}
                    </p>
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                      −Rp {Number(s.difference).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
