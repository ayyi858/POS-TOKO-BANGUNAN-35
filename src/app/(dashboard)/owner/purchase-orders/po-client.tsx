'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, FileDown, CheckCircle2, XCircle, Plus, Sparkles, X, ChevronRight, Edit2, Trash2 } from 'lucide-react'
import { generateAutoPO, completePurchaseOrder, cancelPurchaseOrder, deletePurchaseOrder, updatePurchaseOrder } from '@/actions/purchase-order'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DeleteModal } from '@/components/delete-modal'

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <div>
            <p className="text-sm font-bold text-zinc-900">{title}</p>
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function PurchaseOrdersClient({ pos, suppliers, products }: { pos: any[], suppliers: any[], products: any[] }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPO, setSelectedPO] = useState<any>(null)
  const [editPO, setEditPO] = useState<any>(null)
  const [editForm, setEditForm] = useState({ notes: '', supplier_id: '' })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; po: any | null }>({ open: false, po: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleAutoGenerate = async () => {
    setIsGenerating(true)
    try {
      await generateAutoPO()
      toast.success('PO otomatis berhasil dibuat dari stok yang menipis!')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCompletePO = async (id: string) => {
    if (!confirm('Tandai belanja ini Selesai? Barang akan otomatis masuk ke stok gudang.')) return
    try {
      await completePurchaseOrder(id)
      toast.success('PO selesai! Stok telah ditambahkan.')
      setSelectedPO(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleCancelPO = async (id: string) => {
    if (!confirm('Yakin batalkan dokumen PO ini?')) return
    try {
      await cancelPurchaseOrder(id)
      toast.success('PO dibatalkan.')
      setSelectedPO(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDeletePO = async () => {
    if (!deleteModal.po) return
    setIsDeleting(true)
    try {
      await deletePurchaseOrder(deleteModal.po.id)
      toast.success('PO berhasil dihapus.')
      setDeleteModal({ open: false, po: null })
      setSelectedPO(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditPO = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPO) return
    try {
      await updatePurchaseOrder(editPO.id, editForm)
      toast.success('PO berhasil diperbarui.')
      setEditPO(null)
      setSelectedPO(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const openEditModal = (po: any) => {
    setEditPO(po)
    setEditForm({ notes: po.notes || '', supplier_id: po.supplier_id || '' })
    setSelectedPO(null)
  }


  const exportToPDF = (po: any) => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('PURCHASE ORDER', 14, 20)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Toko Bangunan 35`, 14, 28)
    doc.text(`NO PO: ${po.po_number}`, 14, 34)
    doc.text(`Tanggal: ${new Date(po.created_at).toLocaleDateString('id-ID')}`, 14, 40)
    
    // Supplier Info
    doc.setFont('helvetica', 'bold')
    doc.text(`Kepada:`, 120, 28)
    doc.setFont('helvetica', 'normal')
    doc.text(`${(po.suppliers as any)?.name || 'Unknown'}`, 120, 34)
    doc.text(`${(po.suppliers as any)?.contact || '-'}`, 120, 40)
    doc.text(`${(po.suppliers as any)?.address || '-'}`, 120, 46)

    // Wait until items are mapped to array for autotable
    const tableData = po.items.map((item: any, index: number) => [
      index + 1,
      (item.products as any)?.name || 'Produk Dihapus',
      item.qty,
      `Rp ${Number(item.cost_price).toLocaleString('id-ID')}`,
      `Rp ${(Number(item.qty) * Number(item.cost_price)).toLocaleString('id-ID')}`
    ])

    autoTable(doc, {
      startY: 55,
      head: [['No', 'Deskripsi Produk', 'Qty', 'Harga Satuan', 'Total Harga']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [40, 40, 40] }
    })

    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 55
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`TOTAL KESELURUHAN: Rp ${po.totalAmount.toLocaleString('id-ID')}`, 14, finalY + 15)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Dokumen ini dihasilkan secara otomatis oleh Sistem POS & Inventori.', 14, finalY + 30)

    // TTD Section
    const signY = finalY + 50
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Makassar, ${new Date(po.created_at).toLocaleDateString('id-ID')}`, 130, signY)
    doc.text('Hormat Kami,', 130, signY + 8)
    doc.text('', 130, signY + 16)
    doc.text('', 130, signY + 24)
    doc.text('( Manager Pengadaan )', 130, signY + 40)
    // Garis tanda tangan
    doc.setDrawColor(150)
    doc.line(128, signY + 37, 195, signY + 37)

    doc.save(`${po.po_number}.pdf`)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Purchase Order (PO)</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Kelola pesanan pembelian barang ke vendor.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            onClick={handleAutoGenerate}
            disabled={isGenerating}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold h-9 px-4"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            {isGenerating ? 'Menganalisis Stok...' : 'Auto-Generate PO'}
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-50 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-zinc-400 pl-6">Nomor PO & Vendor</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400">Tanggal</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400 text-right">Total Nilai</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400 text-center">Status</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400 text-right pr-6 w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pos.length === 0 ? (
              <TableRow>
                 <TableCell colSpan={5} className="h-40 text-center">
                    <ClipboardList className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                    <p className="text-sm font-medium text-zinc-400">Tidak ada dokumen PO</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Gunakan tombol auto-generate untuk membuat dari stok menipis.</p>
                 </TableCell>
              </TableRow>
            ) : pos.map(po => (
              <TableRow key={po.id} className="border-zinc-50 hover:bg-zinc-50/50 cursor-pointer" onClick={() => setSelectedPO(po)}>
                 <TableCell className="pl-6">
                    <p className="text-sm font-bold text-zinc-900">{po.po_number}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{(po.suppliers as any)?.name}</p>
                 </TableCell>
                 <TableCell className="text-sm text-zinc-600 font-medium">
                    {new Date(po.created_at).toLocaleDateString('id-ID')}
                 </TableCell>
                 <TableCell className="text-right text-sm font-bold text-zinc-900">
                    Rp {po.totalAmount.toLocaleString('id-ID')}
                 </TableCell>
                 <TableCell className="text-center">
                    {po.status === 'PENDING' && <Badge className="bg-amber-50 text-amber-600 border-0 shadow-none font-semibold text-[10px]">PENDING</Badge>}
                    {po.status === 'SELESAI' && <Badge className="bg-emerald-50 text-emerald-700 border-0 shadow-none font-semibold text-[10px]">SELESAI</Badge>}
                    {po.status === 'DIBATALKAN' && <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 border-0 shadow-none font-semibold text-[10px]">DIBATALKAN</Badge>}
                 </TableCell>
                 <TableCell className="text-right pr-4">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      {po.status === 'PENDING' && (
                        <button
                          onClick={() => openEditModal(po)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100"
                          title="Edit PO"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {po.status !== 'SELESAI' && (
                        <button
                          onClick={() => setDeleteModal({ open: true, po })}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50"
                          title="Hapus PO"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <ChevronRight className="w-4 h-4 text-zinc-300 ml-1" onClick={() => setSelectedPO(po)} />
                    </div>
                 </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* PO Detail Modal */}
      {selectedPO && (
        <Modal 
          title={`Detail ${selectedPO.po_number}`}
          subtitle={`Vendor: ${(selectedPO.suppliers as any)?.name || 'Unknown'}`}
          onClose={() => setSelectedPO(null)}
        >
           <div className="space-y-6">
              {/* Item List */}
              <div className="border border-zinc-100 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow className="border-zinc-100 hover:bg-zinc-50">
                      <TableHead className="text-xs font-semibold text-zinc-500">Item</TableHead>
                      <TableHead className="text-xs font-semibold text-zinc-500 text-center">Qty</TableHead>
                      <TableHead className="text-xs font-semibold text-zinc-500 text-right">Harga Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {selectedPO.items.map((item: any, i: number) => (
                        <TableRow key={i} className="border-zinc-50 hover:bg-transparent">
                           <TableCell className="text-sm font-medium text-zinc-900">
                              {(item.products as any)?.name}
                              <div className="text-[10px] text-zinc-400 mt-0.5">@ Rp {Number(item.cost_price).toLocaleString('id-ID')}</div>
                           </TableCell>
                           <TableCell className="text-sm font-bold text-zinc-900 text-center bg-zinc-50/50 w-24">
                              {item.qty}
                           </TableCell>
                           <TableCell className="text-sm font-bold text-zinc-900 text-right">
                              Rp {(Number(item.qty) * Number(item.cost_price)).toLocaleString('id-ID')}
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
                </Table>
                <div className="p-4 bg-zinc-900 flex justify-between items-center text-white">
                   <span className="text-xs font-semibold tracking-wide uppercase text-zinc-400">Total Nilai PO</span>
                   <span className="text-xl font-bold">Rp {selectedPO.totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Notice */}
              {selectedPO.notes && (
                 <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-xs font-medium border border-blue-100">
                    Catatan: {selectedPO.notes}
                 </div>
              )}

              {/* Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                 <Button 
                   onClick={() => exportToPDF(selectedPO)}
                   variant="outline"
                   className="h-11 rounded-xl w-full border-zinc-200 text-zinc-700 bg-white"
                 >
                    <FileDown className="w-4 h-4 mr-2" /> Download PDF
                 </Button>

                 {selectedPO.status === 'PENDING' && (
                    <>
                       <Button
                         onClick={() => openEditModal(selectedPO)}
                         variant="outline"
                         className="h-11 rounded-xl w-full border-zinc-200 text-zinc-700"
                       >
                         <Edit2 className="w-4 h-4 mr-2" /> Edit PO
                       </Button>
                       <Button 
                         onClick={() => handleCompletePO(selectedPO.id)}
                         className="h-11 rounded-xl w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md sm:col-span-2"
                       >
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Tandai Selesai (Restock)
                       </Button>
                       <Button 
                         onClick={() => handleCancelPO(selectedPO.id)}
                         variant="ghost"
                         className="h-11 rounded-xl w-full text-red-600 hover:text-red-700 hover:bg-red-50 sm:col-span-2"
                       >
                          <XCircle className="w-4 h-4 mr-2" /> Batalkan PO
                       </Button>
                    </>
                 )}
              </div>
           </div>
        </Modal>
      )}

      {/* Edit PO Modal */}
      {editPO && (
        <Modal title={`Edit PO: ${editPO.po_number}`} subtitle="Hanya PO berstatus PENDING yang bisa diedit" onClose={() => setEditPO(null)}>
          <form onSubmit={handleEditPO} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Vendor</label>
              <select
                className="w-full h-10 border border-zinc-200 bg-zinc-50 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                value={editForm.supplier_id}
                onChange={e => setEditForm({ ...editForm, supplier_id: e.target.value })}
              >
                <option value="">-- Pilih Vendor --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Catatan</label>
              <Input
                type="text"
                value={editForm.notes}
                onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Catatan tambahan..."
                className="h-10 rounded-lg border-zinc-200 bg-zinc-50 text-sm"
              />
            </div>
            <div className="flex gap-2.5 pt-2 border-t border-zinc-100">
              <Button type="button" variant="outline" className="flex-1 h-10 rounded-lg text-sm" onClick={() => setEditPO(null)}>Batal</Button>
              <Button type="submit" className="flex-1 h-10 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold">Simpan Perubahan</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.po && (
        <DeleteModal
          title="Hapus Purchase Order"
          message={`Yakin hapus PO "${deleteModal.po.po_number}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleDeletePO}
          onCancel={() => setDeleteModal({ open: false, po: null })}
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}
