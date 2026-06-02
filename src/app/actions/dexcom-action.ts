
'use server';

/**
 * @fileOverview Server Action untuk berkomunikasi dengan Dexcom Share API.
 * Digunakan untuk bypass CORS dan melindungi komunikasi kredensial.
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
        applicationId: 'd89443d2-327c-4a6f-89e5-496bbb0317db', // Public Dexcom App ID
      }),
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login Dexcom Gagal: ${errorText || loginResponse.statusText}`);
    }

    // Ambil text mentah karena Dexcom sering mengembalikan GUID dalam kutipan, bukan JSON object
    const rawSessionId = await loginResponse.text();
    const sessionId = rawSessionId.replace(/"/g, '').trim();

    if (!sessionId || sessionId.length < 10) {
      throw new Error('ID Sesi Dexcom tidak valid atau akun terkunci.');
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
      const errorText = await glucoseResponse.text();
      throw new Error(`Gagal mengambil data glukosa: ${errorText || glucoseResponse.statusText}`);
    }

    const data = await glucoseResponse.json();

    if (!Array.isArray(data)) {
      return [];
    }

    // Map data Dexcom ke format Reading kita
    // Format Dexcom: { Value: 120, ST: "/Date(1635330600000)/", ... }
    return data.map((item: any) => {
      // Ekstrak angka timestamp dari format /Date(ms)/
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
