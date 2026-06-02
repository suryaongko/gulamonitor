'use server';

/**
 * @fileOverview Server Action untuk berkomunikasi dengan Dexcom Share API.
 * Mendukung server US dan Internasional (OUS) untuk pengguna di Jerman/Eropa.
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

  console.log(`Memulai sinkronisasi Dexcom wilayah: ${credentials.isUS ? 'US' : 'Internasional/Jerman'}`);

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
      throw new Error(`Login Dexcom Gagal (${loginResponse.status}): ${errorText || 'Kredensial salah atau akun terkunci.'}`);
    }

    // Ambil text mentah karena Dexcom mengembalikan GUID dalam kutipan (misal: "00000000-0000...")
    const rawSessionId = await loginResponse.text();
    const sessionId = rawSessionId.replace(/"/g, '').trim();

    if (!sessionId || sessionId.length < 10) {
      throw new Error('Gagal mendapatkan ID Sesi yang valid. Periksa apakah fitur Share sudah aktif di app Dexcom.');
    }

    // 2. Ambil nilai glukosa terbaru
    // Parameter minutes menentukan seberapa jauh data yang ditarik (maks 1440 = 24 jam)
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
      throw new Error(`Gagal menarik data glukosa: ${errorText || 'Server Dexcom tidak merespon.'}`);
    }

    const data = await glucoseResponse.json();

    if (!Array.isArray(data)) {
      return [];
    }

    // Map data Dexcom ke format internal kita
    return data.map((item: any) => {
      // Format Dexcom: ST: "/Date(1635330600000)/"
      const match = item.ST.match(/\d+/);
      const timestampMs = match ? parseInt(match[0]) : Date.now();
      
      return {
        value: item.Value,
        timestamp: new Date(timestampMs).toISOString(),
      };
    });

  } catch (error: any) {
    console.error('Dexcom Sync Error:', error);
    throw new Error(error.message || 'Koneksi ke server Dexcom gagal. Pastikan HP Anda terhubung internet dan fitur Share aktif.');
  }
}
