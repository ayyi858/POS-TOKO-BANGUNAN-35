// File ini hanya digunakan untuk mengetes Cron Job di mode Local (komputer Anda sendiri).
// Jalankan di terminal terpisah dengan perintah: node local-cron.js

console.log("=========================================");
console.log("🤖 Local Cron Job Runner Aktif");
console.log("Mengecek pengingat WA setiap 1 menit...");
console.log("=========================================\n");

async function triggerCron() {
  const time = new Date().toLocaleTimeString('id-ID');
  try {
    // Ganti URL ini jika secret diperlukan (contoh: http://localhost:3000/api/cron/reminders?secret=RAHASIA)
    const url = "http://localhost:3000/api/cron/reminders";
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.sent > 0) {
      console.log(`[${time}] ✅ Sukses ngirim ${data.sent} pengingat WA! (Response: ${JSON.stringify(data)})`);
    } else {
      console.log(`[${time}] ⏳ Tidak ada jadwal pengingat untuk terkirim di menit ini.`);
    }
  } catch (error) {
    console.error(`[${time}] ❌ Gagal memanggil API Cron (Apakah localhost:3000 sedang menyala?). Pesan Error:`, error.message);
  }
}

// 1. Panggil langsung sekali pas script dijalankan
triggerCron();

// 2. Set interval untuk memanggil API setiap 1 menit (60000 milidetik)
// Di set setiap 1 menit agar lebih responsif untuk keperluan testing lokal
setInterval(triggerCron, 60 * 1000);
