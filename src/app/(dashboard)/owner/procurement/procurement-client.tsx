'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Plus, MessageCircle, X, Check, Trash2, Edit2, Clock } from 'lucide-react'
import { createSchedule, updateSchedule, sendScheduleReminder, updateScheduleStatus, deleteSchedule } from '@/actions/procurement'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { DeleteModal } from '@/components/delete-modal'

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[460px] overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
          <p className="text-sm font-bold text-zinc-900">{title}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

const EMPTY_FORM = { product_id: '', supplier_id: '', scheduled_date: '', reminder_time: '08:00', qty: 0, notes: '' }

export function ProcurementClient({ schedules, suppliers, products }: { schedules: any[], suppliers: any[], products: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<any>(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; schedule: any | null }>({ open: false, schedule: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const openCreate = () => {
    setEditingSchedule(null)
    setFormData(EMPTY_FORM)
    setIsModalOpen(true)
  }

  const openEdit = (schedule: any) => {
    setEditingSchedule(schedule)
    setFormData({
      product_id: schedule.product_id || '',
      supplier_id: schedule.supplier_id || '',
      scheduled_date: schedule.scheduled_date?.slice(0, 10) || '',
      reminder_time: schedule.reminder_time || '08:00',
      qty: schedule.qty || 0,
      notes: schedule.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, formData)
        toast.success('Jadwal berhasil diperbarui.')
      } else {
        await createSchedule(formData)
        toast.success('Jadwal pengadaan berhasil dibuat.')
      }
      setIsModalOpen(false)
      setFormData(EMPTY_FORM)
      setEditingSchedule(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleReminder = async (id: string) => {
    setSendingId(id)
    try {
      await sendScheduleReminder(id)
      toast.success('Reminder WA berhasil dikirim via Fonnte!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSendingId(null)
    }
  }

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DONE' ? 'UPCOMING' : 'DONE'
    try {
      await updateScheduleStatus(id, newStatus)
      toast.success(newStatus === 'DONE' ? 'Jadwal ditandai selesai.' : 'Jadwal dikembalikan ke upcoming.')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async () => {
    if (!deleteModal.schedule) return
    setIsDeleting(true)
    try {
      await deleteSchedule(deleteModal.schedule.id)
      toast.success('Jadwal dihapus.')
      setDeleteModal({ open: false, schedule: null })
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const sortedSchedules = [...schedules].sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">Kalender Pengadaan</h2>
          <p className="text-sm text-zinc-500 mt-0.5">Penjadwalan pembelian stok dan reminder WhatsApp otomatis.</p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold h-9 px-4 shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Jadwal
        </Button>
      </div>

      {/* Grid Layout */}
      {sortedSchedules.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
          <CalendarDays className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-600">Belum ada jadwal</p>
          <p className="text-xs text-zinc-400 mt-1">Buat jadwal pengadaan agar tidak lupa re-stock barang rutin.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedSchedules.map(schedule => {
            const isDone = schedule.status === 'DONE'
            const dt = new Date(schedule.scheduled_date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const isOverdue = !isDone && dt < today

            return (
              <Card key={schedule.id} className={`border border-zinc-100 shadow-sm rounded-xl overflow-hidden transition-all ${isDone ? 'opacity-60 bg-zinc-50' : 'bg-white'}`}>
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CalendarDays className="w-4 h-4 text-zinc-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-zinc-900 truncate">
                        {dt.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      {schedule.reminder_time && (
                        <p className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {schedule.reminder_time} WIB
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isDone && <Badge className="bg-zinc-200 text-zinc-600 hover:bg-zinc-200 border-0 text-[10px] shadow-none">SELESAI</Badge>}
                    {!isDone && isOverdue && <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-0 text-[10px] shadow-none animate-pulse">TERLEWAT</Badge>}
                    {!isDone && !isOverdue && <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-0 text-[10px] shadow-none">MENDATANG</Badge>}
                  </div>
                </div>

                <CardContent className="p-5 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Barang & Volume</p>
                    <p className="font-bold text-zinc-900 text-base leading-tight">{(schedule.products as any)?.name}</p>
                    <p className="text-sm text-zinc-600 mt-0.5"><span className="font-semibold text-zinc-900">{schedule.qty}</span> Pcs</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Target Vendor</p>
                    <p className="text-sm text-zinc-700">{(schedule.suppliers as any)?.name}</p>
                  </div>

                  {schedule.notes && (
                    <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100 text-xs text-zinc-600">
                      {schedule.notes}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-zinc-100 mt-2">
                    {!isDone && (
                      <Button
                        onClick={() => handleReminder(schedule.id)}
                        disabled={sendingId === schedule.id}
                        variant="outline"
                        className="flex-1 h-9 rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold shadow-sm bg-white"
                      >
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                        {sendingId === schedule.id ? 'Mengirim...' : 'Kirim WA'}
                      </Button>
                    )}

                    <Button
                      onClick={() => handleStatusChange(schedule.id, schedule.status)}
                      variant="outline"
                      className={`flex-1 h-9 rounded-lg text-xs font-semibold shadow-sm ${
                        isDone ? 'border-zinc-200 text-zinc-600 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-zinc-800 border-zinc-900'
                      }`}
                    >
                      {isDone ? 'Batal Selesai' : <><Check className="w-3.5 h-3.5 mr-1.5" /> Selesai</>}
                    </Button>

                    <button
                      onClick={() => openEdit(schedule)}
                      className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 border border-zinc-100 shrink-0"
                      title="Edit Jadwal"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteModal({ open: true, schedule })}
                      className="h-9 w-9 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 border border-zinc-100 shrink-0"
                      title="Hapus Jadwal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Tambah/Edit Jadwal */}
      {isModalOpen && (
        <Modal title={editingSchedule ? 'Edit Jadwal Pengadaan' : 'Jadwal Pengadaan Baru'} onClose={() => { setIsModalOpen(false); setEditingSchedule(null) }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Tanggal</label>
                <Input
                  type="date"
                  required
                  value={formData.scheduled_date}
                  onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="h-10 rounded-lg border-zinc-200 bg-zinc-50 text-sm focus-visible:ring-zinc-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Waktu Reminder
                </label>
                <Input
                  type="time"
                  required
                  value={formData.reminder_time}
                  onChange={e => setFormData({ ...formData, reminder_time: e.target.value })}
                  className="h-10 rounded-lg border-zinc-200 bg-zinc-50 text-sm focus-visible:ring-zinc-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Produk Target</label>
              <select
                required
                className="w-full h-10 border border-zinc-200 bg-zinc-50 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                value={formData.product_id}
                onChange={e => setFormData({ ...formData, product_id: e.target.value })}
              >
                <option value="" disabled>-- Pilih Produk --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Supplier (Tujuan)</label>
              <select
                required
                className="w-full h-10 border border-zinc-200 bg-zinc-50 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                value={formData.supplier_id}
                onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
              >
                <option value="" disabled>-- Pilih Vendor --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Jumlah (Pcs)</label>
                <Input
                  type="number" required min="1"
                  value={formData.qty || ''}
                  onChange={e => setFormData({ ...formData, qty: Number(e.target.value) })}
                  className="h-10 rounded-lg border-zinc-200 bg-zinc-50 text-sm focus-visible:ring-zinc-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Catatan</label>
                <Input
                  type="text"
                  placeholder="Opsional..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="h-10 rounded-lg border-zinc-200 bg-zinc-50 text-sm focus-visible:ring-zinc-900"
                />
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 -mt-2">
              ⏰ WA reminder otomatis terkirim pada <strong>{formData.reminder_time}</strong> di tanggal yang ditentukan.
            </p>

            <div className="flex gap-3 pt-2 border-t border-zinc-100">
              <Button type="button" variant="outline" className="flex-1 h-10 rounded-lg border-zinc-200 text-sm" onClick={() => { setIsModalOpen(false); setEditingSchedule(null) }}>Batal</Button>
              <Button type="submit" className="flex-1 h-10 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold">
                {editingSchedule ? 'Simpan Perubahan' : 'Buat Jadwal'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.schedule && (
        <DeleteModal
          title="Hapus Jadwal Pengadaan"
          message={`Yakin hapus jadwal "${(deleteModal.schedule.products as any)?.name || 'ini'}"? Jadwal tidak bisa dipulihkan.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteModal({ open: false, schedule: null })}
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}
