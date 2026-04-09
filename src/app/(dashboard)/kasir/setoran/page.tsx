import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { submitDeposit } from '@/actions/shift'
import { Wallet, CheckCircle2 } from 'lucide-react'

export default async function SetoranPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: deposits } = await supabase
    .from('deposits')
    .select('*, shifts(end_time, actual_cash)')
    .eq('status', 'BELUM_SETOR')

  const myDeposits = deposits?.filter(d => (d.shifts as any)?.end_time != null) || []

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-zinc-900">Setoran Kasir</h2>
        <p className="text-sm text-zinc-500 mt-0.5">Daftar tanggungan uang fisik yang harus disetorkan ke owner.</p>
      </div>

      <div className="max-w-lg">
        <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-zinc-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Tanggungan Setoran</p>
              <p className="text-xs text-zinc-400">Uang fisik laci yang belum diserahkan</p>
            </div>
            {myDeposits.length > 0 && (
              <span className="ml-auto text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded-lg">
                {myDeposits.length} pending
              </span>
            )}
          </div>

          {myDeposits.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-center px-6">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-zinc-700">Semua bersih</p>
              <p className="text-xs text-zinc-400">Tidak ada tanggungan setoran saat ini.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {myDeposits.map(d => (
                <div key={d.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-400 mb-1">
                      Tutup Shift: {new Date((d.shifts as any).end_time).toLocaleString('id-ID')}
                    </p>
                    <p className="text-lg font-bold text-zinc-900">
                      Rp {Number(d.amount).toLocaleString('id-ID')}
                    </p>
                    <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded mt-1.5 inline-block">
                      Belum Disetor
                    </span>
                  </div>
                  <form action={async () => { 'use server'; await submitDeposit(d.shift_id); }}>
                    <Button
                      type="submit"
                      className="rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold h-9 px-4 shrink-0"
                    >
                      Tandai Disetor
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
