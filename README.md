# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets dan diamankan dengan Firebase Auth.

## Lokasi Proyek & Cara Akses Terminal
Untuk menemukan folder ini di Mac Anda, Anda harus menggunakan **Terminal** di dalam IDE ini:

1. **Cari Panel Terminal**: Lihat di bagian **bawah layar** IDE Firebase Studio ini. Cari tab bertuliskan **"Terminal"**.
2. **Jika Terminal Tidak Muncul**: Klik menu ikon kotak kecil dengan tanda `>_` di bagian bawah atau gunakan shortcut `Ctrl + \`` (tombol di bawah tombol Esc).
3. **Ketik Perintah Ini**:
   - Ketik `pwd` untuk melihat alamat lengkap foldernya (contoh: `/home/user/project`).
   - Ketik `open .` (open spasi titik) lalu tekan Enter. Ini akan otomatis membuka folder proyek Anda di **Finder Mac** Anda.

## Cara Upload ke GitHub
Setelah folder terbuka di Finder:
1. Inisialisasi Git di Terminal:
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
