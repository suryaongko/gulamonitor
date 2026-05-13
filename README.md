
# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi dengan Google Sheets.

---

## 📊 SETUP SINKRONISASI GOOGLE SHEETS (PENTING!)

Agar data dari aplikasi langsung terupdate di Google Sheets, Anda wajib memasang Script berikut:

### 1. Di Google Sheets Anda
1. Buka file Google Sheets Anda.
2. Klik menu **Extensions** -> **Apps Script**.
3. Hapus semua kode yang ada, dan tempel kode berikut:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data = JSON.parse(e.postData.contents);
    
    // Format Tanggal (GMT+7)
    var timestamp = new Date(data.timestamp);
    var formattedDate = Utilities.formatDate(timestamp, "GMT+7", "dd/MM/yyyy HH:mm:ss");
    
    // Masukkan baris baru: Tanggal, Nilai
    sheet.appendRow([formattedDate, data.value]);
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
```

4. Klik ikon **Save** (beri nama "GulaMonitorSync").
5. **JANGAN KLIK RUN**. Klik tombol **Deploy** -> **New Deployment**.
6. Pilih type: **Web App**.
7. Description: "Sync dari GulaMonitor App".
8. Execute as: **Me** (Email Anda).
9. Who has access: **Anyone** (Ini sangat penting agar aplikasi bisa mengirim data tanpa error).
10. Klik **Deploy**. Jika muncul permintaan izin, klik **Authorize Access** dan pilih akun Google Anda.
11. Salin **Web App URL** yang muncul. Tempel URL tersebut ke variabel `APPS_SCRIPT_URL` di file `src/components/dashboard/gula-dashboard.tsx`.

### 2. Publish CSV (Agar Aplikasi Bisa Membaca Data)
1. Di Google Sheets, klik **File** -> **Share** -> **Publish to web**.
2. Pilih **Whole Document** atau **Sheet1**, lalu pilih format **Comma-separated values (.csv)**.
3. Klik **Publish**. Salin link yang muncul dan tempel ke `GOOGLE_SHEETS_CSV_URL` di aplikasi.
4. **Catatan**: Google Sheets memiliki delay sekitar 5 menit untuk memperbarui link CSV ini. Data baru yang Anda masukkan akan muncul di aplikasi setelah beberapa menit.

---

## 🔑 SETUP API KEY (Firebase)

Jika login gagal, masukkan config di Dashboard App Hosting:
1. `NEXT_PUBLIC_FIREBASE_API_KEY`
2. `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
4. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
5. `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
6. `NEXT_PUBLIC_FIREBASE_APP_ID`
7. Klik **"Save and create new release"**.
