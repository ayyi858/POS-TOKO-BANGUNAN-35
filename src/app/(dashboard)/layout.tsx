import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar, MobileMenuButton } from '@/components/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { SidebarProvider } from '@/components/sidebar-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: userProfile } = await supabase.from('users').select('*').eq('id', user.id).single()
  
  return (
    <SidebarProvider>
      <div className="flex h-[100dvh] bg-zinc-50 overflow-hidden">
        <Sidebar user={userProfile} />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Header */}
          <header className="h-14 bg-white border-b border-zinc-100 flex items-center px-4 md:px-6 justify-between shrink-0 safe-top">
            <div className="flex items-center gap-2">
              <MobileMenuButton />
              <div className="w-1 h-4 bg-zinc-900 rounded-full hidden md:block" />
              <h1 className="text-sm font-semibold text-zinc-900">Sistem POS &amp; Inventori</h1>
              <span className="text-zinc-300 mx-1 hidden sm:inline">·</span>
              <span className="text-xs text-zinc-400 font-medium hidden sm:block">Toko Bangunan 35</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium hidden sm:block">
                {userProfile?.name}
              </span>
              <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 max-w-[1400px] mx-auto page-enter pb-safe">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </div>
    </SidebarProvider>
  )
}
