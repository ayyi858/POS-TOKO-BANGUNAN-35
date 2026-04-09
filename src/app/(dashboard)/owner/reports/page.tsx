import { createClient } from '@/lib/supabase/server'
import { ReportsClient } from './reports-client'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = await createClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, total, created_at')
    .order('created_at', { ascending: false })

  const { data: purchases } = await supabase
    .from('stock_purchases')
    .select('id, total_cost, created_at')
    .order('created_at', { ascending: false })

  const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.total), 0) || 0
  const totalExpenses = purchases?.reduce((sum, p) => sum + Number(p.total_cost), 0) || 0
  const netProfit = totalRevenue - totalExpenses

  const ledger = [
    ...(transactions || []).map(t => ({
      id: String((t as any).id),
      type: 'INCOME',
      amount: Number(t.total),
      date: t.created_at,
    })),
    ...(purchases || []).map(p => ({
      id: String((p as any).id),
      type: 'EXPENSE',
      amount: Number(p.total_cost),
      date: p.created_at,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const summaryCards = [
    {
      label: 'Total Pemasukan',
      sub: 'Penjualan Kasir POS',
      value: totalRevenue,
      prefix: '+',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: 'TrendingUp',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Total Pengeluaran',
      sub: 'Belanja Vendor / Restock',
      value: totalExpenses,
      prefix: '-',
      color: 'text-red-600',
      bg: 'bg-red-50',
      icon: 'TrendingDown',
      iconColor: 'text-red-600',
    },
    {
      label: 'Laba Bersih',
      sub: 'Arus Kas Operasional',
      value: netProfit,
      prefix: netProfit < 0 ? '-' : '',
      color: netProfit >= 0 ? 'text-zinc-900' : 'text-red-600',
      bg: 'bg-zinc-100',
      icon: 'Wallet',
      iconColor: 'text-zinc-600',
    },
  ]

  return (
    <ReportsClient
      ledger={ledger}
      summaryCards={summaryCards}
      totalRevenue={totalRevenue}
      totalExpenses={totalExpenses}
      netProfit={netProfit}
    />
  )
}
