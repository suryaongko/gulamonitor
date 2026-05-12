# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets dan diamankan dengan Firebase Auth.

## Lokasi Proyek di Komputer Anda
Untuk menemukan folder ini di komputer Anda:
1. Buka terminal di lingkungan ini.
2. Ketik `pwd` (Mac/Linux) atau `echo %cd%` (Windows).
3. Jalankan `explorer .` (Windows) atau `open .` (Mac) untuk membuka folder tersebut di file manager Anda.

## Cara Upload ke GitHub
1. Inisialisasi Git:
   ```bash
   git init
   ```
2. Tambahkan file:
   ```bash
   git add .
   ```
3. Commit:
   ```bash
   git commit -m "Initial commit: GulaMonitor"
   ```
4. Hubungkan ke repositori GitHub Anda:
   ```bash
   git remote add origin https://github.com/USERNAME/NAMA-REPOSITORI.git
   git branch -M main
   git push -u origin main
   ```

## Fitur Utama
- **Google Auth**: Akses pribadi hanya untuk akun Anda.
- **Real-time Sync**: Data masuk otomatis ke Google Sheets saat Anda menambah "New Reading".
- **PWA Ready**: Bisa diinstal di HP Android melalui menu "Add to Home Screen" di Chrome.
- **AI Health Analysis**: Analisis pola gula darah menggunakan AI.

## Pengaturan Google Sheets
Pastikan Anda sudah menempelkan kode Apps Script di Google Sheets Anda dan memasukkan URL Web App-nya di dalam kode `src/components/dashboard/gula-dashboard.tsx`.
