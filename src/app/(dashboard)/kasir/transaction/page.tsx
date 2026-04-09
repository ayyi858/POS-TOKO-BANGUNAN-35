import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PosCart } from '@/components/pos-cart'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function TransactionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: activeShift } = await supabase
    .from('shifts')
    .select('id')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .single()

  if (!activeShift) {
    // Cannot do transaction without active shift
    redirect('/kasir')
  }

  const { data: products } = await supabase.from('products').select('*').order('name')

  return (
    <div className="h-[calc(100vh-8rem)]">
      <PosCart products={products || []} userId={user!.id} shiftId={activeShift.id} />
    </div>
  )
}
