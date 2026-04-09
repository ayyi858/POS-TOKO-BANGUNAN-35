'use client'

import { login } from '@/actions/auth'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-900 rounded-2xl mb-4">
            <span className="text-white text-lg font-black">TB</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900">Toko Bangunan 35</h1>
          <p className="text-sm text-zinc-500 mt-1">Masuk ke sistem POS &amp; Inventori</p>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
          <form action={login} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@email.com"
                required
                className="h-11 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="h-11 rounded-xl border-zinc-200 bg-zinc-50 focus-visible:ring-zinc-900 focus-visible:border-zinc-900 text-sm pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm mt-2 transition-colors"
            >
              Masuk ke Dashboard
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Sistem POS Internal — Toko Bangunan 35
        </p>
      </div>
    </div>
  )
}
