// Seed script using service_role key (bypasses RLS)
// Usage: node seed-admin.mjs YOUR_SERVICE_ROLE_KEY
// Get service role key from: Supabase Dashboard > Project Settings > API > service_role secret
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://japexpsqykimpgdbshwi.supabase.co'
const SERVICE_ROLE_KEY = process.argv[2]

if (!SERVICE_ROLE_KEY) {
  console.error('\n❌ Usage: node seed-admin.mjs <SERVICE_ROLE_KEY>')
  console.error('   Get it from: Supabase Dashboard > Project Settings > API > service_role secret\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const suppliers = [
  { name: 'CV. Surya Bangunan', contact: '081234560001', address: 'Jl. Veteran No. 12, Makassar' },
  { name: 'PT. Bintang Material', contact: '081234560002', address: 'Jl. Urip Sumoharjo No. 44, Makassar' },
  { name: 'UD. Berkah Konstruksi', contact: '081234560003', address: 'Jl. Cokroaminoto No. 88, Makassar' },
  { name: 'CV. Maju Sejahtera', contact: '081234560004', address: 'Jl. Pettarani No. 5, Makassar' },
  { name: 'PT. Karya Mandiri', contact: '081234560005', address: 'Jl. AP Pettarani No. 20, Makassar' },
  { name: 'UD. Sinar Abadi', contact: '081234560006', address: 'Jl. Hertasning No. 3, Makassar' },
  { name: 'CV. Anugrah Material', contact: '081234560007', address: 'Jl. Toddopuli No. 7, Makassar' },
  { name: 'PT. Multi Bangun', contact: '081234560008', address: 'Jl. Rappocini No. 15, Makassar' },
  { name: 'UD. Putra Kencana', contact: '081234560009', address: 'Jl. Tamalate No. 22, Makassar' },
  { name: 'CV. Jaya Abadi', contact: '081234560010', address: 'Jl. Dg. Tata No. 30, Makassar' },
  { name: 'PT. Cahaya Timur', contact: '081234560011', address: 'Jl. Abdullah Dg. Sirua No. 8, Makassar' },
  { name: 'UD. Rezeki Berlimpah', contact: '081234560012', address: 'Jl. Perintis Kemerdekaan No. 55, Makassar' },
  { name: 'CV. Fajar Material', contact: '081234560013', address: 'Jl. Kumala No. 18, Makassar' },
  { name: 'PT. Nusantara Building', contact: '081234560014', address: 'Jl. Landak No. 40, Makassar' },
  { name: 'UD. Sentosa Bangunan', contact: '081234560015', address: 'Jl. Andi Djemma No. 9, Makassar' },
  { name: 'CV. Prima Jaya', contact: '081234560016', address: 'Jl. Racing Centre No. 2, Makassar' },
  { name: 'PT. Sumber Daya', contact: '081234560017', address: 'Jl. Sultan Hasanuddin No. 77, Makassar' },
  { name: 'UD. Harapan Baru', contact: '081234560018', address: 'Jl. Andi Mapanyukki No. 14, Makassar' },
  { name: 'CV. Mandiri Utama', contact: '081234560019', address: 'Jl. Baji Gau No. 33, Makassar' },
  { name: 'PT. Inti Bangun Perkasa', contact: '081234560020', address: 'Jl. Kakatua No. 6, Makassar' },
]

const products = [
  { name: 'Semen Portland Tiga Roda 50kg', category: 'Semen', price: 65000, stock: 200, min_stock: 30 },
  { name: 'Semen Gresik 50kg', category: 'Semen', price: 63000, stock: 150, min_stock: 30 },
  { name: 'Semen Holcim 50kg', category: 'Semen', price: 64000, stock: 120, min_stock: 25 },
  { name: 'Bata Merah Standar (per biji)', category: 'Bata', price: 800, stock: 5000, min_stock: 500 },
  { name: 'Bata Ringan AAC 10cm', category: 'Bata', price: 12000, stock: 1000, min_stock: 200 },
  { name: 'Pasir Beton (per karung)', category: 'Material', price: 35000, stock: 300, min_stock: 50 },
  { name: 'Pasir Halus (per karung)', category: 'Material', price: 30000, stock: 250, min_stock: 50 },
  { name: 'Kerikil/Split (per karung)', category: 'Material', price: 40000, stock: 200, min_stock: 40 },
  { name: 'Besi Beton 10mm (batang)', category: 'Besi', price: 95000, stock: 300, min_stock: 50 },
  { name: 'Besi Beton 12mm (batang)', category: 'Besi', price: 130000, stock: 250, min_stock: 40 },
  { name: 'Besi Beton 8mm (batang)', category: 'Besi', price: 72000, stock: 200, min_stock: 40 },
  { name: 'Besi Hollow 4x4 (batang)', category: 'Besi', price: 85000, stock: 100, min_stock: 20 },
  { name: 'Pipa PVC 4 inch (batang)', category: 'Pipa', price: 95000, stock: 120, min_stock: 20 },
  { name: 'Pipa PVC 2 inch (batang)', category: 'Pipa', price: 45000, stock: 150, min_stock: 30 },
  { name: 'Pipa HDPE 2 inch (roll 50m)', category: 'Pipa', price: 750000, stock: 30, min_stock: 10 },
  { name: 'Cat Tembok Dulux 5kg', category: 'Cat', price: 185000, stock: 80, min_stock: 15 },
  { name: 'Cat Besi Avian 1kg', category: 'Cat', price: 58000, stock: 60, min_stock: 10 },
  { name: 'Cat Tembok Vinilex 5kg', category: 'Cat', price: 165000, stock: 70, min_stock: 15 },
  { name: 'Genteng UPVC per lembar', category: 'Atap', price: 120000, stock: 200, min_stock: 30 },
  { name: 'Seng Gelombang (per lembar)', category: 'Atap', price: 85000, stock: 150, min_stock: 30 },
  { name: 'Triplek 9mm (per lembar)', category: 'Kayu', price: 145000, stock: 100, min_stock: 20 },
  { name: 'Triplek 12mm (per lembar)', category: 'Kayu', price: 185000, stock: 80, min_stock: 15 },
  { name: 'Kayu Kaso 5x7 (kubik)', category: 'Kayu', price: 3500000, stock: 20, min_stock: 5 },
  { name: 'Kayu Reng 3x5 (kubik)', category: 'Kayu', price: 3000000, stock: 15, min_stock: 5 },
  { name: 'Paku 5cm (per kg)', category: 'Perkakas', price: 18000, stock: 200, min_stock: 30 },
  { name: 'Paku 7cm (per kg)', category: 'Perkakas', price: 17000, stock: 200, min_stock: 30 },
  { name: 'Paku Beton 5cm (per box)', category: 'Perkakas', price: 35000, stock: 100, min_stock: 20 },
  { name: 'Kawat Beton (per roll)', category: 'Material', price: 75000, stock: 80, min_stock: 15 },
  { name: 'Wiremesh M6 (lembar)', category: 'Besi', price: 580000, stock: 50, min_stock: 10 },
  { name: 'Wiremesh M8 (lembar)', category: 'Besi', price: 850000, stock: 30, min_stock: 8 },
  { name: 'Keramik Lantai 40x40 (dus)', category: 'Keramik', price: 105000, stock: 200, min_stock: 30 },
  { name: 'Keramik Lantai 60x60 (dus)', category: 'Keramik', price: 165000, stock: 150, min_stock: 25 },
  { name: 'Keramik Dinding 25x40 (dus)', category: 'Keramik', price: 95000, stock: 120, min_stock: 20 },
  { name: 'Lem Keramik Extrafix 25kg', category: 'Perekat', price: 75000, stock: 80, min_stock: 15 },
  { name: 'Grout Nat AM 1kg', category: 'Perekat', price: 22000, stock: 150, min_stock: 25 },
  { name: 'Kabel NYA 2.5mm (per roll 50m)', category: 'Listrik', price: 280000, stock: 50, min_stock: 10 },
  { name: 'Kabel NYY 4x2.5mm (per m)', category: 'Listrik', price: 32000, stock: 200, min_stock: 30 },
  { name: 'Stop Kontak Broco', category: 'Listrik', price: 25000, stock: 100, min_stock: 20 },
  { name: 'Saklar Ganda Broco', category: 'Listrik', price: 18000, stock: 80, min_stock: 15 },
  { name: 'MCB 10A Schneider', category: 'Listrik', price: 85000, stock: 50, min_stock: 10 },
  { name: 'Waterproofing Sikalastic 1L', category: 'Waterproofing', price: 120000, stock: 60, min_stock: 10 },
  { name: 'Waterproof Mortarflex 20kg', category: 'Waterproofing', price: 185000, stock: 40, min_stock: 8 },
  { name: 'Hebel/Bata Ringan 20cm', category: 'Bata', price: 14000, stock: 800, min_stock: 150 },
  { name: 'Roster Beton (per biji)', category: 'Aksesori', price: 12000, stock: 300, min_stock: 50 },
  { name: 'Besi Siku 40x40 (batang)', category: 'Besi', price: 115000, stock: 80, min_stock: 15 },
  { name: 'Sealant Sikaflex (tube)', category: 'Perekat', price: 65000, stock: 80, min_stock: 15 },
  { name: 'Kuas Cat 4 inch', category: 'Perkakas', price: 28000, stock: 80, min_stock: 20 },
  { name: 'Rol Cat 7 inch', category: 'Perkakas', price: 35000, stock: 60, min_stock: 15 },
  { name: 'Ember Cor 12 Liter', category: 'Perkakas', price: 45000, stock: 50, min_stock: 10 },
  { name: 'Sekop Cor (batang)', category: 'Perkakas', price: 85000, stock: 30, min_stock: 8 },
]

async function seed() {
  console.log('🌱 Seeding suppliers...')
  const { data: suppData, error: suppError } = await supabase
    .from('suppliers')
    .insert(suppliers)
    .select()
  if (suppError) {
    console.error('❌ Error inserting suppliers:', suppError.message)
    process.exit(1)
  }
  console.log(`✅ Inserted ${suppData.length} suppliers`)

  console.log('🌱 Seeding products...')
  const { data: prodData, error: prodError } = await supabase
    .from('products')
    .insert(products)
    .select()
  if (prodError) {
    console.error('❌ Error inserting products:', prodError.message)
    process.exit(1)
  }
  console.log(`✅ Inserted ${prodData.length} products`)

  console.log('\n🎉 Database seeding complete!')
  console.log(`   Suppliers: ${suppData.length}`)
  console.log(`   Products:  ${prodData.length}`)
}

seed().catch(console.error)
