# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets dan diamankan dengan Firebase Auth.

**Repositori GitHub:** [https://github.com/suryaongko/gulamonitor](https://github.com/suryaongko/gulamonitor)

## 🚀 Cara Mengatasi Error "auth/auth-domain-config-required"
Jika Anda melihat error ini, artinya Firebase belum mengetahui alamat "pintu masuk" untuk login Google Anda.

1. **Buka Firebase Console**: Pergi ke [console.firebase.google.com](https://console.firebase.google.com/).
2. **Cari Config**: Di Project Settings (ikon gerigi), cari bagian "SDK setup and configuration" dan pilih "Config".
3. **Salin Nilai**: Ambil nilai `authDomain` (biasanya `namaproyek.firebaseapp.com`).
4. **Update App Hosting**:
   - Di menu samping, cari **App Hosting**.
   - Pilih backend Anda, lalu klik tab **Environment Variables**.
   - Tambahkan variabel baru: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` dan tempel nilainya di sana.
   - Pastikan variabel lainnya (API Key, Project ID, dll) juga sudah dimasukkan.
5. **Redeploy**: Lakukan deployment ulang di dashboard App Hosting.

## 📱 Cara Akses & Instal di HP Android
Setelah deployment berhasil:
1. Buka URL tersebut di **Google Chrome** pada HP Android Anda.
2. Klik **ikon titik tiga (⋮)** di pojok kanan atas Chrome.
3. Pilih **"Install app"** atau **"Add to Home screen"**.
4. Ikon GulaMonitor akan muncul di menu aplikasi HP Anda.

## ✨ Fitur Utama
- **Google Auth**: Akses pribadi hanya untuk akun Anda.
- **Real-time Sync**: Data masuk otomatis ke Google Sheets melalui Apps Script.
- **PWA Ready**: Bisa diinstal di HP Android tanpa melalui Play Store.
- **AI Health Analysis**: Analisis pola gula darah menggunakan AI Gemini.
