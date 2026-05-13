
# GulaMonitor - Health Sync

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi secara instan dengan Google Sheets.

---

## 📊 SETUP SINKRONISASI GOOGLE SHEETS (WAJIB)

Agar data dari aplikasi langsung terupdate di Google Sheets dan bisa dibaca kembali oleh aplikasi, lakukan langkah berikut:

### 1. Pasang Script Penerima Data
1. Buka file Google Sheets Anda.
2. Klik menu **Extensions** -> **Apps Script**.
3. Hapus semua kode yang ada, dan tempel kode berikut (Zona Waktu: Berlin):

```javascript
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput("Error: No data received").setMimeType(ContentService.MimeType.TEXT);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var data = JSON.parse(e.postData.contents);
    
    if (!data.value || !data.timestamp) {
      return ContentService.createTextOutput("Error: Missing fields").setMimeType(ContentService.MimeType.TEXT);
    }

    // Parsing timestamp (ISO String)
    var timestamp = new Date(data.timestamp);
    
    // Format tanggal Berlin: DD/MM/YYYY HH:mm:ss
    var formattedDate = Utilities.formatDate(timestamp, "Europe/Berlin", "dd/MM/yyyy HH:mm:ss");
    
    // Masukkan baris baru: Tanggal, Nilai, Email
    sheet.appendRow([formattedDate, data.value, data.userEmail || "Unknown"]);
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
```

4. Klik ikon **Save** (beri nama "GulaMonitorSync").
5. Klik tombol **Deploy** -> **New Deployment**.
6. Pilih type: **Web App**.
7. Execute as: **Me** (Email Anda).
8. Who has access: **Anyone**.
9. Klik **Deploy**. Salin **Web App URL** dan tempel ke variabel `APPS_SCRIPT_URL` di `src/components/dashboard/gula-dashboard.tsx`.

### 2. Publikasikan CSV (Agar Aplikasi Bisa Membaca Data)
1. Di Google Sheets, klik **File** -> **Share** -> **Publish to web**.
2. Pilih format **Comma-separated values (.csv)**.
3. Klik **Publish**. Salin link yang muncul dan tempel ke `GOOGLE_SHEETS_CSV_URL` di `src/components/dashboard/gula-dashboard.tsx`.

---

## 🛡️ HAK AKSES
- **Owner (surya.ongko@gmail.com)**: Memiliki akses penuh.
- **Guest**: Hanya bisa melihat data owner jika sudah disetujui.
