const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing credentials")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedUsers() {
  const usersToCreate = [
    { email: 'owner@pos.com', password: 'password123', name: 'Budi (Owner)', role: 'OWNER' },
    { email: 'kasir@pos.com', password: 'password123', name: 'Siti (Kasir)', role: 'KASIR' }
  ]

  for (const user of usersToCreate) {
    // 1. Create auth user (auto confirm)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true
    })

    if (authError) {
      console.log(`❌ Gagal buat Auth User ${user.email}:`, authError.message)
      continue
    }

    // 2. Insert mapped user profile into public.users
    const { error: dbError } = await supabase.from('users').insert({
      id: authData.user.id,
      name: user.name,
      email: user.email,
      role: user.role
    })

    if (dbError) {
      console.log(`❌ Gagal buat Profil ${user.email}:`, dbError.message)
    } else {
      console.log(`✅ Berhasil membuat akun: ${user.email} (${user.role})`)
    }
  }
}

seedUsers()
