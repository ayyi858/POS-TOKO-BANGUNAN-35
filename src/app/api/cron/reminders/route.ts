import { NextResponse } from 'next/server'
import { checkAndSendAutoReminders } from '@/actions/procurement'

// This route is called by a cron job at regular intervals
// Example: https://your-domain.com/api/cron/reminders?secret=YOURSECRETKEY
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')

  // Basic protection - set CRON_SECRET in your .env
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await checkAndSendAutoReminders()
    return NextResponse.json({ ok: true, ...result })
  } catch (err: any) {
    console.error('Cron Reminder Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
