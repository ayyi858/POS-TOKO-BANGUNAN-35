'use client'

import { X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DeleteModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function DeleteModal({ title, message, onConfirm, onCancel, isLoading }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-sm font-bold text-zinc-900">{title}</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-zinc-600 leading-relaxed">{message}</p>
        </div>

        <div className="px-5 pb-5 flex gap-2.5">
          <Button
            variant="outline"
            className="flex-1 h-10 rounded-lg border-zinc-200 text-sm font-medium"
            onClick={onCancel}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Menghapus...' : 'Hapus'}
          </Button>
        </div>
      </div>
    </div>
  )
}
