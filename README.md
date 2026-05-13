
# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets dan diamankan dengan Firebase Auth.

---

## 🔑 CARA MENGATASI LOGIN GAGAL (API KEY INVALID)

Jika Anda melihat pesan **"firebase: error auth/api-key-not-valid"**, artinya aplikasi Anda berjalan tetapi tidak memiliki "kunci" untuk mengakses database Firebase Anda.

### 1. Dapatkan Konfigurasi yang Benar
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Klik ikon **Gerigi (Settings)** -> **Project settings**.
3. Gulir ke bawah ke bagian **"Your apps"**.
4. Di bagian **"SDK setup and configuration"**, pastikan memilih opsi **"Config"**.
5. Salin nilai `apiKey`, `authDomain`, dll. **Pastikan tidak menyalin tanda kutip atau koma.**

### 2. Masukkan ke Dashboard App Hosting (Live Website)
Langkah ini wajib dilakukan agar website yang sudah di-deploy bisa berfungsi:
1. Buka Dashboard **App Hosting** di Firebase Console.
2. Pilih backend aplikasi Anda.
3. Klik tab **Environment variables**.
4. Klik **Add variable** dan masukkan nilai berikut (Gunakan HURUF KAPITAL):
   - `NEXT_PUBLIC_FIREBASE_API_KEY` = (tempel apiKey Anda)
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = (tempel authDomain Anda)
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = (tempel projectId Anda)
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = (tempel storageBucket Anda)
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = (tempel messagingSenderId Anda)
   - `NEXT_PUBLIC_FIREBASE_APP_ID` = (tempel appId Anda)
5. **PENTING**: Klik **"Save and create new release"**. Perubahan tidak akan aktif sampai rilis baru selesai di-build (tunggu 2-5 menit).

### 3. Aktifkan Google Login di Firebase
1. Buka menu **Authentication** -> **Sign-in method**.
2. Klik **Add new provider** -> pilih **Google**.
3. Klik **Enable**, masukkan email dukungan Anda, lalu klik **Save**.
4. Buka tab **Settings** -> **Authorized domains**.
5. Klik **Add domain** dan masukkan alamat website Anda (misal: `gulamonitor-xxxxx.web.app`).

---

## 📱 Cara Akses di HP
1. Buka URL aplikasi di Chrome HP.
2. Klik **ikon titik tiga (⋮)**.
3. Pilih **"Install app"** atau **"Tambahkan ke Layar Utama"**.
