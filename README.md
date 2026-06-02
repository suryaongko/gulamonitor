
# GulaMonitor - Health Sync (Berlin Time)

Aplikasi pemantauan gula darah pribadi yang tersinkronisasi secara instan dengan Google Sheets menggunakan zona waktu Berlin.

---

## 📊 SETUP SINKRONISASI GOOGLE SHEETS (WAJIB)

### 1. Pasang Script Penerima Data
1. Buka file Google Sheets Anda.
2. Klik menu **Extensions** -> **Apps Script**.
3. Hapus semua kode yang ada, dan tempel kode berikut:

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
    
    // Zona Waktu: Berlin (Europe/Berlin)
    var formattedDate = Utilities.formatDate(timestamp, "Europe/Berlin", "dd/MM/yyyy HH:mm:ss");
    
    // OPTIMASI: Sisipkan di Baris 2 agar data terbaru selalu di atas (Menghindari limit 2801 baris Google)
    sheet.insertRowBefore(2);
    sheet.getRange(2, 1, 1, 3).setValues([[formattedDate, data.value, data.userEmail || "Unknown"]]);
    
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
```

### 2. Publikasikan CSV & Pengurutan
1. Di Google Sheets, klik **File** -> **Share** -> **Publish to web**.
2. Pilih format **Comma-separated values (.csv)**.
3. Klik **Publish**. Salin link yang muncul.
4. **PENTING**: Urutkan Kolom A (Tanggal) secara **Descending (Z-A)** agar data terbaru selalu berada di paling atas. Google membatasi output CSV hanya sampai 2801 baris pertama.

---

## 🛡️ HAK AKSES
- **Owner (surya.ongko@gmail.com)**: Memiliki akses penuh (Input data, Sync, Sharing).
- **Guest**: Hanya bisa melihat data owner jika sudah disetujui (Mode Pemantauan).
