# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets dan diamankan dengan Firebase Auth.

## ☁️ Catatan Penting: Lingkungan Kerja Cloud
Aplikasi ini berjalan di **Cloud (Internet)**, bukan langsung di harddisk Mac Anda. Itulah sebabnya Anda tidak menemukan filenya di Finder Mac Anda secara otomatis.

## 🚀 Cara 1: Upload ke GitHub Langsung (Cara Tercepat)
Anda tidak perlu mendownload file ke Mac. Gunakan **Terminal** di bawah ini untuk mengirim kode langsung ke GitHub:

1. **Buat Repositori Baru** di GitHub (kosong, tanpa README).
2. **Buka Terminal** di bagian bawah layar ini.
3. **Ketik perintah ini satu per satu**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: GulaMonitor"
   git remote add origin https://github.com/USERNAME-ANDA/NAMA-REPOS-ANDA.git
   git branch -M main
   git push -u origin main
   ```

## 📥 Cara 2: Download File ke Mac Anda
Jika Anda tetap ingin memiliki filenya di komputer Anda:
1. Di daftar file sebelah kiri, klik kanan pada area kosong.
2. Jika ada menu **"Download"** atau **"Export"**, pilih itu.
3. **Atau lewat Terminal**:
   - Ketik: `zip -r gula-monitor.zip . -x ".next/*" "node_modules/*"`
   - Tunggu sampai muncul file `gula-monitor.zip` di daftar file sebelah kiri.
   - Klik kanan file `gula-monitor.zip` tersebut, lalu pilih **Download**.

## ✨ Fitur Utama
- **Google Auth**: Akses pribadi hanya untuk akun Anda.
- **Real-time Sync**: Data masuk otomatis ke Google Sheets.
- **PWA Ready**: Bisa diinstal di HP Android (Add to Home Screen).
- **AI Health Analysis**: Analisis pola gula darah menggunakan AI.
# gulamonitor
