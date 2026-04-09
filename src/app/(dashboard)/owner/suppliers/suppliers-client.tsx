'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Truck, PackagePlus, X, FileDown, FileSpreadsheet } from 'lucide-react'
import { createSupplier, deleteSupplier, addSupplierProduct, createStockPurchase } from '@/actions/supplier'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { DeleteModal } from '@/components/delete-modal'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[420px] overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
          <div>
            <p className="text-sm font-bold text-zinc-900">{title}</p>
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function SuppliersClient({ suppliers, products, supplierProducts }: { suppliers: any[]; products: any[]; supplierProducts: any[] }) {
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(suppliers[0]?.id || null)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '', address: '' })
  const [spForm, setSpForm] = useState({ product_id: '', cost_price: 0 })
  const [restockForm, setRestockForm] = useState({ product_id: '', qty: 0, cost_price: 0 })
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; supplier: any | null }>({ open: false, supplier: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const activeSupplier = suppliers.find(s => s.id === activeSupplierId)
  const activeSProducts = supplierProducts.filter(sp => sp.supplier_id === activeSupplierId)

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSupplier(supplierForm)
      toast.success('Vendor berhasil ditambahkan')
      setIsSupplierModalOpen(false)
      setSupplierForm({ name: '', contact: '', address: '' })
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleDeleteSupplier = async () => {
    if (!deleteModal.supplier) return
    setIsDeleting(true)
    try {
      await deleteSupplier(deleteModal.supplier.id)
      toast.success('Vendor dihapus')
      if (activeSupplierId === deleteModal.supplier.id) setActiveSupplierId(suppliers[0]?.id || null)
      setDeleteModal({ open: false, supplier: null })
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
    finally { setIsDeleting(false) }
  }

  const handleAddSupplierProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSupplierId || !spForm.product_id) return
    try {
      await addSupplierProduct({ supplier_id: activeSupplierId, ...spForm })
      toast.success('Produk berhasil ditautkan ke vendor')
      setIsProductModalOpen(false)
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeSupplierId || !restockForm.product_id) return
    try {
      await createStockPurchase({
        supplier_id: activeSupplierId,
        product_id: restockForm.product_id,
        qty: restockForm.qty,
        total_cost: restockForm.qty * restockForm.cost_price,
      })
      toast.success('Stok berhasil masuk (Restock)!')
      setIsRestockModalOpen(false)
      router.refresh()
    } catch (err: any) { toast.error(err.message) }
  }

  const openRestock = (sp: any) => {
    setRestockForm({ product_id: sp.product_id, cost_price: sp.cost_price, qty: 0 })
    setIsRestockModalOpen(true)
  }

  const handleExportExcel = () => {
    const rows: any[][] = [['Nama Vendor', 'Kontak', 'Alamat', 'Produk Ditautkan', 'Harga Modal']]
    suppliers.forEach(s => {
      const sps = supplierProducts.filter(sp => sp.supplier_id === s.id)
      if (sps.length === 0) {
        rows.push([s.name, s.contact || '-', s.address || '-', '-', '-'])
      } else {
        sps.forEach(sp => {
          const prod = products.find(p => p.id === sp.product_id)
          rows.push([s.name, s.contact || '-', s.address || '-', prod?.name || '-', Number(sp.cost_price)])
        })
      }
    })
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 25 }, { wch: 22 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Vendor')
    XLSX.writeFile(wb, 'data_vendor.xlsx')
    toast.success('Excel vendor berhasil diunduh')
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('DAFTAR VENDOR / SUPPLIER', 14, 18)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 24)

    const rows: any[][] = []
    suppliers.forEach(s => {
      const sps = supplierProducts.filter(sp => sp.supplier_id === s.id)
      if (sps.length === 0) {
        rows.push([s.name, s.contact || '-', s.address || '-', '-', '-'])
      } else {
        sps.forEach(sp => {
          const prod = products.find(p => p.id === sp.product_id)
          rows.push([s.name, s.contact || '-', s.address || '-', prod?.name || '-', `Rp ${Number(sp.cost_price).toLocaleString('id-ID')}`])
        })
      }
    })

    autoTable(doc, {
      startY: 28,
      head: [['Nama Vendor', 'Kontak', 'Alamat', 'Produk', 'Harga Modal']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [30, 30, 30] },
      margin: { left: 12, right: 12 },
    })
    doc.save('data_vendor.pdf')
    toast.success('PDF vendor berhasil diunduh')
  }
  return (
    <div className="space-y-8 h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Manajemen Vendor</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Kelola supplier, harga modal, dan restock barang.</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" onClick={handleExportExcel} className="h-9 rounded-lg border-zinc-200 text-xs font-semibold">
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF} className="h-9 rounded-lg border-zinc-200 text-xs font-semibold">
            <FileDown className="w-3.5 h-3.5 mr-1.5 text-red-500" /> PDF
          </Button>
          <Button
            onClick={() => setIsSupplierModalOpen(true)}
            className="rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold h-9 px-4"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Tambah Vendor
          </Button>
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="flex flex-col md:flex-row gap-5 md:h-[calc(100vh-13rem)]">
        {/* Left — Supplier List */}
        <div className="md:w-64 shrink-0 flex flex-col gap-2 overflow-y-auto">
          {suppliers.length === 0 && (
            <p className="text-sm text-zinc-400 px-1">Belum ada data vendor.</p>
          )}
          {suppliers.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSupplierId(s.id)}
              className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all ${
                activeSupplierId === s.id
                  ? 'bg-zinc-900 border-zinc-900 text-white'
                  : 'bg-white border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${activeSupplierId === s.id ? 'text-white' : 'text-zinc-900'}`}>
                    {s.name}
                  </p>
                  <p className={`text-xs mt-0.5 truncate ${activeSupplierId === s.id ? 'text-zinc-400' : 'text-zinc-400'}`}>
                    {s.contact || 'Tidak ada kontak'}
                  </p>
                </div>
                <button
            onClick={e => { e.stopPropagation(); setDeleteModal({ open: true, supplier: s }) }}
                  className={`p-1 rounded-md shrink-0 transition-colors ${
                    activeSupplierId === s.id
                      ? 'text-zinc-500 hover:text-red-400 hover:bg-zinc-800'
                      : 'text-zinc-300 hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </button>
          ))}
        </div>

        {/* Right — Supplier Products */}
        <div className="flex-1 min-w-0">
          {activeSupplier ? (
            <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden h-full flex flex-col">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{activeSupplier.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{activeSupplier.address || 'Alamat tidak diketahui'}</p>
                </div>
                <Button
                  onClick={() => setIsProductModalOpen(true)}
                  variant="outline"
                  className="rounded-lg border-zinc-200 text-xs font-semibold h-8 px-3"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Tautkan Produk
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-50 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-zinc-400 pl-5">Nama Produk</TableHead>
                      <TableHead className="text-xs font-semibold text-zinc-400 text-right">Harga Modal</TableHead>
                      <TableHead className="text-xs font-semibold text-zinc-400 text-right pr-5 w-32">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-sm text-zinc-400">
                          Belum ada produk ditautkan ke vendor ini.
                        </TableCell>
                      </TableRow>
                    ) : (
                      activeSProducts.map(sp => {
                        const product = products.find(p => p.id === sp.product_id)
                        return (
                          <TableRow key={sp.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                            <TableCell className="text-sm font-semibold text-zinc-900 pl-5">{product?.name}</TableCell>
                            <TableCell className="text-right font-bold text-emerald-600">
                              Rp {Number(sp.cost_price).toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className="text-right pr-5">
                              <Button
                                size="sm"
                                className="h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs px-3"
                                onClick={() => openRestock(sp)}
                              >
                                <PackagePlus className="w-3 h-3 mr-1" />
                                Restock
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-zinc-200 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
              <Truck className="w-10 h-10 text-zinc-200" />
              <p className="text-sm font-medium text-zinc-400">Pilih vendor</p>
              <p className="text-xs text-zinc-300">Klik vendor di sebelah kiri untuk melihat katalognya.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL — Tambah Vendor */}
      {isSupplierModalOpen && (
        <Modal title="Vendor Baru" onClose={() => setIsSupplierModalOpen(false)}>
          <form onSubmit={handleAddSupplier} className="space-y-4">
            {[
              { label: 'Nama Vendor / PT', key: 'name', required: true },
              { label: 'Nomor Kontak (WA)', key: 'contact', required: false },
              { label: 'Alamat', key: 'address', required: false },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{f.label}</label>
                <Input
                  required={f.required}
                  value={(supplierForm as any)[f.key]}
                  onChange={e => setSupplierForm({ ...supplierForm, [f.key]: e.target.value })}
                  className="h-10 rounded-lg border-zinc-200 bg-zinc-50 text-sm focus-visible:ring-zinc-900"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1 h-10 rounded-lg border-zinc-200 text-sm" onClick={() => setIsSupplierModalOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-1 h-10 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold">Simpan</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL — Tautkan Produk */}
      {isProductModalOpen && (
        <Modal title="Tautkan Produk" subtitle={`Produk yang disuplai oleh ${activeSupplier?.name}`} onClose={() => setIsProductModalOpen(false)}>
          <form onSubmit={handleAddSupplierProduct} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Pilih Produk</label>
              <select
                required
                className="w-full h-10 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                value={spForm.product_id}
                onChange={e => setSpForm({ ...spForm, product_id: e.target.value })}
              >
                <option value="" disabled>-- Pilih Produk --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Harga Modal (Rp)</label>
              <Input
                required type="number" min="0"
                value={spForm.cost_price}
                onChange={e => setSpForm({ ...spForm, cost_price: Number(e.target.value) })}
                className="h-10 rounded-lg border-zinc-200 bg-zinc-50 text-sm focus-visible:ring-zinc-900"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1 h-10 rounded-lg border-zinc-200 text-sm" onClick={() => setIsProductModalOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-1 h-10 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold">Simpan</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL — Restock */}
      {isRestockModalOpen && (
        <Modal title="Restock Barang" subtitle={`Pembelian dari ${activeSupplier?.name}`} onClose={() => setIsRestockModalOpen(false)}>
          <form onSubmit={handleRestock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Jumlah Fisik (Qty)</label>
              <Input
                required type="number" min="1"
                value={restockForm.qty || ''}
                onChange={e => setRestockForm({ ...restockForm, qty: Number(e.target.value) })}
                className="h-11 rounded-lg border-zinc-200 bg-zinc-50 text-lg font-bold text-center focus-visible:ring-zinc-900"
              />
            </div>
            <div className="bg-zinc-50 rounded-lg p-4 space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Harga Modal/pc</span>
                <span>Rp {restockForm.cost_price.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-zinc-200">
                <span className="text-sm font-semibold text-zinc-700">Total Bayar</span>
                <span className="text-base font-bold text-emerald-600">
                  Rp {(restockForm.qty * restockForm.cost_price).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1 h-10 rounded-lg border-zinc-200 text-sm" onClick={() => setIsRestockModalOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-1 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Konfirmasi Restock</Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteModal.open && deleteModal.supplier && (
        <DeleteModal
          title="Hapus Vendor"
          message={`Yakin hapus vendor "${deleteModal.supplier.name}"? Semua produk terkait juga akan terhapus.`}
          onConfirm={handleDeleteSupplier}
          onCancel={() => setDeleteModal({ open: false, supplier: null })}
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}
