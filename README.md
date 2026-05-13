
# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets.

---

## 📊 SETUP SINKRONISASI GOOGLE SHEETS (Dua Arah)

Agar data dari aplikasi langsung terupdate di Google Sheets, Anda wajib memasang Script berikut:

### 1. Di Google Sheets Anda
1. Buka file Google Sheets Anda.
2. Klik menu **Extensions** -> **Apps Script**.
3. Hapus semua kode yang ada, dan tempel kode berikut:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = JSON.parse(e.postData.contents);
  
  // Format Tanggal (GMT+7)
  var timestamp = new Date(data.timestamp);
  var formattedDate = Utilities.formatDate(timestamp, "GMT+7", "dd/MM/yyyy HH:mm:ss");
  
  // Masukkan baris baru: Tanggal, Nilai
  sheet.appendRow([formattedDate, data.value]);
  
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}
```

4. Klik ikon **Save** (beri nama "GulaMonitorSync").
5. Klik tombol **Deploy** -> **New Deployment**.
6. Pilih type: **Web App**.
7. Description: "Sync dari GulaMonitor App".
8. Execute as: **Me** (Email Anda).
9. Who has access: **Anyone** (Penting agar aplikasi bisa mengirim data).
10. Klik **Deploy** dan salin **Web App URL**. Tempel URL tersebut ke variabel `APPS_SCRIPT_URL` di file `src/components/dashboard/gula-dashboard.tsx`.

### 2. Publish CSV (Untuk Download Data)
1. Di Google Sheets, klik **File** -> **Share** -> **Publish to web**.
2. Pilih **Whole Document** atau **Sheet1**, lalu pilih format **Comma-separated values (.csv)**.
3. Klik **Publish**. Salin link yang muncul dan tempel ke `GOOGLE_SHEETS_CSV_URL` di aplikasi.
4. **Catatan**: Google Sheets butuh waktu ~5 menit untuk mengupdate link CSV ini setelah ada data baru masuk.

---

## 🔑 CARA MENGATASI LOGIN GAGAL (API KEY INVALID)

Jika Anda melihat pesan **"firebase: error auth/api-key-not-valid"**, masukkan config di Dashboard App Hosting:

1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Copy `apiKey`, `authDomain`, dll dari Project Settings.
3. Masukkan ke **App Hosting Environment Variables**:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. Klik **"Save and create new release"**.
