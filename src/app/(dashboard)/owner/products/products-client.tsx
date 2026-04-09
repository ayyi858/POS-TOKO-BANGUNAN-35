'use client'

import { useState, useRef } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit2, Trash2, Search, PackageOpen, X, MinusCircle, Upload, Download, FileSpreadsheet } from 'lucide-react'
import { createProduct, updateProduct, deleteProduct, reduceStock, importProducts } from '@/actions/product'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { DeleteModal } from '@/components/delete-modal'
import * as XLSX from 'xlsx'

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
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

export function ProductsClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', category: '', stock: 0, price: 0, min_stock: 5 })
  
  // Reduce stock state
  const [reduceModal, setReduceModal] = useState<{ open: boolean; product: any | null }>({ open: false, product: null })
  const [reduceForm, setReduceForm] = useState({ qty: 1, reason: 'Rusak' })
  
  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; product: any | null }>({ open: false, product: null })
  const [isDeleting, setIsDeleting] = useState(false)

  // Import Excel
  const fileInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  const filtered = products
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || '').toLowerCase().includes(search.toLowerCase()))

  const openModal = (product: any = null) => {
    if (product) {
      setEditingId(product.id)
      setFormData({ name: product.name, category: product.category || '', stock: product.stock, price: product.price, min_stock: product.min_stock })
    } else {
      setEditingId(null)
      setFormData({ name: '', category: '', stock: 0, price: 0, min_stock: 5 })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateProduct(editingId, formData)
        toast.success('Produk berhasil diperbarui')
      } else {
        await createProduct(formData)
        toast.success('Produk berhasil ditambahkan')
      }
      setIsModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.product) return
    setIsDeleting(true)
    try {
      await deleteProduct(deleteModal.product.id)
      toast.success('Produk dihapus')
      setDeleteModal({ open: false, product: null })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReduceStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reduceModal.product) return
    try {
      await reduceStock(reduceModal.product.id, reduceForm.qty, reduceForm.reason)
      toast.success(`Stok ${reduceModal.product.name} dikurangi ${reduceForm.qty} pcs (${reduceForm.reason})`)
      setReduceModal({ open: false, product: null })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Download Excel template
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nama Produk', 'Kategori', 'Harga Jual', 'Stok Awal', 'Stok Minimum'],
      ['Contoh Produk A', 'Bahan Bangunan', 15000, 50, 10],
      ['Contoh Produk B', 'Perkakas', 25000, 30, 5],
    ])
    ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template Produk')
    XLSX.writeFile(wb, 'template_import_produk.xlsx')
    toast.success('Template berhasil diunduh')
  }

  // Import Excel
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 })
      
      // Skip header row
      const records = rows.slice(1).filter(r => r[0]).map(r => ({
        name: String(r[0] || '').trim(),
        category: r[1] ? String(r[1]).trim() : undefined,
        price: Number(r[2]) || 0,
        stock: Number(r[3]) || 0,
        min_stock: Number(r[4]) || 5,
      }))

      if (records.length === 0) return toast.error('Tidak ada data produk di file Excel.')
      
      await importProducts(records)
      toast.success(`${records.length} produk berhasil diimport!`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Gagal import Excel')
    } finally {
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Katalog Produk</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{products.length} item terdaftar</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate} className="h-9 rounded-lg border-zinc-200 text-xs font-semibold text-zinc-600">
            <Download className="w-3.5 h-3.5 mr-1.5" /> Template XLS
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-9 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Import Excel
          </Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <Button onClick={() => openModal()} className="h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-4">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Tambah Produk
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          placeholder="Cari nama atau kategori produk..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 h-10 rounded-lg border-zinc-200 bg-white text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-100 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-50 hover:bg-transparent">
              <TableHead className="text-xs font-semibold text-zinc-400 pl-5">Produk</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400">Kategori</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400 text-right">Harga</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400 text-right">Stok</TableHead>
              <TableHead className="text-xs font-semibold text-zinc-400 text-right pr-5 w-36">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-36 text-center">
                  <PackageOpen className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
                  <p className="text-sm font-medium text-zinc-400">Tidak ada produk</p>
                </TableCell>
              </TableRow>
            ) : filtered.map(product => (
              <TableRow key={product.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                <TableCell className="pl-5">
                  <p className="text-sm font-semibold text-zinc-900">{product.name}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Min: {product.min_stock} pcs</p>
                </TableCell>
                <TableCell>
                  <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-medium">
                    {product.category || '—'}
                  </span>
                </TableCell>
                <TableCell className="text-right text-sm font-bold text-zinc-900">
                  Rp {Number(product.price).toLocaleString('id-ID')}
                </TableCell>
                <TableCell className="text-right">
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                    product.stock <= product.min_stock
                      ? 'bg-red-50 text-red-600'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {product.stock}
                  </span>
                </TableCell>
                <TableCell className="text-right pr-5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setReduceModal({ open: true, product }); setReduceForm({ qty: 1, reason: 'Rusak' }); }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-colors"
                      title="Kurangi Stok"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openModal(product)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, product })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Modal Tambah/Edit Produk */}
      {isModalOpen && (
        <Modal
          title={editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Nama Produk', key: 'name', type: 'text', required: true },
              { label: 'Kategori', key: 'category', type: 'text', required: false },
              { label: 'Harga Jual (Rp)', key: 'price', type: 'number', required: true },
              { label: 'Stok', key: 'stock', type: 'number', required: true },
              { label: 'Minimum Stok (Reorder Point)', key: 'min_stock', type: 'number', required: true },
            ].map(f => (
              <div key={f.key} className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{f.label}</label>
                <Input
                  type={f.type}
                  required={f.required}
                  min={f.type === 'number' ? 0 : undefined}
                  value={(formData as any)[f.key]}
                  onChange={e => setFormData({ ...formData, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                  className="h-10 rounded-lg border-zinc-200 bg-zinc-50 text-sm focus-visible:ring-zinc-900"
                />
              </div>
            ))}
            <div className="flex gap-2.5 pt-2 border-t border-zinc-100">
              <Button type="button" variant="outline" className="flex-1 h-10 rounded-lg text-sm" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-1 h-10 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold">Simpan</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Kurangi Stok */}
      {reduceModal.open && reduceModal.product && (
        <Modal
          title="Kurangi Stok Manual"
          subtitle={reduceModal.product.name}
          onClose={() => setReduceModal({ open: false, product: null })}
        >
          <form onSubmit={handleReduceStock} className="space-y-4">
            <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-100 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Stok Saat Ini</span>
                <span className="font-bold text-zinc-900">{reduceModal.product.stock} pcs</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Jumlah Dikurangi</label>
              <Input
                type="number" required min={1} max={reduceModal.product.stock}
                value={reduceForm.qty}
                onChange={e => setReduceForm({ ...reduceForm, qty: Number(e.target.value) })}
                className="h-10 rounded-lg border-zinc-200 bg-zinc-50 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Alasan</label>
              <select
                value={reduceForm.reason}
                onChange={e => setReduceForm({ ...reduceForm, reason: e.target.value })}
                className="w-full h-10 border border-zinc-200 bg-zinc-50 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                {['Rusak', 'Retur ke Supplier', 'Selisih Stok', 'Expired', 'Lainnya'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2.5 pt-2 border-t border-zinc-100">
              <Button type="button" variant="outline" className="flex-1 h-10 rounded-lg text-sm" onClick={() => setReduceModal({ open: false, product: null })}>Batal</Button>
              <Button type="submit" className="flex-1 h-10 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold">Kurangi Stok</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.product && (
        <DeleteModal
          title="Hapus Produk"
          message={`Yakin hapus produk "${deleteModal.product.name}"? Data tidak bisa dipulihkan.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal({ open: false, product: null })}
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}
