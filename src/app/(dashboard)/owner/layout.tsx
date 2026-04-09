import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: userProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (userProfile?.role !== 'OWNER') {
      redirect('/kasir')
    }
  }

  return <>{children}</>
}
