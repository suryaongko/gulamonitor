# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets dan diamankan dengan Firebase Auth.

**Repositori GitHub:** [https://github.com/suryaongko/gulamonitor](https://github.com/suryaongko/gulamonitor)

## 🚀 Cara Mengetahui Halaman Utama (Link Website)
Aplikasi Anda akan memiliki alamat website (URL) setelah Anda melakukan deployment di Firebase:

1. **Buka Firebase Console**: Masuk ke [console.firebase.google.com](https://console.firebase.google.com/).
2. **Pilih Proyek**: Klik proyek Firebase yang Anda gunakan.
3. **Setup App Hosting**:
   - Di menu samping, cari dan klik **App Hosting**.
   - Klik **Get Started**.
   - Hubungkan dengan akun **GitHub** Anda dan pilih repositori `suryaongko/gulamonitor`.
4. **Konfigurasi**:
   - Firebase akan mendeteksi ini sebagai aplikasi Next.js secara otomatis.
   - Di bagian **Environment Variables**, masukkan kunci API Firebase Anda (lihat file `src/firebase/config.ts`).
5. **Dapatkan URL**: Setelah proses build selesai (sekitar 2-5 menit), Firebase akan menampilkan **"Domain"** di dashboard App Hosting. Itu adalah **Halaman Utama** aplikasi Anda.

## ⚠️ Solusi Error "Authorization/Service Account"
Jika Anda melihat error saat menghubungkan GitHub:
- **Pastikan Anda Admin**: Anda harus menjadi pemilik repositori GitHub tersebut.
- **Aktifkan API**: Di Google Cloud Console, pastikan "App Hosting API" dan "Cloud Build API" sudah dalam status *Enabled*.
- **Izin Pop-up**: Pastikan browser Anda tidak memblokir jendela pop-up saat otorisasi GitHub.
- **Coba Lagi**: Jika gagal, batalkan proses, segarkan halaman browser, dan ulangi langkah dari "Connect to GitHub".

## 📱 Cara Akses & Instal di HP Android
Setelah Anda mendapatkan URL:
1. Buka URL tersebut di **Google Chrome** pada HP Android Anda.
2. Klik **ikon titik tiga (⋮)** di pojok kanan atas Chrome.
3. Pilih **"Install app"** atau **"Add to Home screen"**.
4. Ikon GulaMonitor akan muncul di menu aplikasi HP Anda.

## ✨ Fitur Utama
- **Google Auth**: Akses pribadi hanya untuk akun Anda.
- **Real-time Sync**: Data masuk otomatis ke Google Sheets melalui Apps Script.
- **PWA Ready**: Bisa diinstal di HP Android tanpa melalui Play Store.
- **AI Health Analysis**: Analisis pola gula darah menggunakan AI Gemini.
