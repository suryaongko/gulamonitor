
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
      },
      body: JSON.stringify({
        accountName: credentials.accountName,
        password: credentials.password,
        applicationId: 'd89443d2-327c-4a6f-89e5-496bbb0317db', // Public Dexcom App ID
      }),
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login Dexcom Gagal: ${errorText}`);
    }

    const sessionId = (await loginResponse.json()).replace(/"/g, '');

    // 2. Ambil nilai glukosa terbaru
    const glucoseResponse = await fetch(
      `${baseUrl}/Publisher/ReadPublisherLatestGlucoseValues?sessionId=${sessionId}&minutes=${credentials.minutes}&maxCount=288`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': '0',
        },
      }
    );

    if (!glucoseResponse.ok) {
      throw new Error('Gagal mengambil data glukosa dari Dexcom.');
    }

    const data = await glucoseResponse.json();

    // Map data Dexcom ke format Reading kita
    // Format Dexcom: { Value: 120, ST: "/Date(1635330600000)/", ... }
    return data.map((item: any) => {
      const timestampMs = parseInt(item.ST.match(/\d+/)[0]);
      return {
        value: item.Value,
        timestamp: new Date(timestampMs).toISOString(),
      };
    });

  } catch (error: any) {
    console.error('Dexcom Sync Error:', error);
    throw new Error(error.message || 'Terjadi kesalahan saat sinkronisasi Dexcom.');
  }
}
