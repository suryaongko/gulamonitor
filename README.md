
# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets dan diamankan dengan Firebase Auth.

---

## 🔑 CARA MEMASUKKAN API KEY (WAJIB)

Tanpa langkah ini, aplikasi tidak akan bisa login atau menyimpan data.

### 1. Temukan Kunci Anda di Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Klik ikon **Gerigi (Settings)** -> **Project settings**.
3. Gulir ke bawah ke bagian **"Your apps"**.
4. Di bagian **"SDK setup and configuration"**, pilih opsi **"Config"**.
5. Anda akan melihat kode seperti ini:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "project-id.firebaseapp.com",
     ...
   };
   ```

### 2. Masukkan ke Website Live (Dashboard App Hosting)
Ini adalah langkah paling penting agar website Anda di internet berfungsi:
1. Buka Dashboard **App Hosting** di Firebase Console.
2. Pilih backend aplikasi Anda.
3. Klik tab **Environment variables**.
4. Klik **Add variable** dan masukkan satu per satu (Gunakan huruf kapital):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
5. Klik **Save and create new release**. Tunggu sampai proses build selesai (sekitar 2-5 menit).

### 3. Masukkan ke Komputer (File .env)
Jika Anda menjalankan aplikasi di komputer sendiri:
1. Buka file bernama `.env` di folder proyek ini.
2. Tempelkan nilai-nilai yang Anda salin dari Firebase Console sesuai dengan nama variabelnya.

---

## 🛠 Cara Mengatasi Masalah Login Google
Jika tombol login tidak memberikan respon atau muncul error:

1. **Aktifkan Google Provider**:
   - Buka **Authentication** -> **Sign-in method**.
   - Klik **Add new provider** -> **Google** -> **Enable**.
   - Masukkan nama proyek dan email dukungan.

2. **Daftarkan Domain**:
   - Buka **Authentication** -> **Settings** -> **Authorized domains**.
   - Tambahkan domain website Anda (contoh: `gulamonitor-xxxxx.web.app`).

---

## 📱 Cara Akses di HP
1. Buka URL aplikasi di Chrome HP.
2. Klik **ikon titik tiga (⋮)**.
3. Pilih **"Install app"** atau **"Tambahkan ke Layar Utama"**.
