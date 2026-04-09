'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Package, FileText, LogOut,
  Clock, Truck, ChevronLeft, ChevronRight, ClipboardList,
  CalendarDays, Settings, X,
} from 'lucide-react'
import { logout } from '@/actions/auth'
import { useSidebar } from '@/components/sidebar-context'

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname()
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar()

  const ownerLinks = [
    { href: '/owner', label: 'Overview', icon: LayoutDashboard },
    { href: '/owner/products', label: 'Katalog Produk', icon: Package },
    { href: '/owner/suppliers', label: 'Manajemen Vendor', icon: Truck },
    { href: '/owner/purchase-orders', label: 'Purchase Order', icon: ClipboardList },
    { href: '/owner/procurement', label: 'Kalender Pengadaan', icon: CalendarDays },
    { href: '/owner/reports', label: 'Laporan', icon: FileText },
    { href: '/owner/settings', label: 'Pengaturan', icon: Settings },
  ]

  const kasirLinks = [
    { href: '/kasir', label: 'Beranda', icon: LayoutDashboard },
    { href: '/kasir/transaction', label: 'POS Kasir', icon: ShoppingCart },
    { href: '/kasir/shift', label: 'Shift Timer', icon: Clock },
    { href: '/kasir/setoran', label: 'Setoran', icon: FileText },
  ]

  const links = user?.role === 'OWNER' ? ownerLinks : kasirLinks

  const navContent = (isMobile = false) => (
    <>
      {/* Brand */}
      <div className={`border-b border-zinc-100 overflow-hidden transition-all duration-300 ${!isMobile && collapsed ? 'px-3 py-5' : 'px-6 py-5'}`}>
        {!isMobile && collapsed ? (
          <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white text-xs font-black">TB</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 pr-8">
            <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-black">TB</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-900 leading-tight whitespace-nowrap">Tiga Lima</p>
              <p className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase leading-tight">Toko Bangunan</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {(!isMobile && !collapsed || isMobile) && (
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest px-2 pb-2">
            {user?.role === 'OWNER' ? 'Owner' : 'Kasir'}
          </p>
        )}
        {links.map((link) => {
          const Icon = link.icon
          const isActive =
            pathname === link.href ||
            (pathname.startsWith(link.href + '/') && link.href !== '/owner' && link.href !== '/kasir')

          return (
            <div key={link.href} className="relative group">
              <Link
                href={link.href}
                onClick={() => isMobile && setMobileOpen(false)}
                className={`flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  !isMobile && collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {(!isMobile && !collapsed || isMobile) && <span className="truncate">{link.label}</span>}
              </Link>

              {/* Tooltip when collapsed (desktop only) */}
              {!isMobile && collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
                  {link.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-900" />
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-2 py-4 border-t border-zinc-100 space-y-1">
        {(!isMobile && !collapsed || isMobile) && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-900 truncate">{user?.name || 'Pengguna'}</p>
              <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">{user?.role}</p>
            </div>
          </div>
        )}

        <div className="relative group">
          <button
            onClick={async () => await logout()}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-all duration-150 ${
              !isMobile && collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(!isMobile && !collapsed || isMobile) && <span>Keluar</span>}
          </button>
          {!isMobile && collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-lg">
              Keluar
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-zinc-900" />
            </div>
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        className={`hidden md:flex relative bg-white border-r border-zinc-100 h-full flex-col shrink-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Desktop collapse toggle */}
        <button
          onClick={toggle}
          className="absolute -right-3 top-6 z-10 w-6 h-6 rounded-full bg-white border border-zinc-200 flex items-center justify-center shadow-sm hover:bg-zinc-50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-zinc-500" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-zinc-500" />
          )}
        </button>
        {navContent(false)}
      </aside>

      {/* ─── MOBILE BACKDROP ─── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── MOBILE SLIDE-IN DRAWER ─── */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
        >
          <X className="w-4 h-4" />
        </button>
        {navContent(true)}
      </aside>
    </>
  )
}

export function MobileMenuButton() {
  const { setMobileOpen } = useSidebar()
  return (
    <button
      id="mobile-menu-btn"
      onClick={() => setMobileOpen(true)}
      className="md:hidden p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors mr-1"
      aria-label="Buka Menu"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  )
}
