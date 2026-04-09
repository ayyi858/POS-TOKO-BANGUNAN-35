'use client'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendingUp, TrendingDown, Wallet, Activity, FileDown, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type LedgerItem = { id: string; type: string; amount: number; date: string }
type SummaryCard = { label: string; sub: string; value: number; prefix: string; color: string; bg: string; icon: string; iconColor: string }

const ICONS: Record<string, any> = {
  TrendingUp,
  TrendingDown,
  Wallet,
}

export function ReportsClient({
  ledger,
  summaryCards,
  totalRevenue,
  totalExpenses,
  netProfit,
}: {
  ledger: LedgerItem[]
  summaryCards: SummaryCard[]
  totalRevenue: number
  totalExpenses: number
  netProfit: number
}) {

  const handleExcelDownload = () => {
    const rows = ledger.map(item => ([
      new Date(item.date).toLocaleString('id-ID'),
      item.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
      item.amount,
    ]))

    const ws = XLSX.utils.aoa_to_sheet([
      ['Laporan Keuangan - Toko Bangunan 35'],
      [],
      ['Ringkasan'],
      ['Total Pemasukan', totalRevenue],
      ['Total Pengeluaran', totalExpenses],
      ['Laba Bersih', netProfit],
      [],
      ['Tanggal & Waktu', 'Keterangan', 'Nominal'],
      ...rows,
    ])
    ws['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 18 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
    XLSX.writeFile(wb, `laporan_keuangan_${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.success('Laporan Excel berhasil diunduh')
  }

  const handlePDFDownload = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('LAPORAN KEUANGAN', 14, 18)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Toko Bangunan 35', 14, 25)
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 30)

    // Summary
    autoTable(doc, {
      startY: 36,
      head: [['Keterangan', 'Nominal']],
      body: [
        ['Total Pemasukan', `Rp ${totalRevenue.toLocaleString('id-ID')}`],
        ['Total Pengeluaran', `Rp ${totalExpenses.toLocaleString('id-ID')}`],
        ['Laba Bersih', `Rp ${netProfit.toLocaleString('id-ID')}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 30, 30] },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    })

    const finalY1 = (doc as any).lastAutoTable.finalY || 60
    // Ledger
    autoTable(doc, {
      startY: finalY1 + 8,
      head: [['Tanggal & Waktu', 'Keterangan', 'Nominal']],
      body: ledger.map(item => [
        new Date(item.date).toLocaleString('id-ID'),
        item.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
        `${item.type === 'INCOME' ? '+' : '-'} Rp ${item.amount.toLocaleString('id-ID')}`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 30, 30] },
      columnStyles: { 2: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    })

    doc.save(`laporan_keuangan_${new Date().toISOString().slice(0, 10)}.pdf`)
    toast.success('Laporan PDF berhasil diunduh')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Laporan Keuangan</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Metrik finansial dan buku besar arus kas toko.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={handleExcelDownload} className="h-9 rounded-lg border-zinc-200 text-xs font-semibold">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Excel
          </Button>
          <Button variant="outline" onClick={handlePDFDownload} className="h-9 rounded-lg border-zinc-200 text-xs font-semibold">
            <FileDown className="w-3.5 h-3.5 mr-1.5 text-red-500" /> PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = ICONS[card.icon as string] || Activity
          return (
            <div key={card.label} className="bg-white rounded-xl border border-zinc-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{card.label}</p>
                <div className={`${card.bg} p-2 rounded-lg`}>
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>
                {card.prefix}Rp {Math.abs(card.value).toLocaleString('id-ID')}
              </p>
              <p className="text-xs text-zinc-400 mt-1.5">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Buku Besar (Ledger)</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Kronologi uang masuk dan uang keluar.</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
            <Activity className="w-4 h-4 text-zinc-600" />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-zinc-50 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-zinc-400 pl-6 w-48">Tanggal &amp; Waktu</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400">Keterangan</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400 text-right pr-6">Nominal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-sm text-zinc-400">
                  Belum ada pergerakan kas.
                </TableCell>
              </TableRow>
            ) : (
              ledger.map((item, i) => (
                <TableRow key={item.id + i} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <TableCell className="text-xs text-zinc-500 pl-6 font-medium">
                    {new Date(item.date).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell>
                    {item.type === 'INCOME' ? (
                      <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                        Transaksi Penjualan
                      </span>
                    ) : (
                      <span className="text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded-lg">
                        Restock / Kulakan
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={`text-right pr-6 font-bold text-sm ${item.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {item.type === 'INCOME' ? '+' : '-'} Rp {item.amount.toLocaleString('id-ID')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
