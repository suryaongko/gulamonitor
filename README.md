
# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets dan diamankan dengan Firebase Auth.

**Repositori GitHub:** [https://github.com/suryaongko/gulamonitor](https://github.com/suryaongko/gulamonitor)

---

## 🔑 CARA MEMASUKKAN API KEY (PENTING!)
Aplikasi memerlukan "kunci" agar bisa terhubung ke database Anda. Ikuti langkah ini:

### 1. Dapatkan Kunci dari Firebase Console
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Klik ikon **Gerigi (Settings)** di samping "Project Overview" > **Project settings**.
3. Gulir ke bawah ke bagian **"Your apps"**.
4. Di bagian **"SDK setup and configuration"**, pilih opsi **"Config"**.
5. Salin nilai-nilai yang ada (apiKey, authDomain, projectId, dll).

### 2. Masukkan ke Dashboard App Hosting (Untuk Website Live)
Agar website Anda di `https://...` berfungsi:
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
5. Klik **Save and create new release**. Tunggu proses build selesai.

---

## 🛠 Cara Mengatasi Masalah Login Google
Jika tombol login tidak memberikan respon atau muncul error:

1. **Aktifkan Google Provider**:
   - Buka **Authentication** > **Sign-in method**.
   - Klik **Add new provider** > **Google** > **Enable**.

2. **Daftarkan Domain**:
   - Buka **Authentication** > **Settings** > **Authorized domains**.
   - Tambahkan domain hosting Anda (misal: `gulamonitor.web.app` dan domain dari App Hosting).

## 📱 Cara Akses di HP
1. Buka URL aplikasi di Chrome HP.
2. Klik **ikon titik tiga (⋮)**.
3. Pilih **"Install app"**.

## 💻 Lokasi Folder (Mac/Linux)
1. Buka **Terminal** di bawah ini.
2. Ketik `pwd` untuk melihat lokasi.
3. Ketik `open .` untuk membuka di Finder.
