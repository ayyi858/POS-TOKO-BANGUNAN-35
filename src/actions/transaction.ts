'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTransaction(userId: string, shiftId: string, items: {productId: string, qty: number, price: number}[]) {
  const supabase = await createClient()
  
  // 1. Hitung total
  const total = items.reduce((sum, item) => sum + (item.qty * item.price), 0)
  
  // 2. Insert Transaksi
  const { data: trx, error: trxError } = await supabase.from('transactions').insert([{
    user_id: userId,
    shift_id: shiftId,
    total
  }]).select().single()
  
  if (trxError) throw new Error("Gagal membuat transaksi: " + trxError.message)
  
  // 3. Insert Items
  const transactionItems = items.map(item => ({
    transaction_id: trx.id,
    product_id: item.productId,
    qty: item.qty,
    price: item.price
  }))
  const { error: itemsError } = await supabase.from('transaction_items').insert(transactionItems)
  if (itemsError) throw new Error("Gagal menyimpan item transaksi: " + itemsError.message)
  
  // 4. Update Stock & Send Notification
  for (const item of items) {
       const { data: product, error: getErr } = await supabase.from('products').select('*').eq('id', item.productId).single()
       if (getErr) throw new Error("Gagal mengambil data produk: " + getErr.message)
       if (product) {
           const newStock = product.stock - item.qty
           const { data: updatedProduct, error: updateErr } = await supabase.from('products').update({ stock: newStock }).eq('id', item.productId).select('id')
           if (updateErr) throw new Error("Gagal memotong stok dari Database: " + updateErr.message)
           if (!updatedProduct || updatedProduct.length === 0) {
                throw new Error("Update stok ditolak oleh Database (Kendala Hak Akses / RLS). Silakan jalankan SQL Policy UPDATE.")
           }

           // === Notifikasi WA Stok Menipis ===
           if (product.stock > product.min_stock && newStock <= product.min_stock) {
               try {
                   const { getSettings, sendFonntMessage } = await import('./settings')
                   const settings = await getSettings()
                   const waNumber = settings['wa_reminder_number']
                   
                   if (waNumber) {
                       const msg = `Halo kamanakang stok barang menipis!\n\nProduk: *${product.name}*\nSisa: ${newStock} pcs\nSegera buat PO untuk re-stock barang.`
                       await sendFonntMessage(waNumber, msg)
                   }
               } catch (err) {
                   console.error("Gagal kirim notifikasi WA stok menipis:", err)
                   // Tidak throw error agar transaksi kasir tetap sukses walau WA error
               }
           }
       }
  }
  
  revalidatePath('/kasir', 'layout')
  return { success: true, transactionId: trx.id }
}

export async function getTransactionsByShift(shiftId: string) {
    const supabase = await createClient()
    const { data: transactions, error } = await supabase.from('transactions').select('*, transaction_items(*, products(name))').eq('shift_id', shiftId).order('created_at', { ascending: false })
    if (error) throw error
    return transactions
}
