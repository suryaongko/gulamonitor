'use server';

/**
 * @fileOverview Server Action untuk berkomunikasi dengan API LibreLinkUp (Abbott).
 * Dioptimalkan untuk sinkronisasi data dari FreeStyle Libre 3 (Region EU/Jerman).
 */

const LIBRE_LINK_UP_URLS = {
  EU: 'https://api-eu.libreview.io',
  US: 'https://api-us.libreview.io',
  GLOBAL: 'https://api.libreview.io',
};

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'product': 'llu.android',
  'version': '4.12.0',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
};

export async function syncLibreData(credentials: {
  email: string;
  password: string;
  region: 'EU' | 'US' | 'GLOBAL';
}) {
  const baseUrl = LIBRE_LINK_UP_URLS[credentials.region];

  try {
    console.log(`Menghubungi server LibreLinkUp ${credentials.region}...`);

    // 1. Login ke LibreLinkUp
    const loginResponse = await fetch(`${baseUrl}/llu/auth/login`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json().catch(() => ({}));
      throw new Error(errorData?.message || 'Gagal login. Periksa email/password akun Follower Anda.');
    }

    const loginData = await loginResponse.json();
    const token = loginData?.data?.authTicket?.token;

    if (!token) {
      throw new Error('Token otentikasi tidak valid. Silakan coba beberapa saat lagi.');
    }

    // 2. Ambil daftar koneksi (Mencari pasien yang diikuti)
    const connectionsResponse = await fetch(`${baseUrl}/llu/connections`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!connectionsResponse.ok) {
      throw new Error('Gagal mengakses daftar koneksi pasien.');
    }

    const connectionsData = await connectionsResponse.json();
    const connections = connectionsData?.data;

    if (!Array.isArray(connections) || connections.length === 0) {
      throw new Error('Tidak ada pasien ditemukan. Pastikan Anda sudah menerima undangan Follow di app Libre 3 HP pasien.');
    }

    // Cari koneksi pertama yang memiliki ID pasien
    const activeConnection = connections.find(c => c.patientId) || connections[0];
    const patientId = activeConnection.patientId;

    if (!patientId) {
      throw new Error('ID Pasien tidak ditemukan pada akun Follower ini.');
    }

    // 3. Ambil data glukosa (Grafik 24 jam terakhir)
    const glucoseResponse = await fetch(`${baseUrl}/llu/connections/${patientId}/graph`, {
      method: 'GET',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!glucoseResponse.ok) {
      throw new Error('Gagal menarik data grafik glukosa.');
    }

    const glucoseData = await glucoseResponse.json();
    const graphData = glucoseData?.data?.graphData;

    if (!Array.isArray(graphData)) {
      console.log('Tidak ada data grafik yang ditemukan.');
      return [];
    }

    // Map data ke format internal GulaMonitor
    return graphData.map((item: any) => ({
      value: item.Value,
      timestamp: new Date(item.Timestamp).toISOString(),
    }));

  } catch (error: any) {
    console.error('Libre Sync Error:', error);
    throw new Error(error.message || 'Terjadi gangguan koneksi ke server Abbott.');
  }
}
