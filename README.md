
# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets dan diamankan dengan Firebase Auth.

**Repositori GitHub:** [https://github.com/suryaongko/gulamonitor](https://github.com/suryaongko/gulamonitor)

## 🛠 Cara Mengatasi Masalah Login Google
Jika tombol login tidak memberikan respon atau muncul error:

1.  **Aktifkan Google Provider**:
    *   Buka [Firebase Console](https://console.firebase.google.com/).
    *   Pilih menu **Authentication** > **Sign-in method**.
    *   Klik **Add new provider** dan pilih **Google**.
    *   Aktifkan (Enable) dan simpan.

2.  **Daftarkan Domain Aplikasi**:
    *   Di menu **Authentication** > **Settings** > **Authorized domains**.
    *   Tambahkan domain hosting Anda (misal: `gulamonitor.web.app` dan domain dari App Hosting).

3.  **Cek Environment Variables**:
    *   Pastikan di **App Hosting Dashboard** Anda sudah memasukkan:
        *   `NEXT_PUBLIC_FIREBASE_API_KEY`
        *   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
        *   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

## 📱 Cara Akses & Instal di HP Android
1. Buka URL aplikasi di **Google Chrome** pada HP.
2. Klik **ikon titik tiga (⋮)** di pojok kanan atas.
3. Pilih **"Install app"** atau **"Add to Home screen"**.

## 💻 Lokasi Folder & Cara Upload ke GitHub
Jika Anda menggunakan **Mac**:
1. Buka **Terminal** di bagian bawah Firebase Studio ini.
2. Ketik `pwd` untuk melihat lokasi folder.
3. Ketik `open .` untuk membuka folder di Finder Mac Anda.
4. Untuk upload: `git add .`, `git commit -m "update"`, `git push origin main`.

## ✨ Fitur Utama
- **Google Auth**: Akses pribadi hanya untuk akun Anda.
- **Real-time Sync**: Data masuk otomatis ke Google Sheets.
- **PWA Ready**: Bisa diinstal di HP tanpa Play Store.
- **AI Health Analysis**: Analisis pola gula darah menggunakan AI Gemini.
