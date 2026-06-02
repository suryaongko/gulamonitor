'use server';

/**
 * @fileOverview Server Action untuk berkomunikasi dengan Dexcom Share API.
 * Dioptimalkan untuk server Internasional (OUS) guna mendukung pengguna di Jerman.
 */

const DEXCOM_BASE_URL_US = 'https://share1.dexcom.com/ShareWebServices/Services';
const DEXCOM_BASE_URL_OUS = 'https://shareous1.dexcom.com/ShareWebServices/Services';

export async function syncDexcomData(credentials: {
  accountName: string;
  password: string;
  isUS: boolean;
  minutes: number;
}) {
  const baseUrl = credentials.isUS ? DEXCOM_BASE_URL_US : DEXCOM_BASE_URL_OUS;

  try {
    // 1. Login untuk mendapatkan Session ID
    const loginResponse = await fetch(`${baseUrl}/General/LoginPublisherAccountByName`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Dexcom Share/3.0.2.11 CFNetwork/711.2.23 Darwin/14.0.0',
      },
      body: JSON.stringify({
        accountName: credentials.accountName,
        password: credentials.password,
        applicationId: 'd89443d2-327c-4a6f-89e5-496bbb0317db', 
      }),
    });

    if (!loginResponse.ok) {
      throw new Error('Gagal terhubung ke server Dexcom. Periksa koneksi internet Anda.');
    }

    const rawSessionId = await loginResponse.text();
    const sessionId = rawSessionId.replace(/"/g, '').trim();

    if (!sessionId || sessionId.length < 10) {
      // Jika login gagal tapi server OK, biasanya karena kredensial salah atau Share belum aktif
      throw new Error('Login gagal atau fitur "Share" belum diaktifkan di aplikasi Dexcom Anda.');
    }

    // 2. Ambil nilai glukosa terbaru
    const glucoseResponse = await fetch(
      `${baseUrl}/Publisher/ReadPublisherLatestGlucoseValues?sessionId=${sessionId}&minutes=${credentials.minutes}&maxCount=288`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': '0',
          'User-Agent': 'Dexcom Share/3.0.2.11 CFNetwork/711.2.23 Darwin/14.0.0',
        },
      }
    );

    if (!glucoseResponse.ok) {
      throw new Error('Sesi valid tapi gagal mengambil data. Periksa apakah sensor Anda sedang aktif.');
    }

    const data = await glucoseResponse.json();

    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.map((item: any) => {
      const match = item.ST.match(/\d+/);
      const timestampMs = match ? parseInt(match[0]) : Date.now();
      
      return {
        value: item.Value,
        timestamp: new Date(timestampMs).toISOString(),
      };
    });

  } catch (error: any) {
    console.error('Dexcom Sync Error:', error);
    throw new Error(error.message || 'Terjadi kesalahan sistem saat menghubungi Dexcom.');
  }
}
