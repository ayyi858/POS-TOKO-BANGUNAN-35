'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTransaction } from '@/actions/transaction'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, Minus, Plus, Trash2, Printer, X } from 'lucide-react'

type Product = {
  id: string
  name: string
  price: number
  stock: number
}

type CartItem = Product & { qty: number }

export function PosCart({ products, userId, shiftId }: { products: Product[]; userId: string; shiftId: string }) {
  const [localProducts, setLocalProducts] = useState<Product[]>(products)
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [paidAmount, setPaidAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS'>('CASH')
  const [receipt, setReceipt] = useState<{ items: CartItem[]; total: number; paid: number; change: number; date: string; method: string } | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const paidInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Sync localProducts when server products change (e.g. after refresh)
  useEffect(() => {
    setLocalProducts(products)
  }, [products])

  const filteredProducts = localProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const total = cart.reduce((sum, item) => sum + item.qty * item.price, 0)
  
  const paid = parseFloat(paidAmount) || 0
  const change = paid - total

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault()
        searchInputRef.current?.focus()
      } else if (e.key === 'F4') {
        e.preventDefault()
        paidInputRef.current?.focus()
      } else if (e.key === 'F8') {
        e.preventDefault()
        if (cart.length > 0 && !loading && !receipt) {
          handleCheckout()
        }
      } else if (e.key === 'Escape') {
        if (receipt) setReceipt(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cart, loading, receipt, paidAmount, total])

  const addToCart = (product: Product) => {
    if (receipt) return // block changes when receipt is open
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id)
      if (existing) {
        if (existing.qty >= product.stock) {
          toast.error('Stok produk habis!')
          return prev
        }
        return prev.map(p => (p.id === product.id ? { ...p, qty: p.qty + 1 } : p))
      }
      if (product.stock < 1) {
        toast.error('Produk kosong!')
        return prev
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const removeFromCart = (id: string) => setCart(prev => prev.filter(p => p.id !== id))

  const increaseQty = (id: string, maxStock: number) => {
    setCart(prev =>
      prev.map(p => {
        if (p.id === id) {
          if (p.qty >= maxStock) {
            toast.error('Stok maksimal tercapai')
            return p
          }
          return { ...p, qty: p.qty + 1 }
        }
        return p
      })
    )
  }

  const decreaseQty = (id: string) => {
    setCart(prev => prev.map(p => (p.id === id ? { ...p, qty: Math.max(1, p.qty - 1) } : p)))
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Keranjang kosong')
    if (paid < total) return toast.error('Uang kurang! Masukkan uang bayar dengan benar.')

    setLoading(true)
    try {
      const items = cart.map(c => ({ productId: c.id, qty: c.qty, price: c.price }))
      await createTransaction(userId, shiftId, items, paymentMethod)
      toast.success('Transaksi berhasil!')

      // Optimistic update of local stock amounts
      setLocalProducts(prevProducts => 
        prevProducts.map(p => {
          const itemInCart = cart.find(c => c.id === p.id)
          if (itemInCart) {
            return { ...p, stock: p.stock - itemInCart.qty }
          }
          return p
        })
      )

      setReceipt({
        items: cart,
        total: total,
        paid: paid,
        change: change,
        date: new Date().toLocaleString('id-ID'),
        method: paymentMethod
      })
      setCart([])
      setPaidAmount('')
      setSearch('')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-6 h-full relative animate-in fade-in duration-500">
      {/* KIRI - PRODUCT GRID */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Search */}
        <div className="relative shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <Input
            ref={searchInputRef}
            placeholder="Cari produk... (Tekan F2)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-12 pl-12 rounded-xl border border-zinc-200 bg-white shadow-sm focus-visible:ring-zinc-900 text-sm font-medium"
          />
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto">
          {filteredProducts.length === 0 && (
            <div className="py-16 text-center text-zinc-400">
              <p className="text-sm">Tidak ada produk ditemukan.</p>
            </div>
          )}
          <div className="divide-y divide-zinc-100">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => p.stock > 0 && addToCart(p)}
                disabled={p.stock < 1}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                  p.stock < 1
                    ? 'opacity-40 cursor-not-allowed bg-zinc-50'
                    : 'hover:bg-zinc-50 active:bg-zinc-100 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    p.stock < 1 ? 'bg-red-400' :
                    (p as any).stock <= (p as any).min_stock ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 leading-snug">{p.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Sisa stok: {p.stock} pcs</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-zinc-900">Rp {Number(p.price).toLocaleString('id-ID')}</p>
                  {p.stock < 1 && <p className="text-[10px] text-red-500 font-semibold mt-0.5">Habis</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KANAN - CART (Kasir Panel) */}
      <div className="w-[380px] flex flex-col bg-white border border-zinc-100 shadow-sm rounded-2xl overflow-hidden shrink-0">
        <div className="p-5 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <div>
            <h2 className="font-bold text-lg text-zinc-900 leading-none">Keranjang</h2>
            <p className="text-xs text-zinc-500 mt-1">{cart.length} barang</p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => { setCart([]); setPaidAmount(''); }}
              className="text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bersihkan
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400">
              <ShoppingCart className="w-12 h-12 mb-3 text-zinc-200" />
              <p className="text-sm font-medium">Rak Kosong</p>
              <p className="text-xs text-zinc-400">Klik produk untuk menambahkan.</p>
            </div>
          )}
          {cart.map(item => (
            <div key={item.id} className="p-3 border border-zinc-100 rounded-xl bg-white flex flex-col group hover:border-zinc-300 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="pr-3">
                  <p className="text-sm font-bold text-zinc-900 leading-snug break-words">{item.name}</p>
                  <p className="text-[11px] font-medium text-zinc-500 mt-0.5">Rp {Number(item.price).toLocaleString('id-ID')} /pc</p>
                </div>
                <p className="text-sm font-bold text-zinc-900 shrink-0">
                  Rp {(item.qty * item.price).toLocaleString('id-ID')}
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <button
                  onClick={e => { e.stopPropagation(); removeFromCart(item.id); }}
                  className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  Buang
                </button>
                <div className="flex items-center bg-zinc-50 rounded-lg p-0.5 border border-zinc-100">
                  <button
                    onClick={() => decreaseQty(item.id)}
                    className="w-7 h-7 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 focus-visible:outline-none"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-zinc-900">{item.qty}</span>
                  <button
                    onClick={() => increaseQty(item.id, item.stock)}
                    className="w-7 h-7 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 focus-visible:outline-none"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Panel */}
        <div className="p-5 border-t border-zinc-100 bg-zinc-50 flex flex-col gap-4 shrink-0">
          <div className="flex justify-between items-center text-sm font-bold text-zinc-500">
            <span>TOTAL TAGIHAN</span>
            <span className="text-2xl font-black text-zinc-900 tracking-tight">Rp {total.toLocaleString('id-ID')}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['CASH', 'TRANSFER', 'QRIS'] as const).map(m => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`py-2 px-1 text-xs font-bold rounded-lg border transition-colors ${
                  paymentMethod === m
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {m === 'CASH' ? 'Tunai' : m === 'TRANSFER' ? 'Transfer' : 'QRIS'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label htmlFor="paidAmount" className="text-xs font-bold text-zinc-500 w-24 shrink-0 uppercase tracking-widest">Uang Bayar</label>
              <Input
                id="paidAmount"
                ref={paidInputRef}
                type="number"
                min="0"
                placeholder="(F4) Rp ..."
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
                className="h-10 text-right font-bold text-sm bg-white border-zinc-200 focus-visible:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-zinc-500 w-24 shrink-0 uppercase tracking-widest">Kembalian</label>
              <div className={`flex-1 h-10 flex items-center justify-end px-3 rounded-md text-sm font-bold ${
                change < 0 && paidAmount ? 'text-red-500' : 'text-emerald-600 bg-emerald-50 border border-emerald-100'
              }`}>
                {paidAmount && change < 0 ? 'Uang Kurang' : `Rp ${change > 0 ? change.toLocaleString('id-ID') : 0}`}
              </div>
            </div>
          </div>

          <Button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0 || paid < total}
            className="w-full h-12 text-sm font-bold bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-lg border-t border-zinc-700 mt-2"
          >
            {loading ? 'MEMPROSES KASIR...' : 'BAYAR (F8)'}
          </Button>
        </div>
      </div>

      {/* STRUK MODAL */}
      {receipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[360px] overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 py-3 bg-zinc-900 text-white">
               <p className="text-sm font-bold flex items-center gap-2"><Printer className="w-4 h-4" /> Cetak Struk</p>
               <button onClick={() => setReceipt(null)} className="p-1 hover:bg-zinc-800 rounded-md transition-colors"><X className="w-4 h-4" /></button>
            </div>
            
            {/* Area Print */}
            <div id="printable-receipt" className="p-6 bg-white text-zinc-900 font-mono text-xs overflow-y-auto">
              <div className="text-center mb-6">
                <h2 className="font-bold text-base mb-1 tracking-tight">TB. TIGA LIMA</h2>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Jl. Bonto Daeng Ngirate No.35C<br />
                  Makassar, Sulawesi Selatan<br />
                  Telp: 081256961784
                </p>
              </div>

              <div className="flex justify-between items-center border-b border-dashed border-zinc-300 pb-2 mb-4 text-[10px] text-zinc-500">
                <span>{receipt.date}</span>
                <span className="font-bold">{receipt.method === 'CASH' ? 'TUNAI' : receipt.method === 'TRANSFER' ? 'TRANSFER' : 'QRIS'}</span>
              </div>

              <table className="w-full mb-4">
                <tbody>
                  {receipt.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-1.5 align-top">
                        <div className="font-bold text-zinc-800 leading-tight">{item.name}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {item.qty} x Rp {item.price.toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="text-right align-top py-1.5 font-bold text-zinc-800">
                        {((item.qty * item.price) / 1000).toLocaleString('id-ID')}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-zinc-300 pt-3 space-y-1.5">
                <div className="flex justify-between font-bold text-zinc-900 text-sm">
                  <span>TOTAL BIAYA:</span>
                  <span>Rp {receipt.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-zinc-600 pt-1">
                  <span>{receipt.method === 'CASH' ? 'TUNAI:' : 'DIBAYAR:'}</span>
                  <span>Rp {receipt.paid.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>KEMBALIAN:</span>
                  <span>Rp {receipt.change.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="text-center mt-8">
                <p className="font-bold mb-0.5">Terima Kasih</p>
                <p className="text-[9px] text-zinc-400">Barang yang sudah dibeli<br/>tidak dapat ditukar/dikembalikan</p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex gap-2">
              <Button variant="outline" className="flex-1 rounded-lg h-10 font-semibold" onClick={() => setReceipt(null)}>
                Tutup (Esc)
              </Button>
              <Button className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg h-10 font-bold" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
