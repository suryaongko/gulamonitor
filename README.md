# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets dan diamankan dengan Firebase Auth.

## Lokasi Proyek di Mac Anda
Untuk menemukan folder ini di Mac Anda:
1. Buka terminal di lingkungan ini.
2. Ketik `pwd` untuk melihat alamat lengkap foldernya.
3. Ketik `open .` (buka spasi titik) lalu tekan Enter. Ini akan otomatis membuka folder proyek Anda di **Finder**.

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
