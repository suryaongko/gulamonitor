# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets dan diamankan dengan Firebase Auth.

## 🚀 Cara Membuat Aplikasi Live (Online)
Setelah kode Anda berada di GitHub, ikuti langkah ini agar bisa diakses secara publik:

1. **Buka Firebase Console**: Pergi ke [console.firebase.google.com](https://console.firebase.google.com/).
2. **Pilih Proyek Anda**: Klik proyek yang Anda gunakan untuk aplikasi ini.
3. **Setup App Hosting**:
   - Di menu sebelah kiri, cari **App Hosting**.
   - Klik **Get Started** dan hubungkan dengan akun **GitHub** Anda.
   - Pilih repositori `GulaMonitor` yang baru saja Anda upload.
4. **Set Environment Variables**:
   - Di pengaturan App Hosting, pastikan Anda memasukkan semua kunci API Firebase Anda (seperti `NEXT_PUBLIC_FIREBASE_API_KEY`, dll) agar aplikasi bisa berjalan dengan benar.
5. **Deployment**: Tunggu proses build selesai. Firebase akan memberikan Anda sebuah **Domain/URL publik**.

## 📱 Cara Akses di HP Android (Instal Aplikasi)
Setelah aplikasi Anda live dan memiliki URL:

1. Buka URL tersebut (misal: `https://gulamonitor-xyz.web.app`) di **Google Chrome** pada HP Android.
2. Masuk menggunakan akun Google Anda.
3. Klik **ikon titik tiga (⋮)** di pojok kanan atas Chrome.
4. Pilih **"Install app"** atau **"Add to Home screen"**.
5. Klik **Install**.
6. Ikon GulaMonitor akan muncul di menu aplikasi HP Anda. Buka dari sana untuk pengalaman layar penuh tanpa bar alamat browser.

## ✨ Fitur Utama
- **Google Auth**: Akses pribadi hanya untuk akun Anda.
- **Real-time Sync**: Data masuk otomatis ke Google Sheets.
- **PWA Ready**: Bisa diinstal di HP Android.
- **AI Health Analysis**: Analisis pola gula darah menggunakan AI.
